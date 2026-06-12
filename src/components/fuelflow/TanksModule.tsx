'use client'

import { useState, useEffect } from 'react'
import {
  Droplets,
  Thermometer,
  Waves,
  Gauge,
  AlertTriangle,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

interface TankReading {
  id: string
  level: number
  volume: number
  waterLevel: number
  temperature: number
  readingAt: string
}

interface Tank {
  id: string
  name: string
  code: string
  fuelType: string
  capacity: number
  currentLevel: number
  levelPercentage: number
  waterLevel: number
  temperature: number
  density: number | null
  atgType: string | null
  status: string
  recentReadings: TankReading[]
}

function getLevelColor(level: number): string {
  if (level < 15) return 'bg-red-500'
  if (level < 25) return 'bg-amber-500'
  return 'bg-emerald-500'
}

function getProgressColor(level: number): string {
  if (level < 15) return '[&>div]:bg-red-500'
  if (level < 25) return '[&>div]:bg-amber-500'
  return '[&>div]:bg-emerald-500'
}

function StatusBadge({ status }: { status: string }) {
  const configs: Record<string, { variant: 'outline' | 'secondary' | 'destructive'; label: string; className: string }> = {
    normal: { variant: 'outline', label: 'Normal', className: 'bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:text-emerald-400 dark:border-emerald-800' },
    low: { variant: 'secondary', label: 'Low', className: 'bg-amber-500/10 text-amber-600 border-amber-200 dark:text-amber-400 dark:border-amber-800' },
    critical: { variant: 'destructive', label: 'Critical', className: 'bg-red-500/10 text-red-600 border-red-200 dark:text-red-400 dark:border-red-800' },
    leak_detected: { variant: 'destructive', label: 'Leak Detected', className: 'bg-red-500/10 text-red-600 border-red-200 dark:text-red-400 dark:border-red-800' },
  }
  const config = configs[status] || configs.normal
  return (
    <Badge variant={config.variant} className={`text-xs ${config.className}`}>
      {config.label}
    </Badge>
  )
}

export default function TanksModule() {
  const [tanks, setTanks] = useState<Tank[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/tanks')
        if (!res.ok) throw new Error('Failed to fetch')
        const json = await res.json()
        setTanks(json.tanks || [])
      } catch (err) {
        console.error('Failed to fetch tanks:', err)
        setError('Failed to load tank data')
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
          <Droplets className="size-5 text-amber-500" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Tanks & Wet Stock</h2>
          <p className="text-sm text-muted-foreground">
            Tank gauging, wet stock reconciliation, and delivery management
          </p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-5 w-28" />
                  <Skeleton className="h-5 w-16" />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-8 w-full" />
                <div className="grid grid-cols-2 gap-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : tanks.length === 0 ? (
        <Card>
          <CardContent className="flex h-48 items-center justify-center">
            <div className="text-center space-y-2">
              <Droplets className="size-10 mx-auto text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No tanks configured</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tanks.map((tank) => (
            <Card key={tank.id} className="relative overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Droplets className="size-4 text-amber-500" />
                      {tank.name}
                    </CardTitle>
                    <CardDescription className="text-xs capitalize">{tank.fuelType} - {tank.code}</CardDescription>
                  </div>
                  <StatusBadge status={tank.status} />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Level indicator */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Level</span>
                    <span className="font-medium">{tank.levelPercentage.toFixed(1)}%</span>
                  </div>
                  <div className="relative">
                    <Progress value={tank.levelPercentage} className={`h-3 ${getProgressColor(tank.levelPercentage)}`} />
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold">{Math.round(tank.currentLevel).toLocaleString()} L</span>
                    <span className="text-muted-foreground">/ {tank.capacity.toLocaleString()} L</span>
                  </div>
                </div>

                {/* Metrics grid */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-muted/50 rounded-lg p-2 flex items-center gap-2">
                    <Thermometer className="size-3.5 text-amber-500" />
                    <div>
                      <p className="text-[10px] text-muted-foreground">Temp</p>
                      <p className="text-xs font-medium">{tank.temperature}°C</p>
                    </div>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-2 flex items-center gap-2">
                    <Waves className="size-3.5 text-blue-500" />
                    <div>
                      <p className="text-[10px] text-muted-foreground">Water</p>
                      <p className="text-xs font-medium">{tank.waterLevel} mm</p>
                    </div>
                  </div>
                  {tank.density !== null && tank.density !== undefined && (
                    <div className="bg-muted/50 rounded-lg p-2 flex items-center gap-2">
                      <Gauge className="size-3.5 text-purple-500" />
                      <div>
                        <p className="text-[10px] text-muted-foreground">Density</p>
                        <p className="text-xs font-medium">{tank.density}</p>
                      </div>
                    </div>
                  )}
                  {tank.atgType && (
                    <div className="bg-muted/50 rounded-lg p-2 flex items-center gap-2">
                      <Droplets className="size-3.5 text-emerald-500" />
                      <div>
                        <p className="text-[10px] text-muted-foreground">ATG</p>
                        <p className="text-xs font-medium">{tank.atgType}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Readings chart */}
                {tank.recentReadings && tank.recentReadings.length > 1 && (
                  <div className="space-y-1">
                    <p className="text-[10px] font-medium text-muted-foreground uppercase">Recent Readings</p>
                    <div className="h-20">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={tank.recentReadings.map(r => ({
                          time: new Date(r.readingAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
                          volume: Math.round(r.volume),
                        }))}>
                          <XAxis dataKey="time" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
                          <Tooltip contentStyle={{ fontSize: 10, borderRadius: 6 }} />
                          <Bar dataKey="volume" fill="#f59e0b" radius={[2, 2, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </CardContent>
              {/* Bottom color indicator */}
              <div className={`absolute bottom-0 left-0 right-0 h-1 ${getLevelColor(tank.levelPercentage)}`} />
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
