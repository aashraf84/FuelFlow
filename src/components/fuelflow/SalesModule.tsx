'use client'

import { useState, useEffect } from 'react'
import {
  Receipt,
  DollarSign,
  Fuel,
  Clock,
  CreditCard,
  Banknote,
  TrendingUp,
  ArrowUpRight,
  Calendar,
  Play,
  Square,
  Activity,
  AlertTriangle,
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
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface Fueling {
  id: string
  fuelType: string
  volume: number
  pricePerUnit: number
  totalAmount: number
  paymentMethod: string
  status: string
  startedAt: string
  completedAt: string | null
  dispenser: { name: string; code: string } | null
  nozzle: { nozzleNumber: number; fuelType: string } | null
  attendant: { id: string; name: string } | null
  shift: { id: string; shiftNumber: number; status: string } | null
  fleetAccount: { id: string; companyName: string } | null
}

interface Shift {
  id: string
  shiftNumber: number
  attendant: { id: string; name: string; role: string } | null
  openedAt: string
  closedAt: string | null
  openingCash: number
  closingCash: number | null
  totalSales: number
  totalVolume: number
  transactionCount: number
  status: string
  station: { id: string; name: string; code: string }
  _count: { fuelings: number; retailTransactions: number }
}

interface MeterRecord {
  id: string
  readingStart: number
  readingEnd: number | null
  volumeDispensed: number | null
  recordedAt: string
  nozzle: {
    id: string
    nozzleNumber: number
    fuelType: string
    dispenser: { name: string; code: string }
  }
}

interface DailyReport {
  id: string
  reportDate: string
  totalRevenue: number
  fuelRevenue: number
  retailRevenue: number
  totalVolume: number
  transactionCount: number
  averageTicket: number
  cashVariance: number
  fuelVariance: number
  expenses: number
  netProfit: number
}

const PAYMENT_COLORS: Record<string, string> = {
  cash: '#10b981',
  card: '#f59e0b',
  fleet: '#6366f1',
  rfid: '#8b5cf6',
  mobile: '#ec4899',
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}><CardContent className="p-4"><Skeleton className="h-20 w-full" /></CardContent></Card>
        ))}
      </div>
    </div>
  )
}

export default function SalesModule() {
  const [fuelings, setFuelings] = useState<Fueling[]>([])
  const [shifts, setShifts] = useState<Shift[]>([])
  const [meterRecords, setMeterRecords] = useState<MeterRecord[]>([])
  const [dailyReports, setDailyReports] = useState<DailyReport[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('fuel-sales')

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const [fuelingsRes, shiftsRes, meterRes, reportsRes] = await Promise.all([
          fetch('/api/fuelings?limit=100'),
          fetch('/api/shifts'),
          fetch('/api/meter-records'),
          fetch('/api/daily-reports'),
        ])
        if (fuelingsRes.ok) {
          const data = await fuelingsRes.json()
          setFuelings(data.fuelings || [])
        }
        if (shiftsRes.ok) {
          const data = await shiftsRes.json()
          setShifts(data.shifts || [])
        }
        if (meterRes.ok) {
          const data = await meterRes.json()
          setMeterRecords(data.meterRecords || [])
        }
        if (reportsRes.ok) {
          const data = await reportsRes.json()
          setDailyReports(data.reports || [])
        }
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

  const totalRevenue = fuelings.reduce((sum, f) => sum + f.totalAmount, 0)
  const totalVolume = fuelings.reduce((sum, f) => sum + f.volume, 0)
  const currentShift = shifts.find((s) => s.status === 'open')

  // Payment breakdown for chart
  const paymentBreakdown: Record<string, number> = {}
  fuelings.forEach((f) => {
    paymentBreakdown[f.paymentMethod] = (paymentBreakdown[f.paymentMethod] || 0) + f.totalAmount
  })
  const paymentChartData = Object.entries(paymentBreakdown).map(([method, amount]) => ({
    name: method.charAt(0).toUpperCase() + method.slice(1),
    value: Math.round(amount),
  }))

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="fuel-sales">Fuel Sales</TabsTrigger>
          <TabsTrigger value="shifts">Shifts</TabsTrigger>
          <TabsTrigger value="meter-records">Meter Records</TabsTrigger>
          <TabsTrigger value="daily-reports">Daily Reports</TabsTrigger>
        </TabsList>

        {/* Fuel Sales */}
        <TabsContent value="fuel-sales" className="mt-4 space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Total Revenue</p>
                    <p className="text-xl font-bold">Rs. {Math.round(totalRevenue).toLocaleString()}</p>
                  </div>
                  <div className="flex size-10 items-center justify-center rounded-lg bg-amber-500/10">
                    <DollarSign className="size-5 text-amber-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Total Volume</p>
                    <p className="text-xl font-bold">{Math.round(totalVolume).toLocaleString()} L</p>
                  </div>
                  <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-500/10">
                    <Fuel className="size-5 text-emerald-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Transactions</p>
                    <p className="text-xl font-bold">{fuelings.length}</p>
                  </div>
                  <div className="flex size-10 items-center justify-center rounded-lg bg-blue-500/10">
                    <Receipt className="size-5 text-blue-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Avg. Ticket</p>
                    <p className="text-xl font-bold">
                      Rs. {fuelings.length > 0 ? Math.round(totalRevenue / fuelings.length).toLocaleString() : 0}
                    </p>
                  </div>
                  <div className="flex size-10 items-center justify-center rounded-lg bg-purple-500/10">
                    <TrendingUp className="size-5 text-purple-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Transaction Table */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Recent Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="max-h-96">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Time</TableHead>
                        <TableHead className="text-xs">Pump</TableHead>
                        <TableHead className="text-xs">Fuel</TableHead>
                        <TableHead className="text-xs text-right">Vol (L)</TableHead>
                        <TableHead className="text-xs text-right">Amount</TableHead>
                        <TableHead className="text-xs">Payment</TableHead>
                        <TableHead className="text-xs">Attendant</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fuelings.map((f) => (
                        <TableRow key={f.id}>
                          <TableCell className="text-xs font-mono">
                            {f.completedAt
                              ? new Date(f.completedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
                              : '--:--'}
                          </TableCell>
                          <TableCell className="text-xs">{f.dispenser?.name || 'N/A'}</TableCell>
                          <TableCell className="text-xs capitalize">{f.fuelType}</TableCell>
                          <TableCell className="text-xs text-right">{f.volume.toFixed(1)}</TableCell>
                          <TableCell className="text-xs text-right font-medium">
                            Rs. {Math.round(f.totalAmount).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 capitalize">
                              {f.paymentMethod}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs">{f.attendant?.name || 'N/A'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Payment Breakdown Chart */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Payment Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={paymentChartData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ name, percent }: { name: string; percent: number }) =>
                          `${name} ${(percent * 100).toFixed(0)}%`
                        }
                      >
                        {paymentChartData.map((entry, index) => (
                          <Cell key={index} fill={PAYMENT_COLORS[entry.name.toLowerCase()] || '#94a3b8'} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => [`Rs. ${value.toLocaleString()}`, 'Revenue']} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Shifts */}
        <TabsContent value="shifts" className="mt-4 space-y-4">
          {/* Current Shift Card */}
          {currentShift ? (
            <Card className="border-amber-200 dark:border-amber-900/50">
              <CardHeader className="pb-2 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="size-3 rounded-full bg-emerald-500 animate-pulse" />
                    <CardTitle className="text-sm font-semibold">Current Shift #{currentShift.shiftNumber}</CardTitle>
                  </div>
                  <Badge variant="outline" className="text-emerald-600 border-emerald-500/30 bg-emerald-500/10">
                    Open
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Attendant</p>
                    <p className="font-medium">{currentShift.attendant?.name || 'Unassigned'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Opened At</p>
                    <p className="font-medium">{new Date(currentShift.openedAt).toLocaleTimeString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total Sales</p>
                    <p className="font-bold text-amber-500">Rs. {Math.round(currentShift.totalSales).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Volume</p>
                    <p className="font-medium">{Math.round(currentShift.totalVolume).toLocaleString()} L</p>
                  </div>
                </div>
                <Separator className="my-3" />
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="gap-1 text-xs">
                    <Square className="size-3" /> Close Shift
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1 text-xs">
                    <Activity className="size-3" /> Reconcile
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-sm text-muted-foreground mb-2">No active shift</p>
                <Button size="sm" className="gap-1">
                  <Play className="size-3" /> Open New Shift
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Shift History */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Shift History</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="max-h-96">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Shift #</TableHead>
                      <TableHead className="text-xs">Attendant</TableHead>
                      <TableHead className="text-xs">Opened</TableHead>
                      <TableHead className="text-xs">Closed</TableHead>
                      <TableHead className="text-xs text-right">Sales</TableHead>
                      <TableHead className="text-xs text-right">Volume</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {shifts.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="text-xs font-medium">#{s.shiftNumber}</TableCell>
                        <TableCell className="text-xs">{s.attendant?.name || 'N/A'}</TableCell>
                        <TableCell className="text-xs font-mono">{new Date(s.openedAt).toLocaleString()}</TableCell>
                        <TableCell className="text-xs font-mono">
                          {s.closedAt ? new Date(s.closedAt).toLocaleString() : '-'}
                        </TableCell>
                        <TableCell className="text-xs text-right font-medium">
                          Rs. {Math.round(s.totalSales).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-xs text-right">{Math.round(s.totalVolume).toLocaleString()} L</TableCell>
                        <TableCell>
                          <Badge
                            variant={s.status === 'open' ? 'outline' : s.status === 'reconciled' ? 'outline' : 'secondary'}
                            className="text-[10px] px-1.5 py-0 capitalize"
                          >
                            {s.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Meter Records */}
        <TabsContent value="meter-records" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Nozzle Meter Readings</CardTitle>
              <CardDescription className="text-xs">{meterRecords.length} records</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="max-h-96">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Pump</TableHead>
                      <TableHead className="text-xs">Nozzle</TableHead>
                      <TableHead className="text-xs">Fuel Type</TableHead>
                      <TableHead className="text-xs text-right">Start Reading</TableHead>
                      <TableHead className="text-xs text-right">End Reading</TableHead>
                      <TableHead className="text-xs text-right">Volume</TableHead>
                      <TableHead className="text-xs">Recorded</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {meterRecords.map((mr) => (
                      <TableRow key={mr.id}>
                        <TableCell className="text-xs">{mr.nozzle?.dispenser?.name || 'N/A'}</TableCell>
                        <TableCell className="text-xs">N{mr.nozzle?.nozzleNumber}</TableCell>
                        <TableCell className="text-xs capitalize">{mr.nozzle?.fuelType}</TableCell>
                        <TableCell className="text-xs text-right font-mono">{mr.readingStart.toLocaleString()}</TableCell>
                        <TableCell className="text-xs text-right font-mono">{mr.readingEnd?.toLocaleString() || '-'}</TableCell>
                        <TableCell className="text-xs text-right font-medium">
                          {mr.volumeDispensed?.toLocaleString() || '-'} L
                        </TableCell>
                        <TableCell className="text-xs font-mono">{new Date(mr.recordedAt).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Daily Reports */}
        <TabsContent value="daily-reports" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Daily Reports (Last 30 Days)</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="max-h-96">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Date</TableHead>
                      <TableHead className="text-xs text-right">Revenue</TableHead>
                      <TableHead className="text-xs text-right">Fuel Rev.</TableHead>
                      <TableHead className="text-xs text-right">Volume</TableHead>
                      <TableHead className="text-xs text-right">Transactions</TableHead>
                      <TableHead className="text-xs text-right">Expenses</TableHead>
                      <TableHead className="text-xs text-right">Net Profit</TableHead>
                      <TableHead className="text-xs text-right">Variance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dailyReports.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-xs text-muted-foreground py-8">
                          No daily reports available
                        </TableCell>
                      </TableRow>
                    ) : (
                      dailyReports.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell className="text-xs font-mono">{new Date(r.reportDate).toLocaleDateString()}</TableCell>
                          <TableCell className="text-xs text-right font-medium">Rs. {Math.round(r.totalRevenue).toLocaleString()}</TableCell>
                          <TableCell className="text-xs text-right">Rs. {Math.round(r.fuelRevenue).toLocaleString()}</TableCell>
                          <TableCell className="text-xs text-right">{Math.round(r.totalVolume).toLocaleString()} L</TableCell>
                          <TableCell className="text-xs text-right">{r.transactionCount}</TableCell>
                          <TableCell className="text-xs text-right">Rs. {Math.round(r.expenses).toLocaleString()}</TableCell>
                          <TableCell className="text-xs text-right font-medium text-emerald-600">Rs. {Math.round(r.netProfit).toLocaleString()}</TableCell>
                          <TableCell className="text-xs text-right">
                            <span className={Math.abs(r.fuelVariance) > 0.5 ? 'text-red-500' : 'text-emerald-500'}>
                              {r.fuelVariance.toFixed(2)}%
                            </span>
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
      </Tabs>
    </div>
  )
}
