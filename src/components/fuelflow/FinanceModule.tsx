'use client'

import { useState, useEffect } from 'react'
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertTriangle,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  Truck,
  Package,
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
  Legend,
} from 'recharts'

interface FinanceSummary {
  totalIncome: number
  totalExpenses: number
  profit: number
  totalFuelRevenue: number
  profitMargin: number
  transactionCount: number
  expenseCount: number
  incomeByCategory: Record<string, number>
  expenseByCategory: Record<string, number>
  fuelRevenueByType: Record<string, number>
  period: string
}

interface Supplier {
  id: string
  name: string
  code: string | null
  contactPerson: string | null
  category: string
  invoiceCount: number
  deliveryCount: number
  poCount: number
}

interface Invoice {
  id: string
  invoiceNumber: string
  invoiceDate: string
  dueDate: string | null
  totalAmount: number
  taxAmount: number
  netAmount: number
  status: string
  paidAmount: number
  supplier: { id: string; name: string; category: string }
}

interface PurchaseOrder {
  id: string
  poNumber: string
  orderDate: string
  expectedDate: string | null
  totalAmount: number
  status: string
  supplier: { id: string; name: string; category: string }
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

export default function FinanceModule() {
  const [summary, setSummary] = useState<FinanceSummary | null>(null)
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [poDialogOpen, setPoDialogOpen] = useState(false)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const [financeRes, suppliersRes, invoicesRes, poRes] = await Promise.all([
          fetch('/api/finance'),
          fetch('/api/suppliers'),
          fetch('/api/invoices'),
          fetch('/api/purchase-orders'),
        ])
        if (financeRes.ok) {
          const data = await financeRes.json()
          setSummary({
            ...data.summary,
            incomeByCategory: data.incomeByCategory || {},
            expenseByCategory: data.expenseByCategory || {},
            fuelRevenueByType: data.fuelRevenueByType || {},
            period: data.period,
            transactionCount: data.transactionCount ?? data.summary?.transactionCount ?? 0,
            expenseCount: data.expenseCount ?? data.summary?.expenseCount ?? 0,
          })
        }
        if (suppliersRes.ok) {
          const data = await suppliersRes.json()
          setSuppliers(data.suppliers || [])
        }
        if (invoicesRes.ok) {
          const data = await invoicesRes.json()
          setInvoices(data.invoices || [])
        }
        if (poRes.ok) {
          const data = await poRes.json()
          setPurchaseOrders(data.purchaseOrders || [])
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

  // Chart data from income/expense categories
  const chartData = summary ? [
    ...Object.entries(summary.incomeByCategory).map(([cat, amount]) => ({
      category: cat.replace(/_/g, ' '),
      income: Math.round(amount),
      expenses: 0,
    })),
    ...Object.entries(summary.expenseByCategory).map(([cat, amount]) => ({
      category: cat.replace(/_/g, ' '),
      income: 0,
      expenses: Math.round(amount),
    })),
  ].reduce((acc: Array<{ category: string; income: number; expenses: number }>, item) => {
    const existing = acc.find(a => a.category === item.category)
    if (existing) {
      existing.income += item.income
      existing.expenses += item.expenses
    } else {
      acc.push(item)
    }
    return acc
  }, []) : []

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="income-expenses">Income & Expenses</TabsTrigger>
          <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="purchase-orders">Purchase Orders</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Total Income</p>
                    <p className="text-xl font-bold text-emerald-600">Rs. {summary ? Math.round(summary.totalIncome).toLocaleString() : 0}</p>
                  </div>
                  <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-500/10">
                    <TrendingUp className="size-5 text-emerald-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Total Expenses</p>
                    <p className="text-xl font-bold text-red-600">Rs. {summary ? Math.round(summary.totalExpenses).toLocaleString() : 0}</p>
                  </div>
                  <div className="flex size-10 items-center justify-center rounded-lg bg-red-500/10">
                    <TrendingDown className="size-5 text-red-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Net Profit</p>
                    <p className={`text-xl font-bold ${(summary?.profit || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      Rs. {summary ? Math.round(summary.profit).toLocaleString() : 0}
                    </p>
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
                    <p className="text-xs text-muted-foreground">Profit Margin</p>
                    <p className="text-xl font-bold">{summary?.profitMargin || 0}%</p>
                  </div>
                  <div className="flex size-10 items-center justify-center rounded-lg bg-purple-500/10">
                    <Wallet className="size-5 text-purple-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Income vs Expenses Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Income vs Expenses by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <XAxis dataKey="category" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                    <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(value: number) => [`Rs. ${value.toLocaleString()}`, '']} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                    <Legend />
                    <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Income & Expenses */}
        <TabsContent value="income-expenses" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Financial Transactions</CardTitle>
              <CardDescription className="text-xs">{summary?.transactionCount || 0} transactions, {summary?.expenseCount || 0} expenses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2">Income by Category</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {summary && Object.entries(summary.incomeByCategory).map(([cat, amount]) => (
                      <div key={cat} className="rounded-lg border p-3">
                        <p className="text-[10px] text-muted-foreground capitalize">{cat.replace(/_/g, ' ')}</p>
                        <p className="text-sm font-bold text-emerald-600">Rs. {Math.round(amount).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <Separator />
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2">Expenses by Category</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {summary && Object.entries(summary.expenseByCategory).map(([cat, amount]) => (
                      <div key={cat} className="rounded-lg border p-3">
                        <p className="text-[10px] text-muted-foreground capitalize">{cat.replace(/_/g, ' ')}</p>
                        <p className="text-sm font-bold text-red-600">Rs. {Math.round(amount).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Suppliers */}
        <TabsContent value="suppliers" className="mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {suppliers.map((supplier) => (
              <Card key={supplier.id}>
                <CardHeader className="pb-2 p-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold">{supplier.name}</CardTitle>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 capitalize">
                      {supplier.category}
                    </Badge>
                  </div>
                  {supplier.contactPerson && (
                    <CardDescription className="text-[10px]">{supplier.contactPerson}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="flex gap-4 text-xs">
                    <div className="text-center">
                      <p className="font-bold">{supplier.invoiceCount}</p>
                      <p className="text-[10px] text-muted-foreground">Invoices</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold">{supplier.deliveryCount}</p>
                      <p className="text-[10px] text-muted-foreground">Deliveries</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold">{supplier.poCount}</p>
                      <p className="text-[10px] text-muted-foreground">POs</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Invoices */}
        <TabsContent value="invoices" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Supplier Invoices</CardTitle>
              <CardDescription className="text-xs">{invoices.length} invoices</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="max-h-96">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Invoice #</TableHead>
                      <TableHead className="text-xs">Supplier</TableHead>
                      <TableHead className="text-xs">Date</TableHead>
                      <TableHead className="text-xs text-right">Total</TableHead>
                      <TableHead className="text-xs text-right">Paid</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-xs text-muted-foreground py-8">No invoices</TableCell>
                      </TableRow>
                    ) : (
                      invoices.map((inv) => (
                        <TableRow key={inv.id}>
                          <TableCell className="text-xs font-mono">{inv.invoiceNumber}</TableCell>
                          <TableCell className="text-xs">{inv.supplier?.name || 'N/A'}</TableCell>
                          <TableCell className="text-xs font-mono">{new Date(inv.invoiceDate).toLocaleDateString()}</TableCell>
                          <TableCell className="text-xs text-right font-medium">Rs. {Math.round(inv.totalAmount).toLocaleString()}</TableCell>
                          <TableCell className="text-xs text-right">Rs. {Math.round(inv.paidAmount).toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge
                              variant={inv.status === 'paid' ? 'outline' : inv.status === 'overdue' ? 'destructive' : 'secondary'}
                              className="text-[10px] px-1.5 py-0 capitalize"
                            >
                              {inv.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {inv.status === 'pending' && (
                              <Button size="sm" variant="ghost" className="h-6 text-[10px]">Approve</Button>
                            )}
                            {inv.status === 'approved' && (
                              <Button size="sm" variant="ghost" className="h-6 text-[10px]">Pay</Button>
                            )}
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

        {/* Purchase Orders */}
        <TabsContent value="purchase-orders" className="mt-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs text-muted-foreground">{purchaseOrders.length} purchase orders</p>
            <Dialog open={poDialogOpen} onOpenChange={setPoDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1"><Plus className="size-3" /> Create PO</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Create Purchase Order</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium">PO Number</label>
                    <Input placeholder="PO-XXXX" className="mt-1" />
                  </div>
                  <div>
                    <label className="text-xs font-medium">Supplier</label>
                    <Select>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Select supplier" /></SelectTrigger>
                      <SelectContent>
                        {suppliers.map((s) => (
                          <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs font-medium">Total Amount (Rs.)</label>
                    <Input type="number" placeholder="0" className="mt-1" />
                  </div>
                  <Button className="w-full" onClick={() => setPoDialogOpen(false)}>Create PO</Button>
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
                      <TableHead className="text-xs">PO #</TableHead>
                      <TableHead className="text-xs">Supplier</TableHead>
                      <TableHead className="text-xs">Order Date</TableHead>
                      <TableHead className="text-xs text-right">Amount</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchaseOrders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-xs text-muted-foreground py-8">No purchase orders</TableCell>
                      </TableRow>
                    ) : (
                      purchaseOrders.map((po) => (
                        <TableRow key={po.id}>
                          <TableCell className="text-xs font-mono">{po.poNumber}</TableCell>
                          <TableCell className="text-xs">{po.supplier?.name || 'N/A'}</TableCell>
                          <TableCell className="text-xs font-mono">{new Date(po.orderDate).toLocaleDateString()}</TableCell>
                          <TableCell className="text-xs text-right font-medium">Rs. {Math.round(po.totalAmount).toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge
                              variant={po.status === 'received' ? 'outline' : po.status === 'cancelled' ? 'destructive' : 'secondary'}
                              className="text-[10px] px-1.5 py-0 capitalize"
                            >
                              {po.status}
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
      </Tabs>
    </div>
  )
}
