'use client'

import { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Receipt, Droplets, Wallet, Users, Shield, Search, ChevronRight, ChevronDown,
  Fuel, Clock, DollarSign, ShoppingCart, Truck, Activity, TrendingUp, Zap,
  FileText, Printer, FileDown, FileSpreadsheet, RefreshCw, Loader2, ArrowLeft,
  Crown, CalendarDays, BarChart3, Hash, AlertCircle,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useAppStore } from '@/stores/app-store'

// ── Types ──────────────────────────────────────

interface ReportDefinition {
  id: string
  name: string
  description: string
  reportType: string
  category: string
  icon: React.ComponentType<{ className?: string }>
}

interface ReportCategory {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  reports: ReportDefinition[]
}

interface ReportData {
  reportType: string
  reportName: string
  generatedAt: string
  period: { from: string; to: string }
  stationName?: string
  tenantName?: string
  columns: string[]
  rows: Record<string, unknown>[]
  summary: Record<string, unknown>
  error?: string
}

// ── Report Definitions ──────────────────────────────

const reportCategories: ReportCategory[] = [
  {
    id: 'sales',
    label: 'Sales & Revenue',
    icon: Receipt,
    color: 'text-teal-600 dark:text-teal-400',
    reports: [
      { id: 'daily-sales', name: 'Daily Sales Report', description: 'Daily fuel sales summary with volume, revenue, and payment breakdown', reportType: 'daily_sales', category: 'sales', icon: Receipt },
      { id: 'shift-summary', name: 'Shift Summary Report', description: 'Shift-wise sales, cash/card/fleet breakdown, and attendant performance', reportType: 'shift_summary', category: 'sales', icon: Clock },
      { id: 'nozzle-sales', name: 'Nozzle-wise Sales Report', description: 'Individual nozzle transaction volume and revenue analysis', reportType: 'nozzle_sales', category: 'sales', icon: Hash },
      { id: 'product-sales', name: 'Product-wise Sales Report', description: 'Sales broken down by fuel product type (Petrol, Diesel, Premium, HOBC)', reportType: 'product_sales', category: 'sales', icon: Fuel },
      { id: 'payment-mode', name: 'Payment Mode Summary', description: 'Revenue grouped by Cash, Card, Fleet, Digital Wallet, Loyalty', reportType: 'payment_mode', category: 'sales', icon: DollarSign },
      { id: 'cash-recon', name: 'Cash Reconciliation', description: 'Shift cash reconciliation with opening/closing cash and variance', reportType: 'cash_reconciliation', category: 'sales', icon: DollarSign },
      { id: 'retail-sales', name: 'Retail Store Sales', description: 'Retail product sales, category performance, and payment analysis', reportType: 'retail_sales', category: 'sales', icon: ShoppingCart },
      { id: 'hourly-sales', name: 'Hourly Sales Analysis', description: 'Sales volume and revenue by hour of the day', reportType: 'hourly_sales', category: 'sales', icon: Clock },
      { id: 'meter-reading', name: 'Meter Reading Report', description: 'Dispenser meter opening/closing readings per shift', reportType: 'meter_reading', category: 'sales', icon: BarChart3 },
    ],
  },
  {
    id: 'inventory',
    label: 'Inventory & Wet Stock',
    icon: Droplets,
    color: 'text-emerald-600 dark:text-emerald-400',
    reports: [
      { id: 'fuel-inventory', name: 'Fuel Inventory Report', description: 'Current tank levels, capacity utilization, water levels, and temperature', reportType: 'fuel_inventory', category: 'inventory', icon: Fuel },
      { id: 'tank-recon', name: 'Tank Reconciliation', description: 'Opening stock + deliveries - sales vs closing stock with variance analysis', reportType: 'tank_reconciliation', category: 'inventory', icon: Droplets },
      { id: 'reconciliation', name: 'Full Reconciliation Report', description: 'Comprehensive wet stock reconciliation with variance % and book vs actual', reportType: 'reconciliation_report', category: 'inventory', icon: Activity },
      { id: 'delivery-log', name: 'Delivery Log Report', description: 'Fuel delivery history with supplier, volumes, variances, and costs', reportType: 'delivery_log', category: 'inventory', icon: Truck },
      { id: 'dip-reading', name: 'Dip Reading Report', description: 'Manual dip chart readings with calculated vs actual stock comparison', reportType: 'dip_reading', category: 'inventory', icon: BarChart3 },
      { id: 'stock-gain-loss', name: 'Stock Gain/Loss Report', description: 'Tank-wise, fuel-wise, date-wise stock gain and loss analysis', reportType: 'stock_gain_loss', category: 'inventory', icon: TrendingUp },
      { id: 'lubricant-inventory', name: 'Lubricant Inventory Report', description: 'Lubricant stock levels, movements, and reorder points', reportType: 'lubricant_inventory', category: 'inventory', icon: Droplets },
    ],
  },
  {
    id: 'finance',
    label: 'Finance & Accounting',
    icon: Wallet,
    color: 'text-cyan-600 dark:text-cyan-400',
    reports: [
      { id: 'financial-summary', name: 'Financial Summary', description: 'Income vs expenses, net profit, and category breakdown', reportType: 'financial_summary', category: 'finance', icon: Wallet },
      { id: 'expense-report', name: 'Expense Report', description: 'Detailed expense categories, approval status, and vendor breakdown', reportType: 'expense_report', category: 'finance', icon: DollarSign },
      { id: 'supplier-statement', name: 'Supplier Statement', description: 'Supplier invoices, payment status, and outstanding amounts', reportType: 'supplier_statement', category: 'finance', icon: Truck },
      { id: 'price-history', name: 'Price History Report', description: 'Fuel price changes over time with effective dates', reportType: 'price_history', category: 'finance', icon: TrendingUp },
      { id: 'profit-loss', name: 'Profit & Loss Statement', description: 'Revenue, COGS, operating expenses, and net profit analysis', reportType: 'profit_loss', category: 'finance', icon: BarChart3 },
      { id: 'credit-billing', name: 'Credit Billing Report', description: 'Customer credit accounts, billing periods, and outstanding balances', reportType: 'credit_billing', category: 'finance', icon: DollarSign },
      { id: 'tax-report', name: 'Tax Report (GST/FBR)', description: 'Tax collection summary with FBR/GST compliance data', reportType: 'tax_report', category: 'finance', icon: FileText },
      { id: 'ap-aging', name: 'Accounts Payable Aging', description: 'Outstanding payables by aging bucket (Current, 30, 60, 90+ days)', reportType: 'ap_aging', category: 'finance', icon: Wallet },
      { id: 'ar-aging', name: 'Accounts Receivable Aging', description: 'Outstanding receivables by aging bucket', reportType: 'ar_aging', category: 'finance', icon: Wallet },
    ],
  },
  {
    id: 'operations',
    label: 'Operations & HR',
    icon: Users,
    color: 'text-rose-600 dark:text-rose-400',
    reports: [
      { id: 'employee-perf', name: 'Employee Performance', description: 'Employee shifts, sales volume, transaction counts, and commissions', reportType: 'employee_performance', category: 'operations', icon: Users },
      { id: 'attendance', name: 'Attendance Report', description: 'Employee attendance, hours worked, late/absent counts', reportType: 'attendance_report', category: 'operations', icon: Clock },
      { id: 'shift-handover', name: 'Shift Handover Report', description: 'Shift handover details, cash counts, and pending items', reportType: 'shift_handover', category: 'operations', icon: Clock },
      { id: 'fleet-summary', name: 'Fleet Account Summary', description: 'Fleet usage by company, transactions, volumes, and outstanding balances', reportType: 'fleet_summary', category: 'operations', icon: Truck },
      { id: 'station-perf', name: 'Station Performance', description: 'Multi-station comparison: revenue, volume, and efficiency metrics', reportType: 'station_performance', category: 'operations', icon: BarChart3 },
      { id: 'dispenser-uptime', name: 'Dispenser Uptime Report', description: 'Dispenser availability, downtime, and maintenance schedule', reportType: 'dispenser_uptime', category: 'operations', icon: Activity },
    ],
  },
  {
    id: 'customer',
    label: 'Customer & Loyalty',
    icon: Users,
    color: 'text-violet-600 dark:text-violet-400',
    reports: [
      { id: 'loyalty-summary', name: 'Loyalty Summary Report', description: 'Customer loyalty points, tier distribution, and redemption statistics', reportType: 'loyalty_summary', category: 'customer', icon: Users },
      { id: 'credit-ledger', name: 'Customer Credit Ledger', description: 'Detailed credit account transactions and balance history', reportType: 'credit_ledger', category: 'customer', icon: DollarSign },
      { id: 'redemption', name: 'Redemption Report', description: 'Loyalty points and reward redemption details and trends', reportType: 'redemption', category: 'customer', icon: ShoppingCart },
    ],
  },
  {
    id: 'compliance',
    label: 'Compliance & Regulatory',
    icon: Shield,
    color: 'text-slate-600 dark:text-slate-400',
    reports: [
      { id: 'ev-cng', name: 'EV & CNG Session Report', description: 'EV charging and CNG dispensing session details and revenue', reportType: 'ev_cng_sessions', category: 'compliance', icon: Zap },
      { id: 'environmental', name: 'Environmental Report', description: 'Environmental alerts, vapor recovery readings, and compliance data', reportType: 'environmental_report', category: 'compliance', icon: Activity },
      { id: 'security-audit', name: 'Security Audit Report', description: 'Security alerts, login sessions, and audit trail', reportType: 'security_audit', category: 'compliance', icon: Shield },
      { id: 'ogra', name: 'OGRA Compliance Report', description: 'Oil & Gas Regulatory Authority compliance data and filings', reportType: 'ogra_compliance', category: 'compliance', icon: FileText },
      { id: 'calibration', name: 'Calibration Report', description: 'Dispenser and tank gauge calibration history and results', reportType: 'calibration', category: 'compliance', icon: Hash },
    ],
  },
]

const allReports = reportCategories.flatMap((c) => c.reports)

// ── Helpers ──────────────────────────────────────

function formatPKR(amount: number): string {
  return new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(amount)
}

function formatNumber(n: number, decimals = 2): string {
  return new Intl.NumberFormat('en-PK', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(n)
}

function formatDate(d: string | Date): string {
  return new Date(d).toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' })
}

function formatDateTime(d: string | Date): string {
  return new Date(d).toLocaleString('en-PK', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function prettyColumnName(col: string): string {
  return col
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase())
    .trim()
}

// Money column keywords
const MONEY_KEYWORDS = ['revenue', 'amount', 'sales', 'cost', 'price', 'income', 'expense', 'profit', 'balance', 'credit', 'debit', 'payable', 'receivable', 'payment', 'total', 'cash', 'limit', 'outstanding', 'bill', 'ticket', 'salary', 'wage', 'rental', 'fee']
// Volume column keywords
const VOLUME_KEYWORDS = ['volume', 'capacity', 'level', 'stock', 'delivery', 'deliveries', 'liters', 'quantity']
// Percentage column keywords
const PERCENT_KEYWORDS = ['percentage', 'percent', 'rate', 'margin', 'utilization', 'variancepercentage']
// Status column keywords
const STATUS_KEYWORDS = ['status', 'state']

function isMoneyColumn(col: string): boolean {
  const lower = col.toLowerCase()
  return MONEY_KEYWORDS.some((k) => lower.includes(k)) && !PERCENT_KEYWORDS.some((k) => lower.includes(k)) && !VOLUME_KEYWORDS.some((k) => lower.includes(k))
}

function isVolumeColumn(col: string): boolean {
  const lower = col.toLowerCase()
  return VOLUME_KEYWORDS.some((k) => lower.includes(k)) && !PERCENT_KEYWORDS.some((k) => lower.includes(k))
}

function isPercentColumn(col: string): boolean {
  const lower = col.toLowerCase()
  return PERCENT_KEYWORDS.some((k) => lower.includes(k)) || lower === 'utilization'
}

function isStatusColumn(col: string): boolean {
  const lower = col.toLowerCase()
  return STATUS_KEYWORDS.some((k) => lower.includes(k))
}

function isDateColumn(col: string): boolean {
  const lower = col.toLowerCase()
  return ['date', 'at', 'time', 'from', 'to', 'opened', 'closed', 'effective', 'lastreading'].some((k) => lower.includes(k))
}

function renderCell(col: string, value: unknown): React.ReactNode {
  if (value === null || value === undefined || value === '') return <span className="text-muted-foreground">—</span>

  const numVal = typeof value === 'number' ? value : parseFloat(String(value))

  if (isMoneyColumn(col) && !isNaN(numVal)) {
    return <span className="font-medium tabular-nums">{formatPKR(numVal)}</span>
  }
  if (isVolumeColumn(col) && !isNaN(numVal)) {
    return <span className="tabular-nums">{formatNumber(numVal, 1)} L</span>
  }
  if (isPercentColumn(col) && !isNaN(numVal)) {
    return <span className="tabular-nums">{formatNumber(numVal, 2)}%</span>
  }
  if (isStatusColumn(col)) {
    const statusStr = String(value).toLowerCase()
    const statusColors: Record<string, string> = {
      active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
      completed: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
      approved: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
      paid: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
      pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      open: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      inactive: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
      closed: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
      cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      overdue: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    }
    const colorClass = statusColors[statusStr] || 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
    return (
      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${colorClass}`}>
        {String(value)}
      </span>
    )
  }
  if (isDateColumn(col)) {
    const dateStr = String(value)
    if (dateStr.includes('T')) {
      return <span className="text-muted-foreground text-xs">{formatDateTime(dateStr)}</span>
    }
    return <span className="text-muted-foreground text-xs">{formatDate(dateStr)}</span>
  }
  if (typeof value === 'boolean') {
    return value ? <span className="text-teal-600 font-medium">Yes</span> : <span className="text-muted-foreground">No</span>
  }
  return <span>{String(value)}</span>
}

function summaryValueLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase())
    .trim()
}

function isSummaryMoney(key: string): boolean {
  const lower = key.toLowerCase()
  return MONEY_KEYWORDS.some((k) => lower.includes(k)) && !PERCENT_KEYWORDS.some((k) => lower.includes(k)) && !['count', 'totaldays', 'totalshifts', 'totalrecords', 'totaltanks', 'totalfleets', 'totaltransactions', 'totalvolume', 'totalsessions', 'totalreadings', 'totalproducts', 'totalpaymentmodes', 'totalnozzles'].includes(lower)
}

function isSummaryVolume(key: string): boolean {
  const lower = key.toLowerCase()
  return VOLUME_KEYWORDS.some((k) => lower.includes(k)) && !PERCENT_KEYWORDS.some((k) => lower.includes(k))
}

function isSummaryPercent(key: string): boolean {
  const lower = key.toLowerCase()
  return PERCENT_KEYWORDS.some((k) => lower.includes(k)) || lower === 'utilization'
}

function renderSummaryValueString(key: string, value: unknown): string {
  if (value === null || value === undefined) return '—'
  const numVal = typeof value === 'number' ? value : parseFloat(String(value))
  if (key === 'error') return String(value)
  if (isSummaryPercent(key) && !isNaN(numVal)) return `${formatNumber(numVal, 2)}%`
  if (isSummaryVolume(key) && !isNaN(numVal)) return `${formatNumber(numVal, 1)} L`
  if (isSummaryMoney(key) && !isNaN(numVal)) return formatPKR(numVal)
  if (!isNaN(numVal) && typeof value === 'number') return formatNumber(numVal, 0)
  return String(value)
}

function renderSummaryValue(key: string, value: unknown): React.ReactNode {
  if (value === null || value === undefined) return '—'
  const numVal = typeof value === 'number' ? value : parseFloat(String(value))

  if (key === 'error') return <span className="text-red-500">{String(value)}</span>
  if (isSummaryPercent(key) && !isNaN(numVal)) return `${formatNumber(numVal, 2)}%`
  if (isSummaryVolume(key) && !isNaN(numVal)) return `${formatNumber(numVal, 1)} L`
  if (isSummaryMoney(key) && !isNaN(numVal)) return formatPKR(numVal)
  if (!isNaN(numVal) && typeof value === 'number') return formatNumber(numVal, 0)
  return String(value)
}

// ── Main Component ──────────────────────────────────

export default function ReportBuilderModule() {
  const { authUser } = useAppStore()
  const [selectedReport, setSelectedReport] = useState<ReportDefinition | null>(null)
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date()
    d.setDate(1)
    return d.toISOString().split('T')[0]
  })
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0])
  const [expandedCategory, setExpandedCategory] = useState<string>('sales')
  const [mobileShowReport, setMobileShowReport] = useState(false)
  const reportContentRef = useRef<HTMLDivElement>(null)

  const isSuperAdmin = authUser?.role === 'superadmin'
  const tenantName = authUser?.tenant?.name || 'ApexFlow Cloud'
  const stationName = 'Main Station'

  // ── Generate Report ──
  const generateReport = useCallback(async (report: ReportDefinition) => {
    setSelectedReport(report)
    setLoading(true)
    setReportData(null)
    setMobileShowReport(true)

    try {
      const params = new URLSearchParams({
        type: 'report',
        reportType: report.reportType,
        dateFrom,
        dateTo,
      })
      const res = await fetch(`/api/reports?${params}`)
      const data = await res.json()

      if (data.report) {
        setReportData({
          reportType: report.reportType,
          reportName: report.name,
          generatedAt: new Date().toISOString(),
          period: { from: dateFrom, to: dateTo },
          stationName: `${tenantName} - ${stationName}`,
          tenantName,
          columns: data.report.columns || [],
          rows: data.report.rows || [],
          summary: data.report.summary || {},
        })
      } else if (data.error) {
        setReportData({
          reportType: report.reportType,
          reportName: report.name,
          generatedAt: new Date().toISOString(),
          period: { from: dateFrom, to: dateTo },
          stationName: `${tenantName} - ${stationName}`,
          tenantName,
          columns: [],
          rows: [],
          summary: {},
          error: data.error,
        })
      }
    } catch {
      setReportData({
        reportType: report.reportType,
        reportName: report.name,
        generatedAt: new Date().toISOString(),
        period: { from: dateFrom, to: dateTo },
        stationName: `${tenantName} - ${stationName}`,
        tenantName,
        columns: [],
        rows: [],
        summary: {},
        error: 'Failed to connect to report server',
      })
    } finally {
      setLoading(false)
    }
  }, [dateFrom, dateTo, tenantName])

  const handleRefresh = useCallback(() => {
    if (selectedReport) generateReport(selectedReport)
  }, [selectedReport, generateReport])

  // ── Filtered Reports ──
  const filteredCategories = reportCategories.map((cat) => ({
    ...cat,
    reports: cat.reports.filter(
      (r) =>
        !searchQuery ||
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.description.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter((cat) => cat.reports.length > 0)

  // ── Export: Print ──
  const handlePrint = useCallback(() => {
    if (!reportData || !selectedReport) return
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const summaryEntries = Object.entries(reportData.summary).filter(([k]) => k !== 'error')
    const tableRows = reportData.rows

    const html = `<!DOCTYPE html>
<html>
<head>
  <title>${reportData.reportName} — FuelFlow OS</title>
  <style>
    @page { size: letter; margin: 0.6in 0.5in; }
    * { margin: 0; padding: 0; box-sizing: border-box; font-style: normal !important; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif; font-size: 11px; color: #1d1d1f; line-height: 1.5; }
    .report-header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 12px; border-bottom: 3px solid #0d9488; margin-bottom: 16px; }
    .header-left { display: flex; align-items: center; gap: 10px; }
    .logo-box { width: 36px; height: 36px; border-radius: 8px; background: #0d9488; display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 16px; }
    .header-title { font-size: 14px; font-weight: 700; color: #0d9488; letter-spacing: 0.5px; }
    .header-report-name { font-size: 16px; font-weight: 600; color: #1d1d1f; margin-top: 2px; }
    .header-tenant { font-size: 11px; color: #86868b; margin-top: 1px; }
    .header-right { text-align: right; }
    .header-detail-label { font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #86868b; }
    .header-detail-value { font-size: 11px; color: #1d1d1f; margin-top: 1px; }
    .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 16px; }
    .summary-card { border: 1px solid #e5e5e5; border-radius: 8px; padding: 10px 12px; }
    .summary-label { font-size: 8px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #86868b; margin-bottom: 2px; }
    .summary-value { font-size: 15px; font-weight: 700; color: #1d1d1f; }
    table { width: 100%; border-collapse: collapse; font-size: 10px; margin-bottom: 16px; }
    thead th { background: #0d9488; color: white; font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.3px; padding: 6px 8px; text-align: left; }
    thead th:first-child { border-radius: 6px 0 0 0; }
    thead th:last-child { border-radius: 0 6px 0 0; }
    tbody td { padding: 6px 8px; border-bottom: 0.5px solid #e5e5e5; }
    tbody tr:nth-child(even) { background: #f9fafb; }
    tbody tr:hover { background: #f0fdfa; }
    .report-footer { border-top: 2px solid #e5e5e5; padding-top: 8px; display: flex; justify-content: space-between; font-size: 9px; color: #86868b; margin-top: auto; }
    .status-badge { display: inline-block; padding: 1px 6px; border-radius: 10px; font-size: 9px; font-weight: 600; }
    .status-active { background: #d1fae5; color: #065f46; }
    .status-completed { background: #ccfbf1; color: #0f766e; }
    .status-pending { background: #fef3c7; color: #92400e; }
    .status-inactive { background: #f1f5f9; color: #475569; }
    .money { font-weight: 500; }
    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  </style>
</head>
<body>
  <div class="report-header">
    <div class="header-left">
      <div class="logo-box">F</div>
      <div>
        <div class="header-title">FUELFLOW OS</div>
        <div class="header-report-name">${reportData.reportName}</div>
        <div class="header-tenant">${reportData.tenantName || ''}</div>
      </div>
    </div>
    <div class="header-right">
      <div class="header-detail-label">Report Details</div>
      <div class="header-detail-value">Period: ${formatDate(reportData.period.from)} — ${formatDate(reportData.period.to)}</div>
      <div class="header-detail-value">Generated: ${formatDateTime(reportData.generatedAt)}</div>
      <div class="header-detail-value">${reportData.stationName || ''}</div>
    </div>
  </div>

  ${summaryEntries.length > 0 ? `
  <div class="summary-grid">
    ${summaryEntries.map(([k, v]) => `<div class="summary-card"><div class="summary-label">${summaryValueLabel(k)}</div><div class="summary-value">${renderSummaryValueString(k, v)}</div></div>`).join('')}
  </div>` : ''}

  ${tableRows.length > 0 ? `
  <table>
    <thead>
      <tr>
        <th>#</th>
        ${reportData.columns.map((c) => `<th>${prettyColumnName(c)}</th>`).join('')}
      </tr>
    </thead>
    <tbody>
      ${tableRows.map((row, i) => `<tr>
        <td>${i + 1}</td>
        ${reportData.columns.map((col) => `<td>${String(row[col] ?? '—')}</td>`).join('')}
      </tr>`).join('')}
    </tbody>
  </table>` : '<p style="text-align:center;color:#86868b;padding:20px;">No data available for this period.</p>'}

  <div class="report-footer">
    <div>FuelFlow OS — ApexFlow Ecosystem</div>
    <div>Confidential • Generated ${formatDateTime(reportData.generatedAt)}</div>
  </div>
</body>
</html>`

    printWindow.document.write(html)
    printWindow.document.close()
    setTimeout(() => printWindow.print(), 500)
  }, [reportData, selectedReport])

  // ── Export: CSV ──
  const handleCSV = useCallback(() => {
    if (!reportData || reportData.rows.length === 0) return
    const headers = ['#', ...reportData.columns]
    const csvRows = [
      headers.map((h) => `"${prettyColumnName(h)}"`).join(','),
      ...reportData.rows.map((row, i) =>
        [i + 1, ...reportData.columns.map((col) => {
          const val = row[col]
          if (val === null || val === undefined) return '""'
          return `"${String(val).replace(/"/g, '""')}"`
        })].join(',')
      ),
    ]
    const csvContent = csvRows.join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${reportData.reportType}_${dateFrom}_${dateTo}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }, [reportData, dateFrom, dateTo])

  // ── Export: JSON ──
  const handleJSON = useCallback(() => {
    if (!reportData) return
    const jsonContent = JSON.stringify(reportData, null, 2)
    const blob = new Blob([jsonContent], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${reportData.reportType}_${dateFrom}_${dateTo}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [reportData, dateFrom, dateTo])

  // ── Export: PDF (via Print) ──
  const handlePDF = useCallback(() => {
    handlePrint()
  }, [handlePrint])

  // ── Back on mobile ──
  const handleMobileBack = useCallback(() => {
    setMobileShowReport(false)
  }, [])

  // ── Summary entries ──
  const summaryEntries = reportData ? Object.entries(reportData.summary).filter(([k]) => k !== 'error') : []

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* ── Left Panel: Report Browser ── */}
      <div
        className={`${
          mobileShowReport ? 'hidden lg:flex' : 'flex'
        } w-full lg:w-[300px] flex-shrink-0 flex-col border-r border-border bg-[var(--macos-sidebar)] backdrop-blur-xl`}
      >
        {/* Titlebar */}
        <div className="macos-titlebar flex items-center gap-3 px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-teal-600 text-white">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-[13px] font-semibold text-foreground leading-tight">Report Center</h1>
              <p className="text-[10px] text-muted-foreground">{allReports.length} reports • {reportCategories.length} categories</p>
            </div>
          </div>
          {isSuperAdmin && <Crown className="w-3.5 h-3.5 text-amber-500 ml-auto" />}
        </div>

        {/* Search */}
        <div className="px-3 py-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search reports..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="macos-search"
            />
          </div>
        </div>

        {/* Date Range */}
        <div className="px-3 py-1.5 flex items-center gap-2">
          <CalendarDays className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
          <div className="flex-1 flex items-center gap-1.5">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="macos-search !pl-2 !text-[11px] flex-1"
            />
            <span className="text-[10px] text-muted-foreground">—</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="macos-search !pl-2 !text-[11px] flex-1"
            />
          </div>
        </div>

        {/* Categories & Reports */}
        <ScrollArea className="flex-1 px-2 py-1">
          <div className="space-y-0.5">
            {filteredCategories.map((category) => {
              const isExpanded = expandedCategory === category.id
              const CategoryIcon = category.icon
              return (
                <div key={category.id}>
                  <button
                    onClick={() => setExpandedCategory(isExpanded ? '' : category.id)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-black/[0.03] dark:hover:bg-white/[0.04] transition-colors"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-3 h-3 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="w-3 h-3 text-muted-foreground" />
                    )}
                    <CategoryIcon className={`w-3.5 h-3.5 ${category.color}`} />
                    <span className="text-[12px] font-medium text-foreground flex-1 text-left">{category.label}</span>
                    <Badge variant="secondary" className="text-[10px] h-4 px-1.5 min-w-[18px] justify-center bg-black/[0.04] dark:bg-white/[0.06]">
                      {category.reports.length}
                    </Badge>
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="overflow-hidden"
                      >
                        <div className="ml-3 pl-2 border-l border-border space-y-0.5 py-1">
                          {category.reports.map((report) => {
                            const isSelected = selectedReport?.id === report.id
                            return (
                              <button
                                key={report.id}
                                onClick={() => generateReport(report)}
                                className={`macos-sidebar-item w-full text-left !px-2.5 !py-2 ${
                                  isSelected
                                    ? 'active !bg-teal-600 !text-white'
                                    : ''
                                }`}
                              >
                                <div>
                                  <div className="text-[12px] font-medium leading-tight">{report.name}</div>
                                  <div className={`text-[10px] leading-snug mt-0.5 ${isSelected ? 'text-teal-100' : 'text-muted-foreground'}`}>
                                    {report.description}
                                  </div>
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
          </div>
        </ScrollArea>

        {/* Report Library Stats */}
        <div className="border-t border-border px-4 py-3">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <span>Report Library</span>
            <span>{allReports.length} reports in {reportCategories.length} categories</span>
          </div>
        </div>
      </div>

      {/* ── Right Panel: Report Preview ── */}
      <div className={`${mobileShowReport ? 'flex' : 'hidden lg:flex'} flex-1 flex-col min-w-0 bg-background`}>
        {/* Actions Bar */}
        {selectedReport && (
          <div className="macos-titlebar flex items-center gap-2 px-4 py-2">
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden h-7 w-7 p-0"
              onClick={handleMobileBack}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex-1 min-w-0">
              <h2 className="text-[13px] font-semibold text-foreground truncate">{selectedReport.name}</h2>
              <p className="text-[10px] text-muted-foreground truncate">{selectedReport.description}</p>
            </div>
            {reportData && !reportData.error && (
              <div className="flex items-center gap-1.5">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1.5 text-[11px] text-muted-foreground hover:text-foreground"
                  onClick={handlePrint}
                  title="Print Report"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Print</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1.5 text-[11px] text-muted-foreground hover:text-foreground"
                  onClick={handlePDF}
                  title="Export PDF"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">PDF</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1.5 text-[11px] text-muted-foreground hover:text-foreground"
                  onClick={handleCSV}
                  title="Export CSV"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">CSV</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1.5 text-[11px] text-muted-foreground hover:text-foreground"
                  onClick={handleJSON}
                  title="Export JSON"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">JSON</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1.5 text-[11px] text-muted-foreground hover:text-foreground"
                  onClick={handleRefresh}
                  disabled={loading}
                  title="Refresh Report"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Refresh</span>
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Preview Content */}
        <ScrollArea className="flex-1">
          <div className="p-4 lg:p-6">
            {!selectedReport ? (
              /* Empty State */
              <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                <div className="w-20 h-20 rounded-2xl bg-teal-50 dark:bg-teal-900/20 flex items-center justify-center mb-4">
                  <FileText className="w-10 h-10 text-teal-600 dark:text-teal-400" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-1">Report Center</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Select a report from the library on the left to generate a preview. Use the date range to filter the report period.
                </p>
              </div>
            ) : loading ? (
              /* Loading State */
              <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 text-teal-600 animate-spin mb-3" />
                <p className="text-sm text-muted-foreground">Generating report...</p>
              </div>
            ) : reportData?.error ? (
              /* Error State */
              <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center mb-4">
                  <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-1">Report Unavailable</h3>
                <p className="text-sm text-muted-foreground max-w-sm">{reportData.error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4 gap-1.5 text-teal-600 border-teal-200 hover:bg-teal-50"
                  onClick={handleRefresh}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Try Again
                </Button>
              </div>
            ) : reportData ? (
              /* Report Preview — Letter-Size */
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                ref={reportContentRef}
                className="mx-auto max-w-[850px]"
              >
                <div className="macos-card overflow-hidden">
                  {/* ── Report Header ── */}
                  <div className="px-6 pt-5 pb-4 border-b-[3px] border-teal-600">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-teal-600 text-white flex-shrink-0">
                          <Fuel className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-[11px] font-bold tracking-wider text-teal-600 uppercase">FuelFlow OS</div>
                          <div className="text-[16px] font-bold text-foreground leading-tight">{reportData.reportName}</div>
                          <div className="text-[11px] text-muted-foreground">{reportData.tenantName}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[8px] font-semibold tracking-wider text-muted-foreground uppercase">Report Details</div>
                        <div className="text-[11px] text-foreground mt-0.5">
                          Period: {formatDate(reportData.period.from)} — {formatDate(reportData.period.to)}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          Generated: {formatDateTime(reportData.generatedAt)}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {reportData.stationName}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ── Summary Cards ── */}
                  {summaryEntries.length > 0 && (
                    <div className="px-6 py-4">
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                        {summaryEntries.map(([key, value]) => (
                          <div key={key} className="rounded-lg border border-border p-3 bg-muted/30">
                            <div className="text-[8px] font-semibold tracking-wider text-muted-foreground uppercase">
                              {summaryValueLabel(key)}
                            </div>
                            <div className="text-[16px] font-bold text-foreground mt-0.5">
                              {renderSummaryValue(key, value)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ── Data Table ── */}
                  {reportData.rows.length > 0 ? (
                    <div className="px-6 pb-4">
                      <div className="overflow-x-auto rounded-lg border border-border">
                        <table className="macos-table">
                          <thead>
                            <tr>
                              <th className="!bg-teal-600 !text-white w-10">#</th>
                              {reportData.columns.map((col) => (
                                <th key={col} className="!bg-teal-600 !text-white">
                                  {prettyColumnName(col)}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {reportData.rows.map((row, i) => (
                              <tr key={i} className={i % 2 === 1 ? 'bg-muted/20' : ''}>
                                <td className="text-muted-foreground text-[11px] font-medium">{i + 1}</td>
                                {reportData.columns.map((col) => (
                                  <td key={col}>{renderCell(col, row[col])}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="px-6 py-8 text-center text-sm text-muted-foreground">
                      No data available for the selected period.
                    </div>
                  )}

                  {/* ── Report Footer ── */}
                  <div className="px-6 py-3 border-t-2 border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <span className="text-[9px] text-muted-foreground font-medium">
                      FuelFlow OS — ApexFlow Ecosystem
                    </span>
                    <span className="text-[9px] text-muted-foreground">
                      Confidential • Generated {formatDateTime(reportData.generatedAt)}
                    </span>
                  </div>
                </div>
              </motion.div>
            ) : null}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
