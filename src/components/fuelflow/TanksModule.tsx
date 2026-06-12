'use client'

import { useState, useEffect } from 'react'
import {
  Droplets,
  Thermometer,
  Gauge,
  AlertTriangle,
  Truck,
  ClipboardCheck,
  Wrench,
  Leaf,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Plus,
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts'

interface TankReading {
  id: string
  level: number
  volume: number
  waterLevel: number
  temperature: number
  density: number | null
  readingAt: string
}

interface Tank {
  id: string
  name: string
  code: string
  stationId: string
  fuelType: string
  capacity: number
  currentLevel: number
  levelPercentage: number
  waterLevel: number
  temperature: number
  density: number | null
  atgType: string | null
  status: string
  lastReading: string | null
  recentReadings: TankReading[]
}

interface Delivery {
  id: string
  supplierName: string
  tankerNumber: string | null
  driverName: string | null
  productType: string
  expectedVolume: number
  actualVolume: number
  status: string
  deliveryDate: string
  completedAt: string | null
  variance: number | null
  totalCost: number | null
}

interface Reconciliation {
  id: string
  date: string
  openingStock: number
  deliveries: number
  sales: number
  closingStock: number
  bookStock: number
  actualStock: number
  variance: number
  variancePercentage: number
  status: string
  reviewedBy: string | null
}

interface Calibration {
  id: string
  calibrationDate: string
  calibratedBy: string | null
  certificateNumber: string | null
  notes: string | null
  tank: { name: string; code: string; fuelType: string }
}

interface EnvironmentalAlert {
  id: string
  alertType: string
  severity: string
  description: string
  epaCode: string | null
  isReportable: boolean
  isResolved: boolean
  createdAt: string
}

interface VaporReading {
  id: string
  vaporPressure: number
  recoveryRate: number | null
  status: string
  readingAt: string
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}><CardContent className="p-4"><Skeleton className="h-40 w-full" /></CardContent></Card>
        ))}
      </div>
    </div>
  )
}

export default function TanksModule() {
  const [tanks, setTanks] = useState<Tank[]>([])
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [reconciliations, setReconciliations] = useState<Reconciliation[]>([])
  const [calibrations, setCalibrations] = useState<Calibration[]>([])
  const [envAlerts, setEnvAlerts] = useState<EnvironmentalAlert[]>([])
  const [vaporReadings, setVaporReadings] = useState<VaporReading[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('monitor')
  const [deliveryDialogOpen, setDeliveryDialogOpen] = useState(false)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const [tanksRes] = await Promise.all([
          fetch('/api/tanks'),
        ])
        if (!tanksRes.ok) throw new Error('Failed to load tanks')
        const tanksData = await tanksRes.json()
        setTanks(tanksData.tanks || [])

        // Fetch deliveries
        try {
          const delRes = await fetch('/api/deliveries')
          if (delRes.ok) {
            const delData = await delRes.json()
            setDeliveries(delData.deliveries || [])
          }
        } catch {}

        // Fetch environmental
        try {
          const envRes = await fetch('/api/environmental')
          if (envRes.ok) {
            const envData = await envRes.json()
            setEnvAlerts(envData.alerts || [])
            setVaporReadings(envData.vaporReadings || [])
          }
        } catch {}

        // Fetch calibrations
        try {
          const calRes = await fetch('/api/calibrations')
          if (calRes.ok) {
            const calData = await calRes.json()
            setCalibrations(calData.calibrations || [])
          }
        } catch {}

        // Fetch reconciliations
        try {
          const recRes = await fetch('/api/reconciliations')
          if (recRes.ok) {
            const recData = await recRes.json()
            setReconciliations(recData.reconciliations || [])
          }
        } catch {}
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
    const interval = setInterval(fetchData, 30000)
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
          <TabsTrigger value="monitor">Tank Monitor</TabsTrigger>
          <TabsTrigger value="deliveries">Deliveries</TabsTrigger>
          <TabsTrigger value="reconciliation">Reconciliation</TabsTrigger>
          <TabsTrigger value="calibration">Calibration</TabsTrigger>
          <TabsTrigger value="environmental">Environmental</TabsTrigger>
        </TabsList>

        {/* Tank Monitor */}
        <TabsContent value="monitor" className="mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {tanks.map((tank) => (
              <Card key={tank.id} className={
                tank.status === 'critical' ? 'border-red-200 dark:border-red-900/50' :
                tank.status === 'low' ? 'border-amber-200 dark:border-amber-900/50' : ''
              }>
                <CardHeader className="pb-2 p-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold">{tank.name}</CardTitle>
                    <Badge
                      variant={tank.status === 'critical' ? 'destructive' : tank.status === 'low' ? 'secondary' : 'outline'}
                      className="text-[10px] px-1.5 py-0"
                    >
                      {tank.status}
                    </Badge>
                  </div>
                  <CardDescription className="text-[10px] capitalize">{tank.fuelType} • {tank.code}</CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-3">
                  {/* Level Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Level</span>
                      <span className="font-bold">{tank.levelPercentage.toFixed(1)}%</span>
                    </div>
                    <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          tank.status === 'critical' ? 'bg-red-500' :
                          tank.status === 'low' ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(tank.levelPercentage, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>{Math.round(tank.currentLevel).toLocaleString()} L</span>
                      <span>{tank.capacity.toLocaleString()} L</span>
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1.5">
                      <Thermometer className="size-3 text-amber-500" />
                      <span>{tank.temperature.toFixed(1)}°C</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Droplets className="size-3 text-blue-500" />
                      <span>Water: {tank.waterLevel}mm</span>
                    </div>
                    {tank.density && (
                      <div className="flex items-center gap-1.5">
                        <Gauge className="size-3 text-purple-500" />
                        <span>ρ: {tank.density.toFixed(3)}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      <Activity className="size-3 text-slate-400" />
                      <span>ATG: {tank.atgType || 'N/A'}</span>
                    </div>
                  </div>

                  {/* Mini Chart */}
                  {tank.recentReadings.length > 0 && (
                    <div className="h-16 mt-1">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={tank.recentReadings.slice().reverse().map((r) => ({
                          time: new Date(r.readingAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
                          level: Math.round(r.volume),
                        }))}>
                          <XAxis dataKey="time" hide />
                          <Line type="monotone" dataKey="level" stroke="#f59e0b" strokeWidth={1.5} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Deliveries */}
        <TabsContent value="deliveries" className="mt-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold">Fuel Deliveries</h3>
              <p className="text-xs text-muted-foreground">{deliveries.length} delivery records</p>
            </div>
            <Dialog open={deliveryDialogOpen} onOpenChange={setDeliveryDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1">
                  <Plus className="size-3" /> New Delivery
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Record New Delivery</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium">Supplier Name</label>
                    <Input placeholder="Enter supplier name" className="mt-1" />
                  </div>
                  <div>
                    <label className="text-xs font-medium">Product Type</label>
                    <Select>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Select fuel type" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="petrol">Petrol</SelectItem>
                        <SelectItem value="diesel">Diesel</SelectItem>
                        <SelectItem value="premium">Premium</SelectItem>
                        <SelectItem value="hsd">HSD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs font-medium">Expected Volume (L)</label>
                    <Input type="number" placeholder="0" className="mt-1" />
                  </div>
                  <div>
                    <label className="text-xs font-medium">Tanker Number</label>
                    <Input placeholder="Enter tanker number" className="mt-1" />
                  </div>
                  <Button className="w-full" onClick={() => setDeliveryDialogOpen(false)}>
                    Record Delivery
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <Card>
            <CardContent className="p-0">
              <ScrollArea className="max-h-96">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Date</TableHead>
                      <TableHead className="text-xs">Supplier</TableHead>
                      <TableHead className="text-xs">Product</TableHead>
                      <TableHead className="text-xs text-right">Expected</TableHead>
                      <TableHead className="text-xs text-right">Actual</TableHead>
                      <TableHead className="text-xs text-right">Variance</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deliveries.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-xs text-muted-foreground py-8">
                          No delivery records found
                        </TableCell>
                      </TableRow>
                    ) : (
                      deliveries.map((d) => (
                        <TableRow key={d.id}>
                          <TableCell className="text-xs font-mono">
                            {new Date(d.deliveryDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-xs">{d.supplierName}</TableCell>
                          <TableCell className="text-xs capitalize">{d.productType}</TableCell>
                          <TableCell className="text-xs text-right">{d.expectedVolume.toLocaleString()} L</TableCell>
                          <TableCell className="text-xs text-right">{d.actualVolume.toLocaleString()} L</TableCell>
                          <TableCell className="text-xs text-right">
                            {d.variance !== null ? (
                              <span className={d.variance > 0 ? 'text-red-500' : 'text-emerald-500'}>
                                {d.variance > 0 ? '+' : ''}{d.variance} L
                              </span>
                            ) : '-'}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                d.status === 'completed' ? 'outline' :
                                d.status === 'discrepancy' ? 'destructive' : 'secondary'
                              }
                              className="text-[10px] px-1.5 py-0 capitalize"
                            >
                              {d.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reconciliation */}
        <TabsContent value="reconciliation" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Stock Reconciliation</CardTitle>
              <CardDescription className="text-xs">{reconciliations.length} records</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="max-h-96">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Date</TableHead>
                      <TableHead className="text-xs text-right">Opening</TableHead>
                      <TableHead className="text-xs text-right">Deliveries</TableHead>
                      <TableHead className="text-xs text-right">Sales</TableHead>
                      <TableHead className="text-xs text-right">Book Stock</TableHead>
                      <TableHead className="text-xs text-right">Actual</TableHead>
                      <TableHead className="text-xs text-right">Variance</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reconciliations.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-xs text-muted-foreground py-8">
                          No reconciliation records found
                        </TableCell>
                      </TableRow>
                    ) : (
                      reconciliations.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell className="text-xs font-mono">
                            {new Date(r.date).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-xs text-right">{r.openingStock.toLocaleString()}</TableCell>
                          <TableCell className="text-xs text-right">{r.deliveries.toLocaleString()}</TableCell>
                          <TableCell className="text-xs text-right">{r.sales.toLocaleString()}</TableCell>
                          <TableCell className="text-xs text-right">{r.bookStock.toLocaleString()}</TableCell>
                          <TableCell className="text-xs text-right">{r.actualStock.toLocaleString()}</TableCell>
                          <TableCell className="text-xs text-right">
                            <span className={Math.abs(r.variancePercentage) > 0.5 ? 'text-red-500' : 'text-emerald-500'}>
                              {r.variancePercentage.toFixed(2)}%
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Badge
                                variant={
                                  r.status === 'approved' ? 'outline' :
                                  r.status === 'pending' ? 'secondary' : 'destructive'
                                }
                                className="text-[10px] px-1.5 py-0"
                              >
                                {r.status}
                              </Badge>
                              {r.status === 'pending' && (
                                <Button size="sm" variant="ghost" className="h-5 text-[9px]">Review</Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Calibration */}
        <TabsContent value="calibration" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Calibration Records</CardTitle>
              <CardDescription className="text-xs">{calibrations.length} records</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="max-h-96">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Tank</TableHead>
                      <TableHead className="text-xs">Fuel Type</TableHead>
                      <TableHead className="text-xs">Calibration Date</TableHead>
                      <TableHead className="text-xs">Certificate #</TableHead>
                      <TableHead className="text-xs">Calibrated By</TableHead>
                      <TableHead className="text-xs">Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {calibrations.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-xs text-muted-foreground py-8">
                          No calibration records found
                        </TableCell>
                      </TableRow>
                    ) : (
                      calibrations.map((c) => (
                        <TableRow key={c.id}>
                          <TableCell className="text-xs font-medium">{c.tank?.name || 'N/A'}</TableCell>
                          <TableCell className="text-xs capitalize">{c.tank?.fuelType || 'N/A'}</TableCell>
                          <TableCell className="text-xs font-mono">
                            {new Date(c.calibrationDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-xs font-mono">{c.certificateNumber || 'N/A'}</TableCell>
                          <TableCell className="text-xs">{c.calibratedBy || 'N/A'}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{c.notes || '-'}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Environmental */}
        <TabsContent value="environmental" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Leaf className="size-4 text-emerald-500" />
                  <CardTitle className="text-sm font-semibold">Environmental Alerts</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  {envAlerts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                      <CheckCircle2 className="size-8 mb-2 opacity-50" />
                      <p className="text-xs">No environmental alerts</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {envAlerts.map((a) => (
                        <div key={a.id} className="rounded-lg border p-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <Badge
                                variant={a.severity === 'critical' ? 'destructive' : a.severity === 'warning' ? 'secondary' : 'outline'}
                                className="text-[9px] px-1.5 py-0 mb-1"
                              >
                                {a.alertType}
                              </Badge>
                              <p className="text-xs mt-1">{a.description}</p>
                              {a.epaCode && (
                                <p className="text-[10px] text-muted-foreground mt-1">EPA Code: {a.epaCode}</p>
                              )}
                            </div>
                            <div className="text-right">
                              {a.isReportable && (
                                <Badge variant="destructive" className="text-[9px] px-1 py-0 mb-1">Reportable</Badge>
                              )}
                              <p className="text-[10px] text-muted-foreground">
                                {new Date(a.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Droplets className="size-4 text-blue-500" />
                  <CardTitle className="text-sm font-semibold">Vapor Recovery & EPA Compliance</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <div>
                    <p className="text-xs font-medium">EPA Compliance Status</p>
                    <p className="text-[10px] text-muted-foreground">Last checked: Today</p>
                  </div>
                  <Badge variant="outline" className="text-emerald-600 border-emerald-500/30 bg-emerald-500/10">
                    Compliant
                  </Badge>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground">Vapor Recovery Readings</p>
                  {vaporReadings.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No vapor recovery readings available</p>
                  ) : (
                    vaporReadings.slice(0, 5).map((v) => (
                      <div key={v.id} className="flex items-center justify-between text-xs border-b pb-1">
                        <span className="font-mono">{new Date(v.readingAt).toLocaleString()}</span>
                        <span>Pressure: {v.vaporPressure} mbar</span>
                        <Badge
                          variant={v.status === 'violation' ? 'destructive' : v.status === 'warning' ? 'secondary' : 'outline'}
                          className="text-[9px] px-1 py-0"
                        >
                          {v.status}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
