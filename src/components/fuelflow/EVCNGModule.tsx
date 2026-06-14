'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Zap,
  Fuel,
  Battery,
  Gauge,
  Activity,
  AlertTriangle,
  Plug,
  Cpu,
  Clock,
  DollarSign,
  ArrowUpRight,
  Thermometer,
  Cylinder,
  Power,
  Wind,
  CheckCircle2,
  XCircle,
  RefreshCw,
  BarChart3,
  Loader2,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import { useAppStore } from '@/stores/app-store'

// ── Types ──────────────────────────────────────────────

interface EVChargerAPI {
  id: string
  name: string
  code: string
  connectorType: string
  maxPowerKw: number
  status: string
  isActive: boolean
  currentSession?: string | null
  station: { id: string; name: string; code: string; city?: string }
  recentSessions: Array<{
    id: string
    vehiclePlate: string | null
    energyKwh: number
    durationMinutes: number | null
    pricePerKwh: number
    totalAmount: number
    startedAt: string
    socStart: number | null
    socCurrent: number | null
    status: string
  }>
  totalSessions: number
  totalRevenue: number
  totalEnergy: number
  createdAt: string
  updatedAt: string
}

interface ChargingSessionAPI {
  id: string
  evChargerId: string
  vehiclePlate: string | null
  energyKwh: number
  durationMinutes: number | null
  pricePerKwh: number
  totalAmount: number
  startedAt: string
  endedAt: string | null
  socStart: number | null
  socCurrent: number | null
  status: string
  evCharger: { name: string; code: string; connectorType: string }
}

interface CNGDispenserAPI {
  id: string
  name: string
  code: string
  pressure: number
  status: string
  isActive: boolean
  station: { id: string; name: string; code: string; city?: string }
  createdAt: string
  updatedAt: string
}

interface EVCSummary {
  total: number
  available: number
  charging: number
  occupied: number
  offline: number
  error: number
  totalRevenue: number
  totalEnergyDispensed: number
}

interface CNGSummary {
  total: number
  idle: number
  dispensing: number
  stopped: number
  error: number
}

interface ChargingSummary {
  totalSessions: number
  activeSessions: number
  completedSessions: number
  totalRevenue: number
  totalEnergyKwh: number
}

// ── Config Maps ──────────────────────────────────────────

const chargerStatusConfig: Record<string, { label: string; dot: string; color: string; bg: string }> = {
  available: { label: 'Available', dot: 'macos-status-online', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  charging: { label: 'Charging', dot: 'macos-status-warning', color: 'text-teal-500', bg: 'bg-teal-500/10' },
  occupied: { label: 'Occupied', dot: 'macos-status-warning', color: 'text-orange-500', bg: 'bg-orange-500/10' },
  offline: { label: 'Offline', dot: 'macos-status-offline', color: 'text-slate-400', bg: 'bg-slate-500/10' },
  error: { label: 'Error', dot: 'macos-status-error', color: 'text-red-500', bg: 'bg-red-500/10' },
}

const cngStatusConfig: Record<string, { label: string; dot: string; color: string; bg: string }> = {
  dispensing: { label: 'Dispensing', dot: 'macos-status-warning', color: 'text-teal-500', bg: 'bg-teal-500/10' },
  idle: { label: 'Idle', dot: 'macos-status-online', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  stopped: { label: 'Stopped', dot: 'macos-status-offline', color: 'text-slate-400', bg: 'bg-slate-500/10' },
  error: { label: 'Error', dot: 'macos-status-error', color: 'text-red-500', bg: 'bg-red-500/10' },
}

// ── Helpers ──────────────────────────────────────────────

function formatPKR(amount: number): string {
  if (amount >= 1000000) return `PKR ${(amount / 1000000).toFixed(2)}M`
  if (amount >= 1000) return `PKR ${(amount / 1000).toFixed(0)}K`
  return `PKR ${amount.toLocaleString()}`
}

const fadeUp = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] },
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-muted ${className ?? ''}`} />
}

// ── Component ────────────────────────────────────────────

export default function EVCNGModule() {
  const [activeTab, setActiveTab] = useState<'ev' | 'sessions' | 'cng' | 'revenue'>('ev')

  // Data states
  const [evChargers, setEvChargers] = useState<EVChargerAPI[]>([])
  const [chargingSessions, setChargingSessions] = useState<ChargingSessionAPI[]>([])
  const [cngDispensers, setCngDispensers] = useState<CNGDispenserAPI[]>([])
  const [evSummary, setEvSummary] = useState<EVCSummary | null>(null)
  const [cngSummary, setCngSummary] = useState<CNGSummary | null>(null)
  const [chargingSummary, setChargingSummary] = useState<ChargingSummary | null>(null)

  // Loading / error
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [evCngRes, sessionsRes] = await Promise.allSettled([
        fetch('/api/ev-cng'),
        fetch('/api/charging-sessions'),
      ])

      if (evCngRes.status === 'fulfilled') {
        const data = await evCngRes.value.json()
        setEvChargers(data.evChargers || [])
        setCngDispensers(data.cngDispensers || [])
        setChargingSessions(data.chargingSessions || [])
        if (data.summary) {
          setEvSummary(data.summary.ev || null)
          setCngSummary(data.summary.cng || null)
          setChargingSummary(data.summary.charging || null)
        }
      }

      if (sessionsRes.status === 'fulfilled') {
        const data = await sessionsRes.value.json()
        // Only use if ev-cng didn't return sessions, or merge
        if (evCngRes.status !== 'fulfilled' || (data.sessions && data.sessions.length > 0)) {
          setChargingSessions(data.sessions || [])
        }
      }
    } catch (err) {
      console.error('EVCNG fetchData error:', err)
      setError(err instanceof Error ? err.message : 'Failed to load EV/CNG data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Compute revenue data from charging sessions
  const revenueData = (() => {
    if (!chargingSessions.length) return []
    const monthMap: Record<string, { ev: number; cng: number }> = {}
    for (const s of chargingSessions) {
      const date = new Date(s.startedAt)
      const key = date.toLocaleString('en', { month: 'short' })
      if (!monthMap[key]) monthMap[key] = { ev: 0, cng: 0 }
      monthMap[key].ev += s.totalAmount || 0
    }
    return Object.entries(monthMap).map(([month, data]) => ({
      month,
      ev: Math.round(data.ev),
      cng: Math.round(data.cng),
    }))
  })()

  const totalEVCRevenue = evSummary?.totalRevenue || revenueData.reduce((s, d) => s + d.ev, 0)
  const totalCNGRevenue = revenueData.reduce((s, d) => s + d.cng, 0)

  const tabs = [
    { key: 'ev' as const, label: 'EV Chargers' },
    { key: 'sessions' as const, label: 'Sessions' },
    { key: 'cng' as const, label: 'CNG' },
    { key: 'revenue' as const, label: 'Revenue' },
  ]

  // ── Loading state ──
  if (loading) {
    return (
      <div className="space-y-5" style={{ fontStretch: 'normal' }}>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="macos-card p-3 text-center">
              <Skeleton className="h-6 w-8 mx-auto mb-1" />
              <Skeleton className="h-3 w-12 mx-auto" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="macos-card p-4">
              <Skeleton className="h-4 w-24 mb-3" />
              <Skeleton className="h-3 w-32 mb-2" />
              <Skeleton className="h-3 w-20" />
            </div>
          ))}
        </div>
        <div className="macos-card p-4 flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          <span className="text-[13px]">Loading EV/CNG data from database…</span>
        </div>
      </div>
    )
  }

  // ── Error state ──
  if (error) {
    return (
      <div className="macos-card p-6 text-center" style={{ fontStretch: 'normal' }}>
        <AlertTriangle className="size-8 text-red-500 mx-auto mb-3" />
        <p className="text-[14px] font-semibold mb-1">Failed to Load EV/CNG Data</p>
        <p className="text-[12px] text-muted-foreground mb-4">{error}</p>
        <button onClick={fetchData} className="macos-btn text-[12px] px-4 py-1.5 flex items-center gap-2 mx-auto">
          <RefreshCw className="size-3.5" /> Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-5" style={{ fontStretch: 'normal' }}>
      {/* Tab Bar */}
      <div className="flex items-center gap-1 rounded-xl bg-black/[0.03] dark:bg-white/[0.04] p-1 w-fit overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-150 whitespace-nowrap ${
              activeTab === tab.key
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* ── EV Chargers Tab ── */}
        {activeTab === 'ev' && (
          <motion.div key="ev" {...fadeUp} className="space-y-5">
            {/* EV Summary Row */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {[
                { label: 'Total', value: evSummary?.total ?? evChargers.length, color: '' },
                { label: 'Available', value: evSummary?.available ?? evChargers.filter(c => c.status === 'available').length, color: 'text-emerald-500' },
                { label: 'Charging', value: evSummary?.charging ?? evChargers.filter(c => c.status === 'charging').length, color: 'text-teal-500' },
                { label: 'Occupied', value: evSummary?.occupied ?? evChargers.filter(c => c.status === 'occupied').length, color: 'text-orange-500' },
                { label: 'Offline', value: evSummary?.offline ?? evChargers.filter(c => c.status === 'offline').length, color: 'text-slate-400' },
                { label: 'Error', value: evSummary?.error ?? evChargers.filter(c => c.status === 'error').length, color: 'text-red-500' },
              ].map((item) => (
                <div key={item.label} className="macos-card p-3 text-center">
                  <p className={`text-[18px] font-bold ${item.color}`}>{item.value}</p>
                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{item.label}</p>
                </div>
              ))}
            </div>

            {/* Charger Grid */}
            {evChargers.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {evChargers.map((charger, i) => {
                  const cfg = chargerStatusConfig[charger.status] || chargerStatusConfig.offline
                  const activeSession = charger.recentSessions?.find(s => s.status === 'active')
                  return (
                    <motion.div
                      key={charger.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04, duration: 0.25 }}
                      className="macos-card p-4"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Zap className={`size-4 ${cfg.color} ${charger.status === 'charging' ? 'animate-pulse' : ''}`} />
                          <h4 className="text-[13px] font-semibold">{charger.name}</h4>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className={`macos-status-dot ${cfg.dot}`} />
                          <span className={`text-[11px] font-medium ${cfg.color}`}>{cfg.label}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[12px] mb-3">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Plug className="size-3" />
                          <span>{charger.connectorType}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Battery className="size-3" />
                          <span>{charger.maxPowerKw} kW</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-muted-foreground col-span-2">
                          <Cpu className="size-3" />
                          <span>{charger.station?.name || 'Unknown Station'}</span>
                        </div>
                      </div>

                      {/* Active Session */}
                      {activeSession && (
                        <div className="rounded-xl bg-teal-500/5 border border-teal-500/10 p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-teal-600 dark:text-teal-400 uppercase tracking-wider">Active Session</span>
                            <span className="text-[11px] text-muted-foreground">
                              {new Date(activeSession.startedAt).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[12px]">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Vehicle</span>
                              <span className="font-mono font-medium">{activeSession.vehiclePlate || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Energy</span>
                              <span className="font-medium">{activeSession.energyKwh.toFixed(1)} kWh</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">SoC</span>
                              <span className="font-medium">
                                {activeSession.socStart ?? '?'}% → {activeSession.socCurrent ?? '?'}%
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Amount</span>
                              <span className="font-semibold text-teal-600 dark:text-teal-400">{formatPKR(activeSession.totalAmount)}</span>
                            </div>
                          </div>
                          {/* SoC Progress */}
                          {activeSession.socCurrent != null && (
                            <div className="space-y-1">
                              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-teal-500 transition-all"
                                  style={{ width: `${activeSession.socCurrent}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </motion.div>
                  )
                })}
              </div>
            ) : (
              <div className="macos-card p-6 text-center text-[13px] text-muted-foreground">
                No EV chargers configured
              </div>
            )}
          </motion.div>
        )}

        {/* ── Sessions Tab ── */}
        {activeTab === 'sessions' && (
          <motion.div key="sessions" {...fadeUp} className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="size-4 text-teal-500" />
                <h3 className="text-[13px] font-semibold">Charging Sessions</h3>
                <Badge variant="outline" className="text-[11px] px-2 py-0.5">
                  {chargingSessions.filter(s => s.status === 'active').length} active
                </Badge>
              </div>
              <button onClick={fetchData} className="macos-btn-secondary text-[11px] px-2.5 py-1 flex items-center gap-1">
                <RefreshCw className="size-3" /> Refresh
              </button>
            </div>

            <div className="macos-card overflow-hidden">
              <ScrollArea className="max-h-[500px]">
                <table className="macos-table">
                  <thead>
                    <tr>
                      <th>Charger</th>
                      <th>Vehicle</th>
                      <th className="text-right">Energy (kWh)</th>
                      <th className="text-right">Duration</th>
                      <th className="text-right">Amount</th>
                      <th>Status</th>
                      <th>Started</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chargingSessions.length > 0 ? chargingSessions.map((session) => (
                      <tr key={session.id}>
                        <td className="text-[13px] font-medium">{session.evCharger?.name || session.evChargerId}</td>
                        <td className="text-[13px] font-mono">{session.vehiclePlate || 'N/A'}</td>
                        <td className="text-right text-[13px] tabular-nums">{session.energyKwh.toFixed(1)}</td>
                        <td className="text-right text-[13px] tabular-nums">{session.durationMinutes ?? '—'} min</td>
                        <td className="text-right text-[13px] font-medium tabular-nums">{formatPKR(session.totalAmount)}</td>
                        <td>
                          <div className="flex items-center gap-1.5">
                            <div className={`macos-status-dot ${session.status === 'active' ? 'macos-status-warning' : session.status === 'completed' ? 'macos-status-online' : 'macos-status-offline'}`} />
                            <span className={`text-[11px] font-medium capitalize ${
                              session.status === 'active' ? 'text-teal-500' :
                              session.status === 'completed' ? 'text-emerald-500' :
                              'text-muted-foreground'
                            }`}>
                              {session.status}
                            </span>
                          </div>
                        </td>
                        <td className="text-[12px] text-muted-foreground">
                          {new Date(session.startedAt).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={7} className="text-center text-[13px] text-muted-foreground py-8">No charging sessions found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </ScrollArea>
            </div>
          </motion.div>
        )}

        {/* ── CNG Tab ── */}
        {activeTab === 'cng' && (
          <motion.div key="cng" {...fadeUp} className="space-y-5">
            {/* CNG Summary */}
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
              {[
                { label: 'Total', value: cngSummary?.total ?? cngDispensers.length, color: '' },
                { label: 'Dispensing', value: cngSummary?.dispensing ?? cngDispensers.filter(d => d.status === 'dispensing').length, color: 'text-teal-500' },
                { label: 'Idle', value: cngSummary?.idle ?? cngDispensers.filter(d => d.status === 'idle').length, color: 'text-emerald-500' },
                { label: 'Stopped', value: cngSummary?.stopped ?? cngDispensers.filter(d => d.status === 'stopped').length, color: 'text-slate-400' },
                { label: 'Error', value: cngSummary?.error ?? cngDispensers.filter(d => d.status === 'error').length, color: 'text-red-500' },
              ].map((item) => (
                <div key={item.label} className="macos-card p-3 text-center">
                  <p className={`text-[18px] font-bold ${item.color}`}>{item.value}</p>
                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{item.label}</p>
                </div>
              ))}
            </div>

            {/* CNG Dispensers */}
            <div>
              <div className="macos-section-header flex items-center gap-2 px-0">
                <Fuel className="size-3 text-teal-500" />
                CNG Dispensers
              </div>
              {cngDispensers.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
                  {cngDispensers.map((disp) => {
                    const cfg = cngStatusConfig[disp.status] || cngStatusConfig.stopped
                    return (
                      <div key={disp.id} className="macos-card p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Fuel className={`size-4 ${cfg.color}`} />
                            <h4 className="text-[13px] font-semibold">{disp.name}</h4>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <div className={`macos-status-dot ${cfg.dot}`} />
                            <span className={`text-[11px] font-medium ${cfg.color}`}>{cfg.label}</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[12px] text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <Gauge className="size-3" />
                            <span>{disp.pressure > 0 ? `${disp.pressure} bar` : 'N/A'}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Cpu className="size-3" />
                            <span>{disp.station?.name?.split(' ').slice(0, 2).join(' ') || 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="macos-card p-6 text-center text-[13px] text-muted-foreground mt-2">
                  No CNG dispensers configured
                </div>
              )}
            </div>

            {/* Compressors & Storage — fetched from cng-advanced if available */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Compressors */}
              <div>
                <div className="macos-section-header flex items-center gap-2 px-0">
                  <Wind className="size-3 text-teal-500" />
                  Compressors
                </div>
                <div className="macos-group mt-2">
                  <div className="macos-group-item text-center text-[13px] text-muted-foreground py-4">
                    Compressor data available via CNG Advanced API
                  </div>
                </div>
              </div>

              {/* Storage */}
              <div>
                <div className="macos-section-header flex items-center gap-2 px-0">
                  <Cylinder className="size-3 text-teal-500" />
                  Storage Monitoring
                </div>
                <div className="macos-group mt-2">
                  <div className="macos-group-item text-center text-[13px] text-muted-foreground py-4">
                    Storage data available via CNG Advanced API
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Revenue Tab ── */}
        {activeTab === 'revenue' && (
          <motion.div key="revenue" {...fadeUp} className="space-y-5">
            {/* Revenue Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="macos-card p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">EV Revenue</p>
                    <p className="text-[20px] font-bold mt-1 tracking-tight">{formatPKR(totalEVCRevenue)}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <ArrowUpRight className="size-3 text-emerald-500" />
                      <span className="text-[12px] font-medium text-emerald-500">Live data</span>
                    </div>
                  </div>
                  <div className="flex size-9 items-center justify-center rounded-xl bg-teal-500/10">
                    <Zap className="size-[18px] text-teal-500" />
                  </div>
                </div>
              </div>
              <div className="macos-card p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">CNG Revenue</p>
                    <p className="text-[20px] font-bold mt-1 tracking-tight">{formatPKR(totalCNGRevenue)}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <ArrowUpRight className="size-3 text-emerald-500" />
                      <span className="text-[12px] font-medium text-emerald-500">Live data</span>
                    </div>
                  </div>
                  <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/10">
                    <Fuel className="size-[18px] text-emerald-500" />
                  </div>
                </div>
              </div>
              <div className="macos-card p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Combined Revenue</p>
                    <p className="text-[20px] font-bold mt-1 tracking-tight">{formatPKR(totalEVCRevenue + totalCNGRevenue)}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <ArrowUpRight className="size-3 text-emerald-500" />
                      <span className="text-[12px] font-medium text-emerald-500">Live data</span>
                    </div>
                  </div>
                  <div className="flex size-9 items-center justify-center rounded-xl bg-orange-500/10">
                    <DollarSign className="size-[18px] text-orange-500" />
                  </div>
                </div>
              </div>
            </div>

            {/* Revenue Chart */}
            {revenueData.length > 0 ? (
              <div className="macos-card p-5">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="size-4 text-teal-500" />
                  <h3 className="text-[13px] font-semibold">EV Monthly Revenue</h3>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `${(v / 1000000).toFixed(1)}M`} />
                      <Tooltip
                        contentStyle={{ fontSize: 12, borderRadius: 10, border: '0.5px solid var(--border)', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                        formatter={(value: number, name: string) => [formatPKR(value), name === 'ev' ? 'EV Charging' : 'CNG']}
                      />
                      <Bar dataKey="ev" name="ev" fill="#e8930c" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="cng" name="cng" fill="#34c759" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex items-center justify-center gap-6 mt-3">
                  <div className="flex items-center gap-1.5">
                    <div className="size-2.5 rounded-full bg-teal-500" />
                    <span className="text-[11px] text-muted-foreground">EV Charging</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="size-2.5 rounded-full bg-emerald-500" />
                    <span className="text-[11px] text-muted-foreground">CNG</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="macos-card p-6 text-center text-[13px] text-muted-foreground">
                No revenue data available yet
              </div>
            )}

            {/* Revenue by Source Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="macos-card p-4">
                <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">EV Revenue by Charger Type</h4>
                <div className="macos-group">
                  {(() => {
                    const byType: Record<string, number> = {}
                    for (const c of evChargers) {
                      const key = `${c.connectorType} (${c.maxPowerKw} kW)`
                      byType[key] = (byType[key] || 0) + (c.totalRevenue || 0)
                    }
                    const entries = Object.entries(byType)
                    return entries.length > 0 ? entries.map(([type, rev]) => (
                      <div key={type} className="macos-group-item flex items-center justify-between">
                        <span className="text-[13px]">{type}</span>
                        <span className="text-[13px] font-semibold tabular-nums">{formatPKR(rev)}</span>
                      </div>
                    )) : (
                      <div className="macos-group-item text-center text-[13px] text-muted-foreground py-2">No data</div>
                    )
                  })()}
                </div>
              </div>
              <div className="macos-card p-4">
                <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">CNG Revenue by Station</h4>
                <div className="macos-group">
                  {(() => {
                    const byStation: Record<string, number> = {}
                    for (const d of cngDispensers) {
                      const name = d.station?.name || 'Unknown'
                      byStation[name] = byStation[name] || 0 // CNG revenue not directly available per dispenser
                    }
                    const entries = Object.entries(byStation)
                    return entries.length > 0 ? entries.map(([station]) => (
                      <div key={station} className="macos-group-item flex items-center justify-between">
                        <span className="text-[13px]">{station}</span>
                        <span className="text-[13px] font-semibold tabular-nums">{formatPKR(0)}</span>
                      </div>
                    )) : (
                      <div className="macos-group-item text-center text-[13px] text-muted-foreground py-2">No data</div>
                    )
                  })()}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
