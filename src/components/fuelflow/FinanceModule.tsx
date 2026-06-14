'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  Receipt,
  CreditCard,
  Building2,
  Calculator,
  PiggyBank,
  AlertCircle,
  ChevronRight,
  RefreshCw,
  Loader2,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'

// ── Types ──────────────────────────────────────────────────

interface FinanceSummary {
  totalIncome: number
  totalExpenses: number
  profit: number
  totalFuelRevenue: number
  profitMargin: number
  payrollCosts: number
  netProfit: number
}

interface FinanceData {
  period: string
  startDate: string
  summary: FinanceSummary
  incomeByCategory: Record<string, number>
  expenseByCategory: Record<string, number>
  fuelRevenueByType: Record<string, number>
  supplierInvoices: {
    totalPending: number
    totalPaid: number
    pendingCount: number
    paidCount: number
  }
  purchaseOrders: {
    totalOpen: number
    openCount: number
  }
  payroll: {
    totalCost: number
    recordCount: number
    paidCount: number
    pendingCount: number
  }
  transactionCount: number
  expenseCount: number
}

interface GLAccount {
  id: string
  accountCode: string
  accountName: string
  accountType: string
  balance: number
  isActive: boolean
}

interface JournalEntry {
  id: string
  entryNumber: string
  entryDate: string
  description: string
  status: string
  lines: { debit: number; credit: number; accountName: string }[]
}

interface AccountReceivable {
  id: string
  customerName: string
  amount: number
  paidAmount: number
  balance: number
  dueDate: string
  status: string
}

interface AccountPayable {
  id: string
  supplierName: string
  amount: number
  paidAmount: number
  balance: number
  dueDate: string
  status: string
}

interface TaxConfig {
  id: string
  taxName: string
  taxRate: number
  taxType: string
  isActive: boolean
  effectiveFrom: string
}

// ── Helpers ──────────────────────────────────────────────

function formatPKR(amount: number): string {
  if (Math.abs(amount) >= 1000000) return `PKR ${(amount / 1000000).toFixed(2)}M`
  if (Math.abs(amount) >= 1000) return `PKR ${(amount / 1000).toFixed(0)}K`
  return `PKR ${amount.toLocaleString()}`
}

function formatFull(amount: number): string {
  return `PKR ${amount.toLocaleString()}`
}

const fadeUp = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] },
}

const stagger = {
  animate: { transition: { staggerChildren: 0.04 } },
}

// ── Component ────────────────────────────────────────────

export default function FinanceModule() {
  const [activeTab, setActiveTab] = useState<'overview' | 'gl' | 'ar-ap' | 'tax'>('overview')
  const [financeData, setFinanceData] = useState<FinanceData | null>(null)
  const [glAccounts, setGLAccounts] = useState<GLAccount[]>([])
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([])
  const [receivables, setReceivables] = useState<AccountReceivable[]>([])
  const [payables, setPayables] = useState<AccountPayable[]>([])
  const [taxConfigs, setTaxConfigs] = useState<TaxConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [financeRes, glRes, jeRes, arRes, apRes, taxRes] = await Promise.all([
        fetch('/api/finance'),
        fetch('/api/finance-advanced?type=gl_accounts'),
        fetch('/api/finance-advanced?type=journal_entries'),
        fetch('/api/finance-advanced?type=receivables'),
        fetch('/api/finance-advanced?type=payables'),
        fetch('/api/finance-advanced?type=tax_configs'),
      ])

      if (!financeRes.ok) throw new Error('Failed to load finance data')

      const financeJson = await financeRes.json()
      setFinanceData(financeJson)

      if (glRes.ok) {
        const glJson = await glRes.json()
        setGLAccounts(glJson.glAccounts || [])
      }
      if (jeRes.ok) {
        const jeJson = await jeRes.json()
        setJournalEntries(jeJson.journalEntries || [])
      }
      if (arRes.ok) {
        const arJson = await arRes.json()
        setReceivables(arJson.receivables || [])
      }
      if (apRes.ok) {
        const apJson = await apRes.json()
        setPayables(apJson.payables || [])
      }
      if (taxRes.ok) {
        const taxJson = await taxRes.json()
        setTaxConfigs(taxJson.taxConfigs || [])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const tabs = [
    { key: 'overview' as const, label: 'Overview' },
    { key: 'gl' as const, label: 'GL Accounts' },
    { key: 'ar-ap' as const, label: 'AR / AP' },
    { key: 'tax' as const, label: 'Tax' },
  ]

  // Build summary cards from finance data
  const summaryCards = financeData ? [
    { label: 'Revenue', value: financeData.summary.totalIncome, icon: TrendingUp, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10', trend: 'up' as const },
    { label: 'Expenses', value: financeData.summary.totalExpenses, icon: TrendingDown, color: 'text-red-500 dark:text-red-400', bg: 'bg-red-500/10', trend: 'down' as const },
    { label: 'Net Profit', value: financeData.summary.netProfit, icon: Wallet, color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-500/10', trend: 'up' as const },
    { label: 'Outstanding', value: financeData.supplierInvoices.totalPending, icon: Receipt, color: 'text-rose-500 dark:text-rose-400', bg: 'bg-rose-500/10', trend: 'down' as const },
  ] : []

  // Build cash flow data from income/expense categories
  const cashFlowData = (() => {
    if (!financeData) return []
    // We'll create a simple single-period view from the data
    return [{
      month: new Date().toLocaleDateString('en-US', { month: 'short' }),
      inflow: financeData.summary.totalIncome,
      outflow: financeData.summary.totalExpenses,
    }]
  })()

  // ── Loading State ──
  if (loading && !financeData) {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-1 rounded-xl bg-black/[0.03] dark:bg-white/[0.04] p-1 w-fit">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="px-4 py-1.5 w-24 h-7 bg-muted/20 rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="macos-card p-4 h-[110px] animate-pulse bg-muted/10" />
          ))}
        </div>
      </div>
    )
  }

  // ── Error State ──
  if (error && !financeData) {
    return (
      <div className="macos-card p-8 flex flex-col items-center justify-center text-center min-h-[300px]">
        <AlertCircle className="size-10 text-teal-500 mb-4" />
        <h3 className="text-[15px] font-semibold text-foreground mb-1">Failed to load finance data</h3>
        <p className="text-[13px] text-muted-foreground mb-4">{error}</p>
        <button onClick={fetchData} className="macos-btn flex items-center gap-1.5">
          <RefreshCw className="size-3.5" /> Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Tab Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 rounded-xl bg-black/[0.03] dark:bg-white/[0.04] p-1 w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-150 ${
                activeTab === tab.key
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
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

      {/* ── Overview Tab ── */}
      {activeTab === 'overview' && (
        <motion.div {...fadeUp} className="space-y-5">
          {/* Summary Cards */}
          <motion.div
            variants={stagger}
            initial="initial"
            animate="animate"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {summaryCards.map((card, i) => (
              <motion.div
                key={card.label}
                variants={{ initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 } }}
                transition={{ delay: i * 0.06, duration: 0.3 }}
                className="macos-card p-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{card.label}</p>
                    <p className="text-[20px] font-bold mt-1 tracking-tight">{formatPKR(card.value)}</p>
                    {financeData && card.label === 'Net Profit' && (
                      <div className="flex items-center gap-1 mt-1.5">
                        <span className="text-[11px] text-muted-foreground">Margin: {financeData.summary.profitMargin}%</span>
                      </div>
                    )}
                    {financeData && card.label === 'Expenses' && (
                      <div className="flex items-center gap-1 mt-1.5">
                        <span className="text-[11px] text-muted-foreground">Payroll: {formatPKR(financeData.summary.payrollCosts)}</span>
                      </div>
                    )}
                    {financeData && card.label === 'Outstanding' && (
                      <div className="flex items-center gap-1 mt-1.5">
                        <span className="text-[11px] text-muted-foreground">{financeData.supplierInvoices.pendingCount} pending invoices</span>
                      </div>
                    )}
                    {financeData && card.label === 'Revenue' && (
                      <div className="flex items-center gap-1 mt-1.5">
                        <span className="text-[11px] text-muted-foreground">Fuel: {formatPKR(financeData.summary.totalFuelRevenue)}</span>
                      </div>
                    )}
                  </div>
                  <div className={`flex size-9 items-center justify-center rounded-xl ${card.bg}`}>
                    <card.icon className={`size-[18px] ${card.color}`} />
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Cash Flow Chart */}
          <div className="macos-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-[13px] font-semibold">Cash Flow</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">Income vs expenses for {financeData?.period || 'current period'}</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="size-2.5 rounded-full bg-emerald-500" />
                  <span className="text-[11px] text-muted-foreground">Income</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="size-2.5 rounded-full bg-rose-400" />
                  <span className="text-[11px] text-muted-foreground">Expenses</span>
                </div>
              </div>
            </div>
            {cashFlowData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={cashFlowData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id="inflowGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#34c759" stopOpacity={0.2} />
                        <stop offset="100%" stopColor="#34c759" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="outflowGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ff6b6b" stopOpacity={0.15} />
                        <stop offset="100%" stopColor="#ff6b6b" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `${(v / 1000000).toFixed(0)}M`} />
                    <Tooltip
                      contentStyle={{ fontSize: 12, borderRadius: 10, border: '0.5px solid var(--border)', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                      formatter={(value: number, name: string) => [formatFull(value), name === 'inflow' ? 'Income' : 'Expenses']}
                    />
                    <Area type="monotone" dataKey="inflow" stroke="#34c759" strokeWidth={2} fill="url(#inflowGrad)" />
                    <Area type="monotone" dataKey="outflow" stroke="#ff6b6b" strokeWidth={2} fill="url(#outflowGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground text-[13px]">
                No cash flow data available
              </div>
            )}
          </div>

          {/* Income & Expense Breakdown */}
          {financeData && (Object.keys(financeData.incomeByCategory).length > 0 || Object.keys(financeData.expenseByCategory).length > 0) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Income Breakdown */}
              {Object.keys(financeData.incomeByCategory).length > 0 && (
                <div className="macos-card p-4">
                  <h3 className="text-[13px] font-semibold mb-3">Income by Category</h3>
                  <div className="macos-group">
                    {Object.entries(financeData.incomeByCategory)
                      .sort(([, a], [, b]) => b - a)
                      .map(([category, amount]) => (
                        <div key={category} className="macos-group-item flex items-center justify-between">
                          <span className="text-[13px] truncate">{category}</span>
                          <span className="text-[13px] font-medium tabular-nums">{formatPKR(amount)}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
              {/* Expense Breakdown */}
              {Object.keys(financeData.expenseByCategory).length > 0 && (
                <div className="macos-card p-4">
                  <h3 className="text-[13px] font-semibold mb-3">Expenses by Category</h3>
                  <div className="macos-group">
                    {Object.entries(financeData.expenseByCategory)
                      .sort(([, a], [, b]) => b - a)
                      .map(([category, amount]) => (
                        <div key={category} className="macos-group-item flex items-center justify-between">
                          <span className="text-[13px] truncate">{category}</span>
                          <span className="text-[13px] font-medium tabular-nums">{formatPKR(amount)}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Recent Journal Entries */}
          <div className="macos-card overflow-hidden">
            <div className="flex items-center justify-between p-4 pb-0">
              <div className="flex items-center gap-2">
                <FileText className="size-4 text-teal-500" />
                <h3 className="text-[13px] font-semibold">Recent Journal Entries</h3>
              </div>
              <Badge variant="outline" className="text-[11px] px-2 py-0.5">{journalEntries.length} entries</Badge>
            </div>
            <ScrollArea className="max-h-[360px]">
              {journalEntries.length > 0 ? (
                <table className="macos-table">
                  <thead>
                    <tr>
                      <th>Entry ID</th>
                      <th>Date</th>
                      <th>Description</th>
                      <th>Status</th>
                      <th className="text-right">Debit</th>
                      <th className="text-right">Credit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {journalEntries.map((entry) => {
                      const totalDebit = entry.lines?.reduce((s, l) => s + l.debit, 0) || 0
                      const totalCredit = entry.lines?.reduce((s, l) => s + l.credit, 0) || 0
                      return (
                        <tr key={entry.id}>
                          <td className="font-mono text-[12px] text-teal-600 dark:text-teal-400">{entry.entryNumber}</td>
                          <td className="text-[12px] text-muted-foreground">{new Date(entry.entryDate).toLocaleDateString('en-PK', { day: '2-digit', month: 'short' })}</td>
                          <td className="text-[13px] max-w-[200px] truncate">{entry.description}</td>
                          <td>
                            <span className={`macos-pill ${
                              entry.status === 'posted'
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                : 'bg-teal-500/10 text-teal-600 dark:text-teal-400'
                            }`}>
                              {entry.status}
                            </span>
                          </td>
                          <td className="text-right font-medium text-[13px]">{totalDebit > 0 ? formatPKR(totalDebit) : '—'}</td>
                          <td className="text-right font-medium text-[13px] text-emerald-600 dark:text-emerald-400">{totalCredit > 0 ? formatPKR(totalCredit) : '—'}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="p-6 text-center text-muted-foreground text-[13px]">
                  No journal entries found
                </div>
              )}
            </ScrollArea>
          </div>
        </motion.div>
      )}

      {/* ── GL Accounts Tab ── */}
      {activeTab === 'gl' && (
        <motion.div {...fadeUp} className="space-y-4">
          <div className="flex items-center gap-2">
            <Calculator className="size-4 text-teal-500" />
            <h3 className="text-[13px] font-semibold">General Ledger Accounts</h3>
          </div>
          {glAccounts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {['Asset', 'Liability', 'Equity', 'Revenue', 'Expense'].map((type) => {
                const accounts = glAccounts.filter((a) => a.accountType === type)
                if (accounts.length === 0) return null
                return (
                  <div key={type} className="macos-group">
                    <div className="macos-group-item flex items-center justify-between bg-black/[0.02] dark:bg-white/[0.02]">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{type}</span>
                      <span className="text-[11px] text-muted-foreground">{accounts.length} accounts</span>
                    </div>
                    {accounts.map((account) => (
                      <div key={account.id} className="macos-group-item flex items-center gap-3">
                        <div className={`macos-status-dot ${account.isActive ? 'macos-status-online' : 'macos-status-offline'}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[12px] font-mono text-muted-foreground">{account.accountCode}</span>
                            <span className="text-[13px] truncate">{account.accountName}</span>
                          </div>
                        </div>
                        <span className="text-[13px] font-medium tabular-nums">{formatPKR(account.balance)}</span>
                        <ChevronRight className="size-3.5 text-muted-foreground" />
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="macos-card p-6 text-center text-muted-foreground text-[13px]">
              No GL accounts configured. Set up your chart of accounts in Settings.
            </div>
          )}
        </motion.div>
      )}

      {/* ── AR / AP Tab ── */}
      {activeTab === 'ar-ap' && (
        <motion.div {...fadeUp} className="space-y-5">
          {/* AR/AP Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="macos-card p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/10">
                  <CreditCard className="size-[18px] text-emerald-500" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Accounts Receivable</p>
                  <p className="text-[20px] font-bold tracking-tight">{formatPKR(receivables.reduce((s, r) => s + r.balance, 0))}</p>
                </div>
              </div>
              {receivables.length > 0 ? (
                <div className="macos-group">
                  {receivables.slice(0, 10).map((item) => {
                    const isOverdue = new Date(item.dueDate) < new Date() && item.balance > 0
                    return (
                      <div key={item.id} className="macos-group-item flex items-center gap-3">
                        <div className={`macos-status-dot ${isOverdue ? 'macos-status-warning' : 'macos-status-online'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] truncate">{item.customerName}</p>
                          <p className="text-[11px] text-muted-foreground">
                            Due: {new Date(item.dueDate).toLocaleDateString('en-PK', { day: '2-digit', month: 'short' })} · {item.status}
                          </p>
                        </div>
                        <span className="text-[13px] font-medium tabular-nums">{formatPKR(item.balance)}</span>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-[12px] text-muted-foreground text-center py-4">No receivables</p>
              )}
            </div>

            <div className="macos-card p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex size-9 items-center justify-center rounded-xl bg-rose-500/10">
                  <Building2 className="size-[18px] text-rose-500" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Accounts Payable</p>
                  <p className="text-[20px] font-bold tracking-tight">{formatPKR(payables.reduce((s, p) => s + p.balance, 0))}</p>
                </div>
              </div>
              {payables.length > 0 ? (
                <div className="macos-group">
                  {payables.slice(0, 10).map((item) => {
                    const isOverdue = new Date(item.dueDate) < new Date() && item.balance > 0
                    return (
                      <div key={item.id} className="macos-group-item flex items-center gap-3">
                        <div className={`macos-status-dot ${isOverdue ? 'macos-status-error' : 'macos-status-online'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] truncate">{item.supplierName}</p>
                          <p className="text-[11px] text-muted-foreground">
                            Due: {new Date(item.dueDate).toLocaleDateString('en-PK', { day: '2-digit', month: 'short' })} · {item.status}
                          </p>
                        </div>
                        <span className="text-[13px] font-medium tabular-nums">{formatPKR(item.balance)}</span>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-[12px] text-muted-foreground text-center py-4">No payables</p>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Tax Tab ── */}
      {activeTab === 'tax' && (
        <motion.div {...fadeUp} className="space-y-5">
          <div className="flex items-center gap-2">
            <PiggyBank className="size-4 text-teal-500" />
            <h3 className="text-[13px] font-semibold">Tax Overview</h3>
          </div>

          {/* Tax Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="macos-card p-4 text-center">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Active Tax Configs</p>
              <p className="text-[22px] font-bold mt-1 tracking-tight text-teal-600 dark:text-teal-400">{taxConfigs.filter(t => t.isActive).length}</p>
            </div>
            <div className="macos-card p-4 text-center">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Total Tax Configs</p>
              <p className="text-[22px] font-bold mt-1 tracking-tight">{taxConfigs.length}</p>
            </div>
            <div className="macos-card p-4 text-center">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Payroll Cost</p>
              <p className="text-[22px] font-bold mt-1 tracking-tight text-emerald-600 dark:text-emerald-400">{financeData ? formatPKR(financeData.payroll.totalCost) : '—'}</p>
            </div>
          </div>

          {/* Tax Details Table */}
          <div className="macos-card overflow-hidden">
            <ScrollArea className="max-h-[400px]">
              {taxConfigs.length > 0 ? (
                <table className="macos-table">
                  <thead>
                    <tr>
                      <th>Tax Name</th>
                      <th>Type</th>
                      <th>Rate</th>
                      <th>Effective From</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {taxConfigs.map((tax) => (
                      <tr key={tax.id}>
                        <td className="text-[13px] font-medium">{tax.taxName}</td>
                        <td><span className="macos-pill bg-black/[0.04] dark:bg-white/[0.06] text-[11px]">{tax.taxType}</span></td>
                        <td className="text-[13px] tabular-nums">{tax.taxRate}%</td>
                        <td className="text-[12px] text-muted-foreground">{new Date(tax.effectiveFrom).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                        <td>
                          <div className="flex items-center gap-1.5">
                            <div className={`macos-status-dot ${tax.isActive ? 'macos-status-online' : 'macos-status-offline'}`} />
                            <span className="text-[11px] text-muted-foreground">
                              {tax.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-6 text-center text-muted-foreground text-[13px]">
                  No tax configurations found. Set up tax configs in Settings.
                </div>
              )}
            </ScrollArea>
          </div>

          {financeData && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-teal-500/5 border border-teal-500/10">
              <AlertCircle className="size-4 text-teal-500 shrink-0" />
              <p className="text-[12px] text-teal-700 dark:text-teal-400">
                Period: <strong>{financeData.period}</strong> starting {new Date(financeData.startDate).toLocaleDateString()}. 
                Profit margin: <strong>{financeData.summary.profitMargin}%</strong>.
                {financeData.supplierInvoices.pendingCount > 0 && ` ${financeData.supplierInvoices.pendingCount} supplier invoices pending payment.`}
              </p>
            </div>
          )}
        </motion.div>
      )}
    </div>
  )
}
