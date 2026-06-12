'use client'

import { useState, useEffect } from 'react'
import {
  DollarSign,
  Fuel,
  Activity,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CreditCard,
  Banknote,
  Truck,
  Cpu,
  Play,
  OctagonX,
  RefreshCw,
  Bell,
  CheckCircle2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

interface DashboardData {
  kpis: {
    revenue: { today: number; week: number; month: number; currency: string }
    fuelSold: { value: number; unit: string }
    activePumps: { value: number; total: number }
    alerts: { value: number; critical: number; warning: number }
    netProfit: { value: number; currency: string }
  }
  tankLevels: Array<{
    id: string
    product: string
    level: number
    capacity: number
    currentLitres: number
    status: string
    temperature?: number
    waterLevel?: number
  }>
  recentTransactions: Array<{
    id: string
    time: string
    pump: string | number
    product: string
    litres: number
    amount: number
    payment: string
    attendant?: string
    customer?: string | null
    loyaltyPoints?: number
  }>
  revenueChart: Array<{ hour: string; value: number }>
  stationInfo: {
    name: string
    code?: string
    status: string
    shift: string
    attendant: string
    supervisor?: string
  }
  fuelBreakdown: Array<{ type: string; volume: number; revenue: number }>
  shiftInfo: {
    id?: string
    name: string
    attendant: string
    supervisor?: string
    openedAt: string
    sales: number
    fuelSales?: number
    retailSales?: number
    cardSales?: number
    fleetSales?: number
    cashSales?: number
    transactionCount?: number
  } | null
  allStations?: Array<{ id: string; name: string; code: string; city: string; stationType: string }>
  notifications?: Array<{ id: string; title: string; message: string; type: string; priority: string; createdAt: string; isRead: boolean }>
  environmentalAlertsCount?: number
  carWash?: { sessionsToday: number; revenue: number }
  lottery?: { salesToday: number; revenue: number; commission: number }
  supplierInvoicesPending?: number
  fleetSummary?: {
    totalAccounts: number
    totalOutstanding: number
    totalVehicles: number
    totalDrivers: number
    totalFuelCards: number
    accounts: Array<{ id: string; companyName: string; balance: number; creditLimit: number; vehicles: number; drivers: number; fuelCards: number }>
  }
  dailyReport?: unknown
  topSellingProducts?: Array<{ id: string; name: string; category: string; price: number; stockQty: number; minStock: number }>
  employeeOnDuty?: number
}

const PIE_COLORS = ['#f59e0b', '#10b981', '#ef4444', '#6366f1', '#8b5cf6']

function KPICard({
  title,
  value,
  change,
  icon: Icon,
  prefix = '',
  suffix = '',
}: {
  title: string
  value: string | number
  change?: number
  icon: React.ElementType
  prefix?: string
  suffix?: string
}) {
  const isPositive = change !== undefined && change >= 0
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-medium">{title}</p>
            <p className="text-xl font-bold">
              {prefix}
              {typeof value === 'number' ? value.toLocaleString() : value}
              {suffix}
            </p>
          </div>
          <div className="flex size-10 items-center justify-center rounded-lg bg-amber-500/10">
            <Icon className="size-5 text-amber-500" />
          </div>
        </div>
        {change !== undefined && (
          <div className="mt-2 flex items-center gap-1 text-xs">
            {isPositive ? (
              <ArrowUpRight className="size-3 text-emerald-500" />
            ) : (
              <ArrowDownRight className="size-3 text-red-500" />
            )}
            <span className={isPositive ? 'text-emerald-500' : 'text-red-500'}>
              {Math.abs(change)}%
            </span>
            <span className="text-muted-foreground">vs yesterday</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-32 mb-2" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card><CardContent className="p-4"><Skeleton className="h-64 w-full" /></CardContent></Card>
        <Card><CardContent className="p-4"><Skeleton className="h-64 w-full" /></CardContent></Card>
      </div>
    </div>
  )
}

export default function DashboardOverview() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notifications, setNotifications] = useState<Array<{
    id: string; title: string; message: string; type: string; priority: string; createdAt: string; isRead: boolean
  }>>([])

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const [dashRes, notifRes] = await Promise.all([
          fetch('/api/dashboard'),
          fetch('/api/notifications'),
        ])
        if (!dashRes.ok) throw new Error('Failed to load dashboard')
        const dashData = await dashRes.json()
        setData(dashData)
        if (notifRes.ok) {
          const notifData = await notifRes.json()
          setNotifications(notifData.notifications || [])
        }
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
          <Button variant="outline" size="sm" className="mt-2" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }
  if (!data) return null

  const revenueChange = data.kpis.revenue.week > 0
    ? Math.round(((data.kpis.revenue.today - data.kpis.revenue.week / 7) / (data.kpis.revenue.week / 7)) * 100) / 10
    : 0
  const netProfitValue = data.kpis.netProfit?.value ?? Math.round(data.kpis.revenue.today * 0.12)
  const netProfitChange = netProfitValue >= 0 ? 5.2 : -5.2

  const kpiExtra = [
    {
      title: 'Net Profit',
      value: Math.abs(netProfitValue).toLocaleString(),
      change: netProfitChange,
      icon: netProfitValue >= 0 ? TrendingUp : TrendingDown,
      prefix: 'Rs. ',
    },
    {
      title: 'Transactions',
      value: data.recentTransactions.length,
      change: 3.1,
      icon: CreditCard,
    },
  ]

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KPICard
          title="Revenue"
          value={data.kpis.revenue.today.toLocaleString()}
          change={revenueChange}
          icon={DollarSign}
          prefix="Rs. "
        />
        <KPICard
          title="Fuel Sold"
          value={data.kpis.fuelSold.value.toLocaleString()}
          icon={Fuel}
          suffix=" L"
        />
        <KPICard
          title="Active Pumps"
          value={`${data.kpis.activePumps.value}/${data.kpis.activePumps.total}`}
          icon={Activity}
        />
        <KPICard
          title="Alerts"
          value={data.kpis.alerts.value}
          icon={AlertTriangle}
        />
        <KPICard {...kpiExtra[0]} />
        <KPICard {...kpiExtra[1]} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Hourly Revenue Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Hourly Revenue</CardTitle>
            <CardDescription className="text-xs">Today&apos;s revenue by hour</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.revenueChart}>
                  <XAxis dataKey="hour" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    formatter={(value: number) => [`Rs. ${value.toLocaleString()}`, 'Revenue']}
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  />
                  <Bar dataKey="value" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Fuel Breakdown Pie Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Fuel Sales Breakdown</CardTitle>
            <CardDescription className="text-xs">Volume by fuel type</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.fuelBreakdown}
                    dataKey="volume"
                    nameKey="type"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={({ type, percent }: { type: string; percent: number }) =>
                      `${type} ${(percent * 100).toFixed(0)}%`
                    }
                    labelLine={{ stroke: '#94a3b8' }}
                  >
                    {data.fuelBreakdown.map((_, index) => (
                      <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [`${value.toLocaleString()} L`, 'Volume']}
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tank Levels + Station Status + Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Tank Levels */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Tank Levels</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.tankLevels.map((tank) => (
              <div key={tank.id} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium">{tank.product}</span>
                  <span className="text-muted-foreground">
                    {tank.currentLitres.toLocaleString()} / {tank.capacity.toLocaleString()} L
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      tank.status === 'critical'
                        ? 'bg-red-500'
                        : tank.status === 'warning'
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(tank.level, 100)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">{tank.level}%</span>
                  <Badge
                    variant={tank.status === 'critical' ? 'destructive' : tank.status === 'warning' ? 'secondary' : 'outline'}
                    className="text-[9px] px-1.5 py-0"
                  >
                    {tank.status}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Station Status */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Station Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="size-3 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm font-medium capitalize">{data.stationInfo.status}</span>
            </div>
            <Separator />
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Station</span>
                <span className="font-medium">{data.stationInfo.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shift</span>
                <span className="font-medium">{data.stationInfo.shift}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Attendant</span>
                <span className="font-medium">{data.stationInfo.attendant}</span>
              </div>
              {data.shiftInfo && (
                <>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shift Sales</span>
                    <span className="font-bold text-amber-500">Rs. {data.shiftInfo.sales.toLocaleString()}</span>
                  </div>
                </>
              )}
            </div>
            {/* Quick Actions */}
            <Separator />
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground">Quick Actions</p>
              <div className="grid grid-cols-1 gap-2">
                <Button size="sm" variant="outline" className="justify-start gap-2 text-xs h-8">
                  <Play className="size-3 text-emerald-500" />
                  Open Shift
                </Button>
                <Button size="sm" variant="outline" className="justify-start gap-2 text-xs h-8">
                  <OctagonX className="size-3 text-red-500" />
                  Emergency Stop
                </Button>
                <Button size="sm" variant="outline" className="justify-start gap-2 text-xs h-8">
                  <RefreshCw className="size-3 text-amber-500" />
                  Update Prices
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Notifications</CardTitle>
              <Bell className="size-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <CheckCircle2 className="size-8 mb-2 opacity-50" />
                  <p className="text-xs">No notifications</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {notifications.slice(0, 5).map((notif) => (
                    <div
                      key={notif.id}
                      className={`rounded-lg border p-3 text-xs transition-colors ${
                        notif.isRead ? 'bg-background' : 'bg-amber-500/5 border-amber-500/20'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-medium">{notif.title}</span>
                        <Badge
                          variant={
                            notif.priority === 'urgent'
                              ? 'destructive'
                              : notif.priority === 'high'
                                ? 'secondary'
                                : 'outline'
                          }
                          className="text-[9px] px-1.5 py-0 shrink-0"
                        >
                          {notif.priority}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground mt-1 line-clamp-2">{notif.message}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {new Date(notif.createdAt).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="max-h-72">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Time</TableHead>
                  <TableHead className="text-xs">Pump</TableHead>
                  <TableHead className="text-xs">Product</TableHead>
                  <TableHead className="text-xs text-right">Litres</TableHead>
                  <TableHead className="text-xs text-right">Amount</TableHead>
                  <TableHead className="text-xs">Payment</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recentTransactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="text-xs font-mono">{tx.time}</TableCell>
                    <TableCell className="text-xs">{tx.pump}</TableCell>
                    <TableCell className="text-xs">{tx.product}</TableCell>
                    <TableCell className="text-xs text-right">{tx.litres}</TableCell>
                    <TableCell className="text-xs text-right font-medium">
                      Rs. {tx.amount.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-xs">
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        {tx.payment}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
