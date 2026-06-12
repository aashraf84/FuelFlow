'use client'

import { useState, useEffect } from 'react'
import {
  ShoppingCart,
  Package,
  Car,
  Ticket,
  Droplets,
  Tag,
  AlertTriangle,
  Plus,
  TrendingDown,
  CheckCircle2,
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
import { Progress } from '@/components/ui/progress'

interface Product {
  id: string
  name: string
  sku: string | null
  category: string | null
  price: number
  costPrice: number | null
  stockQty: number
  minStock: number
  maxStock: number
  unit: string
  stockStatus: string
}

interface CarWashSession {
  id: string
  vehiclePlate: string | null
  washType: string
  amount: number
  paymentMethod: string
  status: string
  startedAt: string
}

interface LotterySale {
  id: string
  gameType: string
  ticketCount: number
  saleAmount: number
  commission: number
  createdAt: string
}

interface LubricantProduct {
  id: string
  name: string
  brand: string | null
  viscosity: string | null
  category: string | null
  price: number
  costPrice: number | null
  stockQty: number
  minStock: number
  isActive: boolean
}

interface Promotion {
  id: string
  name: string
  description: string | null
  discountType: string
  discountValue: number
  applicableTo: string
  validFrom: string
  validTo: string
  isActive: boolean
  _count?: { usage: number }
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}><CardContent className="p-4"><Skeleton className="h-40 w-full" /></CardContent></Card>
      ))}
    </div>
  )
}

export default function RetailModule() {
  const [products, setProducts] = useState<Product[]>([])
  const [lubricants, setLubricants] = useState<LubricantProduct[]>([])
  const [carWashSessions, setCarWashSessions] = useState<CarWashSession[]>([])
  const [lotterySales, setLotterySales] = useState<LotterySale[]>([])
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [carWashRevenue, setCarWashRevenue] = useState(0)
  const [lotteryTotal, setLotteryTotal] = useState(0)
  const [lotteryCommission, setLotteryCommission] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('products')
  const [promotionDialogOpen, setPromotionDialogOpen] = useState(false)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const [retailRes, carWashRes, lotteryRes, promoRes] = await Promise.all([
          fetch('/api/retail'),
          fetch('/api/car-wash'),
          fetch('/api/lottery'),
          fetch('/api/promotions'),
        ])
        if (retailRes.ok) {
          const data = await retailRes.json()
          setProducts(data.products || [])
        }
        if (carWashRes.ok) {
          const data = await carWashRes.json()
          setCarWashSessions(data.sessions || [])
          setCarWashRevenue(data.summary?.totalRevenue || 0)
        }
        if (lotteryRes.ok) {
          const data = await lotteryRes.json()
          setLotterySales(data.sales || [])
          setLotteryTotal(data.summary?.totalRevenue || 0)
          setLotteryCommission(data.summary?.totalCommission || 0)
        }
        if (promoRes.ok) {
          const data = await promoRes.json()
          setPromotions(data.promotions || [])
        }

        // Fetch lubricants
        try {
          const lubRes = await fetch('/api/lubricants')
          if (lubRes.ok) {
            const data = await lubRes.json()
            setLubricants(data.products || [])
          }
        } catch {}
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

  const lowStockProducts = products.filter(p => p.stockStatus === 'low_stock' || p.stockStatus === 'out_of_stock')

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="car-wash">Car Wash</TabsTrigger>
          <TabsTrigger value="lottery">Lottery</TabsTrigger>
          <TabsTrigger value="lubricants">Lubricants</TabsTrigger>
          <TabsTrigger value="promotions">Promotions</TabsTrigger>
        </TabsList>

        {/* Products */}
        <TabsContent value="products" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold">Retail Products</CardTitle>
                  <CardDescription className="text-xs">{products.length} products</CardDescription>
                </div>
                {lowStockProducts.length > 0 && (
                  <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                    {lowStockProducts.length} low stock
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="max-h-96">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Product</TableHead>
                      <TableHead className="text-xs">Category</TableHead>
                      <TableHead className="text-xs text-right">Price</TableHead>
                      <TableHead className="text-xs text-right">Cost</TableHead>
                      <TableHead className="text-xs text-right">Stock</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="text-xs font-medium">{p.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0 capitalize">
                            {p.category || 'N/A'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-right">Rs. {p.price.toLocaleString()}</TableCell>
                        <TableCell className="text-xs text-right text-muted-foreground">
                          {p.costPrice ? `Rs. ${p.costPrice.toLocaleString()}` : '-'}
                        </TableCell>
                        <TableCell className="text-xs text-right">{p.stockQty} {p.unit}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              p.stockStatus === 'out_of_stock' ? 'destructive' :
                              p.stockStatus === 'low_stock' ? 'secondary' : 'outline'
                            }
                            className="text-[9px] px-1.5 py-0"
                          >
                            {p.stockStatus === 'out_of_stock' ? 'Out of Stock' :
                             p.stockStatus === 'low_stock' ? 'Low Stock' : 'In Stock'}
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

        {/* Inventory */}
        <TabsContent value="inventory" className="mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Total Products</p>
                <p className="text-2xl font-bold">{products.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Low Stock Items</p>
                <p className="text-2xl font-bold text-amber-500">{lowStockProducts.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Out of Stock</p>
                <p className="text-2xl font-bold text-red-500">
                  {products.filter(p => p.stockStatus === 'out_of_stock').length}
                </p>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <TrendingDown className="size-4 text-amber-500" />
                <CardTitle className="text-sm font-semibold">Stock Levels & Reorder Suggestions</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-72">
                <div className="space-y-3">
                  {products.map((p) => (
                    <div key={p.id} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium">{p.name}</span>
                        <span className="text-muted-foreground">
                          {p.stockQty} / {p.maxStock} {p.unit}
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            p.stockQty <= p.minStock ? 'bg-red-500' :
                            p.stockQty <= p.minStock * 2 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min((p.stockQty / p.maxStock) * 100, 100)}%` }}
                        />
                      </div>
                      {p.stockQty <= p.minStock && (
                        <p className="text-[10px] text-red-500">
                          Reorder suggested: {p.minStock * 3 - p.stockQty} {p.unit}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Car Wash */}
        <TabsContent value="car-wash" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Total Revenue</p>
                    <p className="text-xl font-bold">Rs. {Math.round(carWashRevenue).toLocaleString()}</p>
                  </div>
                  <Car className="size-8 text-amber-500/30" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Total Sessions</p>
                <p className="text-xl font-bold">{carWashSessions.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Avg. Ticket</p>
                <p className="text-xl font-bold">
                  Rs. {carWashSessions.length > 0 ? Math.round(carWashRevenue / carWashSessions.length).toLocaleString() : 0}
                </p>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Car Wash Sessions</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="max-h-72">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Vehicle</TableHead>
                      <TableHead className="text-xs">Type</TableHead>
                      <TableHead className="text-xs text-right">Amount</TableHead>
                      <TableHead className="text-xs">Payment</TableHead>
                      <TableHead className="text-xs">Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {carWashSessions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-xs text-muted-foreground py-8">
                          No car wash sessions
                        </TableCell>
                      </TableRow>
                    ) : (
                      carWashSessions.map((s) => (
                        <TableRow key={s.id}>
                          <TableCell className="text-xs font-mono">{s.vehiclePlate || 'N/A'}</TableCell>
                          <TableCell className="text-xs capitalize">{s.washType}</TableCell>
                          <TableCell className="text-xs text-right font-medium">Rs. {s.amount.toLocaleString()}</TableCell>
                          <TableCell className="text-xs capitalize">{s.paymentMethod}</TableCell>
                          <TableCell className="text-xs font-mono">{new Date(s.startedAt).toLocaleString()}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Lottery */}
        <TabsContent value="lottery" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Total Sales</p>
                <p className="text-xl font-bold">Rs. {Math.round(lotteryTotal).toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Commission Earned</p>
                <p className="text-xl font-bold text-emerald-500">Rs. {Math.round(lotteryCommission).toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Tickets Sold</p>
                <p className="text-xl font-bold">{lotterySales.reduce((sum, s) => sum + s.ticketCount, 0)}</p>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Lottery Sales</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="max-h-72">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Game Type</TableHead>
                      <TableHead className="text-xs text-right">Tickets</TableHead>
                      <TableHead className="text-xs text-right">Sale Amount</TableHead>
                      <TableHead className="text-xs text-right">Commission</TableHead>
                      <TableHead className="text-xs">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lotterySales.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-xs text-muted-foreground py-8">No lottery sales</TableCell>
                      </TableRow>
                    ) : (
                      lotterySales.map((s) => (
                        <TableRow key={s.id}>
                          <TableCell className="text-xs capitalize">{s.gameType}</TableCell>
                          <TableCell className="text-xs text-right">{s.ticketCount}</TableCell>
                          <TableCell className="text-xs text-right">Rs. {s.saleAmount.toLocaleString()}</TableCell>
                          <TableCell className="text-xs text-right text-emerald-600">Rs. {s.commission.toLocaleString()}</TableCell>
                          <TableCell className="text-xs font-mono">{new Date(s.createdAt).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Lubricants */}
        <TabsContent value="lubricants" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Lubricant Products</CardTitle>
              <CardDescription className="text-xs">{lubricants.length} products</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="max-h-96">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Product</TableHead>
                      <TableHead className="text-xs">Brand</TableHead>
                      <TableHead className="text-xs">Viscosity</TableHead>
                      <TableHead className="text-xs text-right">Price</TableHead>
                      <TableHead className="text-xs text-right">Stock</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lubricants.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-xs text-muted-foreground py-8">No lubricant products</TableCell>
                      </TableRow>
                    ) : (
                      lubricants.map((l) => (
                        <TableRow key={l.id}>
                          <TableCell className="text-xs font-medium">{l.name}</TableCell>
                          <TableCell className="text-xs">{l.brand || 'N/A'}</TableCell>
                          <TableCell className="text-xs">{l.viscosity || 'N/A'}</TableCell>
                          <TableCell className="text-xs text-right">Rs. {l.price.toLocaleString()}</TableCell>
                          <TableCell className="text-xs text-right">{l.stockQty}</TableCell>
                          <TableCell>
                            <Badge
                              variant={l.stockQty <= l.minStock ? 'destructive' : 'outline'}
                              className="text-[9px] px-1.5 py-0"
                            >
                              {l.stockQty <= l.minStock ? 'Low' : 'OK'}
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

        {/* Promotions */}
        <TabsContent value="promotions" className="mt-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs text-muted-foreground">{promotions.length} active promotions</p>
            <Dialog open={promotionDialogOpen} onOpenChange={setPromotionDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1"><Plus className="size-3" /> New Promotion</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Create Promotion</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><label className="text-xs font-medium">Name</label><Input placeholder="Promotion name" className="mt-1" /></div>
                  <div>
                    <label className="text-xs font-medium">Discount Type</label>
                    <Select><SelectTrigger className="mt-1"><SelectValue placeholder="Select type" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Percentage</SelectItem>
                        <SelectItem value="fixed">Fixed Amount</SelectItem>
                        <SelectItem value="bogo">Buy One Get One</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><label className="text-xs font-medium">Discount Value</label><Input type="number" placeholder="0" className="mt-1" /></div>
                  <div>
                    <label className="text-xs font-medium">Applicable To</label>
                    <Select><SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="fuel">Fuel Only</SelectItem>
                        <SelectItem value="retail">Retail Only</SelectItem>
                        <SelectItem value="car_wash">Car Wash</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button className="w-full" onClick={() => setPromotionDialogOpen(false)}>Create Promotion</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {promotions.length === 0 ? (
              <Card className="col-span-full">
                <CardContent className="p-6 text-center">
                  <Tag className="size-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                  <p className="text-xs text-muted-foreground">No active promotions</p>
                </CardContent>
              </Card>
            ) : (
              promotions.map((promo) => (
                <Card key={promo.id}>
                  <CardHeader className="pb-2 p-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-semibold">{promo.name}</CardTitle>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 capitalize">
                        {promo.discountType}
                      </Badge>
                    </div>
                    {promo.description && (
                      <CardDescription className="text-[10px]">{promo.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="p-4 pt-0 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Discount:</span>
                      <span className="font-bold text-amber-500">
                        {promo.discountType === 'percentage' ? `${promo.discountValue}%` : `Rs. ${promo.discountValue}`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Applies to:</span>
                      <span className="capitalize">{promo.applicableTo}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Valid:</span>
                      <span>{new Date(promo.validFrom).toLocaleDateString()} - {new Date(promo.validTo).toLocaleDateString()}</span>
                    </div>
                    {promo._count && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Usage:</span>
                        <span>{promo._count.usage} times</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
