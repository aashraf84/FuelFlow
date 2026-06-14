'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowLeftRight, Network, Cable, FileText, RefreshCw,
  Activity, Send, Inbox, AlertTriangle, Clock, CheckCircle2,
  XCircle, Wifi, WifiOff, Radio, Cpu, Server, Signal,
  Gauge, Zap, ArrowUpDown, Search, ChevronRight, Loader2,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { useAppStore } from '@/stores/app-store'

// ── Types ──────────────────────────────────────

interface CommProtocolAPI {
  id: string
  name: string
  protocolType: string | null
  transportType: string | null
  version: string | null
  description: string | null
  isActive: boolean
  configJson: string | null
  connections: CommConnectionAPI[]
  createdAt: string
  updatedAt: string
}

interface CommConnectionAPI {
  id: string
  name: string
  connectionState: string
  host: string | null
  port: number | null
  deviceType: string | null
  protocolId: string
  protocol: {
    id: string
    name: string
    protocolType: string | null
    transportType: string | null
  }
  sentMessages: number | null
  receivedMessages: number | null
  errorCount: number | null
  latencyMs: number | null
  lastConnectedAt: string | null
  lastMessageAt: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface CommLogAPI {
  id: string
  direction: string
  messageType: string
  deviceId: string | null
  connectionId: string | null
  protocolId: string | null
  isSuccess: boolean
  durationMs: number | null
  data: string | null
  severity: string
  createdAt: string
}

interface OverviewData {
  protocolsConfigured: number
  activeConnections: number
  messagesToday: number
  errorRate: string
}

// ── Helpers ──────────────────────────────────────

const STATE_MAP: Record<string, { dot: string; text: string; badge: string }> = {
  connected: { dot: 'macos-status-online', text: 'text-emerald-600 dark:text-emerald-400', badge: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
  disconnected: { dot: 'macos-status-offline', text: 'text-muted-foreground', badge: 'bg-slate-500/10 text-slate-500 border-slate-500/20' },
  timeout: { dot: 'macos-status-error', text: 'text-red-600 dark:text-red-400', badge: 'bg-red-500/10 text-red-600 border-red-500/20' },
  error: { dot: 'macos-status-error', text: 'text-red-600 dark:text-red-400', badge: 'bg-red-500/10 text-red-600 border-red-500/20' },
}

const SEVERITY_MAP: Record<string, { color: string; badge: string }> = {
  info: { color: 'text-muted-foreground', badge: 'bg-slate-500/10 text-slate-500 border-slate-500/20' },
  warning: { color: 'text-teal-600 dark:text-teal-400', badge: 'bg-teal-500/10 text-teal-600 border-teal-500/20' },
  error: { color: 'text-red-600 dark:text-red-400', badge: 'bg-red-500/10 text-red-600 border-red-500/20' },
}

const DIR_MAP: Record<string, { icon: React.ElementType; badge: string }> = {
  inbound: { icon: Inbox, badge: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
  outbound: { icon: Send, badge: 'bg-teal-500/10 text-teal-600 border-teal-500/20' },
}

const TYPE_MAP: Record<string, string> = {
  command: 'bg-teal-500/10 text-teal-600 border-teal-500/20',
  request: 'bg-sky-500/10 text-sky-600 border-sky-500/20',
  response: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  event: 'bg-teal-500/10 text-teal-600 border-teal-500/20',
  heartbeat: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
}

const PROTOCOL_ICONS: Record<string, React.ElementType> = {
  tcp: Network,
  tcpip: Network,
  rs232: Cable,
  rs485: ArrowLeftRight,
  mqtt: Radio,
  http: Server,
  websocket: Signal,
}

function getProtocolIcon(transport: string | null): React.ElementType {
  if (!transport) return Network
  const lower = transport.toLowerCase()
  for (const [key, icon] of Object.entries(PROTOCOL_ICONS)) {
    if (lower.includes(key)) return icon
  }
  return Network
}

const PROTOCOL_COLORS = ['#e8930c', '#34c759', '#ff9f0a', '#bf5af2', '#ff375f', '#64d2ff', '#ffd60a', '#30d158']

function timeAgo(date: Date | string | null): string {
  if (!date) return 'N/A'
  const d = typeof date === 'string' ? new Date(date) : date
  const diff = Date.now() - d.getTime()
  if (diff < 60000) return 'just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  return `${Math.floor(diff / 86400000)}d ago`
}

function formatTimestamp(date: Date | string | null): string {
  if (!date) return 'N/A'
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-muted ${className ?? ''}`} />
}

// ── Component ──────────────────────────────────────

export default function CommsLayerModule() {
  const [activeTab, setActiveTab] = useState('overview')

  // Data states
  const [overview, setOverview] = useState<OverviewData | null>(null)
  const [protocols, setProtocols] = useState<CommProtocolAPI[]>([])
  const [connections, setConnections] = useState<CommConnectionAPI[]>([])
  const [commLogs, setCommLogs] = useState<CommLogAPI[]>([])

  // Loading / error
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [overviewRes, protocolsRes, connectionsRes, logsRes] = await Promise.allSettled([
        fetch('/api/comms'),
        fetch('/api/comms?section=protocols'),
        fetch('/api/comms?section=connections'),
        fetch('/api/comms?section=logs'),
      ])

      if (overviewRes.status === 'fulfilled') {
        const data = await overviewRes.value.json()
        setOverview(data.overview || null)
      }

      if (protocolsRes.status === 'fulfilled') {
        const data = await protocolsRes.value.json()
        setProtocols(data.protocols || [])
      }

      if (connectionsRes.status === 'fulfilled') {
        const data = await connectionsRes.value.json()
        setConnections(data.connections || [])
      }

      if (logsRes.status === 'fulfilled') {
        const data = await logsRes.value.json()
        setCommLogs(data.logs || [])
      }
    } catch (err) {
      console.error('CommsLayer fetchData error:', err)
      setError(err instanceof Error ? err.message : 'Failed to load comms data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Build bandwidth data from logs (by hour)
  const bandwidthData = (() => {
    if (commLogs.length === 0) return []
    const hourMap: Record<string, { inbound: number; outbound: number }> = {}
    for (const log of commLogs) {
      const date = new Date(log.createdAt)
      const hour = `${String(date.getHours()).padStart(2, '0')}:00`
      if (!hourMap[hour]) hourMap[hour] = { inbound: 0, outbound: 0 }
      if (log.direction === 'inbound') hourMap[hour].inbound++
      else if (log.direction === 'outbound') hourMap[hour].outbound++
    }
    // Sort by hour
    return Object.entries(hourMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([hour, data]) => ({ hour, ...data }))
  })()

  // ── Loading state ──
  if (loading) {
    return (
      <div className="space-y-4" style={{ fontStretch: 'normal' }}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="macos-card p-4">
              <Skeleton className="h-4 w-16 mb-2" />
              <Skeleton className="h-8 w-12" />
            </div>
          ))}
        </div>
        <div className="macos-card p-4 flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          <span className="text-[13px]">Loading communications data from database…</span>
        </div>
      </div>
    )
  }

  // ── Error state ──
  if (error) {
    return (
      <div className="macos-card p-6 text-center" style={{ fontStretch: 'normal' }}>
        <AlertTriangle className="size-8 text-red-500 mx-auto mb-3" />
        <p className="text-[14px] font-semibold mb-1">Failed to Load Comms Data</p>
        <p className="text-[12px] text-muted-foreground mb-4">{error}</p>
        <button onClick={fetchData} className="macos-btn text-[12px] px-4 py-1.5 flex items-center gap-2 mx-auto">
          <RefreshCw className="size-3.5" /> Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4" style={{ fontStretch: 'normal' }}>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="overflow-x-auto pb-1">
          <TabsList className="h-8 w-max gap-0.5 bg-muted/50">
            <TabsTrigger value="overview" className="text-[11px] px-3 h-6 data-[state=active]:bg-teal-500/15 data-[state=active]:text-teal-600">Overview</TabsTrigger>
            <TabsTrigger value="protocols" className="text-[11px] px-3 h-6 data-[state=active]:bg-teal-500/15 data-[state=active]:text-teal-600">Protocols</TabsTrigger>
            <TabsTrigger value="connections" className="text-[11px] px-3 h-6 data-[state=active]:bg-teal-500/15 data-[state=active]:text-teal-600">Connections</TabsTrigger>
            <TabsTrigger value="logs" className="text-[11px] px-3 h-6 data-[state=active]:bg-teal-500/15 data-[state=active]:text-teal-600">Logs</TabsTrigger>
            <TabsTrigger value="metrics" className="text-[11px] px-3 h-6 data-[state=active]:bg-teal-500/15 data-[state=active]:text-teal-600">Metrics</TabsTrigger>
          </TabsList>
        </div>

        {/* ── Overview ── */}
        <TabsContent value="overview" className="mt-4 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Protocols', value: overview?.protocolsConfigured ?? protocols.length, icon: Network, accent: '#e8930c' },
              { label: 'Active Connections', value: overview?.activeConnections ?? connections.filter(c => c.connectionState === 'connected').length, icon: Wifi, accent: '#34c759' },
              { label: 'Messages Today', value: overview?.messagesToday ?? commLogs.length, icon: Activity, accent: '#ff9f0a' },
              { label: 'Error Rate', value: overview?.errorRate ?? '0%', icon: AlertTriangle, accent: '#34c759' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="macos-card p-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">{stat.label}</p>
                    <p className="text-2xl font-bold mt-0.5" style={{ color: stat.accent }}>{typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}</p>
                  </div>
                  <div className="size-9 rounded-[10px] flex items-center justify-center" style={{ backgroundColor: `${stat.accent}12` }}>
                    <stat.icon className="size-4" style={{ color: stat.accent }} />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Protocol Cards */}
          <div className="flex items-center justify-between">
            <div className="macos-section-header">Protocol Status</div>
            <button onClick={fetchData} className="macos-btn-secondary text-[11px] px-2.5 py-1 flex items-center gap-1">
              <RefreshCw className="size-3" /> Refresh
            </button>
          </div>
          {protocols.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {protocols.map((proto, i) => {
                const color = PROTOCOL_COLORS[i % PROTOCOL_COLORS.length]
                const ProtoIcon = getProtocolIcon(proto.transportType)
                const connCount = proto.connections?.length || 0
                const isActive = proto.isActive
                return (
                  <motion.div
                    key={proto.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="macos-card p-4"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="size-8 rounded-[10px] flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
                        <ProtoIcon className="size-4" style={{ color }} />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className={`macos-status-dot ${isActive ? 'macos-status-online' : 'macos-status-offline'}`} />
                        <span className={`text-[10px] font-medium ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}>
                          {isActive ? 'Online' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                    <h3 className="text-[13px] font-semibold">{proto.name}</h3>
                    <div className="mt-2 space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-muted-foreground">Connections</span>
                        <span className="font-medium">{connCount}</span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-muted-foreground">Transport</span>
                        <span className="font-medium">{proto.transportType || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-muted-foreground">Version</span>
                        <span className="font-medium">{proto.version || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-muted-foreground">Status</span>
                        <span className={`font-medium ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}>
                          {isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          ) : (
            <div className="macos-card p-6 text-center text-[13px] text-muted-foreground">
              No communication protocols configured
            </div>
          )}
        </TabsContent>

        {/* ── Protocols Detail ── */}
        <TabsContent value="protocols" className="mt-4 space-y-3">
          <div className="macos-section-header">Communication Protocols Detail</div>
          {protocols.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {protocols.map((proto, i) => {
                const color = PROTOCOL_COLORS[i % PROTOCOL_COLORS.length]
                const ProtoIcon = getProtocolIcon(proto.transportType)
                const connCount = proto.connections?.length || 0
                const errorConns = proto.connections?.filter(c => c.connectionState === 'error' || c.connectionState === 'timeout').length || 0
                return (
                  <div key={proto.id} className="macos-card p-5">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="size-10 rounded-[10px] flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
                        <ProtoIcon className="size-5" style={{ color }} />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-[13px] font-semibold">{proto.name}</h3>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <div className={`macos-status-dot ${proto.isActive ? 'macos-status-online' : 'macos-status-offline'}`} />
                          <span className={`text-[11px] font-medium ${proto.isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}>
                            {proto.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="macos-group">
                      <div className="macos-group-item">
                        <div className="flex justify-between text-[12px]">
                          <span className="text-muted-foreground">Type</span>
                          <span className="font-medium">{proto.protocolType || 'N/A'}</span>
                        </div>
                      </div>
                      <div className="macos-group-item">
                        <div className="flex justify-between text-[12px]">
                          <span className="text-muted-foreground">Transport</span>
                          <span className="font-mono">{proto.transportType || 'N/A'}</span>
                        </div>
                      </div>
                      <div className="macos-group-item">
                        <div className="flex justify-between text-[12px]">
                          <span className="text-muted-foreground">Version</span>
                          <span className="font-mono">{proto.version || 'N/A'}</span>
                        </div>
                      </div>
                      <div className="macos-group-item">
                        <div className="flex justify-between text-[12px]">
                          <span className="text-muted-foreground">Connections</span>
                          <span className="font-semibold text-teal-600 dark:text-teal-400">{connCount}</span>
                        </div>
                      </div>
                      {errorConns > 0 && (
                        <div className="macos-group-item">
                          <div className="flex justify-between text-[12px]">
                            <span className="text-muted-foreground">Error Connections</span>
                            <span className="font-medium text-red-600 dark:text-red-400">{errorConns}</span>
                          </div>
                        </div>
                      )}
                      {proto.description && (
                        <div className="macos-group-item">
                          <div className="flex justify-between text-[12px]">
                            <span className="text-muted-foreground">Description</span>
                            <span className="max-w-[200px] truncate">{proto.description}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="macos-card p-6 text-center text-[13px] text-muted-foreground">
              No communication protocols configured
            </div>
          )}
        </TabsContent>

        {/* ── Active Connections ── */}
        <TabsContent value="connections" className="mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="macos-section-header">Active Connections</div>
            <button onClick={fetchData} className="macos-btn-secondary text-[11px] px-2.5 py-1 flex items-center gap-1">
              <RefreshCw className="size-3" /> Refresh
            </button>
          </div>
          <div className="macos-card overflow-hidden">
            <div className="max-h-[440px] overflow-y-auto">
              <table className="macos-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Protocol</th>
                    <th>Host</th>
                    <th>State</th>
                    <th>Messages</th>
                    <th>Errors</th>
                    <th>Latency</th>
                    <th>Last Msg</th>
                  </tr>
                </thead>
                <tbody>
                  {connections.length > 0 ? connections.map(conn => {
                    const st = STATE_MAP[conn.connectionState] || STATE_MAP.disconnected
                    const sent = conn.sentMessages || 0
                    const received = conn.receivedMessages || 0
                    const errs = conn.errorCount || 0
                    const latency = conn.latencyMs || 0
                    return (
                      <tr key={conn.id}>
                        <td className="text-[13px] font-medium">{conn.name}</td>
                        <td className="text-[11px] font-mono text-muted-foreground">
                          {conn.protocol?.name || 'N/A'}{conn.protocol?.transportType ? ` / ${conn.protocol.transportType}` : ''}
                        </td>
                        <td className="text-[11px] font-mono text-muted-foreground">
                          {conn.host || 'N/A'}{conn.port ? `:${conn.port}` : ''}
                        </td>
                        <td>
                          <div className="flex items-center gap-1.5">
                            <div className={`macos-status-dot ${st.dot}`} />
                            <span className={`text-[11px] font-medium capitalize ${st.text}`}>{conn.connectionState}</span>
                          </div>
                        </td>
                        <td className="text-[12px]">
                          <span className="text-teal-600 dark:text-teal-400">↑{sent.toLocaleString()}</span>
                          <span className="text-muted-foreground mx-0.5">/</span>
                          <span className="text-emerald-600 dark:text-emerald-400">↓{received.toLocaleString()}</span>
                        </td>
                        <td className="text-[12px]">
                          <span className={errs > 10 ? 'text-red-600 dark:text-red-400 font-medium' : 'text-muted-foreground'}>{errs}</span>
                        </td>
                        <td className="text-[12px]">
                          <span className={latency > 1000 ? 'text-red-600 dark:text-red-400 font-medium' : latency > 50 ? 'text-teal-600 dark:text-teal-400' : 'text-muted-foreground'}>
                            {latency}ms
                          </span>
                        </td>
                        <td className="text-[11px] text-muted-foreground whitespace-nowrap">{timeAgo(conn.lastMessageAt)}</td>
                      </tr>
                    )
                  }) : (
                    <tr>
                      <td colSpan={8} className="text-center text-[13px] text-muted-foreground py-8">No connections found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* ── Communication Logs ── */}
        <TabsContent value="logs" className="mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="macos-section-header">Communication Logs</div>
            <button className="macos-btn-secondary text-[11px] px-2.5 py-1 flex items-center gap-1">
              <FileText className="size-3" /> Export
            </button>
          </div>
          <div className="macos-card overflow-hidden">
            <div className="max-h-[440px] overflow-y-auto">
              <table className="macos-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Direction</th>
                    <th>Type</th>
                    <th>Device</th>
                    <th>Success</th>
                    <th>Duration</th>
                    <th>Data</th>
                  </tr>
                </thead>
                <tbody>
                  {commLogs.length > 0 ? commLogs.map(log => {
                    const dir = DIR_MAP[log.direction] || DIR_MAP.inbound
                    const DirIcon = dir?.icon || Inbox
                    return (
                      <tr key={log.id}>
                        <td className="text-[11px] font-mono text-muted-foreground whitespace-nowrap">{formatTimestamp(log.createdAt)}</td>
                        <td>
                          <div className="flex items-center gap-1">
                            <DirIcon className="size-2.5" />
                            <Badge variant="outline" className={`text-[9px] px-1.5 py-0 ${dir?.badge}`}>
                              {log.direction}
                            </Badge>
                          </div>
                        </td>
                        <td>
                          <Badge variant="outline" className={`text-[9px] px-1.5 py-0 ${TYPE_MAP[log.messageType] || ''}`}>
                            {log.messageType}
                          </Badge>
                        </td>
                        <td className="text-[12px] font-mono font-medium text-teal-600 dark:text-teal-400">{log.deviceId || 'N/A'}</td>
                        <td>
                          {log.isSuccess
                            ? <CheckCircle2 className="size-3.5 text-emerald-500" />
                            : <XCircle className="size-3.5 text-red-500" />
                          }
                        </td>
                        <td className="text-[12px] text-muted-foreground">
                          <span className={log.durationMs && log.durationMs > 5000 ? 'text-red-600 dark:text-red-400 font-medium' : ''}>
                            {log.durationMs ?? '—'}ms
                          </span>
                        </td>
                        <td className="text-[11px] max-w-[220px] truncate font-mono text-muted-foreground">{log.data || '—'}</td>
                      </tr>
                    )
                  }) : (
                    <tr>
                      <td colSpan={7} className="text-center text-[13px] text-muted-foreground py-8">No communication logs found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* ── Metrics / Bandwidth ── */}
        <TabsContent value="metrics" className="mt-4 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Total Protocols', value: protocols.length.toString(), icon: Gauge, accent: '#e8930c' },
              { label: 'Avg Latency', value: connections.length > 0 ? `${Math.round(connections.reduce((s, c) => s + (c.latencyMs || 0), 0) / connections.length)}ms` : '0ms', icon: Zap, accent: '#34c759' },
              { label: 'Error Rate', value: overview?.errorRate ?? '0%', icon: AlertTriangle, accent: '#34c759' },
              { label: 'Active Streams', value: connections.filter(c => c.connectionState === 'connected').length.toString(), icon: Signal, accent: '#ff9f0a' },
            ].map((stat) => (
              <div key={stat.label} className="macos-card p-4">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">{stat.label}</p>
                <p className="text-xl font-bold mt-0.5" style={{ color: stat.accent }}>{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="macos-section-header">Message Activity</div>
          {bandwidthData.length > 0 ? (
            <div className="macos-card p-4">
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={bandwidthData}>
                    <defs>
                      <linearGradient id="inboundGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#34c759" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#34c759" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="outboundGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#e8930c" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#e8930c" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="hour" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} width={40} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--card)',
                        border: '0.5px solid var(--border)',
                        borderRadius: '8px',
                        fontSize: '12px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                      }}
                      labelStyle={{ color: 'var(--foreground)', fontWeight: 600, fontSize: '11px' }}
                    />
                    <Area type="monotone" dataKey="inbound" stroke="#34c759" fill="url(#inboundGrad)" strokeWidth={1.5} name="Inbound" />
                    <Area type="monotone" dataKey="outbound" stroke="#e8930c" fill="url(#outboundGrad)" strokeWidth={1.5} name="Outbound" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div className="macos-card p-6 text-center text-[13px] text-muted-foreground">
              No message activity data available yet
            </div>
          )}

          {/* Connection Health */}
          <div className="macos-section-header">Connection Health</div>
          {connections.length > 0 ? (
            <div className="macos-group">
              {connections.slice(0, 5).map(conn => {
                const st = STATE_MAP[conn.connectionState] || STATE_MAP.disconnected
                const latency = conn.latencyMs || 0
                const healthPct = conn.connectionState === 'connected' ? Math.max(0, 100 - latency) : conn.connectionState === 'timeout' ? 15 : 0
                return (
                  <div key={conn.id} className="macos-group-item flex items-center gap-3">
                    <div className={`macos-status-dot ${st.dot}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-[13px] font-medium">{conn.name}</span>
                        <span className="text-[11px] text-muted-foreground">{latency}ms</span>
                      </div>
                      <div className="mt-1.5 w-full h-1 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${healthPct}%`,
                            backgroundColor: healthPct > 80 ? '#34c759' : healthPct > 50 ? '#ff9f0a' : '#ff3b30'
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="macos-card p-6 text-center text-[13px] text-muted-foreground">
              No active connections to display
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
