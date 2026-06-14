'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Truck,
  Car,
  CreditCard,
  Radio,
  Receipt,
  ChevronRight,
  Plus,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Signal,
  Wallet,
  RefreshCw,
  Loader2,
} from 'lucide-react'
import { useAppStore } from '@/stores/app-store'

// ── Types ──────────────────────────────────────────────────

interface FleetAccount {
  id: string
  companyName: string
  contactPerson: string
  phone: string
  email: string
  address: string | null
  creditLimit: number
  currentBalance: number
  dailyLimit: number | null
  monthlyLimit: number | null
  fuelTypes: string | null
  paymentTerms: string | null
  taxExempt: boolean
  status: string
  vehicleCount: number
  driverCount: number
  fuelCardCount: number
  fuelingCount: number
  vehicles: FleetVehicle[]
  drivers: FleetDriver[]
  fuelCards: FleetFuelCard[]
  createdAt: string
  updatedAt: string
}

interface FleetVehicle {
  id: string
  plateNumber: string
  make: string | null
  model: string | null
  year: number | null
  vehicleType: string | null
  rfidTag: string | null
  fuelType: string | null
  dailyLimit: number | null
  isActive: boolean
}

interface FleetDriver {
  id: string
  name: string
  phone: string | null
  licenseNumber: string | null
  isActive: boolean
}

interface FleetFuelCard {
  id: string
  cardNumber: string
  cardType: string
  rfidTag: string | null
  dailyLimit: number | null
  monthlyLimit: number | null
  balance: number
  isActive: boolean
  expiryDate: string | null
}

interface RFIDReader {
  id: string
  name: string
  code: string
  location: string | null
  ipAddress: string | null
  status: string
  isActive: boolean
  lastReading: string | null
  totalReads: number
}

interface FleetSummary {
  totalAccounts: number
  activeAccounts: number
  totalVehicles: number
  totalDrivers: number
  totalFuelCards: number
  totalCreditLimit: number
  totalCurrentBalance: number
  totalOutstanding: number
}

// ── Helpers ───────────────────────────────────────────────

const pkr = (n: number) => `PKR ${n.toLocaleString()}`

const statusConfig: Record<string, { dot: string; label: string; text: string }> = {
  active: { dot: 'macos-status-online', label: 'Active', text: 'text-emerald-600 dark:text-emerald-400' },
  suspended: { dot: 'macos-status-error', label: 'Suspended', text: 'text-red-500' },
  expired: { dot: 'macos-status-offline', label: 'Expired', text: 'text-muted-foreground' },
  warning: { dot: 'macos-status-warning', label: 'Warning', text: 'text-teal-500' },
  online: { dot: 'macos-status-online', label: 'Online', text: 'text-emerald-600 dark:text-emerald-400' },
  error: { dot: 'macos-status-error', label: 'Error', text: 'text-red-500' },
  inactive: { dot: 'macos-status-offline', label: 'Inactive', text: 'text-muted-foreground' },
}

type TabKey = 'accounts' | 'vehicles' | 'cards' | 'rfid' | 'transactions'

const tabs: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: 'accounts', label: 'Fleet Accounts', icon: Truck },
  { key: 'vehicles', label: 'Vehicles', icon: Car },
  { key: 'cards', label: 'Fuel Cards', icon: CreditCard },
  { key: 'rfid', label: 'RFID Readers', icon: Radio },
  { key: 'transactions', label: 'Transactions', icon: Receipt },
]

// ── Skeleton ───────────────────────────────────────────────

function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="macos-card overflow-hidden">
      <div className="px-4 py-3 border-b border-border">
        <div className="h-4 w-32 rounded bg-muted/40 animate-pulse" />
      </div>
      <div className="divide-y divide-border/30">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3">
            <div className="h-3 w-16 rounded bg-muted/30 animate-pulse" />
            <div className="h-3 w-24 rounded bg-muted/30 animate-pulse" />
            <div className="h-3 w-20 rounded bg-muted/30 animate-pulse" />
            <div className="h-3 w-12 rounded bg-muted/30 animate-pulse ml-auto" />
          </div>
        ))}
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

// ── Component ─────────────────────────────────────────────

export default function FleetModule() {
  const [activeTab, setActiveTab] = useState<TabKey>('accounts')
  const { selectedStation } = useAppStore()

  // Data state
  const [fleetAccounts, setFleetAccounts] = useState<FleetAccount[]>([])
  const [summary, setSummary] = useState<FleetSummary | null>(null)
  const [rfidReaders, setRfidReaders] = useState<RFIDReader[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [fleetRes, rfidRes] = await Promise.all([
        fetch('/api/fleet?includeDetails=true'),
        fetch('/api/rfid-readers'),
      ])

      if (!fleetRes.ok || !rfidRes.ok) {
        throw new Error('Failed to fetch fleet data')
      }

      const fleetData = await fleetRes.json()
      const rfidData = await rfidRes.json()

      setFleetAccounts(fleetData.fleetAccounts || [])
      setSummary(fleetData.summary || null)
      setRfidReaders(rfidData.readers || [])
    } catch (err) {
      console.error('FleetModule fetch error:', err)
      setError('Unable to load fleet data. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Derived values
  const allVehicles = fleetAccounts.flatMap(a => a.vehicles || [])
  const allFuelCards = fleetAccounts.flatMap(a => a.fuelCards || [])
  const totalVehicles = summary?.totalVehicles ?? allVehicles.length
  const totalCards = summary?.totalFuelCards ?? allFuelCards.length
  const totalOutstanding = summary?.totalCurrentBalance ?? fleetAccounts.reduce((s, a) => s + a.currentBalance, 0)

  if (error) {
    return <ErrorBanner message={error} onRetry={fetchData} />
  }

  return (
    <div className="space-y-5" style={{ fontStyle: 'normal !important' }}>
      {/* ── Summary Stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Fleet Accounts', value: (summary?.totalAccounts ?? fleetAccounts.length).toString(), icon: Truck, accent: false },
          { label: 'Total Vehicles', value: totalVehicles.toString(), icon: Car, accent: false },
          { label: 'Active Cards', value: totalCards.toString(), icon: CreditCard, accent: false },
          { label: 'Outstanding', value: pkr(totalOutstanding), icon: Wallet, accent: true },
        ].map((stat, i) => (
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
                  {loading ? <span className="inline-block w-16 h-5 rounded bg-muted/30 animate-pulse" /> : stat.value}
                </p>
              </div>
              <div className={`size-8 rounded-lg flex items-center justify-center ${stat.accent ? 'bg-teal-500/10' : 'bg-black/[0.03] dark:bg-white/[0.05]'}`}>
                <stat.icon className={`size-4 ${stat.accent ? 'text-teal-500' : 'text-muted-foreground'}`} strokeWidth={1.5} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

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
        <button
          onClick={fetchData}
          className="ml-auto flex items-center gap-1 rounded-lg px-2 py-1.5 text-[12px] text-muted-foreground hover:bg-black/[0.03] dark:hover:bg-white/[0.05] transition-colors"
          title="Refresh data"
        >
          <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
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
          {loading ? (
            <SkeletonTable rows={6} />
          ) : (
            <>
              {activeTab === 'accounts' && <FleetAccountsTab accounts={fleetAccounts} onRefresh={fetchData} />}
              {activeTab === 'vehicles' && <VehiclesTab vehicles={allVehicles} />}
              {activeTab === 'cards' && <FuelCardsTab cards={allFuelCards} />}
              {activeTab === 'rfid' && <RFIDReadersTab readers={rfidReaders} />}
              {activeTab === 'transactions' && <TransactionsTab accounts={fleetAccounts} />}
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

// ── Fleet Accounts Tab ────────────────────────────────────

function FleetAccountsTab({ accounts, onRefresh }: { accounts: FleetAccount[]; onRefresh: () => void }) {
  if (accounts.length === 0) {
    return (
      <div className="macos-card p-8 text-center">
        <Truck className="size-8 text-muted-foreground mx-auto mb-3" />
        <p className="text-[13px] font-medium text-foreground">No fleet accounts found</p>
        <p className="text-[11px] text-muted-foreground mt-1">Create a new fleet account to get started.</p>
        <button className="macos-btn gap-1 mt-4 mx-auto">
          <Plus className="size-3.5" /> New Account
        </button>
      </div>
    )
  }

  return (
    <div className="macos-card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div>
          <h3 className="text-[13px] font-semibold">Fleet Accounts</h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">{accounts.length} registered accounts</p>
        </div>
        <button className="macos-btn gap-1">
          <Plus className="size-3.5" /> New Account
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="macos-table">
          <thead>
            <tr>
              <th>Account ID</th>
              <th>Company</th>
              <th>Contact</th>
              <th className="text-center">Vehicles</th>
              <th className="text-center">Cards</th>
              <th className="text-right">Credit Limit</th>
              <th className="text-right">Balance</th>
              <th className="text-right">Utilization</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((a) => {
              const util = a.creditLimit > 0 ? Math.round((a.currentBalance / a.creditLimit) * 100) : 0
              const cfg = statusConfig[a.status] || statusConfig.active
              return (
                <tr key={a.id}>
                  <td className="font-mono text-[12px] text-muted-foreground">{a.id.slice(0, 8)}</td>
                  <td className="font-semibold">{a.companyName}</td>
                  <td className="text-muted-foreground">{a.contactPerson}</td>
                  <td className="text-center">{a.vehicleCount}</td>
                  <td className="text-center">{a.fuelCardCount}</td>
                  <td className="text-right font-mono">{pkr(a.creditLimit)}</td>
                  <td className="text-right font-mono font-semibold text-teal-600 dark:text-teal-400">{pkr(a.currentBalance)}</td>
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 h-1.5 rounded-full bg-black/[0.05] dark:bg-white/[0.08] overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            util > 90 ? 'bg-red-500' : util > 70 ? 'bg-teal-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(util, 100)}%` }}
                        />
                      </div>
                      <span className="text-[11px] text-muted-foreground w-8 text-right">{util}%</span>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      <div className={`macos-status-dot ${cfg.dot}`} />
                      <span className={`text-[11px] font-medium ${cfg.text}`}>{cfg.label}</span>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Vehicles Tab ──────────────────────────────────────────

function VehiclesTab({ vehicles }: { vehicles: FleetVehicle[] }) {
  const [search, setSearch] = useState('')
  const filtered = vehicles.filter(v =>
    !search || v.plateNumber?.toLowerCase().includes(search.toLowerCase()) || v.make?.toLowerCase().includes(search.toLowerCase())
  )

  if (vehicles.length === 0) {
    return (
      <div className="macos-card p-8 text-center">
        <Car className="size-8 text-muted-foreground mx-auto mb-3" />
        <p className="text-[13px] font-medium text-foreground">No vehicles found</p>
        <p className="text-[11px] text-muted-foreground mt-1">Vehicles are associated with fleet accounts.</p>
      </div>
    )
  }

  return (
    <div className="macos-card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div>
          <h3 className="text-[13px] font-semibold">Registered Vehicles</h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">{vehicles.length} vehicles across all fleet accounts</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              className="macos-search w-44 !pl-8 !py-1.5 !text-[12px]"
              placeholder="Search plate..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="macos-table">
          <thead>
            <tr>
              <th>Plate Number</th>
              <th>Make / Model</th>
              <th>Type</th>
              <th>RFID Tag</th>
              <th>Fuel Type</th>
              <th className="text-right">Daily Limit</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((v) => (
              <tr key={v.id}>
                <td className="font-mono font-semibold">{v.plateNumber || '—'}</td>
                <td>
                  <span className="font-medium">{v.make || '—'}</span>{' '}
                  <span className="text-muted-foreground">{v.model || ''} {v.year || ''}</span>
                </td>
                <td>
                  <span className="macos-pill bg-black/[0.04] dark:bg-white/[0.06] text-muted-foreground">{v.vehicleType || '—'}</span>
                </td>
                <td className="font-mono text-[12px]">
                  {v.rfidTag ? (
                    <div className="flex items-center gap-1.5">
                      <Radio className="size-3 text-teal-500" />
                      {v.rfidTag}
                    </div>
                  ) : '—'}
                </td>
                <td>
                  {v.fuelType ? (
                    <span className={`macos-pill ${
                      v.fuelType?.toLowerCase().includes('diesel')
                        ? 'bg-teal-500/10 text-teal-600 dark:text-teal-400'
                        : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    }`}>
                      {v.fuelType}
                    </span>
                  ) : '—'}
                </td>
                <td className="text-right font-mono">{v.dailyLimit ? pkr(v.dailyLimit) : '—'}</td>
                <td>
                  <div className="flex items-center gap-1.5">
                    <div className={`macos-status-dot ${v.isActive ? 'macos-status-online' : 'macos-status-offline'}`} />
                    <span className={`text-[11px] font-medium ${v.isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}>
                      {v.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Fuel Cards Tab ────────────────────────────────────────

function FuelCardsTab({ cards }: { cards: FleetFuelCard[] }) {
  const activeCount = cards.filter(c => c.isActive).length
  const suspendedCount = cards.filter(c => !c.isActive).length
  const expiredCount = cards.filter(c => c.expiryDate && new Date(c.expiryDate) < new Date()).length

  if (cards.length === 0) {
    return (
      <div className="macos-card p-8 text-center">
        <CreditCard className="size-8 text-muted-foreground mx-auto mb-3" />
        <p className="text-[13px] font-medium text-foreground">No fuel cards found</p>
        <p className="text-[11px] text-muted-foreground mt-1">Fuel cards are associated with fleet accounts.</p>
        <button className="macos-btn gap-1 mt-4 mx-auto">
          <Plus className="size-3.5" /> Issue Card
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Card Status Summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Active', count: activeCount, dot: 'macos-status-online', color: 'text-emerald-600 dark:text-emerald-400' },
          { label: 'Suspended', count: suspendedCount, dot: 'macos-status-error', color: 'text-red-500' },
          { label: 'Expired', count: expiredCount, dot: 'macos-status-offline', color: 'text-muted-foreground' },
        ].map(s => (
          <div key={s.label} className="macos-card p-3 flex items-center gap-2.5">
            <div className={`macos-status-dot ${s.dot}`} />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{s.label}</p>
              <p className={`text-[18px] font-bold ${s.color}`}>{s.count}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Cards Table */}
      <div className="macos-card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="text-[13px] font-semibold">Fuel Cards</h3>
          <button className="macos-btn gap-1">
            <Plus className="size-3.5" /> Issue Card
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="macos-table">
            <thead>
              <tr>
                <th>Card Number</th>
                <th>Type</th>
                <th>RFID Tag</th>
                <th className="text-right">Balance</th>
                <th className="text-right">Daily Limit</th>
                <th className="text-right">Monthly Limit</th>
                <th>Expiry</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {cards.map((fc) => {
                const isExpired = fc.expiryDate && new Date(fc.expiryDate) < new Date()
                const cfg = !fc.isActive ? statusConfig.suspended : isExpired ? statusConfig.expired : statusConfig.active
                return (
                  <tr key={fc.id}>
                    <td className="font-mono font-semibold">{fc.cardNumber}</td>
                    <td>
                      <span className="macos-pill bg-black/[0.04] dark:bg-white/[0.06] text-muted-foreground">{fc.cardType}</span>
                    </td>
                    <td className="font-mono text-[12px]">
                      {fc.rfidTag ? (
                        <div className="flex items-center gap-1.5">
                          <Radio className="size-3 text-teal-500" />
                          {fc.rfidTag}
                        </div>
                      ) : '—'}
                    </td>
                    <td className="text-right font-mono font-semibold text-teal-600 dark:text-teal-400">{pkr(fc.balance)}</td>
                    <td className="text-right font-mono text-muted-foreground">{fc.dailyLimit ? pkr(fc.dailyLimit) : '—'}</td>
                    <td className="text-right font-mono text-muted-foreground">{fc.monthlyLimit ? pkr(fc.monthlyLimit) : '—'}</td>
                    <td className="font-mono text-[12px]">{fc.expiryDate ? new Date(fc.expiryDate).toLocaleDateString() : '—'}</td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <div className={`macos-status-dot ${cfg.dot}`} />
                        <span className={`text-[11px] font-medium ${cfg.text}`}>{cfg.label}</span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ── RFID Readers Tab ──────────────────────────────────────

function RFIDReadersTab({ readers }: { readers: RFIDReader[] }) {
  const onlineCount = readers.filter(r => r.status === 'online' || r.isActive).length
  const totalReads = readers.reduce((s, r) => s + (r.totalReads || 0), 0)

  if (readers.length === 0) {
    return (
      <div className="macos-card p-8 text-center">
        <Radio className="size-8 text-muted-foreground mx-auto mb-3" />
        <p className="text-[13px] font-medium text-foreground">No RFID readers found</p>
        <p className="text-[11px] text-muted-foreground mt-1">Register RFID readers to monitor their status.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Status Overview */}
      <div className="grid grid-cols-3 gap-3">
        <div className="macos-card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Readers Online</p>
          <p className="text-[20px] font-bold text-emerald-600 dark:text-emerald-400 mt-1">{onlineCount}/{readers.length}</p>
        </div>
        <div className="macos-card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Total Reads</p>
          <p className="text-[20px] font-bold text-foreground mt-1">{totalReads.toLocaleString()}</p>
        </div>
        <div className="macos-card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Status</p>
          <p className="text-[20px] font-bold text-foreground mt-1">{onlineCount === readers.length ? 'All Online' : 'Partial'}</p>
        </div>
      </div>

      {/* Readers Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {readers.map((reader, idx) => {
          const readerStatus = reader.isActive ? 'online' : 'error'
          const cfg = statusConfig[readerStatus] || statusConfig.online
          return (
            <motion.div
              key={reader.id}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.04 }}
              className="macos-card p-4"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="text-[13px] font-semibold">{reader.name}</h4>
                  <p className="text-[11px] text-muted-foreground">{reader.location || reader.code}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className={`macos-status-dot ${cfg.dot}`} />
                  <span className={`text-[11px] font-medium ${cfg.text}`}>{cfg.label}</span>
                </div>
              </div>

              <div className="macos-group">
                <div className="macos-group-item flex justify-between !py-2 !px-3">
                  <span className="text-[11px] text-muted-foreground">IP Address</span>
                  <span className="text-[12px] font-mono">{reader.ipAddress || '—'}</span>
                </div>
                <div className="macos-group-item flex justify-between !py-2 !px-3">
                  <span className="text-[11px] text-muted-foreground">Last Read</span>
                  <span className="text-[12px]">{reader.lastReading ? new Date(reader.lastReading).toLocaleTimeString() : '—'}</span>
                </div>
                <div className="macos-group-item flex justify-between !py-2 !px-3 !border-b-0">
                  <span className="text-[11px] text-muted-foreground">Total Reads</span>
                  <span className="text-[12px] font-semibold">{reader.totalReads || 0}</span>
                </div>
              </div>

              {!reader.isActive && (
                <div className="mt-3 flex items-center gap-1.5 rounded-lg bg-red-500/10 px-2.5 py-1.5">
                  <AlertTriangle className="size-3 text-red-500" />
                  <span className="text-[11px] font-medium text-red-500">Reader offline — needs attention</span>
                </div>
              )}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

// ── Transactions Tab ──────────────────────────────────────

interface TransactionRow {
  id: string
  time: string
  company: string
  plate: string
  pump: string
  product: string
  litres: number
  amount: number
  card: string
}

function TransactionsTab({ accounts }: { accounts: FleetAccount[] }) {
  const [transactions, setTransactions] = useState<TransactionRow[]>([])
  const [loading, setLoading] = useState(true)
  const { selectedStation } = useAppStore()

  useEffect(() => {
    async function fetchTransactions() {
      try {
        const params = new URLSearchParams()
        if (selectedStation && selectedStation !== 'all') params.set('stationId', selectedStation)
        params.set('limit', '20')
        const res = await fetch(`/api/fuelings?${params.toString()}`)
        if (res.ok) {
          const data = await res.json()
          const txRows: TransactionRow[] = (data.fuelings || []).map((f: Record<string, unknown>) => ({
            id: f.id?.toString().slice(0, 8) || '',
            time: f.startedAt ? new Date(f.startedAt as string).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '',
            company: (f.fleetAccount as Record<string, string>)?.companyName || 'Walk-in',
            plate: (f.vehiclePlate as string) || '—',
            pump: (f.dispenser as Record<string, string>)?.name || '—',
            product: (f.fuelType as string) || '—',
            litres: (f.volume as number) || 0,
            amount: (f.totalAmount as number) || 0,
            card: (f.rfidTag as string) || 'Cash',
          }))
          setTransactions(txRows)
        }
      } catch (err) {
        console.error('Transactions fetch error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchTransactions()
  }, [selectedStation])

  const totalAmount = transactions.reduce((s, t) => s + t.amount, 0)
  const totalLitres = transactions.reduce((s, t) => s + t.litres, 0)

  if (loading) {
    return <SkeletonTable rows={6} />
  }

  if (transactions.length === 0) {
    return (
      <div className="macos-card p-8 text-center">
        <Receipt className="size-8 text-muted-foreground mx-auto mb-3" />
        <p className="text-[13px] font-medium text-foreground">No fleet transactions found</p>
        <p className="text-[11px] text-muted-foreground mt-1">Recent fueling transactions will appear here.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="macos-card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Recent Transactions</p>
          <p className="text-[20px] font-bold text-foreground mt-1">{transactions.length}</p>
        </div>
        <div className="macos-card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Total Litres</p>
          <p className="text-[20px] font-bold text-foreground mt-1">{totalLitres.toLocaleString()}L</p>
        </div>
        <div className="macos-card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Total Amount</p>
          <p className="text-[20px] font-bold fuel-text-gradient mt-1">{pkr(totalAmount)}</p>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="macos-card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="text-[13px] font-semibold">Recent Fleet Transactions</h3>
          <span className="text-[11px] text-muted-foreground">Latest transactions</span>
        </div>
        <div className="overflow-x-auto">
          <table className="macos-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Time</th>
                <th>Company</th>
                <th>Plate</th>
                <th>Pump</th>
                <th>Product</th>
                <th className="text-right">Litres</th>
                <th className="text-right">Amount</th>
                <th>Card</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id}>
                  <td className="font-mono text-[12px] text-muted-foreground">{tx.id}</td>
                  <td className="font-mono text-[12px]">{tx.time}</td>
                  <td className="font-medium">{tx.company}</td>
                  <td className="font-mono text-[12px]">{tx.plate}</td>
                  <td className="text-muted-foreground">{tx.pump}</td>
                  <td>
                    <span className={`macos-pill ${
                      tx.product?.toLowerCase().includes('diesel')
                        ? 'bg-teal-500/10 text-teal-600 dark:text-teal-400'
                        : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    }`}>
                      {tx.product}
                    </span>
                  </td>
                  <td className="text-right font-mono">{tx.litres}L</td>
                  <td className="text-right font-mono font-semibold text-teal-600 dark:text-teal-400">{pkr(tx.amount)}</td>
                  <td className="font-mono text-[12px] text-muted-foreground">{tx.card}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
