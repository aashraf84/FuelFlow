'use client'

import { useState, useEffect } from 'react'
import {
  Truck,
  Car,
  Users,
  CreditCard,
  AlertTriangle,
  Phone,
  Mail,
  MapPin,
  DollarSign,
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

interface FleetAccount {
  id: string
  tenantId: string
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
  createdAt: string
}

interface Vehicle {
  id: string
  fleetAccountId: string
  plateNumber: string
  make: string | null
  model: string | null
  year: number | null
  vehicleType: string | null
  rfidTag: string | null
  fuelType: string | null
  dailyLimit: number | null
  isActive: boolean
}

interface Driver {
  id: string
  fleetAccountId: string
  name: string
  licenseNumber: string | null
  phone: string | null
  rfidCard: string | null
  isActive: boolean
}

interface FuelCard {
  id: string
  cardNumber: string
  fleetAccountId: string | null
  cardType: string
  rfidTag: string | null
  dailyLimit: number | null
  monthlyLimit: number | null
  balance: number
  isActive: boolean
  expiryDate: string | null
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

export default function FleetModule() {
  const [fleetAccounts, setFleetAccounts] = useState<FleetAccount[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [fuelCards, setFuelCards] = useState<FuelCard[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('accounts')
  const [newAccountDialogOpen, setNewAccountDialogOpen] = useState(false)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const fleetRes = await fetch('/api/fleet?includeDetails=true')
        if (fleetRes.ok) {
          const data = await fleetRes.json()
          setFleetAccounts(data.fleetAccounts || [])
          // Extract vehicles, drivers, fuel cards from fleet account details
          const allVehicles: Vehicle[] = []
          const allDrivers: Driver[] = []
          const allFuelCards: FuelCard[] = []
          for (const account of data.fleetAccounts || []) {
            if (account.vehicles) allVehicles.push(...account.vehicles)
            if (account.drivers) allDrivers.push(...account.drivers)
            if (account.fuelCards) allFuelCards.push(...account.fuelCards)
          }
          setVehicles(allVehicles)
          setDrivers(allDrivers)
          setFuelCards(allFuelCards)
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

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="accounts">Fleet Accounts</TabsTrigger>
          <TabsTrigger value="vehicles">Vehicles</TabsTrigger>
          <TabsTrigger value="drivers">Drivers</TabsTrigger>
          <TabsTrigger value="fuel-cards">Fuel Cards</TabsTrigger>
        </TabsList>

        {/* Fleet Accounts */}
        <TabsContent value="accounts" className="mt-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs text-muted-foreground">{fleetAccounts.length} active accounts</p>
            <Dialog open={newAccountDialogOpen} onOpenChange={setNewAccountDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1">
                  <Truck className="size-3" /> New Account
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Fleet Account</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium">Company Name</label>
                    <Input placeholder="Enter company name" className="mt-1" />
                  </div>
                  <div>
                    <label className="text-xs font-medium">Contact Person</label>
                    <Input placeholder="Enter contact name" className="mt-1" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium">Phone</label>
                      <Input placeholder="+92-XXX-XXXXXXX" className="mt-1" />
                    </div>
                    <div>
                      <label className="text-xs font-medium">Email</label>
                      <Input placeholder="email@company.pk" className="mt-1" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium">Credit Limit (Rs.)</label>
                      <Input type="number" placeholder="0" className="mt-1" />
                    </div>
                    <div>
                      <label className="text-xs font-medium">Daily Limit (Rs.)</label>
                      <Input type="number" placeholder="0" className="mt-1" />
                    </div>
                  </div>
                  <Button className="w-full" onClick={() => setNewAccountDialogOpen(false)}>Create Account</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {fleetAccounts.map((account) => (
              <Card key={account.id}>
                <CardHeader className="pb-2 p-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold">{account.companyName}</CardTitle>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 capitalize">{account.status}</Badge>
                  </div>
                  {account.contactPerson && (
                    <CardDescription className="text-[10px]">{account.contactPerson}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-2">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <DollarSign className="size-3" />
                      <span>Balance:</span>
                    </div>
                    <span className="font-bold text-amber-500">Rs. {Math.round(account.currentBalance).toLocaleString()}</span>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <span>Credit Limit:</span>
                    </div>
                    <span>Rs. {Math.round(account.creditLimit).toLocaleString()}</span>
                    {account.dailyLimit && (
                      <>
                        <div className="flex items-center gap-1 text-muted-foreground"><span>Daily Limit:</span></div>
                        <span>Rs. {Math.round(account.dailyLimit).toLocaleString()}</span>
                      </>
                    )}
                  </div>
                  <Separator />
                  <div className="flex gap-4 text-xs">
                    <div className="text-center">
                      <p className="font-bold">{account.vehicleCount}</p>
                      <p className="text-[10px] text-muted-foreground">Vehicles</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold">{account.driverCount}</p>
                      <p className="text-[10px] text-muted-foreground">Drivers</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold">{account.fuelCardCount}</p>
                      <p className="text-[10px] text-muted-foreground">Cards</p>
                    </div>
                  </div>
                  {account.fuelTypes && (
                    <div className="flex flex-wrap gap-1">
                      {account.fuelTypes.split(',').map((ft) => (
                        <Badge key={ft} variant="outline" className="text-[9px] px-1.5 py-0 capitalize">{ft.trim()}</Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Vehicles */}
        <TabsContent value="vehicles" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Vehicles</CardTitle>
              <CardDescription className="text-xs">{vehicles.length} registered vehicles</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="max-h-96">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Plate Number</TableHead>
                      <TableHead className="text-xs">Make / Model</TableHead>
                      <TableHead className="text-xs">Fuel Type</TableHead>
                      <TableHead className="text-xs">RFID Tag</TableHead>
                      <TableHead className="text-xs text-right">Daily Limit</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vehicles.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-xs text-muted-foreground py-8">No vehicles registered</TableCell>
                      </TableRow>
                    ) : (
                      vehicles.map((v) => (
                        <TableRow key={v.id}>
                          <TableCell className="text-xs font-medium font-mono">{v.plateNumber}</TableCell>
                          <TableCell className="text-xs">
                            {v.make || 'N/A'} {v.model || ''} {v.year || ''}
                          </TableCell>
                          <TableCell className="text-xs capitalize">{v.fuelType || 'N/A'}</TableCell>
                          <TableCell className="text-xs font-mono">{v.rfidTag || 'N/A'}</TableCell>
                          <TableCell className="text-xs text-right">
                            {v.dailyLimit ? `Rs. ${v.dailyLimit.toLocaleString()}` : 'No limit'}
                          </TableCell>
                          <TableCell>
                            <Badge variant={v.isActive ? 'outline' : 'secondary'} className="text-[10px] px-1.5 py-0">
                              {v.isActive ? 'Active' : 'Inactive'}
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

        {/* Drivers */}
        <TabsContent value="drivers" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Drivers</CardTitle>
              <CardDescription className="text-xs">{drivers.length} registered drivers</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="max-h-96">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Name</TableHead>
                      <TableHead className="text-xs">License #</TableHead>
                      <TableHead className="text-xs">Phone</TableHead>
                      <TableHead className="text-xs">RFID Card</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {drivers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-xs text-muted-foreground py-8">No drivers registered</TableCell>
                      </TableRow>
                    ) : (
                      drivers.map((d) => (
                        <TableRow key={d.id}>
                          <TableCell className="text-xs font-medium">{d.name}</TableCell>
                          <TableCell className="text-xs font-mono">{d.licenseNumber || 'N/A'}</TableCell>
                          <TableCell className="text-xs">{d.phone || 'N/A'}</TableCell>
                          <TableCell className="text-xs font-mono">{d.rfidCard || 'N/A'}</TableCell>
                          <TableCell>
                            <Badge variant={d.isActive ? 'outline' : 'secondary'} className="text-[10px] px-1.5 py-0">
                              {d.isActive ? 'Active' : 'Inactive'}
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

        {/* Fuel Cards */}
        <TabsContent value="fuel-cards" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Fuel Cards</CardTitle>
              <CardDescription className="text-xs">{fuelCards.length} active cards</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="max-h-96">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Card Number</TableHead>
                      <TableHead className="text-xs">Type</TableHead>
                      <TableHead className="text-xs">RFID Tag</TableHead>
                      <TableHead className="text-xs text-right">Balance</TableHead>
                      <TableHead className="text-xs text-right">Daily Limit</TableHead>
                      <TableHead className="text-xs text-right">Monthly Limit</TableHead>
                      <TableHead className="text-xs">Expiry</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fuelCards.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-xs text-muted-foreground py-8">No fuel cards found</TableCell>
                      </TableRow>
                    ) : (
                      fuelCards.map((fc) => (
                        <TableRow key={fc.id}>
                          <TableCell className="text-xs font-mono font-medium">{fc.cardNumber}</TableCell>
                          <TableCell className="text-xs capitalize">{fc.cardType}</TableCell>
                          <TableCell className="text-xs font-mono">{fc.rfidTag || 'N/A'}</TableCell>
                          <TableCell className="text-xs text-right font-medium">Rs. {Math.round(fc.balance).toLocaleString()}</TableCell>
                          <TableCell className="text-xs text-right">{fc.dailyLimit ? `Rs. ${fc.dailyLimit.toLocaleString()}` : 'No limit'}</TableCell>
                          <TableCell className="text-xs text-right">{fc.monthlyLimit ? `Rs. ${fc.monthlyLimit.toLocaleString()}` : 'No limit'}</TableCell>
                          <TableCell className="text-xs font-mono">
                            {fc.expiryDate ? new Date(fc.expiryDate).toLocaleDateString() : 'N/A'}
                          </TableCell>
                          <TableCell>
                            <Badge variant={fc.isActive ? 'outline' : 'secondary'} className="text-[10px] px-1.5 py-0">
                              {fc.isActive ? 'Active' : 'Inactive'}
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
