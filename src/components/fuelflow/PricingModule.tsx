'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  DollarSign,
  TrendingUp,
  Monitor,
  Clock,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  BarChart3,
  Zap,
  Droplets,
  Flame,
  Plus,
  Signal,
  Loader2,
  AlertTriangle,
} from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts'

// ── Types ──────────────────────────────────────────────────

interface FuelPrice {
  id: string
  fuelType: string
  fuelGrade: string | null
  pricePerUnit: number
  previousPrice: number | null
  currency: string
  effectiveFrom: string
  effectiveTo: string | null
  status: string
  stationId: string | null
  updatedBy: string | null
}

interface PriceBoard {
  id: string
  name: string
  boardType: string
  ipAddress: string | null
  status: string
  lastSyncAt: string | null
  isActive: boolean
  displayContent: string | null
}

// ── Helpers ───────────────────────────────────────────────

const pkr = (n: number) => `PKR ${n.toFixed(2)}`

const statusDotMap: Record<string, string> = {
  online: 'macos-status-online',
  active: 'macos-status-online',
  warning: 'macos-status-warning',
  error: 'macos-status-error',
  offline: 'macos-status-offline',
  maintenance: 'macos-status-warning',
}

type TabKey = 'current' | 'history' | 'boards' | 'schedule'

const tabs: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: 'current', label: 'Current Prices', icon: DollarSign },
  { key: 'history', label: 'Price History', icon: BarChart3 },
  { key: 'boards', label: 'Price Boards', icon: Monitor },
  { key: 'schedule', label: 'Schedule', icon: Calendar },
]

const fuelIconMap: Record<string, React.ElementType> = {
  petrol: Droplets,
  diesel: Flame,
  hobc: Zap,
  premium: DollarSign,
  default: DollarSign,
}

const fuelColorMap: Record<string, string> = {
  petrol: '#34c759',
  diesel: '#e8930c',
  hobc: '#ff9500',
  premium: '#ff6b35',
  default: '#e8930c',
}

function getFuelIcon(fuelType: string): React.ElementType {
  const lower = fuelType.toLowerCase()
  for (const [key, Icon] of Object.entries(fuelIconMap)) {
    if (lower.includes(key)) return Icon
  }
  return fuelIconMap.default
}

function getFuelColor(fuelType: string): string {
  const lower = fuelType.toLowerCase()
  for (const [key, color] of Object.entries(fuelColorMap)) {
    if (lower.includes(key)) return color
  }
  return fuelColorMap.default
}

// ── Custom Tooltip ────────────────────────────────────────

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload) return null
  return (
    <div className="macos-card p-3 shadow-lg !rounded-lg">
      <p className="text-[11px] font-semibold text-muted-foreground mb-1.5">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 text-[12px]">
          <div className="size-2 rounded-full" style={{ background: p.color }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-semibold">PKR {p.value}</span>
        </div>
      ))}
    </div>
  )
}

// ── Component ─────────────────────────────────────────────

export default function PricingModule() {
  const [activeTab, setActiveTab] = useState<TabKey>('current')
  const [prices, setPrices] = useState<FuelPrice[]>([])
  const [priceBoards, setPriceBoards] = useState<PriceBoard[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [pricesRes, boardsRes] = await Promise.all([
        fetch('/api/prices'),
        fetch('/api/price-boards'),
      ])
      if (!pricesRes.ok) throw new Error('Failed to load fuel prices')
      if (!boardsRes.ok) throw new Error('Failed to load price boards')
      const pricesJson = await pricesRes.json()
      const boardsJson = await boardsRes.json()
      setPrices(pricesJson.prices || [])
      setPriceBoards(boardsJson.boards || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Build price history from all prices (including expired ones if they were loaded)
  // Since the API only returns active prices, we'll derive a simple history from current data
  const priceHistoryData = (() => {
    // Group prices by fuel type
    const typeMap: Record<string, { name: string; current: number; previous: number | null; effectiveFrom: string }> = {}
    for (const p of prices) {
      const key = p.fuelType.toLowerCase()
      if (!typeMap[key] || new Date(p.effectiveFrom) > new Date(typeMap[key].effectiveFrom)) {
        typeMap[key] = {
          name: p.fuelType.charAt(0).toUpperCase() + p.fuelType.slice(1),
          current: p.pricePerUnit,
          previous: p.previousPrice,
          effectiveFrom: p.effectiveFrom,
        }
      }
    }
    return typeMap
  })()

  return (
    <div className="space-y-5">
      {/* ── Tab Bar ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 -mb-1">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key
            const Icon = tab.icon
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium transition-all duration-150 whitespace-nowrap ${
                  isActive
                    ? 'bg-teal-500/10 text-teal-600 dark:text-teal-400'
                    : 'text-muted-foreground hover:bg-black/[0.03] dark:hover:bg-white/[0.05] hover:text-foreground'
                }`}
              >
                <Icon className="size-3.5" strokeWidth={isActive ? 2 : 1.5} />
                {tab.label}
              </button>
            )
          })}
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="macos-btn-secondary flex items-center gap-1.5 text-[12px] px-3 py-1.5"
        >
          {loading ? (
            <Loader2 className="size-3 animate-spin" />
          ) : (
            <RefreshCw className="size-3" />
          )}
          Refresh
        </button>
      </div>

      {/* ── Tab Content ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
        >
          {activeTab === 'current' && <CurrentPricesTab prices={prices} loading={loading} error={error} onRetry={fetchData} />}
          {activeTab === 'history' && <PriceHistoryTab priceHistoryData={priceHistoryData} />}
          {activeTab === 'boards' && <PriceBoardsTab boards={priceBoards} onSync={fetchData} />}
          {activeTab === 'schedule' && <ScheduleTab prices={prices} />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

// ── Current Prices Tab ────────────────────────────────────

function CurrentPricesTab({ prices, loading, error, onRetry }: {
  prices: FuelPrice[]
  loading: boolean
  error: string | null
  onRetry: () => void
}) {
  if (loading && prices.length === 0) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="macos-card p-5 h-[180px] animate-pulse bg-muted/10" />
        ))}
      </div>
    )
  }

  if (error && prices.length === 0) {
    return (
      <div className="macos-card p-8 flex flex-col items-center justify-center text-center min-h-[200px]">
        <AlertTriangle className="size-10 text-teal-500 mb-4" />
        <h3 className="text-[15px] font-semibold text-foreground mb-1">Failed to load prices</h3>
        <p className="text-[13px] text-muted-foreground mb-4">{error}</p>
        <button onClick={onRetry} className="macos-btn flex items-center gap-1.5">
          <RefreshCw className="size-3.5" /> Retry
        </button>
      </div>
    )
  }

  if (prices.length === 0) {
    return (
      <div className="macos-card p-8 flex flex-col items-center justify-center text-center min-h-[200px]">
        <DollarSign className="size-10 text-muted-foreground mb-4" />
        <h3 className="text-[15px] font-semibold text-foreground mb-1">No active prices</h3>
        <p className="text-[13px] text-muted-foreground">Set up fuel prices to get started.</p>
      </div>
    )
  }

  // Deduplicate by fuel type (keep latest active price per type)
  const uniquePrices = (() => {
    const map = new Map<string, FuelPrice>()
    for (const p of prices) {
      const key = p.fuelType.toLowerCase()
      const existing = map.get(key)
      if (!existing || new Date(p.effectiveFrom) > new Date(existing.effectiveFrom)) {
        map.set(key, p)
      }
    }
    return Array.from(map.values())
  })()

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {uniquePrices.map((fuel, i) => {
          const change = fuel.previousPrice ? fuel.pricePerUnit - fuel.previousPrice : 0
          const isUp = change > 0
          const Icon = getFuelIcon(fuel.fuelType)
          const color = getFuelColor(fuel.fuelType)
          return (
            <motion.div
              key={fuel.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07, duration: 0.35 }}
              className="macos-card p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="size-8 rounded-lg flex items-center justify-center" style={{ background: `${color}15` }}>
                    <Icon className="size-4" style={{ color }} />
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold">{fuel.fuelType.charAt(0).toUpperCase() + fuel.fuelType.slice(1)}</p>
                    <p className="text-[11px] text-muted-foreground">{fuel.fuelGrade || 'Standard'}</p>
                  </div>
                </div>
                <span className="macos-pill bg-teal-500/10 text-teal-600 dark:text-teal-400">Active</span>
              </div>

              {/* Big Number */}
              <p className="text-[32px] font-bold tracking-tight text-foreground leading-none">
                {fuel.pricePerUnit.toFixed(2)}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{fuel.currency}/L</p>

              {/* Change indicator */}
              {fuel.previousPrice !== null && fuel.previousPrice > 0 && (
                <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-border">
                  {isUp ? (
                    <ArrowUpRight className="size-3.5 text-red-500" />
                  ) : (
                    <ArrowDownRight className="size-3.5 text-emerald-500" />
                  )}
                  <span className={`text-[12px] font-semibold ${isUp ? 'text-red-500' : 'text-emerald-500'}`}>
                    PKR {Math.abs(change).toFixed(2)}
                  </span>
                  <span className="text-[11px] text-muted-foreground">vs previous</span>
                </div>
              )}
            </motion.div>
          )
        })}
      </div>

      {/* Last Update Info */}
      <div className="flex items-center justify-between macos-card p-3 px-4">
        <div className="flex items-center gap-2">
          <div className="macos-status-dot macos-status-online" />
          <span className="text-[12px] text-muted-foreground">Prices synced — Last updated: <span className="font-medium text-foreground">{uniquePrices.length > 0 ? new Date(uniquePrices[0].effectiveFrom).toLocaleString() : 'N/A'}</span></span>
        </div>
        <button onClick={onRetry} className="macos-btn-secondary gap-1">
          <RefreshCw className="size-3" /> Sync Now
        </button>
      </div>
    </div>
  )
}

// ── Price History Tab ─────────────────────────────────────

function PriceHistoryTab({ priceHistoryData }: { priceHistoryData: Record<string, { name: string; current: number; previous: number | null; effectiveFrom: string }> }) {
  const entries = Object.values(priceHistoryData)

  if (entries.length === 0) {
    return (
      <div className="macos-card p-8 flex flex-col items-center justify-center text-center min-h-[200px]">
        <BarChart3 className="size-10 text-muted-foreground mb-4" />
        <h3 className="text-[15px] font-semibold text-foreground mb-1">No price history</h3>
        <p className="text-[13px] text-muted-foreground">Price history will appear once prices are updated.</p>
      </div>
    )
  }

  // Build chart data - show current vs previous for each fuel type
  const chartData = entries.map(e => ({
    name: e.name,
    current: e.current,
    previous: e.previous || 0,
  }))

  return (
    <div className="space-y-4">
      <div className="macos-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-[13px] font-semibold">Current vs Previous Prices</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">PKR per litre comparison</p>
          </div>
        </div>
        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                axisLine={{ stroke: 'var(--border)' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${v}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }}
              />
              <Line type="monotone" dataKey="current" name="Current" stroke="#e8930c" strokeWidth={2} dot={{ r: 4, fill: '#e8930c' }} activeDot={{ r: 5 }} />
              <Line type="monotone" dataKey="previous" name="Previous" stroke="#e8930c" strokeOpacity={0.4} strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3, fill: '#e8930c', fillOpacity: 0.4 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Price Change Table */}
      <div className="macos-card overflow-hidden">
        <table className="macos-table">
          <thead>
            <tr>
              <th>Fuel Type</th>
              <th className="text-right">Previous Price</th>
              <th className="text-right">Current Price</th>
              <th className="text-right">Change</th>
              <th>Effective From</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => {
              const change = entry.previous ? entry.current - entry.previous : 0
              const isUp = change > 0
              return (
                <tr key={entry.name}>
                  <td className="font-semibold">{entry.name}</td>
                  <td className="text-right font-mono">{entry.previous ? pkr(entry.previous) : '—'}</td>
                  <td className="text-right font-mono font-semibold">{pkr(entry.current)}</td>
                  <td className="text-right">
                    {entry.previous ? (
                      <span className={`inline-flex items-center gap-1 font-semibold text-[12px] ${isUp ? 'text-red-500' : change < 0 ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                        {isUp ? <ArrowUpRight className="size-3" /> : change < 0 ? <ArrowDownRight className="size-3" /> : null}
                        PKR {Math.abs(change).toFixed(2)}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="text-[12px] text-muted-foreground">{new Date(entry.effectiveFrom).toLocaleDateString()}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Price Boards Tab ──────────────────────────────────────

function PriceBoardsTab({ boards, onSync }: { boards: PriceBoard[]; onSync: () => void }) {
  const onlineCount = boards.filter(b => b.status === 'online' || b.status === 'active').length

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="macos-card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Boards Online</p>
          <p className="text-[20px] font-bold text-emerald-600 dark:text-emerald-400 mt-1">{onlineCount}/{boards.length}</p>
        </div>
        <div className="macos-card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Board Types</p>
          <p className="text-[20px] font-bold text-foreground mt-1">{new Set(boards.map(b => b.boardType)).size}</p>
        </div>
        <div className="macos-card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Last Sync</p>
          <p className="text-[16px] font-bold text-foreground mt-1">
            {boards.length > 0 && boards[0].lastSyncAt
              ? new Date(boards[0].lastSyncAt).toLocaleTimeString()
              : 'Never'}
          </p>
        </div>
      </div>

      {boards.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {boards.map((board) => {
            const isOnline = board.status === 'online' || board.status === 'active'
            const isWarning = board.status === 'warning' || board.status === 'maintenance'
            return (
              <motion.div
                key={board.id}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                className="macos-card p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`size-9 rounded-lg flex items-center justify-center ${
                      isOnline ? 'bg-emerald-500/10' : isWarning ? 'bg-teal-500/10' : 'bg-red-500/10'
                    }`}>
                      <Monitor className={`size-4 ${isOnline ? 'text-emerald-500' : isWarning ? 'text-teal-500' : 'text-red-500'}`} />
                    </div>
                    <div>
                      <h4 className="text-[13px] font-semibold">{board.name}</h4>
                      <p className="text-[11px] text-muted-foreground">{board.boardType}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className={`macos-status-dot ${statusDotMap[board.status] || 'macos-status-offline'}`} />
                    <span className={`text-[11px] font-medium ${
                      isOnline ? 'text-emerald-600 dark:text-emerald-400' : isWarning ? 'text-teal-500' : 'text-red-500'
                    }`}>
                      {isOnline ? 'Online' : isWarning ? 'Delayed' : 'Offline'}
                    </span>
                  </div>
                </div>

                <div className="macos-group">
                  {board.ipAddress && (
                    <div className="macos-group-item flex justify-between !py-2 !px-3">
                      <span className="text-[11px] text-muted-foreground">IP Address</span>
                      <span className="text-[12px] font-mono">{board.ipAddress}</span>
                    </div>
                  )}
                  <div className="macos-group-item flex justify-between !py-2 !px-3">
                    <span className="text-[11px] text-muted-foreground">Last Sync</span>
                    <span className="text-[12px]">{board.lastSyncAt ? new Date(board.lastSyncAt).toLocaleTimeString() : 'Never'}</span>
                  </div>
                  <div className="macos-group-item !py-2 !px-3 !border-b-0">
                    <span className="text-[11px] text-muted-foreground">Display</span>
                    <p className="text-[11px] font-medium text-foreground mt-0.5">{board.displayContent || 'No content configured'}</p>
                  </div>
                </div>

                <button onClick={onSync} className="macos-btn-secondary w-full mt-3 gap-1 justify-center">
                  <RefreshCw className="size-3" /> Sync Prices
                </button>
              </motion.div>
            )
          })}
        </div>
      ) : (
        <div className="macos-card p-8 flex flex-col items-center justify-center text-center min-h-[200px]">
          <Monitor className="size-10 text-muted-foreground mb-4" />
          <h3 className="text-[15px] font-semibold text-foreground mb-1">No price boards</h3>
          <p className="text-[13px] text-muted-foreground">Register price boards to display fuel prices.</p>
        </div>
      )}
    </div>
  )
}

// ── Schedule Tab ──────────────────────────────────────────

function ScheduleTab({ prices }: { prices: FuelPrice[] }) {
  // Find prices with future effective dates
  const now = new Date()
  const scheduledChanges = prices
    .filter(p => new Date(p.effectiveFrom) > now)
    .map(p => ({
      id: p.id,
      fuelType: p.fuelType.charAt(0).toUpperCase() + p.fuelType.slice(1),
      newPrice: p.pricePerUnit,
      currentPrice: p.previousPrice || p.pricePerUnit,
      effectiveDate: p.effectiveFrom,
      status: 'pending' as const,
      source: 'OGRA Notification',
    }))

  return (
    <div className="space-y-4">
      {/* Upcoming Changes */}
      <div className="macos-card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Clock className="size-4 text-teal-500" />
            <h3 className="text-[13px] font-semibold">Scheduled Price Changes</h3>
          </div>
        </div>
        {scheduledChanges.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="macos-table">
              <thead>
                <tr>
                  <th>Fuel Type</th>
                  <th className="text-right">Current Price</th>
                  <th className="text-right">New Price</th>
                  <th className="text-right">Change</th>
                  <th>Effective Date</th>
                  <th>Source</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {scheduledChanges.map((sc) => {
                  const change = sc.newPrice - sc.currentPrice
                  const isUp = change > 0
                  return (
                    <tr key={sc.id}>
                      <td className="font-semibold">{sc.fuelType}</td>
                      <td className="text-right font-mono">{pkr(sc.currentPrice)}</td>
                      <td className="text-right font-mono font-semibold">{pkr(sc.newPrice)}</td>
                      <td className="text-right">
                        <span className={`inline-flex items-center gap-1 font-semibold text-[12px] ${isUp ? 'text-red-500' : 'text-emerald-500'}`}>
                          {isUp ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
                          PKR {Math.abs(change).toFixed(2)}
                        </span>
                      </td>
                      <td className="font-mono text-[12px]">{new Date(sc.effectiveDate).toLocaleDateString()}</td>
                      <td className="text-muted-foreground">{sc.source}</td>
                      <td>
                        <span className="macos-pill bg-teal-500/10 text-teal-600 dark:text-teal-400">
                          Pending
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 text-center text-muted-foreground text-[13px]">
            No scheduled price changes
          </div>
        )}
      </div>

      {/* OGRA Schedule Info */}
      <div className="macos-card p-4">
        <div className="flex items-start gap-3">
          <div className="size-9 rounded-lg flex items-center justify-center bg-teal-500/10 shrink-0">
            <Calendar className="size-4 text-teal-500" />
          </div>
          <div>
            <h4 className="text-[13px] font-semibold">OGRA Price Review Schedule</h4>
            <p className="text-[12px] text-muted-foreground mt-1">
              Prices are typically updated at midnight on the 1st and 16th of each month by OGRA notification.
            </p>
            <div className="flex items-center gap-1.5 mt-2">
              <div className="macos-status-dot macos-status-online" />
              <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">Auto-sync enabled — boards will update automatically</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
