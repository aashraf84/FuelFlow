'use client'

import { useState, useEffect } from 'react'
import {
  Fuel,
  Play,
  Square,
  Lock,
  Unlock,
  AlertTriangle,
  OctagonX,
  Cpu,
  Wifi,
  WifiOff,
  Wrench,
  Clock,
  Activity,
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
import { Separator } from '@/components/ui/separator'

interface Nozzle {
  id: string
  nozzleNumber: number
  fuelType: string
  fuelGrade: string | null
  meterReading: number
  previousReading: number
  totalizer: number
  calibrationDate: string | null
  calibrationFactor: number
  status: string
  isActive: boolean
}

interface Dispenser {
  id: string
  name: string
  code: string
  manufacturer: string | null
  model: string | null
  serialNumber: string | null
  controllerType: string | null
  communicationType: string | null
  ipAddress: string | null
  port: number | null
  pumpLane: number
  status: string
  isActive: boolean
  lastCommunication: string | null
  nozzles: Nozzle[]
  station: { id: string; name: string; code: string; city: string }
}

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string; animate?: boolean }> = {
  idle: { color: 'text-emerald-500', bg: 'bg-emerald-500/10 border-emerald-500/20', label: 'Idle' },
  fueling: { color: 'text-amber-500', bg: 'bg-amber-500/10 border-amber-500/20', label: 'Fueling', animate: true },
  maintenance: { color: 'text-red-500', bg: 'bg-red-500/10 border-red-500/20', label: 'Maintenance' },
  locked: { color: 'text-slate-400', bg: 'bg-slate-500/10 border-slate-500/20', label: 'Locked' },
  stopped: { color: 'text-red-500', bg: 'bg-red-500/10 border-red-500/20', label: 'Stopped' },
  error: { color: 'text-red-600', bg: 'bg-red-600/10 border-red-600/20', label: 'Error' },
}

function DispenserCard({ dispenser }: { dispenser: Dispenser }) {
  const cfg = STATUS_CONFIG[dispenser.status] || STATUS_CONFIG.idle

  return (
    <Card className={`border ${cfg.bg}`}>
      <CardHeader className="pb-2 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Fuel className={`size-4 ${cfg.color} ${cfg.animate ? 'animate-pulse' : ''}`} />
            <CardTitle className="text-sm font-semibold">{dispenser.name}</CardTitle>
          </div>
          <Badge
            variant={
              dispenser.status === 'error' || dispenser.status === 'maintenance'
                ? 'destructive'
                : dispenser.status === 'fueling'
                  ? 'secondary'
                  : 'outline'
            }
            className="text-[10px] px-1.5 py-0"
          >
            {cfg.label}
          </Badge>
        </div>
        <CardDescription className="text-[10px]">
          {dispenser.code} • {dispenser.manufacturer || 'N/A'} • Lane {dispenser.pumpLane}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-3">
        {/* Nozzle List */}
        <div className="space-y-1.5">
          {dispenser.nozzles.map((nozzle) => (
            <div
              key={nozzle.id}
              className="flex items-center justify-between rounded-md bg-background/50 px-2 py-1.5 text-xs"
            >
              <div className="flex items-center gap-2">
                <div
                  className={`size-2 rounded-full ${
                    nozzle.status === 'fueling' ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'
                  }`}
                />
                <span className="font-medium">
                  N{nozzle.nozzleNumber} - {nozzle.fuelType}
                </span>
              </div>
              <span className="text-muted-foreground font-mono">
                {nozzle.meterReading.toLocaleString()} L
              </span>
            </div>
          ))}
        </div>

        {/* Controller Info */}
        <Separator />
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] text-muted-foreground">
          <div className="flex justify-between">
            <span>Controller:</span>
            <span className="font-medium text-foreground">{dispenser.controllerType?.toUpperCase() || 'N/A'}</span>
          </div>
          <div className="flex justify-between">
            <span>Comm:</span>
            <span className="font-medium text-foreground">{dispenser.communicationType?.toUpperCase() || 'N/A'}</span>
          </div>
          <div className="flex justify-between">
            <span>IP:</span>
            <span className="font-medium text-foreground font-mono">{dispenser.ipAddress || 'N/A'}</span>
          </div>
          <div className="flex justify-between">
            <span>Last Comm:</span>
            <span className="font-medium text-foreground">
              {dispenser.lastCommunication
                ? new Date(dispenser.lastCommunication).toLocaleTimeString()
                : 'N/A'}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1">
            <Play className="size-3" /> Authorize
          </Button>
          <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1">
            <Square className="size-3" /> Stop
          </Button>
          <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1">
            <Lock className="size-3" /> Lock
          </Button>
          <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1">
            <Unlock className="size-3" /> Unlock
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <Skeleton className="h-5 w-24 mb-2" />
            <Skeleton className="h-3 w-32 mb-3" />
            <Skeleton className="h-4 w-full mb-1" />
            <Skeleton className="h-4 w-full mb-1" />
            <Skeleton className="h-8 w-full mt-2" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default function ForecourtModule() {
  const [dispensers, setDispensers] = useState<Dispenser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('pumps')

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const res = await fetch('/api/dispensers')
        if (!res.ok) throw new Error('Failed to load dispensers')
        const data = await res.json()
        setDispensers(data.dispensers || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
    const interval = setInterval(fetchData, 10000)
    return () => clearInterval(interval)
  }, [])

  const allNozzles = dispensers.flatMap((d) =>
    d.nozzles.map((n) => ({ ...n, dispenserName: d.name, dispenserCode: d.code }))
  )

  const statusSummary = {
    idle: dispensers.filter((d) => d.status === 'idle').length,
    fueling: dispensers.filter((d) => d.status === 'fueling').length,
    maintenance: dispensers.filter((d) => d.status === 'maintenance').length,
    locked: dispensers.filter((d) => d.status === 'locked').length,
    error: dispensers.filter((d) => d.status === 'error').length,
  }

  if (loading) return <LoadingSkeleton />
  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <AlertTriangle className="size-8 text-red-500 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" size="sm" className="mt-2" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Status Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Object.entries(statusSummary).map(([status, count]) => {
          const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.idle
          return (
            <Card key={status}>
              <CardContent className="p-3 flex items-center gap-3">
                <div className={`flex size-8 items-center justify-center rounded-lg ${cfg.bg}`}>
                  <Fuel className={`size-4 ${cfg.color}`} />
                </div>
                <div>
                  <p className="text-lg font-bold">{count}</p>
                  <p className="text-[10px] text-muted-foreground">{cfg.label}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pumps">Pumps</TabsTrigger>
          <TabsTrigger value="nozzle-control">Nozzle Control</TabsTrigger>
          <TabsTrigger value="emergency">Emergency</TabsTrigger>
        </TabsList>

        <TabsContent value="pumps" className="mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {dispensers.map((dispenser) => (
              <DispenserCard key={dispenser.id} dispenser={dispenser} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="nozzle-control" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">All Nozzles</CardTitle>
              <CardDescription className="text-xs">
                {allNozzles.length} nozzles across {dispensers.length} dispensers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-96">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Dispenser</TableHead>
                      <TableHead className="text-xs">Nozzle</TableHead>
                      <TableHead className="text-xs">Fuel Type</TableHead>
                      <TableHead className="text-xs text-right">Meter Reading</TableHead>
                      <TableHead className="text-xs">Calibration</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allNozzles.map((nozzle) => (
                      <TableRow key={nozzle.id}>
                        <TableCell className="text-xs font-medium">{nozzle.dispenserName}</TableCell>
                        <TableCell className="text-xs">N{nozzle.nozzleNumber}</TableCell>
                        <TableCell className="text-xs capitalize">{nozzle.fuelType}</TableCell>
                        <TableCell className="text-xs text-right font-mono">
                          {nozzle.meterReading.toLocaleString()} L
                        </TableCell>
                        <TableCell className="text-xs">
                          {nozzle.calibrationDate
                            ? new Date(nozzle.calibrationDate).toLocaleDateString()
                            : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={nozzle.status === 'fueling' ? 'secondary' : 'outline'}
                            className="text-[10px] px-1.5 py-0"
                          >
                            {nozzle.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="ghost" className="h-6 text-[10px]">
                            Calibrate
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="emergency" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Emergency Stop */}
            <Card className="border-red-200 dark:border-red-900/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-red-600">Emergency Controls</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  variant="destructive"
                  size="lg"
                  className="w-full h-20 text-lg font-bold gap-3"
                >
                  <OctagonX className="size-8" />
                  EMERGENCY STOP ALL PUMPS
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  This will immediately halt all dispensers and lock the forecourt.
                  Use only in case of emergency.
                </p>
                <Separator />
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground">Individual Pump Lockdown</p>
                  <div className="grid grid-cols-2 gap-2">
                    {dispensers.map((d) => (
                      <Button
                        key={d.id}
                        size="sm"
                        variant={d.status === 'locked' ? 'destructive' : 'outline'}
                        className="h-8 text-[10px] gap-1"
                      >
                        <Lock className="size-3" />
                        {d.name} {d.status === 'locked' ? '(Locked)' : ''}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Emergency Events */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Recent Emergency Events</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-2">
                    {dispensers
                      .filter((d) => d.status === 'maintenance' || d.status === 'error')
                      .map((d) => (
                        <div
                          key={d.id}
                          className="flex items-start gap-3 rounded-lg border p-3"
                        >
                          <AlertTriangle className="size-4 text-red-500 mt-0.5 shrink-0" />
                          <div className="text-xs">
                            <p className="font-medium">
                              {d.name} - {d.status === 'error' ? 'Error' : 'Maintenance Required'}
                            </p>
                            <p className="text-muted-foreground">
                              {d.manufacturer?.toUpperCase()} • Controller: {d.controllerType?.toUpperCase() || 'N/A'}
                            </p>
                            <p className="text-[10px] text-muted-foreground mt-1">
                              <Clock className="size-3 inline mr-1" />
                              Last communication: {d.lastCommunication
                                ? new Date(d.lastCommunication).toLocaleString()
                                : 'Unknown'}
                            </p>
                          </div>
                        </div>
                      ))}
                    {dispensers.filter((d) => d.status === 'maintenance' || d.status === 'error').length === 0 && (
                      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                        <Activity className="size-8 mb-2 opacity-50" />
                        <p className="text-xs">No active emergency events</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
