'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  DollarSign,
  Fuel,
  Activity,
  Droplets,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  AlertTriangle,
  Brain,
  Clock,
  Truck,
  Zap,
  ChevronRight,
  RefreshCw,
  Loader2,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

// ── Types ──────────────────────────────────────────────────

interface DashboardKPIs {
  revenue: { today: number; week: number; month: number; currency: string }
  fuelSold: { value: number; unit: string }
  activePumps: { value: number; total: number }
  alerts: { value: number; critical: number; warning: number }
  netProfit: { value: number; currency: string }
}

interface TankLevel {
  id: string
  product: string
  level: number
  capacity: number
  currentLitres: number
  status: string
  temperature: number
  waterLevel: number
}

interface RecentTransaction {
  id: string
  time: string
  pump: string
  product: string
  litres: number
  amount: number
  payment: string
  attendant: string
}

interface RevenueChartPoint {
  hour: string
  value: number
}

interface FuelBreakdownItem {
  type: string
  volume: number
  revenue: number
}

interface StationInfo {
  name: string
  code: string
  status: string
  shift: string
  attendant: string
  supervisor: string
}

interface DashboardData {
  kpis: DashboardKPIs
  tankLevels: TankLevel[]
  recentTransactions: RecentTransaction[]
  revenueChart: RevenueChartPoint[]
  fuelBreakdown: FuelBreakdownItem[]
  stationInfo: StationInfo
  shiftInfo: Record<string, unknown> | null
  allStations: unknown[]
  notifications: unknown[]
  carWash: { sessionsToday: number; revenue: number }
  lottery: { salesToday: number; revenue: number; commission: number }
  fleetSummary: Record<string, unknown>
  totalCustomers: number
  employeeOnDuty: number
}

// ── Formatting Helpers ──────────────────────────────────────

function formatPKR(value: number): string {
  return `PKR ${value.toLocaleString('en-PK')}`
}

function formatCompactPKR(value: number): string {
  if (value >= 1000000) return `PKR ${(value / 1000000).toFixed(1)}M`
  if (value >= 1000) return `PKR ${(value / 1000).toFixed(0)}K`
  return `PKR ${value}`
}

// ── Custom Tooltip ──────────────────────────────────────────

function RevenueTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="macos-card px-3 py-2 text-[13px] shadow-lg">
      <p className="text-[11px] text-muted-foreground font-medium">{label}</p>
      <p className="font-semibold text-foreground">{formatPKR(payload[0].value)}</p>
    </div>
  )
}

// ── Sub-Components ──────────────────────────────────────────

function StatCard({
  label,
  value,
  change,
  icon: Icon,
  accent = 'amber',
}: {
  label: string
  value: string
  change?: { value: number; label: string }
  icon: React.ElementType
  accent?: 'amber' | 'green' | 'red'
}) {
  const isPositive = change ? change.value >= 0 : true
  const iconBg = accent === 'amber'
    ? 'bg-teal-500/10'
    : accent === 'green'
      ? 'bg-emerald-500/10'
      : 'bg-red-500/10'
  const iconColor = accent === 'amber'
    ? 'text-teal-500'
    : accent === 'green'
      ? 'text-emerald-500'
      : 'text-red-500'

  return (
    <div className="macos-card p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-0.5">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">{label}</span>
          <span className="text-[22px] font-bold text-foreground leading-tight tracking-tight">{value}</span>
        </div>
        <div className={`flex size-9 items-center justify-center rounded-lg ${iconBg}`}>
          <Icon className={`size-[18px] ${iconColor}`} strokeWidth={1.8} />
        </div>
      </div>
      {change && (
        <div className="flex items-center gap-1.5">
          {isPositive ? (
            <ArrowUpRight className="size-3 text-emerald-500" strokeWidth={2.5} />
          ) : (
            <ArrowDownRight className="size-3 text-red-500" strokeWidth={2.5} />
          )}
          <span className={`text-[11px] font-semibold ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
            {Math.abs(change.value)}%
          </span>
          <span className="text-[11px] text-muted-foreground">{change.label}</span>
        </div>
      )}
    </div>
  )
}

interface DispenserData {
  id: string
  name: string
  status: string
  fuelType: string
  volume: number
  nozzle: string
}

function DispenserCard({ dispenser }: { dispenser: DispenserData }) {
  const statusConfig: Record<string, { dot: string; label: string; badgeBg: string }> = {
    dispensing: { dot: 'macos-status-online', label: 'Dispensing', badgeBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
    active: { dot: 'macos-status-online', label: 'Active', badgeBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
    idle: { dot: 'macos-status-warning', label: 'Idle', badgeBg: 'bg-teal-500/10 text-teal-600 dark:text-teal-400' },
    maintenance: { dot: 'macos-status-error', label: 'Maintenance', badgeBg: 'bg-red-500/10 text-red-600 dark:text-red-400' },
    error: { dot: 'macos-status-error', label: 'Error', badgeBg: 'bg-red-500/10 text-red-600 dark:text-red-400' },
  }
  const config = statusConfig[dispenser.status] || statusConfig.idle
  const isError = dispenser.status === 'error' || dispenser.status === 'maintenance'

  return (
    <div className="macos-card p-4 flex flex-col gap-2 transition-shadow duration-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`macos-status-dot ${config.dot}`} />
          <span className="text-[13px] font-semibold text-foreground">{dispenser.name}</span>
        </div>
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${config.badgeBg}`}>
          {config.label}
        </span>
      </div>
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-muted-foreground">{dispenser.fuelType}</span>
        <span className="font-mono text-muted-foreground">Nozzle {dispenser.nozzle}</span>
      </div>
      {!isError ? (
        <div className="flex items-baseline gap-1 mt-0.5">
          <span className="text-[18px] font-bold text-foreground">{dispenser.volume.toLocaleString()}</span>
          <span className="text-[11px] text-muted-foreground">L today</span>
        </div>
      ) : (
        <div className="flex items-center gap-1.5 mt-0.5">
          <AlertTriangle className="size-3 text-red-500" />
          <span className="text-[11px] text-red-500 font-medium">Maintenance required</span>
        </div>
      )}
    </div>
  )
}

function TankLevelBar({ tank }: { tank: TankLevel }) {
  const barColor = tank.level > 50
    ? 'bg-emerald-500'
    : tank.level >= 25
      ? 'bg-teal-500'
      : 'bg-red-500'
  const trackColor = tank.level > 50
    ? 'bg-emerald-500/10'
    : tank.level >= 25
      ? 'bg-teal-500/10'
      : 'bg-red-500/10'
  const textColor = tank.level > 50
    ? 'text-emerald-600 dark:text-emerald-400'
    : tank.level >= 25
      ? 'text-teal-600 dark:text-teal-400'
      : 'text-red-600 dark:text-red-400'

  return (
    <div className="macos-group-item">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <Droplets className={`size-3.5 ${textColor}`} strokeWidth={1.8} />
          <span className="text-[13px] font-medium text-foreground">{tank.product}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-muted-foreground">
            {tank.currentLitres.toLocaleString()} / {tank.capacity.toLocaleString()} L
          </span>
          <span className={`text-[13px] font-bold ${textColor} tabular-nums min-w-[40px] text-right`}>
            {tank.level}%
          </span>
        </div>
      </div>
      <div className={`h-1.5 w-full rounded-full ${trackColor} overflow-hidden`}>
        <div
          className={`h-full rounded-full ${barColor} transition-all duration-500 ease-out`}
          style={{ width: `${Math.min(tank.level, 100)}%` }}
        />
      </div>
      <div className="flex items-center justify-between mt-1">
        <span className="text-[10px] text-muted-foreground">Tank {tank.id.slice(0, 8)}</span>
        <span className="text-[10px] text-muted-foreground">{tank.temperature}°C · {tank.waterLevel}mm water</span>
      </div>
    </div>
  )
}

// ── AI Insight derived from dashboard data ──────────────────

interface AIInsight {
  id: string
  type: 'critical' | 'warning' | 'info'
  icon: React.ElementType
  title: string
  description: string
}

function generateInsights(data: DashboardData): AIInsight[] {
  const insights: AIInsight[] = []

  // Tank level alerts
  data.tankLevels.forEach((tank) => {
    if (tank.level < 20) {
      insights.push({
        id: `tank-critical-${tank.id}`,
        type: 'critical',
        icon: Droplets,
        title: `${tank.product} tank below 20% — schedule delivery`,
        description: `${tank.product} tank at ${tank.level}%. ${tank.currentLitres.toLocaleString()} L remaining. Recommend scheduling delivery immediately.`,
      })
    } else if (tank.level < 30) {
      insights.push({
        id: `tank-warning-${tank.id}`,
        type: 'warning',
        icon: Droplets,
        title: `${tank.product} tank at ${tank.level}% — monitor closely`,
        description: `${tank.currentLitres.toLocaleString()} L remaining out of ${tank.capacity.toLocaleString()} L capacity. Consider scheduling a top-up.`,
      })
    }
  })

  // Revenue trend insight
  if (data.kpis.revenue.today > 0 && data.kpis.revenue.week > 0) {
    const dailyAvg = data.kpis.revenue.week / 7
    const pctChange = ((data.kpis.revenue.today - dailyAvg) / dailyAvg) * 100
    if (Math.abs(pctChange) > 5) {
      insights.push({
        id: 'revenue-trend',
        type: pctChange > 0 ? 'info' : 'warning',
        icon: TrendingUp,
        title: `Today's revenue ${pctChange > 0 ? 'up' : 'down'} ${Math.abs(pctChange).toFixed(1)}% vs weekly avg`,
        description: `Today: ${formatPKR(data.kpis.revenue.today)}. Weekly average: ${formatPKR(Math.round(dailyAvg))}. ${pctChange > 0 ? 'Strong performance, ensure adequate staffing.' : 'Consider promotional activities to boost sales.'}`,
      })
    }
  }

  // Alerts from KPIs
  if (data.kpis.alerts.critical > 0) {
    insights.push({
      id: 'alerts-critical',
      type: 'critical',
      icon: Zap,
      title: `${data.kpis.alerts.critical} critical alert${data.kpis.alerts.critical > 1 ? 's' : ''} require attention`,
      description: `${data.kpis.alerts.critical} critical and ${data.kpis.alerts.warning} warning alerts are active. Review and resolve immediately.`,
    })
  }

  // Always add at least one info insight if we have data
  if (insights.length === 0) {
    insights.push({
      id: 'all-clear',
      type: 'info',
      icon: TrendingUp,
      title: 'All systems operating normally',
      description: `Station ${data.stationInfo.name} is operational. Shift ${data.stationInfo.shift} is active with ${data.employeeOnDuty} employees on duty.`,
    })
  }

  return insights
}

// ── Main Component ──────────────────────────────────────────

export default function DashboardOverview() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/dashboard')
      if (!res.ok) throw new Error('Failed to load dashboard data')
      const json = await res.json()
      setData(json)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const aiInsights = useMemo(() => {
    if (!data) return []
    return generateInsights(data)
  }, [data])

  const avgTankLevel = useMemo(() => {
    if (!data || data.tankLevels.length === 0) return 0
    const total = data.tankLevels.reduce((sum, t) => sum + t.level, 0)
    return Math.round(total / data.tankLevels.length)
  }, [data])

  // Build dispenser data from KPIs (we don't have full dispenser list from /api/dashboard)
  // The API returns activePumps count, we'll show that
  const activeDispenserCount = data?.kpis.activePumps.value ?? 0
  const totalDispensers = data?.kpis.activePumps.total ?? 0

  // ── Loading State ──
  if (loading && !data) {
    return (
      <div className="space-y-6 macos-fade-in">
        <div className="flex items-end justify-between">
          <div>
            <div className="h-6 w-40 bg-muted/30 rounded animate-pulse" />
            <div className="h-4 w-64 bg-muted/20 rounded animate-pulse mt-2" />
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="macos-card p-4 h-[100px] animate-pulse bg-muted/10" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="macos-card p-5 lg:col-span-2 h-[280px] animate-pulse bg-muted/10" />
          <div className="macos-card p-5 h-[280px] animate-pulse bg-muted/10" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="macos-card p-4 h-[100px] animate-pulse bg-muted/10" />
          ))}
        </div>
      </div>
    )
  }

  // ── Error State ──
  if (error && !data) {
    return (
      <div className="macos-card p-8 flex flex-col items-center justify-center text-center min-h-[300px]">
        <AlertTriangle className="size-10 text-teal-500 mb-4" />
        <h3 className="text-[15px] font-semibold text-foreground mb-1">Failed to load dashboard</h3>
        <p className="text-[13px] text-muted-foreground mb-4">{error}</p>
        <button
          onClick={fetchData}
          className="macos-btn flex items-center gap-1.5"
        >
          <RefreshCw className="size-3.5" />
          Retry
        </button>
      </div>
    )
  }

  if (!data) return null

  const revenueChartData = data.revenueChart.map((p) => ({
    day: p.hour,
    revenue: p.value,
  }))

  return (
    <div className="space-y-6 macos-fade-in">
      {/* ── Page Header ── */}
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-[20px] font-bold text-foreground tracking-tight">Dashboard</h2>
          <p className="text-[13px] text-muted-foreground mt-0.5">{data.stationInfo.name} — {data.stationInfo.shift}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-black/[0.03] dark:bg-white/[0.04]">
            <div className="macos-status-dot macos-status-online" />
            <span className="text-[11px] font-medium text-muted-foreground">Live</span>
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="macos-btn-secondary text-[11px] flex items-center gap-1.5 px-3 py-1.5"
          >
            {loading ? (
              <Loader2 className="size-3 animate-spin" strokeWidth={1.8} />
            ) : (
              <RefreshCw className="size-3" strokeWidth={1.8} />
            )}
            Refresh
          </button>
        </div>
      </div>

      {/* ── Top Stats Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Today's Revenue"
          value={formatPKR(data.kpis.revenue.today)}
          icon={DollarSign}
          accent="amber"
        />
        <StatCard
          label="Fuel Sales"
          value={`${data.kpis.fuelSold.value.toLocaleString()} L`}
          icon={Fuel}
          accent="amber"
        />
        <StatCard
          label="Active Pumps"
          value={`${activeDispenserCount}/${totalDispensers}`}
          icon={Activity}
          accent="green"
        />
        <StatCard
          label="Tank Levels"
          value={`${avgTankLevel}% Avg`}
          icon={Droplets}
          accent={avgTankLevel > 50 ? 'amber' : 'red'}
        />
      </div>

      {/* ── Revenue Chart + AI Insights ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue Chart */}
        <div className="macos-card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-[13px] font-semibold text-foreground">Revenue — Today</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Hourly revenue across all fuel types</p>
            </div>
            {data.kpis.netProfit.value > 0 && (
              <div className="flex items-center gap-1.5">
                <TrendingUp className="size-3.5 text-emerald-500" strokeWidth={2} />
                <span className="text-[11px] font-semibold text-emerald-500">Net Profit</span>
                <span className="text-[11px] text-muted-foreground">{formatCompactPKR(data.kpis.netProfit.value)}</span>
              </div>
            )}
          </div>
          {revenueChartData.length > 0 ? (
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueChartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="amberGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#e8930c" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#e8930c" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 11, fill: '#86868b' }}
                    axisLine={false}
                    tickLine={false}
                    dy={8}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#86868b' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v: number) => formatCompactPKR(v)}
                    dx={-4}
                  />
                  <Tooltip content={<RevenueTooltip />} cursor={{ stroke: '#e8930c', strokeWidth: 1, strokeDasharray: '4 4' }} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#e8930c"
                    strokeWidth={2}
                    fill="url(#amberGradient)"
                    dot={false}
                    activeDot={{ r: 4, fill: '#e8930c', stroke: '#ffffff', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-muted-foreground text-[13px]">
              No revenue data available yet today
            </div>
          )}
        </div>

        {/* AI Insights */}
        <div className="macos-card p-5 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex size-7 items-center justify-center rounded-lg bg-teal-500/10">
              <Brain className="size-4 text-teal-500" strokeWidth={1.8} />
            </div>
            <div>
              <h3 className="text-[13px] font-semibold text-foreground">AI Insights</h3>
              <p className="text-[10px] text-muted-foreground">{aiInsights.length} active alert{aiInsights.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <div className="flex flex-col gap-2.5 flex-1">
            {aiInsights.map((insight) => {
              const typeStyles = {
                critical: 'border-l-red-500 bg-red-500/[0.03] dark:bg-red-500/[0.05]',
                warning: 'border-l-teal-500 bg-teal-500/[0.03] dark:bg-teal-500/[0.05]',
                info: 'border-l-emerald-500 bg-emerald-500/[0.03] dark:bg-emerald-500/[0.05]',
              }
              const iconColor = {
                critical: 'text-red-500',
                warning: 'text-teal-500',
                info: 'text-emerald-500',
              }
              const Icon = insight.icon
              return (
                <div key={insight.id} className={`border-l-2 rounded-r-lg p-3 ${typeStyles[insight.type]} transition-colors duration-150`}>
                  <div className="flex items-start gap-2.5">
                    <Icon className={`size-4 mt-0.5 shrink-0 ${iconColor[insight.type]}`} strokeWidth={1.8} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-foreground leading-snug">{insight.title}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{insight.description}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          <button className="macos-btn-secondary mt-4 w-full flex items-center justify-center gap-1.5 text-[11px] py-2">
            View All Insights
            <ChevronRight className="size-3" strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* ── Fuel Breakdown ── */}
      {data.fuelBreakdown.length > 0 && (
        <div>
          <div className="macos-section-header px-0 mb-3">Fuel Sales Breakdown</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {data.fuelBreakdown.map((fuel) => (
              <div key={fuel.type} className="macos-card p-4 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Fuel className="size-3.5 text-teal-500" strokeWidth={1.8} />
                  <span className="text-[13px] font-semibold text-foreground">{fuel.type}</span>
                </div>
                <div className="text-[18px] font-bold text-foreground">{fuel.volume.toLocaleString()}<span className="text-[11px] text-muted-foreground ml-1">L</span></div>
                <div className="text-[12px] text-muted-foreground">{formatCompactPKR(fuel.revenue)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Tank Overview + Recent Transactions ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Tank Overview */}
        <div>
          <div className="macos-section-header px-0 mb-3">Tank Overview</div>
          {data.tankLevels.length > 0 ? (
            <div className="macos-group">
              {data.tankLevels.map((tank) => (
                <TankLevelBar key={tank.id} tank={tank} />
              ))}
            </div>
          ) : (
            <div className="macos-card p-6 text-center text-muted-foreground text-[13px]">
              No tank data available
            </div>
          )}
        </div>

        {/* Recent Transactions */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="macos-section-header px-0">Recent Transactions</div>
            <button className="text-[11px] font-medium text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 flex items-center gap-1 transition-colors">
              View All
              <ChevronRight className="size-3" strokeWidth={2} />
            </button>
          </div>
          {data.recentTransactions.length > 0 ? (
            <div className="macos-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="macos-table">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Pump</th>
                      <th>Product</th>
                      <th className="text-right">Litres</th>
                      <th className="text-right">Amount</th>
                      <th>Payment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentTransactions.map((tx) => (
                      <tr key={tx.id}>
                        <td>
                          <span className="font-mono text-[12px] text-foreground">{tx.time}</span>
                        </td>
                        <td>
                          <span className="text-[12px] text-foreground">{tx.pump}</span>
                        </td>
                        <td>
                          <span className="text-[12px] text-foreground">{tx.product}</span>
                        </td>
                        <td className="text-right">
                          <span className="text-[12px] text-foreground tabular-nums">{tx.litres} L</span>
                        </td>
                        <td className="text-right">
                          <span className="text-[12px] font-semibold text-foreground tabular-nums">
                            {formatPKR(tx.amount)}
                          </span>
                        </td>
                        <td>
                          <span className={`macos-pill ${
                            tx.payment === 'Cash'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : tx.payment === 'Fleet card' || tx.payment === 'Fleet Card'
                                ? 'bg-teal-500/10 text-teal-600 dark:text-teal-400'
                                : 'bg-secondary text-secondary-foreground'
                          }`}>
                            {tx.payment}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="macos-card p-6 text-center text-muted-foreground text-[13px]">
              No recent transactions
            </div>
          )}
        </div>
      </div>

      {/* ── Quick Actions Footer ── */}
      <div className="macos-card p-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Truck className="size-4 text-teal-500" strokeWidth={1.8} />
            <span className="text-[13px] font-medium text-foreground">Quick Actions</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button className="macos-btn text-[12px] py-1.5 px-3">
              Schedule Delivery
            </button>
            <button className="macos-btn-secondary text-[12px] py-1.5 px-3">
              Run Shift Report
            </button>
            <button className="macos-btn-secondary text-[12px] py-1.5 px-3">
              Update Prices
            </button>
            <button className="macos-btn-secondary text-[12px] py-1.5 px-3">
              Emergency Stop
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
