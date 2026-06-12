'use client'

import { useState, useEffect } from 'react'
import {
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Monitor,
  Clock,
  AlertTriangle,
  Plus,
  Calendar,
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

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
  isGovernment: boolean
  scheduledAt: string | null
  createdAt: string
}

interface PriceBoard {
  id: string
  name: string
  boardType: string
  ipAddress: string | null
  port: number | null
  status: string
  isActive: boolean
  lastUpdate: string | null
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}><CardContent className="p-4"><Skeleton className="h-40 w-full" /></CardContent></Card>
      ))}
    </div>
  )
}

export default function PricingModule() {
  const [prices, setPrices] = useState<FuelPrice[]>([])
  const [priceBoards, setPriceBoards] = useState<PriceBoard[]>([])
  const [allPrices, setAllPrices] = useState<FuelPrice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('current')
  const [updatePriceDialogOpen, setUpdatePriceDialogOpen] = useState(false)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const [activeRes, allRes] = await Promise.all([
          fetch('/api/prices?status=active'),
          fetch('/api/prices'),
        ])
        if (activeRes.ok) {
          const data = await activeRes.json()
          setPrices(data.prices || [])
        }
        if (allRes.ok) {
          const data = await allRes.json()
          setAllPrices(data.prices || [])
        }

        // Fetch price boards
        try {
          const boardsRes = await fetch('/api/price-boards')
          if (boardsRes.ok) {
            const data = await boardsRes.json()
            setPriceBoards(data.boards || [])
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

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="current">Current Prices</TabsTrigger>
          <TabsTrigger value="history">Price History</TabsTrigger>
          <TabsTrigger value="price-boards">Price Boards</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled Changes</TabsTrigger>
        </TabsList>

        {/* Current Prices */}
        <TabsContent value="current" className="mt-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs text-muted-foreground">{prices.length} active fuel prices</p>
            <Dialog open={updatePriceDialogOpen} onOpenChange={setUpdatePriceDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1">
                  <RefreshCw className="size-3" /> Update Price
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Update Fuel Price</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium">Fuel Type</label>
                    <Select>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Select fuel type" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="petrol">Petrol</SelectItem>
                        <SelectItem value="diesel">Diesel</SelectItem>
                        <SelectItem value="premium">Premium</SelectItem>
                        <SelectItem value="hsd">High Speed Diesel</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs font-medium">New Price (Rs./L)</label>
                    <Input type="number" placeholder="0.00" step="0.01" className="mt-1" />
                  </div>
                  <div>
                    <label className="text-xs font-medium">Effective From</label>
                    <Input type="datetime-local" className="mt-1" />
                  </div>
                  <Button className="w-full" onClick={() => setUpdatePriceDialogOpen(false)}>Update Price</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {prices.map((price) => {
              const change = price.previousPrice ? price.pricePerUnit - price.previousPrice : 0
              const isUp = change > 0
              return (
                <Card key={price.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 capitalize">
                        {price.fuelType}
                      </Badge>
                      {price.isGovernment && (
                        <Badge variant="secondary" className="text-[9px] px-1.5 py-0">Govt.</Badge>
                      )}
                    </div>
                    <p className="text-2xl font-bold mt-2">
                      Rs. {price.pricePerUnit.toFixed(2)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">per litre</p>
                    {price.previousPrice && change !== 0 && (
                      <div className="flex items-center gap-1 mt-2 text-xs">
                        {isUp ? (
                          <ArrowUpRight className="size-3 text-red-500" />
                        ) : (
                          <ArrowDownRight className="size-3 text-emerald-500" />
                        )}
                        <span className={isUp ? 'text-red-500' : 'text-emerald-500'}>
                          Rs. {Math.abs(change).toFixed(2)}
                        </span>
                        <span className="text-muted-foreground">from previous</span>
                      </div>
                    )}
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Effective: {new Date(price.effectiveFrom).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        {/* Price History */}
        <TabsContent value="history" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Price Change History</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="max-h-96">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Fuel Type</TableHead>
                      <TableHead className="text-xs text-right">New Price</TableHead>
                      <TableHead className="text-xs text-right">Previous Price</TableHead>
                      <TableHead className="text-xs text-right">Change</TableHead>
                      <TableHead className="text-xs">Effective From</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allPrices.map((p) => {
                      const change = p.previousPrice ? p.pricePerUnit - p.previousPrice : 0
                      return (
                        <TableRow key={p.id}>
                          <TableCell className="text-xs font-medium capitalize">{p.fuelType}</TableCell>
                          <TableCell className="text-xs text-right">Rs. {p.pricePerUnit.toFixed(2)}</TableCell>
                          <TableCell className="text-xs text-right">
                            {p.previousPrice ? `Rs. ${p.previousPrice.toFixed(2)}` : '-'}
                          </TableCell>
                          <TableCell className="text-xs text-right">
                            {change !== 0 && (
                              <span className={change > 0 ? 'text-red-500' : 'text-emerald-500'}>
                                {change > 0 ? '+' : ''}Rs. {change.toFixed(2)}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-xs font-mono">{new Date(p.effectiveFrom).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Badge
                              variant={p.status === 'active' ? 'outline' : p.status === 'expired' ? 'secondary' : 'destructive'}
                              className="text-[10px] px-1.5 py-0 capitalize"
                            >
                              {p.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Price Boards */}
        <TabsContent value="price-boards" className="mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {priceBoards.length === 0 ? (
              <Card className="col-span-full">
                <CardContent className="p-6 text-center">
                  <Monitor className="size-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                  <p className="text-xs text-muted-foreground">No price boards configured</p>
                </CardContent>
              </Card>
            ) : (
              priceBoards.map((board) => (
                <Card key={board.id}>
                  <CardHeader className="pb-2 p-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-semibold">{board.name}</CardTitle>
                      <Badge
                        variant={board.status === 'online' ? 'outline' : 'destructive'}
                        className="text-[10px] px-1.5 py-0"
                      >
                        {board.status}
                      </Badge>
                    </div>
                    <CardDescription className="text-[10px]">
                      {board.boardType.toUpperCase()} Display
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 text-xs space-y-1">
                    {board.ipAddress && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">IP Address:</span>
                        <span className="font-mono">{board.ipAddress}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Last Update:</span>
                      <span>{board.lastUpdate ? new Date(board.lastUpdate).toLocaleString() : 'Never'}</span>
                    </div>
                    <Button size="sm" variant="outline" className="w-full mt-2 text-[10px] h-7 gap-1">
                      <RefreshCw className="size-3" /> Sync Prices
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Scheduled Changes */}
        <TabsContent value="scheduled" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Clock className="size-4 text-amber-500" />
                <CardTitle className="text-sm font-semibold">Scheduled Price Changes</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {prices.filter(p => p.scheduledAt).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <Calendar className="size-8 mb-2 opacity-50" />
                  <p className="text-xs">No scheduled price changes</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Fuel Type</TableHead>
                      <TableHead className="text-xs text-right">New Price</TableHead>
                      <TableHead className="text-xs">Scheduled At</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {prices.filter(p => p.scheduledAt).map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="text-xs capitalize">{p.fuelType}</TableCell>
                        <TableCell className="text-xs text-right font-medium">Rs. {p.pricePerUnit.toFixed(2)}</TableCell>
                        <TableCell className="text-xs font-mono">{new Date(p.scheduledAt!).toLocaleString()}</TableCell>
                        <TableCell><Badge variant="secondary" className="text-[10px] px-1.5 py-0">Scheduled</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
