'use client'

import { useState, useEffect } from 'react'
import {
  Building2,
  AlertTriangle,
  Fuel,
  Users,
  MapPin,
  Activity,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'

interface Station {
  id: string
  name: string
  code: string
  city: string | null
  region: string | null
  stationType: string
  address: string | null
  isActive: boolean
  dispenserCount: number
  tankCount: number
  employeeCount: number
  activeShifts: number
  fuelLevelPercentage: number
}

function StationTypeBadge({ type }: { type: string }) {
  const configs: Record<string, { className: string; label: string }> = {
    fuel: { className: 'bg-amber-500/10 text-amber-600 border-amber-200 dark:text-amber-400 dark:border-amber-800', label: 'Fuel Station' },
    cng: { className: 'bg-blue-500/10 text-blue-600 border-blue-200 dark:text-blue-400 dark:border-blue-800', label: 'CNG Station' },
    ev: { className: 'bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:text-emerald-400 dark:border-emerald-800', label: 'EV Station' },
    hybrid: { className: 'bg-purple-500/10 text-purple-600 border-purple-200 dark:text-purple-400 dark:border-purple-800', label: 'Hybrid Station' },
  }
  const config = configs[type] || configs.fuel
  return (
    <Badge variant="outline" className={`text-[10px] ${config.className}`}>
      {config.label}
    </Badge>
  )
}

export default function MultiSiteModule() {
  const [stations, setStations] = useState<Station[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/stations')
        if (!res.ok) throw new Error('Failed to fetch')
        const json = await res.json()
        setStations(json.stations || [])
      } catch (err) {
        console.error('Failed to fetch stations:', err)
        setError('Failed to load station data')
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
          <Building2 className="size-5 text-amber-500" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Multi-Site Management</h2>
          <p className="text-sm text-muted-foreground">
            Network-wide site management, benchmarking, and centralised control
          </p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4 space-y-3">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 w-full" />
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-16" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : stations.length === 0 ? (
        <Card>
          <CardContent className="flex h-48 items-center justify-center">
            <div className="text-center space-y-2">
              <Building2 className="size-10 mx-auto text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No stations found</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stations.map((station) => (
            <Card key={station.id} className="relative overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Building2 className="size-4 text-amber-500" />
                    {station.name}
                  </CardTitle>
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${station.isActive ? 'bg-emerald-500/10 text-emerald-600 border-emerald-200' : 'bg-red-500/10 text-red-600 border-red-200'}`}
                  >
                    {station.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <CardDescription className="text-xs flex items-center gap-1">
                  <span className="font-mono">{station.code}</span>
                  {station.city && (
                    <>
                      <span>·</span>
                      <MapPin className="size-2.5" />
                      <span>{station.city}</span>
                    </>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <StationTypeBadge type={station.stationType} />

                {/* Fuel level */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Fuel className="size-3" />
                      Fuel Level
                    </span>
                    <span className="font-medium">{station.fuelLevelPercentage}%</span>
                  </div>
                  <Progress
                    value={station.fuelLevelPercentage}
                    className={`h-2 ${station.fuelLevelPercentage < 20 ? '[&>div]:bg-red-500' : station.fuelLevelPercentage < 40 ? '[&>div]:bg-amber-500' : '[&>div]:bg-emerald-500'}`}
                  />
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="bg-muted/50 rounded p-1.5 text-center">
                    <p className="text-[10px] text-muted-foreground">Pumps</p>
                    <p className="font-semibold">{station.dispenserCount}</p>
                  </div>
                  <div className="bg-muted/50 rounded p-1.5 text-center">
                    <p className="text-[10px] text-muted-foreground">Tanks</p>
                    <p className="font-semibold">{station.tankCount}</p>
                  </div>
                  <div className="bg-muted/50 rounded p-1.5 text-center">
                    <p className="text-[10px] text-muted-foreground">Staff</p>
                    <p className="font-semibold">{station.employeeCount}</p>
                  </div>
                </div>

                {/* Active shifts */}
                {station.activeShifts > 0 && (
                  <div className="flex items-center gap-1.5 text-[10px] text-emerald-600">
                    <Activity className="size-2.5" />
                    <span>{station.activeShifts} active shift{station.activeShifts > 1 ? 's' : ''}</span>
                  </div>
                )}
              </CardContent>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
