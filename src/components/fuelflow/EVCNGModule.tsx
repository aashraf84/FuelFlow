'use client'

import { useState, useEffect } from 'react'
import {
  Zap,
  AlertTriangle,
  Battery,
  Gauge,
  Activity,
  Clock,
  Plug,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

interface ChargingSession {
  id: string
  vehiclePlate: string | null
  energyKwh: number
  durationMinutes: number
  pricePerKwh: number
  totalAmount: number
  paymentMethod: string
  startedAt: string
  status: string
}

interface EVCharger {
  id: string
  name: string
  code: string
  connectorType: string
  maxPowerKw: number
  status: string
  isActive: boolean
  station: { id: string; name: string; code: string; city: string }
  activeSession: ChargingSession | null
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

interface EVSummary {
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

function EVStatusBadge({ status }: { status: string }) {
  const configs: Record<string, { className: string; label: string }> = {
    available: { className: 'bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:text-emerald-400 dark:border-emerald-800', label: 'Available' },
    charging: { className: 'bg-amber-500/10 text-amber-600 border-amber-200 dark:text-amber-400 dark:border-amber-800', label: 'Charging' },
    occupied: { className: 'bg-blue-500/10 text-blue-600 border-blue-200 dark:text-blue-400 dark:border-blue-800', label: 'Occupied' },
    offline: { className: 'bg-gray-500/10 text-gray-600 border-gray-200 dark:text-gray-400 dark:border-gray-800', label: 'Offline' },
    error: { className: 'bg-red-500/10 text-red-600 border-red-200 dark:text-red-400 dark:border-red-800', label: 'Error' },
  }
  const config = configs[status] || configs.offline
  return (
    <Badge variant="outline" className={`text-[10px] ${config.className}`}>
      <div className={`size-1.5 rounded-full mr-1 ${status === 'charging' ? 'bg-amber-500 animate-pulse' : status === 'available' ? 'bg-emerald-500' : status === 'error' ? 'bg-red-500' : 'bg-gray-400'}`} />
      {config.label}
    </Badge>
  )
}

function CNGStatusBadge({ status }: { status: string }) {
  const configs: Record<string, { className: string; label: string }> = {
    idle: { className: 'bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:text-emerald-400 dark:border-emerald-800', label: 'Idle' },
    dispensing: { className: 'bg-amber-500/10 text-amber-600 border-amber-200 dark:text-amber-400 dark:border-amber-800', label: 'Dispensing' },
    stopped: { className: 'bg-gray-500/10 text-gray-600 border-gray-200 dark:text-gray-400 dark:border-gray-800', label: 'Stopped' },
    error: { className: 'bg-red-500/10 text-red-600 border-red-200 dark:text-red-400 dark:border-red-800', label: 'Error' },
    maintenance: { className: 'bg-yellow-500/10 text-yellow-600 border-yellow-200 dark:text-yellow-400 dark:border-yellow-800', label: 'Maintenance' },
  }
  const config = configs[status] || configs.idle
  return (
    <Badge variant="outline" className={`text-[10px] ${config.className}`}>
      {config.label}
    </Badge>
  )
}

function ConnectorBadge({ type }: { type: string }) {
  const configs: Record<string, { className: string }> = {
    type2: { className: 'bg-blue-500/10 text-blue-600 border-blue-200' },
    ccs: { className: 'bg-emerald-500/10 text-emerald-600 border-emerald-200' },
    chademo: { className: 'bg-amber-500/10 text-amber-600 border-amber-200' },
    tesla: { className: 'bg-red-500/10 text-red-600 border-red-200' },
  }
  const config = configs[type] || { className: 'bg-gray-500/10 text-gray-600 border-gray-200' }
  return (
    <Badge variant="outline" className={`text-[10px] ${config.className}`}>
      <Plug className="size-2.5 mr-1" />
      {type.toUpperCase()}
    </Badge>
  )
}

export default function EVCNGModule() {
  const [evChargers, setEvChargers] = useState<EVCharger[]>([])
  const [cngDispensers, setCngDispensers] = useState<CNGDispenser[]>([])
  const [summary, setSummary] = useState<{ ev: EVSummary; cng: CNGSummary } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/ev-cng')
        if (!res.ok) throw new Error('Failed to fetch')
        const json = await res.json()
        setEvChargers(json.evChargers || [])
        setCngDispensers(json.cngDispensers || [])
        setSummary(json.summary || null)
      } catch (err) {
        console.error('Failed to fetch EV/CNG data:', err)
        setError('Failed to load EV/CNG data')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

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
          <Zap className="size-5 text-amber-500" />
        </div>
        <div>
          <h2 className="text-xl font-bold">EV & CNG</h2>
          <p className="text-sm text-muted-foreground">
            Electric vehicle charging, CNG dispensing, and alternative energy
          </p>
        </div>
      </div>

      {/* Summary stats */}
      {summary && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="size-4 text-amber-500" />
                <span className="text-sm font-semibold">EV Chargers</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="text-[10px]">Total: {summary.ev.total}</Badge>
                <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-200">Available: {summary.ev.available}</Badge>
                <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-200">Charging: {summary.ev.charging}</Badge>
                <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-600 border-blue-200">Occupied: {summary.ev.occupied}</Badge>
                <Badge variant="outline" className="text-[10px] bg-gray-500/10 text-gray-600 border-gray-200">Offline: {summary.ev.offline}</Badge>
                {summary.ev.error > 0 && (
                  <Badge variant="outline" className="text-[10px] bg-red-500/10 text-red-600 border-red-200">Error: {summary.ev.error}</Badge>
                )}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Gauge className="size-4 text-blue-500" />
                <span className="text-sm font-semibold">CNG Dispensers</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="text-[10px]">Total: {summary.cng.total}</Badge>
                <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-200">Idle: {summary.cng.idle}</Badge>
                <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-200">Dispensing: {summary.cng.dispensing}</Badge>
                <Badge variant="outline" className="text-[10px] bg-gray-500/10 text-gray-600 border-gray-200">Stopped: {summary.cng.stopped}</Badge>
                {summary.cng.error > 0 && (
                  <Badge variant="outline" className="text-[10px] bg-red-500/10 text-red-600 border-red-200">Error: {summary.cng.error}</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* EV Chargers */}
      <div>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Battery className="size-4 text-amber-500" />
          EV Chargers
        </h3>
        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4 space-y-3">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : evChargers.length === 0 ? (
          <Card>
            <CardContent className="flex h-32 items-center justify-center">
              <div className="text-center space-y-1">
                <Zap className="size-8 mx-auto text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">No EV chargers configured</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {evChargers.map((charger) => (
              <Card key={charger.id} className="relative overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Zap className="size-4 text-amber-500" />
                      {charger.name}
                    </CardTitle>
                    <EVStatusBadge status={charger.status} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <ConnectorBadge type={charger.connectorType} />
                    <span className="text-xs text-muted-foreground">{charger.maxPowerKw} kW</span>
                  </div>

                  {charger.activeSession && (
                    <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-2.5 space-y-1.5">
                      <p className="text-[10px] font-medium text-amber-600 dark:text-amber-400 uppercase">Active Session</p>
                      <div className="grid grid-cols-2 gap-1.5 text-xs">
                        {charger.activeSession.vehiclePlate && (
                          <div>
                            <span className="text-muted-foreground text-[10px]">Vehicle</span>
                            <p className="font-medium">{charger.activeSession.vehiclePlate}</p>
                          </div>
                        )}
                        <div>
                          <span className="text-muted-foreground text-[10px]">Energy</span>
                          <p className="font-medium">{charger.activeSession.energyKwh} kWh</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-[10px]">Duration</span>
                          <p className="font-medium">{charger.activeSession.durationMinutes} min</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-[10px]">Amount</span>
                          <p className="font-medium">Rs. {Math.round(charger.activeSession.totalAmount).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <Activity className="size-2.5" />
                    <span>Code: {charger.code}</span>
                  </div>
                </CardContent>
                <div className={`absolute bottom-0 left-0 right-0 h-1 ${charger.status === 'available' ? 'bg-emerald-500' : charger.status === 'charging' ? 'bg-amber-500' : charger.status === 'error' ? 'bg-red-500' : 'bg-gray-400'}`} />
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* CNG Dispensers */}
      <div>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Gauge className="size-4 text-blue-500" />
          CNG Dispensers
        </h3>
        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4 space-y-2">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-4 w-20" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : cngDispensers.length === 0 ? (
          <Card>
            <CardContent className="flex h-32 items-center justify-center">
              <div className="text-center space-y-1">
                <Gauge className="size-8 mx-auto text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">No CNG dispensers configured</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cngDispensers.map((dispenser) => (
              <Card key={dispenser.id} className="relative overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Gauge className="size-4 text-blue-500" />
                      {dispenser.name}
                    </CardTitle>
                    <CNGStatusBadge status={dispenser.status} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {dispenser.pressure !== null && dispenser.pressure !== undefined && (
                    <div className="bg-muted/50 rounded-lg p-2 flex items-center gap-2">
                      <Gauge className="size-4 text-blue-500" />
                      <div>
                        <p className="text-[10px] text-muted-foreground">Pressure</p>
                        <p className="text-sm font-semibold">{dispenser.pressure} bar</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <Activity className="size-2.5" />
                    <span>Code: {dispenser.code}</span>
                  </div>
                </CardContent>
                <div className={`absolute bottom-0 left-0 right-0 h-1 ${dispenser.status === 'idle' ? 'bg-emerald-500' : dispenser.status === 'dispensing' ? 'bg-amber-500' : dispenser.status === 'error' ? 'bg-red-500' : 'bg-gray-400'}`} />
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
