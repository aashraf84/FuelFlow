'use client'

import { useState, useEffect } from 'react'
import {
  Wallet,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

interface FinanceData {
  period: string
  startDate: string
  summary: {
    totalIncome: number
    totalExpenses: number
    profit: number
    totalFuelRevenue: number
    profitMargin: number
  }
  incomeByCategory: Record<string, number>
  expenseByCategory: Record<string, number>
  fuelRevenueByType: Record<string, number>
  transactionCount: number
  expenseCount: number
}

const PERIODS = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'year', label: 'Year' },
]

export default function FinanceModule() {
  const [data, setData] = useState<FinanceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('today')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const res = await fetch(`/api/finance?period=${period}`)
        if (!res.ok) throw new Error('Failed to fetch')
        const json = await res.json()
        setData(json)
      } catch (err) {
        console.error('Failed to fetch finance data:', err)
        setError('Failed to load financial data')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [period])

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

  const summary = data?.summary

  // Prepare chart data
  const categoryData = data ? [
    ...Object.entries(data.incomeByCategory).map(([cat, amount]) => ({
      category: cat.replace(/_/g, ' '),
      amount: Math.round(amount),
      type: 'income',
    })),
    ...Object.entries(data.expenseByCategory).map(([cat, amount]) => ({
      category: cat.replace(/_/g, ' '),
      amount: Math.round(amount),
      type: 'expense',
    })),
  ] : []

  const fuelRevenueData = data ? Object.entries(data.fuelRevenueByType).map(([type, amount]) => ({
    type: type.charAt(0).toUpperCase() + type.slice(1),
    revenue: Math.round(amount),
  })) : []

  return (
    <div className="module-enter space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-amber-500/10">
            <Wallet className="size-5 text-amber-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Finance & Accounting</h2>
            <p className="text-sm text-muted-foreground">
              Revenue analytics, expense tracking, and financial reporting
            </p>
          </div>
        </div>
        <div className="flex gap-1">
          {PERIODS.map(p => (
            <Button
              key={p.value}
              variant={period === p.value ? 'default' : 'outline'}
              size="sm"
              className={`h-7 text-xs ${period === p.value ? 'bg-amber-500 hover:bg-amber-600' : ''}`}
              onClick={() => setPeriod(p.value)}
            >
              {p.label}
            </Button>
          ))}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden">
          <CardContent className="p-4">
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-7 w-28" />
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">Income</p>
                  <div className="flex size-7 items-center justify-center rounded bg-emerald-500/10">
                    <TrendingUp className="size-3.5 text-emerald-500" />
                  </div>
                </div>
                <p className="text-xl font-bold mt-1">Rs. {(summary?.totalIncome ?? 0).toLocaleString()}</p>
                <div className="flex items-center gap-1 text-[10px] text-emerald-500 mt-0.5">
                  <ArrowUpRight className="size-2.5" />
                  <span>{data?.transactionCount ?? 0} transactions</span>
                </div>
              </>
            )}
          </CardContent>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500" />
        </Card>

        <Card className="relative overflow-hidden">
          <CardContent className="p-4">
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-7 w-28" />
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">Expenses</p>
                  <div className="flex size-7 items-center justify-center rounded bg-red-500/10">
                    <TrendingDown className="size-3.5 text-red-500" />
                  </div>
                </div>
                <p className="text-xl font-bold mt-1">Rs. {(summary?.totalExpenses ?? 0).toLocaleString()}</p>
                <div className="flex items-center gap-1 text-[10px] text-red-500 mt-0.5">
                  <ArrowDownRight className="size-2.5" />
                  <span>{data?.expenseCount ?? 0} expenses</span>
                </div>
              </>
            )}
          </CardContent>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-red-500" />
        </Card>

        <Card className="relative overflow-hidden">
          <CardContent className="p-4">
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-7 w-28" />
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">Profit</p>
                  <div className="flex size-7 items-center justify-center rounded bg-amber-500/10">
                    <DollarSign className="size-3.5 text-amber-500" />
                  </div>
                </div>
                <p className={`text-xl font-bold mt-1 ${(summary?.profit ?? 0) >= 0 ? '' : 'text-red-500'}`}>
                  Rs. {(summary?.profit ?? 0).toLocaleString()}
                </p>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
                  <span>Fuel revenue: Rs. {(summary?.totalFuelRevenue ?? 0).toLocaleString()}</span>
                </div>
              </>
            )}
          </CardContent>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500" />
        </Card>

        <Card className="relative overflow-hidden">
          <CardContent className="p-4">
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-7 w-28" />
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">Margin</p>
                  <div className="flex size-7 items-center justify-center rounded bg-amber-500/10">
                    <Wallet className="size-3.5 text-amber-500" />
                  </div>
                </div>
                <p className="text-xl font-bold mt-1">{summary?.profitMargin ?? 0}%</p>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
                  <span>Profit margin</span>
                </div>
              </>
            )}
          </CardContent>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Income vs Expense by category */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Breakdown by Category</CardTitle>
            <CardDescription>Income and expense distribution</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-48 w-full" />
            ) : categoryData.length > 0 ? (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                    <XAxis dataKey="category" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                    <Tooltip
                      formatter={(value: number) => [`Rs. ${value.toLocaleString()}`, '']}
                      contentStyle={{ borderRadius: '8px', fontSize: '11px' }}
                    />
                    <Bar dataKey="amount" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">
                No category data for this period
              </div>
            )}
          </CardContent>
        </Card>

        {/* Fuel revenue by type */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Fuel Revenue by Type</CardTitle>
            <CardDescription>Revenue breakdown per fuel product</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-48 w-full" />
            ) : fuelRevenueData.length > 0 ? (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={fuelRevenueData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                    <XAxis dataKey="type" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                    <Tooltip
                      formatter={(value: number) => [`Rs. ${value.toLocaleString()}`, 'Revenue']}
                      contentStyle={{ borderRadius: '8px', fontSize: '11px' }}
                    />
                    <Bar dataKey="revenue" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">
                No fuel revenue data for this period
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Category details */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-emerald-600">Income Categories</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-6 w-full" />)}</div>
            ) : data?.incomeByCategory && Object.keys(data.incomeByCategory).length > 0 ? (
              <div className="space-y-2">
                {Object.entries(data.incomeByCategory).map(([cat, amount]) => (
                  <div key={cat} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                    <span className="text-xs capitalize">{cat.replace(/_/g, ' ')}</span>
                    <span className="text-xs font-medium text-emerald-600">Rs. {Math.round(amount).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-4">No income data</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-red-600">Expense Categories</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-6 w-full" />)}</div>
            ) : data?.expenseByCategory && Object.keys(data.expenseByCategory).length > 0 ? (
              <div className="space-y-2">
                {Object.entries(data.expenseByCategory).map(([cat, amount]) => (
                  <div key={cat} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                    <span className="text-xs capitalize">{cat.replace(/_/g, ' ')}</span>
                    <span className="text-xs font-medium text-red-600">Rs. {Math.round(amount).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-4">No expense data</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
