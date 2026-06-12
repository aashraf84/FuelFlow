'use client'

import { useState, useEffect } from 'react'
import {
  ShoppingCart,
  AlertTriangle,
  Package,
  AlertCircle,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'

interface Product {
  id: string
  name: string
  sku: string | null
  category: string | null
  price: number
  costPrice: number | null
  stockQty: number
  minStock: number
  unit: string
  stockStatus: string
}

function StockBadge({ status }: { status: string }) {
  const configs: Record<string, { variant: 'outline' | 'secondary' | 'destructive'; label: string; className: string }> = {
    in_stock: { variant: 'outline', label: 'In Stock', className: 'bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:text-emerald-400 dark:border-emerald-800' },
    low_stock: { variant: 'secondary', label: 'Low Stock', className: 'bg-amber-500/10 text-amber-600 border-amber-200 dark:text-amber-400 dark:border-amber-800' },
    out_of_stock: { variant: 'destructive', label: 'Out of Stock', className: 'bg-red-500/10 text-red-600 border-red-200 dark:text-red-400 dark:border-red-800' },
  }
  const config = configs[status] || configs.in_stock
  return (
    <Badge variant={config.variant} className={`text-[10px] ${config.className}`}>
      {config.label}
    </Badge>
  )
}

export default function RetailModule() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/retail')
        if (!res.ok) throw new Error('Failed to fetch')
        const json = await res.json()
        setProducts(json.products || [])
      } catch (err) {
        console.error('Failed to fetch retail data:', err)
        setError('Failed to load retail data')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const retailProducts = products.filter(p => p.category !== 'lubricant' && p.category !== 'engine_oil' && p.category !== 'transmission' && p.category !== 'hydraulic' && p.category !== 'grease' && p.category !== 'coolant')
  const lubricantProducts = products.filter(p => p.category === 'lubricant' || p.category === 'engine_oil' || p.category === 'transmission' || p.category === 'hydraulic' || p.category === 'grease' || p.category === 'coolant')
  const lowStockProducts = products.filter(p => p.stockStatus === 'low_stock' || p.stockStatus === 'out_of_stock')

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
          <ShoppingCart className="size-5 text-amber-500" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Retail Store</h2>
          <p className="text-sm text-muted-foreground">
            Convenience store POS, inventory, and retail operations
          </p>
        </div>
      </div>

      {/* Low stock alerts */}
      {!loading && lowStockProducts.length > 0 && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertCircle className="size-4 text-amber-500" />
              Low Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {lowStockProducts.map(p => (
                <Badge key={p.id} variant={p.stockStatus === 'out_of_stock' ? 'destructive' : 'secondary'} className="text-xs">
                  {p.name} ({p.stockQty} left)
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="retail">
        <TabsList>
          <TabsTrigger value="retail">Retail Products</TabsTrigger>
          <TabsTrigger value="lubricants">Lubricants</TabsTrigger>
        </TabsList>

        <TabsContent value="retail" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Package className="size-4 text-amber-500" />
                Retail Products
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : retailProducts.length === 0 && lubricantProducts.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  <ShoppingCart className="size-10 mx-auto text-muted-foreground/30 mb-2" />
                  <p>No retail products found</p>
                </div>
              ) : (
                <div className="max-h-96 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Product</TableHead>
                        <TableHead className="text-xs">SKU</TableHead>
                        <TableHead className="text-xs">Category</TableHead>
                        <TableHead className="text-xs text-right">Price</TableHead>
                        <TableHead className="text-xs text-right">Stock</TableHead>
                        <TableHead className="text-xs">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(retailProducts.length > 0 ? retailProducts : products).map((product) => (
                        <TableRow key={product.id}>
                          <TableCell className="text-xs font-medium">{product.name}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{product.sku || '-'}</TableCell>
                          <TableCell className="text-xs capitalize text-muted-foreground">{product.category || '-'}</TableCell>
                          <TableCell className="text-xs text-right font-medium">Rs. {product.price.toFixed(0)}</TableCell>
                          <TableCell className="text-xs text-right">
                            <span className={product.stockQty <= product.minStock ? 'text-red-500 font-medium' : ''}>
                              {product.stockQty} {product.unit}
                            </span>
                          </TableCell>
                          <TableCell className="text-xs">
                            <StockBadge status={product.stockStatus} />
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

        <TabsContent value="lubricants" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Package className="size-4 text-amber-500" />
                Lubricants
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : lubricantProducts.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  <Package className="size-10 mx-auto text-muted-foreground/30 mb-2" />
                  <p>No lubricant products found</p>
                  <p className="text-xs mt-1">Lubricant products with categories like engine oil, transmission, etc. will appear here</p>
                </div>
              ) : (
                <div className="max-h-96 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Product</TableHead>
                        <TableHead className="text-xs">Category</TableHead>
                        <TableHead className="text-xs text-right">Price</TableHead>
                        <TableHead className="text-xs text-right">Stock</TableHead>
                        <TableHead className="text-xs">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lubricantProducts.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell className="text-xs font-medium">{product.name}</TableCell>
                          <TableCell className="text-xs capitalize text-muted-foreground">{product.category || '-'}</TableCell>
                          <TableCell className="text-xs text-right font-medium">Rs. {product.price.toFixed(0)}</TableCell>
                          <TableCell className="text-xs text-right">{product.stockQty} {product.unit}</TableCell>
                          <TableCell className="text-xs">
                            <StockBadge status={product.stockStatus} />
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
