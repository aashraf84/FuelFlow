'use client'

import { useState, useEffect } from 'react'
import {
  DollarSign,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Clock,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'

interface FuelPrice {
  id: string
  fuelType: string
  fuelGrade: string | null
  pricePerUnit: number
  previousPrice: number | null
  currency: string
  effectiveFrom: string
  effectiveTo: string | null
  status: string
}

export default function PricingModule() {
  const [prices, setPrices] = useState<FuelPrice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/prices')
        if (!res.ok) throw new Error('Failed to fetch')
        const json = await res.json()
        setPrices(json.prices || [])
      } catch (err) {
        console.error('Failed to fetch prices:', err)
        setError('Failed to load pricing data')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const activePrices = prices.filter(p => p.status === 'active')
  const expiredPrices = prices.filter(p => p.status === 'expired')

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
          <DollarSign className="size-5 text-amber-500" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Price Management</h2>
          <p className="text-sm text-muted-foreground">
            Fuel pricing, margin control, and price board management
          </p>
        </div>
      </div>

      {/* Current prices cards */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Current Fuel Prices</h3>
        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4 space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-8 w-28" />
                  <Skeleton className="h-3 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : activePrices.length === 0 ? (
          <Card>
            <CardContent className="flex h-32 items-center justify-center">
              <p className="text-sm text-muted-foreground">No active prices configured</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {activePrices.map((price) => {
              const change = price.previousPrice ? price.pricePerUnit - price.previousPrice : 0
              const isUp = change > 0
              return (
                <Card key={price.id} className="relative overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline" className="text-xs capitalize">{price.fuelType}</Badge>
                      {price.fuelGrade && (
                        <span className="text-[10px] text-muted-foreground">{price.fuelGrade}</span>
                      )}
                    </div>
                    <p className="text-2xl font-bold">Rs. {price.pricePerUnit.toFixed(2)}</p>
                    <div className="flex items-center gap-1 mt-1">
                      {change !== 0 && (
                        <>
                          {isUp ? (
                            <TrendingUp className="size-3 text-red-500" />
                          ) : (
                            <TrendingDown className="size-3 text-emerald-500" />
                          )}
                          <span className={`text-xs ${isUp ? 'text-red-500' : 'text-emerald-500'}`}>
                            {isUp ? '+' : ''}{change.toFixed(2)}
                          </span>
                        </>
                      )}
                      <span className="text-[10px] text-muted-foreground">per litre</span>
                    </div>
                    <div className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Clock className="size-2.5" />
                      <span>Effective: {new Date(price.effectiveFrom).toLocaleDateString()}</span>
                    </div>
                  </CardContent>
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Price history table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Price History</CardTitle>
          <CardDescription>All price changes including active and expired rates</CardDescription>
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
                    <TableHead className="text-xs">Fuel Type</TableHead>
                    <TableHead className="text-xs">Grade</TableHead>
                    <TableHead className="text-xs text-right">Price/L</TableHead>
                    <TableHead className="text-xs text-right">Previous</TableHead>
                    <TableHead className="text-xs text-right">Change</TableHead>
                    <TableHead className="text-xs">Effective From</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {prices.map((price) => {
                    const change = price.previousPrice ? price.pricePerUnit - price.previousPrice : 0
                    return (
                      <TableRow key={price.id}>
                        <TableCell className="text-xs font-medium capitalize">{price.fuelType}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{price.fuelGrade || '-'}</TableCell>
                        <TableCell className="text-xs text-right font-medium">Rs. {price.pricePerUnit.toFixed(2)}</TableCell>
                        <TableCell className="text-xs text-right text-muted-foreground">
                          {price.previousPrice ? `Rs. ${price.previousPrice.toFixed(2)}` : '-'}
                        </TableCell>
                        <TableCell className="text-xs text-right">
                          {change !== 0 ? (
                            <span className={change > 0 ? 'text-red-500' : 'text-emerald-500'}>
                              {change > 0 ? '+' : ''}{change.toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs">
                          {new Date(price.effectiveFrom).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-xs">
                          <Badge
                            variant={price.status === 'active' ? 'outline' : 'secondary'}
                            className={`text-[10px] ${price.status === 'active' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-200' : ''}`}
                          >
                            {price.status.charAt(0).toUpperCase() + price.status.slice(1)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Price board status */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Price Board Status</CardTitle>
          <CardDescription>Digital price board connectivity and update status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-sm text-muted-foreground">
            <DollarSign className="size-10 mx-auto text-muted-foreground/30 mb-2" />
            <p>Price board integration will be configured in Settings</p>
            <p className="text-xs mt-1">Connect LED/digital boards to push price updates automatically</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
