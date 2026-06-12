'use client'

import { useState, useEffect } from 'react'
import {
  Building2,
  MapPin,
  Fuel,
  Users,
  Droplets,
  AlertTriangle,
  Activity,
  LayoutGrid,
  BarChart3,
  Globe,
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
  createdAt: string
}

const TYPE_BADGES: Record<string, { label: string; color: string }> = {
  fuel: { label: 'Fuel', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
  cng: { label: 'CNG', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
  ev: { label: 'EV', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  hybrid: { label: 'Hybrid', color: 'bg-purple-500/10 text-purple-600 border-purple-500/20' },
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

export default function MultiSiteModule() {
  const [stations, setStations] = useState<Station[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('all')

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const res = await fetch('/api/stations')
        if (!res.ok) throw new Error('Failed to load stations')
        const data = await res.json()
        setStations(data.stations || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
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

  // Group by region
  const byRegion: Record<string, Station[]> = {}
  stations.forEach((s) => {
    const region = s.region || 'Unknown'
    if (!byRegion[region]) byRegion[region] = []
    byRegion[region].push(s)
  })

  return (
    <div className="space-y-4">
      {/* Summary Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-3 flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-lg bg-amber-500/10">
              <Building2 className="size-4 text-amber-500" />
            </div>
            <div>
              <p className="text-lg font-bold">{stations.length}</p>
              <p className="text-[10px] text-muted-foreground">Total Stations</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10">
              <Fuel className="size-4 text-emerald-500" />
            </div>
            <div>
              <p className="text-lg font-bold">{stations.reduce((sum, s) => sum + s.dispenserCount, 0)}</p>
              <p className="text-[10px] text-muted-foreground">Total Pumps</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-lg bg-blue-500/10">
              <Droplets className="size-4 text-blue-500" />
            </div>
            <div>
              <p className="text-lg font-bold">{stations.reduce((sum, s) => sum + s.tankCount, 0)}</p>
              <p className="text-[10px] text-muted-foreground">Total Tanks</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-lg bg-purple-500/10">
              <Users className="size-4 text-purple-500" />
            </div>
            <div>
              <p className="text-lg font-bold">{stations.reduce((sum, s) => sum + s.employeeCount, 0)}</p>
              <p className="text-[10px] text-muted-foreground">Total Employees</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Stations</TabsTrigger>
          <TabsTrigger value="comparison">Station Comparison</TabsTrigger>
          <TabsTrigger value="regional">Regional View</TabsTrigger>
        </TabsList>

        {/* All Stations */}
        <TabsContent value="all" className="mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {stations.map((station) => {
              const typeBadge = TYPE_BADGES[station.stationType] || TYPE_BADGES.fuel
              return (
                <Card key={station.id}>
                  <CardHeader className="pb-2 p-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-semibold">{station.name}</CardTitle>
                      <Badge className={`text-[9px] px-1.5 py-0 border ${typeBadge.color}`}>
                        {typeBadge.label}
                      </Badge>
                    </div>
                    <CardDescription className="text-[10px]">
                      <MapPin className="size-3 inline mr-1" />
                      {station.address || station.city || 'N/A'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 space-y-2">
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="text-center">
                        <p className="font-bold">{station.dispenserCount}</p>
                        <p className="text-[10px] text-muted-foreground">Pumps</p>
                      </div>
                      <div className="text-center">
                        <p className="font-bold">{station.tankCount}</p>
                        <p className="text-[10px] text-muted-foreground">Tanks</p>
                      </div>
                      <div className="text-center">
                        <p className="font-bold">{station.employeeCount}</p>
                        <p className="text-[10px] text-muted-foreground">Staff</p>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-muted-foreground">Fuel Level</span>
                        <span className="font-medium">{station.fuelLevelPercentage}%</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            station.fuelLevelPercentage < 20 ? 'bg-red-500' :
                            station.fuelLevelPercentage < 40 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(station.fuelLevelPercentage, 100)}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-muted-foreground">Active Shifts:</span>
                      <Badge variant={station.activeShifts > 0 ? 'outline' : 'secondary'} className="text-[9px] px-1.5 py-0">
                        {station.activeShifts}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        {/* Station Comparison */}
        <TabsContent value="comparison" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <BarChart3 className="size-4 text-amber-500" />
                <CardTitle className="text-sm font-semibold">Station Comparison</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="max-h-96">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Station</TableHead>
                      <TableHead className="text-xs">Type</TableHead>
                      <TableHead className="text-xs">City</TableHead>
                      <TableHead className="text-xs text-right">Pumps</TableHead>
                      <TableHead className="text-xs text-right">Tanks</TableHead>
                      <TableHead className="text-xs text-right">Staff</TableHead>
                      <TableHead className="text-xs text-right">Fuel Level</TableHead>
                      <TableHead className="text-xs">Shifts</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stations.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="text-xs font-medium">{s.name}</TableCell>
                        <TableCell>
                          <Badge className={`text-[9px] px-1.5 py-0 border ${(TYPE_BADGES[s.stationType] || TYPE_BADGES.fuel).color}`}>
                            {(TYPE_BADGES[s.stationType] || TYPE_BADGES.fuel).label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">{s.city || 'N/A'}</TableCell>
                        <TableCell className="text-xs text-right">{s.dispenserCount}</TableCell>
                        <TableCell className="text-xs text-right">{s.tankCount}</TableCell>
                        <TableCell className="text-xs text-right">{s.employeeCount}</TableCell>
                        <TableCell className="text-xs text-right">
                          <span className={
                            s.fuelLevelPercentage < 20 ? 'text-red-500' :
                            s.fuelLevelPercentage < 40 ? 'text-amber-500' : 'text-emerald-500'
                          }>
                            {s.fuelLevelPercentage}%
                          </span>
                        </TableCell>
                        <TableCell className="text-xs">{s.activeShifts}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Regional View */}
        <TabsContent value="regional" className="mt-4">
          <div className="space-y-6">
            {Object.entries(byRegion).map(([region, regionStations]) => (
              <Card key={region}>
                <CardHeader className="pb-2 p-4">
                  <div className="flex items-center gap-2">
                    <Globe className="size-4 text-amber-500" />
                    <CardTitle className="text-sm font-semibold">{region}</CardTitle>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      {regionStations.length} stations
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {regionStations.map((station) => {
                      const typeBadge = TYPE_BADGES[station.stationType] || TYPE_BADGES.fuel
                      return (
                        <div key={station.id} className="rounded-lg border p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium">{station.name}</span>
                            <Badge className={`text-[9px] px-1 py-0 border ${typeBadge.color}`}>{typeBadge.label}</Badge>
                          </div>
                          <div className="grid grid-cols-3 gap-1 text-[10px] text-center">
                            <div><span className="font-bold">{station.dispenserCount}</span> Pumps</div>
                            <div><span className="font-bold">{station.tankCount}</span> Tanks</div>
                            <div><span className="font-bold">{station.employeeCount}</span> Staff</div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
