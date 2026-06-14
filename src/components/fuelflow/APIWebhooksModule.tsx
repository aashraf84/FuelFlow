'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Key, Webhook, Send, RefreshCw, CheckCircle2, XCircle,
  Clock, AlertTriangle, Zap, Globe, Activity, Hash,
  ArrowRightLeft, Copy, Plus, Trash2, Eye, Shield,
  TrendingUp, BarChart3, Loader2, AlertCircle,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

// ── Types ──────────────────────────────────────

interface ApiKeyData {
  id: string
  keyPrefix: string
  name: string
  permissions: string | null
  allowedIPs: string | null
  rateLimit: number
  isActive: boolean
  expiresAt: string | null
  createdAt: string
  lastUsedAt: string | null
  usageCount: number
}

interface WebhookEndpointData {
  id: string
  name: string
  url: string
  events: string[]
  isActive: boolean
  lastTriggeredAt: string | null
  successCount: number
  failureCount: number
  deliveryCount: number
  createdAt: string
}

interface WebhookDeliveryData {
  id: string
  webhookId: string
  event: string
  payload: string | null
  statusCode: number | null
  isSuccess: boolean
  deliveredAt: string
  duration: number | null
  retryCount: number
}

interface OverviewData {
  keys: { total: number; active: number }
  endpoints: { total: number; active: number }
  deliveries: { total: number; successful: number; failed: number }
}

// ── Skeleton ──────────────────────────────────────

function SkeletonTable({ rows = 5, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i}>
          {Array.from({ length: cols }).map((_, j) => (
            <td key={j} className="p-3">
              <div className="h-4 bg-muted/40 rounded animate-pulse" style={{ width: `${50 + Math.random() * 50}%` }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

function SkeletonCards({ count = 4 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="macos-card p-4 animate-pulse space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div className="size-9 rounded-[10px] bg-muted/40" />
              <div className="space-y-1.5">
                <div className="h-3.5 bg-muted/40 rounded w-32" />
                <div className="h-3 bg-muted/30 rounded w-48" />
              </div>
            </div>
            <div className="size-4 bg-muted/30 rounded-full" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="h-12 bg-muted/20 rounded-lg" />
            ))}
          </div>
        </div>
      ))}
    </>
  )
}

function ErrorBanner({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="macos-card p-4 flex items-center gap-3 border border-red-500/20">
      <AlertCircle className="size-4 text-red-500 shrink-0" />
      <p className="text-[12px] text-red-600 dark:text-red-400 flex-1">{message}</p>
      <button onClick={onRetry} className="macos-btn-secondary text-[11px] px-2 py-0.5 flex items-center gap-1">
        <RefreshCw className="size-3" /> Retry
      </button>
    </div>
  )
}

// ── Helpers ──────────────────────────────────────

function getHttpStatusColor(code: number) {
  if (code >= 200 && code < 300) return 'text-emerald-600 dark:text-emerald-400'
  if (code >= 400 && code < 500) return 'text-teal-600 dark:text-teal-400'
  return 'text-red-600 dark:text-red-400'
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return 'Never'
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} hr ago`
  const days = Math.floor(hrs / 24)
  return `${days} day${days > 1 ? 's' : ''} ago`
}

// ── Component ──────────────────────────────────────

export default function APIWebhooksModule() {
  const [activeTab, setActiveTab] = useState('api-keys')
  const [testingWebhook, setTestingWebhook] = useState<string | null>(null)

  // Data states
  const [apiKeys, setApiKeys] = useState<ApiKeyData[]>([])
  const [endpoints, setEndpoints] = useState<WebhookEndpointData[]>([])
  const [deliveries, setDeliveries] = useState<WebhookDeliveryData[]>([])
  const [overview, setOverview] = useState<OverviewData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [keysRes, endpointsRes, deliveriesRes, overviewRes] = await Promise.all([
        fetch('/api/webhooks?type=keys'),
        fetch('/api/webhooks?type=endpoints'),
        fetch('/api/webhooks?type=deliveries'),
        fetch('/api/webhooks?type=overview'),
      ])

      if (!keysRes.ok) throw new Error('Failed to load API data')

      const [keysData, endpointsData, deliveriesData, overviewData] = await Promise.all([
        keysRes.json(),
        endpointsRes.json(),
        deliveriesRes.json(),
        overviewRes.json(),
      ])

      setApiKeys((keysData.keys ?? []) as ApiKeyData[])
      setEndpoints((endpointsData.endpoints ?? []) as WebhookEndpointData[])
      setDeliveries((deliveriesData.deliveries ?? []) as WebhookDeliveryData[])
      setOverview((overviewData.overview ?? null) as OverviewData | null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const handleTest = async (id: string) => {
    setTestingWebhook(id)
    try {
      await fetch('/api/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test_endpoint', endpointId: id }),
      })
      // Refresh deliveries after test
      const res = await fetch('/api/webhooks?type=deliveries')
      if (res.ok) {
        const data = await res.json()
        setDeliveries((data.deliveries ?? []) as WebhookDeliveryData[])
      }
    } catch {
      // silent fail
    }
    setTimeout(() => setTestingWebhook(null), 1500)
  }

  // Compute usage metrics from real data
  const usageMetricsData = deliveries.length > 0
    ? (() => {
        // Group deliveries by day
        const dayMap = new Map<string, { requests: number; errors: number }>()
        for (const d of deliveries) {
          const day = new Date(d.deliveredAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          const existing = dayMap.get(day) ?? { requests: 0, errors: 0 }
          existing.requests++
          if (!d.isSuccess) existing.errors++
          dayMap.set(day, existing)
        }
        return Array.from(dayMap.entries())
          .slice(-14)
          .map(([day, data]) => ({ day, ...data }))
      })()
    : []

  // Compute endpoint usage from real deliveries
  const endpointUsageData = (() => {
    const endpointMap = new Map<string, number>()
    for (const d of deliveries) {
      const webhook = endpoints.find(e => e.id === d.webhookId)
      if (webhook) {
        const count = endpointMap.get(webhook.name) ?? 0
        endpointMap.set(webhook.name, count + 1)
      }
    }
    return Array.from(endpointMap.entries())
      .map(([endpoint, calls]) => ({ endpoint, calls, avgMs: 0 }))
      .sort((a, b) => b.calls - a.calls)
      .slice(0, 6)
  })()

  // Stats from overview
  const totalRequests = overview?.deliveries?.total ?? 0
  const errorRate = overview?.deliveries?.total
    ? ((overview.deliveries.failed / overview.deliveries.total) * 100).toFixed(2)
    : '0.00'
  const avgLatency = deliveries.length > 0
    ? Math.round(deliveries.reduce((sum, d) => sum + (d.duration ?? 0), 0) / deliveries.length)
    : 0

  if (error) return <ErrorBanner message={error} onRetry={fetchData} />

  return (
    <div className="space-y-4" style={{ fontStyle: 'normal !important' }}>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="overflow-x-auto pb-1">
          <TabsList className="h-8 w-max gap-0.5 bg-muted/50">
            <TabsTrigger value="api-keys" className="text-[11px] px-3 h-6 data-[state=active]:bg-teal-500/15 data-[state=active]:text-teal-600">API Keys</TabsTrigger>
            <TabsTrigger value="webhooks" className="text-[11px] px-3 h-6 data-[state=active]:bg-teal-500/15 data-[state=active]:text-teal-600">Webhooks</TabsTrigger>
            <TabsTrigger value="deliveries" className="text-[11px] px-3 h-6 data-[state=active]:bg-teal-500/15 data-[state=active]:text-teal-600">Deliveries</TabsTrigger>
            <TabsTrigger value="metrics" className="text-[11px] px-3 h-6 data-[state=active]:bg-teal-500/15 data-[state=active]:text-teal-600">Usage Metrics</TabsTrigger>
          </TabsList>
        </div>

        {/* ── API Keys ── */}
        <TabsContent value="api-keys" className="mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="macos-section-header">API Keys</div>
            <button className="macos-btn text-[11px] px-2.5 py-1 flex items-center gap-1">
              <Plus className="size-3" /> Create Key
            </button>
          </div>
          <div className="macos-card overflow-hidden">
            <div className="max-h-[400px] overflow-y-auto">
              <table className="macos-table">
                <thead>
                  <tr>
                    <th>Key</th>
                    <th>Name</th>
                    <th>Permissions</th>
                    <th>Rate Limit</th>
                    <th>Last Used</th>
                    <th>Expires</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <SkeletonTable rows={4} cols={7} />
                  ) : apiKeys.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-8 text-[12px] text-muted-foreground">No API keys found. Create one to get started.</td></tr>
                  ) : (
                    apiKeys.map(key => (
                      <tr key={key.id}>
                        <td>
                          <div className="flex items-center gap-1.5">
                            <Key className="size-3 text-teal-500 shrink-0" />
                            <code className="text-[11px] font-mono font-medium text-teal-600 dark:text-teal-400">{key.keyPrefix}_****</code>
                            <button className="text-muted-foreground hover:text-foreground transition-colors" title="Copy">
                              <Copy className="size-2.5" />
                            </button>
                          </div>
                        </td>
                        <td className="text-[13px] font-medium">{key.name}</td>
                        <td>
                          <div className="flex gap-1">
                            {(key.permissions ?? '').split(',').filter(Boolean).map(p => (
                              <Badge key={p} variant="outline" className="text-[9px] px-1.5 py-0 capitalize bg-slate-500/10 text-slate-500 border-slate-500/20">
                                {p.trim()}
                              </Badge>
                            ))}
                          </div>
                        </td>
                        <td className="text-[12px] text-muted-foreground">{key.rateLimit}/hr</td>
                        <td className="text-[12px] text-muted-foreground whitespace-nowrap">{timeAgo(key.lastUsedAt)}</td>
                        <td className="text-[12px]">
                          {key.expiresAt ? (
                            <span className={new Date(key.expiresAt) < new Date() ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'}>
                              {new Date(key.expiresAt).toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' })}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">Never</span>
                          )}
                        </td>
                        <td>
                          <div className="flex items-center gap-1.5">
                            <div className={`macos-status-dot ${key.isActive ? 'macos-status-online' : (key.expiresAt && new Date(key.expiresAt) < new Date() ? 'macos-status-error' : 'macos-status-offline')}`} />
                            <span className={`text-[11px] font-medium ${key.isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}>
                              {key.isActive ? 'Active' : (key.expiresAt && new Date(key.expiresAt) < new Date() ? 'Expired' : 'Inactive')}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* ── Webhook Endpoints ── */}
        <TabsContent value="webhooks" className="mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="macos-section-header">Webhook Endpoints</div>
            <button className="macos-btn text-[11px] px-2.5 py-1 flex items-center gap-1">
              <Plus className="size-3" /> Add Endpoint
            </button>
          </div>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <SkeletonCards count={4} />
            </div>
          ) : endpoints.length === 0 ? (
            <div className="macos-card p-8 text-center">
              <Webhook className="size-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-[13px] text-muted-foreground">No webhook endpoints configured</p>
              <p className="text-[11px] text-muted-foreground mt-1">Add a webhook endpoint to receive real-time event notifications</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {endpoints.map((wh, i) => {
                const totalDeliveries = wh.successCount + wh.failureCount
                const successRate = totalDeliveries > 0 ? ((wh.successCount / totalDeliveries) * 100).toFixed(1) : '0'
                return (
                  <motion.div
                    key={wh.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="macos-card p-4"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className="size-9 rounded-[10px] bg-teal-500/10 flex items-center justify-center">
                          <Webhook className="size-4 text-teal-500" />
                        </div>
                        <div>
                          <h3 className="text-[13px] font-semibold">{wh.name}</h3>
                          <p className="text-[10px] text-muted-foreground font-mono truncate max-w-[220px]">{wh.url}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className={`macos-status-dot ${wh.isActive ? 'macos-status-online' : 'macos-status-offline'}`} />
                        <span className={`text-[10px] font-medium ${wh.isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}>
                          {wh.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1 mt-2">
                      {(wh.events ?? []).map(ev => (
                        <Badge key={ev} variant="outline" className="text-[8px] px-1.5 py-0 bg-teal-500/5 text-teal-600 border-teal-500/15 font-mono">
                          {ev}
                        </Badge>
                      ))}
                    </div>

                    <div className="grid grid-cols-3 gap-2 mt-3">
                      <div className="text-center p-2 bg-emerald-500/5 rounded-lg">
                        <p className="text-[12px] font-bold text-emerald-600 dark:text-emerald-400">{wh.successCount.toLocaleString()}</p>
                        <p className="text-[9px] text-muted-foreground uppercase tracking-wider font-semibold">Success</p>
                      </div>
                      <div className="text-center p-2 bg-red-500/5 rounded-lg">
                        <p className="text-[12px] font-bold text-red-600 dark:text-red-400">{wh.failureCount}</p>
                        <p className="text-[9px] text-muted-foreground uppercase tracking-wider font-semibold">Failed</p>
                      </div>
                      <div className="text-center p-2 bg-teal-500/5 rounded-lg">
                        <p className="text-[12px] font-bold text-teal-600 dark:text-teal-400">{successRate}%</p>
                        <p className="text-[9px] text-muted-foreground uppercase tracking-wider font-semibold">Rate</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-border">
                      <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                        <span>Last: {timeAgo(wh.lastTriggeredAt)}</span>
                      </div>
                      <button
                        className="macos-btn-secondary text-[10px] px-2 py-0.5 flex items-center gap-1"
                        disabled={testingWebhook === wh.id}
                        onClick={() => handleTest(wh.id)}
                      >
                        {testingWebhook === wh.id ? (
                          <RefreshCw className="size-2.5 animate-spin" />
                        ) : (
                          <Zap className="size-2.5" />
                        )}
                        Test
                      </button>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* ── Deliveries ── */}
        <TabsContent value="deliveries" className="mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="macos-section-header">Recent Webhook Deliveries</div>
            <button onClick={fetchData} className="macos-btn-secondary text-[11px] px-2.5 py-1 flex items-center gap-1">
              <RefreshCw className={`size-3 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>
          <div className="macos-card overflow-hidden">
            <div className="max-h-[420px] overflow-y-auto">
              <table className="macos-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Event</th>
                    <th>Status</th>
                    <th>Code</th>
                    <th>Duration</th>
                    <th>Retries</th>
                    <th>Payload</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <SkeletonTable rows={5} cols={7} />
                  ) : deliveries.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-8 text-[12px] text-muted-foreground">No webhook deliveries found</td></tr>
                  ) : (
                    deliveries.map(delivery => (
                      <tr key={delivery.id}>
                        <td className="text-[11px] font-mono text-muted-foreground whitespace-nowrap">
                          {new Date(delivery.deliveredAt).toLocaleString('en-PK', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td>
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0 font-mono bg-teal-500/5 text-teal-600 border-teal-500/15">
                            {delivery.event}
                          </Badge>
                        </td>
                        <td>
                          {delivery.isSuccess
                            ? <CheckCircle2 className="size-3.5 text-emerald-500" />
                            : <XCircle className="size-3.5 text-red-500" />
                          }
                        </td>
                        <td className={`text-[12px] font-mono font-semibold ${delivery.statusCode ? getHttpStatusColor(delivery.statusCode) : 'text-muted-foreground'}`}>
                          {delivery.statusCode ?? '—'}
                        </td>
                        <td className="text-[12px] text-muted-foreground">{delivery.duration ? `${delivery.duration}ms` : '—'}</td>
                        <td className="text-[12px]">
                          <span className={delivery.retryCount > 0 ? 'text-teal-600 dark:text-teal-400 font-medium' : 'text-muted-foreground'}>
                            {delivery.retryCount}
                          </span>
                        </td>
                        <td className="text-[10px] max-w-[160px] truncate font-mono text-muted-foreground">{delivery.payload ?? '—'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* ── Usage Metrics ── */}
        <TabsContent value="metrics" className="mt-4 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Total Deliveries', value: totalRequests > 1000 ? `${(totalRequests / 1000).toFixed(1)}K` : String(totalRequests), icon: Globe, accent: '#e8930c' },
              { label: 'Avg Response Time', value: `${avgLatency}ms`, icon: Activity, accent: '#34c759' },
              { label: 'Error Rate', value: `${errorRate}%`, icon: AlertTriangle, accent: '#ff9f0a' },
              { label: 'Active Keys', value: String(overview?.keys?.active ?? 0), icon: Key, accent: '#e8930c' },
            ].map((stat) => (
              <div key={stat.label} className="macos-card p-4">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">{stat.label}</p>
                <p className="text-xl font-bold mt-0.5" style={{ color: stat.accent }}>{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="macos-section-header">API Requests (14 Day Trend)</div>
          <div className="macos-card p-4">
            <div className="h-[240px]">
              {usageMetricsData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={usageMetricsData}>
                    <defs>
                      <linearGradient id="requestsGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#e8930c" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#e8930c" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} width={45} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--card)',
                        border: '0.5px solid var(--border)',
                        borderRadius: '8px',
                        fontSize: '12px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                      }}
                    />
                    <Area type="monotone" dataKey="requests" stroke="#e8930c" fill="url(#requestsGrad)" strokeWidth={1.5} name="Requests" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-[12px] text-muted-foreground">
                  No delivery data available for trend chart
                </div>
              )}
            </div>
          </div>

          <div className="macos-section-header">Endpoint Usage</div>
          <div className="macos-card p-4">
            <div className="h-[200px]">
              {endpointUsageData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={endpointUsageData} layout="vertical">
                    <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} />
                    <YAxis dataKey="endpoint" type="category" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} width={120} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--card)',
                        border: '0.5px solid var(--border)',
                        borderRadius: '8px',
                        fontSize: '12px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                      }}
                    />
                    <Bar dataKey="calls" fill="#e8930c" radius={[0, 4, 4, 0]} name="Deliveries" barSize={16} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-[12px] text-muted-foreground">
                  No endpoint usage data available
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
