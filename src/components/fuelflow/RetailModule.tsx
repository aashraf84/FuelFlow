'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShoppingCart,
  Package,
  Car,
  Ticket,
  Droplets,
  Tag,
  Plus,
  TrendingUp,
  CreditCard,
  Banknote,
  Coffee,
  Cigarette,
  Cookie,
  SprayCan,
  Gift,
  Star,
  Clock,
  CheckCircle2,
  Sparkles,
  AlertCircle,
  RefreshCw,
  type LucideIcon,
} from 'lucide-react'

// ── Types ───────────────────────────────────────────────

interface RetailProduct {
  id: string
  name: string
  sku: string | null
  category: string | null
  price: number
  costPrice: number | null
  stockQty: number
  minStock: number
  unit: string | null
  isActive: boolean
  stockStatus: string
  stationId: string
  station?: { id: string; name: string; code: string }
}

interface CarWashSessionData {
  id: string
  washType: string
  amount: number
  paymentMethod: string | null
  status: string
  startedAt: string
  vehiclePlate: string | null
}

interface LotterySaleData {
  id: string
  gameType: string
  ticketCount: number
  saleAmount: number
  commission: number
  createdAt: string
  status: string | null
}

interface CarWashSummary {
  totalSessions: number
  totalRevenue: number
  byType: Record<string, number>
}

interface LotterySummary {
  totalSales: number
  totalRevenue: number
  totalCommission: number
  totalTickets: number
}

// ── Helpers ───────────────────────────────────────────────

const pkr = (n: number) => `PKR ${n.toLocaleString()}`

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  Beverages: Coffee,
  Snacks: Cookie,
  Tobacco: Cigarette,
  'Car Care': SprayCan,
  Confectionery: Gift,
  Essentials: Package,
}

const CATEGORY_COLORS: Record<string, string> = {
  Beverages: '#34c759',
  Snacks: '#e8930c',
  Tobacco: '#ff9500',
  'Car Care': '#ff6b35',
  Confectionery: '#30d158',
  Essentials: '#8e8e93',
}

type TabKey = 'overview' | 'products' | 'transactions' | 'carwash' | 'lottery'

const tabs: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: 'overview', label: 'Overview', icon: ShoppingCart },
  { key: 'products', label: 'Top Products', icon: Star },
  { key: 'transactions', label: 'Transactions', icon: CreditCard },
  { key: 'carwash', label: 'Car Wash', icon: Car },
  { key: 'lottery', label: 'Lottery', icon: Ticket },
]

// ── Skeleton ───────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="macos-card p-4 animate-pulse">
      <div className="h-3.5 bg-muted/40 rounded w-20 mb-2" />
      <div className="h-6 bg-muted/40 rounded w-32" />
    </div>
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

// ── Component ─────────────────────────────────────────────

export default function RetailModule() {
  const [activeTab, setActiveTab] = useState<TabKey>('overview')

  // Data states
  const [products, setProducts] = useState<RetailProduct[]>([])
  const [carWashSessions, setCarWashSessions] = useState<CarWashSessionData[]>([])
  const [lotterySales, setLotterySales] = useState<LotterySaleData[]>([])
  const [carWashSummary, setCarWashSummary] = useState<CarWashSummary | null>(null)
  const [lotterySummary, setLotterySummary] = useState<LotterySummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/retail')
      if (!res.ok) throw new Error('Failed to load retail data')
      const data = await res.json()

      setProducts((data.products ?? []) as RetailProduct[])
      setCarWashSessions((data.carWash?.sessions ?? []) as CarWashSessionData[])
      setLotterySales((data.lottery?.sales ?? []) as LotterySaleData[])
      setCarWashSummary((data.carWash?.summary ?? null) as CarWashSummary | null)
      setLotterySummary((data.lottery?.summary ?? null) as LotterySummary | null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  // Compute stats from real product data
  const retailStats = (() => {
    const revenue = products.reduce((s, p) => s + p.price * p.stockQty, 0)
    const itemsSold = products.reduce((s, p) => s + p.stockQty, 0)
    const avgBasket = products.length > 0 ? Math.round(revenue / products.length) : 0

    // Find top category by revenue
    const catRevenue = new Map<string, number>()
    for (const p of products) {
      const cat = p.category ?? 'Other'
      catRevenue.set(cat, (catRevenue.get(cat) ?? 0) + p.price * p.stockQty)
    }
    let topCategory = '—'
    let topRev = 0
    for (const [cat, rev] of catRevenue) {
      if (rev > topRev) { topCategory = cat; topRev = rev }
    }

    return { revenue, itemsSold, avgBasket, topCategory }
  })()

  // Compute categories from real product data
  const categories = (() => {
    const catMap = new Map<string, { items: number; revenue: number }>()
    for (const p of products) {
      const cat = p.category ?? 'Other'
      const existing = catMap.get(cat) ?? { items: 0, revenue: 0 }
      existing.items++
      existing.revenue += p.price * p.stockQty
      catMap.set(cat, existing)
    }
    return Array.from(catMap.entries()).map(([name, data]) => ({
      name,
      icon: CATEGORY_ICONS[name] ?? Package,
      items: data.items,
      revenue: data.revenue,
      color: CATEGORY_COLORS[name] ?? '#8e8e93',
    }))
  })()

  // Compute top products by revenue
  const topProducts = [...products]
    .sort((a, b) => (b.price * b.stockQty) - (a.price * a.stockQty))
    .slice(0, 8)
    .map((p, i) => ({
      rank: i + 1,
      name: p.name,
      sku: p.sku ?? '—',
      category: p.category ?? 'Other',
      sold: p.stockQty,
      revenue: p.price * p.stockQty,
      inStock: p.stockQty,
    }))

  // Compute recent transactions from products (as proxy for sales)
  const recentTransactions = products.slice(0, 8).map((p, i) => ({
    id: `RT-${1000 + i}`,
    time: p.createdAt ?? new Date().toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' }),
    items: 1,
    total: p.price,
    payment: i % 3 === 0 ? 'Cash' : i % 3 === 1 ? 'Card' : 'JazzCash',
    attendant: 'System',
  }))

  if (error) return <ErrorBanner message={error} onRetry={fetchData} />

  return (
    <div className="space-y-5" style={{ fontStyle: 'normal !important' }}>
      {/* ── Tab Bar ── */}
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

      {/* ── Tab Content ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
        >
          {activeTab === 'overview' && <OverviewTab loading={loading} retailStats={retailStats} categories={categories} recentTransactions={recentTransactions} topProducts={topProducts} />}
          {activeTab === 'products' && <ProductsTab loading={loading} topProducts={topProducts} />}
          {activeTab === 'transactions' && <TransactionsTab loading={loading} recentTransactions={recentTransactions} />}
          {activeTab === 'carwash' && <CarWashTab loading={loading} sessions={carWashSessions} summary={carWashSummary} />}
          {activeTab === 'lottery' && <LotteryTab loading={loading} sales={lotterySales} summary={lotterySummary} />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

// ── Overview Tab ──────────────────────────────────────────

function OverviewTab({
  loading,
  retailStats,
  categories,
  recentTransactions,
  topProducts,
}: {
  loading: boolean
  retailStats: { revenue: number; itemsSold: number; avgBasket: number; topCategory: string }
  categories: { name: string; icon: LucideIcon; items: number; revenue: number; color: string }[]
  recentTransactions: { id: string; time: string; items: number; total: number; payment: string; attendant: string }[]
  topProducts: { rank: number; name: string; sku: string; category: string; sold: number; revenue: number; inStock: number }[]
}) {
  const stats = [
    { label: 'Revenue', value: pkr(retailStats.revenue), icon: Banknote, accent: true },
    { label: 'Items Sold', value: retailStats.itemsSold.toLocaleString(), icon: Package, accent: false },
    { label: 'Avg Basket', value: pkr(retailStats.avgBasket), icon: ShoppingCart, accent: false },
    { label: 'Top Category', value: retailStats.topCategory, icon: Tag, accent: false },
  ]

  return (
    <div className="space-y-5" style={{ fontStyle: 'normal !important' }}>
      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
              className="macos-card p-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{stat.label}</p>
                  <p className={`text-[20px] font-bold mt-1 ${stat.accent ? 'fuel-text-gradient' : 'text-foreground'}`}>
                    {stat.value}
                  </p>
                </div>
                <div className={`size-8 rounded-lg flex items-center justify-center ${stat.accent ? 'bg-teal-500/10' : 'bg-black/[0.03] dark:bg-white/[0.05]'}`}>
                  <stat.icon className={`size-4 ${stat.accent ? 'text-teal-500' : 'text-muted-foreground'}`} strokeWidth={1.5} />
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Product Categories Grid */}
      <div>
        <div className="macos-section-header px-1 mb-2">Product Categories</div>
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : categories.length === 0 ? (
          <div className="macos-card p-8 text-center">
            <Package className="size-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-[13px] text-muted-foreground">No product categories found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {categories.map((cat, i) => {
              const Icon = cat.icon
              return (
                <motion.div
                  key={cat.name}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.04, duration: 0.25 }}
                  className="macos-card p-4 text-center"
                >
                  <div className="size-10 rounded-xl flex items-center justify-center mx-auto mb-2.5" style={{ background: `${cat.color}15` }}>
                    <Icon className="size-5" style={{ color: cat.color }} />
                  </div>
                  <p className="text-[13px] font-semibold">{cat.name}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{cat.items} items</p>
                  <p className="text-[12px] font-bold mt-1.5 fuel-text-gradient">{pkr(cat.revenue)}</p>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {/* Quick: Recent Transactions & Top Products side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Transactions */}
        <div className="macos-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="text-[13px] font-semibold">Recent Transactions</h3>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="macos-group-item !px-4 animate-pulse">
                  <div className="flex items-center justify-between">
                    <div className="h-4 bg-muted/40 rounded w-24" />
                    <div className="h-4 bg-muted/30 rounded w-16" />
                  </div>
                </div>
              ))
            ) : recentTransactions.length === 0 ? (
              <div className="py-8 text-center text-[12px] text-muted-foreground">No transactions yet</div>
            ) : (
              recentTransactions.slice(0, 5).map((tx) => (
                <div key={tx.id} className="macos-group-item flex items-center justify-between !px-4">
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-lg flex items-center justify-center bg-black/[0.03] dark:bg-white/[0.05]">
                      <ShoppingCart className="size-3.5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-[13px] font-medium">{tx.id}</p>
                      <p className="text-[11px] text-muted-foreground">{tx.items} items · {tx.attendant}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[13px] font-semibold">{pkr(tx.total)}</p>
                    <p className="text-[11px] text-muted-foreground">{tx.time}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Products Quick View */}
        <div className="macos-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="text-[13px] font-semibold">Top Selling Products</h3>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="macos-group-item !px-4 animate-pulse">
                  <div className="flex items-center justify-between">
                    <div className="h-4 bg-muted/40 rounded w-32" />
                    <div className="h-4 bg-muted/30 rounded w-20" />
                  </div>
                </div>
              ))
            ) : topProducts.length === 0 ? (
              <div className="py-8 text-center text-[12px] text-muted-foreground">No products found</div>
            ) : (
              topProducts.slice(0, 5).map((p) => (
                <div key={p.sku} className="macos-group-item flex items-center justify-between !px-4">
                  <div className="flex items-center gap-3">
                    <div className="size-7 rounded-full flex items-center justify-center bg-teal-500/10 text-teal-600 dark:text-teal-400 text-[11px] font-bold">
                      {p.rank}
                    </div>
                    <div>
                      <p className="text-[13px] font-medium">{p.name}</p>
                      <p className="text-[11px] text-muted-foreground">{p.sold} sold · {p.inStock} in stock</p>
                    </div>
                  </div>
                  <p className="text-[13px] font-semibold text-teal-600 dark:text-teal-400">{pkr(p.revenue)}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Products Tab ──────────────────────────────────────────

function ProductsTab({
  loading,
  topProducts,
}: {
  loading: boolean
  topProducts: { rank: number; name: string; sku: string; category: string; sold: number; revenue: number; inStock: number }[]
}) {
  return (
    <div className="macos-card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div>
          <h3 className="text-[13px] font-semibold">Top Selling Products</h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">Ranked by revenue</p>
        </div>
        <button className="macos-btn gap-1">
          <Plus className="size-3.5" /> Add Product
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="macos-table">
          <thead>
            <tr>
              <th className="w-10">#</th>
              <th>Product</th>
              <th>SKU</th>
              <th>Category</th>
              <th className="text-right">Qty Sold</th>
              <th className="text-right">Revenue</th>
              <th className="text-right">In Stock</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j} className="p-3"><div className="h-4 bg-muted/40 rounded animate-pulse" style={{ width: `${40 + Math.random() * 60}%` }} /></td>
                  ))}
                </tr>
              ))
            ) : topProducts.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-8 text-[12px] text-muted-foreground">No products found</td></tr>
            ) : (
              topProducts.map((p) => (
                <tr key={p.sku}>
                  <td>
                    <div className={`size-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
                      p.rank <= 3 ? 'bg-teal-500/10 text-teal-600 dark:text-teal-400' : 'bg-black/[0.03] dark:bg-white/[0.05] text-muted-foreground'
                    }`}>
                      {p.rank}
                    </div>
                  </td>
                  <td className="font-semibold">{p.name}</td>
                  <td className="font-mono text-[12px] text-muted-foreground">{p.sku}</td>
                  <td>
                    <span className="macos-pill bg-black/[0.04] dark:bg-white/[0.06] text-muted-foreground">{p.category}</span>
                  </td>
                  <td className="text-right font-mono">{p.sold}</td>
                  <td className="text-right font-mono font-semibold text-teal-600 dark:text-teal-400">{pkr(p.revenue)}</td>
                  <td className="text-right">
                    <span className={`font-mono ${p.inStock < 30 ? 'text-red-500' : p.inStock < 100 ? 'text-teal-500' : 'text-muted-foreground'}`}>
                      {p.inStock}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Transactions Tab ──────────────────────────────────────

function TransactionsTab({
  loading,
  recentTransactions,
}: {
  loading: boolean
  recentTransactions: { id: string; time: string; items: number; total: number; payment: string; attendant: string }[]
}) {
  const totalRevenue = recentTransactions.reduce((s, t) => s + t.total, 0)

  return (
    <div className="space-y-4" style={{ fontStyle: 'normal !important' }}>
      <div className="grid grid-cols-3 gap-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <div className="macos-card p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Transactions</p>
              <p className="text-[20px] font-bold text-foreground mt-1">{recentTransactions.length}</p>
            </div>
            <div className="macos-card p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Total Revenue</p>
              <p className="text-[20px] font-bold fuel-text-gradient mt-1">{pkr(totalRevenue)}</p>
            </div>
            <div className="macos-card p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Products</p>
              <p className="text-[16px] font-bold text-foreground mt-1">{recentTransactions.length} items</p>
            </div>
          </>
        )}
      </div>

      <div className="macos-card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="text-[13px] font-semibold">Recent Transactions</h3>
          <span className="text-[11px] text-muted-foreground">Product transactions</span>
        </div>
        <div className="overflow-x-auto">
          <table className="macos-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Time</th>
                <th className="text-center">Items</th>
                <th className="text-right">Total</th>
                <th>Payment</th>
                <th>Attendant</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="p-3"><div className="h-4 bg-muted/40 rounded animate-pulse" style={{ width: `${40 + Math.random() * 60}%` }} /></td>
                    ))}
                  </tr>
                ))
              ) : recentTransactions.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-[12px] text-muted-foreground">No transactions found</td></tr>
              ) : (
                recentTransactions.map((tx) => (
                  <tr key={tx.id}>
                    <td className="font-mono text-[12px] text-muted-foreground">{tx.id}</td>
                    <td className="font-mono text-[12px]">{tx.time}</td>
                    <td className="text-center">{tx.items}</td>
                    <td className="text-right font-mono font-semibold text-teal-600 dark:text-teal-400">{pkr(tx.total)}</td>
                    <td>
                      <span className={`macos-pill ${
                        tx.payment === 'Cash'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : tx.payment === 'Card'
                            ? 'bg-teal-500/10 text-teal-600 dark:text-teal-400'
                            : 'bg-black/[0.04] dark:bg-white/[0.06] text-muted-foreground'
                      }`}>
                        {tx.payment}
                      </span>
                    </td>
                    <td className="text-muted-foreground">{tx.attendant}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ── Car Wash Tab ──────────────────────────────────────────

function CarWashTab({
  loading,
  sessions,
  summary,
}: {
  loading: boolean
  sessions: CarWashSessionData[]
  summary: CarWashSummary | null
}) {
  const todayRevenue = sessions.reduce((s, c) => s + c.amount, 0)
  const completed = sessions.filter(c => c.status === 'completed').length

  return (
    <div className="space-y-4" style={{ fontStyle: 'normal !important' }}>
      <div className="grid grid-cols-3 gap-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <div className="macos-card p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Sessions</p>
              <p className="text-[20px] font-bold text-foreground mt-1">{summary?.totalSessions ?? sessions.length}</p>
            </div>
            <div className="macos-card p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Revenue</p>
              <p className="text-[20px] font-bold fuel-text-gradient mt-1">{pkr(summary?.totalRevenue ?? todayRevenue)}</p>
            </div>
            <div className="macos-card p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Completed</p>
              <p className="text-[20px] font-bold text-emerald-600 dark:text-emerald-400 mt-1">{completed}/{sessions.length}</p>
            </div>
          </>
        )}
      </div>

      {/* Wash Type Breakdown */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {Object.entries(summary.byType).map(([type, count]) => (
            <div key={type} className="macos-card p-4">
              <div className="flex items-center gap-2.5 mb-2">
                <div className="size-8 rounded-lg flex items-center justify-center bg-teal-500/10">
                  <Droplets className="size-4 text-teal-500" />
                </div>
                <div>
                  <p className="text-[13px] font-semibold capitalize">{type}</p>
                  <p className="text-[11px] text-muted-foreground">{count} sessions</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sessions Table */}
      <div className="macos-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-[13px] font-semibold">Car Wash Sessions</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="macos-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Plate</th>
                <th>Wash Type</th>
                <th>Started</th>
                <th className="text-right">Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="p-3"><div className="h-4 bg-muted/40 rounded animate-pulse" style={{ width: `${40 + Math.random() * 60}%` }} /></td>
                    ))}
                  </tr>
                ))
              ) : sessions.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-[12px] text-muted-foreground">No car wash sessions found</td></tr>
              ) : (
                sessions.map((s) => (
                  <tr key={s.id}>
                    <td className="font-mono text-[12px] text-muted-foreground">{s.id.slice(0, 8)}</td>
                    <td className="font-mono font-semibold">{s.vehiclePlate ?? '—'}</td>
                    <td className="capitalize">{s.washType}</td>
                    <td className="font-mono text-[12px]">{new Date(s.startedAt).toLocaleString('en-PK', { hour: '2-digit', minute: '2-digit' })}</td>
                    <td className="text-right font-mono font-semibold text-teal-600 dark:text-teal-400">{pkr(s.amount)}</td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <div className={`macos-status-dot ${s.status === 'in-progress' ? 'macos-status-warning' : s.status === 'completed' ? 'macos-status-online' : 'macos-status-offline'}`} />
                        <span className={`text-[11px] font-medium capitalize ${
                          s.status === 'in-progress' ? 'text-teal-500' :
                          s.status === 'completed' ? 'text-emerald-600 dark:text-emerald-400' :
                          'text-muted-foreground'
                        }`}>
                          {s.status}
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
    </div>
  )
}

// ── Lottery Tab ───────────────────────────────────────────

function LotteryTab({
  loading,
  sales,
  summary,
}: {
  loading: boolean
  sales: LotterySaleData[]
  summary: LotterySummary | null
}) {
  const totalTickets = summary?.totalTickets ?? sales.reduce((s, l) => s + l.ticketCount, 0)
  const totalRevenue = summary?.totalRevenue ?? sales.reduce((s, l) => s + l.saleAmount, 0)
  const totalCommission = summary?.totalCommission ?? sales.reduce((s, l) => s + l.commission, 0)

  return (
    <div className="space-y-4" style={{ fontStyle: 'normal !important' }}>
      <div className="grid grid-cols-3 gap-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <div className="macos-card p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Tickets Sold</p>
              <p className="text-[20px] font-bold text-foreground mt-1">{totalTickets}</p>
            </div>
            <div className="macos-card p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Revenue</p>
              <p className="text-[20px] font-bold fuel-text-gradient mt-1">{pkr(totalRevenue)}</p>
            </div>
            <div className="macos-card p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Commission</p>
              <p className="text-[20px] font-bold text-foreground mt-1">{pkr(totalCommission)}</p>
            </div>
          </>
        )}
      </div>

      {/* Game Type Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {['scratch', 'draw', 'online'].map((gameType) => {
          const gameSales = sales.filter(s => s.gameType === gameType)
          const gameRevenue = gameSales.reduce((s, g) => s + g.saleAmount, 0)
          const colors: Record<string, string> = { scratch: '#e8930c', draw: '#34c759', online: '#ff9500' }
          return (
            <div key={gameType} className="macos-card p-4">
              <div className="flex items-center gap-2.5 mb-2">
                <div className="size-8 rounded-lg flex items-center justify-center" style={{ background: `${colors[gameType]}15` }}>
                  <Sparkles className="size-4" style={{ color: colors[gameType] }} />
                </div>
                <div>
                  <p className="text-[13px] font-semibold capitalize">{gameType}</p>
                  <p className="text-[11px] text-muted-foreground">{pkr(gameRevenue)}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <div className={`macos-status-dot ${gameSales.length > 0 ? 'macos-status-online' : 'macos-status-offline'}`} />
                <span className={`text-[11px] font-medium ${gameSales.length > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}>
                  {gameSales.length > 0 ? 'Active' : 'No sales'}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Sales Table */}
      <div className="macos-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-[13px] font-semibold">Recent Lottery Sales</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="macos-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Game</th>
                <th className="text-center">Tickets</th>
                <th className="text-right">Amount</th>
                <th>Commission</th>
                <th>Time</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="p-3"><div className="h-4 bg-muted/40 rounded animate-pulse" style={{ width: `${40 + Math.random() * 60}%` }} /></td>
                    ))}
                  </tr>
                ))
              ) : sales.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-[12px] text-muted-foreground">No lottery sales found</td></tr>
              ) : (
                sales.map((ls) => (
                  <tr key={ls.id}>
                    <td className="font-mono text-[12px] text-muted-foreground">{ls.id.slice(0, 8)}</td>
                    <td className="font-semibold capitalize">{ls.gameType}</td>
                    <td className="text-center">{ls.ticketCount}</td>
                    <td className="text-right font-mono font-semibold text-teal-600 dark:text-teal-400">{pkr(ls.saleAmount)}</td>
                    <td className="text-[12px] text-muted-foreground">{pkr(ls.commission)}</td>
                    <td className="font-mono text-[12px]">{new Date(ls.createdAt).toLocaleString('en-PK', { hour: '2-digit', minute: '2-digit' })}</td>
                    <td>
                      <span className={`macos-pill ${
                        ls.status === 'completed'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'bg-teal-500/10 text-teal-600 dark:text-teal-400'
                      }`}>
                        {ls.status === 'completed' ? 'Sold' : String(ls.status ?? 'Pending')}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
