'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Cpu, Wifi, WifiOff, CreditCard, Zap, Gauge, Droplets, Radio,
  RefreshCw, ChevronRight, Clock, AlertTriangle, CheckCircle2,
  XCircle, ArrowUpDown, Send, Command, Monitor, Server,
  Cable, Plug, Wrench, Fuel, Activity, HardDrive, Database,
  Play, Square, RotateCcw, Eye, Search, Filter, Loader2,
  Plus, X, Key, Shield, Copy, Check, User,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { useAppStore } from '@/stores/app-store'

// ── Owner Registration Types ────────────────────

interface OwnerRegistrationResult {
  success: boolean
  message: string
  credentials: {
    email: string
    password: string
    apiKey: string
    ownerId: string
  }
  serialKey: {
    key: string
    plan: string
    maxStations: number
    maxDispensers: number
    maxUsers: number
    expiresAt: string
    status: string
  }
  device: {
    id: string
    name: string
    type: string
    status: string
  }
  owner: {
    id: string
    companyName: string
    slug: string
    contactPerson: string
    status: string
  }
}

// ── Types ──────────────────────────────────────

interface DeviceCategory {
  type: string
  icon: React.ElementType
  count: number
  online: number
  color: string
}

interface ConnectedDevice {
  id: string
  name: string
  type: string
  brand: string
  protocol: string
  status: string
  lastSeen: string
  ip: string
}

interface CommandEntry {
  id: string
  deviceType: string
  deviceId: string
  command: string
  priority: string
  status: string
  retryCount: number
  maxRetries: number
  createdAt: string
  parameters?: string | null
}

interface EventEntry {
  id: string
  deviceType: string
  deviceId: string
  eventType: string
  severity: string
  message: string
  createdAt: string
}

interface ForecourtController {
  id: string
  name: string
  manufacturer: string
  model: string
  ipAddress: string | null
  port: number | null
  protocol: string | null
  status: string
  firmwareVersion: string | null
  serialNumber: string | null
  lastHeartbeat: Date | null
  lastCommunication: Date | null
  connectedDispensers: number | null
  maxDispensers: number | null
  dispensers?: Array<{
    id: string
    name: string
    code: string
    status: string
    nozzleCount: number
  }>
  station?: { id: string; name: string; code: string }
}

interface HardwareCatalogItem {
  id: string
  manufacturer: string
  modelName: string
  category: string
  supportedProtocols?: string
  communicationTypes?: string
  description?: string | null
  isActive: boolean
}

interface CommProtocol {
  id: string
  name: string
  protocolType: string | null
  transportType: string | null
  version: string | null
  description: string | null
  isActive: boolean
  connections?: Array<Record<string, unknown>>
}

interface StationOption {
  id: string
  name: string
  code: string
}

// ── Device Category Options ──────────────────────────────

const DEVICE_CATEGORIES = [
  { value: 'controller', label: 'Forecourt Controller', icon: Server },
  { value: 'dispenser', label: 'Dispenser / Pump', icon: Fuel },
  { value: 'payment_terminal', label: 'Payment Terminal', icon: CreditCard },
  { value: 'atg', label: 'ATG / Tank Gauge', icon: Droplets },
  { value: 'price_board', label: 'Price Board / Display', icon: Monitor },
  { value: 'camera', label: 'Surveillance Camera', icon: Eye },
  { value: 'rfid_reader', label: 'RFID Reader', icon: Radio },
  { value: 'anpr_camera', label: 'ANPR Camera', icon: Eye },
  { value: 'generator', label: 'Generator', icon: Zap },
  { value: 'fire_alarm', label: 'Fire Alarm System', icon: AlertTriangle },
  { value: 'utility_meter', label: 'Utility Meter', icon: Gauge },
  { value: 'weather_station', label: 'Weather Station', icon: Activity },
  { value: 'tanker_tracker', label: 'Tanker Tracker', icon: Radio },
  { value: 'car_wash', label: 'Car Wash System', icon: Droplets },
  { value: 'air_compressor', label: 'Air Compressor', icon: Cpu },
  { value: 'vacuum_station', label: 'Vacuum Station', icon: Cpu },
] as const

const COMM_TYPES = ['tcpip', 'serial', 'rs485', 'mqtt', 'http', 'wiegand', 'modbus', 'ifsf', 'other'] as const

// ── Helpers ──────────────────────────────────────

const STATUS_MAP: Record<string, { dot: string; text: string }> = {
  online: { dot: 'macos-status-online', text: 'text-emerald-600 dark:text-emerald-400' },
  warning: { dot: 'macos-status-warning', text: 'text-teal-600 dark:text-teal-400' },
  offline: { dot: 'macos-status-offline', text: 'text-muted-foreground' },
  error: { dot: 'macos-status-error', text: 'text-red-600 dark:text-red-400' },
  idle: { dot: 'macos-status-online', text: 'text-emerald-600 dark:text-emerald-400' },
  active: { dot: 'macos-status-online', text: 'text-emerald-600 dark:text-emerald-400' },
  fueling: { dot: 'macos-status-warning', text: 'text-teal-600 dark:text-teal-400' },
  disabled: { dot: 'macos-status-offline', text: 'text-muted-foreground' },
  maintenance: { dot: 'macos-status-warning', text: 'text-teal-600 dark:text-teal-400' },
  busy: { dot: 'macos-status-warning', text: 'text-teal-600 dark:text-teal-400' },
  standby: { dot: 'macos-status-offline', text: 'text-muted-foreground' },
  recording: { dot: 'macos-status-online', text: 'text-emerald-600 dark:text-emerald-400' },
  moving: { dot: 'macos-status-online', text: 'text-emerald-600 dark:text-emerald-400' },
  parked: { dot: 'macos-status-offline', text: 'text-muted-foreground' },
  running: { dot: 'macos-status-online', text: 'text-emerald-600 dark:text-emerald-400' },
  normal: { dot: 'macos-status-online', text: 'text-emerald-600 dark:text-emerald-400' },
}

const PRIORITY_MAP: Record<string, string> = {
  critical: 'bg-red-500/10 text-red-600 border-red-500/20',
  high: 'bg-teal-500/10 text-teal-600 border-teal-500/20',
  medium: 'bg-sky-500/10 text-sky-600 border-sky-500/20',
  low: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
}

const CMD_STATUS_MAP: Record<string, { icon: React.ElementType; color: string }> = {
  executing: { icon: Play, color: 'text-teal-500' },
  queued: { icon: Clock, color: 'text-sky-500' },
  completed: { icon: CheckCircle2, color: 'text-emerald-500' },
  retrying: { icon: RotateCcw, color: 'text-teal-500' },
  failed: { icon: XCircle, color: 'text-red-500' },
}

const EVENT_LEVEL_MAP: Record<string, string> = {
  info: 'text-muted-foreground',
  success: 'text-emerald-600 dark:text-emerald-400',
  warning: 'text-teal-600 dark:text-teal-400',
  error: 'text-red-600 dark:text-red-400',
  critical: 'text-red-600 dark:text-red-400',
}

const DEVICE_TYPE_ICONS: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  forecourt_controller: { icon: Server, color: '#30d158', label: 'Forecourt Controllers' },
  payment_terminal: { icon: CreditCard, color: '#ff9f0a', label: 'Payment Terminals' },
  generator: { icon: Zap, color: '#ffd60a', label: 'Generators' },
  surveillance_camera: { icon: Eye, color: '#64d2ff', label: 'Surveillance Cameras' },
  fire_alarm: { icon: AlertTriangle, color: '#ff375f', label: 'Fire Alarm Systems' },
  utility_meter: { icon: Gauge, color: '#e8930c', label: 'Utility Meters' },
  weather_station: { icon: Activity, color: '#64d2ff', label: 'Weather Stations' },
  tanker_tracker: { icon: Radio, color: '#bf5af2', label: 'Tanker Trackers' },
  car_wash: { icon: Zap, color: '#ffd60a', label: 'Car Wash Systems' },
  air_compressor: { icon: Cpu, color: '#ff9f0a', label: 'Air Compressors' },
  vacuum_station: { icon: Cpu, color: '#bf5af2', label: 'Vacuum Stations' },
  dispenser: { icon: Fuel, color: '#e8930c', label: 'Dispensers' },
  anpr_camera: { icon: Eye, color: '#64d2ff', label: 'ANPR Cameras' },
  rfid_reader: { icon: Radio, color: '#bf5af2', label: 'RFID Readers' },
  price_board: { icon: Monitor, color: '#ff375f', label: 'Price Boards' },
  atg: { icon: Droplets, color: '#34c759', label: 'ATG Systems' },
}

function timeAgo(date: Date | string | null): string {
  if (!date) return 'N/A'
  const d = typeof date === 'string' ? new Date(date) : date
  const diff = Date.now() - d.getTime()
  if (diff < 60000) return 'just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  return `${Math.floor(diff / 86400000)}d ago`
}

// ── Skeleton ──────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-muted ${className ?? ''}`} />
}

// ── Form Field Helper ──
function FormField({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[11px] font-medium text-muted-foreground">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </Label>
      {children}
    </div>
  )
}

// ── Add Device Form ──
function AddDeviceForm({
  stations,
  controllers,
  submitting,
  onSubmit,
  onCancel,
}: {
  stations: StationOption[]
  controllers: ForecourtController[]
  submitting: boolean
  onSubmit: (data: Record<string, string>) => void
  onCancel: () => void
}) {
  const [category, setCategory] = useState('')
  const [form, setForm] = useState<Record<string, string>>({})

  const updateField = (key: string, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({ category, ...form })
  }

  const selectedCat = DEVICE_CATEGORIES.find(c => c.value === category)

  return (
    <form onSubmit={handleSubmit} className="space-y-4" style={{ fontStyle: 'normal' }}>
      {/* Category Selector */}
      <div className="macos-group">
        <div className="macos-group-item">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground font-medium">Device Category</span>
            <span className="text-[10px] text-muted-foreground">{DEVICE_CATEGORIES.length} types available</span>
          </div>
        </div>
        <div className="p-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
          {DEVICE_CATEGORIES.map(cat => {
            const Icon = cat.icon
            return (
              <button
                key={cat.value}
                type="button"
                onClick={() => { setCategory(cat.value); setForm({}) }}
                className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-[11px] font-medium transition-all ${
                  category === cat.value
                    ? 'bg-teal-500/15 text-teal-700 dark:text-teal-400 ring-1 ring-teal-500/30'
                    : 'text-muted-foreground hover:bg-black/[0.03] dark:hover:bg-white/[0.04]'
                }`}
              >
                <Icon className="size-3.5 shrink-0" />
                <span className="truncate">{cat.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {category && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {/* Common Fields */}
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Station" required>
              <Select value={form.stationId || ''} onValueChange={v => updateField('stationId', v)}>
                <SelectTrigger className="h-8 text-[12px]">
                  <SelectValue placeholder="Select station" />
                </SelectTrigger>
                <SelectContent>
                  {stations.map(s => (
                    <SelectItem key={s.id} value={s.id} className="text-[12px]">{s.name} ({s.code})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Device Code" required>
              <Input className="h-8 text-[12px]" placeholder="e.g. DSP-007" value={form.code || ''} onChange={e => updateField('code', e.target.value)} />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Device Name" required>
              <Input className="h-8 text-[12px]" placeholder="e.g. Pump #7 Island B" value={form.name || ''} onChange={e => updateField('name', e.target.value)} />
            </FormField>
            <FormField label="Manufacturer">
              <Input className="h-8 text-[12px]" placeholder="e.g. Gilbarco" value={form.manufacturer || ''} onChange={e => updateField('manufacturer', e.target.value)} />
            </FormField>
          </div>

          {/* Controller-specific fields */}
          {category === 'controller' && (
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Controller Type" required>
                <Select value={form.controllerType || ''} onValueChange={v => updateField('controllerType', v)}>
                  <SelectTrigger className="h-8 text-[12px]">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {['IFSF', 'DOMS', 'TATSUNO', 'WAYNE', 'GILBARCO', 'VEEDER-ROOT'].map(t => (
                      <SelectItem key={t} value={t} className="text-[12px]">{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="Model">
                <Input className="h-8 text-[12px]" placeholder="e.g. ENC-7000" value={form.model || ''} onChange={e => updateField('model', e.target.value)} />
              </FormField>
              <FormField label="IP Address">
                <Input className="h-8 text-[12px] font-mono" placeholder="192.168.1.100" value={form.ipAddress || ''} onChange={e => updateField('ipAddress', e.target.value)} />
              </FormField>
              <FormField label="Port">
                <Input className="h-8 text-[12px] font-mono" placeholder="5000" value={form.port || ''} onChange={e => updateField('port', e.target.value)} />
              </FormField>
              <FormField label="Communication">
                <Select value={form.communicationType || ''} onValueChange={v => updateField('communicationType', v)}>
                  <SelectTrigger className="h-8 text-[12px]">
                    <SelectValue placeholder="Select comm type" />
                  </SelectTrigger>
                  <SelectContent>
                    {COMM_TYPES.map(t => (
                      <SelectItem key={t} value={t} className="text-[12px]">{t.toUpperCase()}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="Max Dispensers">
                <Input className="h-8 text-[12px]" type="number" placeholder="32" value={form.maxDispensers || ''} onChange={e => updateField('maxDispensers', e.target.value)} />
              </FormField>
              <FormField label="Serial Number">
                <Input className="h-8 text-[12px] font-mono" placeholder="SN-XXXX" value={form.serialNumber || ''} onChange={e => updateField('serialNumber', e.target.value)} />
              </FormField>
              <FormField label="Firmware Version">
                <Input className="h-8 text-[12px] font-mono" placeholder="v1.2.3" value={form.firmwareVersion || ''} onChange={e => updateField('firmwareVersion', e.target.value)} />
              </FormField>
              <FormField label="Polling Interval (ms)">
                <Input className="h-8 text-[12px]" type="number" placeholder="1000" value={form.pollingInterval || ''} onChange={e => updateField('pollingInterval', e.target.value)} />
              </FormField>
              <FormField label="Timeout (ms)">
                <Input className="h-8 text-[12px]" type="number" placeholder="5000" value={form.timeout || ''} onChange={e => updateField('timeout', e.target.value)} />
              </FormField>
            </div>
          )}

          {/* Dispenser-specific fields */}
          {category === 'dispenser' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Forecourt Controller" required>
                  <Select value={form.forecourtControllerId || ''} onValueChange={v => updateField('forecourtControllerId', v)}>
                    <SelectTrigger className="h-8 text-[12px]">
                      <SelectValue placeholder="Select controller" />
                    </SelectTrigger>
                    <SelectContent>
                      {controllers.map(c => (
                        <SelectItem key={c.id} value={c.id} className="text-[12px]">{c.name} ({c.code})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
                <FormField label="Model">
                  <Input className="h-8 text-[12px]" placeholder="e.g. SK700-II" value={form.model || ''} onChange={e => updateField('model', e.target.value)} />
                </FormField>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Pump Lane">
                  <Input className="h-8 text-[12px]" type="number" placeholder="1" value={form.pumpLane || ''} onChange={e => updateField('pumpLane', e.target.value)} />
                </FormField>
                <FormField label="Pump Address">
                  <Input className="h-8 text-[12px]" type="number" placeholder="1" value={form.pumpAddress || ''} onChange={e => updateField('pumpAddress', e.target.value)} />
                </FormField>
                <FormField label="Nozzle Count">
                  <Input className="h-8 text-[12px]" type="number" placeholder="2" value={form.nozzleCount || ''} onChange={e => updateField('nozzleCount', e.target.value)} />
                </FormField>
                <FormField label="Flow Rate (L/min)">
                  <Input className="h-8 text-[12px]" type="number" placeholder="60" value={form.flowRate || ''} onChange={e => updateField('flowRate', e.target.value)} />
                </FormField>
                <FormField label="IP Address">
                  <Input className="h-8 text-[12px] font-mono" placeholder="192.168.1.107" value={form.ipAddress || ''} onChange={e => updateField('ipAddress', e.target.value)} />
                </FormField>
                <FormField label="Communication">
                  <Select value={form.communicationType || ''} onValueChange={v => updateField('communicationType', v)}>
                    <SelectTrigger className="h-8 text-[12px]">
                      <SelectValue placeholder="Select comm type" />
                    </SelectTrigger>
                    <SelectContent>
                      {COMM_TYPES.map(t => (
                        <SelectItem key={t} value={t} className="text-[12px]">{t.toUpperCase()}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
                <FormField label="Protocol">
                  <Input className="h-8 text-[12px]" placeholder="IFSF" value={form.protocol || ''} onChange={e => updateField('protocol', e.target.value)} />
                </FormField>
                <FormField label="Serial Number">
                  <Input className="h-8 text-[12px] font-mono" placeholder="SN-XXXX" value={form.serialNumber || ''} onChange={e => updateField('serialNumber', e.target.value)} />
                </FormField>
              </div>
            </>
          )}

          {/* Generic fields for other device types */}
          {category !== 'controller' && category !== 'dispenser' && (
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Model">
                <Input className="h-8 text-[12px]" placeholder="Model number" value={form.model || ''} onChange={e => updateField('model', e.target.value)} />
              </FormField>
              <FormField label="Serial Number">
                <Input className="h-8 text-[12px] font-mono" placeholder="SN-XXXX" value={form.serialNumber || ''} onChange={e => updateField('serialNumber', e.target.value)} />
              </FormField>
              <FormField label="IP Address">
                <Input className="h-8 text-[12px] font-mono" placeholder="192.168.1.x" value={form.ipAddress || ''} onChange={e => updateField('ipAddress', e.target.value)} />
              </FormField>
              <FormField label="Communication Type">
                <Select value={form.communicationType || ''} onValueChange={v => updateField('communicationType', v)}>
                  <SelectTrigger className="h-8 text-[12px]">
                    <SelectValue placeholder="Select comm type" />
                  </SelectTrigger>
                  <SelectContent>
                    {COMM_TYPES.map(t => (
                      <SelectItem key={t} value={t} className="text-[12px]">{t.toUpperCase()}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              {category === 'atg' && (
                <>
                  <FormField label="ATG Type">
                    <Select value={form.atgType || ''} onValueChange={v => updateField('atgType', v)}>
                      <SelectTrigger className="h-8 text-[12px]">
                        <SelectValue placeholder="Select ATG type" />
                      </SelectTrigger>
                      <SelectContent>
                        {['magnetostrictive', 'capacitive', 'radar', 'ultrasonic', 'float'].map(t => (
                          <SelectItem key={t} value={t} className="text-[12px]">{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>
                  <FormField label="Port">
                    <Input className="h-8 text-[12px] font-mono" placeholder="5000" value={form.port || ''} onChange={e => updateField('port', e.target.value)} />
                  </FormField>
                </>
              )}
              {category === 'price_board' && (
                <>
                  <FormField label="Display Type">
                    <Select value={form.displayType || ''} onValueChange={v => updateField('displayType', v)}>
                      <SelectTrigger className="h-8 text-[12px]">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {['LED', 'LCD', 'Flip-Disc', 'E-Ink'].map(t => (
                          <SelectItem key={t} value={t.toLowerCase()} className="text-[12px]">{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>
                  <FormField label="Line Count">
                    <Input className="h-8 text-[12px]" type="number" placeholder="4" value={form.lineCount || ''} onChange={e => updateField('lineCount', e.target.value)} />
                  </FormField>
                </>
              )}
              {category === 'camera' && (
                <>
                  <FormField label="Resolution">
                    <Select value={form.resolution || ''} onValueChange={v => updateField('resolution', v)}>
                      <SelectTrigger className="h-8 text-[12px]">
                        <SelectValue placeholder="Select resolution" />
                      </SelectTrigger>
                      <SelectContent>
                        {['720p', '1080p', '2K', '4K'].map(t => (
                          <SelectItem key={t} value={t.toLowerCase()} className="text-[12px]">{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>
                  <FormField label="Port">
                    <Input className="h-8 text-[12px] font-mono" placeholder="554" value={form.port || ''} onChange={e => updateField('port', e.target.value)} />
                  </FormField>
                </>
              )}
            </div>
          )}

          {/* Notes / Config JSON */}
          <FormField label="Configuration JSON (optional)">
            <Textarea className="text-[12px] font-mono min-h-[60px]" placeholder='{"key": "value"}' value={form.configJson || ''} onChange={e => updateField('configJson', e.target.value)} />
          </FormField>
        </motion.div>
      )}

      <DialogFooter className="gap-2">
        <Button type="button" variant="outline" size="sm" className="text-[12px] h-8" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" size="sm" className="text-[12px] h-8 bg-teal-600 hover:bg-teal-700 text-white" disabled={submitting || !category || !form.stationId || !form.name || !form.code}>
          {submitting ? <Loader2 className="size-3.5 animate-spin mr-1.5" /> : <Plus className="size-3.5 mr-1.5" />}
          {submitting ? 'Adding...' : `Add ${selectedCat?.label || 'Device'}`}
        </Button>
      </DialogFooter>
    </form>
  )
}

// ── Add Controller Form ──
function AddControllerForm({
  stations,
  submitting,
  onSubmit,
  onCancel,
}: {
  stations: StationOption[]
  submitting: boolean
  onSubmit: (data: Record<string, string>) => void
  onCancel: () => void
}) {
  const [form, setForm] = useState<Record<string, string>>({})

  const updateField = (key: string, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(form)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" style={{ fontStyle: 'normal' }}>
      {/* Core Identity */}
      <div>
        <p className="text-[11px] uppercase tracking-wider font-semibold text-teal-600 dark:text-teal-400 mb-2">Core Identity</p>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Station" required>
            <Select value={form.stationId || ''} onValueChange={v => updateField('stationId', v)}>
              <SelectTrigger className="h-8 text-[12px]">
                <SelectValue placeholder="Select station" />
              </SelectTrigger>
              <SelectContent>
                {stations.map(s => (
                  <SelectItem key={s.id} value={s.id} className="text-[12px]">{s.name} ({s.code})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Controller Type" required>
            <Select value={form.controllerType || ''} onValueChange={v => updateField('controllerType', v)}>
              <SelectTrigger className="h-8 text-[12px]">
                <SelectValue placeholder="Select protocol" />
              </SelectTrigger>
              <SelectContent>
                {['IFSF', 'DOMS', 'TATSUNO', 'WAYNE', 'GILBARCO', 'VEEDER-ROOT'].map(t => (
                  <SelectItem key={t} value={t} className="text-[12px]">{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Controller Name" required>
            <Input className="h-8 text-[12px]" placeholder="e.g. Main Forecourt Controller" value={form.name || ''} onChange={e => updateField('name', e.target.value)} />
          </FormField>
          <FormField label="Code" required>
            <Input className="h-8 text-[12px] font-mono" placeholder="e.g. FC-001" value={form.code || ''} onChange={e => updateField('code', e.target.value)} />
          </FormField>
        </div>
      </div>

      {/* Hardware Details */}
      <div>
        <p className="text-[11px] uppercase tracking-wider font-semibold text-teal-600 dark:text-teal-400 mb-2">Hardware Details</p>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Manufacturer">
            <Input className="h-8 text-[12px]" placeholder="e.g. Wayne Fueling" value={form.manufacturer || ''} onChange={e => updateField('manufacturer', e.target.value)} />
          </FormField>
          <FormField label="Model">
            <Input className="h-8 text-[12px]" placeholder="e.g. iX Pay" value={form.model || ''} onChange={e => updateField('model', e.target.value)} />
          </FormField>
          <FormField label="Serial Number">
            <Input className="h-8 text-[12px] font-mono" placeholder="SN-XXXX-XXXX" value={form.serialNumber || ''} onChange={e => updateField('serialNumber', e.target.value)} />
          </FormField>
          <FormField label="Firmware Version">
            <Input className="h-8 text-[12px] font-mono" placeholder="v1.0.0" value={form.firmwareVersion || ''} onChange={e => updateField('firmwareVersion', e.target.value)} />
          </FormField>
        </div>
      </div>

      {/* Network Configuration */}
      <div>
        <p className="text-[11px] uppercase tracking-wider font-semibold text-teal-600 dark:text-teal-400 mb-2">Network Configuration</p>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Communication Type">
            <Select value={form.communicationType || ''} onValueChange={v => updateField('communicationType', v)}>
              <SelectTrigger className="h-8 text-[12px]">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {COMM_TYPES.map(t => (
                  <SelectItem key={t} value={t} className="text-[12px]">{t.toUpperCase()}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Protocol">
            <Input className="h-8 text-[12px]" placeholder="IFSF" value={form.protocol || ''} onChange={e => updateField('protocol', e.target.value)} />
          </FormField>
          <FormField label="IP Address">
            <Input className="h-8 text-[12px] font-mono" placeholder="192.168.1.100" value={form.ipAddress || ''} onChange={e => updateField('ipAddress', e.target.value)} />
          </FormField>
          <FormField label="Port">
            <Input className="h-8 text-[12px] font-mono" placeholder="5000" value={form.port || ''} onChange={e => updateField('port', e.target.value)} />
          </FormField>
          <FormField label="Baud Rate">
            <Input className="h-8 text-[12px] font-mono" placeholder="9600" value={form.baudRate || ''} onChange={e => updateField('baudRate', e.target.value)} />
          </FormField>
          <FormField label="COM Port">
            <Input className="h-8 text-[12px] font-mono" placeholder="COM1" value={form.comPort || ''} onChange={e => updateField('comPort', e.target.value)} />
          </FormField>
        </div>
      </div>

      {/* Operational Settings */}
      <div>
        <p className="text-[11px] uppercase tracking-wider font-semibold text-teal-600 dark:text-teal-400 mb-2">Operational Settings</p>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Max Dispensers">
            <Input className="h-8 text-[12px]" type="number" placeholder="32" value={form.maxDispensers || ''} onChange={e => updateField('maxDispensers', e.target.value)} />
          </FormField>
          <FormField label="Polling Interval (ms)">
            <Input className="h-8 text-[12px]" type="number" placeholder="1000" value={form.pollingInterval || ''} onChange={e => updateField('pollingInterval', e.target.value)} />
          </FormField>
          <FormField label="Timeout (ms)">
            <Input className="h-8 text-[12px]" type="number" placeholder="5000" value={form.timeout || ''} onChange={e => updateField('timeout', e.target.value)} />
          </FormField>
        </div>
      </div>

      <FormField label="Configuration JSON (optional)">
        <Textarea className="text-[12px] font-mono min-h-[60px]" placeholder='{"key": "value"}' value={form.configJson || ''} onChange={e => updateField('configJson', e.target.value)} />
      </FormField>

      <DialogFooter className="gap-2">
        <Button type="button" variant="outline" size="sm" className="text-[12px] h-8" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" size="sm" className="text-[12px] h-8 bg-teal-600 hover:bg-teal-700 text-white" disabled={submitting || !form.stationId || !form.name || !form.code || !form.controllerType}>
          {submitting ? <Loader2 className="size-3.5 animate-spin mr-1.5" /> : <Server className="size-3.5 mr-1.5" />}
          {submitting ? 'Registering...' : 'Register Controller'}
        </Button>
      </DialogFooter>
    </form>
  )
}

// ── Owner Registration Form ──────────────────────

const DEVICE_TYPE_OPTIONS = [
  { value: 'pos', label: 'POS Terminal' },
  { value: 'dispenser_controller', label: 'Dispenser Controller' },
  { value: 'atg', label: 'ATG / Tank Gauge' },
  { value: 'payment_terminal', label: 'Payment Terminal' },
  { value: 'scanner', label: 'Barcode Scanner' },
  { value: 'other', label: 'Other Hardware' },
]

const PLAN_OPTIONS = [
  { value: 'starter', label: 'Starter', price: 'PKR 4,999/mo', desc: '1 Station · 4 Dispensers · 5 Users' },
  { value: 'professional', label: 'Professional', price: 'PKR 14,999/mo', desc: '5 Stations · 32 Dispensers · 25 Users', popular: true },
  { value: 'enterprise', label: 'Enterprise', price: 'PKR 49,999/mo', desc: '50 Stations · 500 Dispensers · 200 Users' },
]

function OwnerRegistrationForm({
  submitting,
  onSubmit,
  onCancel,
}: {
  submitting: boolean
  onSubmit: (data: Record<string, string>) => void
  onCancel: () => void
}) {
  const [form, setForm] = useState<Record<string, string>>({ plan: 'professional' })

  const updateField = (key: string, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(form)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" style={{ fontStyle: 'normal' }}>
      {/* Company Info */}
      <div>
        <p className="text-[11px] uppercase tracking-wider font-semibold text-teal-600 dark:text-teal-400 mb-2">Company Information</p>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Company Name" required>
            <Input className="h-8 text-[12px]" placeholder="e.g. Al-Noor Fuel Stations" value={form.companyName || ''} onChange={e => updateField('companyName', e.target.value)} />
          </FormField>
          <FormField label="Contact Person" required>
            <Input className="h-8 text-[12px]" placeholder="e.g. Muhammad Ahmed" value={form.contactPerson || ''} onChange={e => updateField('contactPerson', e.target.value)} />
          </FormField>
          <FormField label="Email" required>
            <Input className="h-8 text-[12px]" type="email" placeholder="owner@company.com" value={form.email || ''} onChange={e => updateField('email', e.target.value)} />
          </FormField>
          <FormField label="Phone" required>
            <Input className="h-8 text-[12px]" placeholder="+92 300 1234567" value={form.phone || ''} onChange={e => updateField('phone', e.target.value)} />
          </FormField>
          <FormField label="City">
            <Input className="h-8 text-[12px]" placeholder="e.g. Karachi" value={form.city || ''} onChange={e => updateField('city', e.target.value)} />
          </FormField>
          <FormField label="Address">
            <Input className="h-8 text-[12px]" placeholder="Street address" value={form.address || ''} onChange={e => updateField('address', e.target.value)} />
          </FormField>
        </div>
      </div>

      {/* Device Info */}
      <div>
        <p className="text-[11px] uppercase tracking-wider font-semibold text-teal-600 dark:text-teal-400 mb-2">Device / Hardware</p>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Device Name" required>
            <Input className="h-8 text-[12px]" placeholder="e.g. Main POS Terminal" value={form.deviceName || ''} onChange={e => updateField('deviceName', e.target.value)} />
          </FormField>
          <FormField label="Device Type" required>
            <Select value={form.deviceType || ''} onValueChange={v => updateField('deviceType', v)}>
              <SelectTrigger className="h-8 text-[12px]">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {DEVICE_TYPE_OPTIONS.map(t => (
                  <SelectItem key={t.value} value={t.value} className="text-[12px]">{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Serial Number">
            <Input className="h-8 text-[12px] font-mono" placeholder="SN-XXXX-XXXX (optional)" value={form.serialNumber || ''} onChange={e => updateField('serialNumber', e.target.value)} />
          </FormField>
          <FormField label="MAC Address">
            <Input className="h-8 text-[12px] font-mono" placeholder="AA:BB:CC:DD:EE:FF (optional)" value={form.macAddress || ''} onChange={e => updateField('macAddress', e.target.value)} />
          </FormField>
        </div>
      </div>

      {/* Plan Selection */}
      <div>
        <p className="text-[11px] uppercase tracking-wider font-semibold text-teal-600 dark:text-teal-400 mb-2">Subscription Plan</p>
        <div className="grid grid-cols-3 gap-2">
          {PLAN_OPTIONS.map(p => (
            <button
              key={p.value}
              type="button"
              onClick={() => updateField('plan', p.value)}
              className={`relative p-3 rounded-xl text-left transition-all border ${
                form.plan === p.value
                  ? 'border-teal-500 bg-teal-500/10 ring-1 ring-teal-500/30'
                  : 'border-border hover:border-teal-500/30'
              }`}
            >
              {p.popular && (
                <span className="absolute -top-2 right-2 bg-teal-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">POPULAR</span>
              )}
              <p className="text-[12px] font-semibold">{p.label}</p>
              <p className="text-[11px] text-teal-600 dark:text-teal-400 font-medium">{p.price}</p>
              <p className="text-[10px] text-muted-foreground mt-1">{p.desc}</p>
            </button>
          ))}
        </div>
      </div>

      <DialogFooter className="gap-2">
        <Button type="button" variant="outline" size="sm" className="text-[12px] h-8" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" size="sm" className="text-[12px] h-8 bg-teal-600 hover:bg-teal-700 text-white" disabled={submitting || !form.companyName || !form.contactPerson || !form.email || !form.phone || !form.deviceName || !form.deviceType}>
          {submitting ? <Loader2 className="size-3.5 animate-spin mr-1.5" /> : <Shield className="size-3.5 mr-1.5" />}
          {submitting ? 'Registering...' : 'Register & Get Credentials'}
        </Button>
      </DialogFooter>
    </form>
  )
}

// ── Credentials Display ──────────────────────────

function CredentialsDisplay({
  result,
  onClose,
}: {
  result: OwnerRegistrationResult
  onClose: () => void
}) {
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      toast.success(`${field} copied to clipboard`)
      setTimeout(() => setCopiedField(null), 2000)
    } catch {
      toast.error('Failed to copy')
    }
  }

  return (
    <div className="space-y-4" style={{ fontStyle: 'normal' }}>
      {/* Success Banner */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20"
      >
        <div className="flex items-center gap-2 mb-1">
          <CheckCircle2 className="size-5 text-emerald-500" />
          <p className="text-[14px] font-semibold text-emerald-700 dark:text-emerald-400">Registration Successful!</p>
        </div>
        <p className="text-[11px] text-emerald-600 dark:text-emerald-400">
          Your device has been registered as owner. Save these credentials — the password will not be shown again.
        </p>
      </motion.div>

      {/* Owner Info */}
      <div className="macos-group">
        <div className="macos-group-item">
          <div className="flex items-center gap-2">
            <User className="size-3.5 text-teal-500" />
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Owner Details</span>
          </div>
        </div>
        <div className="p-3 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[11px] text-muted-foreground">Company</span>
            <span className="text-[12px] font-medium">{result.owner.companyName}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[11px] text-muted-foreground">Contact</span>
            <span className="text-[12px] font-medium">{result.owner.contactPerson}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[11px] text-muted-foreground">Status</span>
            <Badge className="bg-emerald-500/10 text-emerald-600 text-[10px] border-emerald-500/20">Trial</Badge>
          </div>
        </div>
      </div>

      {/* Login Credentials */}
      <div className="macos-group">
        <div className="macos-group-item">
          <div className="flex items-center gap-2">
            <Key className="size-3.5 text-amber-500" />
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Login Credentials</span>
          </div>
        </div>
        <div className="p-3 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[11px] text-muted-foreground">Email</span>
            <div className="flex items-center gap-1.5">
              <code className="text-[12px] font-mono bg-muted px-2 py-0.5 rounded">{result.credentials.email}</code>
              <button onClick={() => copyToClipboard(result.credentials.email, 'Email')} className="p-1 hover:bg-muted rounded transition-colors">
                {copiedField === 'Email' ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3 text-muted-foreground" />}
              </button>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[11px] text-muted-foreground">Password</span>
            <div className="flex items-center gap-1.5">
              <code className="text-[12px] font-mono bg-red-500/10 text-red-600 dark:text-red-400 px-2 py-0.5 rounded">{result.credentials.password}</code>
              <button onClick={() => copyToClipboard(result.credentials.password, 'Password')} className="p-1 hover:bg-muted rounded transition-colors">
                {copiedField === 'Password' ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3 text-muted-foreground" />}
              </button>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[11px] text-muted-foreground">API Key</span>
            <div className="flex items-center gap-1.5">
              <code className="text-[11px] font-mono bg-muted px-2 py-0.5 rounded max-w-[280px] truncate">{result.credentials.apiKey}</code>
              <button onClick={() => copyToClipboard(result.credentials.apiKey, 'API Key')} className="p-1 hover:bg-muted rounded transition-colors">
                {copiedField === 'API Key' ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3 text-muted-foreground" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Serial Key */}
      <div className="macos-group">
        <div className="macos-group-item">
          <div className="flex items-center gap-2">
            <Shield className="size-3.5 text-violet-500" />
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Serial Key</span>
          </div>
        </div>
        <div className="p-3 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[11px] text-muted-foreground">Key</span>
            <div className="flex items-center gap-1.5">
              <code className="text-[13px] font-mono font-bold bg-violet-500/10 text-violet-600 dark:text-violet-400 px-3 py-1 rounded-lg tracking-wider">{result.serialKey.key}</code>
              <button onClick={() => copyToClipboard(result.serialKey.key, 'Serial Key')} className="p-1 hover:bg-muted rounded transition-colors">
                {copiedField === 'Serial Key' ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3 text-muted-foreground" />}
              </button>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[11px] text-muted-foreground">Plan</span>
            <Badge className="bg-violet-500/10 text-violet-600 text-[10px] border-violet-500/20 capitalize">{result.serialKey.plan}</Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[11px] text-muted-foreground">Limits</span>
            <span className="text-[11px] text-muted-foreground">
              {result.serialKey.maxStations} station{result.serialKey.maxStations > 1 ? 's' : ''} · {result.serialKey.maxDispensers} dispensers · {result.serialKey.maxUsers} users
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[11px] text-muted-foreground">Expires</span>
            <span className="text-[12px] font-medium">{result.serialKey.expiresAt ? new Date(result.serialKey.expiresAt).toLocaleDateString('en-PK', { year: 'numeric', month: 'long', day: 'numeric' }) : 'No expiry'}</span>
          </div>
        </div>
      </div>

      {/* Device Info */}
      <div className="macos-group">
        <div className="macos-group-item">
          <div className="flex items-center gap-2">
            <HardDrive className="size-3.5 text-sky-500" />
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Registered Device</span>
          </div>
        </div>
        <div className="p-3 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[11px] text-muted-foreground">Name</span>
            <span className="text-[12px] font-medium">{result.device.name}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[11px] text-muted-foreground">Type</span>
            <Badge className="bg-sky-500/10 text-sky-600 text-[10px] border-sky-500/20">{result.device.type}</Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[11px] text-muted-foreground">Status</span>
            <Badge className="bg-emerald-500/10 text-emerald-600 text-[10px] border-emerald-500/20 capitalize">{result.device.status}</Badge>
          </div>
        </div>
      </div>

      {/* Warning */}
      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
        <div className="flex items-start gap-2">
          <AlertTriangle className="size-4 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-[12px] font-semibold text-amber-700 dark:text-amber-400">Save Your Credentials!</p>
            <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5">
              This is the only time your password will be displayed. Copy it now and store it securely. You can use the API key for programmatic access.
            </p>
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button size="sm" className="text-[12px] h-8 bg-teal-600 hover:bg-teal-700 text-white w-full" onClick={onClose}>
          <CheckCircle2 className="size-3.5 mr-1.5" /> I've Saved My Credentials
        </Button>
      </DialogFooter>
    </div>
  )
}

// ── Component ──────────────────────────────────────

export default function DeviceIntegrationModule() {
  const [activeTab, setActiveTab] = useState('overview')
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')

  // Data states
  const [deviceCategories, setDeviceCategories] = useState<DeviceCategory[]>([])
  const [connectedDevices, setConnectedDevices] = useState<ConnectedDevice[]>([])
  const [commandQueue, setCommandQueue] = useState<CommandEntry[]>([])
  const [eventLog, setEventLog] = useState<EventEntry[]>([])
  const [forecourtControllers, setForecourtControllers] = useState<ForecourtController[]>([])
  const [hardwareCatalog, setHardwareCatalog] = useState<HardwareCatalogItem[]>([])
  const [commProtocols, setCommProtocols] = useState<CommProtocol[]>([])
  const [overviewStats, setOverviewStats] = useState<{
    totalDevices: number
    onlineDevices: number
    warningDevices: number
    offlineDevices: number
    eventLogCount: number
    commandQueueCount: number
    pendingCommands: number
  } | null>(null)

  // Loading / error
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Dialog states
  const [showAddDevice, setShowAddDevice] = useState(false)
  const [showAddController, setShowAddController] = useState(false)
  const [showOwnerRegister, setShowOwnerRegister] = useState(false)
  const [registrationResult, setRegistrationResult] = useState<OwnerRegistrationResult | null>(null)
  const [stations, setStations] = useState<StationOption[]>([])
  const [submitting, setSubmitting] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // Fetch all data in parallel
      const [
        overviewRes,
        eventLogsRes,
        commandsRes,
        controllersRes,
        catalogRes,
        commsProtocolsRes,
        dispensersRes,
        anprRes,
        rfidRes,
        priceBoardsRes,
        atgRes,
      ] = await Promise.allSettled([
        fetch('/api/devices?type=overview'),
        fetch('/api/devices?type=event_logs&limit=20'),
        fetch('/api/devices?type=command_queue&limit=20'),
        fetch('/api/hardware?action=controllers'),
        fetch('/api/hardware?action=catalog&limit=50'),
        fetch('/api/comms?section=protocols'),
        fetch('/api/dispensers'),
        fetch('/api/anpr-cameras'),
        fetch('/api/rfid-readers'),
        fetch('/api/price-boards'),
        fetch('/api/tanks'),
      ])

      // Parse all responses once — Response body can only be read once
      const safeJson = async (res: PromiseSettledResult<Response>) => {
        if (res.status !== 'fulfilled') return null
        try { return await res.value.json() } catch { return null }
      }

      const [overviewData, eventLogsData, commandsData, controllersData, catalogData, commsData, dispensersData, anprData, rfidData, priceBoardsData, atgData] = await Promise.all([
        safeJson(overviewRes),
        safeJson(eventLogsRes),
        safeJson(commandsRes),
        safeJson(controllersRes),
        safeJson(catalogRes),
        safeJson(commsProtocolsRes),
        safeJson(dispensersRes),
        safeJson(anprRes),
        safeJson(rfidRes),
        safeJson(priceBoardsRes),
        safeJson(atgRes),
      ])

      // Process overview
      if (overviewData) {
        const ov = overviewData.overview || {}

        // Build device categories from overview counts
        const counts = ov.deviceCounts || {}
        const statusBreakdown = ov.statusBreakdown || {}
        const categories: DeviceCategory[] = []
        for (const [key, count] of Object.entries(counts)) {
          if ((count as number) > 0) {
            const info = DEVICE_TYPE_ICONS[key] || { icon: HardDrive, color: '#e8930c', label: key }
            const breakdown = statusBreakdown[key] || {}
            const online = (breakdown.online || 0) + (breakdown.active || 0) + (breakdown.idle || 0) + (breakdown.fueling || 0)
            categories.push({
              type: info.label,
              icon: info.icon,
              count: count as number,
              online: online as number,
              color: info.color,
            })
          }
        }
        setDeviceCategories(categories)

        // Compute overview stats
        const totalDevices = ov.totalDevices || 0
        let onlineDevices = 0
        let warningDevices = 0
        let offlineDevices = 0
        for (const breakdown of Object.values(statusBreakdown) as Record<string, number>[]) {
          onlineDevices += (breakdown.online || 0) + (breakdown.active || 0) + (breakdown.idle || 0) + (breakdown.fueling || 0)
          warningDevices += (breakdown.warning || 0) + (breakdown.maintenance || 0)
          offlineDevices += (breakdown.offline || 0) + (breakdown.disabled || 0) + (breakdown.error || 0)
        }
        setOverviewStats({
          totalDevices,
          onlineDevices,
          warningDevices,
          offlineDevices,
          eventLogCount: ov.eventLogCount || 0,
          commandQueueCount: ov.commandQueueCount || 0,
          pendingCommands: ov.pendingCommands || 0,
        })
      }

      // Process event logs
      if (eventLogsData) {
        setEventLog(eventLogsData.eventLogs || [])
      }

      // Process command queue
      if (commandsData) {
        setCommandQueue(commandsData.commands || [])
      }

      // Process forecourt controllers
      if (controllersData) {
        setForecourtControllers(controllersData.controllers || [])
      }

      // Process hardware catalog
      if (catalogData) {
        setHardwareCatalog(catalogData.items || [])
      }

      // Process comm protocols
      if (commsData) {
        setCommProtocols(commsData.protocols || [])
      }

      // Build connected devices from multiple sources (using already-parsed data)
      const allDevices: ConnectedDevice[] = []

      // From dispensers
      if (dispensersData) {
        for (const d of dispensersData.dispensers || []) {
          allDevices.push({
            id: d.code || d.id,
            name: d.name,
            type: 'Dispenser',
            brand: d.manufacturer || 'Unknown',
            protocol: d.controllerType || d.communicationType || 'IFSF',
            status: d.status || 'offline',
            lastSeen: timeAgo(d.lastCommunication || d.updatedAt),
            ip: d.ipAddress || 'N/A',
          })
        }
      }

      // From ANPR cameras
      if (anprData) {
        for (const c of anprData.cameras || []) {
          allDevices.push({
            id: c.code || c.id,
            name: c.name,
            type: 'ANPR',
            brand: c.manufacturer || 'Unknown',
            protocol: c.communicationType || 'HTTP',
            status: c.status || 'offline',
            lastSeen: timeAgo(c.lastRecordingAt || c.updatedAt),
            ip: c.ipAddress || 'N/A',
          })
        }
      }

      // From RFID readers
      if (rfidData) {
        for (const r of rfidData.readers || []) {
          allDevices.push({
            id: r.code || r.id,
            name: r.name,
            type: 'RFID',
            brand: r.manufacturer || 'Unknown',
            protocol: r.communicationType || 'Wiegand',
            status: r.status || 'offline',
            lastSeen: timeAgo(r.updatedAt),
            ip: r.ipAddress || 'N/A',
          })
        }
      }

      // From price boards
      if (priceBoardsData) {
        for (const pb of priceBoardsData.boards || []) {
          allDevices.push({
            id: pb.code || pb.id,
            name: pb.name,
            type: 'Price Board',
            brand: pb.manufacturer || 'Unknown',
            protocol: pb.communicationType || 'RS485',
            status: pb.status || 'offline',
            lastSeen: timeAgo(pb.updatedAt),
            ip: pb.ipAddress || 'N/A',
          })
        }
      }

      // From ATG/tanks
      if (atgData) {
        for (const t of atgData.tanks || []) {
          allDevices.push({
            id: t.code || t.id,
            name: t.name || `ATG Tank ${t.code || t.id}`,
            type: 'ATG',
            brand: t.atgType ? String(t.atgType).charAt(0).toUpperCase() + String(t.atgType).slice(1) : 'Unknown',
            protocol: 'TLS-350',
            status: t.status || 'offline',
            lastSeen: timeAgo(t.lastReading || t.updatedAt),
            ip: 'N/A',
          })
        }
      }

      // From forecourt controllers (reusing already-parsed data)
      if (controllersData) {
        for (const fc of controllersData.controllers || []) {
          allDevices.push({
            id: fc.code || fc.id,
            name: fc.name,
            type: 'Controller',
            brand: fc.manufacturer || 'Unknown',
            protocol: fc.protocol || fc.controllerType || 'IFSF',
            status: fc.status || 'offline',
            lastSeen: timeAgo(fc.lastHeartbeat || fc.lastCommunication || fc.updatedAt),
            ip: fc.ipAddress || 'N/A',
          })
        }
      }

      // Fetch payment terminals
      try {
        const ptRes = await fetch('/api/devices?type=payment_terminal')
        if (ptRes.ok) {
          const data = await ptRes.json()
          for (const pt of data.devices || []) {
            allDevices.push({
              id: pt.code || pt.id,
              name: pt.name,
              type: 'Payment',
              brand: pt.manufacturer || 'Unknown',
              protocol: pt.communicationType || 'ISO 8583',
              status: pt.status || 'offline',
              lastSeen: timeAgo(pt.lastTransaction || pt.updatedAt),
              ip: pt.ipAddress || 'N/A',
            })
          }
        }
      } catch { /* ignore */ }

      setConnectedDevices(allDevices)
    } catch (err) {
      console.error('DeviceIntegration fetchData error:', err)
      setError(err instanceof Error ? err.message : 'Failed to load device data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Fetch stations when dialog opens
  const fetchStations = useCallback(async () => {
    if (stations.length > 0) return
    try {
      const res = await fetch('/api/stations')
      if (res.ok) {
        const data = await res.json()
        setStations((data.stations || []).map((s: { id: string; name: string; code: string }) => ({ id: s.id, name: s.name, code: s.code })))
      }
    } catch { /* ignore */ }
  }, [stations.length])

  // Handle add device submit
  const handleAddDevice = useCallback(async (formData: Record<string, string>) => {
    setSubmitting(true)
    try {
      const { category, ...rest } = formData
      const res = await fetch('/api/hardware', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add_hardware', category, ...rest }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Failed to add device')
        return
      }
      toast.success(`${DEVICE_CATEGORIES.find(c => c.value === category)?.label || 'Device'} "${rest.name}" added successfully`)
      setShowAddDevice(false)
      fetchData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add device')
    } finally {
      setSubmitting(false)
    }
  }, [fetchData])

  // Handle add controller submit
  const handleAddController = useCallback(async (formData: Record<string, string>) => {
    setSubmitting(true)
    try {
      const res = await fetch('/api/hardware', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add_controller', ...formData }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Failed to add controller')
        return
      }
      toast.success(`Controller "${formData.name}" registered successfully`)
      setShowAddController(false)
      fetchData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add controller')
    } finally {
      setSubmitting(false)
    }
  }, [fetchData])

  // Handle owner registration submit
  const handleOwnerRegister = useCallback(async (formData: Record<string, string>) => {
    setSubmitting(true)
    try {
      const res = await fetch('/api/owner/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Failed to register owner')
        return
      }
      setRegistrationResult(data)
      toast.success('Device owner registered successfully! Save your credentials.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to register owner')
    } finally {
      setSubmitting(false)
    }
  }, [])

  const filteredDevices = connectedDevices.filter(d => {
    const matchesSearch = !searchQuery ||
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.brand.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = typeFilter === 'all' || d.type === typeFilter
    return matchesSearch && matchesType
  })

  // ── Add Device Dialog ──
  const addDeviceDialog = (
    <Dialog open={showAddDevice} onOpenChange={(open) => { setShowAddDevice(open); if (open) fetchStations() }}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[15px]">
            <Plus className="size-4 text-teal-500" />
            Add New Device
          </DialogTitle>
        </DialogHeader>
        <AddDeviceForm
          stations={stations}
          controllers={forecourtControllers}
          submitting={submitting}
          onSubmit={handleAddDevice}
          onCancel={() => setShowAddDevice(false)}
        />
      </DialogContent>
    </Dialog>
  )

  // ── Add Controller Dialog ──
  const addControllerDialog = (
    <Dialog open={showAddController} onOpenChange={(open) => { setShowAddController(open); if (open) fetchStations() }}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[15px]">
            <Server className="size-4 text-teal-500" />
            Register Forecourt Controller
          </DialogTitle>
        </DialogHeader>
        <AddControllerForm
          stations={stations}
          submitting={submitting}
          onSubmit={handleAddController}
          onCancel={() => setShowAddController(false)}
        />
      </DialogContent>
    </Dialog>
  )

  // ── Owner Registration Dialog ──
  const ownerRegisterDialog = (
    <Dialog open={showOwnerRegister} onOpenChange={(open) => { setShowOwnerRegister(open); if (!open) setRegistrationResult(null) }}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[15px]">
            <Shield className="size-4 text-teal-500" />
            {registrationResult ? 'Your Credentials & Serial Key' : 'Register as Device Owner'}
          </DialogTitle>
        </DialogHeader>
        {registrationResult ? (
          <CredentialsDisplay
            result={registrationResult}
            onClose={() => { setShowOwnerRegister(false); setRegistrationResult(null); fetchData() }}
          />
        ) : (
          <OwnerRegistrationForm
            submitting={submitting}
            onSubmit={handleOwnerRegister}
            onCancel={() => setShowOwnerRegister(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  )

  // ── Loading state ──
  if (loading) {
    return (
      <div className="space-y-4" style={{ fontStyle: 'normal !important' } as React.CSSProperties}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="macos-card p-4">
              <Skeleton className="h-4 w-16 mb-2" />
              <Skeleton className="h-6 w-12" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="macos-card p-4">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-8 w-16" />
            </div>
          ))}
        </div>
        <div className="macos-card p-4 flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          <span className="text-[13px]">Loading device data from database…</span>
        </div>
      </div>
    )
  }

  // ── Error state ──
  if (error) {
    return (
      <div className="macos-card p-6 text-center" style={{ fontStretch: 'normal' }}>
        <AlertTriangle className="size-8 text-red-500 mx-auto mb-3" />
        <p className="text-[14px] font-semibold mb-1">Failed to Load Device Data</p>
        <p className="text-[12px] text-muted-foreground mb-4">{error}</p>
        <button onClick={fetchData} className="macos-btn text-[12px] px-4 py-1.5 flex items-center gap-2 mx-auto">
          <RefreshCw className="size-3.5" /> Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4" style={{ fontStretch: 'normal' }}>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="overflow-x-auto pb-1">
          <TabsList className="h-8 w-max gap-0.5 bg-muted/50">
            <TabsTrigger value="overview" className="text-[11px] px-3 h-6 data-[state=active]:bg-teal-500/15 data-[state=active]:text-teal-600">Overview</TabsTrigger>
            <TabsTrigger value="devices" className="text-[11px] px-3 h-6 data-[state=active]:bg-teal-500/15 data-[state=active]:text-teal-600">Connected Devices</TabsTrigger>
            <TabsTrigger value="controllers" className="text-[11px] px-3 h-6 data-[state=active]:bg-teal-500/15 data-[state=active]:text-teal-600">Controllers</TabsTrigger>
            <TabsTrigger value="commands" className="text-[11px] px-3 h-6 data-[state=active]:bg-teal-500/15 data-[state=active]:text-teal-600">Command Queue</TabsTrigger>
            <TabsTrigger value="events" className="text-[11px] px-3 h-6 data-[state=active]:bg-teal-500/15 data-[state=active]:text-teal-600">Event Log</TabsTrigger>
            <TabsTrigger value="catalog" className="text-[11px] px-3 h-6 data-[state=active]:bg-teal-500/15 data-[state=active]:text-teal-600">Hardware Catalog</TabsTrigger>
            <TabsTrigger value="protocols" className="text-[11px] px-3 h-6 data-[state=active]:bg-teal-500/15 data-[state=active]:text-teal-600">Protocols</TabsTrigger>
            <TabsTrigger value="owner" className="text-[11px] px-3 h-6 data-[state=active]:bg-violet-500/15 data-[state=active]:text-violet-600">Owner Registration</TabsTrigger>
          </TabsList>
        </div>

        {/* ── Overview ── */}
        <TabsContent value="overview" className="mt-4 space-y-4">
          {/* Integrate New Device Action */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="macos-card p-4 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setShowAddDevice(true)}
            >
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-[10px] fuel-gradient flex items-center justify-center shadow-sm">
                  <Plus className="size-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-[13px] font-semibold">Integrate New Device / Hardware</h3>
                  <p className="text-[11px] text-muted-foreground">Add dispensers, controllers, payment terminals, ATG systems, cameras, and more</p>
                </div>
                <ChevronRight className="size-4 text-muted-foreground/50" />
              </div>
            </motion.div>

            {/* Register as Owner Action */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="macos-card p-4 cursor-pointer hover:shadow-md transition-shadow ring-1 ring-violet-500/20"
              onClick={() => setShowOwnerRegister(true)}
            >
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-[10px] bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center shadow-sm">
                  <Shield className="size-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-[13px] font-semibold">Register as Device Owner</h3>
                  <p className="text-[11px] text-muted-foreground">Get credentials, API key & serial key for your device</p>
                </div>
                <ChevronRight className="size-4 text-muted-foreground/50" />
              </div>
            </motion.div>
          </div>

          {/* Device Type Cards */}
          <div>
            <div className="macos-section-header">Device Categories</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-1">
              {deviceCategories.length > 0 ? deviceCategories.map((dt, i) => (
                <motion.div
                  key={dt.type}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="macos-card p-4 cursor-pointer"
                  onClick={() => {
                    const typeMap: Record<string, string> = {
                      'Dispensers': 'Dispenser',
                      'ATG Systems': 'ATG',
                      'Payment Terminals': 'Payment',
                      'Forecourt Controllers': 'Controller',
                      'Price Boards': 'Price Board',
                      'RFID Readers': 'RFID',
                      'ANPR Cameras': 'ANPR',
                    }
                    setTypeFilter(typeMap[dt.type] || dt.type)
                    setActiveTab('devices')
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="size-9 rounded-[10px] flex items-center justify-center" style={{ backgroundColor: `${dt.color}15` }}>
                      <dt.icon className="size-4" style={{ color: dt.color }} />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className={`macos-status-dot ${dt.online === dt.count ? 'macos-status-online' : 'macos-status-warning'}`} />
                      <span className="text-[11px] text-muted-foreground">{dt.online}/{dt.count}</span>
                    </div>
                  </div>
                  <div className="mt-3">
                    <p className="text-[13px] font-semibold">{dt.type}</p>
                    <p className="text-[11px] text-muted-foreground">{dt.count} devices registered</p>
                  </div>
                </motion.div>
              )) : (
                <div className="col-span-full macos-card p-6 text-center text-[13px] text-muted-foreground">
                  No devices found in the system
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Total Devices', value: overviewStats?.totalDevices ?? 0, icon: HardDrive, accent: '#e8930c' },
              { label: 'Online', value: overviewStats?.onlineDevices ?? 0, icon: Wifi, accent: '#34c759' },
              { label: 'Warnings', value: overviewStats?.warningDevices ?? 0, icon: AlertTriangle, accent: '#ff9f0a' },
              { label: 'Offline', value: overviewStats?.offlineDevices ?? 0, icon: WifiOff, accent: '#ff3b30' },
            ].map((stat) => (
              <div key={stat.label} className="macos-card p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">{stat.label}</p>
                    <p className="text-2xl font-bold mt-0.5" style={{ color: stat.accent }}>{stat.value}</p>
                  </div>
                  <div className="size-9 rounded-[10px] flex items-center justify-center" style={{ backgroundColor: `${stat.accent}12` }}>
                    <stat.icon className="size-4" style={{ color: stat.accent }} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Recent Events */}
          <div>
            <div className="flex items-center justify-between">
              <div className="macos-section-header">Recent Events</div>
              <button onClick={fetchData} className="macos-btn-secondary text-[11px] px-2.5 py-1 flex items-center gap-1">
                <RefreshCw className="size-3" /> Refresh
              </button>
            </div>
            <div className="macos-group mt-1">
              {eventLog.length > 0 ? eventLog.slice(0, 5).map((ev, i) => (
                <div key={ev.id || i} className="macos-group-item flex items-center gap-3">
                  <div className={`macos-status-dot ${
                    ev.severity === 'error' || ev.severity === 'critical' ? 'macos-status-error' :
                    ev.severity === 'warning' ? 'macos-status-warning' :
                    ev.severity === 'success' || ev.severity === 'info' ? 'macos-status-online' : 'macos-status-offline'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-medium">{ev.deviceId}</span>
                      <span className={`text-[11px] ${EVENT_LEVEL_MAP[ev.severity] || ''}`}>{ev.message}</span>
                    </div>
                  </div>
                  <span className="text-[11px] text-muted-foreground whitespace-nowrap font-mono">{timeAgo(ev.createdAt)}</span>
                  <ChevronRight className="size-3 text-muted-foreground/50" />
                </div>
              )) : (
                <div className="macos-group-item text-center text-[13px] text-muted-foreground py-4">
                  No recent events
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ── Connected Devices ── */}
        <TabsContent value="devices" className="mt-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <input
                className="macos-search pl-8 py-1.5 text-[12px]"
                placeholder="Search devices..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {['all', 'Dispenser', 'ATG', 'Payment', 'Controller', 'RFID', 'ANPR'].map(t => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className={`text-[11px] px-2.5 py-1 rounded-md font-medium transition-colors ${
                    typeFilter === t
                      ? 'bg-teal-500/15 text-teal-600 dark:text-teal-400'
                      : 'text-muted-foreground hover:bg-black/[0.03] dark:hover:bg-white/[0.04]'
                  }`}
                >
                  {t === 'all' ? 'All' : t}
                </button>
              ))}
              <button
                onClick={() => setShowAddDevice(true)}
                className="macos-btn text-[11px] px-2.5 py-1 flex items-center gap-1 ml-1"
              >
                <Plus className="size-3" /> Add Device
              </button>
            </div>
          </div>

          <div className="macos-card overflow-hidden">
            <div className="max-h-[480px] overflow-y-auto">
              <table className="macos-table">
                <thead>
                  <tr>
                    <th>Device ID</th>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Brand</th>
                    <th>Protocol</th>
                    <th>Status</th>
                    <th>Last Seen</th>
                    <th>IP</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDevices.map(d => {
                    const st = STATUS_MAP[d.status] || STATUS_MAP.offline
                    return (
                      <tr key={d.id}>
                        <td className="font-mono text-[12px] text-teal-600 dark:text-teal-400">{d.id}</td>
                        <td className="font-medium text-[13px]">{d.name}</td>
                        <td><Badge variant="outline" className="text-[10px] px-1.5 py-0 font-medium">{d.type}</Badge></td>
                        <td className="text-[13px]">{d.brand}</td>
                        <td className="text-[12px] font-mono text-muted-foreground">{d.protocol}</td>
                        <td>
                          <div className="flex items-center gap-1.5">
                            <div className={`macos-status-dot ${st.dot}`} />
                            <span className={`text-[11px] font-medium capitalize ${st.text}`}>{d.status}</span>
                          </div>
                        </td>
                        <td className="text-[12px] text-muted-foreground whitespace-nowrap">{d.lastSeen}</td>
                        <td className="text-[12px] font-mono text-muted-foreground">{d.ip}</td>
                      </tr>
                    )
                  })}
                  {filteredDevices.length === 0 && (
                    <tr>
                      <td colSpan={8} className="text-center text-[13px] text-muted-foreground py-8">No devices match your filters</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground">{filteredDevices.length} of {connectedDevices.length} devices shown</p>
        </TabsContent>

        {/* ── Forecourt Controllers ── */}
        <TabsContent value="controllers" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="macos-section-header">Forecourt Controllers</div>
            <div className="flex gap-2">
              <button onClick={() => setShowAddController(true)} className="macos-btn text-[11px] px-2.5 py-1 flex items-center gap-1">
                <Plus className="size-3" /> Add Controller
              </button>
              <button onClick={fetchData} className="macos-btn-secondary text-[11px] px-2.5 py-1 flex items-center gap-1">
                <RefreshCw className="size-3" /> Refresh
              </button>
            </div>
          </div>
          {forecourtControllers.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {forecourtControllers.map(fc => {
                const dispensers = fc.dispensers || []
                const connectedPumps = dispensers.length
                const totalPumps = fc.maxDispensers || dispensers.length
                return (
                  <motion.div
                    key={fc.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="macos-card p-5 space-y-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-[10px] bg-teal-500/10 flex items-center justify-center">
                          <Server className="size-5 text-teal-500" />
                        </div>
                        <div>
                          <h3 className="text-[13px] font-semibold">{fc.name}</h3>
                          <p className="text-[11px] text-muted-foreground">{fc.manufacturer || ''} {fc.model || ''}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className={`macos-status-dot ${STATUS_MAP[fc.status]?.dot || 'macos-status-offline'}`} />
                        <span className={`text-[11px] font-medium capitalize ${STATUS_MAP[fc.status]?.text || 'text-muted-foreground'}`}>{fc.status}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="macos-group">
                        <div className="macos-group-item">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] text-muted-foreground">IP Address</span>
                            <span className="text-[13px] font-mono">{fc.ipAddress || 'N/A'}{fc.port ? `:${fc.port}` : ''}</span>
                          </div>
                        </div>
                        <div className="macos-group-item">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] text-muted-foreground">Protocol</span>
                            <span className="text-[13px]">{fc.protocol || fc.controllerType || 'N/A'}</span>
                          </div>
                        </div>
                        <div className="macos-group-item">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] text-muted-foreground">Firmware</span>
                            <span className="text-[13px] font-mono">{fc.firmwareVersion ? `v${fc.firmwareVersion}` : 'N/A'}</span>
                          </div>
                        </div>
                        <div className="macos-group-item">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] text-muted-foreground">Serial</span>
                            <span className="text-[12px] font-mono">{fc.serialNumber || 'N/A'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="macos-group">
                        <div className="macos-group-item">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] text-muted-foreground">Last Heartbeat</span>
                            <span className="text-[13px]">{timeAgo(fc.lastHeartbeat)}</span>
                          </div>
                        </div>
                        <div className="macos-group-item">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] text-muted-foreground">Pumps</span>
                            <span className="text-[13px]">{connectedPumps}/{totalPumps}</span>
                          </div>
                        </div>
                        <div className="macos-group-item">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] text-muted-foreground">Station</span>
                            <span className="text-[12px]">{fc.station?.name || 'N/A'}</span>
                          </div>
                        </div>
                        <div className="macos-group-item">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] text-muted-foreground">Last Comm</span>
                            <span className="text-[13px]">{timeAgo(fc.lastCommunication)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-muted-foreground">Last heartbeat: {timeAgo(fc.lastHeartbeat)}</span>
                      <div className="flex gap-2">
                        <button className="macos-btn-secondary text-[11px] px-2.5 py-1 flex items-center gap-1">
                          <RefreshCw className="size-3" /> Restart
                        </button>
                        <button className="macos-btn text-[11px] px-2.5 py-1 flex items-center gap-1">
                          <Activity className="size-3" /> Diagnostics
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          ) : (
            <div className="macos-card p-6 text-center text-[13px] text-muted-foreground">
              No forecourt controllers configured
            </div>
          )}
        </TabsContent>

        {/* ── Command Queue ── */}
        <TabsContent value="commands" className="mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="macos-section-header">Device Command Queue</div>
            <div className="flex gap-2">
              <button className="macos-btn-secondary text-[11px] px-2.5 py-1 flex items-center gap-1">
                <Square className="size-3" /> Clear Completed
              </button>
              <button className="macos-btn text-[11px] px-2.5 py-1 flex items-center gap-1">
                <Command className="size-3" /> New Command
              </button>
            </div>
          </div>
          <div className="macos-card overflow-hidden">
            <div className="max-h-[420px] overflow-y-auto">
              <table className="macos-table">
                <thead>
                  <tr>
                    <th>Command ID</th>
                    <th>Device</th>
                    <th>Command</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Retries</th>
                    <th>Created At</th>
                  </tr>
                </thead>
                <tbody>
                  {commandQueue.length > 0 ? commandQueue.map(cmd => {
                    const st = CMD_STATUS_MAP[cmd.status] || CMD_STATUS_MAP.queued
                    const StatusIcon = st?.icon || Clock
                    return (
                      <tr key={cmd.id}>
                        <td className="font-mono text-[12px] text-teal-600 dark:text-teal-400">{cmd.id.slice(0, 12)}</td>
                        <td className="font-mono text-[12px]">{cmd.deviceId}</td>
                        <td className="text-[13px] font-medium">{cmd.command}</td>
                        <td>
                          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 font-semibold capitalize ${PRIORITY_MAP[cmd.priority] || PRIORITY_MAP.medium}`}>
                            {cmd.priority}
                          </Badge>
                        </td>
                        <td>
                          <div className="flex items-center gap-1.5">
                            <StatusIcon className={`size-3.5 ${st?.color}`} />
                            <span className="text-[12px] capitalize">{cmd.status}</span>
                          </div>
                        </td>
                        <td className="text-[12px]">
                          <span className={cmd.retryCount > 0 ? 'text-teal-600 dark:text-teal-400 font-medium' : 'text-muted-foreground'}>
                            {cmd.retryCount}/{cmd.maxRetries}
                          </span>
                        </td>
                        <td className="text-[12px] text-muted-foreground font-mono">{timeAgo(cmd.createdAt)}</td>
                      </tr>
                    )
                  }) : (
                    <tr>
                      <td colSpan={7} className="text-center text-[13px] text-muted-foreground py-8">No commands in queue</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* ── Event Log ── */}
        <TabsContent value="events" className="mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="macos-section-header">Recent Device Events</div>
            <button onClick={fetchData} className="macos-btn-secondary text-[11px] px-2.5 py-1 flex items-center gap-1">
              <RefreshCw className="size-3" /> Refresh
            </button>
          </div>
          <div className="macos-group">
            {eventLog.length > 0 ? eventLog.map((ev, i) => (
              <motion.div
                key={ev.id || i}
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="macos-group-item flex items-center gap-3"
              >
                <div className={`macos-status-dot ${
                  ev.severity === 'error' || ev.severity === 'critical' ? 'macos-status-error' :
                  ev.severity === 'warning' ? 'macos-status-warning' :
                  ev.severity === 'success' || ev.severity === 'info' ? 'macos-status-online' : 'macos-status-offline'
                }`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-mono font-medium text-teal-600 dark:text-teal-400">{ev.deviceId}</span>
                    <span className={`text-[13px] ${EVENT_LEVEL_MAP[ev.severity] || ''}`}>{ev.message}</span>
                  </div>
                </div>
                <span className="text-[11px] text-muted-foreground font-mono whitespace-nowrap">{timeAgo(ev.createdAt)}</span>
              </motion.div>
            )) : (
              <div className="macos-group-item text-center text-[13px] text-muted-foreground py-4">
                No events recorded
              </div>
            )}
          </div>
        </TabsContent>

        {/* ── Hardware Catalog ── */}
        <TabsContent value="catalog" className="mt-4 space-y-3">
          <div className="macos-section-header">Hardware Catalog</div>
          {hardwareCatalog.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {hardwareCatalog.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="macos-card p-4"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="size-9 rounded-[10px] bg-teal-500/10 flex items-center justify-center">
                        <Fuel className="size-4 text-teal-500" />
                      </div>
                      <div>
                        <h3 className="text-[13px] font-semibold">{item.manufacturer}</h3>
                        <p className="text-[11px] text-muted-foreground">{item.modelName}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                      {item.category}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    {item.supportedProtocols && (
                      <div className="flex items-center justify-between text-[12px]">
                        <span className="text-muted-foreground">Protocols</span>
                        <span className="font-mono text-teal-600 dark:text-teal-400">
                          {Array.isArray(item.supportedProtocols) ? item.supportedProtocols.join(', ') : item.supportedProtocols}
                        </span>
                      </div>
                    )}
                    {item.communicationTypes && (
                      <div className="flex items-center justify-between text-[12px]">
                        <span className="text-muted-foreground">Transport</span>
                        <span className="font-medium">
                          {Array.isArray(item.communicationTypes) ? item.communicationTypes.join(', ') : item.communicationTypes}
                        </span>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="macos-card p-6 text-center text-[13px] text-muted-foreground">
              No hardware catalog entries found
            </div>
          )}
        </TabsContent>

        {/* ── Communication Protocols ── */}
        <TabsContent value="protocols" className="mt-4 space-y-3">
          <div className="macos-section-header">Communication Protocols</div>
          {commProtocols.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {commProtocols.map((proto, i) => (
                <motion.div
                  key={proto.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="macos-card p-4"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="size-9 rounded-[10px] bg-teal-500/10 flex items-center justify-center">
                        <Cable className="size-4 text-teal-500" />
                      </div>
                      <div>
                        <h3 className="text-[13px] font-semibold">{proto.name}</h3>
                        <p className="text-[11px] text-muted-foreground">{proto.description || proto.protocolType || ''}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${proto.isActive ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-slate-500/10 text-slate-500 border-slate-500/20'}`}>
                      {proto.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div className="macos-group mt-2">
                    {proto.protocolType && (
                      <div className="macos-group-item">
                        <div className="flex justify-between text-[12px]">
                          <span className="text-muted-foreground">Type</span>
                          <span className="font-medium">{proto.protocolType}</span>
                        </div>
                      </div>
                    )}
                    {proto.transportType && (
                      <div className="macos-group-item">
                        <div className="flex justify-between text-[12px]">
                          <span className="text-muted-foreground">Transport</span>
                          <span className="font-mono">{proto.transportType}</span>
                        </div>
                      </div>
                    )}
                    {proto.version && (
                      <div className="macos-group-item">
                        <div className="flex justify-between text-[12px]">
                          <span className="text-muted-foreground">Version</span>
                          <span className="font-mono">{proto.version}</span>
                        </div>
                      </div>
                    )}
                    <div className="macos-group-item">
                      <div className="flex justify-between text-[12px]">
                        <span className="text-muted-foreground">Connections</span>
                        <span className="font-semibold text-teal-600 dark:text-teal-400">{proto.connections?.length || 0}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="macos-card p-6 text-center text-[13px] text-muted-foreground">
              No communication protocols configured
            </div>
          )}
        </TabsContent>

        {/* ── Owner Registration Tab ── */}
        <TabsContent value="owner" className="mt-4 space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="macos-card p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="size-12 rounded-[12px] bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center shadow-md">
                <Shield className="size-6 text-white" />
              </div>
              <div>
                <h3 className="text-[16px] font-bold">Register as Device Owner</h3>
                <p className="text-[12px] text-muted-foreground">Get login credentials, API key, and a unique serial key for your device</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 rounded-xl bg-violet-500/5 border border-violet-500/10">
                <Key className="size-5 text-violet-500 mb-2" />
                <p className="text-[13px] font-semibold">Login Credentials</p>
                <p className="text-[11px] text-muted-foreground mt-1">Email & auto-generated secure password for your owner account</p>
              </div>
              <div className="p-4 rounded-xl bg-teal-500/5 border border-teal-500/10">
                <Cpu className="size-5 text-teal-500 mb-2" />
                <p className="text-[13px] font-semibold">API Key</p>
                <p className="text-[11px] text-muted-foreground mt-1">Unique API key for programmatic device management access</p>
              </div>
              <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10">
                <Shield className="size-5 text-amber-500 mb-2" />
                <p className="text-[13px] font-semibold">Serial Key</p>
                <p className="text-[11px] text-muted-foreground mt-1">Unique FF-XXXX-XXXX-XXXX key tied to your subscription plan</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-muted/50 border mb-6">
              <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground mb-2">What you get</p>
              <ul className="space-y-1.5">
                <li className="text-[12px] flex items-center gap-2"><CheckCircle2 className="size-3.5 text-emerald-500" /> Owner account with email & secure password</li>
                <li className="text-[12px] flex items-center gap-2"><CheckCircle2 className="size-3.5 text-emerald-500" /> API key for device management</li>
                <li className="text-[12px] flex items-center gap-2"><CheckCircle2 className="size-3.5 text-emerald-500" /> Unique serial key (FF-XXXX-XXXX-XXXX)</li>
                <li className="text-[12px] flex items-center gap-2"><CheckCircle2 className="size-3.5 text-emerald-500" /> 30-day free trial subscription</li>
                <li className="text-[12px] flex items-center gap-2"><CheckCircle2 className="size-3.5 text-emerald-500" /> Device registered and linked to your account</li>
              </ul>
            </div>

            <Button
              size="lg"
              className="w-full bg-gradient-to-r from-violet-600 to-violet-700 hover:from-violet-700 hover:to-violet-800 text-white h-10"
              onClick={() => setShowOwnerRegister(true)}
            >
              <Shield className="size-4 mr-2" />
              Register My Device as Owner
            </Button>
          </motion.div>
        </TabsContent>
      </Tabs>
      {addDeviceDialog}
      {addControllerDialog}
      {ownerRegisterDialog}
    </div>
  )
}
