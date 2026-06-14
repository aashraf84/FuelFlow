'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BarChart3, FileText, Calendar, RefreshCw, Download, Printer, Search,
  TrendingUp, Table, Eye, Filter, Loader2, ChevronRight, ChevronDown,
  Fuel, Droplets, Receipt, Truck, DollarSign, ShoppingCart, Users, Wallet,
  Building2, Brain, Zap, Shield, Activity, Clock, Hash, ArrowUpDown,
  FileSpreadsheet, FileDown, X, Crown,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAppStore } from '@/stores/app-store'

// ── Types ──────────────────────────────────────

interface ReportCategory {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  reports: ReportDefinition[]
}

interface ReportDefinition {
  id: string
  name: string
  description: string
  reportType: string
  category: string
  icon: React.ComponentType<{ className?: string }>
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
      { id: 'retail-sales', name: 'Retail Store Sales', description: 'Retail product sales, category performance, and payment analysis', reportType: 'retail_sales', category: 'sales', icon: ShoppingCart },
      { id: 'cash-recon', name: 'Cash Reconciliation', description: 'Shift cash reconciliation with opening/closing cash and variance', reportType: 'cash_reconciliation', category: 'sales', icon: DollarSign },
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
      { id: 'fleet-summary', name: 'Fleet Account Summary', description: 'Fleet usage by company, transactions, volumes, and outstanding balances', reportType: 'fleet_summary', category: 'operations', icon: Truck },
      { id: 'station-perf', name: 'Station Performance', description: 'Multi-station comparison: revenue, volume, and efficiency metrics', reportType: 'station_performance', category: 'operations', icon: Building2 },
    ],
  },
  {
    id: 'customer',
    label: 'Customer & Loyalty',
    icon: Users,
    color: 'text-violet-600 dark:text-violet-400',
    reports: [
      { id: 'loyalty-summary', name: 'Loyalty Summary Report', description: 'Customer loyalty points, tier distribution, and redemption statistics', reportType: 'loyalty_summary', category: 'customer', icon: Users },
    ],
  },
  {
    id: 'compliance',
    label: 'Compliance & Security',
    icon: Shield,
    color: 'text-slate-600 dark:text-slate-400',
    reports: [
      { id: 'ev-cng', name: 'EV & CNG Session Report', description: 'EV charging and CNG dispensing session details and revenue', reportType: 'ev_cng_sessions', category: 'compliance', icon: Zap },
      { id: 'environmental', name: 'Environmental Report', description: 'Environmental alerts, vapor recovery readings, and compliance data', reportType: 'environmental_report', category: 'compliance', icon: Activity },
      { id: 'security-audit', name: 'Security Audit Report', description: 'Security alerts, login sessions, and audit trail', reportType: 'security_audit', category: 'compliance', icon: Shield },
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

// ── Main Component ──────────────────────────────────

export default function ReportBuilderModule() {
  const { authUser } = useAppStore()
  const [selectedReport, setSelectedReport] = useState<ReportDefinition | null>(null)
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date()
    d.setDate(1) // first of month
    return d.toISOString().split('T')[0]
  })
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0])
  const [expandedCategory, setExpandedCategory] = useState<string>('sales')
  const [previewMode, setPreviewMode] = useState(false)
  const printRef = useRef<HTMLDivElement>(null)

  const isSuperAdmin = authUser?.role === 'superadmin'
  const tenantName = authUser?.tenant?.name || 'ApexFlow Cloud'

  // ── Generate Report ──
  const generateReport = useCallback(async (report: ReportDefinition) => {
    setSelectedReport(report)
    setLoading(true)
    setReportData(null)
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
          stationName: 'ApexFlow Cloud - Main Station',
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
          stationName: 'ApexFlow Cloud - Main Station',
          tenantName,
          columns: [],
          rows: [],
          summary: { error: data.error },
        })
      }
    } catch {
      setReportData(null)
    } finally {
      setLoading(false)
    }
  }, [dateFrom, dateTo, tenantName])

  // ── Print Report ──
  const handlePrint = useCallback(() => {
    const printContent = printRef.current
    if (!printContent) return
    const printWindow = window.open('', '_blank')
    if (!printWindow) return
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${selectedReport?.name || 'FuelFlow Report'}</title>
        <style>
          @page { size: letter; margin: 0.75in 0.5in 0.75in 0.5in; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 10pt; color: #1a1a1a; line-height: 1.5; }
          .report-header { border-bottom: 3px solid #0d9488; padding-bottom: 12px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-start; }
          .report-header .left { flex: 1; }
          .report-header .right { text-align: right; font-size: 9pt; color: #666; }
          .report-header h1 { font-size: 16pt; color: #0d9488; font-weight: 700; margin-bottom: 2px; }
          .report-header h2 { font-size: 11pt; color: #333; font-weight: 600; }
          .report-header .meta { font-size: 9pt; color: #666; margin-top: 4px; }
          .report-body { margin-top: 8px; }
          .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 16px; }
          .summary-card { border: 1px solid #e5e7eb; border-radius: 6px; padding: 10px 12px; background: #f9fafb; }
          .summary-card .label { font-size: 8pt; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }
          .summary-card .value { font-size: 14pt; font-weight: 700; color: #111; margin-top: 2px; }
          .summary-card .value.teal { color: #0d9488; }
          .summary-card .value.red { color: #dc2626; }
          table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 9pt; }
          thead th { background: #0d9488; color: #fff; padding: 7px 10px; text-align: left; font-weight: 600; font-size: 8.5pt; text-transform: uppercase; letter-spacing: 0.3px; }
          thead th:first-child { border-radius: 4px 0 0 0; }
          thead th:last-child { border-radius: 0 4px 0 0; }
          tbody td { padding: 6px 10px; border-bottom: 1px solid #f3f4f6; }
          tbody tr:nth-child(even) { background: #f9fafb; }
          tbody tr:hover { background: #f0fdfa; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .font-mono { font-family: 'SF Mono', 'Fira Code', monospace; }
          .font-bold { font-weight: 700; }
          .text-teal { color: #0d9488; }
          .text-red { color: #dc2626; }
          .text-green { color: #16a34a; }
          .report-footer { border-top: 2px solid #e5e7eb; padding-top: 8px; margin-top: 20px; display: flex; justify-content: space-between; font-size: 8pt; color: #9ca3af; }
          .badge { display: inline-block; padding: 1px 6px; border-radius: 4px; font-size: 8pt; font-weight: 600; }
          .badge-green { background: #dcfce7; color: #16a34a; }
          .badge-red { background: #fee2e2; color: #dc2626; }
          .badge-amber { background: #fef3c7; color: #d97706; }
          .badge-teal { background: #ccfbf1; color: #0d9488; }
          .no-data { text-align: center; padding: 40px; color: #9ca3af; font-size: 11pt; }
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .summary-card { background: #f9fafb !important; }
            thead th { background: #0d9488 !important; color: #fff !important; }
          }
        </style>
      </head>
      <body>
        ${printContent.innerHTML}
        <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `)
    printWindow.document.close()
  }, [selectedReport])

  // ── Export CSV ──
  const handleExportCSV = useCallback(() => {
    if (!reportData || !reportData.rows.length) return
    const headers = reportData.columns.join(',')
    const csvRows = reportData.rows.map((row) =>
      reportData.columns.map((col) => {
        const val = row[col]
        if (val === null || val === undefined) return ''
        const str = String(val)
        return str.includes(',') || str.includes('"') || str.includes('\n')
          ? `"${str.replace(/"/g, '""')}"`
          : str
      }).join(',')
    )
    const csv = [headers, ...csvRows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${selectedReport?.id || 'report'}_${dateFrom}_${dateTo}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }, [reportData, selectedReport, dateFrom, dateTo])

  // ── Export JSON ──
  const handleExportJSON = useCallback(() => {
    if (!reportData) return
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${selectedReport?.id || 'report'}_${dateFrom}_${dateTo}.json`
    link.click()
    URL.revokeObjectURL(url)
  }, [reportData, selectedReport, dateFrom, dateTo])

  // ── Filtered Reports ──
  const filteredCategories = searchQuery
    ? [{
        id: 'search',
        label: 'Search Results',
        icon: Search,
        color: 'text-teal-600 dark:text-teal-400',
        reports: allReports.filter(
          (r) =>
            r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.reportType.toLowerCase().includes(searchQuery.toLowerCase())
        ),
      }]
    : reportCategories

  // ── Render Cell Value ──
  const renderCell = (col: string, value: unknown) => {
    if (value === null || value === undefined) return '-'
    const colLower = col.toLowerCase()
    // Check for volume/capacity/level FIRST (before monetary, to avoid Rs prefix on non-monetary totals)
    if (colLower.includes('volume') || colLower.includes('capacity') || colLower.includes('level') ||
        colLower.includes('qty') || colLower.includes('quantity') || colLower.includes('stock')) {
      if (typeof value === 'number') return <span className="font-mono">{formatNumber(value)} L</span>
    }
    if (colLower.includes('variance') || colLower.includes('percentage') || colLower.includes('rate') ||
        colLower.includes('utilization') || colLower.includes('commission')) {
      if (typeof value === 'number') {
        const isNeg = value < 0
        return <span className={`font-mono ${isNeg ? 'text-red-500' : ''}`}>{formatNumber(value)}%</span>
      }
    }
    // Monetary detection — exclude non-monetary totals
    const isNonMonetaryCol = colLower.includes('count') || colLower.includes('qty') || colLower.includes('volume') ||
      colLower.includes('capacity') || colLower.includes('level') || colLower.includes('transactions')
    if (!isNonMonetaryCol && (
        colLower.includes('amount') || colLower.includes('revenue') || colLower.includes('cost') ||
        colLower.includes('price') || colLower.includes('income') || colLower.includes('expense') ||
        colLower.includes('balance') || colLower.includes('total') || colLower.includes('net') ||
        colLower.includes('pay') || colLower.includes('salary') || colLower.includes('outstanding') ||
        colLower.includes('credit') || colLower.includes('debit') || colLower.includes('cash') ||
        (colLower.includes('sales') && !colLower.includes('volume') && !colLower.includes('count') && !colLower.includes('qty')))) {
      if (typeof value === 'number') return <span className="font-mono">{formatPKR(value)}</span>
    }
    if (colLower.includes('date') || colLower.includes('at') || colLower.includes('time') || colLower.includes('reading')) {
      if (typeof value === 'string' && value.includes('T')) return formatDate(value)
    }
    if (typeof value === 'number') return <span className="font-mono">{formatNumber(value)}</span>
    if (typeof value === 'boolean') return value ? <Badge className="bg-emerald-500/10 text-emerald-600 text-[9px] border-emerald-500/20">Yes</Badge> : <Badge className="bg-red-500/10 text-red-500 text-[9px] border-red-500/20">No</Badge>
    // Status badges
    if (typeof value === 'string') {
      const statusColors: Record<string, string> = {
        active: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
        completed: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
        paid: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
        approved: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
        present: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
        idle: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
        pending: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
        partial: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
        inactive: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
        overdue: 'bg-red-500/10 text-red-500 border-red-500/20',
        expired: 'bg-red-500/10 text-red-500 border-red-500/20',
        revoked: 'bg-red-500/10 text-red-500 border-red-500/20',
        cancelled: 'bg-red-500/10 text-red-500 border-red-500/20',
        absent: 'bg-red-500/10 text-red-500 border-red-500/20',
        late: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
        normal: 'bg-teal-500/10 text-teal-600 border-teal-500/20',
      }
      if (statusColors[value.toLowerCase()]) {
        return <Badge className={`text-[9px] ${statusColors[value.toLowerCase()]}`}>{String(value)}</Badge>
      }
    }
    return String(value)
  }

  // ── Report Preview (Letter Format) ──
  const renderReportPreview = () => {
    if (!reportData) return null
    const hasData = reportData.rows.length > 0
    const summaryEntries = Object.entries(reportData.summary).filter(([k]) => k !== 'error')

    return (
      <div ref={printRef} className="bg-white text-gray-900 rounded-lg shadow-sm" style={{ fontFamily: "'Helvetica Neue', Arial, sans-serif" }}>
        {/* ── Letter Header ── */}
        <div className="border-b-[3px] border-teal-600 pb-3 px-6 pt-5 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="flex size-7 items-center justify-center rounded-lg bg-teal-600 text-white">
                <Fuel className="size-3.5" />
              </div>
              <span className="text-[11px] font-bold text-teal-600 tracking-wide">FUELFLOW OS</span>
            </div>
            <h1 className="text-[18px] font-bold text-teal-700 leading-tight">{reportData.reportName}</h1>
            <p className="text-[11px] text-gray-500 mt-0.5">{reportData.tenantName}</p>
          </div>
          <div className="text-right text-[10px] text-gray-500">
            <p className="font-semibold text-gray-700">Report Details</p>
            <p>Period: {formatDate(reportData.period.from)} — {formatDate(reportData.period.to)}</p>
            <p>Generated: {formatDateTime(reportData.generatedAt)}</p>
            {reportData.stationName && <p>Station: {reportData.stationName}</p>}
            {isSuperAdmin && (
              <div className="flex items-center gap-1 justify-end mt-1">
                <Crown className="size-3 text-orange-500" />
                <span className="text-orange-600 font-semibold">Super Admin</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Summary Cards ── */}
        {summaryEntries.length > 0 && (
          <div className="px-6 pt-4 pb-2">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {summaryEntries.slice(0, 8).map(([key, value]) => {
                const kl = key.toLowerCase()
                const isNonMonetaryTotal = kl.includes('tanks') || kl.includes('days') || kl.includes('transactions') ||
                  kl.includes('volume') || kl.includes('capacity') || kl.includes('level') || kl.includes('count') || kl.includes('qty')
                const isAmount = !isNonMonetaryTotal && (
                  kl.includes('amount') || kl.includes('revenue') || kl.includes('income') || kl.includes('expense') ||
                  kl.includes('cost') || kl.includes('balance') || kl.includes('total') || kl.includes('profit') ||
                  kl.includes('pay') || kl.includes('outstanding') ||
                  (kl.includes('sales') && typeof value === 'number')
                )
                const isNeg = typeof value === 'number' && value < 0
                const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())
                return (
                  <div key={key} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                    <p className="text-[8px] text-gray-500 uppercase tracking-wider font-medium">{label}</p>
                    <p className={`text-[16px] font-bold mt-0.5 ${isNeg ? 'text-red-600' : isAmount ? 'text-teal-700' : 'text-gray-900'}`}>
                      {typeof value === 'number'
                        ? isAmount ? formatPKR(value)
                          : kl.includes('volume') || kl.includes('capacity') || kl.includes('level') || kl.includes('qty') ? `${formatNumber(value)} L`
                          : kl.includes('utilization') || kl.includes('variance') || kl.includes('rate') ? `${formatNumber(value)}%`
                          : formatNumber(value)
                        : String(value)}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Error State ── */}
        {reportData.summary.error && (
          <div className="px-6 py-3">
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-[11px] text-red-600">
              {String(reportData.summary.error)}
            </div>
          </div>
        )}

        {/* ── Data Table ── */}
        <div className="px-6 pb-4">
          {hasData ? (
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="w-full text-[10px]">
                <thead>
                  <tr className="bg-teal-600 text-white">
                    <th className="px-3 py-2 text-left font-semibold text-[9px] uppercase tracking-wider">#</th>
                    {reportData.columns.map((col) => (
                      <th key={col} className="px-3 py-2 text-left font-semibold text-[9px] uppercase tracking-wider">
                        {col.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reportData.rows.map((row, i) => (
                    <tr key={i} className={`border-b border-gray-100 ${i % 2 === 1 ? 'bg-gray-50' : ''}`}>
                      <td className="px-3 py-1.5 text-gray-400 font-mono">{i + 1}</td>
                      {reportData.columns.map((col) => (
                        <td key={col} className="px-3 py-1.5">{renderCell(col, row[col])}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <FileText className="size-10 mx-auto mb-2 opacity-30" />
              <p className="text-[12px]">No data found for the selected period</p>
              <p className="text-[10px] mt-1">Try adjusting the date range or select a different report</p>
            </div>
          )}
        </div>

        {/* ── Letter Footer ── */}
        <div className="border-t-2 border-gray-200 px-6 py-2 flex justify-between items-center text-[8px] text-gray-400">
          <div>
            <span className="font-semibold text-gray-500">FuelFlow OS</span> — ApexFlow Ecosystem
            {isSuperAdmin && <span className="ml-2 text-orange-500 font-semibold">• Super Admin Access</span>}
          </div>
          <div>
            Confidential • Generated {formatDateTime(reportData.generatedAt)}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-[17px] font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="size-5 text-slate-600 dark:text-slate-400" />
            Report Center
          </h2>
          <p className="text-[12px] text-muted-foreground mt-0.5">Professional reports with print & export capabilities</p>
        </div>
        <div className="flex items-center gap-2">
          {selectedReport && reportData && (
            <>
              <Button variant="outline" size="sm" className="h-8 text-[11px] gap-1.5" onClick={handlePrint}>
                <Printer className="size-3.5" />
                Print
              </Button>
              <Button variant="outline" size="sm" className="h-8 text-[11px] gap-1.5" onClick={handleExportCSV}>
                <FileSpreadsheet className="size-3.5" />
                CSV
              </Button>
              <Button variant="outline" size="sm" className="h-8 text-[11px] gap-1.5" onClick={handleExportJSON}>
                <FileDown className="size-3.5" />
                JSON
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="flex gap-4">
        {/* ── Left Panel: Report Browser ── */}
        <div className={`shrink-0 ${selectedReport ? 'w-[280px] hidden lg:block' : 'w-full lg:w-[340px]'} space-y-2`}>
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search reports..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 pl-9 text-[12px] macos-card"
            />
          </div>

          {/* Date Range */}
          <div className="macos-card p-3 space-y-2">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Date Range</p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[9px] text-muted-foreground">From</label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="h-8 text-[11px]"
                />
              </div>
              <div>
                <label className="text-[9px] text-muted-foreground">To</label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="h-8 text-[11px]"
                />
              </div>
            </div>
          </div>

          {/* Report Categories */}
          <div className="space-y-1 max-h-[calc(100vh-380px)] overflow-y-auto pr-1">
            {filteredCategories.map((category) => (
              <div key={category.id}>
                <button
                  onClick={() => setExpandedCategory(expandedCategory === category.id ? '' : category.id)}
                  className="w-full flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-black/[0.03] dark:hover:bg-white/[0.04] transition-colors"
                >
                  <ChevronRight className={`size-3 text-muted-foreground transition-transform ${expandedCategory === category.id ? 'rotate-90' : ''}`} />
                  <category.icon className={`size-3.5 ${category.color}`} />
                  <span className="text-[12px] font-semibold text-foreground flex-1 text-left">{category.label}</span>
                  <Badge variant="outline" className="text-[9px] px-1.5 py-0">{category.reports.length}</Badge>
                </button>
                <AnimatePresence>
                  {expandedCategory === category.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="overflow-hidden ml-4"
                    >
                      {category.reports.map((report) => (
                        <button
                          key={report.id}
                          onClick={() => generateReport(report)}
                          className={`w-full text-left px-3 py-2.5 rounded-lg mb-0.5 transition-all ${
                            selectedReport?.id === report.id
                              ? 'bg-slate-600 text-white shadow-sm'
                              : 'hover:bg-black/[0.04] dark:hover:bg-white/[0.04]'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <report.icon className={`size-3.5 ${selectedReport?.id === report.id ? 'text-white' : 'text-muted-foreground'}`} />
                            <div className="flex-1 min-w-0">
                              <p className={`text-[11px] font-semibold truncate ${selectedReport?.id === report.id ? 'text-white' : 'text-foreground'}`}>
                                {report.name}
                              </p>
                              <p className={`text-[9px] leading-tight mt-0.5 line-clamp-2 ${selectedReport?.id === report.id ? 'text-white/60' : 'text-muted-foreground'}`}>
                                {report.description}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>

          {/* Quick Stats */}
          <div className="macos-card p-3">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Report Library</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="text-center p-2 rounded-lg bg-teal-500/5 border border-teal-500/10">
                <p className="text-[14px] font-bold text-teal-600">{allReports.length}</p>
                <p className="text-[9px] text-muted-foreground">Total Reports</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-violet-500/5 border border-violet-500/10">
                <p className="text-[14px] font-bold text-violet-600">{reportCategories.length}</p>
                <p className="text-[9px] text-muted-foreground">Categories</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right Panel: Report Preview ── */}
        <div className="flex-1 min-w-0">
          {!selectedReport ? (
            /* Empty State */
            <div className="macos-card flex flex-col items-center justify-center py-20">
              <div className="flex size-16 items-center justify-center rounded-2xl bg-slate-500/10 mb-4">
                <BarChart3 className="size-7 text-slate-400" />
              </div>
              <h3 className="text-[15px] font-semibold text-foreground">Select a Report</h3>
              <p className="text-[12px] text-muted-foreground mt-1 text-center max-w-xs">
                Choose a report from the sidebar to generate a professional preview with print and export options
              </p>
              <div className="flex flex-wrap justify-center gap-2 mt-6">
                {reportCategories.map((cat) => (
                  <Badge key={cat.id} variant="outline" className={`text-[10px] ${cat.color} border-current/20`}>
                    <cat.icon className="size-3 mr-1" />
                    {cat.label} ({cat.reports.length})
                  </Badge>
                ))}
              </div>
            </div>
          ) : loading ? (
            /* Loading State */
            <div className="macos-card flex flex-col items-center justify-center py-20">
              <Loader2 className="size-8 text-teal-500 animate-spin mb-3" />
              <p className="text-[13px] font-semibold text-foreground">Generating Report</p>
              <p className="text-[11px] text-muted-foreground mt-1">{selectedReport.name}...</p>
            </div>
          ) : (
            /* Report Preview */
            <div className="space-y-3">
              {/* Report Actions Bar */}
              <div className="flex items-center justify-between macos-card px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <selectedReport.icon className="size-4 text-slate-600 dark:text-slate-400" />
                  <span className="text-[13px] font-semibold text-foreground">{selectedReport.name}</span>
                  <Badge variant="outline" className="text-[9px]">{selectedReport.category}</Badge>
                </div>
                <div className="flex items-center gap-1.5">
                  <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1" onClick={() => generateReport(selectedReport)}>
                    <RefreshCw className="size-3" />
                    Refresh
                  </Button>
                  <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1" onClick={handlePrint}>
                    <Printer className="size-3" />
                    Print
                  </Button>
                  <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1" onClick={handleExportCSV}>
                    <FileSpreadsheet className="size-3" />
                    CSV
                  </Button>
                  <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1" onClick={handleExportJSON}>
                    <FileDown className="size-3" />
                    JSON
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-[10px] gap-1 lg:hidden"
                    onClick={() => setSelectedReport(null)}
                  >
                    <X className="size-3" />
                  </Button>
                </div>
              </div>

              {/* Letter-Size Preview */}
              <div className="macos-card p-4 overflow-auto max-h-[calc(100vh-260px)]">
                {/* Page Label */}
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Letter Size Preview (8.5" × 11")</p>
                  <div className="flex items-center gap-1.5">
                    <div className="size-2 rounded-full bg-emerald-500" />
                    <span className="text-[10px] text-muted-foreground">Live Data</span>
                  </div>
                </div>
                {renderReportPreview()}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
