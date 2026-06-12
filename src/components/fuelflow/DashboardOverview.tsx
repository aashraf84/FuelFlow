'use client'

import { useState, useEffect } from 'react'
import {
  DollarSign,
  Fuel,
  Activity,
  AlertTriangle,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CreditCard,
  Banknote,
  Truck,
  Cpu,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

interface DashboardData {
  kpis: {
    revenue: { value: number; change: number; period: string }
    fuelSold: { value: number; unit: string; change: number; period: string }
    activePumps: { value: number; total: number; change: number; period: string }
    alerts: { value: number; critical: number; warning: number; change: number; period: string }
  }
  tankLevels: Array<{
    id: number
    product: string
    level: number
    capacity: number
    currentLitres: number
    status: string
  }>
  recentTransactions: Array<{
    id: string
    time: string
    pump: number | string
    product: string
    litres: number
    amount: number
    payment: string
  }>
  revenueChart: Array<{ hour: string; value: number }>
  stationInfo: {
    name: string
    status: string
    shift: string
    attendant: string
  }
  fuelBreakdown: Array<{ type: string; volume: number; revenue: number }>
}

const PIE_COLORS = ['#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899']

function KPICard({
  title,
  value,
  change,
  icon: Icon,
  prefix = '',
  suffix = '',
  loading,
  extra,
}: {
  title: string
  value: string | number
  change: number
  icon: React.ElementType
  prefix?: string
  suffix?: string
  loading: boolean
  extra?: React.ReactNode
}) {
  const isPositive = change >= 0
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-6">
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              <div className="flex size-9 items-center justify-center rounded-lg bg-amber-500/10">
                <Icon className="size-4 text-amber-500" />
              </div>
            </div>
            <div className="mt-2">
              <p className="text-2xl font-bold tracking-tight">
                {prefix}
                {typeof value === 'number' ? value.toLocaleString() : value}
                {suffix}
              </p>
            </div>
            <div className="mt-1 flex items-center gap-1 text-xs">
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
            {extra}
          </>
        )}
      </CardContent>
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
    </Card>
  )
}

function TankLevelBar({
  product,
  level,
  currentLitres,
  capacity,
  status,
}: {
  product: string
  level: number
  currentLitres: number
  capacity: number
  status: string
}) {
  const statusBadge =
    status === 'critical'
      ? 'destructive'
      : status === 'warning'
        ? 'secondary'
        : 'outline'

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{product}</span>
        <Badge variant={statusBadge as 'destructive' | 'secondary' | 'outline'} className="text-xs">
          {status === 'critical' ? 'Low Stock' : status === 'warning' ? 'Reorder Soon' : 'Normal'}
        </Badge>
      </div>
      <div className="flex items-center gap-3">
        <Progress value={level} className="h-2 flex-1" />
        <span className="text-xs font-medium text-muted-foreground w-10 text-right">{level}%</span>
      </div>
      <p className="text-xs text-muted-foreground">
        {currentLitres.toLocaleString()} / {capacity.toLocaleString()} litres
      </p>
    </div>
  )
}

function PaymentIcon({ method }: { method: string }) {
  switch (method) {
    case 'Card':
      return <CreditCard className="size-3.5 text-blue-500" />
    case 'Cash':
      return <Banknote className="size-3.5 text-emerald-500" />
    case 'Fleet':
      return <Truck className="size-3.5 text-purple-500" />
    case 'RFID':
      return <Cpu className="size-3.5 text-amber-500" />
    default:
      return <CreditCard className="size-3.5" />
  }
}

export default function DashboardOverview() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/dashboard')
        if (!res.ok) throw new Error('Failed to fetch')
        const json = await res.json()
        setData(json)
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err)
        setError('Failed to load dashboard data')
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
            <p className="text-xs text-muted-foreground mt-1">Please try refreshing the page</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="module-enter space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Revenue"
          value={data?.kpis.revenue.value ?? 0}
          change={data?.kpis.revenue.change ?? 0}
          icon={DollarSign}
          prefix="Rs. "
          loading={loading}
        />
        <KPICard
          title="Fuel Sold"
          value={data?.kpis.fuelSold.value ?? 0}
          change={data?.kpis.fuelSold.change ?? 0}
          icon={Fuel}
          suffix=" L"
          loading={loading}
        />
        <KPICard
          title="Active Pumps"
          value={`${data?.kpis.activePumps.value ?? 0}/${data?.kpis.activePumps.total ?? 0}`}
          change={data?.kpis.activePumps.change ?? 0}
          icon={Activity}
          loading={loading}
        />
        <KPICard
          title="Active Alerts"
          value={data?.kpis.alerts.value ?? 0}
          change={data?.kpis.alerts.change ?? 0}
          icon={AlertTriangle}
          loading={loading}
          extra={
            data ? (
              <div className="mt-1 flex gap-2 text-xs">
                <span className="text-red-500">{data.kpis.alerts.critical} critical</span>
                <span className="text-amber-500">{data.kpis.alerts.warning} warning</span>
              </div>
            ) : undefined
          }
        />
      </div>

      {/* Revenue Chart + Tank Levels */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="size-5 text-amber-500" />
              Hourly Revenue
            </CardTitle>
            <CardDescription>Today&apos;s revenue breakdown by hour (PKR)</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex h-48 items-end gap-2">
                {Array.from({ length: 9 }).map((_, i) => (
                  <Skeleton key={i} className="flex-1 rounded-t" style={{ height: `${30 + Math.random() * 70}%` }} />
                ))}
              </div>
            ) : (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.revenueChart ?? []} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                    <XAxis dataKey="hour" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <Tooltip
                      formatter={(value: number) => [`Rs. ${value.toLocaleString()}`, 'Revenue']}
                      contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                    />
                    <Bar dataKey="value" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tank Levels */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Fuel className="size-5 text-amber-500" />
              Tank Levels
            </CardTitle>
            <CardDescription>Current wet stock inventory</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-2 w-full" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                ))
              : data?.tankLevels.map((tank) => (
                  <TankLevelBar
                    key={tank.id}
                    product={tank.product}
                    level={tank.level}
                    currentLitres={tank.currentLitres}
                    capacity={tank.capacity}
                    status={tank.status}
                  />
                ))}
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions + Station Info + Fuel Breakdown */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Recent Transactions */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="size-5 text-amber-500" />
              Recent Transactions
            </CardTitle>
            <CardDescription>Latest fuel sales activity</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="size-8 rounded-full" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="max-h-72 overflow-y-auto space-y-1">
                <div className="grid grid-cols-[auto_1fr_auto_auto] gap-x-4 gap-y-2 text-xs font-medium text-muted-foreground pb-2 border-b">
                  <span className="w-14">Time</span>
                  <span>Details</span>
                  <span className="w-16 text-right">Litres</span>
                  <span className="w-24 text-right">Amount</span>
                </div>
                {data?.recentTransactions.map((txn) => (
                  <div
                    key={txn.id}
                    className="grid grid-cols-[auto_1fr_auto_auto] gap-x-4 items-center py-2 text-sm border-b border-border/50 last:border-0 hover:bg-muted/50 rounded px-1 transition-colors"
                  >
                    <span className="w-14 text-xs text-muted-foreground">{txn.time}</span>
                    <div className="flex items-center gap-2">
                      <PaymentIcon method={txn.payment} />
                      <div>
                        <p className="font-medium text-sm">
                          Pump {txn.pump} - {txn.product}
                        </p>
                        <p className="text-xs text-muted-foreground">{txn.payment}</p>
                      </div>
                    </div>
                    <span className="w-16 text-right text-xs text-muted-foreground">{txn.litres}L</span>
                    <span className="w-24 text-right font-medium">Rs. {txn.amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Station Info + Fuel Breakdown */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="size-5 text-amber-500" />
                Station Status
              </CardTitle>
              <CardDescription>Current operational details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : (
                <>
                  <div className="rounded-lg bg-amber-500/10 p-3 space-y-1">
                    <p className="text-xs font-medium text-amber-600 dark:text-amber-400">Station</p>
                    <p className="text-sm font-semibold">{data?.stationInfo.name}</p>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Status</span>
                      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:text-emerald-400 dark:border-emerald-800">
                        {data?.stationInfo.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Current Shift</span>
                      <span className="text-sm font-medium">{data?.stationInfo.shift}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Attendant</span>
                      <span className="text-sm font-medium">{data?.stationInfo.attendant}</span>
                    </div>
                  </div>
                  <div className="pt-2 border-t">
                    <div className="flex items-center gap-2">
                      <div className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-xs text-muted-foreground">All systems operational</span>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Fuel Breakdown Pie Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Fuel className="size-4 text-amber-500" />
                Fuel Sales Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-40">
                  <Skeleton className="size-32 rounded-full" />
                </div>
              ) : data?.fuelBreakdown && data.fuelBreakdown.length > 0 ? (
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.fuelBreakdown}
                        dataKey="revenue"
                        nameKey="type"
                        cx="50%"
                        cy="50%"
                        outerRadius={60}
                        innerRadius={30}
                        paddingAngle={2}
                      >
                        {data.fuelBreakdown.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => [`Rs. ${value.toLocaleString()}`, 'Revenue']}
                        contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex items-center justify-center h-40 text-sm text-muted-foreground">
                  No fuel breakdown data
                </div>
              )}
              {data?.fuelBreakdown && data.fuelBreakdown.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {data.fuelBreakdown.map((item, idx) => (
                    <div key={item.type} className="flex items-center gap-1.5 text-xs">
                      <div className="size-2.5 rounded-full" style={{ background: PIE_COLORS[idx % PIE_COLORS.length] }} />
                      <span className="text-muted-foreground">{item.type}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
