'use client'

import { useState, useEffect } from 'react'
import {
  Zap,
  Fuel,
  Battery,
  Gauge,
  Clock,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Plug,
  Cpu,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface EVCharger {
  id: string
  name: string
  code: string
  connectorType: string
  maxPowerKw: number
  status: string
  currentSession: string | null
  isActive: boolean
  station: { id: string; name: string; code: string; city: string }
  activeSession: {
    id: string
    vehiclePlate: string | null
    energyKwh: number
    durationMinutes: number
    pricePerKwh: number
    totalAmount: number
    startedAt: string
  } | null
}

interface CNGDispenser {
  id: string
  name: string
  code: string
  pressure: number | null
  status: string
  isActive: boolean
  station: { id: string; name: string; code: string; city: string }
}

interface EVCSummary {
  total: number
  available: number
  charging: number
  occupied: number
  offline: number
  error: number
}

interface CNGSummary {
  total: number
  idle: number
  dispensing: number
  stopped: number
  error: number
}

const CONNECTOR_LABELS: Record<string, string> = {
  type2: 'Type 2',
  ccs: 'CCS2',
  chademo: 'CHAdeMO',
}

const CHARGER_STATUS: Record<string, { color: string; bg: string; label: string; animate?: boolean }> = {
  available: { color: 'text-emerald-500', bg: 'bg-emerald-500/10 border-emerald-500/20', label: 'Available' },
  charging: { color: 'text-amber-500', bg: 'bg-amber-500/10 border-amber-500/20', label: 'Charging', animate: true },
  occupied: { color: 'text-blue-500', bg: 'bg-blue-500/10 border-blue-500/20', label: 'Occupied' },
  offline: { color: 'text-slate-400', bg: 'bg-slate-500/10 border-slate-500/20', label: 'Offline' },
  error: { color: 'text-red-500', bg: 'bg-red-500/10 border-red-500/20', label: 'Error' },
}

const CNG_STATUS: Record<string, { color: string; bg: string; label: string }> = {
  idle: { color: 'text-emerald-500', bg: 'bg-emerald-500/10 border-emerald-500/20', label: 'Idle' },
  dispensing: { color: 'text-amber-500', bg: 'bg-amber-500/10 border-amber-500/20', label: 'Dispensing' },
  stopped: { color: 'text-slate-400', bg: 'bg-slate-500/10 border-slate-500/20', label: 'Stopped' },
  error: { color: 'text-red-500', bg: 'bg-red-500/10 border-red-500/20', label: 'Error' },
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <Card key={i}><CardContent className="p-4"><Skeleton className="h-40 w-full" /></CardContent></Card>
      ))}
    </div>
  )
}

export default function EVCNGModule() {
  const [evChargers, setEvChargers] = useState<EVCharger[]>([])
  const [cngDispensers, setCngDispensers] = useState<CNGDispenser[]>([])
  const [evSummary, setEvSummary] = useState<EVCSummary | null>(null)
  const [cngSummary, setCngSummary] = useState<CNGSummary | null>(null)
  const [sessions, setSessions] = useState<Array<{
    id: string; vehiclePlate: string | null; energyKwh: number; durationMinutes: number;
    pricePerKwh: number; totalAmount: number; status: string; startedAt: string; completedAt: string | null;
    evCharger: { name: string; code: string }
  }>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('ev-chargers')

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const [evCngRes] = await Promise.all([
          fetch('/api/ev-cng'),
        ])
        if (evCngRes.ok) {
          const data = await evCngRes.json()
          setEvChargers(data.evChargers || [])
          setCngDispensers(data.cngDispensers || [])
          setEvSummary(data.summary?.ev || null)
          setCngSummary(data.summary?.cng || null)
        }

        // Fetch charging sessions
        try {
          const sessionsRes = await fetch('/api/charging-sessions')
          if (sessionsRes.ok) {
            const data = await sessionsRes.json()
            setSessions(data.sessions || [])
          }
        } catch {}
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
    const interval = setInterval(fetchData, 15000)
    return () => clearInterval(interval)
  }, [])

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

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="ev-chargers">EV Chargers</TabsTrigger>
          <TabsTrigger value="cng-dispensers">CNG Dispensers</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
        </TabsList>

        {/* EV Chargers */}
        <TabsContent value="ev-chargers" className="mt-4 space-y-4">
          {/* EV Summary */}
          {evSummary && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <Card>
                <CardContent className="p-3 text-center">
                  <p className="text-lg font-bold">{evSummary.total}</p>
                  <p className="text-[10px] text-muted-foreground">Total</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 text-center">
                  <p className="text-lg font-bold text-emerald-500">{evSummary.available}</p>
                  <p className="text-[10px] text-muted-foreground">Available</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 text-center">
                  <p className="text-lg font-bold text-amber-500">{evSummary.charging}</p>
                  <p className="text-[10px] text-muted-foreground">Charging</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 text-center">
                  <p className="text-lg font-bold text-slate-400">{evSummary.offline}</p>
                  <p className="text-[10px] text-muted-foreground">Offline</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 text-center">
                  <p className="text-lg font-bold text-red-500">{evSummary.error}</p>
                  <p className="text-[10px] text-muted-foreground">Error</p>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {evChargers.map((charger) => {
              const statusCfg = CHARGER_STATUS[charger.status] || CHARGER_STATUS.available
              return (
                <Card key={charger.id} className={`border ${statusCfg.bg}`}>
                  <CardHeader className="pb-2 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Zap className={`size-4 ${statusCfg.color} ${statusCfg.animate ? 'animate-pulse' : ''}`} />
                        <CardTitle className="text-sm font-semibold">{charger.name}</CardTitle>
                      </div>
                      <Badge
                        variant={charger.status === 'error' ? 'destructive' : charger.status === 'charging' ? 'secondary' : 'outline'}
                        className="text-[10px] px-1.5 py-0"
                      >
                        {statusCfg.label}
                      </Badge>
                    </div>
                    <CardDescription className="text-[10px]">
                      {charger.code} • {CONNECTOR_LABELS[charger.connectorType] || charger.connectorType}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-1.5">
                        <Plug className="size-3 text-blue-500" />
                        <span>{CONNECTOR_LABELS[charger.connectorType] || charger.connectorType}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Battery className="size-3 text-emerald-500" />
                        <span>{charger.maxPowerKw} kW</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Cpu className="size-3 text-slate-400" />
                        <span>Station: {charger.station?.name || 'N/A'}</span>
                      </div>
                    </div>

                    {/* Active Session */}
                    {charger.activeSession && (
                      <div className="rounded-lg bg-background/50 p-2 space-y-1">
                        <p className="text-[10px] font-semibold text-amber-600">Active Session</p>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px]">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Vehicle:</span>
                            <span className="font-mono">{charger.activeSession.vehiclePlate || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Energy:</span>
                            <span>{charger.activeSession.energyKwh.toFixed(1)} kWh</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Duration:</span>
                            <span>{charger.activeSession.durationMinutes} min</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Amount:</span>
                            <span className="font-medium">Rs. {Math.round(charger.activeSession.totalAmount).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        {/* CNG Dispensers */}
        <TabsContent value="cng-dispensers" className="mt-4 space-y-4">
          {cngSummary && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Card>
                <CardContent className="p-3 text-center">
                  <p className="text-lg font-bold">{cngSummary.total}</p>
                  <p className="text-[10px] text-muted-foreground">Total</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 text-center">
                  <p className="text-lg font-bold text-emerald-500">{cngSummary.idle}</p>
                  <p className="text-[10px] text-muted-foreground">Idle</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 text-center">
                  <p className="text-lg font-bold text-amber-500">{cngSummary.dispensing}</p>
                  <p className="text-[10px] text-muted-foreground">Dispensing</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 text-center">
                  <p className="text-lg font-bold text-red-500">{cngSummary.error}</p>
                  <p className="text-[10px] text-muted-foreground">Error</p>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {cngDispensers.map((dispenser) => {
              const statusCfg = CNG_STATUS[dispenser.status] || CNG_STATUS.idle
              return (
                <Card key={dispenser.id} className={`border ${statusCfg.bg}`}>
                  <CardHeader className="pb-2 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Fuel className={`size-4 ${statusCfg.color}`} />
                        <CardTitle className="text-sm font-semibold">{dispenser.name}</CardTitle>
                      </div>
                      <Badge
                        variant={dispenser.status === 'error' ? 'destructive' : 'outline'}
                        className="text-[10px] px-1.5 py-0"
                      >
                        {statusCfg.label}
                      </Badge>
                    </div>
                    <CardDescription className="text-[10px]">{dispenser.code}</CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-1.5">
                        <Gauge className="size-3 text-blue-500" />
                        <span>Pressure: {dispenser.pressure || 'N/A'} bar</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Activity className="size-3 text-slate-400" />
                        <span>{dispenser.station?.name || 'N/A'}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        {/* Sessions */}
        <TabsContent value="sessions" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Charging Session History</CardTitle>
              <CardDescription className="text-xs">{sessions.length} sessions</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="max-h-96">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Charger</TableHead>
                      <TableHead className="text-xs">Vehicle</TableHead>
                      <TableHead className="text-xs text-right">Energy (kWh)</TableHead>
                      <TableHead className="text-xs text-right">Duration</TableHead>
                      <TableHead className="text-xs text-right">Amount</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs">Started</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sessions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-xs text-muted-foreground py-8">
                          No charging sessions recorded
                        </TableCell>
                      </TableRow>
                    ) : (
                      sessions.map((s) => (
                        <TableRow key={s.id}>
                          <TableCell className="text-xs font-medium">{s.evCharger?.name || 'N/A'}</TableCell>
                          <TableCell className="text-xs font-mono">{s.vehiclePlate || 'N/A'}</TableCell>
                          <TableCell className="text-xs text-right">{s.energyKwh.toFixed(1)}</TableCell>
                          <TableCell className="text-xs text-right">{s.durationMinutes} min</TableCell>
                          <TableCell className="text-xs text-right font-medium">Rs. {Math.round(s.totalAmount).toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge
                              variant={s.status === 'completed' ? 'outline' : s.status === 'active' ? 'secondary' : 'destructive'}
                              className="text-[10px] px-1.5 py-0 capitalize"
                            >
                              {s.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs font-mono">{new Date(s.startedAt).toLocaleString()}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
