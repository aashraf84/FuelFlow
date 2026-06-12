'use client'

import {
  Settings,
  Building2,
  Cpu,
  Fuel,
  Wifi,
  Camera,
  Radio,
  Users,
  Shield,
  Bell,
  Database,
  Key,
  Layout,
  HardDrive,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

const DISPENSER_MANUFACTURERS = [
  { name: 'Tatsuno', models: ['TK6', 'TK7', 'Gemini'], controllerType: 'PTS' },
  { name: 'Gilbarco', models: ['Encore', 'Assyst', 'SK700'], controllerType: 'Fusion' },
  { name: 'Wayne', models: ['Helix', 'iX', 'Quantum'], controllerType: 'DOMS' },
  { name: 'Tokheim', models: ['Quantum', 'System 3'], controllerType: 'PTS' },
  { name: 'Hectronic', models: ['eco', 'premium'], controllerType: 'Hectronic' },
  { name: 'Nuovo Pignone', models: ['NP', 'Compact'], controllerType: 'PTS' },
]

const CONTROLLER_TYPES = [
  { name: 'PTS (Pump Terminal Server)', protocol: 'TCP/IP', description: 'Universal pump controller supporting multiple brands' },
  { name: 'Fusion', protocol: 'TCP/IP', description: 'Gilbarco Veeder-Root native controller' },
  { name: 'DOMS', protocol: 'TCP/IP', description: 'Wayne/Dresser native controller' },
  { name: 'Hectronic', protocol: 'RS485/TCP', description: 'Hectronic proprietary protocol' },
  { name: 'Backoffice', protocol: 'TCP/IP', description: 'Generic backoffice integration' },
]

const ATG_TYPES = [
  { name: 'Veeder-Root', models: ['TLS-350', 'TLS-450', 'TLS4i'], protocol: 'TCP/IP' },
  { name: 'OPW', models: ['SiteSentinel', 'Maglink'], protocol: 'TCP/IP' },
  { name: 'Franklin', models: ['Fuelling Server', 'FS-1'], protocol: 'TCP/IP' },
  { name: 'Dresser', models: ['Wayne ATG'], protocol: 'RS485' },
]

const DEVICE_STATUS = [
  { name: 'RFID Reader 01', type: 'rfid', status: 'online', location: 'Forecourt Lane 1' },
  { name: 'RFID Reader 02', type: 'rfid', status: 'online', location: 'Forecourt Lane 2' },
  { name: 'ANPR Camera 01', type: 'anpr', status: 'online', location: 'Entry Gate' },
  { name: 'ANPR Camera 02', type: 'anpr', status: 'offline', location: 'Exit Gate' },
]

function DeviceStatusBadge({ status }: { status: string }) {
  const configs: Record<string, { className: string }> = {
    online: { className: 'bg-emerald-500/10 text-emerald-600 border-emerald-200' },
    offline: { className: 'bg-red-500/10 text-red-600 border-red-200' },
    error: { className: 'bg-amber-500/10 text-amber-600 border-amber-200' },
  }
  const config = configs[status] || configs.offline
  return (
    <Badge variant="outline" className={`text-[10px] ${config.className}`}>
      <div className={`size-1.5 rounded-full mr-1 ${status === 'online' ? 'bg-emerald-500' : status === 'error' ? 'bg-amber-500' : 'bg-red-500'}`} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  )
}

export default function SettingsModule() {
  return (
    <div className="module-enter space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-amber-500/10">
          <Settings className="size-5 text-amber-500" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Settings</h2>
          <p className="text-sm text-muted-foreground">
            System configuration, integrations, and user management
          </p>
        </div>
      </div>

      <Tabs defaultValue="station">
        <TabsList className="flex-wrap">
          <TabsTrigger value="station" className="text-xs">Station</TabsTrigger>
          <TabsTrigger value="hardware" className="text-xs">Hardware</TabsTrigger>
          <TabsTrigger value="devices" className="text-xs">RFID/ANPR</TabsTrigger>
          <TabsTrigger value="users" className="text-xs">Users</TabsTrigger>
        </TabsList>

        <TabsContent value="station" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="cursor-pointer hover:border-amber-500/30 transition-colors">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Building2 className="size-4 text-amber-500" />
                  Station Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">Name, location, operating hours, and contact details</p>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:border-amber-500/30 transition-colors">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Bell className="size-4 text-amber-500" />
                  Notification Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">Configure alert thresholds and notification channels</p>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:border-amber-500/30 transition-colors">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Database className="size-4 text-amber-500" />
                  Backup & Recovery
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">Data backup scheduling and disaster recovery options</p>
                <Badge variant="secondary" className="text-[10px] mt-2">Coming Soon</Badge>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:border-amber-500/30 transition-colors">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Layout className="size-4 text-amber-500" />
                  Display Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">Customize dashboard layout and default views</p>
                <Badge variant="secondary" className="text-[10px] mt-2">Coming Soon</Badge>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="hardware" className="space-y-4 mt-4">
          {/* Dispenser Manufacturers */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Fuel className="size-4 text-amber-500" />
                Supported Dispenser Manufacturers
              </CardTitle>
              <CardDescription>Compatible pump hardware and controller integrations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {DISPENSER_MANUFACTURERS.map((mfr) => (
                  <div key={mfr.name} className="bg-muted/50 rounded-lg p-3 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{mfr.name}</p>
                      <Badge variant="outline" className="text-[10px]">{mfr.controllerType}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {mfr.models.map(model => (
                        <Badge key={model} variant="secondary" className="text-[10px]">{model}</Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Controller Types */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Cpu className="size-4 text-amber-500" />
                Controller Types
              </CardTitle>
              <CardDescription>Pump controller communication protocols</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {CONTROLLER_TYPES.map((ctrl) => (
                  <div key={ctrl.name} className="flex items-start gap-3 bg-muted/50 rounded-lg p-3">
                    <div className="flex size-8 items-center justify-center rounded bg-amber-500/10 flex-shrink-0">
                      <HardDrive className="size-4 text-amber-500" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{ctrl.name}</p>
                        <Badge variant="outline" className="text-[10px] gap-1">
                          <Wifi className="size-2.5" />
                          {ctrl.protocol}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{ctrl.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* ATG Types */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Fuel className="size-4 text-amber-500" />
                ATG Systems
              </CardTitle>
              <CardDescription>Automatic Tank Gauging system integrations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {ATG_TYPES.map((atg) => (
                  <div key={atg.name} className="bg-muted/50 rounded-lg p-3 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{atg.name}</p>
                      <Badge variant="outline" className="text-[10px] gap-1">
                        <Wifi className="size-2.5" />
                        {atg.protocol}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {atg.models.map(model => (
                        <Badge key={model} variant="secondary" className="text-[10px]">{model}</Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="devices" className="space-y-4 mt-4">
          {/* RFID Readers */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Radio className="size-4 text-amber-500" />
                RFID Readers
              </CardTitle>
              <CardDescription>Vehicle and driver identification systems</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {DEVICE_STATUS.filter(d => d.type === 'rfid').map((device) => (
                  <div key={device.name} className="flex items-center justify-between bg-muted/50 rounded-lg p-3">
                    <div className="flex items-center gap-3">
                      <Radio className="size-4 text-amber-500" />
                      <div>
                        <p className="text-sm font-medium">{device.name}</p>
                        <p className="text-xs text-muted-foreground">{device.location}</p>
                      </div>
                    </div>
                    <DeviceStatusBadge status={device.status} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* ANPR Cameras */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Camera className="size-4 text-amber-500" />
                ANPR Cameras
              </CardTitle>
              <CardDescription>Automatic Number Plate Recognition system</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {DEVICE_STATUS.filter(d => d.type === 'anpr').map((device) => (
                  <div key={device.name} className="flex items-center justify-between bg-muted/50 rounded-lg p-3">
                    <div className="flex items-center gap-3">
                      <Camera className="size-4 text-amber-500" />
                      <div>
                        <p className="text-sm font-medium">{device.name}</p>
                        <p className="text-xs text-muted-foreground">{device.location}</p>
                      </div>
                    </div>
                    <DeviceStatusBadge status={device.status} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="size-4 text-amber-500" />
                User Management
              </CardTitle>
              <CardDescription>Create and manage user accounts and permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Shield className="size-4 text-amber-500" />
                    <p className="text-sm font-medium">Role-Based Access</p>
                  </div>
                  <div className="space-y-1">
                    {[
                      { role: 'Super Admin', desc: 'Full system access across all stations' },
                      { role: 'Admin', desc: 'Station management and configuration' },
                      { role: 'Manager', desc: 'Operations and reporting access' },
                      { role: 'Operator', desc: 'Shift operations and POS access' },
                      { role: 'Viewer', desc: 'Read-only dashboard access' },
                    ].map(r => (
                      <div key={r.role} className="flex items-center justify-between text-xs py-1 border-b border-border/30 last:border-0">
                        <span className="font-medium">{r.role}</span>
                        <span className="text-muted-foreground">{r.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Key className="size-4 text-amber-500" />
                    <p className="text-sm font-medium">API Access</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Manage API keys for third-party integrations, webhook endpoints, and external system access.
                  </p>
                  <Badge variant="secondary" className="text-[10px]">Coming Soon</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
