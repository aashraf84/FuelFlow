'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Receipt,
  DollarSign,
  Fuel,
  Clock,
  CreditCard,
  Banknote,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Smartphone,
  Users,
  ChevronRight,
  Timer,
  UserCircle,
  Wallet,
  RefreshCw,
  Loader2,
  AlertTriangle,
} from 'lucide-react'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  AreaChart,
  Area,
} from 'recharts'

// ── Types ──────────────────────────────────────────────────

interface FuelingRecord {
  id: string
  fuelType: string
  volume: number
  totalAmount: number
  paymentMethod: string
  startedAt: string
  completedAt: string | null
  status: string
  vehiclePlate: string | null
  dispenser: { name: string; code: string } | null
  nozzle: { nozzleNumber: number; fuelType: string } | null
  attendant: { id: string; name: string } | null
  shift: { id: string; shiftNumber: number; status: string } | null
  fleetAccount: { id: string; companyName: string } | null
  loyaltyInfo: {
    customerName: string
    membershipTier: string
    currentPoints: number
    pointsEarned: number
  } | null
}

interface DashboardData {
  kpis: {
    revenue: { today: number; week: number; currency: string }
    fuelSold: { value: number; unit: string }
    activePumps: { value: number; total: number }
    netProfit: { value: number; currency: string }
  }
  revenueChart: { hour: string; value: number }[]
  fuelBreakdown: { type: string; volume: number; revenue: number }[]
  recentTransactions: {
    id: string
    time: string
    pump: string
    product: string
    litres: number
    amount: number
    payment: string
    attendant: string
  }[]
  shiftInfo: {
    id: string
    name: string
    attendant: string
    supervisor: string
    openedAt: string
    sales: number
    fuelSales: number
    retailSales: number
    cardSales: number
    fleetSales: number
    cashSales: number
    transactionCount: number
  } | null
  stationInfo: { name: string; code: string; status: string; shift: string }
}

// ── Helpers ──────────────────────────────────────────────────

function formatPKR(amount: number): string {
  return `PKR ${amount.toLocaleString('en-PK')}`
}

function formatCompactPKR(amount: number): string {
  if (amount >= 1000000) return `PKR ${(amount / 1000000).toFixed(1)}M`
  if (amount >= 1000) return `PKR ${(amount / 1000).toFixed(0)}K`
  return `PKR ${amount}`
}

const FUEL_COLORS: Record<string, string> = {
  petrol: '#e8930c',
  pmg: '#e8930c',
  diesel: '#34c759',
  hsd: '#34c759',
  hobc: '#ff9f0a',
  premium: '#ff6b35',
  xl: '#ff6b35',
  default: '#e8930c',
}

function getFuelColor(fuelType: string): string {
  const lower = fuelType.toLowerCase()
  for (const [key, color] of Object.entries(FUEL_COLORS)) {
    if (lower.includes(key)) return color
  }
  return FUEL_COLORS.default
}

// ── Main Component ───────────────────────────────────────────

export default function SalesModule() {
  const [activeTab, setActiveTab] = useState<'today' | 'transactions' | 'shift' | 'analytics'>('today')
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [fuelings, setFuelings] = useState<FuelingRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [dashRes, fuelingsRes] = await Promise.all([
        fetch('/api/dashboard'),
        fetch('/api/fuelings?limit=50'),
      ])
      if (!dashRes.ok) throw new Error('Failed to load dashboard data')
      if (!fuelingsRes.ok) throw new Error('Failed to load fueling data')
      const dashJson = await dashRes.json()
      const fuelingsJson = await fuelingsRes.json()
      setDashboardData(dashJson)
      setFuelings(fuelingsJson.fuelings || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Derived data
  const fuelBreakdown = dashboardData?.fuelBreakdown || []
  const revenueChart = dashboardData?.revenueChart || []
  const recentTransactions = dashboardData?.recentTransactions || []
  const shiftInfo = dashboardData?.shiftInfo || null

  const totalRevenue = fuelBreakdown.reduce((s, f) => s + f.revenue, 0)
  const totalVolume = fuelBreakdown.reduce((s, f) => s + f.volume, 0)
  const totalTransactions = recentTransactions.length
  const avgTransaction = totalTransactions > 0 ? Math.round(totalRevenue / totalTransactions) : 0

  // Payment method breakdown from fuelings
  const paymentMethods = (() => {
    const methodMap: Record<string, { value: number; count: number }> = {}
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayFuelings = fuelings.filter(f => {
      const d = new Date(f.completedAt || f.startedAt)
      return d >= today && f.status === 'completed'
    })
    for (const f of todayFuelings) {
      const method = f.paymentMethod.charAt(0).toUpperCase() + f.paymentMethod.slice(1)
      if (!methodMap[method]) methodMap[method] = { value: 0, count: 0 }
      methodMap[method].value += f.totalAmount
      methodMap[method].count += 1
    }
    const colorMap: Record<string, string> = {
      Cash: '#34c759',
      Card: '#e8930c',
      'Fleet card': '#ff9f0a',
      'Fleet Card': '#ff9f0a',
      Mobile: '#ff3b30',
    }
    return Object.entries(methodMap).map(([name, data]) => ({
      name,
      value: Math.round(data.value),
      color: colorMap[name] || '#e8930c',
      count: data.count,
    }))
  })()

  const tabs = [
    { key: 'today' as const, label: "Today's Sales" },
    { key: 'transactions' as const, label: 'Transactions' },
    { key: 'shift' as const, label: 'Shift' },
    { key: 'analytics' as const, label: 'Analytics' },
  ]

  // ── Loading State ──
  if (loading && !dashboardData) {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-5 w-32 bg-muted/30 rounded animate-pulse" />
            <div className="h-4 w-56 bg-muted/20 rounded animate-pulse mt-2" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="macos-card p-4 h-[90px] animate-pulse bg-muted/10" />
          ))}
        </div>
      </div>
    )
  }

  // ── Error State ──
  if (error && !dashboardData) {
    return (
      <div className="macos-card p-8 flex flex-col items-center justify-center text-center min-h-[300px]">
        <AlertTriangle className="size-10 text-teal-500 mb-4" />
        <h3 className="text-[15px] font-semibold text-foreground mb-1">Failed to load sales data</h3>
        <p className="text-[13px] text-muted-foreground mb-4">{error}</p>
        <button onClick={fetchData} className="macos-btn flex items-center gap-1.5">
          <RefreshCw className="size-3.5" /> Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[13px] font-semibold text-foreground">Fuel Sales</h2>
          <p className="text-[11px] text-muted-foreground mt-0.5">Transaction monitoring and revenue tracking</p>
        </div>
        <div className="flex items-center gap-2">
          {shiftInfo && (
            <div className="flex items-center gap-1.5 rounded-lg bg-card px-3 py-1.5 shadow-[0_0_0_0.5px_var(--border)]">
              <div className="macos-status-dot macos-status-online" />
              <span className="text-[11px] font-medium text-muted-foreground">{shiftInfo.name} Active</span>
            </div>
          )}
          <button
            onClick={fetchData}
            disabled={loading}
            className="macos-btn-secondary gap-1.5 flex items-center"
          >
            {loading ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <RefreshCw className="size-3.5" />
            )}
            Refresh
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
                layoutId="sales-tab-indicator"
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
        {activeTab === 'today' && (
          <motion.div
            key="today"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className="space-y-5"
          >
            {/* ── Stats Cards ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {[
                { label: 'Total Revenue', value: formatCompactPKR(totalRevenue), icon: DollarSign, accent: 'text-teal-500', bg: 'bg-teal-500/10' },
                { label: 'Total Volume', value: `${totalVolume.toLocaleString()} L`, icon: Fuel, accent: 'text-[#34c759]', bg: 'bg-[#34c759]/10' },
                { label: 'Transactions', value: totalTransactions.toString(), icon: Receipt, accent: 'text-[#ff9f0a]', bg: 'bg-[#ff9f0a]/10' },
                { label: 'Avg Transaction', value: formatPKR(avgTransaction), icon: TrendingUp, accent: 'text-[#ff3b30]', bg: 'bg-[#ff3b30]/10' },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.06 }}
                  className="macos-card p-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[11px] text-muted-foreground uppercase font-semibold tracking-wide">{stat.label}</p>
                      <p className="text-[22px] font-bold text-foreground mt-1 leading-none">{stat.value}</p>
                    </div>
                    <div className={`flex size-8 items-center justify-center rounded-lg ${stat.bg}`}>
                      <stat.icon className={`size-4 ${stat.accent}`} />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* ── Sales by Fuel Type ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {fuelBreakdown.map((fuel, i) => (
                <motion.div
                  key={fuel.type}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.15 + i * 0.06 }}
                  className="macos-card p-4"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="size-2.5 rounded-full" style={{ backgroundColor: getFuelColor(fuel.type) }} />
                    <p className="text-[13px] font-semibold text-foreground">{fuel.type}</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-muted-foreground uppercase font-semibold">Revenue</span>
                      <span className="text-[13px] font-semibold text-foreground">{formatCompactPKR(fuel.revenue)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-muted-foreground uppercase font-semibold">Volume</span>
                      <span className="text-[13px] font-medium text-foreground">{fuel.volume.toLocaleString()} L</span>
                    </div>
                    {/* Share bar */}
                    <div className="h-1.5 rounded-full bg-black/[0.04] dark:bg-white/[0.06] overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: totalRevenue > 0 ? `${(fuel.revenue / totalRevenue) * 100}%` : '0%' }}
                        transition={{ duration: 0.6, delay: 0.3 + i * 0.06 }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: getFuelColor(fuel.type) }}
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground text-right">{totalRevenue > 0 ? ((fuel.revenue / totalRevenue) * 100).toFixed(1) : 0}% of total</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* ── Hourly Revenue Chart + Payment Methods ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Hourly Revenue */}
              <div className="macos-card p-4 lg:col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-[13px] font-semibold text-foreground">Hourly Revenue</p>
                    <p className="text-[11px] text-muted-foreground">Today&apos;s revenue curve</p>
                  </div>
                  {revenueChart.length > 0 && (
                    <span className="macos-pill bg-[#34c759]/10 text-[#34c759]">
                      Peak: {revenueChart.reduce((max, p) => p.value > max.value ? p : max, revenueChart[0])?.hour || '--:--'}
                    </span>
                  )}
                </div>
                {revenueChart.length > 0 ? (
                  <div className="h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={revenueChart.map(p => ({ hour: p.hour, revenue: p.value }))} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                        <defs>
                          <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#e8930c" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#e8930c" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="hour" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}K`} />
                        <Tooltip
                          contentStyle={{ fontSize: 12, borderRadius: 10, border: '0.5px solid var(--border)', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', background: 'var(--card)' }}
                          formatter={(val: number) => [formatPKR(val), 'Revenue']}
                        />
                        <Area type="monotone" dataKey="revenue" stroke="#e8930c" strokeWidth={2} fill="url(#salesGradient)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-52 flex items-center justify-center text-muted-foreground text-[13px]">
                    No hourly data available
                  </div>
                )}
              </div>

              {/* Payment Methods Donut */}
              <div className="macos-card p-4">
                <p className="text-[13px] font-semibold text-foreground mb-1">Payment Methods</p>
                <p className="text-[11px] text-muted-foreground mb-3">Breakdown by method</p>
                {paymentMethods.length > 0 ? (
                  <>
                    <div className="h-44">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={paymentMethods}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={42}
                            outerRadius={62}
                            paddingAngle={3}
                            strokeWidth={0}
                          >
                            {paymentMethods.map((entry, index) => (
                              <Cell key={index} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{ fontSize: 12, borderRadius: 10, border: '0.5px solid var(--border)', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', background: 'var(--card)' }}
                            formatter={(val: number) => [formatPKR(val), 'Revenue']}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    {/* Payment method legend */}
                    <div className="space-y-2 mt-2">
                      {paymentMethods.map((pm) => {
                        const total = paymentMethods.reduce((s, p) => s + p.value, 0)
                        const pct = total > 0 ? ((pm.value / total) * 100).toFixed(0) : '0'
                        const icons: Record<string, React.ReactNode> = {
                          Cash: <Banknote className="size-3.5" style={{ color: pm.color }} />,
                          Card: <CreditCard className="size-3.5" style={{ color: pm.color }} />,
                          'Fleet card': <Wallet className="size-3.5" style={{ color: pm.color }} />,
                          'Fleet Card': <Wallet className="size-3.5" style={{ color: pm.color }} />,
                          Mobile: <Smartphone className="size-3.5" style={{ color: pm.color }} />,
                        }
                        return (
                          <div key={pm.name} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {icons[pm.name] || <Wallet className="size-3.5" style={{ color: pm.color }} />}
                              <span className="text-[12px] text-foreground">{pm.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[12px] font-medium text-foreground">{pct}%</span>
                              <span className="text-[11px] text-muted-foreground">({pm.count})</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </>
                ) : (
                  <div className="h-44 flex items-center justify-center text-muted-foreground text-[13px]">
                    No payment data
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'transactions' && (
          <motion.div
            key="transactions"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {/* Quick Stats from payment methods */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {paymentMethods.map((s) => {
                const icons: Record<string, React.ElementType> = {
                  Cash: Banknote,
                  Card: CreditCard,
                  'Fleet card': Wallet,
                  'Fleet Card': Wallet,
                  Mobile: Smartphone,
                }
                const Icon = icons[s.name] || Wallet
                return (
                  <div key={s.label || s.name} className="macos-card p-3 flex items-center gap-3">
                    <div className="flex size-8 items-center justify-center rounded-lg" style={{ backgroundColor: `${s.color}15` }}>
                      <Icon className="size-4" style={{ color: s.color }} />
                    </div>
                    <div>
                      <p className="text-[11px] text-muted-foreground uppercase font-semibold tracking-wide">{s.name} Sales</p>
                      <p className="text-[13px] font-semibold text-foreground">{formatCompactPKR(s.value)}</p>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Transactions Table */}
            <div className="macos-card overflow-hidden">
              <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between">
                <div>
                  <p className="text-[13px] font-semibold text-foreground">Recent Transactions</p>
                  <p className="text-[11px] text-muted-foreground">{fuelings.length} shown · Live feed</p>
                </div>
                <button className="macos-btn-secondary gap-1.5">
                  <Activity className="size-3" />
                  Export
                </button>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {fuelings.length > 0 ? (
                  <table className="macos-table">
                    <thead>
                      <tr>
                        <th>Time</th>
                        <th>Pump</th>
                        <th>Fuel</th>
                        <th className="text-right">Volume (L)</th>
                        <th className="text-right">Amount</th>
                        <th>Payment</th>
                        <th>Vehicle</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fuelings.map((f, i) => {
                        const time = f.completedAt
                          ? new Date(f.completedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
                          : '--:--'
                        const nozzle = f.nozzle ? `P${f.dispenser?.code || '?'}-N${f.nozzle.nozzleNumber}` : f.dispenser?.name || '?'
                        const paymentLabel = f.paymentMethod.charAt(0).toUpperCase() + f.paymentMethod.slice(1)
                        const paymentConfig: Record<string, { bg: string; text: string }> = {
                          Cash: { bg: 'bg-[#34c759]/10', text: 'text-[#34c759]' },
                          Card: { bg: 'bg-teal-500/10', text: 'text-teal-600 dark:text-teal-400' },
                          'Fleet card': { bg: 'bg-[#ff9f0a]/10', text: 'text-[#ff9f0a]' },
                          'Fleet Card': { bg: 'bg-[#ff9f0a]/10', text: 'text-[#ff9f0a]' },
                          Mobile: { bg: 'bg-[#ff3b30]/10', text: 'text-[#ff3b30]' },
                        }
                        const pc = paymentConfig[paymentLabel] || { bg: 'bg-secondary', text: 'text-secondary-foreground' }
                        return (
                          <motion.tr
                            key={f.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.15, delay: i * 0.02 }}
                          >
                            <td className="font-mono text-[12px]">{time}</td>
                            <td className="font-medium text-[12px]">{nozzle}</td>
                            <td>
                              <span className="macos-pill bg-teal-500/10 text-teal-600 dark:text-teal-400">{f.fuelType}</span>
                            </td>
                            <td className="text-right font-mono">{f.volume.toFixed(1)}</td>
                            <td className="text-right font-semibold">{formatPKR(f.totalAmount)}</td>
                            <td>
                              <span className={`macos-pill ${pc.bg} ${pc.text}`}>{paymentLabel}</span>
                            </td>
                            <td className="text-[12px] text-muted-foreground font-mono">{f.vehiclePlate || '—'}</td>
                          </motion.tr>
                        )
                      })}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-6 text-center text-muted-foreground text-[13px]">
                    No transactions found
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'shift' && (
          <motion.div
            key="shift"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {/* Current Shift Card */}
            <div className="macos-card p-5 border-l-[3px] border-l-teal-500">
              {shiftInfo ? (
                <>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 items-center justify-center rounded-xl bg-teal-500/10">
                        <UserCircle className="size-5 text-teal-500" />
                      </div>
                      <div>
                        <p className="text-[15px] font-semibold text-foreground">{shiftInfo.name} — In Progress</p>
                        <p className="text-[12px] text-muted-foreground">Operated by {shiftInfo.attendant}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="macos-status-dot macos-status-online" />
                      <span className="text-[11px] font-medium text-[#34c759]">Active</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                      { label: 'Start Time', value: new Date(shiftInfo.openedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }), icon: Clock },
                      { label: 'Total Sales', value: formatCompactPKR(shiftInfo.sales), icon: DollarSign },
                      { label: 'Fuel Sales', value: formatCompactPKR(shiftInfo.fuelSales), icon: Fuel },
                      { label: 'Transactions', value: shiftInfo.transactionCount.toString(), icon: Receipt },
                    ].map((item) => (
                      <div key={item.label}>
                        <div className="flex items-center gap-1.5 mb-1">
                          <item.icon className="size-3 text-muted-foreground" />
                          <p className="text-[11px] text-muted-foreground uppercase font-semibold tracking-wide">{item.label}</p>
                        </div>
                        <p className="text-[16px] font-bold text-foreground">{item.value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 pt-4 border-t border-border/50 flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <Banknote className="size-3.5 text-muted-foreground" />
                      <span className="text-[11px] text-muted-foreground">Cash Sales:</span>
                      <span className="text-[12px] font-medium text-foreground">{formatPKR(shiftInfo.cashSales)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CreditCard className="size-3.5 text-muted-foreground" />
                      <span className="text-[11px] text-muted-foreground">Card Sales:</span>
                      <span className="text-[12px] font-medium text-foreground">{formatPKR(shiftInfo.cardSales)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Wallet className="size-3.5 text-muted-foreground" />
                      <span className="text-[11px] text-muted-foreground">Fleet Sales:</span>
                      <span className="text-[12px] font-medium text-foreground">{formatPKR(shiftInfo.fleetSales)}</span>
                    </div>
                    <div className="flex-1" />
                    <button className="macos-btn gap-1.5">
                      <Timer className="size-3.5" />
                      Close Shift
                    </button>
                    <button className="macos-btn-secondary gap-1.5">
                      <Activity className="size-3.5" />
                      Reconcile
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center py-6">
                  <Clock className="size-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-[13px] font-semibold text-foreground">No Active Shift</p>
                  <p className="text-[11px] text-muted-foreground mt-1">Start a new shift to begin tracking sales</p>
                </div>
              )}
            </div>

            {/* Shift Performance */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Hourly breakdown */}
              <div className="macos-card p-4">
                <p className="text-[13px] font-semibold text-foreground mb-1">Shift Hourly Breakdown</p>
                <p className="text-[11px] text-muted-foreground mb-3">Revenue per hour this shift</p>
                {revenueChart.length > 0 ? (
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={revenueChart.map(p => ({ hour: p.hour, revenue: p.value }))} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                        <XAxis dataKey="hour" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}K`} />
                        <Tooltip
                          contentStyle={{ fontSize: 12, borderRadius: 10, border: '0.5px solid var(--border)', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', background: 'var(--card)' }}
                          formatter={(val: number) => [formatPKR(val), 'Revenue']}
                        />
                        <Bar dataKey="revenue" fill="#e8930c" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-48 flex items-center justify-center text-muted-foreground text-[13px]">
                    No hourly data available
                  </div>
                )}
              </div>

              {/* Payment method split for shift */}
              <div className="macos-card p-4">
                <p className="text-[13px] font-semibold text-foreground mb-1">Payment Distribution</p>
                <p className="text-[11px] text-muted-foreground mb-3">This shift&apos;s payment breakdown</p>
                {paymentMethods.length > 0 ? (
                  <div className="space-y-3">
                    {paymentMethods.map((pm) => {
                      const total = paymentMethods.reduce((s, p) => s + p.value, 0)
                      const pct = total > 0 ? ((pm.value / total) * 100).toFixed(1) : '0'
                      return (
                        <div key={pm.name} className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[12px] font-medium text-foreground">{pm.name}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-[12px] text-muted-foreground">{formatCompactPKR(pm.value)}</span>
                              <span className="text-[11px] font-semibold text-foreground w-10 text-right">{pct}%</span>
                            </div>
                          </div>
                          <div className="h-1.5 rounded-full bg-black/[0.04] dark:bg-white/[0.06] overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.5 }}
                              className="h-full rounded-full"
                              style={{ backgroundColor: pm.color }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="h-48 flex items-center justify-center text-muted-foreground text-[13px]">
                    No payment data available
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'analytics' && (
          <motion.div
            key="analytics"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {/* Revenue by Fuel Type */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Fuel Type Bar */}
              <div className="macos-card p-4">
                <p className="text-[13px] font-semibold text-foreground mb-1">Revenue by Fuel Type</p>
                <p className="text-[11px] text-muted-foreground mb-3">Today&apos;s sales distribution</p>
                {fuelBreakdown.length > 0 ? (
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={fuelBreakdown.map((f) => ({ name: f.type.split(' ')[0], revenue: f.revenue, fill: getFuelColor(f.type) }))}
                        margin={{ top: 4, right: 4, left: -10, bottom: 0 }}
                      >
                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}K`} />
                        <Tooltip
                          contentStyle={{ fontSize: 12, borderRadius: 10, border: '0.5px solid var(--border)', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', background: 'var(--card)' }}
                          formatter={(val: number) => [formatPKR(val), 'Revenue']}
                        />
                        <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
                          {fuelBreakdown.map((f, idx) => (
                            <Cell key={idx} fill={getFuelColor(f.type)} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-48 flex items-center justify-center text-muted-foreground text-[13px]">
                    No fuel data available
                  </div>
                )}
              </div>

              {/* Insights Panel */}
              <div className="macos-card p-4">
                <p className="text-[13px] font-semibold text-foreground mb-1">Sales Insights</p>
                <p className="text-[11px] text-muted-foreground mb-3">AI-powered observations</p>
                <div className="macos-group">
                  {fuelBreakdown.length > 0 ? (
                    <>
                      {/* Top fuel type */}
                      {(() => {
                        const topFuel = [...fuelBreakdown].sort((a, b) => b.revenue - a.revenue)[0]
                        return (
                          <motion.div
                            initial={{ opacity: 0, x: -6 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.2 }}
                            className="macos-group-item flex items-center gap-3 py-3"
                          >
                            <div className="flex size-8 items-center justify-center rounded-lg shrink-0" style={{ backgroundColor: `${getFuelColor(topFuel.type)}15` }}>
                              <Fuel className="size-4" style={{ color: getFuelColor(topFuel.type) }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[12px] font-medium text-foreground">Top Fuel</p>
                              <p className="text-[11px] text-muted-foreground">{totalRevenue > 0 ? ((topFuel.revenue / totalRevenue) * 100).toFixed(1) : 0}% of total revenue today</p>
                            </div>
                            <span className="text-[13px] font-semibold text-foreground shrink-0">{topFuel.type}</span>
                            <ChevronRight className="size-4 text-muted-foreground shrink-0" />
                          </motion.div>
                        )
                      })()}
                      {/* Peak hour */}
                      {revenueChart.length > 0 && (() => {
                        const peak = revenueChart.reduce((max, p) => p.value > max.value ? p : max, revenueChart[0])
                        return (
                          <motion.div
                            initial={{ opacity: 0, x: -6 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.2, delay: 0.06 }}
                            className="macos-group-item flex items-center gap-3 py-3"
                          >
                            <div className="flex size-8 items-center justify-center rounded-lg shrink-0 bg-[#34c759]15">
                              <TrendingUp className="size-4 text-[#34c759]" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[12px] font-medium text-foreground">Peak Hour</p>
                              <p className="text-[11px] text-muted-foreground">{formatCompactPKR(peak.value)} revenue</p>
                            </div>
                            <span className="text-[13px] font-semibold text-foreground shrink-0">{peak.hour}</span>
                            <ChevronRight className="size-4 text-muted-foreground shrink-0" />
                          </motion.div>
                        )
                      })()}
                      {/* Total volume */}
                      <motion.div
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2, delay: 0.12 }}
                        className="macos-group-item flex items-center gap-3 py-3"
                      >
                        <div className="flex size-8 items-center justify-center rounded-lg shrink-0 bg-teal-500/10">
                          <DollarSign className="size-4 text-teal-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-medium text-foreground">Avg Transaction</p>
                          <p className="text-[11px] text-muted-foreground">{totalTransactions} transactions today</p>
                        </div>
                        <span className="text-[13px] font-semibold text-foreground shrink-0">{formatPKR(avgTransaction)}</span>
                        <ChevronRight className="size-4 text-muted-foreground shrink-0" />
                      </motion.div>
                    </>
                  ) : (
                    <div className="p-4 text-center text-muted-foreground text-[13px]">
                      No analytics data available yet
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
