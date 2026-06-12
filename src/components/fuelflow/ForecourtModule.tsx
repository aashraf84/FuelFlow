'use client'

import { useState, useEffect } from 'react'
import {
  Fuel,
  Play,
  Square,
  Lock,
  Wifi,
  WifiOff,
  Settings,
  AlertTriangle,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

interface Nozzle {
  id: string
  nozzleNumber: number
  fuelType: string
  fuelGrade?: string
  meterReading: number
  previousReading: number
  status: string
  isActive: boolean
}

interface Dispenser {
  id: string
  name: string
  code: string
  manufacturer?: string
  model?: string
  controllerType?: string
  communicationType?: string
  status: string
  isActive: boolean
  nozzles: Nozzle[]
  station: { id: string; name: string; code: string }
}

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    idle: 'bg-emerald-500',
    fueling: 'bg-amber-500 animate-pulse',
    maintenance: 'bg-red-500',
    error: 'bg-red-500',
    stopped: 'bg-yellow-500',
    locked: 'bg-gray-500',
  }
  return <div className={`size-2.5 rounded-full ${colors[status] || 'bg-gray-400'}`} />
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, { variant: 'outline' | 'secondary' | 'destructive'; label: string }> = {
    idle: { variant: 'outline', label: 'Idle' },
    fueling: { variant: 'secondary', label: 'Fueling' },
    maintenance: { variant: 'destructive', label: 'Maintenance' },
    error: { variant: 'destructive', label: 'Error' },
    stopped: { variant: 'secondary', label: 'Stopped' },
    locked: { variant: 'secondary', label: 'Locked' },
  }
  const config = variants[status] || { variant: 'secondary' as const, label: status }
  return (
    <Badge variant={config.variant} className="text-xs gap-1">
      <StatusDot status={status} />
      {config.label}
    </Badge>
  )
}

function NozzleStatusBadge({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    idle: 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-950 dark:border-emerald-800',
    fueling: 'text-amber-600 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-950 dark:border-amber-800',
    closed: 'text-gray-600 bg-gray-50 border-gray-200 dark:text-gray-400 dark:bg-gray-900 dark:border-gray-700',
    error: 'text-red-600 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-950 dark:border-red-800',
    locked: 'text-gray-600 bg-gray-50 border-gray-200 dark:text-gray-400 dark:bg-gray-900 dark:border-gray-700',
  }
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded border ${colorMap[status] || 'text-gray-500 bg-gray-50 border-gray-200'}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

export default function ForecourtModule() {
  const [dispensers, setDispensers] = useState<Dispenser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/dispensers')
        if (!res.ok) throw new Error('Failed to fetch')
        const json = await res.json()
        setDispensers(json.dispensers || [])
      } catch (err) {
        console.error('Failed to fetch dispensers:', err)
        setError('Failed to load dispenser data')
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
          <Fuel className="size-5 text-amber-500" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Forecourt Automation</h2>
          <p className="text-sm text-muted-foreground">
            Real-time pump monitoring, nozzle tracking, and forecourt operations
          </p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-5 w-16" />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <div className="flex gap-2 pt-2">
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-8 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : dispensers.length === 0 ? (
        <Card>
          <CardContent className="flex h-48 items-center justify-center">
            <div className="text-center space-y-2">
              <Fuel className="size-10 mx-auto text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No dispensers configured</p>
              <p className="text-xs text-muted-foreground">Add dispensers through the settings page</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {dispensers.map((dispenser) => (
            <Card key={dispenser.id} className="relative overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-sm">{dispenser.name}</CardTitle>
                    {dispenser.manufacturer && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
                        {dispenser.manufacturer}
                      </Badge>
                    )}
                  </div>
                  <StatusBadge status={dispenser.status} />
                </div>
                {dispenser.model && (
                  <CardDescription className="text-xs">{dispenser.model}</CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Nozzles */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Nozzles</p>
                  {dispenser.nozzles.map((nozzle) => (
                    <div key={nozzle.id} className="flex items-center justify-between text-xs bg-muted/50 rounded px-2 py-1.5">
                      <div className="flex items-center gap-2">
                        <div className={`size-1.5 rounded-full ${nozzle.status === 'fueling' ? 'bg-amber-500 animate-pulse' : nozzle.status === 'error' ? 'bg-red-500' : 'bg-emerald-500'}`} />
                        <span className="font-medium">N{nozzle.nozzleNumber}</span>
                        <span className="text-muted-foreground capitalize">{nozzle.fuelType}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">{nozzle.meterReading.toLocaleString()}L</span>
                        <NozzleStatusBadge status={nozzle.status} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Controller info */}
                {(dispenser.controllerType || dispenser.communicationType) && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {dispenser.communicationType === 'tcpip' || dispenser.communicationType === 'ethernet' ? (
                      <Wifi className="size-3 text-emerald-500" />
                    ) : (
                      <WifiOff className="size-3 text-muted-foreground" />
                    )}
                    <span>{dispenser.controllerType || 'Unknown'} / {dispenser.communicationType || 'N/A'}</span>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-2 pt-2 border-t">
                  <Button variant="outline" size="sm" className="h-7 text-xs flex-1 gap-1" disabled={dispenser.status === 'fueling'}>
                    <Play className="size-3" />
                    Authorize
                  </Button>
                  <Button variant="outline" size="sm" className="h-7 text-xs flex-1 gap-1" disabled={dispenser.status !== 'fueling'}>
                    <Square className="size-3" />
                    Stop
                  </Button>
                  <Button variant="outline" size="sm" className="h-7 text-xs gap-1" disabled={dispenser.status === 'locked'}>
                    <Lock className="size-3" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                    <Settings className="size-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
