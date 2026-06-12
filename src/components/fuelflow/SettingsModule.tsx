'use client'

import { useState, useEffect } from 'react'
import {
  Settings,
  Cpu,
  Users,
  Bell,
  Link2,
  FileText,
  AlertTriangle,
  Building2,
  MapPin,
  Clock,
  Wifi,
  WifiOff,
  CheckCircle2,
  Shield,
  Save,
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
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface Station {
  id: string
  name: string
  code: string
  address: string | null
  city: string | null
  operatingHours: string | null
  timezone: string
  taxRate: number
  currency: string
  stationType: string
  phone: string | null
  email: string | null
}

interface HardwareDevice {
  id: string
  name: string
  code: string
  type: string
  status: string
  ipAddress: string | null
  port: number | null
  isActive: boolean
}

interface AuditLog {
  id: string
  action: string
  entity: string
  entityId: string | null
  details: string | null
  ipAddress: string | null
  createdAt: string
  user: { id: string; name: string; email: string; role: string } | null
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i}><CardContent className="p-4"><Skeleton className="h-40 w-full" /></CardContent></Card>
      ))}
    </div>
  )
}

const ROLE_COLORS: Record<string, string> = {
  superadmin: 'bg-red-500/10 text-red-600 border-red-500/20',
  admin: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  manager: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  operator: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  cashier: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  attendant: 'bg-slate-500/10 text-slate-600 border-slate-500/20',
  viewer: 'bg-slate-500/10 text-slate-600 border-slate-500/20',
}

export default function SettingsModule() {
  const [station, setStation] = useState<Station | null>(null)
  const [dispensers, setDispensers] = useState<Array<{ id: string; name: string; code: string; manufacturer: string | null; status: string; ipAddress: string | null; isActive: boolean }>>([])
  const [tanks, setTanks] = useState<Array<{ id: string; name: string; code: string; atgType: string | null; atgIpAddress: string | null; status: string; isActive: boolean }>>([])
  const [rfidReaders, setRfidReaders] = useState<Array<{ id: string; name: string; code: string; readerType: string; status: string; isActive: boolean }>>([])
  const [anprCameras, setAnprCameras] = useState<Array<{ id: string; name: string; code: string; location: string | null; status: string; isActive: boolean }>>([])
  const [priceBoards, setPriceBoards] = useState<Array<{ id: string; name: string; boardType: string; status: string; isActive: boolean }>>([])
  const [users, setUsers] = useState<Array<{ id: string; name: string; email: string; role: string; isActive: boolean; lastLogin: string | null }>>([])
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('station')
  const [entityFilter, setEntityFilter] = useState('all')

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const [stationsRes, dispensersRes, tanksRes, auditRes] = await Promise.all([
          fetch('/api/stations'),
          fetch('/api/dispensers'),
          fetch('/api/tanks'),
          fetch('/api/audit'),
        ])

        if (stationsRes.ok) {
          const data = await stationsRes.json()
          const stations = data.stations || []
          if (stations.length > 0) {
            setStation(stations[0])
          }
        }
        if (dispensersRes.ok) {
          const data = await dispensersRes.json()
          setDispensers(data.dispensers || [])
        }
        if (tanksRes.ok) {
          const data = await tanksRes.json()
          setTanks(data.tanks || [])
        }
        if (auditRes.ok) {
          const data = await auditRes.json()
          setAuditLogs(data.logs || [])
        }

        // Fetch additional hardware
        try {
          const rfidRes = await fetch('/api/rfid-readers')
          if (rfidRes.ok) {
            const data = await rfidRes.json()
            setRfidReaders(data.readers || [])
          }
        } catch {}
        try {
          const anprRes = await fetch('/api/anpr-cameras')
          if (anprRes.ok) {
            const data = await anprRes.json()
            setAnprCameras(data.cameras || [])
          }
        } catch {}
        try {
          const boardsRes = await fetch('/api/price-boards')
          if (boardsRes.ok) {
            const data = await boardsRes.json()
            setPriceBoards(data.boards || [])
          }
        } catch {}
        try {
          const usersRes = await fetch('/api/users')
          if (usersRes.ok) {
            const data = await usersRes.json()
            setUsers(data.users || [])
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

  const filteredLogs = entityFilter === 'all'
    ? auditLogs
    : auditLogs.filter(l => l.entity === entityFilter)

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="station">Station</TabsTrigger>
          <TabsTrigger value="hardware">Hardware</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
        </TabsList>

        {/* Station Config */}
        <TabsContent value="station" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Building2 className="size-4 text-amber-500" />
                <CardTitle className="text-sm font-semibold">Station Configuration</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {station && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium">Station Name</label>
                    <Input defaultValue={station.name} className="mt-1 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-medium">Station Code</label>
                    <Input defaultValue={station.code} className="mt-1 text-sm" readOnly />
                  </div>
                  <div>
                    <label className="text-xs font-medium">Address</label>
                    <Input defaultValue={station.address || ''} className="mt-1 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-medium">City</label>
                    <Input defaultValue={station.city || ''} className="mt-1 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-medium">Phone</label>
                    <Input defaultValue={station.phone || ''} className="mt-1 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-medium">Email</label>
                    <Input defaultValue={station.email || ''} className="mt-1 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-medium">Operating Hours</label>
                    <Input defaultValue={station.operatingHours || '24/7'} className="mt-1 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-medium">Timezone</label>
                    <Input defaultValue={station.timezone} className="mt-1 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-medium">Tax Rate (%)</label>
                    <Input type="number" defaultValue={station.taxRate} className="mt-1 text-sm" step="0.1" />
                  </div>
                  <div>
                    <label className="text-xs font-medium">Currency</label>
                    <Input defaultValue={station.currency} className="mt-1 text-sm" readOnly />
                  </div>
                </div>
              )}
              <Button className="gap-1">
                <Save className="size-4" /> Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Hardware */}
        <TabsContent value="hardware" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Cpu className="size-4 text-amber-500" />
                <CardTitle className="text-sm font-semibold">Device Inventory</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-96">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Device</TableHead>
                      <TableHead className="text-xs">Type</TableHead>
                      <TableHead className="text-xs">Code</TableHead>
                      <TableHead className="text-xs">IP</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {/* Dispensers */}
                    {dispensers.map((d) => (
                      <TableRow key={`disp-${d.id}`}>
                        <TableCell className="text-xs font-medium">{d.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0">Dispenser</Badge>
                        </TableCell>
                        <TableCell className="text-xs font-mono">{d.code}</TableCell>
                        <TableCell className="text-xs font-mono">{d.ipAddress || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge
                            variant={d.status === 'error' || d.status === 'maintenance' ? 'destructive' : d.status === 'idle' ? 'outline' : 'secondary'}
                            className="text-[10px] px-1.5 py-0 capitalize"
                          >
                            {d.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {/* Tanks/ATG */}
                    {tanks.map((t) => (
                      <TableRow key={`tank-${t.id}`}>
                        <TableCell className="text-xs font-medium">{t.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0">ATG</Badge>
                        </TableCell>
                        <TableCell className="text-xs font-mono">{t.code}</TableCell>
                        <TableCell className="text-xs font-mono">{t.atgIpAddress || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge
                            variant={t.status === 'critical' ? 'destructive' : 'outline'}
                            className="text-[10px] px-1.5 py-0 capitalize"
                          >
                            {t.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {/* RFID Readers */}
                    {rfidReaders.map((r) => (
                      <TableRow key={`rfid-${r.id}`}>
                        <TableCell className="text-xs font-medium">{r.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0">RFID</Badge>
                        </TableCell>
                        <TableCell className="text-xs font-mono">{r.code}</TableCell>
                        <TableCell className="text-xs">-</TableCell>
                        <TableCell>
                          <Badge
                            variant={r.status === 'online' ? 'outline' : 'destructive'}
                            className="text-[10px] px-1.5 py-0 capitalize"
                          >
                            {r.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {/* ANPR Cameras */}
                    {anprCameras.map((c) => (
                      <TableRow key={`anpr-${c.id}`}>
                        <TableCell className="text-xs font-medium">{c.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0">ANPR</Badge>
                        </TableCell>
                        <TableCell className="text-xs font-mono">{c.code}</TableCell>
                        <TableCell className="text-xs">-</TableCell>
                        <TableCell>
                          <Badge
                            variant={c.status === 'online' ? 'outline' : 'destructive'}
                            className="text-[10px] px-1.5 py-0 capitalize"
                          >
                            {c.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {/* Price Boards */}
                    {priceBoards.map((pb) => (
                      <TableRow key={`pb-${pb.id}`}>
                        <TableCell className="text-xs font-medium">{pb.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0">Price Board</Badge>
                        </TableCell>
                        <TableCell className="text-xs">{pb.boardType.toUpperCase()}</TableCell>
                        <TableCell className="text-xs">-</TableCell>
                        <TableCell>
                          <Badge
                            variant={pb.status === 'online' ? 'outline' : 'destructive'}
                            className="text-[10px] px-1.5 py-0 capitalize"
                          >
                            {pb.status}
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

        {/* Users */}
        <TabsContent value="users" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="size-4 text-amber-500" />
                  <CardTitle className="text-sm font-semibold">User Management</CardTitle>
                </div>
                <Button size="sm" className="gap-1 text-xs"><Users className="size-3" /> Add User</Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Name</TableHead>
                    <TableHead className="text-xs">Email</TableHead>
                    <TableHead className="text-xs">Role</TableHead>
                    <TableHead className="text-xs">Last Login</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-xs text-muted-foreground py-8">No users found</TableCell>
                    </TableRow>
                  ) : (
                    users.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="text-xs font-medium">{u.name}</TableCell>
                        <TableCell className="text-xs">{u.email}</TableCell>
                        <TableCell>
                          <Badge className={`text-[9px] px-1.5 py-0 border capitalize ${ROLE_COLORS[u.role] || ''}`}>
                            {u.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs font-mono">
                          {u.lastLogin ? new Date(u.lastLogin).toLocaleString() : 'Never'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={u.isActive ? 'outline' : 'secondary'} className="text-[10px] px-1.5 py-0">
                            {u.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Bell className="size-4 text-amber-500" />
                <CardTitle className="text-sm font-semibold">Notification Preferences</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {['Fuel Loss Alerts', 'Stock Level Warnings', 'Shift Open/Close', 'Delivery Notifications', 'AI Alert Notifications', 'Maintenance Reminders', 'Price Change Alerts'].map((pref) => (
                <div key={pref} className="flex items-center justify-between border-b pb-3">
                  <div>
                    <p className="text-xs font-medium">{pref}</p>
                    <p className="text-[10px] text-muted-foreground">Receive {pref.toLowerCase()}</p>
                  </div>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">Enabled</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations */}
        <TabsContent value="integrations" className="mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { name: 'Forecourt Controller', desc: 'PTS/Fusion/DOMS pump controller', icon: Cpu, status: 'connected' },
              { name: 'ATG System', desc: 'Veeder-Root tank gauge', icon: Cpu, status: 'connected' },
              { name: 'Payment Gateway', desc: 'Card payment processing', icon: Shield, status: 'connected' },
              { name: 'RFID System', desc: 'Vehicle & driver identification', icon: Wifi, status: 'connected' },
              { name: 'ANPR System', desc: 'License plate recognition', icon: Cpu, status: 'connected' },
              { name: 'Price Board Controller', desc: 'LED/Digital price display', icon: Cpu, status: 'connected' },
            ].map((integration) => (
              <Card key={integration.name}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`flex size-10 items-center justify-center rounded-lg ${
                      integration.status === 'connected' ? 'bg-emerald-500/10' : 'bg-red-500/10'
                    }`}>
                      <integration.icon className={`size-5 ${
                        integration.status === 'connected' ? 'text-emerald-500' : 'text-red-500'
                      }`} />
                    </div>
                    <div>
                      <p className="text-xs font-medium">{integration.name}</p>
                      <p className="text-[10px] text-muted-foreground">{integration.desc}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <Badge
                      variant={integration.status === 'connected' ? 'outline' : 'destructive'}
                      className={`text-[10px] px-1.5 py-0 ${
                        integration.status === 'connected' ? 'text-emerald-600 border-emerald-500/30 bg-emerald-500/10' : ''
                      }`}
                    >
                      {integration.status === 'connected' ? 'Connected' : 'Disconnected'}
                    </Badge>
                    <Button size="sm" variant="ghost" className="h-6 text-[10px]">Configure</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Audit Log */}
        <TabsContent value="audit" className="mt-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs text-muted-foreground">{filteredLogs.length} log entries</p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Filter:</span>
              <Select value={entityFilter} onValueChange={setEntityFilter}>
                <SelectTrigger className="h-7 w-32 text-xs">
                  <SelectValue placeholder="Entity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="dispenser">Dispenser</SelectItem>
                  <SelectItem value="tank">Tank</SelectItem>
                  <SelectItem value="shift">Shift</SelectItem>
                  <SelectItem value="price">Price</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Card>
            <CardContent className="p-0">
              <ScrollArea className="max-h-96">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Action</TableHead>
                      <TableHead className="text-xs">Entity</TableHead>
                      <TableHead className="text-xs">User</TableHead>
                      <TableHead className="text-xs">Details</TableHead>
                      <TableHead className="text-xs">IP</TableHead>
                      <TableHead className="text-xs">Timestamp</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-xs text-muted-foreground py-8">No audit logs</TableCell>
                      </TableRow>
                    ) : (
                      filteredLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="text-xs font-medium capitalize">{log.action}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[9px] px-1.5 py-0 capitalize">{log.entity}</Badge>
                          </TableCell>
                          <TableCell className="text-xs">{log.user?.name || 'System'}</TableCell>
                          <TableCell className="text-xs text-muted-foreground max-w-32 truncate">{log.details || '-'}</TableCell>
                          <TableCell className="text-xs font-mono">{log.ipAddress || '-'}</TableCell>
                          <TableCell className="text-xs font-mono">{new Date(log.createdAt).toLocaleString()}</TableCell>
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
