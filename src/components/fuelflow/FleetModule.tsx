'use client'

import { useState, useEffect } from 'react'
import {
  Truck,
  AlertTriangle,
  CreditCard,
  Car,
  User,
  Phone,
  Mail,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'

interface FleetAccount {
  id: string
  companyName: string
  contactPerson: string | null
  phone: string | null
  email: string | null
  address: string | null
  creditLimit: number
  currentBalance: number
  dailyLimit: number | null
  monthlyLimit: number | null
  fuelTypes: string | null
  status: string
  vehicleCount: number
  driverCount: number
  fuelCardCount: number
}

export default function FleetModule() {
  const [fleetAccounts, setFleetAccounts] = useState<FleetAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/fleet')
        if (!res.ok) throw new Error('Failed to fetch')
        const json = await res.json()
        setFleetAccounts(json.fleetAccounts || [])
      } catch (err) {
        console.error('Failed to fetch fleet data:', err)
        setError('Failed to load fleet data')
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
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="module-enter space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-amber-500/10">
          <Truck className="size-5 text-amber-500" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Fleet & RFID Management</h2>
          <p className="text-sm text-muted-foreground">
            Fleet accounts, RFID card management, and vehicle tracking
          </p>
        </div>
      </div>

      <Tabs defaultValue="accounts">
        <TabsList>
          <TabsTrigger value="accounts">Fleet Accounts</TabsTrigger>
          <TabsTrigger value="vehicles">Vehicles</TabsTrigger>
          <TabsTrigger value="drivers">Drivers</TabsTrigger>
          <TabsTrigger value="fuel-cards">Fuel Cards</TabsTrigger>
        </TabsList>

        <TabsContent value="accounts" className="space-y-4 mt-4">
          {loading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4 space-y-3">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-full" />
                    <div className="flex gap-2">
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-6 w-16" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : fleetAccounts.length === 0 ? (
            <Card>
              <CardContent className="flex h-48 items-center justify-center">
                <div className="text-center space-y-2">
                  <Truck className="size-10 mx-auto text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">No fleet accounts found</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {fleetAccounts.map((account) => (
                <Card key={account.id} className="relative overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">{account.companyName}</CardTitle>
                      <Badge
                        variant={account.status === 'active' ? 'outline' : 'secondary'}
                        className={`text-[10px] ${account.status === 'active' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-200' : ''}`}
                      >
                        {account.status.charAt(0).toUpperCase() + account.status.slice(1)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {account.contactPerson && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <User className="size-3" />
                        <span>{account.contactPerson}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {account.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="size-3" />
                          <span>{account.phone}</span>
                        </div>
                      )}
                      {account.email && (
                        <div className="flex items-center gap-1">
                          <Mail className="size-3" />
                          <span className="truncate">{account.email}</span>
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-muted/50 rounded p-2">
                        <p className="text-muted-foreground text-[10px]">Credit Limit</p>
                        <p className="font-semibold">Rs. {Math.round(account.creditLimit).toLocaleString()}</p>
                      </div>
                      <div className="bg-muted/50 rounded p-2">
                        <p className="text-muted-foreground text-[10px]">Balance</p>
                        <p className="font-semibold">Rs. {Math.round(account.currentBalance).toLocaleString()}</p>
                      </div>
                      {account.dailyLimit && (
                        <div className="bg-muted/50 rounded p-2">
                          <p className="text-muted-foreground text-[10px]">Daily Limit</p>
                          <p className="font-semibold">Rs. {Math.round(account.dailyLimit).toLocaleString()}</p>
                        </div>
                      )}
                      {account.monthlyLimit && (
                        <div className="bg-muted/50 rounded p-2">
                          <p className="text-muted-foreground text-[10px]">Monthly Limit</p>
                          <p className="font-semibold">Rs. {Math.round(account.monthlyLimit).toLocaleString()}</p>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 pt-1">
                      <Badge variant="outline" className="text-[10px] gap-1">
                        <Car className="size-2.5" />
                        {account.vehicleCount} vehicles
                      </Badge>
                      <Badge variant="outline" className="text-[10px] gap-1">
                        <User className="size-2.5" />
                        {account.driverCount} drivers
                      </Badge>
                      <Badge variant="outline" className="text-[10px] gap-1">
                        <CreditCard className="size-2.5" />
                        {account.fuelCardCount} cards
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="vehicles" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Vehicle Registry</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
              ) : (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  <Car className="size-10 mx-auto text-muted-foreground/30 mb-2" />
                  <p>Vehicle details are managed within each fleet account</p>
                  <p className="text-xs mt-1">Total vehicles across all accounts: {fleetAccounts.reduce((s, a) => s + a.vehicleCount, 0)}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="drivers" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Driver Management</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
              ) : (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  <User className="size-10 mx-auto text-muted-foreground/30 mb-2" />
                  <p>Driver details are managed within each fleet account</p>
                  <p className="text-xs mt-1">Total drivers across all accounts: {fleetAccounts.reduce((s, a) => s + a.driverCount, 0)}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fuel-cards" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Fuel Cards</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
              ) : (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  <CreditCard className="size-10 mx-auto text-muted-foreground/30 mb-2" />
                  <p>Fuel card details are managed within each fleet account</p>
                  <p className="text-xs mt-1">Total cards across all accounts: {fleetAccounts.reduce((s, a) => s + a.fuelCardCount, 0)}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
