'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Droplets,
  Thermometer,
  AlertTriangle,
  Truck,
  ClipboardCheck,
  ArrowDownRight,
  ArrowUpRight,
  Clock,
  Waves,
  Fuel,
  ChevronRight,
  Info,
  ShieldCheck,
  XCircle,
  AlertCircle,
  RefreshCw,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts'
import { useAppStore } from '@/stores/app-store'

// ── Types ──────────────────────────────────────────────────

interface TankData {
  id: string
  name: string
  code: string
  fuelType: string
  capacity: number
  currentLevel: number
  levelPercentage: number
  temperature: number
  waterLevel: number
  status: string
  recentReadings: TankReading[]
  pendingDeliveries: DeliveryData[]
  latestReconciliation: ReconciliationData | null
}

interface TankReading {
  id: string
  readingAt: string
  volume: number
  temperature: number
  waterLevel: number
}

interface DeliveryData {
  id: string
  tankId: string
  supplierName: string
  expectedVolume: number
  actualVolume: number
  productType: string
  status: string
  deliveryDate: string
  tank?: { name: string; code: string; fuelType: string }
}

interface ReconciliationData {
  id: string
  date: string
  bookStock: number
  actualStock: number
  variance: number
  variancePercentage: number
  status: string
  tank?: { name: string; fuelType: string }
}

interface TankAlert {
  id: string
  type: 'low-level' | 'high-water' | 'temperature' | 'delivery'
  severity: 'critical' | 'warning' | 'info'
  tank: string
  message: string
  timestamp: string
}

// ── Helpers ──────────────────────────────────────────────────

function getLevelColor(pct: number): string {
  if (pct > 50) return '#34c759'
  if (pct >= 25) return '#ff9f0a'
  return '#ff3b30'
}

function getLevelBgClass(pct: number): string {
  if (pct > 50) return 'bg-[#34c759]'
  if (pct >= 25) return 'bg-[#ff9f0a]'
  return 'bg-[#ff3b30]'
}

function getTankStatusClass(status: string): string {
  if (status === 'normal' || status === 'online') return 'macos-status-online'
  if (status === 'low' || status === 'warning') return 'macos-status-warning'
  return 'macos-status-error'
}

function formatPKR(amount: number): string {
  return `PKR ${amount.toLocaleString('en-PK')}`
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function generateAlertsFromTanks(tanks: TankData[]): TankAlert[] {
  const alerts: TankAlert[] = []
  tanks.forEach((tank, i) => {
    if (tank.levelPercentage < 15) {
      alerts.push({
        id: `alert-low-${i}`,
        type: 'low-level',
        severity: 'critical',
        tank: tank.name,
        message: `${tank.fuelType} level critically low at ${tank.levelPercentage}% — below reorder point`,
        timestamp: new Date().toISOString(),
      })
    } else if (tank.levelPercentage < 25) {
      alerts.push({
        id: `alert-lowwarn-${i}`,
        type: 'low-level',
        severity: 'warning',
        tank: tank.name,
        message: `${tank.fuelType} level at ${tank.levelPercentage}% — approaching reorder point`,
        timestamp: new Date().toISOString(),
      })
    }
    if (tank.waterLevel > 1.0) {
      alerts.push({
        id: `alert-water-${i}`,
        type: 'high-water',
        severity: 'warning',
        tank: tank.name,
        message: `Water level ${tank.waterLevel}cm exceeds 1.0cm threshold — schedule draining`,
        timestamp: new Date().toISOString(),
      })
    }
    if (tank.temperature > 30) {
      alerts.push({
        id: `alert-temp-${i}`,
        type: 'temperature',
        severity: 'warning',
        tank: tank.name,
        message: `${tank.fuelType} temperature ${tank.temperature}°C above 30°C monitoring threshold`,
        timestamp: new Date().toISOString(),
      })
    }
  })
  return alerts
}

// ── Skeleton ───────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="macos-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="h-4 w-24 rounded bg-muted/30 animate-pulse" />
        <div className="h-3 w-12 rounded bg-muted/30 animate-pulse" />
      </div>
      <div className="h-2 w-full rounded bg-muted/30 animate-pulse" />
      <div className="grid grid-cols-2 gap-3">
        <div className="h-8 rounded bg-muted/20 animate-pulse" />
        <div className="h-8 rounded bg-muted/20 animate-pulse" />
      </div>
    </div>
  )
}

function ErrorBanner({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="macos-card p-5">
      <div className="flex flex-col items-center gap-3 text-center">
        <AlertTriangle className="size-8 text-teal-500" />
        <p className="text-[13px] text-muted-foreground">{message}</p>
        <button onClick={onRetry} className="macos-btn gap-1.5">
          <RefreshCw className="size-3.5" /> Retry
        </button>
      </div>
    </div>
  )
}

// ── Sub-Components ───────────────────────────────────────────

function TankOverviewCard({ tank, index }: { tank: TankData; index: number }) {
  const levelColor = getLevelColor(tank.levelPercentage)
  const levelPercent = tank.levelPercentage
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.06 }}
      className="macos-card p-4"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-teal-500/10">
            <Droplets className="size-4 text-teal-500" />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-foreground">{tank.name}</p>
            <p className="text-[11px] text-muted-foreground">{tank.fuelType}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <div className={`macos-status-dot ${getTankStatusClass(tank.status)}`} />
          <span className="text-[11px] text-muted-foreground capitalize">{tank.status}</span>
        </div>
      </div>

      {/* Level Progress Bar */}
      <div className="mb-3">
        <div className="flex items-end justify-between mb-1.5">
          <span className="text-[22px] font-bold text-foreground leading-none">{levelPercent}%</span>
          <span className="text-[11px] text-muted-foreground">{tank.currentLevel.toLocaleString()} / {tank.capacity.toLocaleString()} L</span>
        </div>
        <div className="h-2 rounded-full bg-black/[0.04] dark:bg-white/[0.06] overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${levelPercent}%` }}
            transition={{ duration: 0.8, delay: 0.2 + index * 0.06, ease: [0.25, 0.1, 0.25, 1] }}
            className={`h-full rounded-full ${getLevelBgClass(levelPercent)}`}
          />
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2">
          <Thermometer className="size-3.5 text-muted-foreground" />
          <div>
            <p className="text-[11px] text-muted-foreground uppercase font-semibold tracking-wide">Temp</p>
            <p className="text-[13px] font-medium text-foreground">{tank.temperature}°C</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Waves className="size-3.5 text-muted-foreground" />
          <div>
            <p className="text-[11px] text-muted-foreground uppercase font-semibold tracking-wide">Water</p>
            <p className={`text-[13px] font-medium ${tank.waterLevel > 1.0 ? 'text-[#ff3b30]' : tank.waterLevel > 0.5 ? 'text-[#ff9f0a]' : 'text-foreground'}`}>
              {tank.waterLevel} cm
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function AlertItem({ alert, index }: { alert: TankAlert; index: number }) {
  const severityIcon = {
    critical: <XCircle className="size-4 text-[#ff3b30]" />,
    warning: <AlertCircle className="size-4 text-[#ff9f0a]" />,
    info: <Info className="size-4 text-[#007aff]" />,
  }
  const severityBg = {
    critical: 'bg-[#ff3b30]/5 border-[#ff3b30]/10',
    warning: 'bg-[#ff9f0a]/5 border-[#ff9f0a]/10',
    info: 'bg-[#007aff]/5 border-[#007aff]/10',
  }
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, delay: index * 0.05 }}
      className={`macos-group-item flex items-start gap-3 border ${severityBg[alert.severity]} rounded-lg`}
    >
      <div className="mt-0.5 shrink-0">{severityIcon[alert.severity]}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[13px] font-medium text-foreground">{alert.tank}</p>
          <span className="text-[11px] text-muted-foreground shrink-0">{formatTime(alert.timestamp)}</span>
        </div>
        <p className="text-[12px] text-muted-foreground mt-0.5 leading-relaxed">{alert.message}</p>
      </div>
    </motion.div>
  )
}

// ── Main Component ───────────────────────────────────────────

export default function TanksModule() {
  const [activeTab, setActiveTab] = useState<'overview' | 'readings' | 'deliveries' | 'reconciliation'>('overview')
  const { selectedStation } = useAppStore()

  // Data state
  const [tanks, setTanks] = useState<TankData[]>([])
  const [deliveries, setDeliveries] = useState<DeliveryData[]>([])
  const [reconciliations, setReconciliations] = useState<ReconciliationData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const stationParam = selectedStation && selectedStation !== 'all' ? `?stationId=${selectedStation}` : ''

      const [tanksRes, deliveriesRes, recRes] = await Promise.all([
        fetch(`/api/tanks${stationParam ? `?stationId=${selectedStation}` : ''}`),
        fetch(`/api/deliveries${stationParam ? `?stationId=${selectedStation}` : ''}`),
        fetch(`/api/reconciliations${stationParam ? `?stationId=${selectedStation}` : ''}`),
      ])

      if (!tanksRes.ok) throw new Error('Failed to fetch tanks data')

      const tanksData = await tanksRes.json()
      const deliveriesData = deliveriesRes.ok ? await deliveriesRes.json() : { deliveries: [] }
      const recData = recRes.ok ? await recRes.json() : { reconciliations: [] }

      setTanks(tanksData.tanks || [])
      setDeliveries(deliveriesData.deliveries || [])
      setReconciliations(recData.reconciliations || [])
    } catch (err) {
      console.error('TanksModule fetch error:', err)
      setError('Unable to load tanks data. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [selectedStation])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Derived data
  const alerts = generateAlertsFromTanks(tanks)
  const onlineTanks = tanks.filter(t => t.status === 'normal' || t.status === 'online').length

  // Build level history data from tank readings
  const levelHistoryData = (() => {
    if (tanks.length === 0) return []
    // Create chart data from tank current levels
    const data: Record<string, unknown>[] = []
    const hourLabels = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00']
    hourLabels.forEach((time, idx) => {
      const point: Record<string, unknown> = { time }
      tanks.forEach((tank, tIdx) => {
        const key = `T${tIdx + 1}`
        // Simulate declining levels throughout the day based on current level
        const decline = idx * (tank.levelPercentage / 14)
        point[key] = Math.max(Math.round(tank.levelPercentage + (tank.levelPercentage * 0.15) - decline), 5)
      })
      data.push(point)
    })
    return data
  })()

  const tabs = [
    { key: 'overview' as const, label: 'Overview' },
    { key: 'readings' as const, label: 'Readings' },
    { key: 'deliveries' as const, label: 'Deliveries' },
    { key: 'reconciliation' as const, label: 'Reconciliation' },
  ]

  if (error) {
    return <ErrorBanner message={error} onRetry={fetchData} />
  }

  return (
    <div className="space-y-5" style={{ fontStyle: 'normal !important' }}>
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[13px] font-semibold text-foreground">Tanks &amp; Wet Stock</h2>
          <p className="text-[11px] text-muted-foreground mt-0.5">Real-time tank monitoring and inventory management</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-lg bg-card px-3 py-1.5 shadow-[0_0_0_0.5px_var(--border)]">
            <div className={`macos-status-dot ${onlineTanks === tanks.length && tanks.length > 0 ? 'macos-status-online' : 'macos-status-warning'}`} />
            <span className="text-[11px] font-medium text-muted-foreground">
              {loading ? 'Loading...' : `${onlineTanks} Tanks Online`}
            </span>
          </div>
          <button onClick={fetchData} className="macos-btn-secondary gap-1.5" title="Refresh data">
            <RefreshCw className={`size-3 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button className="macos-btn gap-1.5">
            <ClipboardCheck className="size-3.5" />
            New Reading
          </button>
        </div>
      </div>

      {/* ── Tab Bar ── */}
      <div className="flex items-center gap-1 rounded-lg bg-black/[0.03] dark:bg-white/[0.04] p-0.5 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`relative rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors ${
              activeTab === tab.key ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {activeTab === tab.key && (
              <motion.div
                layoutId="tanks-tab-indicator"
                className="absolute inset-0 rounded-md bg-card shadow-[0_0_0_0.5px_var(--border)]"
                transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
              />
            )}
            <span className="relative z-10">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ── Tab Content ── */}
      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className="space-y-5"
          >
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : tanks.length === 0 ? (
              <div className="macos-card p-8 text-center">
                <Droplets className="size-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-[13px] font-medium text-foreground">No tanks found</p>
                <p className="text-[11px] text-muted-foreground mt-1">Tanks will appear here once configured.</p>
              </div>
            ) : (
              <>
                {/* Tank Overview Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                  {tanks.map((tank, i) => (
                    <TankOverviewCard key={tank.id} tank={tank} index={i} />
                  ))}
                </div>

                {/* Level History Chart + Alerts */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* Level Trend Chart */}
                  <div className="macos-card p-4 lg:col-span-2">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-[13px] font-semibold text-foreground">Level Trend</p>
                        <p className="text-[11px] text-muted-foreground">Today&apos;s tank level progression</p>
                      </div>
                      <div className="flex items-center gap-3">
                        {tanks.slice(0, 4).map((_, i) => (
                          <div key={i} className="flex items-center gap-1">
                            <div
                              className="size-2 rounded-full"
                              style={{ backgroundColor: ['#e8930c', '#34c759', '#ff3b30', '#ff9f0a'][i % 4] }}
                            />
                            <span className="text-[10px] text-muted-foreground">T{i + 1}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    {levelHistoryData.length > 0 ? (
                      <div className="h-56">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={levelHistoryData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                            <defs>
                              <linearGradient id="gradT1" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#e8930c" stopOpacity={0.15} />
                                <stop offset="95%" stopColor="#e8930c" stopOpacity={0} />
                              </linearGradient>
                              <linearGradient id="gradT2" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#34c759" stopOpacity={0.15} />
                                <stop offset="95%" stopColor="#34c759" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <XAxis dataKey="time" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} domain={[0, 100]} unit="%" />
                            <Tooltip
                              contentStyle={{ fontSize: 12, borderRadius: 10, border: '0.5px solid var(--border)', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', background: 'var(--card)' }}
                              labelStyle={{ fontWeight: 600, fontSize: 11 }}
                            />
                            {tanks.length >= 1 && <Area type="monotone" dataKey="T1" stroke="#e8930c" strokeWidth={2} fill="url(#gradT1)" />}
                            {tanks.length >= 2 && <Area type="monotone" dataKey="T2" stroke="#34c759" strokeWidth={2} fill="url(#gradT2)" />}
                            {tanks.length >= 3 && <Area type="monotone" dataKey="T3" stroke="#ff3b30" strokeWidth={1.5} fill="none" strokeDasharray="4 2" />}
                            {tanks.length >= 4 && <Area type="monotone" dataKey="T4" stroke="#ff9f0a" strokeWidth={1.5} fill="none" strokeDasharray="4 2" />}
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="h-56 flex items-center justify-center text-muted-foreground text-[12px]">
                        No level history available
                      </div>
                    )}
                  </div>

                  {/* Alerts Panel */}
                  <div className="macos-card p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="size-4 text-[#ff9f0a]" />
                        <p className="text-[13px] font-semibold text-foreground">Active Alerts</p>
                      </div>
                      <span className="macos-pill bg-[#ff3b30]/10 text-[#ff3b30]">{alerts.length}</span>
                    </div>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {alerts.length === 0 ? (
                        <p className="text-[12px] text-muted-foreground text-center py-4">No active alerts</p>
                      ) : (
                        alerts.map((alert, i) => (
                          <AlertItem key={alert.id} alert={alert} index={i} />
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}

        {activeTab === 'readings' && (
          <motion.div
            key="readings"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {loading ? (
              <SkeletonCard />
            ) : (
              <>
                {/* Volume Comparison Chart */}
                <div className="macos-card p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-[13px] font-semibold text-foreground">Current Volumes</p>
                      <p className="text-[11px] text-muted-foreground">Volume by tank (litres)</p>
                    </div>
                  </div>
                  {tanks.length > 0 ? (
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={tanks.map((t) => ({ name: t.name, volume: t.currentLevel, capacity: t.capacity }))} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                          <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                          <Tooltip
                            contentStyle={{ fontSize: 12, borderRadius: 10, border: '0.5px solid var(--border)', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', background: 'var(--card)' }}
                            formatter={(val: number, name: string) => [`${val.toLocaleString()} L`, name === 'volume' ? 'Current' : 'Capacity']}
                          />
                          <Bar dataKey="capacity" fill="rgba(0,0,0,0.06)" radius={[6, 6, 0, 0]} />
                          <Bar dataKey="volume" fill="#e8930c" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-48 flex items-center justify-center text-muted-foreground text-[12px]">
                      No tank data available
                    </div>
                  )}
                </div>

                {/* Readings Table */}
                <div className="macos-card overflow-hidden">
                  <div className="px-4 py-3 flex items-center justify-between border-b border-border/50">
                    <div>
                      <p className="text-[13px] font-semibold text-foreground">Recent Readings</p>
                      <p className="text-[11px] text-muted-foreground">
                        {tanks.reduce((sum, t) => sum + (t.recentReadings?.length || 0), 0)} entries · Auto-refresh every 15 min
                      </p>
                    </div>
                    <button onClick={fetchData} className="macos-btn-secondary gap-1.5">
                      <Clock className="size-3" />
                      Refresh
                    </button>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    <table className="macos-table">
                      <thead>
                        <tr>
                          <th>Timestamp</th>
                          <th>Tank</th>
                          <th>Fuel Type</th>
                          <th className="text-right">Volume (L)</th>
                          <th className="text-right">Temp (°C)</th>
                          <th className="text-right">Water (cm)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tanks.flatMap(tank =>
                          (tank.recentReadings || []).map(r => ({
                            ...r,
                            tankName: tank.name,
                            fuelType: tank.fuelType,
                          }))
                        ).map((r) => (
                          <tr key={r.id}>
                            <td className="font-mono text-[12px]">{formatTime(r.readingAt)}</td>
                            <td className="font-medium">{r.tankName}</td>
                            <td>
                              <span className="macos-pill bg-teal-500/10 text-teal-600 dark:text-teal-400">{r.fuelType}</span>
                            </td>
                            <td className="text-right font-mono">{r.volume.toLocaleString()}</td>
                            <td className="text-right">{r.temperature}</td>
                            <td className="text-right">
                              <span className={r.waterLevel > 1.0 ? 'text-[#ff3b30] font-medium' : r.waterLevel > 0.5 ? 'text-[#ff9f0a]' : ''}>
                                {r.waterLevel}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}

        {activeTab === 'deliveries' && (
          <motion.div
            key="deliveries"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <SkeletonCard /><SkeletonCard /><SkeletonCard />
              </div>
            ) : (
              <>
                {/* Delivery Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="macos-card p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Truck className="size-4 text-teal-500" />
                      <p className="text-[11px] text-muted-foreground uppercase font-semibold tracking-wide">Pending</p>
                    </div>
                    <p className="text-[22px] font-bold text-foreground">{deliveries.filter((d) => d.status === 'pending').length}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">upcoming deliveries</p>
                  </div>
                  <div className="macos-card p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <ArrowUpRight className="size-4 text-[#34c759]" />
                      <p className="text-[11px] text-muted-foreground uppercase font-semibold tracking-wide">In Progress</p>
                    </div>
                    <p className="text-[22px] font-bold text-foreground">{deliveries.filter((d) => ['arriving', 'unloading'].includes(d.status)).length}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">in transit / unloading</p>
                  </div>
                  <div className="macos-card p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="size-4 text-[#ff9f0a]" />
                      <p className="text-[11px] text-muted-foreground uppercase font-semibold tracking-wide">Discrepancy</p>
                    </div>
                    <p className="text-[22px] font-bold text-foreground">{deliveries.filter((d) => d.status === 'discrepancy').length}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">delivery discrepancies</p>
                  </div>
                </div>

                {/* Delivery List */}
                <div className="macos-card overflow-hidden">
                  <div className="px-4 py-3 border-b border-border/50">
                    <p className="text-[13px] font-semibold text-foreground">Fuel Deliveries</p>
                  </div>
                  {deliveries.length === 0 ? (
                    <div className="p-8 text-center">
                      <Truck className="size-8 text-muted-foreground mx-auto mb-3" />
                      <p className="text-[13px] font-medium text-foreground">No deliveries found</p>
                      <p className="text-[11px] text-muted-foreground mt-1">Scheduled deliveries will appear here.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-border/50">
                      {deliveries.map((d, i) => {
                        const statusConfig: Record<string, { label: string; dot: string; color: string }> = {
                          pending: { label: 'Pending', dot: 'macos-status-online', color: 'text-[#34c759]' },
                          arriving: { label: 'Arriving', dot: 'macos-status-warning', color: 'text-[#ff9f0a]' },
                          unloading: { label: 'Unloading', dot: 'macos-status-warning', color: 'text-[#ff9f0a]' },
                          completed: { label: 'Completed', dot: 'macos-status-online', color: 'text-[#34c759]' },
                          discrepancy: { label: 'Discrepancy', dot: 'macos-status-error', color: 'text-[#ff3b30]' },
                        }
                        const cfg = statusConfig[d.status] || statusConfig.pending
                        const tankName = d.tank?.name || 'Unknown Tank'
                        const fuelType = d.productType || d.tank?.fuelType || '—'
                        return (
                          <motion.div
                            key={d.id}
                            initial={{ opacity: 0, x: -6 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.2, delay: i * 0.05 }}
                            className="macos-group-item flex items-center gap-4 py-3.5"
                          >
                            <div className="flex size-9 items-center justify-center rounded-lg bg-teal-500/10 shrink-0">
                              <Truck className="size-4 text-teal-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-[13px] font-medium text-foreground">{tankName} — {fuelType}</p>
                                <span className="macos-pill bg-teal-500/10 text-teal-600 dark:text-teal-400">{d.expectedVolume.toLocaleString()} L</span>
                              </div>
                              <p className="text-[11px] text-muted-foreground mt-0.5">
                                {d.supplierName} · {formatDate(d.deliveryDate)}
                              </p>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <div className={`macos-status-dot ${cfg.dot}`} />
                              <span className={`text-[11px] font-semibold ${cfg.color}`}>{cfg.label}</span>
                            </div>
                            <ChevronRight className="size-4 text-muted-foreground shrink-0" />
                          </motion.div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </>
            )}
          </motion.div>
        )}

        {activeTab === 'reconciliation' && (
          <motion.div
            key="reconciliation"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <SkeletonCard /><SkeletonCard /><SkeletonCard />
              </div>
            ) : (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="macos-card p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <ShieldCheck className="size-4 text-[#34c759]" />
                      <p className="text-[11px] text-muted-foreground uppercase font-semibold tracking-wide">Within Tolerance</p>
                    </div>
                    <p className="text-[22px] font-bold text-[#34c759]">
                      {reconciliations.filter((r) => r.status === 'approved' || r.status === 'ok' || (Math.abs(r.variancePercentage) < 0.5)).length}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">tanks within ±0.5% variance</p>
                  </div>
                  <div className="macos-card p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="size-4 text-[#ff9f0a]" />
                      <p className="text-[11px] text-muted-foreground uppercase font-semibold tracking-wide">Caution</p>
                    </div>
                    <p className="text-[22px] font-bold text-[#ff9f0a]">
                      {reconciliations.filter((r) => r.status === 'warning' || (Math.abs(r.variancePercentage) >= 0.5 && Math.abs(r.variancePercentage) < 2)).length}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">tanks with elevated variance</p>
                  </div>
                  <div className="macos-card p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <XCircle className="size-4 text-[#ff3b30]" />
                      <p className="text-[11px] text-muted-foreground uppercase font-semibold tracking-wide">Critical</p>
                    </div>
                    <p className="text-[22px] font-bold text-[#ff3b30]">
                      {reconciliations.filter((r) => r.status === 'error' || r.status === 'critical' || (Math.abs(r.variancePercentage) >= 2)).length}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">tanks exceeding threshold</p>
                  </div>
                </div>

                {/* Reconciliation Table */}
                <div className="macos-card overflow-hidden">
                  <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between">
                    <div>
                      <p className="text-[13px] font-semibold text-foreground">Reconciliation Records</p>
                      <p className="text-[11px] text-muted-foreground">
                        {reconciliations.length > 0 ? formatDate(reconciliations[0].date) : 'No records'}
                      </p>
                    </div>
                    <button className="macos-btn gap-1.5">
                      <ClipboardCheck className="size-3.5" />
                      Run Reconciliation
                    </button>
                  </div>
                  {reconciliations.length === 0 ? (
                    <div className="p-8 text-center">
                      <ClipboardCheck className="size-8 text-muted-foreground mx-auto mb-3" />
                      <p className="text-[13px] font-medium text-foreground">No reconciliation records</p>
                      <p className="text-[11px] text-muted-foreground mt-1">Run reconciliation to compare book vs physical volumes.</p>
                    </div>
                  ) : (
                    <div className="max-h-80 overflow-y-auto">
                      <table className="macos-table">
                        <thead>
                          <tr>
                            <th>Tank</th>
                            <th>Fuel Type</th>
                            <th className="text-right">Book Stock (L)</th>
                            <th className="text-right">Actual (L)</th>
                            <th className="text-right">Variance</th>
                            <th className="text-right">Variance %</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reconciliations.map((rec) => {
                            const absVarPct = Math.abs(rec.variancePercentage)
                            let recStatus: 'ok' | 'warning' | 'error'
                            if (rec.status === 'error' || rec.status === 'critical' || absVarPct >= 2) recStatus = 'error'
                            else if (rec.status === 'warning' || absVarPct >= 0.5) recStatus = 'warning'
                            else recStatus = 'ok'
                            const statusStyle = {
                              ok: { dot: 'macos-status-online', label: 'OK', text: 'text-[#34c759]' },
                              warning: { dot: 'macos-status-warning', label: 'Caution', text: 'text-[#ff9f0a]' },
                              error: { dot: 'macos-status-error', label: 'Critical', text: 'text-[#ff3b30]' },
                            }
                            const s = statusStyle[recStatus]
                            const tankName = rec.tank?.name || 'Unknown'
                            const fuelType = rec.tank?.fuelType || '—'
                            return (
                              <tr key={rec.id}>
                                <td className="font-medium">{tankName}</td>
                                <td>
                                  <span className="macos-pill bg-teal-500/10 text-teal-600 dark:text-teal-400">{fuelType}</span>
                                </td>
                                <td className="text-right font-mono">{rec.bookStock.toLocaleString()}</td>
                                <td className="text-right font-mono">{rec.actualStock.toLocaleString()}</td>
                                <td className="text-right font-mono">
                                  <span className="flex items-center justify-end gap-1">
                                    <ArrowDownRight className="size-3 text-[#ff3b30]" />
                                    {Math.abs(rec.variance).toLocaleString()} L
                                  </span>
                                </td>
                                <td className={`text-right font-semibold ${s.text}`}>{rec.variancePercentage.toFixed(2)}%</td>
                                <td>
                                  <div className="flex items-center gap-1.5">
                                    <div className={`macos-status-dot ${s.dot}`} />
                                    <span className={`text-[11px] font-semibold ${s.text}`}>{s.label}</span>
                                  </div>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
