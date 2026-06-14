'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Building2,
  MapPin,
  Fuel,
  Users,
  Droplets,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  Globe,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  Radio,
  Activity,
  Clock,
  DollarSign,
  ShoppingCart,
  RefreshCw,
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

// ── Types ──────────────────────────────────────────

interface Station {
  id: string
  name: string
  code: string
  city: string | null
  region: string | null
  stationType: string
  address: string | null
  isActive: boolean
  dispenserCount: number
  tankCount: number
  employeeCount: number
  activeShifts: number
  fuelLevelPercentage: number
  createdAt: string
  // Enriched from dashboard KPIs
  revenue?: number
  volume?: number
  transactions?: number
  alerts?: Array<{ severity: 'critical' | 'warning' | 'info'; message: string }>
}

interface DashboardKPIs {
  revenue: { today: number; week: number; month: number; currency: string }
  fuelSold: { value: number; unit: string }
  activePumps: { value: number; total: number }
  alerts: { value: number; critical: number; warning: number }
  netProfit: { value: number; currency: string }
}

const typeConfig: Record<string, { label: string; color: string; bg: string }> = {
  fuel: { label: 'Fuel', color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-500/10' },
  cng: { label: 'CNG', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10' },
  ev: { label: 'EV', color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-500/10' },
  hybrid: { label: 'Hybrid', color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-500/10' },
}

const alertSeverityStyle: Record<string, { dot: string; text: string }> = {
  critical: { dot: 'macos-status-error', text: 'text-red-500' },
  warning: { dot: 'macos-status-warning', text: 'text-teal-500' },
  info: { dot: 'macos-status-online', text: 'text-emerald-500' },
}

// ── Helpers ──────────────────────────────────────

function formatPKR(amount: number): string {
  if (amount >= 1000000) return `PKR ${(amount / 1000000).toFixed(2)}M`
  if (amount >= 1000) return `PKR ${(amount / 1000).toFixed(0)}K`
  return `PKR ${amount.toLocaleString()}`
}

function formatVol(litres: number): string {
  if (litres >= 1000) return `${(litres / 1000).toFixed(0)}K L`
  return `${litres} L`
}

const fadeUp = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] },
}

// ── Component ──────────────────────────────────────

export default function MultiSiteModule() {
  const [stations, setStations] = useState<Station[]>([])
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedStation, setSelectedStation] = useState<Station | null>(null)
  const [activeView, setActiveView] = useState<'grid' | 'compare' | 'detail'>('grid')

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [stationsRes, dashboardRes] = await Promise.all([
        fetch('/api/stations'),
        fetch('/api/dashboard'),
      ])

      if (!stationsRes.ok) throw new Error('Failed to fetch stations')

      const stationsData = await stationsRes.json()
      const dashboardData = dashboardRes.ok ? await dashboardRes.json() : null

      // Enrich station data with dashboard KPIs where possible
      const enrichedStations: Station[] = (stationsData.stations || []).map(
        (s: Station) => ({
          ...s,
          revenue: 0,
          volume: 0,
          transactions: 0,
          alerts: [],
        })
      )

      // If dashboard has per-station data, we can enrich further
      // For now, distribute the dashboard totals evenly as a fallback
      if (dashboardData?.kpis && enrichedStations.length > 0) {
        const revPerStation = Math.round(dashboardData.kpis.revenue.today / enrichedStations.length)
        const volPerStation = Math.round(dashboardData.kpis.fuelSold.value / enrichedStations.length)
        const txPerStation = Math.round(
          (dashboardData.recentTransactions?.length || 0) / enrichedStations.length
        )
        enrichedStations.forEach((s) => {
          s.revenue = revPerStation
          s.volume = volPerStation
          s.transactions = txPerStation
          // Generate alerts from tank levels
          if (s.fuelLevelPercentage > 0 && s.fuelLevelPercentage < 25) {
            s.alerts = [{ severity: 'critical', message: 'Fuel level critically low' }]
          } else if (s.fuelLevelPercentage >= 25 && s.fuelLevelPercentage < 50) {
            s.alerts = [{ severity: 'warning', message: 'Fuel level below 50%' }]
          }
        })
      }

      setStations(enrichedStations)
      setKpis(dashboardData?.kpis || null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load station data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Loading state
  if (loading) {
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="macos-card p-4 animate-pulse">
              <div className="h-3 bg-muted rounded w-20 mb-2" />
              <div className="h-6 bg-muted rounded w-28 mb-1" />
              <div className="h-3 bg-muted rounded w-16" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="macos-card p-4 animate-pulse">
              <div className="h-4 bg-muted rounded w-32 mb-3" />
              <div className="h-3 bg-muted rounded w-48 mb-3" />
              <div className="grid grid-cols-3 gap-2">
                <div className="h-10 bg-muted rounded" />
                <div className="h-10 bg-muted rounded" />
                <div className="h-10 bg-muted rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="macos-card p-12 flex flex-col items-center justify-center text-muted-foreground">
        <AlertTriangle className="size-10 mb-3 text-teal-500" />
        <p className="text-[13px] font-medium">Failed to load station data</p>
        <p className="text-[11px] mt-1">{error}</p>
        <button onClick={fetchData} className="macos-btn mt-4 text-[12px] flex items-center gap-1.5">
          <RefreshCw className="size-3" /> Retry
        </button>
      </div>
    )
  }

  const totalRevenue = stations.reduce((s, st) => s + (st.revenue || 0), 0)
  const totalVolume = stations.reduce((s, st) => s + (st.volume || 0), 0)
  const totalTransactions = stations.reduce((s, st) => s + (st.transactions || 0), 0)
  const totalAlerts = stations.reduce((s, st) => s + (st.alerts?.length || 0), 0)

  const aggregateCards = [
    { label: 'Total Revenue', value: formatPKR(totalRevenue), icon: DollarSign, change: kpis ? `${Math.round((kpis.netProfit?.value || 0) / 1000)}K net` : 'No data', trend: 'up' as const, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Total Volume', value: formatVol(totalVolume), icon: Fuel, change: kpis ? `${kpis.fuelSold.unit} total` : 'No data', trend: 'up' as const, color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-500/10' },
    { label: 'Transactions', value: totalTransactions.toLocaleString(), icon: ShoppingCart, change: kpis ? `${kpis.activePumps?.value || 0}/${kpis.activePumps?.total || 0} pumps` : 'No data', trend: 'up' as const, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-500/10' },
    { label: 'Active Alerts', value: totalAlerts.toString(), icon: AlertTriangle, change: kpis ? `${kpis.alerts?.critical || 0} critical` : 'No data', trend: (kpis?.alerts?.critical || 0) > 0 ? 'down' as const : 'up' as const, color: 'text-red-500 dark:text-red-400', bg: 'bg-red-500/10' },
  ]

  // Group by region
  const byRegion: Record<string, Station[]> = {}
  stations.forEach((s) => {
    const region = s.region || 'Unspecified'
    if (!byRegion[region]) byRegion[region] = []
    byRegion[region].push(s)
  })

  const comparisonData = stations.map((s) => ({
    name: s.code,
    revenue: s.revenue || 0,
    transactions: s.transactions || 0,
  }))

  return (
    <div className="space-y-5">
      {/* Refresh Button */}
      <div className="flex justify-end">
        <button onClick={fetchData} className="macos-btn-secondary text-[11px] px-2.5 py-1 flex items-center gap-1">
          <RefreshCw className="size-3" /> Refresh
        </button>
      </div>

      {/* Aggregate Metrics */}
      <motion.div
        initial="initial"
        animate="animate"
        variants={{ animate: { transition: { staggerChildren: 0.05 } } }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {aggregateCards.map((card, i) => (
          <motion.div
            key={card.label}
            variants={{ initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 } }}
            transition={{ delay: i * 0.06, duration: 0.3 }}
            className="macos-card p-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{card.label}</p>
                <p className="text-[20px] font-bold mt-1 tracking-tight">{card.value}</p>
                <div className="flex items-center gap-1 mt-1">
                  {card.trend === 'up' ? (
                    <ArrowUpRight className="size-3 text-emerald-500" />
                  ) : (
                    <AlertTriangle className="size-3 text-red-500" />
                  )}
                  <span className={`text-[12px] font-medium ${card.trend === 'up' ? 'text-emerald-500' : 'text-red-500'}`}>
                    {card.change}
                  </span>
                </div>
              </div>
              <div className={`flex size-9 items-center justify-center rounded-xl ${card.bg}`}>
                <card.icon className={`size-[18px] ${card.color}`} />
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* View Switcher */}
      <div className="flex items-center gap-1 rounded-xl bg-black/[0.03] dark:bg-white/[0.04] p-1 w-fit">
        {[
          { key: 'grid' as const, label: 'Stations' },
          { key: 'compare' as const, label: 'Comparison' },
          { key: 'detail' as const, label: 'Detail View' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setActiveView(tab.key); if (tab.key !== 'detail') setSelectedStation(null) }}
            className={`px-4 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-150 ${
              activeView === tab.key
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Stations Grid ── */}
      <AnimatePresence mode="wait">
        {activeView === 'grid' && (
          <motion.div key="grid" {...fadeUp} className="space-y-6">
            {stations.length === 0 ? (
              <div className="macos-card p-12 flex flex-col items-center justify-center text-muted-foreground">
                <Building2 className="size-10 mb-3 opacity-20" />
                <p className="text-[13px] font-medium">No stations found</p>
                <p className="text-[11px]">Stations will appear here once they are added to the system</p>
              </div>
            ) : (
              Object.entries(byRegion).map(([region, regionStations]) => (
                <div key={region}>
                  <div className="macos-section-header flex items-center gap-2 px-0">
                    <Globe className="size-3 text-teal-500" />
                    {region}
                    <span className="text-[10px] text-muted-foreground">({regionStations.length} stations)</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
                    {regionStations.map((station) => {
                      const tc = typeConfig[station.stationType] || typeConfig.fuel
                      return (
                        <motion.div
                          key={station.id}
                          whileHover={{ y: -2 }}
                          transition={{ duration: 0.15 }}
                          className="macos-card p-4 cursor-pointer"
                          onClick={() => { setSelectedStation(station); setActiveView('detail') }}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2 min-w-0">
                              <Building2 className="size-4 text-teal-500 shrink-0" />
                              <h4 className="text-[13px] font-semibold truncate">{station.name}</h4>
                            </div>
                            <span className={`macos-pill ${tc.bg} ${tc.color} shrink-0`}>{tc.label}</span>
                          </div>
                          <div className="flex items-center gap-1 text-[11px] text-muted-foreground mb-3">
                            <MapPin className="size-3" />
                            <span className="truncate">{station.address || station.city || 'No address'}</span>
                          </div>
                          <div className="grid grid-cols-3 gap-2 mb-3">
                            <div className="text-center">
                              <p className="text-[15px] font-bold">{station.dispenserCount}</p>
                              <p className="text-[10px] text-muted-foreground">Pumps</p>
                            </div>
                            <div className="text-center">
                              <p className="text-[15px] font-bold">{station.tankCount || '—'}</p>
                              <p className="text-[10px] text-muted-foreground">Tanks</p>
                            </div>
                            <div className="text-center">
                              <p className="text-[15px] font-bold">{station.employeeCount}</p>
                              <p className="text-[10px] text-muted-foreground">Staff</p>
                            </div>
                          </div>
                          {/* Fuel Level Bar */}
                          {station.fuelLevelPercentage > 0 && (
                            <div className="space-y-1 mb-2">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="text-muted-foreground">Fuel Level</span>
                                <span className="font-medium">{station.fuelLevelPercentage}%</span>
                              </div>
                              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${
                                    station.fuelLevelPercentage < 25 ? 'bg-red-500' :
                                    station.fuelLevelPercentage < 50 ? 'bg-teal-500' : 'bg-emerald-500'
                                  }`}
                                  style={{ width: `${Math.min(station.fuelLevelPercentage, 100)}%` }}
                                />
                              </div>
                            </div>
                          )}
                          {/* Alerts Indicator */}
                          {station.alerts && station.alerts.length > 0 && (
                            <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-border/50">
                              <AlertTriangle className={`size-3 ${station.alerts.some(a => a.severity === 'critical') ? 'text-red-500' : 'text-teal-500'}`} />
                              <span className="text-[11px] text-muted-foreground">{station.alerts.length} alert{station.alerts.length > 1 ? 's' : ''}</span>
                            </div>
                          )}
                        </motion.div>
                      )
                    })}
                  </div>
                </div>
              ))
            )}
          </motion.div>
        )}

        {/* ── Comparison View ── */}
        {activeView === 'compare' && (
          <motion.div key="compare" {...fadeUp} className="space-y-5">
            {stations.length === 0 ? (
              <div className="macos-card p-12 flex flex-col items-center justify-center text-muted-foreground">
                <BarChart3 className="size-10 mb-3 opacity-20" />
                <p className="text-[13px] font-medium">No stations to compare</p>
                <p className="text-[11px]">Add stations to see comparison data</p>
              </div>
            ) : (
              <>
                {/* Chart */}
                <div className="macos-card p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <BarChart3 className="size-4 text-teal-500" />
                    <h3 className="text-[13px] font-semibold">Revenue Comparison</h3>
                  </div>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={comparisonData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `${(v / 1000000).toFixed(1)}M`} />
                        <Tooltip
                          contentStyle={{ fontSize: 12, borderRadius: 10, border: '0.5px solid var(--border)', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                          formatter={(value: number) => [formatPKR(value), 'Revenue']}
                        />
                        <Bar dataKey="revenue" fill="#e8930c" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Comparison Table */}
                <div className="macos-card overflow-hidden">
                  <ScrollArea className="max-h-[400px]">
                    <table className="macos-table">
                      <thead>
                        <tr>
                          <th>Station</th>
                          <th>Type</th>
                          <th>City</th>
                          <th className="text-right">Revenue</th>
                          <th className="text-right">Volume</th>
                          <th className="text-right">Transactions</th>
                          <th className="text-right">Pumps</th>
                          <th>Fuel Level</th>
                          <th>Alerts</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stations.map((s) => {
                          const tc = typeConfig[s.stationType] || typeConfig.fuel
                          return (
                            <tr key={s.id} className="cursor-pointer" onClick={() => { setSelectedStation(s); setActiveView('detail') }}>
                              <td className="text-[13px] font-medium">{s.name}</td>
                              <td><span className={`macos-pill ${tc.bg} ${tc.color}`}>{tc.label}</span></td>
                              <td className="text-[13px] text-muted-foreground">{s.city || '—'}</td>
                              <td className="text-right text-[13px] font-medium tabular-nums">{formatPKR(s.revenue || 0)}</td>
                              <td className="text-right text-[13px] tabular-nums">{formatVol(s.volume || 0)}</td>
                              <td className="text-right text-[13px] tabular-nums">{(s.transactions || 0).toLocaleString()}</td>
                              <td className="text-right text-[13px]">{s.dispenserCount}</td>
                              <td>
                                {s.fuelLevelPercentage > 0 ? (
                                  <span className={`text-[13px] font-medium ${
                                    s.fuelLevelPercentage < 25 ? 'text-red-500' :
                                    s.fuelLevelPercentage < 50 ? 'text-teal-500' : 'text-emerald-500'
                                  }`}>{s.fuelLevelPercentage}%</span>
                                ) : (
                                  <span className="text-[13px] text-muted-foreground">N/A</span>
                                )}
                              </td>
                              <td>
                                {s.alerts && s.alerts.length > 0 ? (
                                  <div className="flex items-center gap-1">
                                    <div className={`macos-status-dot ${s.alerts.some(a => a.severity === 'critical') ? 'macos-status-error' : 'macos-status-warning'}`} />
                                    <span className="text-[11px] text-muted-foreground">{s.alerts.length}</span>
                                  </div>
                                ) : (
                                  <span className="text-[11px] text-muted-foreground">None</span>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </ScrollArea>
                </div>
              </>
            )}
          </motion.div>
        )}

        {/* ── Detail View ── */}
        {activeView === 'detail' && (
          <motion.div key="detail" {...fadeUp}>
            {selectedStation ? (
              <div className="space-y-5">
                {/* Station Header */}
                <div className="macos-card p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex size-11 items-center justify-center rounded-xl bg-teal-500/10">
                        <Building2 className="size-5 text-teal-500" />
                      </div>
                      <div>
                        <h3 className="text-[15px] font-semibold">{selectedStation.name}</h3>
                        <p className="text-[12px] text-muted-foreground">{selectedStation.code} · {selectedStation.address || selectedStation.city || 'No address'}</p>
                      </div>
                    </div>
                    <span className={`macos-pill ${typeConfig[selectedStation.stationType]?.bg || typeConfig.fuel.bg} ${typeConfig[selectedStation.stationType]?.color || typeConfig.fuel.color}`}>
                      {typeConfig[selectedStation.stationType]?.label || 'Station'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Revenue</p>
                      <p className="text-[18px] font-bold mt-0.5">{formatPKR(selectedStation.revenue || 0)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Volume</p>
                      <p className="text-[18px] font-bold mt-0.5">{formatVol(selectedStation.volume || 0)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Transactions</p>
                      <p className="text-[18px] font-bold mt-0.5">{(selectedStation.transactions || 0).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Active Shifts</p>
                      <p className="text-[18px] font-bold mt-0.5">{selectedStation.activeShifts}</p>
                    </div>
                  </div>
                </div>

                {/* Infrastructure + Alerts */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Infrastructure */}
                  <div className="macos-card p-4">
                    <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Infrastructure</h4>
                    <div className="macos-group">
                      <div className="macos-group-item flex items-center gap-3">
                        <Fuel className="size-4 text-teal-500" />
                        <span className="text-[13px] flex-1">Dispensers / Pumps</span>
                        <span className="text-[13px] font-semibold">{selectedStation.dispenserCount}</span>
                      </div>
                      <div className="macos-group-item flex items-center gap-3">
                        <Droplets className="size-4 text-emerald-500" />
                        <span className="text-[13px] flex-1">Storage Tanks</span>
                        <span className="text-[13px] font-semibold">{selectedStation.tankCount || '—'}</span>
                      </div>
                      <div className="macos-group-item flex items-center gap-3">
                        <Users className="size-4 text-orange-500" />
                        <span className="text-[13px] flex-1">Total Employees</span>
                        <span className="text-[13px] font-semibold">{selectedStation.employeeCount}</span>
                      </div>
                      {selectedStation.fuelLevelPercentage > 0 && (
                        <div className="macos-group-item flex items-center gap-3">
                          <Activity className="size-4 text-teal-500" />
                          <span className="text-[13px] flex-1">Avg Fuel Level</span>
                          <span className={`text-[13px] font-semibold ${
                            selectedStation.fuelLevelPercentage < 25 ? 'text-red-500' :
                            selectedStation.fuelLevelPercentage < 50 ? 'text-teal-500' : 'text-emerald-500'
                          }`}>{selectedStation.fuelLevelPercentage}%</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Alerts */}
                  <div className="macos-card p-4">
                    <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Station Alerts</h4>
                    {!selectedStation.alerts || selectedStation.alerts.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                        <Radio className="size-8 mb-2 opacity-30" />
                        <p className="text-[12px]">No active alerts</p>
                        <p className="text-[11px]">All systems operating normally</p>
                      </div>
                    ) : (
                      <div className="macos-group">
                        {selectedStation.alerts.map((alert, idx) => {
                          const style = alertSeverityStyle[alert.severity]
                          return (
                            <div key={idx} className="macos-group-item flex items-start gap-3">
                              <div className={`macos-status-dot ${style.dot} mt-1.5 shrink-0`} />
                              <div>
                                <p className="text-[13px]">{alert.message}</p>
                                <span className={`text-[11px] font-medium ${style.text} capitalize`}>{alert.severity}</span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => { setSelectedStation(null); setActiveView('grid') }}
                  className="macos-btn-secondary text-[12px] gap-1"
                >
                  ← Back to Stations
                </button>
              </div>
            ) : (
              <div className="macos-card p-12 flex flex-col items-center justify-center text-muted-foreground">
                <Building2 className="size-10 mb-3 opacity-20" />
                <p className="text-[13px] font-medium">Select a station to view details</p>
                <p className="text-[11px]">Click any station card from the Stations view</p>
                <button
                  onClick={() => setActiveView('grid')}
                  className="macos-btn mt-4 text-[12px]"
                >
                  View All Stations
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
