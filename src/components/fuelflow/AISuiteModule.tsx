'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Brain,
  AlertTriangle,
  Bell,
  CheckCircle2,
  Eye,
  TrendingUp,
  MessageSquare,
  Send,
  Lightbulb,
  BarChart3,
  Filter,
  Shield,
  Zap,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface AIAlert {
  id: string
  alertType: string
  severity: string
  title: string
  description: string | null
  confidence: number | null
  isRead: boolean
  isResolved: boolean
  createdAt: string
  station: { id: string; name: string; code: string } | null
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

const SEVERITY_CONFIG: Record<string, { color: string; bg: string; icon: React.ElementType }> = {
  critical: { color: 'text-red-500', bg: 'bg-red-500/10 border-red-500/20', icon: AlertTriangle },
  warning: { color: 'text-amber-500', bg: 'bg-amber-500/10 border-amber-500/20', icon: Bell },
  info: { color: 'text-blue-500', bg: 'bg-blue-500/10 border-blue-500/20', icon: Lightbulb },
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <Card key={i}><CardContent className="p-4"><Skeleton className="h-20 w-full" /></CardContent></Card>
      ))}
    </div>
  )
}

export default function AISuiteModule() {
  const [alerts, setAlerts] = useState<AIAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('alerts')
  const [severityFilter, setSeverityFilter] = useState<string>('all')
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: 'Hello! I\'m FuelFlow AI, your intelligent assistant for fuel station operations. I can help with fuel management, wet stock analysis, fleet operations, and business intelligence. How can I assist you today?',
      timestamp: new Date(),
    },
  ])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const res = await fetch('/api/alerts')
        if (!res.ok) throw new Error('Failed to load alerts')
        const data = await res.json()
        setAlerts(data.alerts || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  const handleMarkRead = async (id: string) => {
    try {
      await fetch('/api/alerts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isRead: true }),
      })
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, isRead: true } : a))
    } catch {}
  }

  const handleResolve = async (id: string) => {
    try {
      await fetch('/api/alerts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isResolved: true }),
      })
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, isResolved: true } : a))
    } catch {}
  }

  const handleSendMessage = async () => {
    if (!chatInput.trim() || chatLoading) return
    const userMessage: ChatMessage = { role: 'user', content: chatInput, timestamp: new Date() }
    setChatMessages(prev => [...prev, userMessage])
    setChatInput('')
    setChatLoading(true)

    try {
      const res = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: chatInput }),
      })
      if (res.ok) {
        const data = await res.json()
        setChatMessages(prev => [...prev, {
          role: 'assistant',
          content: data.response || 'I apologize, but I couldn\'t generate a response.',
          timestamp: new Date(),
        }])
      } else {
        setChatMessages(prev => [...prev, {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
          timestamp: new Date(),
        }])
      }
    } catch {
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I couldn\'t connect to the AI service.',
        timestamp: new Date(),
      }])
    } finally {
      setChatLoading(false)
    }
  }

  if (loading) return <LoadingSkeleton />
  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <AlertTriangle className="size-8 text-red-500 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" size="sm" className="mt-2" onClick={() => window.location.reload()}>Retry</Button>
        </CardContent>
      </Card>
    )
  }

  const filteredAlerts = severityFilter === 'all'
    ? alerts
    : alerts.filter(a => a.severity === severityFilter)

  const criticalCount = alerts.filter(a => a.severity === 'critical' && !a.isResolved).length
  const warningCount = alerts.filter(a => a.severity === 'warning' && !a.isResolved).length

  return (
    <div className="space-y-4">
      {/* Alert Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-3 flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-lg bg-red-500/10">
              <AlertTriangle className="size-4 text-red-500" />
            </div>
            <div>
              <p className="text-lg font-bold">{criticalCount}</p>
              <p className="text-[10px] text-muted-foreground">Critical</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-lg bg-amber-500/10">
              <Bell className="size-4 text-amber-500" />
            </div>
            <div>
              <p className="text-lg font-bold">{warningCount}</p>
              <p className="text-[10px] text-muted-foreground">Warnings</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10">
              <CheckCircle2 className="size-4 text-emerald-500" />
            </div>
            <div>
              <p className="text-lg font-bold">{alerts.filter(a => a.isResolved).length}</p>
              <p className="text-[10px] text-muted-foreground">Resolved</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-lg bg-blue-500/10">
              <Brain className="size-4 text-blue-500" />
            </div>
            <div>
              <p className="text-lg font-bold">{alerts.length}</p>
              <p className="text-[10px] text-muted-foreground">Total Alerts</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="forecasts">Forecasts</TabsTrigger>
          <TabsTrigger value="assistant">AI Assistant</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        {/* Alerts */}
        <TabsContent value="alerts" className="mt-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs text-muted-foreground">{filteredAlerts.length} alerts</p>
            <div className="flex items-center gap-2">
              <Filter className="size-3 text-muted-foreground" />
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="h-7 w-32 text-xs">
                  <SelectValue placeholder="Filter severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <ScrollArea className="max-h-[600px]">
            <div className="space-y-3">
              {filteredAlerts.map((alert) => {
                const sevConfig = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.info
                const SevIcon = sevConfig.icon
                return (
                  <Card key={alert.id} className={`border ${sevConfig.bg} ${alert.isResolved ? 'opacity-60' : ''}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <SevIcon className={`size-4 ${sevConfig.color} mt-0.5 shrink-0`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-xs font-semibold">{alert.title}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="destructive" className="text-[9px] px-1.5 py-0 capitalize">{alert.severity}</Badge>
                                <Badge variant="outline" className="text-[9px] px-1.5 py-0">{alert.alertType}</Badge>
                                {alert.confidence && (
                                  <span className="text-[10px] text-muted-foreground">
                                    {Math.round(alert.confidence * 100)}% confidence
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              {!alert.isRead && (
                                <Button size="sm" variant="ghost" className="h-6 text-[10px] gap-1" onClick={() => handleMarkRead(alert.id)}>
                                  <Eye className="size-3" /> Read
                                </Button>
                              )}
                              {!alert.isResolved && (
                                <Button size="sm" variant="ghost" className="h-6 text-[10px] gap-1 text-emerald-600" onClick={() => handleResolve(alert.id)}>
                                  <CheckCircle2 className="size-3" /> Resolve
                                </Button>
                              )}
                            </div>
                          </div>
                          {alert.description && (
                            <p className="text-[11px] text-muted-foreground mt-1">{alert.description}</p>
                          )}
                          <p className="text-[10px] text-muted-foreground mt-1">
                            {new Date(alert.createdAt).toLocaleString()}
                            {alert.station && ` • ${alert.station.name}`}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Forecasts */}
        <TabsContent value="forecasts" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="size-4 text-amber-500" />
                <CardTitle className="text-sm font-semibold">AI Forecasts</CardTitle>
              </div>
              <CardDescription className="text-xs">Predictive analytics based on historical data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {alerts.filter(a => a.alertType === 'demand').map((alert) => (
                  <div key={alert.id} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="size-4 text-amber-500" />
                        <span className="text-xs font-medium">{alert.title}</span>
                      </div>
                      {alert.confidence && (
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                          {Math.round(alert.confidence * 100)}% confidence
                        </Badge>
                      )}
                    </div>
                    {alert.description && (
                      <p className="text-[11px] text-muted-foreground mt-1">{alert.description}</p>
                    )}
                  </div>
                ))}
                {alerts.filter(a => a.alertType === 'demand').length === 0 && (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <TrendingUp className="size-8 mb-2 opacity-50" />
                    <p className="text-xs">No forecasts available yet</p>
                    <p className="text-[10px]">Forecasts are generated based on historical patterns</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Assistant */}
        <TabsContent value="assistant" className="mt-4">
          <Card className="flex flex-col h-[500px]">
            <CardHeader className="pb-2 p-4 shrink-0">
              <div className="flex items-center gap-2">
                <Brain className="size-4 text-amber-500" />
                <CardTitle className="text-sm font-semibold">FuelFlow AI Assistant</CardTitle>
                <Badge variant="outline" className="text-[9px] px-1.5 py-0 ml-auto">Online</Badge>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-4 pt-0 flex flex-col">
              <ScrollArea className="flex-1 mb-3">
                <div className="space-y-3">
                  {chatMessages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-lg p-3 text-xs ${
                        msg.role === 'user'
                          ? 'bg-amber-500 text-white'
                          : 'bg-muted'
                      }`}>
                        <p>{msg.content}</p>
                        <p className={`text-[10px] mt-1 ${msg.role === 'user' ? 'text-amber-100' : 'text-muted-foreground'}`}>
                          {msg.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  {chatLoading && (
                    <div className="flex justify-start">
                      <div className="bg-muted rounded-lg p-3">
                        <div className="flex gap-1">
                          <div className="size-2 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                          <div className="size-2 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                          <div className="size-2 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
              </ScrollArea>
              <div className="flex gap-2 shrink-0">
                <Input
                  placeholder="Ask FuelFlow AI..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                  className="text-xs"
                  disabled={chatLoading}
                />
                <Button size="sm" onClick={handleSendMessage} disabled={chatLoading || !chatInput.trim()}>
                  <Send className="size-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Insights */}
        <TabsContent value="insights" className="mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="border-amber-200 dark:border-amber-900/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="size-4 text-amber-500" />
                  <span className="text-xs font-semibold">Top Performing Pump</span>
                </div>
                <p className="text-sm font-bold">Pump 1</p>
                <p className="text-[10px] text-muted-foreground">Highest volume dispensed today</p>
              </CardContent>
            </Card>
            <Card className="border-emerald-200 dark:border-emerald-900/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="size-4 text-emerald-500" />
                  <span className="text-xs font-semibold">Best Fuel Type</span>
                </div>
                <p className="text-sm font-bold">Petrol</p>
                <p className="text-[10px] text-muted-foreground">Highest revenue generating fuel type</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="size-4 text-blue-500" />
                  <span className="text-xs font-semibold">Peak Hour</span>
                </div>
                <p className="text-sm font-bold">6:00 PM - 8:00 PM</p>
                <p className="text-[10px] text-muted-foreground">Highest sales volume time window</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="size-4 text-purple-500" />
                  <span className="text-xs font-semibold">Avg Transaction</span>
                </div>
                <p className="text-sm font-bold">Rs. 5,842</p>
                <p className="text-[10px] text-muted-foreground">Average transaction value today</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
