'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart3, FileText, Calendar, Plus, RefreshCw, Clock,
  PieChart, TrendingUp, Table, LayoutDashboard, CheckCircle2,
  Mail, Download, ChevronRight, Eye, Share2, Trash2,
  Activity, Database, Filter, AlertTriangle, Loader2,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAppStore } from '@/stores/app-store'

// ── Types ──────────────────────────────────────

interface ReportTemplate {
  id: string
  tenantId: string
  name: string
  description: string | null
  reportType: string
  category: string | null
  dataSource: string
  columns: string
  filters: string | null
  groupBy: string | null
  sortBy: string | null
  chartType: string | null
  isSystem: boolean
  isPublic: boolean
  createdBy: string | null
  createdAt: string
  updatedAt: string
}

interface ScheduledReport {
  id: string
  tenantId: string
  reportTemplateId: string
  scheduleType: string
  scheduleTime: string | null
  scheduleDay: number | null
  recipients: string // JSON array of emails
  format: string
  lastRunAt: string | null
  nextRunAt: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface DailyReport {
  id: string
  stationId: string
  reportDate: string
  totalRevenue: number
  fuelRevenue: number
  retailRevenue: number
  totalVolume: number
  transactionCount: number
  averageTicket: number
  cashVariance: number
  fuelVariance: number
  expenses: number
  netProfit: number
  createdAt: string
  station: { id: string; name: string; code: string; city: string | null }
}

// ── Static Config ──────────────────────────────────

const TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  daily_sales: { label: 'Daily Sales', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
  shift_summary: { label: 'Shift Summary', color: 'bg-sky-500/10 text-sky-600 border-sky-500/20' },
  fuel_variance: { label: 'Fuel Variance', color: 'bg-red-500/10 text-red-600 border-red-500/20' },
  wet_stock: { label: 'Wet Stock', color: 'bg-teal-500/10 text-teal-600 border-teal-500/20' },
  financial: { label: 'Financial', color: 'bg-teal-500/10 text-teal-600 border-teal-500/20' },
  compliance: { label: 'Compliance', color: 'bg-slate-500/10 text-slate-600 border-slate-500/20' },
  custom: { label: 'Custom', color: 'bg-teal-500/10 text-teal-600 border-teal-500/20' },
}

const CATEGORY_CONFIG: Record<string, string> = {
  operations: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  finance: 'bg-teal-500/10 text-teal-600 border-teal-500/20',
  compliance: 'bg-red-500/10 text-red-600 border-red-500/20',
  management: 'bg-sky-500/10 text-sky-600 border-sky-500/20',
}

const CHART_ICONS: Record<string, React.ElementType> = {
  bar: BarChart3,
  line: TrendingUp,
  pie: PieChart,
  table: Table,
}

const SCHEDULE_BADGE: Record<string, string> = {
  daily: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  weekly: 'bg-sky-500/10 text-sky-600 border-sky-500/20',
  monthly: 'bg-teal-500/10 text-teal-600 border-teal-500/20',
  quarterly: 'bg-teal-500/10 text-teal-600 border-teal-500/20',
}

const FORMAT_BADGE: Record<string, string> = {
  pdf: 'bg-red-500/10 text-red-600 border-red-500/20',
  excel: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  csv: 'bg-sky-500/10 text-sky-600 border-sky-500/20',
}

// ── Component ──────────────────────────────────────

export default function ReportBuilderModule() {
  const [activeTab, setActiveTab] = useState('templates')
  const [templates, setTemplates] = useState<ReportTemplate[]>([])
  const [scheduledReports, setScheduledReports] = useState<ScheduledReport[]>([])
  const [recentReports, setRecentReports] = useState<DailyReport[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [generating, setGenerating] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [templatesRes, scheduledRes, dailyRes] = await Promise.all([
        fetch('/api/reports?type=templates'),
        fetch('/api/reports?type=scheduled'),
        fetch('/api/daily-reports?days=30'),
      ])

      if (!templatesRes.ok) throw new Error('Failed to fetch report templates')

      const templatesData = await templatesRes.json()
      const scheduledData = scheduledRes.ok ? await scheduledRes.json() : { scheduled: [] }
      const dailyData = dailyRes.ok ? await dailyRes.json() : { reports: [] }

      setTemplates(templatesData.templates || [])
      setScheduledReports(scheduledData.scheduled || [])
      setRecentReports(dailyData.reports || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load report data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleGenerate = async (templateId: string, templateName: string) => {
    setGenerating(templateId)
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'run_report',
          templateId,
        }),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || 'Report generation failed')
      }

      // Refresh recent reports after generation
      const dailyRes = await fetch('/api/daily-reports?days=30')
      if (dailyRes.ok) {
        const dailyData = await dailyRes.json()
        setRecentReports(dailyData.reports || [])
      }
    } catch (err) {
      // Silent fail - could add toast notification
    } finally {
      setGenerating(null)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-5 bg-muted rounded w-32 animate-pulse" />
          <div className="h-7 bg-muted rounded w-28 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="macos-card p-4 animate-pulse">
              <div className="flex items-start gap-2.5 mb-2">
                <div className="size-9 rounded-[10px] bg-muted" />
                <div className="flex-1">
                  <div className="h-4 bg-muted rounded w-32 mb-1" />
                  <div className="h-3 bg-muted rounded w-16" />
                </div>
              </div>
              <div className="h-3 bg-muted rounded w-full mb-1" />
              <div className="h-3 bg-muted rounded w-2/3" />
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
        <p className="text-[13px] font-medium">Failed to load report data</p>
        <p className="text-[11px] mt-1">{error}</p>
        <button onClick={fetchData} className="macos-btn mt-4 text-[12px] flex items-center gap-1.5">
          <RefreshCw className="size-3" /> Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={fetchData} className="macos-btn-secondary text-[11px] px-2.5 py-1 flex items-center gap-1">
          <RefreshCw className="size-3" /> Refresh
        </button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="overflow-x-auto pb-1">
          <TabsList className="h-8 w-max gap-0.5 bg-muted/50">
            <TabsTrigger value="templates" className="text-[11px] px-3 h-6 data-[state=active]:bg-teal-500/15 data-[state=active]:text-teal-600">Templates</TabsTrigger>
            <TabsTrigger value="scheduled" className="text-[11px] px-3 h-6 data-[state=active]:bg-teal-500/15 data-[state=active]:text-teal-600">Scheduled</TabsTrigger>
            <TabsTrigger value="builder" className="text-[11px] px-3 h-6 data-[state=active]:bg-teal-500/15 data-[state=active]:text-teal-600">Builder</TabsTrigger>
            <TabsTrigger value="recent" className="text-[11px] px-3 h-6 data-[state=active]:bg-teal-500/15 data-[state=active]:text-teal-600">Recent Reports</TabsTrigger>
          </TabsList>
        </div>

        {/* ── Templates ── */}
        <TabsContent value="templates" className="mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="macos-section-header">{templates.length} Report Templates</div>
            <button className="macos-btn text-[11px] px-2.5 py-1 flex items-center gap-1" onClick={() => setActiveTab('builder')}>
              <Plus className="size-3" /> Create Template
            </button>
          </div>
          {templates.length === 0 ? (
            <div className="macos-card p-12 flex flex-col items-center justify-center text-muted-foreground">
              <FileText className="size-10 mb-3 opacity-20" />
              <p className="text-[13px] font-medium">No report templates</p>
              <p className="text-[11px]">Create your first report template using the Builder tab</p>
              <button onClick={() => setActiveTab('builder')} className="macos-btn mt-4 text-[12px] flex items-center gap-1.5">
                <Plus className="size-3" /> Create Template
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {templates.map((template, i) => {
                const typeConf = TYPE_CONFIG[template.reportType] || TYPE_CONFIG.custom
                const ChartIcon = CHART_ICONS[template.chartType || ''] || Table
                return (
                  <motion.div
                    key={template.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="macos-card p-4"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className="size-9 rounded-[10px] bg-teal-500/10 flex items-center justify-center">
                          <ChartIcon className="size-4 text-teal-500" />
                        </div>
                        <div>
                          <h3 className="text-[13px] font-semibold">{template.name}</h3>
                          <Badge variant="outline" className={`text-[9px] px-1.5 py-0 ${typeConf.color}`}>{typeConf.label}</Badge>
                        </div>
                      </div>
                      {template.isSystem && (
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-slate-500/10 text-slate-500 border-slate-500/20">System</Badge>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-2 line-clamp-2">{template.description || 'No description'}</p>
                    <div className="flex flex-wrap items-center gap-1.5 mt-3">
                      {template.category && (
                        <Badge variant="outline" className={`text-[9px] px-1.5 py-0 capitalize ${CATEGORY_CONFIG[template.category] || ''}`}>
                          {template.category}
                        </Badge>
                      )}
                      {template.chartType && (
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-teal-500/5 text-teal-600 border-teal-500/15">
                          {template.chartType}
                        </Badge>
                      )}
                      {template.isPublic && (
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Public</Badge>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                      <span className="text-[10px] text-muted-foreground">Created: {new Date(template.createdAt).toLocaleDateString()}</span>
                      <div className="flex gap-1.5">
                        <button className="size-6 rounded-md flex items-center justify-center hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors" title="Preview">
                          <Eye className="size-3 text-muted-foreground" />
                        </button>
                        <button
                          className="macos-btn text-[10px] px-2 py-0.5 flex items-center gap-1"
                          disabled={generating === template.id}
                          onClick={() => handleGenerate(template.id, template.name)}
                        >
                          {generating === template.id ? (
                            <Loader2 className="size-2.5 animate-spin" />
                          ) : (
                            <Activity className="size-2.5" />
                          )}
                          Generate
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* ── Scheduled Reports ── */}
        <TabsContent value="scheduled" className="mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="macos-section-header">Scheduled Reports</div>
            <button className="macos-btn text-[11px] px-2.5 py-1 flex items-center gap-1">
              <Plus className="size-3" /> New Schedule
            </button>
          </div>
          {scheduledReports.length === 0 ? (
            <div className="macos-card p-12 flex flex-col items-center justify-center text-muted-foreground">
              <Calendar className="size-10 mb-3 opacity-20" />
              <p className="text-[13px] font-medium">No scheduled reports</p>
              <p className="text-[11px]">Schedule a report to run automatically at specified intervals</p>
            </div>
          ) : (
            <div className="macos-card overflow-hidden">
              <div className="max-h-[420px] overflow-y-auto">
                <table className="macos-table">
                  <thead>
                    <tr>
                      <th>Template</th>
                      <th>Schedule</th>
                      <th>Time</th>
                      <th>Format</th>
                      <th>Recipients</th>
                      <th>Last Run</th>
                      <th>Next Run</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scheduledReports.map(sched => {
                      let recipients: string[] = []
                      try { recipients = JSON.parse(sched.recipients) } catch { recipients = [sched.recipients] }
                      return (
                        <tr key={sched.id}>
                          <td className="text-[13px] font-medium">{sched.reportTemplateId}</td>
                          <td>
                            <Badge variant="outline" className={`text-[9px] px-1.5 py-0 font-semibold capitalize ${SCHEDULE_BADGE[sched.scheduleType] || ''}`}>
                              {sched.scheduleType}
                            </Badge>
                          </td>
                          <td className="text-[12px] text-muted-foreground">{sched.scheduleTime || 'Auto'}</td>
                          <td>
                            <Badge variant="outline" className={`text-[9px] px-1.5 py-0 font-semibold uppercase ${FORMAT_BADGE[sched.format] || ''}`}>
                              {sched.format}
                            </Badge>
                          </td>
                          <td>
                            <div className="flex items-center gap-1">
                              <Mail className="size-2.5 text-muted-foreground shrink-0" />
                              <span className="text-[11px] text-muted-foreground">{recipients.length} recipient{recipients.length > 1 ? 's' : ''}</span>
                            </div>
                          </td>
                          <td className="text-[11px] text-muted-foreground whitespace-nowrap">
                            {sched.lastRunAt ? new Date(sched.lastRunAt).toLocaleDateString('en-PK', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Never'}
                          </td>
                          <td className="text-[11px] text-muted-foreground whitespace-nowrap">
                            {sched.nextRunAt ? new Date(sched.nextRunAt).toLocaleDateString('en-PK', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                          </td>
                          <td>
                            <div className="flex items-center gap-1.5">
                              <div className={`macos-status-dot ${sched.isActive ? 'macos-status-online' : 'macos-status-offline'}`} />
                              <span className={`text-[11px] font-medium ${sched.isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}>
                                {sched.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ── Builder ── */}
        <TabsContent value="builder" className="mt-4 space-y-4">
          <div className="macos-section-header">Report Builder</div>
          <div className="macos-card p-5">
            <div className="flex items-start gap-4 mb-6">
              <div className="size-10 rounded-[10px] bg-teal-500/10 flex items-center justify-center shrink-0">
                <LayoutDashboard className="size-5 text-teal-500" />
              </div>
              <div>
                <h2 className="text-[15px] font-semibold">Create Custom Report</h2>
                <p className="text-[12px] text-muted-foreground mt-0.5">Build a custom report template with your choice of data sources, filters, and visualization</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="macos-group">
                <div className="macos-group-item">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Report Name</span>
                    <span className="text-[13px] font-medium">Custom Report</span>
                  </div>
                </div>
                <div className="macos-group-item">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Report Type</span>
                    <span className="text-[13px]">Custom</span>
                  </div>
                </div>
                <div className="macos-group-item">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Category</span>
                    <span className="text-[13px]">Operations</span>
                  </div>
                </div>
                <div className="macos-group-item">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Chart Type</span>
                    <span className="text-[13px]">Bar Chart</span>
                  </div>
                </div>
              </div>

              <div className="macos-group">
                <div className="macos-group-item">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Data Source</span>
                    <span className="text-[13px]">Fuel Sales</span>
                  </div>
                </div>
                <div className="macos-group-item">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Date Range</span>
                    <span className="text-[13px]">Last 30 Days</span>
                  </div>
                </div>
                <div className="macos-group-item">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Group By</span>
                    <span className="text-[13px]">Fuel Type</span>
                  </div>
                </div>
                <div className="macos-group-item">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Visibility</span>
                    <span className="text-[13px]">Private</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-teal-500/10 text-teal-600 border-teal-500/20">
                  <Database className="size-2.5 mr-0.5" /> 3 columns selected
                </Badge>
                <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-sky-500/10 text-sky-600 border-sky-500/20">
                  <Filter className="size-2.5 mr-0.5" /> 2 filters applied
                </Badge>
              </div>
              <div className="flex gap-2">
                <button className="macos-btn-secondary text-[11px] px-2.5 py-1">Preview</button>
                <button className="macos-btn text-[11px] px-2.5 py-1 flex items-center gap-1">
                  <Plus className="size-3" /> Create Template
                </button>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ── Recent Reports ── */}
        <TabsContent value="recent" className="mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="macos-section-header">Generated Reports ({recentReports.length})</div>
            <button className="macos-btn-secondary text-[11px] px-2.5 py-1 flex items-center gap-1">
              <Download className="size-3" /> Export All
            </button>
          </div>
          {recentReports.length === 0 ? (
            <div className="macos-card p-12 flex flex-col items-center justify-center text-muted-foreground">
              <BarChart3 className="size-10 mb-3 opacity-20" />
              <p className="text-[13px] font-medium">No generated reports yet</p>
              <p className="text-[11px]">Reports will appear here once they are generated from templates</p>
              <button onClick={() => setActiveTab('templates')} className="macos-btn mt-4 text-[12px] flex items-center gap-1.5">
                <FileText className="size-3" /> View Templates
              </button>
            </div>
          ) : (
            <div className="macos-card overflow-hidden">
              <div className="max-h-[420px] overflow-y-auto">
                <table className="macos-table">
                  <thead>
                    <tr>
                      <th>Report ID</th>
                      <th>Station</th>
                      <th>Report Date</th>
                      <th>Revenue</th>
                      <th>Volume</th>
                      <th>Transactions</th>
                      <th>Net Profit</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentReports.map(report => (
                      <tr key={report.id}>
                        <td className="font-mono text-[12px] text-teal-600 dark:text-teal-400">{report.id.slice(0, 12)}…</td>
                        <td className="text-[13px] font-medium">{report.station?.name || 'Unknown'}</td>
                        <td className="text-[12px] text-muted-foreground whitespace-nowrap">
                          {new Date(report.reportDate).toLocaleDateString('en-PK', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td className="text-[13px] font-semibold tabular-nums">PKR {report.totalRevenue.toLocaleString()}</td>
                        <td className="text-[12px] text-muted-foreground tabular-nums">{Math.round(report.totalVolume).toLocaleString()} L</td>
                        <td className="text-[12px] text-muted-foreground">{report.transactionCount}</td>
                        <td className={`text-[13px] font-semibold tabular-nums ${report.netProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                          PKR {report.netProfit.toLocaleString()}
                        </td>
                        <td>
                          <div className="flex items-center gap-1">
                            <button className="size-6 rounded-md flex items-center justify-center hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors" title="Download">
                              <Download className="size-3 text-muted-foreground" />
                            </button>
                            <button className="size-6 rounded-md flex items-center justify-center hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors" title="Share">
                              <Share2 className="size-3 text-muted-foreground" />
                            </button>
                            <button className="size-6 rounded-md flex items-center justify-center hover:bg-red-500/10 transition-colors" title="Delete">
                              <Trash2 className="size-3 text-red-400" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
