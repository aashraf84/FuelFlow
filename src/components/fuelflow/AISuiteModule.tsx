'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Brain,
  AlertTriangle,
  CheckCircle,
  Eye,
  Shield,
  Zap,
  Fuel,
  TrendingDown,
  MessageSquare,
  Send,
  Loader2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

interface Alert {
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

function SeverityBadge({ severity }: { severity: string }) {
  const configs: Record<string, { className: string; icon: React.ReactNode }> = {
    critical: { className: 'bg-red-500/10 text-red-600 border-red-200 dark:text-red-400 dark:border-red-800', icon: <AlertTriangle className="size-3" /> },
    warning: { className: 'bg-amber-500/10 text-amber-600 border-amber-200 dark:text-amber-400 dark:border-amber-800', icon: <Zap className="size-3" /> },
    info: { className: 'bg-blue-500/10 text-blue-600 border-blue-200 dark:text-blue-400 dark:border-blue-800', icon: <Eye className="size-3" /> },
  }
  const config = configs[severity] || configs.info
  return (
    <Badge variant="outline" className={`text-[10px] gap-1 ${config.className}`}>
      {config.icon}
      {severity.charAt(0).toUpperCase() + severity.slice(1)}
    </Badge>
  )
}

function AlertTypeIcon({ type }: { type: string }) {
  const icons: Record<string, React.ReactNode> = {
    fuel_loss: <Fuel className="size-4 text-red-500" />,
    theft: <Shield className="size-4 text-red-500" />,
    leakage: <AlertTriangle className="size-4 text-red-500" />,
    meter_manipulation: <Zap className="size-4 text-amber-500" />,
    variance: <TrendingDown className="size-4 text-amber-500" />,
    maintenance: <AlertTriangle className="size-4 text-amber-500" />,
    demand: <Brain className="size-4 text-blue-500" />,
  }
  return icons[type] || <Brain className="size-4 text-amber-500" />
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export default function AISuiteModule() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/alerts')
        if (!res.ok) throw new Error('Failed to fetch')
        const json = await res.json()
        setAlerts(json.alerts || [])
      } catch (err) {
        console.error('Failed to fetch alerts:', err)
        setError('Failed to load AI alerts')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  async function handleMarkRead(id: string) {
    try {
      await fetch('/api/alerts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isRead: true }),
      })
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, isRead: true } : a))
    } catch (err) {
      console.error('Failed to mark alert as read:', err)
    }
  }

  async function handleResolve(id: string) {
    try {
      await fetch('/api/alerts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isResolved: true }),
      })
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, isResolved: true, isRead: true } : a))
    } catch (err) {
      console.error('Failed to resolve alert:', err)
    }
  }

  async function handleSendChat() {
    if (!chatInput.trim() || chatLoading) return
    const message = chatInput.trim()
    setChatInput('')
    setChatMessages(prev => [...prev, { role: 'user', content: message }])
    setChatLoading(true)
    try {
      const res = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      })
      if (!res.ok) throw new Error('Failed to get response')
      const json = await res.json()
      setChatMessages(prev => [...prev, { role: 'assistant', content: json.response || 'No response received.' }])
    } catch {
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }])
    } finally {
      setChatLoading(false)
    }
  }

  const unreadCount = alerts.filter(a => !a.isRead).length
  const criticalCount = alerts.filter(a => a.severity === 'critical' && !a.isResolved).length

  if (error) {
    return (
      <div className="module-enter space-y-6">
        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="size-10 mx-auto text-red-500 mb-2" />
            <p className="text-sm font-medium text-red-700 dark:text-red-400">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="module-enter space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-amber-500/10">
          <Brain className="size-5 text-amber-500" />
        </div>
        <div>
          <h2 className="text-xl font-bold">AI Suite</h2>
          <p className="text-sm text-muted-foreground">
            Artificial intelligence powered insights and automation
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Alerts list */}
        <div className="lg:col-span-2 space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-red-500/10">
                  <AlertTriangle className="size-4 text-red-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Critical</p>
                  <p className="text-lg font-bold">{loading ? '-' : criticalCount}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-amber-500/10">
                  <Eye className="size-4 text-amber-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Unread</p>
                  <p className="text-lg font-bold">{loading ? '-' : unreadCount}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-500/10">
                  <CheckCircle className="size-4 text-emerald-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Resolved</p>
                  <p className="text-lg font-bold">{loading ? '-' : alerts.filter(a => a.isResolved).length}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Alerts */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">AI Alerts</CardTitle>
              <CardDescription>Intelligence-driven alerts and anomalies</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex gap-3">
                      <Skeleton className="size-9 rounded-lg" />
                      <div className="flex-1 space-y-1">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-3 w-64" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : alerts.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  <Brain className="size-10 mx-auto text-muted-foreground/30 mb-2" />
                  <p>No active alerts</p>
                  <p className="text-xs mt-1">All systems operating normally</p>
                </div>
              ) : (
                <div className="max-h-96 overflow-y-auto space-y-3">
                  {alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`flex gap-3 p-3 rounded-lg border transition-colors ${
                        alert.isResolved
                          ? 'bg-muted/30 border-border/30 opacity-60'
                          : alert.isRead
                            ? 'bg-muted/50 border-border/50'
                            : 'bg-background border-border'
                      }`}
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        <AlertTypeIcon type={alert.alertType} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className={`text-sm font-medium ${alert.isRead ? '' : 'font-semibold'}`}>
                            {alert.title}
                          </p>
                          <SeverityBadge severity={alert.severity} />
                          {alert.isResolved && (
                            <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-200">
                              Resolved
                            </Badge>
                          )}
                        </div>
                        {alert.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2">{alert.description}</p>
                        )}
                        <div className="flex items-center gap-3 mt-1.5">
                          {alert.confidence !== null && (
                            <span className="text-[10px] text-muted-foreground">
                              Confidence: {Math.round(alert.confidence * 100)}%
                            </span>
                          )}
                          <span className="text-[10px] text-muted-foreground capitalize">
                            Type: {alert.alertType.replace(/_/g, ' ')}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(alert.createdAt).toLocaleString()}
                          </span>
                        </div>
                        {!alert.isResolved && (
                          <div className="flex gap-2 mt-2">
                            {!alert.isRead && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-6 text-[10px] gap-1"
                                onClick={() => handleMarkRead(alert.id)}
                              >
                                <Eye className="size-2.5" />
                                Mark Read
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-6 text-[10px] gap-1"
                              onClick={() => handleResolve(alert.id)}
                            >
                              <CheckCircle className="size-2.5" />
                              Resolve
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* AI Chat */}
        <Card className="flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <MessageSquare className="size-4 text-amber-500" />
              FuelFlow AI Assistant
            </CardTitle>
            <CardDescription className="text-xs">
              Ask questions about fuel station operations
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            <div className="flex-1 min-h-[300px] max-h-[400px] overflow-y-auto space-y-3 mb-3">
              {chatMessages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-center">
                  <div className="space-y-2">
                    <Brain className="size-8 mx-auto text-amber-500/30" />
                    <p className="text-xs text-muted-foreground">Ask about fuel management,<br />sales analysis, or tank levels</p>
                  </div>
                </div>
              ) : (
                chatMessages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[85%] rounded-lg px-3 py-2 text-xs ${
                        msg.role === 'user'
                          ? 'bg-amber-500 text-white'
                          : 'bg-muted'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))
              )}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg px-3 py-2 flex items-center gap-2">
                    <Loader2 className="size-3 animate-spin text-amber-500" />
                    <span className="text-xs text-muted-foreground">Thinking...</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                className="flex-1 h-9 rounded-md border border-input bg-background px-3 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                placeholder="Ask about operations..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSendChat() }}
                disabled={chatLoading}
              />
              <Button
                size="sm"
                className="h-9 bg-amber-500 hover:bg-amber-600 gap-1"
                onClick={handleSendChat}
                disabled={chatLoading || !chatInput.trim()}
              >
                <Send className="size-3" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
