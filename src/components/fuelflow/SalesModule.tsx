'use client'

import { useState, useEffect } from 'react'
import {
  Receipt,
  Clock,
  CreditCard,
  Banknote,
  Truck,
  Cpu,
  AlertTriangle,
  TrendingUp,
  Fuel,
  User,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'

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
  openedAt: string
  closedAt: string | null
  openingCash: number
  closingCash: number | null
  expectedCash: number | null
  cashVariance: number | null
  totalSales: number
  totalVolume: number
  fuelSales: number
  retailSales: number
  status: string
  attendant: { id: string; name: string; role: string } | null
  _count: { fuelings: number; retailTransactions: number }
}

function PaymentIcon({ method }: { method: string }) {
  switch (method) {
    case 'card': return <CreditCard className="size-3.5 text-blue-500" />
    case 'cash': return <Banknote className="size-3.5 text-emerald-500" />
    case 'fleet': return <Truck className="size-3.5 text-purple-500" />
    case 'rfid': return <Cpu className="size-3.5 text-amber-500" />
    case 'mobile': return <Cpu className="size-3.5 text-cyan-500" />
    default: return <CreditCard className="size-3.5" />
  }
}

function formatPaymentMethod(method: string): string {
  const map: Record<string, string> = {
    cash: 'Cash',
    card: 'Card',
    fleet: 'Fleet',
    rfid: 'RFID',
    mobile: 'Mobile',
    credit: 'Credit',
  }
  return map[method] || method
}

export default function SalesModule() {
  const [fuelings, setFuelings] = useState<Fueling[]>([])
  const [shifts, setShifts] = useState<Shift[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const [fuelingsRes, shiftsRes] = await Promise.all([
          fetch('/api/fuelings?limit=50'),
          fetch('/api/shifts'),
        ])
        if (!fuelingsRes.ok || !shiftsRes.ok) throw new Error('Failed to fetch')
        const fuelingsJson = await fuelingsRes.json()
        const shiftsJson = await shiftsRes.json()
        setFuelings(fuelingsJson.fuelings || [])
        setShifts(shiftsJson.shifts || [])
      } catch (err) {
        console.error('Failed to fetch sales data:', err)
        setError('Failed to load sales data')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Compute summary for today
  const todayFuelings = fuelings.filter(f => {
    if (!f.completedAt) return false
    const d = new Date(f.completedAt)
    const now = new Date()
    return d.toDateString() === now.toDateString() && f.status === 'completed'
  })

  const todayRevenue = todayFuelings.reduce((s, f) => s + f.totalAmount, 0)
  const todayVolume = todayFuelings.reduce((s, f) => s + f.volume, 0)
  const todayCount = todayFuelings.length

  // Payment method breakdown
  const paymentBreakdown: Record<string, { count: number; amount: number }> = {}
  for (const f of todayFuelings) {
    const m = f.paymentMethod
    if (!paymentBreakdown[m]) paymentBreakdown[m] = { count: 0, amount: 0 }
    paymentBreakdown[m].count++
    paymentBreakdown[m].amount += f.totalAmount
  }

  const currentShift = shifts.find(s => s.status === 'open')

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
          <Receipt className="size-5 text-amber-500" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Fuel Sales & Shifts</h2>
          <p className="text-sm text-muted-foreground">
            Shift management, transaction processing, and sales reporting
          </p>
        </div>
      </div>

      <Tabs defaultValue="fuel-sales">
        <TabsList>
          <TabsTrigger value="fuel-sales">Fuel Sales</TabsTrigger>
          <TabsTrigger value="shifts">Shifts</TabsTrigger>
        </TabsList>

        <TabsContent value="fuel-sales" className="space-y-4 mt-4">
          {/* Summary cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="p-4">
                {loading ? <Skeleton className="h-16 w-full" /> : (
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-amber-500/10">
                      <TrendingUp className="size-5 text-amber-500" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Today&apos;s Revenue</p>
                      <p className="text-lg font-bold">Rs. {Math.round(todayRevenue).toLocaleString()}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                {loading ? <Skeleton className="h-16 w-full" /> : (
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-500/10">
                      <Fuel className="size-5 text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Today&apos;s Volume</p>
                      <p className="text-lg font-bold">{Math.round(todayVolume).toLocaleString()} L</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                {loading ? <Skeleton className="h-16 w-full" /> : (
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-blue-500/10">
                      <Receipt className="size-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Transactions</p>
                      <p className="text-lg font-bold">{todayCount}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Payment method breakdown */}
          {!loading && Object.keys(paymentBreakdown).length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Payment Method Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  {Object.entries(paymentBreakdown).map(([method, data]) => (
                    <div key={method} className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
                      <PaymentIcon method={method} />
                      <div>
                        <p className="text-xs font-medium">{formatPaymentMethod(method)}</p>
                        <p className="text-[10px] text-muted-foreground">{data.count} txn · Rs. {Math.round(data.amount).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Transaction table */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Recent Fuel Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : (
                <div className="max-h-96 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Time</TableHead>
                        <TableHead className="text-xs">Pump</TableHead>
                        <TableHead className="text-xs">Nozzle</TableHead>
                        <TableHead className="text-xs">Fuel Type</TableHead>
                        <TableHead className="text-xs text-right">Volume (L)</TableHead>
                        <TableHead className="text-xs text-right">Rate</TableHead>
                        <TableHead className="text-xs text-right">Amount</TableHead>
                        <TableHead className="text-xs">Payment</TableHead>
                        <TableHead className="text-xs">Attendant</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fuelings.map((f) => (
                        <TableRow key={f.id}>
                          <TableCell className="text-xs">
                            {f.completedAt
                              ? new Date(f.completedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
                              : '--:--'}
                          </TableCell>
                          <TableCell className="text-xs font-medium">{f.dispenser?.name || 'N/A'}</TableCell>
                          <TableCell className="text-xs">N{f.nozzle?.nozzleNumber || '?'}</TableCell>
                          <TableCell className="text-xs capitalize">{f.fuelType}</TableCell>
                          <TableCell className="text-xs text-right">{f.volume.toFixed(1)}</TableCell>
                          <TableCell className="text-xs text-right">Rs. {f.pricePerUnit.toFixed(2)}</TableCell>
                          <TableCell className="text-xs text-right font-medium">Rs. {Math.round(f.totalAmount).toLocaleString()}</TableCell>
                          <TableCell className="text-xs">
                            <div className="flex items-center gap-1">
                              <PaymentIcon method={f.paymentMethod} />
                              <span>{formatPaymentMethod(f.paymentMethod)}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs">{f.attendant?.name || 'N/A'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shifts" className="space-y-4 mt-4">
          {/* Current shift */}
          <Card className="border-amber-500/20 bg-amber-500/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="size-4 text-amber-500" />
                Current Shift
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-20 w-full" />
              ) : currentShift ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Shift</p>
                    <p className="text-sm font-bold">Shift #{currentShift.shiftNumber}</p>
                    <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-200 mt-1">Open</Badge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Attendant</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <User className="size-3 text-amber-500" />
                      <p className="text-sm font-medium">{currentShift.attendant?.name || 'Unassigned'}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Sales</p>
                    <p className="text-sm font-bold">Rs. {Math.round(currentShift.totalSales).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Volume</p>
                    <p className="text-sm font-bold">{Math.round(currentShift.totalVolume).toLocaleString()} L</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No active shift</p>
              )}
            </CardContent>
          </Card>

          {/* Shift history */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Shift History</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : (
                <div className="max-h-96 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Shift</TableHead>
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
                          <TableCell className="text-xs">{s.attendant?.name || 'Unassigned'}</TableCell>
                          <TableCell className="text-xs">
                            {new Date(s.openedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                          </TableCell>
                          <TableCell className="text-xs">
                            {s.closedAt
                              ? new Date(s.closedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
                              : '-'}
                          </TableCell>
                          <TableCell className="text-xs text-right font-medium">Rs. {Math.round(s.totalSales).toLocaleString()}</TableCell>
                          <TableCell className="text-xs text-right">{Math.round(s.totalVolume).toLocaleString()} L</TableCell>
                          <TableCell className="text-xs">
                            <Badge
                              variant={s.status === 'open' ? 'outline' : 'secondary'}
                              className={`text-[10px] ${s.status === 'open' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-200' : ''}`}
                            >
                              {s.status.charAt(0).toUpperCase() + s.status.slice(1)}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
