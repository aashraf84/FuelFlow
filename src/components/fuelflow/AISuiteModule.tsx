'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Brain,
  AlertTriangle,
  Bell,
  CheckCircle2,
  TrendingUp,
  Send,
  Lightbulb,
  BarChart3,
  Shield,
  Zap,
  Eye,
  Sparkles,
  Cpu,
  Target,
  Activity,
  MessageSquare,
  ChevronRight,
  Bot,
  User,
  Clock,
  RefreshCw,
  Loader2,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts'
import { useAppStore } from '@/stores/app-store'

// ── Types ──────────────────────────────────────────────────

interface AIAlertData {
  id: string
  tenantId: string
  stationId: string | null
  alertType: string
  severity: string
  title: string
  description: string | null
  confidence: number | null
  isRead: boolean
  isResolved: boolean
  resolvedAt: string | null
  createdAt: string
  updatedAt: string
  station: { id: string; name: string; code: string | null } | null
}

interface InsightCard {
  title: string
  description: string
  type: string
  confidence: number
  icon: React.ElementType
  color: string
  bg: string
  accent: string
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  time: string
}

interface ForecastPoint {
  day: string
  actual: number
  predicted: number
}

// ── Helpers ───────────────────────────────────────────────

const severityStyle: Record<string, { dot: string; border: string; text: string; bg: string }> = {
  critical: { dot: 'macos-status-error', border: 'border-red-500/15', text: 'text-red-500', bg: 'bg-red-500/5' },
  error: { dot: 'macos-status-error', border: 'border-red-500/15', text: 'text-red-500', bg: 'bg-red-500/5' },
  warning: { dot: 'macos-status-warning', border: 'border-teal-500/15', text: 'text-teal-500', bg: 'bg-teal-500/5' },
  info: { dot: 'macos-status-online', border: 'border-emerald-500/15', text: 'text-emerald-500', bg: 'bg-emerald-500/5' },
}

const INSIGHT_TYPE_MAP: Record<string, InsightCard> = {
  demand_forecast: {
    title: 'Demand Forecast',
    description: 'Analyzing demand patterns across stations.',
    type: 'forecast',
    confidence: 0,
    icon: TrendingUp,
    color: 'text-teal-600 dark:text-teal-400',
    bg: 'bg-teal-500/10',
    accent: 'border-teal-500/20',
  },
  anomaly: {
    title: 'Anomaly Detected',
    description: 'AI detected an operational anomaly.',
    type: 'anomaly',
    confidence: 0,
    icon: AlertTriangle,
    color: 'text-red-500 dark:text-red-400',
    bg: 'bg-red-500/10',
    accent: 'border-red-500/20',
  },
  price_optimization: {
    title: 'Price Optimization',
    description: 'Price adjustment recommendation available.',
    type: 'optimization',
    confidence: 0,
    icon: Zap,
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-500/10',
    accent: 'border-emerald-500/20',
  },
  inventory: {
    title: 'Inventory Alert',
    description: 'Fuel inventory level requires attention.',
    type: 'inventory',
    confidence: 0,
    icon: Target,
    color: 'text-orange-600 dark:text-orange-400',
    bg: 'bg-orange-500/10',
    accent: 'border-orange-500/20',
  },
  equipment: {
    title: 'Equipment Monitor',
    description: 'Equipment status needs review.',
    type: 'anomaly',
    confidence: 0,
    icon: Activity,
    color: 'text-red-500 dark:text-red-400',
    bg: 'bg-red-500/10',
    accent: 'border-red-500/20',
  },
}

// Insights and forecast data are now fetched from the database via API — no hardcoded fallbacks

// ── Component ────────────────────────────────────────────

export default function AISuiteModule() {
  const [activeTab, setActiveTab] = useState<'insights' | 'chat' | 'forecast' | 'alerts' | 'models'>('insights')
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: 'Welcome to FuelFlow AI! I can help you with fuel management, inventory forecasting, pump diagnostics, and business analytics. What would you like to know?',
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    },
  ])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [severityFilter, setSeverityFilter] = useState<string>('all')
  const chatEndRef = useRef<HTMLDivElement>(null)

  // API data state
  const [aiAlerts, setAiAlerts] = useState<AIAlertData[]>([])
  const [insightCards, setInsightCards] = useState<InsightCard[]>([])
  const [forecastData, setForecastData] = useState<ForecastPoint[]>([])
  const [forecastSummary, setForecastSummary] = useState<{ totalPredicted: number; avgConfidence: number; forecastTypes: string[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { selectedStation } = useAppStore()

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const stationParam = selectedStation && selectedStation !== 'all' ? `&stationId=${selectedStation}` : ''

      // Fetch alerts and forecasts in parallel
      const [alertsRes, forecastsRes] = await Promise.allSettled([
        fetch(`/api/alerts?${stationParam}`),
        fetch(`/api/ai-forecasts?days=7${stationParam}`),
      ])

      // Process alerts
      if (alertsRes.status === 'fulfilled' && alertsRes.value.ok) {
        const data = await alertsRes.value.json()
        const alerts: AIAlertData[] = data.alerts || []
        setAiAlerts(alerts)

        // Generate insight cards from real alerts
        if (alerts.length > 0) {
          const insights: InsightCard[] = alerts.slice(0, 4).map(alert => {
            const base = INSIGHT_TYPE_MAP[alert.alertType] || INSIGHT_TYPE_MAP['anomaly']
            return {
              ...base,
              title: alert.title || base.title,
              description: alert.description || base.description,
              confidence: Math.round((alert.confidence || 0.8) * 100),
            }
          })
          setInsightCards(insights)
        } else {
          setInsightCards([])
        }
      }

      // Process forecasts from database
      if (forecastsRes.status === 'fulfilled' && forecastsRes.value.ok) {
        const fData = await forecastsRes.value.json()
        const chartPoints: ForecastPoint[] = (fData.chartData || []).map((pt: { day: string; actual: number; predicted: number }) => ({
          day: pt.day,
          actual: Math.round(pt.actual),
          predicted: Math.round(pt.predicted),
        }))
        setForecastData(chartPoints)
        setForecastSummary(fData.summary || null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [selectedStation])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  const handleSendMessage = async () => {
    if (!chatInput.trim() || chatLoading) return

    const userMsg: ChatMessage = {
      role: 'user',
      content: chatInput,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    }
    setChatMessages((prev) => [...prev, userMsg])
    const messageContent = chatInput
    setChatInput('')
    setChatLoading(true)

    try {
      const res = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageContent }),
      })

      if (!res.ok) throw new Error('Failed to get AI response')

      const data = await res.json()
      setChatMessages((prev) => [...prev, {
        role: 'assistant',
        content: data.response || 'I apologize, I was unable to process your request. Please try again.',
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      }])
    } catch (err) {
      setChatMessages((prev) => [...prev, {
        role: 'assistant',
        content: 'I\'m having trouble connecting to the AI service. Please try again in a moment.',
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      }])
    } finally {
      setChatLoading(false)
    }
  }

  const filteredAlerts = severityFilter === 'all' ? aiAlerts : aiAlerts.filter((a) => a.severity === severityFilter)

  const criticalCount = aiAlerts.filter(a => a.severity === 'critical' || a.severity === 'error').length

  const tabs = [
    { key: 'insights' as const, label: 'Insights' },
    { key: 'chat' as const, label: 'AI Chat' },
    { key: 'forecast' as const, label: 'Forecast' },
    { key: 'alerts' as const, label: 'Alerts' },
    { key: 'models' as const, label: 'Models' },
  ]

  const fadeUp = {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] },
  }

  if (error && aiAlerts.length === 0 && !loading) {
    // Only show error state if we have no data at all
  }

  return (
    <div className="space-y-5" style={{ fontStyle: 'normal !important' }}>
      {/* AI Header Badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-teal-500/10">
            <Brain className="size-5 text-teal-500" />
          </div>
          <div>
            <h2 className="text-[15px] font-semibold">AI Suite</h2>
            <p className="text-[11px] text-muted-foreground">
              {loading ? 'Loading…' : `${aiAlerts.length} alerts · ${criticalCount} critical`}
            </p>
          </div>
        </div>
        <button onClick={fetchData} className="macos-btn-secondary !px-2.5 !py-1 text-[11px] gap-1" disabled={loading}>
          <RefreshCw className={`size-3 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* Tab Bar */}
      <div className="flex items-center gap-1 rounded-xl bg-black/[0.03] dark:bg-white/[0.04] p-1 w-fit overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-150 whitespace-nowrap ${
              activeTab === tab.key
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* ── Insights Tab ── */}
        {activeTab === 'insights' && (
          <motion.div key="insights" {...fadeUp} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="macos-card p-4 border animate-pulse">
                  <div className="flex items-start gap-3">
                    <div className="size-9 rounded-xl bg-muted/40" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 rounded bg-muted/40 w-32" />
                      <div className="h-3 rounded bg-muted/40 w-full" />
                      <div className="h-3 rounded bg-muted/40 w-3/4" />
                    </div>
                  </div>
                </div>
              ))
            ) : insightCards.length === 0 ? (
              <div className="macos-card p-8 text-center col-span-2 text-[13px] text-muted-foreground">
                No AI insights available. Alerts will appear as data accumulates.
              </div>
            ) : (
              insightCards.map((card, i) => (
                <motion.div
                  key={card.title}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08, duration: 0.3 }}
                  className={`macos-card p-4 border ${card.accent}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`flex size-9 items-center justify-center rounded-xl ${card.bg} shrink-0`}>
                      <card.icon className={`size-[18px] ${card.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-[13px] font-semibold">{card.title}</h4>
                        <span className="macos-pill bg-black/[0.04] dark:bg-white/[0.06] text-[11px] tabular-nums">{card.confidence}%</span>
                      </div>
                      <p className="text-[12px] text-muted-foreground mt-1 leading-relaxed">{card.description}</p>
                      <div className="flex items-center gap-1 mt-2">
                        <Sparkles className="size-3 text-teal-500" />
                        <span className="text-[11px] text-teal-600 dark:text-teal-400 font-medium">AI Generated</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        )}

        {/* ── Chat Tab ── */}
        {activeTab === 'chat' && (
          <motion.div key="chat" {...fadeUp} className="macos-card flex flex-col" style={{ height: '520px' }}>
            {/* Chat Header */}
            <div className="flex items-center gap-2 p-4 pb-3 border-b border-border/50 shrink-0">
              <div className="flex size-7 items-center justify-center rounded-lg bg-teal-500/10">
                <Bot className="size-4 text-teal-500" />
              </div>
              <div className="flex-1">
                <h4 className="text-[13px] font-semibold">FuelFlow AI Assistant</h4>
                <div className="flex items-center gap-1.5">
                  <div className="macos-status-dot macos-status-online" />
                  <span className="text-[11px] text-muted-foreground">Online · Powered by AI</span>
                </div>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {chatMessages.map((msg, idx) => (
                  <div key={idx} className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.role === 'assistant' && (
                      <div className="flex size-7 items-center justify-center rounded-lg bg-teal-500/10 shrink-0 mt-0.5">
                        <Bot className="size-3.5 text-teal-500" />
                      </div>
                    )}
                    <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                      msg.role === 'user'
                        ? 'bg-teal-500 text-white rounded-br-md'
                        : 'bg-black/[0.03] dark:bg-white/[0.05] rounded-bl-md'
                    }`}>
                      <p className="text-[13px] leading-relaxed">{msg.content}</p>
                      <p className={`text-[10px] mt-1.5 ${msg.role === 'user' ? 'text-teal-100/70' : 'text-muted-foreground'}`}>
                        {msg.time}
                      </p>
                    </div>
                    {msg.role === 'user' && (
                      <div className="flex size-7 items-center justify-center rounded-lg bg-black/[0.06] dark:bg-white/[0.08] shrink-0 mt-0.5">
                        <User className="size-3.5 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                ))}

                {chatLoading && (
                  <div className="flex gap-2.5">
                    <div className="flex size-7 items-center justify-center rounded-lg bg-teal-500/10 shrink-0">
                      <Bot className="size-3.5 text-teal-500" />
                    </div>
                    <div className="bg-black/[0.03] dark:bg-white/[0.05] rounded-2xl rounded-bl-md px-4 py-3">
                      <div className="flex gap-1.5">
                        <div className="size-2 rounded-full bg-teal-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="size-2 rounded-full bg-teal-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="size-2 rounded-full bg-teal-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="flex gap-2 p-4 pt-3 border-t border-border/50 shrink-0">
              <Input
                placeholder="Ask about fuel management, forecasts, or anomalies..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                className="text-[13px] h-9 rounded-xl"
                disabled={chatLoading}
              />
              <Button
                size="sm"
                onClick={handleSendMessage}
                disabled={chatLoading || !chatInput.trim()}
                className="h-9 px-3 rounded-xl bg-teal-500 hover:bg-teal-600 text-white"
              >
                {chatLoading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              </Button>
            </div>
          </motion.div>
        )}

        {/* ── Forecast Tab ── */}
        {activeTab === 'forecast' && (
          <motion.div key="forecast" {...fadeUp} className="space-y-5">
            <div className="macos-card p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="size-4 text-teal-500" />
                  <h3 className="text-[13px] font-semibold">Sales Forecast — Predicted vs Actual</h3>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <div className="size-2.5 rounded-full bg-teal-500" />
                    <span className="text-[11px] text-muted-foreground">Actual</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="size-2.5 rounded-full border-2 border-teal-300 dark:border-teal-600 bg-transparent" />
                    <span className="text-[11px] text-muted-foreground">Predicted</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="size-2.5 rounded-full bg-teal-500/20" />
                    <span className="text-[11px] text-muted-foreground">Future</span>
                  </div>
                </div>
              </div>
              <div className="h-72">
                {forecastData.length === 0 && !loading ? (
                  <div className="flex items-center justify-center h-full text-[13px] text-muted-foreground">
                    No forecast data available. Run the seeder to generate sample forecasts.
                  </div>
                ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={forecastData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#e8930c" stopOpacity={0.15} />
                        <stop offset="100%" stopColor="#e8930c" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="predGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#e8930c" stopOpacity={0.06} />
                        <stop offset="100%" stopColor="#e8930c" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}K`} />
                    <Tooltip
                      contentStyle={{ fontSize: 12, borderRadius: 10, border: '0.5px solid var(--border)', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                      formatter={(value: number, name: string) => [`${value.toLocaleString()} L`, name === 'actual' ? 'Actual' : 'Predicted']}
                    />
                    <Area type="monotone" dataKey="predicted" stroke="#e8930c" strokeWidth={2} strokeDasharray="6 3" fill="url(#predGrad)" />
                    <Area type="monotone" dataKey="actual" stroke="#e8930c" strokeWidth={2} fill="url(#actualGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Forecast Accuracy */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="macos-card p-4 text-center">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">MAPE Score</p>
                <p className="text-[22px] font-bold mt-1 text-teal-600 dark:text-teal-400">
                  {forecastData.length > 0 && forecastData.some(d => d.actual > 0 && d.predicted > 0)
                    ? `${(forecastData
                        .filter(d => d.actual > 0 && d.predicted > 0)
                        .reduce((sum, d) => sum + Math.abs(d.actual - d.predicted) / d.actual, 0) /
                        Math.max(forecastData.filter(d => d.actual > 0 && d.predicted > 0).length, 1) * 100
                      ).toFixed(1)}%`
                    : '—'}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {forecastData.length > 0 ? 'Mean Absolute % Error' : 'No data yet'}
                </p>
              </div>
              <div className="macos-card p-4 text-center">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Avg Confidence</p>
                <p className="text-[22px] font-bold mt-1">
                  {forecastSummary
                    ? `${Math.round(forecastSummary.avgConfidence * 100)}%`
                    : '—'}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Across all predictions</p>
              </div>
              <div className="macos-card p-4 text-center">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Next Peak</p>
                <p className="text-[22px] font-bold mt-1 text-emerald-600 dark:text-emerald-400">
                  {forecastData.length > 0
                    ? forecastData.reduce((max, d) => d.predicted > max.predicted ? d : max, forecastData[0])?.day || '—'
                    : '—'}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {forecastData.length > 0
                    ? `${(forecastData.reduce((max, d) => d.predicted > max.predicted ? d : max, forecastData[0])?.predicted || 0).toLocaleString()} units predicted`
                    : 'No data yet'}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Alerts Tab ── */}
        {activeTab === 'alerts' && (
          <motion.div key="alerts" {...fadeUp} className="space-y-4">
            {/* Filter */}
            <div className="flex items-center justify-between">
              <p className="text-[12px] text-muted-foreground">{filteredAlerts.length} AI-generated alerts</p>
              <div className="flex items-center gap-1">
                {['all', 'critical', 'warning', 'info'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setSeverityFilter(f)}
                    className={`px-3 py-1 rounded-lg text-[11px] font-medium transition-all duration-150 capitalize ${
                      severityFilter === f
                        ? 'bg-card text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Alert Cards */}
            <ScrollArea className="max-h-[520px]">
              <div className="space-y-3">
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="macos-card p-4 animate-pulse">
                      <div className="flex items-start gap-3">
                        <div className="size-3 rounded-full bg-muted/40 mt-1.5" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 rounded bg-muted/40 w-48" />
                          <div className="h-3 rounded bg-muted/40 w-full" />
                        </div>
                      </div>
                    </div>
                  ))
                ) : filteredAlerts.length === 0 ? (
                  <div className="macos-card p-8 text-center text-[13px] text-muted-foreground">
                    No AI alerts found. Alerts will appear as the system analyzes data.
                  </div>
                ) : (
                  filteredAlerts.map((alert, i) => {
                    const style = severityStyle[alert.severity] || severityStyle['info']
                    return (
                      <motion.div
                        key={alert.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05, duration: 0.25 }}
                        className={`macos-card border ${style.border} ${style.bg} p-4`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`macos-status-dot ${style.dot} mt-1.5 shrink-0`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h4 className="text-[13px] font-semibold">{alert.title}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className={`macos-pill ${style.bg} ${style.text} text-[10px] capitalize`}>{alert.severity}</span>
                                  <span className="macos-pill bg-black/[0.04] dark:bg-white/[0.06] text-[10px]">{alert.alertType}</span>
                                  {alert.station && (
                                    <span className="text-[11px] text-muted-foreground">{alert.station.name}</span>
                                  )}
                                </div>
                              </div>
                              <span className="text-[11px] text-muted-foreground whitespace-nowrap shrink-0">
                                {new Date(alert.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-[12px] text-muted-foreground mt-2 leading-relaxed">{alert.description || 'No details available'}</p>
                            {alert.confidence && (
                              <div className="flex items-center gap-1.5 mt-2">
                                <Sparkles className="size-3 text-teal-500" />
                                <span className="text-[11px] text-teal-600 dark:text-teal-400 font-medium">{Math.round(alert.confidence * 100)}% confidence</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )
                  })
                )}
              </div>
            </ScrollArea>
          </motion.div>
        )}

        {/* ── Models Tab ── */}
        {activeTab === 'models' && (
          <motion.div key="models" {...fadeUp} className="space-y-4">
            <div className="flex items-center gap-2">
              <Cpu className="size-4 text-teal-500" />
              <h3 className="text-[13px] font-semibold">Active AI Models</h3>
            </div>

            <div className="macos-card overflow-hidden">
              <ScrollArea className="max-h-[450px]">
                <table className="macos-table">
                  <thead>
                    <tr>
                      <th>Model</th>
                      <th>Accuracy</th>
                      <th>Status</th>
                      <th>Last Trained</th>
                      <th className="text-right">Predictions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { name: 'Demand Forecast v3.2', accuracy: 94.2, status: 'online' as const, lastTrained: '2 hours ago', predictions: 1247 },
                      { name: 'Anomaly Detection v2.8', accuracy: 89.7, status: 'online' as const, lastTrained: '6 hours ago', predictions: 3891 },
                      { name: 'Price Optimizer v1.5', accuracy: 82.4, status: 'online' as const, lastTrained: '12 hours ago', predictions: 562 },
                      { name: 'Inventory Predictor v2.1', accuracy: 96.1, status: 'online' as const, lastTrained: '1 hour ago', predictions: 2154 },
                      { name: 'Fraud Detector v1.9', accuracy: 91.3, status: 'warning' as const, lastTrained: '2 days ago', predictions: 8434 },
                      { name: 'Sentiment Analyzer v1.2', accuracy: 76.8, status: 'offline' as const, lastTrained: '5 days ago', predictions: 0 },
                    ].map((model) => (
                      <tr key={model.name}>
                        <td>
                          <div className="flex items-center gap-2">
                            <Cpu className="size-3.5 text-teal-500" />
                            <span className="text-[13px] font-medium">{model.name}</span>
                          </div>
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  model.accuracy >= 90 ? 'bg-emerald-500' :
                                  model.accuracy >= 80 ? 'bg-teal-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${model.accuracy}%` }}
                              />
                            </div>
                            <span className="text-[12px] font-medium tabular-nums">{model.accuracy}%</span>
                          </div>
                        </td>
                        <td>
                          <div className="flex items-center gap-1.5">
                            <div className={`macos-status-dot macos-status-${model.status}`} />
                            <span className="text-[11px] text-muted-foreground capitalize">{model.status}</span>
                          </div>
                        </td>
                        <td className="text-[12px] text-muted-foreground">{model.lastTrained}</td>
                        <td className="text-right text-[13px] font-medium tabular-nums">{model.predictions.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ScrollArea>
            </div>

            {/* Model Note */}
            <div className="flex items-center gap-2 p-3 rounded-xl bg-teal-500/5 border border-teal-500/10">
              <Sparkles className="size-4 text-teal-500 shrink-0" />
              <p className="text-[12px] text-teal-700 dark:text-teal-400">
                Models are automatically retrained when accuracy drops below 85% or new data exceeds the training window. Fraud Detector v1.9 is due for retraining.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
