'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Settings, Cpu, Users, Bell, Link2, FileText, AlertTriangle,
  Building2, MapPin, Clock, Wifi, CheckCircle2, Shield, Save,
  Fuel, Gauge, Droplets, Radio, Monitor, CreditCard, Database,
  Key, HardDrive, RefreshCw, Copy, Eye, Trash2, Plus,
  ChevronRight, Globe, Package, Server, Activity, Cable,
  Camera, Volume2, Mail, MessageSquare, Smartphone,
  Calendar, Download, RotateCcw, Info, Zap, Layers,
  Loader2, AlertCircle,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { ScrollArea } from '@/components/ui/scroll-area'

// ── Types ──────────────────────────────────────

type SettingsCategory = 'general' | 'hardware' | 'brands' | 'notifications' | 'billing' | 'users' | 'backup' | 'about'

interface CategoryItem {
  key: SettingsCategory
  label: string
  icon: React.ElementType
  subtitle: string
}

// ── Navigation Data (OK to keep static) ──────────────────────────────────────

const categories: CategoryItem[] = [
  { key: 'general', label: 'General', icon: Settings, subtitle: 'Station name, timezone, language' },
  { key: 'hardware', label: 'Hardware Integration', icon: Cpu, subtitle: 'Controllers, dispensers, ATG' },
  { key: 'brands', label: 'Dispenser Brands', icon: Fuel, subtitle: 'Supported brand configuration' },
  { key: 'notifications', label: 'Notifications', icon: Bell, subtitle: 'Alert rules and channels' },
  { key: 'billing', label: 'Billing', icon: CreditCard, subtitle: 'Subscription and serial key' },
  { key: 'users', label: 'Users & Roles', icon: Users, subtitle: 'User management, permissions' },
  { key: 'backup', label: 'Backup', icon: Database, subtitle: 'Backup schedule and restore' },
  { key: 'about', label: 'About', icon: Info, subtitle: 'Version and system info' },
]

// ── Color Maps (OK to keep static) ──────────────────────────────────────

const ROLE_COLORS: Record<string, string> = {
  Admin: 'bg-red-500/10 text-red-600 border-red-500/20',
  'Station Manager': 'bg-teal-500/10 text-teal-600 border-teal-500/20',
  Manager: 'bg-teal-500/10 text-teal-600 border-teal-500/20',
  Operator: 'bg-sky-500/10 text-sky-600 border-sky-500/20',
  Cashier: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  Attendant: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
}

const USER_STATUS: Record<string, { dot: string; text: string }> = {
  active: { dot: 'macos-status-online', text: 'text-emerald-600 dark:text-emerald-400' },
  inactive: { dot: 'macos-status-offline', text: 'text-muted-foreground' },
  locked: { dot: 'macos-status-error', text: 'text-red-600 dark:text-red-400' },
}

// ── Skeleton Loader ──────────────────────────────────────

function SkeletonRow({ cols = 4 }: { cols?: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="p-3">
          <div className="h-4 bg-muted/40 rounded animate-pulse" style={{ width: `${60 + Math.random() * 40}%` }} />
        </td>
      ))}
    </tr>
  )
}

function SkeletonCard() {
  return (
    <div className="macos-card p-4 space-y-3 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="size-9 rounded-[10px] bg-muted/40" />
        <div className="space-y-1.5 flex-1">
          <div className="h-3.5 bg-muted/40 rounded w-1/3" />
          <div className="h-3 bg-muted/30 rounded w-1/4" />
        </div>
      </div>
    </div>
  )
}

function ErrorBanner({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="macos-card p-4 flex items-center gap-3 border border-red-500/20">
      <AlertCircle className="size-4 text-red-500 shrink-0" />
      <p className="text-[12px] text-red-600 dark:text-red-400 flex-1">{message}</p>
      <button onClick={onRetry} className="macos-btn-secondary text-[11px] px-2 py-0.5 flex items-center gap-1">
        <RefreshCw className="size-3" /> Retry
      </button>
    </div>
  )
}

// ── Main Component ──────────────────────────────────────

export default function SettingsModule() {
  const [activeCategory, setActiveCategory] = useState<SettingsCategory>('general')

  return (
    <div className="flex gap-6 min-h-[calc(100vh-140px)]" style={{ fontStyle: 'normal !important' }}>
      {/* ── Left: Category Sidebar ── */}
      <nav className="w-[220px] shrink-0">
        <div className="macos-card p-2 sticky top-0">
          {categories.map(cat => {
            const isActive = activeCategory === cat.key
            const Icon = cat.icon
            return (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={`macos-sidebar-item w-full ${isActive ? 'active' : ''}`}
              >
                <Icon className="size-[15px] shrink-0" strokeWidth={isActive ? 2 : 1.5} />
                <div className="flex-1 text-left min-w-0">
                  <span className="text-[13px] block truncate">{cat.label}</span>
                </div>
                {isActive && <ChevronRight className="size-3 text-teal-500 shrink-0" />}
              </button>
            )
          })}
        </div>
      </nav>

      {/* ── Right: Detail Panel ── */}
      <div className="flex-1 min-w-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.18, ease: [0.25, 0.1, 0.25, 1] }}
          >
            {activeCategory === 'general' && <GeneralSettings />}
            {activeCategory === 'hardware' && <HardwareSettings />}
            {activeCategory === 'brands' && <BrandsSettings />}
            {activeCategory === 'notifications' && <NotificationsSettings />}
            {activeCategory === 'billing' && <BillingSettings />}
            {activeCategory === 'users' && <UsersSettings />}
            {activeCategory === 'backup' && <BackupSettings />}
            {activeCategory === 'about' && <AboutSettings />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

// ── General Settings ──
function GeneralSettings() {
  const [station, setStation] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStation = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/stations')
      if (!res.ok) throw new Error('Failed to load station data')
      const data = await res.json()
      setStation(data.stations?.[0] ?? null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchStation() }, [fetchStation])

  if (error) return <ErrorBanner message={error} onRetry={fetchStation} />

  const stationInfo = station ? [
    { label: 'Station Name', value: String(station.name ?? '—'), mono: false },
    { label: 'Station Code', value: String(station.code ?? '—'), mono: true },
    { label: 'Address', value: String(station.address ?? '—') },
    { label: 'City', value: String(station.city ?? '—') },
    { label: 'Station Type', value: String(station.stationType ?? '—') },
    { label: 'Dispensers', value: String(station.dispenserCount ?? 0) },
    { label: 'Tanks', value: String(station.tankCount ?? 0) },
    { label: 'Employees', value: String(station.employeeCount ?? 0) },
  ] : []

  const regionalInfo = [
    { label: 'Timezone', value: 'Asia/Karachi (UTC+5)', icon: Clock },
    { label: 'Language', value: 'English (US)', icon: Globe },
    { label: 'Currency', value: 'PKR — Pakistani Rupee', icon: CreditCard },
    { label: 'Tax Rate', value: '17.0%', icon: Building2 },
  ]

  return (
    <div className="space-y-4" style={{ fontStyle: 'normal !important' }}>
      <h2 className="text-[20px] font-semibold tracking-tight">General</h2>
      <p className="text-[13px] text-muted-foreground -mt-2">Configure station details, timezone, and regional settings</p>

      <div className="macos-section-header">Station Information</div>
      {loading ? (
        <div className="macos-group">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="macos-group-item">
              <div className="flex items-center justify-between">
                <div className="h-4 bg-muted/40 rounded animate-pulse w-24" />
                <div className="h-4 bg-muted/30 rounded animate-pulse w-40" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="macos-group">
          {stationInfo.map(item => (
            <div key={item.label} className="macos-group-item">
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-muted-foreground">{item.label}</span>
                <span className={`text-[13px] font-medium ${'mono' in item && item.mono ? 'font-mono' : ''}`}>{item.value}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="macos-section-header">Regional Settings</div>
      <div className="macos-group">
        {regionalInfo.map(item => (
          <div key={item.label} className="macos-group-item">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <item.icon className="size-3.5 text-muted-foreground" />
                <span className="text-[13px] text-muted-foreground">{item.label}</span>
              </div>
              <span className="text-[13px] font-medium">{item.value}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end pt-2">
        <button className="macos-btn text-[12px] px-4 py-1.5 flex items-center gap-1.5">
          <Save className="size-3.5" /> Save Changes
        </button>
      </div>
    </div>
  )
}

// ── Hardware Integration Settings ──
function HardwareSettings() {
  const [controllers, setControllers] = useState<Record<string, unknown>[]>([])
  const [dispensers, setDispensers] = useState<Record<string, unknown>[]>([])
  const [protocols, setProtocols] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [ctrlRes, protoRes] = await Promise.all([
        fetch('/api/hardware?action=controllers'),
        fetch('/api/comms?section=protocols'),
      ])
      if (!ctrlRes.ok) throw new Error('Failed to load hardware data')
      const ctrlData = await ctrlRes.json()
      const protoData = await protoRes.json()

      const allControllers: Record<string, unknown>[] = ctrlData.controllers ?? []
      const allDispensers: Record<string, unknown>[] = []
      for (const ctrl of allControllers) {
        const ctrlDispensers = (ctrl.dispensers ?? []) as Record<string, unknown>[]
        for (const d of ctrlDispensers) {
          allDispensers.push({
            ...d,
            controllerName: ctrl.name,
          })
        }
      }

      setControllers(allControllers)
      setDispensers(allDispensers)
      setProtocols(protoData.protocols ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  if (error) return <ErrorBanner message={error} onRetry={fetchData} />

  return (
    <div className="space-y-4" style={{ fontStyle: 'normal !important' }}>
      <h2 className="text-[20px] font-semibold tracking-tight">Hardware Integration</h2>
      <p className="text-[13px] text-muted-foreground -mt-2">Configure forecourt controllers, dispensers, ATG systems, and communication protocols</p>

      <div className="macos-section-header">Forecourt Controllers</div>
      {loading ? (
        <div className="space-y-3">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : controllers.length === 0 ? (
        <div className="macos-card p-6 text-center">
          <Server className="size-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-[13px] text-muted-foreground">No forecourt controllers configured</p>
          <button className="macos-btn text-[11px] px-2.5 py-1 mt-3 flex items-center gap-1 mx-auto">
            <Plus className="size-3" /> Add Controller
          </button>
        </div>
      ) : (
        controllers.map(fc => (
          <div key={String(fc.id)} className="macos-card p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-[10px] bg-teal-500/10 flex items-center justify-center">
                  <Server className="size-4 text-teal-500" />
                </div>
                <div>
                  <h3 className="text-[13px] font-semibold">{String(fc.name ?? '—')}</h3>
                  <p className="text-[11px] text-muted-foreground">{String(fc.manufacturer ?? '')} {String(fc.model ?? '')}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <div className={`macos-status-dot ${fc.status === 'online' ? 'macos-status-online' : fc.status === 'error' ? 'macos-status-error' : 'macos-status-offline'}`} />
                <span className={`text-[11px] font-medium ${fc.status === 'online' ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}>
                  {String(fc.status === 'online' ? 'Online' : fc.status === 'error' ? 'Error' : 'Offline')}
                </span>
              </div>
            </div>
            <div className="macos-group">
              <div className="macos-group-item">
                <div className="flex justify-between text-[12px]">
                  <span className="text-muted-foreground">IP Address</span>
                  <span className="font-mono">{String(fc.ipAddress ?? '—')}:{String(fc.port ?? '—')}</span>
                </div>
              </div>
              <div className="macos-group-item">
                <div className="flex justify-between text-[12px]">
                  <span className="text-muted-foreground">Protocol</span>
                  <span className="font-mono text-teal-600 dark:text-teal-400">{String(fc.protocol ?? '—')}</span>
                </div>
              </div>
              <div className="macos-group-item">
                <div className="flex justify-between text-[12px]">
                  <span className="text-muted-foreground">Connected Pumps</span>
                  <span className="font-medium">{((fc.dispensers ?? []) as unknown[]).length}</span>
                </div>
              </div>
            </div>
          </div>
        ))
      )}

      <div className="macos-section-header">Dispenser Profiles</div>
      <div className="macos-card overflow-hidden">
        <div className="max-h-[320px] overflow-y-auto">
          <table className="macos-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Brand</th>
                <th>Model</th>
                <th>Protocol</th>
                <th>Nozzles</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} cols={7} />)
              ) : dispensers.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-6 text-[12px] text-muted-foreground">No dispensers found</td></tr>
              ) : (
                dispensers.map(d => {
                  const st = d.status === 'online' ? 'macos-status-online' : d.status === 'warning' ? 'macos-status-warning' : d.status === 'error' ? 'macos-status-error' : 'macos-status-offline'
                  const tc = d.status === 'online' ? 'text-emerald-600 dark:text-emerald-400' : d.status === 'warning' ? 'text-teal-600 dark:text-teal-400' : d.status === 'error' ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'
                  return (
                    <tr key={String(d.id)}>
                      <td className="font-mono text-[12px] text-teal-600 dark:text-teal-400">{String(d.code ?? d.id)}</td>
                      <td className="text-[13px] font-medium">{String(d.name ?? '—')}</td>
                      <td className="text-[12px]">{String(d.manufacturer ?? '—')}</td>
                      <td className="text-[12px] text-muted-foreground">{String(d.model ?? '—')}</td>
                      <td className="text-[11px] font-mono">{String(d.protocol ?? '—')}</td>
                      <td className="text-[12px] text-center">{String(d.nozzleCount ?? '—')}</td>
                      <td>
                        <div className="flex items-center gap-1.5">
                          <div className={`macos-status-dot ${st}`} />
                          <span className={`text-[11px] font-medium capitalize ${tc}`}>{String(d.status ?? 'unknown')}</span>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="macos-section-header">Communication Protocols</div>
      <div className="macos-group">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="macos-group-item">
              <div className="flex items-center justify-between">
                <div className="h-4 bg-muted/40 rounded animate-pulse w-32" />
                <div className="h-4 bg-muted/30 rounded animate-pulse w-24" />
              </div>
            </div>
          ))
        ) : protocols.length === 0 ? (
          <div className="macos-group-item text-center py-4 text-[12px] text-muted-foreground">No protocols configured</div>
        ) : (
          protocols.map(proto => (
            <div key={String(proto.id)} className="macos-group-item">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Cable className="size-3.5 text-teal-500" />
                  <span className="text-[13px] font-medium font-mono">{String(proto.name ?? '—')}</span>
                  <span className="text-[11px] text-muted-foreground">{String(proto.transportType ?? '')}</span>
                </div>
                <div className="flex items-center gap-3">
                  {proto.port && <span className="text-[12px] text-muted-foreground">Port: {String(proto.port)}</span>}
                  <span className="text-[12px] text-teal-600 dark:text-teal-400 font-medium">{((proto.connections ?? []) as unknown[]).length} connections</span>
                  <div className="flex items-center gap-1.5">
                    <div className={`macos-status-dot ${proto.isActive ? 'macos-status-online' : 'macos-status-offline'}`} />
                    <span className={`text-[10px] ${proto.isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}>{proto.isActive ? 'Active' : 'Inactive'}</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// ── Dispenser Brands Settings ──
function BrandsSettings() {
  const [brands, setBrands] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [enabledBrands, setEnabledBrands] = useState<Record<string, boolean>>({})

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/hardware?action=catalog&category=dispenser')
      if (!res.ok) throw new Error('Failed to load dispenser brands')
      const data = await res.json()
      const items = data.items ?? []
      // Group by manufacturer
      const brandMap = new Map<string, { models: string[]; protocol: string; enabled: boolean }>()
      for (const item of items) {
        const mfr = String(item.manufacturer ?? 'Unknown')
        if (!brandMap.has(mfr)) {
          brandMap.set(mfr, { models: [], protocol: String(item.protocols ?? ''), enabled: true })
        }
        brandMap.get(mfr)!.models.push(String(item.modelName ?? ''))
      }
      const brandList = Array.from(brandMap.entries()).map(([brand, info]) => ({
        brand,
        models: info.models,
        protocol: info.protocol,
        region: 'Global',
        enabled: info.enabled,
        configuredPumps: 0,
      }))
      setBrands(brandList)
      setEnabledBrands(Object.fromEntries(brandList.map(b => [b.brand, b.enabled])))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  if (error) return <ErrorBanner message={error} onRetry={fetchData} />

  return (
    <div className="space-y-4" style={{ fontStyle: 'normal !important' }}>
      <h2 className="text-[20px] font-semibold tracking-tight">Dispenser Brands</h2>
      <p className="text-[13px] text-muted-foreground -mt-2">Configure supported dispenser manufacturers and their protocol mappings</p>

      {loading ? (
        <div className="space-y-2">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : brands.length === 0 ? (
        <div className="macos-card p-6 text-center">
          <Fuel className="size-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-[13px] text-muted-foreground">No dispenser brands in catalog</p>
        </div>
      ) : (
        <div className="space-y-2">
          {brands.map(brand => (
            <div key={brand.brand} className="macos-card p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-[10px] bg-teal-500/10 flex items-center justify-center">
                    <Fuel className="size-5 text-teal-500" />
                  </div>
                  <div>
                    <h3 className="text-[13px] font-semibold">{String(brand.brand)}</h3>
                    <p className="text-[11px] text-muted-foreground">{String(brand.region)} • Protocol: <span className="font-mono text-teal-600 dark:text-teal-400">{String(brand.protocol)}</span></p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-[11px] text-muted-foreground">{String(brand.configuredPumps)} pump{Number(brand.configuredPumps) > 1 ? 's' : ''}</span>
                  <Switch
                    checked={enabledBrands[String(brand.brand)] ?? true}
                    onCheckedChange={(checked) => setEnabledBrands(prev => ({ ...prev, [String(brand.brand)]: checked }))}
                  />
                </div>
              </div>
              {enabledBrands[String(brand.brand)] && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 pt-3 border-t border-border"
                >
                  <div className="macos-section-header">Supported Models</div>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {(brand.models as string[]).map(model => (
                      <Badge key={model} variant="outline" className="text-[10px] px-2 py-0.5 bg-teal-500/5 text-teal-600 border-teal-500/15 font-medium">
                        {model}
                      </Badge>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Notifications Settings ──
function NotificationsSettings() {
  const [rules, setRules] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/notifications?limit=100')
      if (!res.ok) throw new Error('Failed to load notifications')
      const data = await res.json()
      setRules(data.notifications ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  if (error) return <ErrorBanner message={error} onRetry={fetchData} />

  return (
    <div className="space-y-4" style={{ fontStyle: 'normal !important' }}>
      <h2 className="text-[20px] font-semibold tracking-tight">Notifications</h2>
      <p className="text-[13px] text-muted-foreground -mt-2">Configure alert rules and notification delivery channels</p>

      <div className="macos-section-header">Recent Notifications</div>
      {loading ? (
        <div className="space-y-1">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : rules.length === 0 ? (
        <div className="macos-card p-6 text-center">
          <Bell className="size-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-[13px] text-muted-foreground">No notifications found</p>
        </div>
      ) : (
        <div className="space-y-1">
          {rules.map((rule, i) => {
            const ruleType = String(rule.type ?? 'info')
            const isRead = Boolean(rule.isRead)
            return (
              <div key={String(rule.id)} className="macos-card p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`size-8 rounded-lg flex items-center justify-center shrink-0 ${
                      !isRead ? 'bg-teal-500/10' : 'bg-slate-500/10'
                    }`}>
                      {ruleType === 'alert' || ruleType === 'critical' ? (
                        <AlertTriangle className={`size-4 ${!isRead ? 'text-teal-500' : 'text-slate-400'}`} />
                      ) : ruleType === 'warning' ? (
                        <Bell className={`size-4 ${!isRead ? 'text-teal-500' : 'text-slate-400'}`} />
                      ) : (
                        <Mail className={`size-4 ${!isRead ? 'text-teal-500' : 'text-slate-400'}`} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[13px] font-medium">{String(rule.title ?? 'Notification')}</h3>
                      <p className="text-[11px] text-muted-foreground truncate">{String(rule.message ?? '')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <Badge variant="outline" className={`text-[9px] px-1.5 py-0 ${
                      ruleType === 'critical' ? 'bg-red-500/10 text-red-600 border-red-500/20' :
                      ruleType === 'alert' ? 'bg-teal-500/10 text-teal-600 border-teal-500/20' :
                      'bg-slate-500/10 text-slate-500 border-slate-500/20'
                    }`}>
                      {ruleType}
                    </Badge>
                    {!isRead && (
                      <div className="size-2 rounded-full bg-teal-500" />
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="macos-section-header">Notification Channels</div>
      <div className="macos-group">
        {[
          { name: 'Email', icon: Mail, detail: 'ops@apexfuel.pk', enabled: true },
          { name: 'SMS', icon: Smartphone, detail: '+92-301-5550123', enabled: true },
          { name: 'Push Notifications', icon: Bell, detail: 'Mobile app push', enabled: true },
          { name: 'Dashboard', icon: Monitor, detail: 'In-app notifications', enabled: true },
          { name: 'Webhook', icon: Link2, detail: 'https://hooks.slack.com/***', enabled: false },
        ].map(ch => (
          <div key={ch.name} className="macos-group-item">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ch.icon className="size-4 text-muted-foreground" />
                <div>
                  <span className="text-[13px] font-medium">{ch.name}</span>
                  <p className="text-[11px] text-muted-foreground">{ch.detail}</p>
                </div>
              </div>
              <Switch defaultChecked={ch.enabled} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Billing Settings ──
function BillingSettings() {
  const [billingData, setBillingData] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/webhooks?type=overview')
      if (!res.ok) throw new Error('Failed to load billing data')
      const data = await res.json()
      setBillingData(data.overview ?? null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  if (error) return <ErrorBanner message={error} onRetry={fetchData} />

  const keysInfo = billingData?.keys as Record<string, number> | undefined
  const endpointsInfo = billingData?.endpoints as Record<string, number> | undefined

  return (
    <div className="space-y-4" style={{ fontStyle: 'normal !important' }}>
      <h2 className="text-[20px] font-semibold tracking-tight">Billing</h2>
      <p className="text-[13px] text-muted-foreground -mt-2">Manage your subscription, serial key, and billing information</p>

      <div className="macos-card p-5">
        <div className="flex items-start gap-4">
          <div className="size-12 rounded-2xl bg-teal-500/10 flex items-center justify-center shrink-0">
            <Package className="size-6 text-teal-500" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h3 className="text-[15px] font-semibold">Enterprise Plan</h3>
              <Badge variant="outline" className="text-[10px] px-2 py-0 bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-semibold">
                <CheckCircle2 className="size-2.5 mr-0.5" /> Active
              </Badge>
            </div>
            <p className="text-[13px] font-medium" style={{ color: '#e8930c' }}>PKR 227,000/month</p>
          </div>
        </div>
      </div>

      <div className="macos-section-header">License Key</div>
      <div className="macos-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Key className="size-4 text-teal-500" />
            <div>
              <code className="text-[13px] font-mono bg-muted/50 px-2 py-0.5 rounded">AFPK-ENT-2023-****-****-7F2A</code>
              <p className="text-[11px] text-muted-foreground mt-0.5">Billing cycle: Monthly</p>
            </div>
          </div>
          <button className="macos-btn-secondary text-[11px] px-2.5 py-1 flex items-center gap-1">
            <Copy className="size-3" /> Copy
          </button>
        </div>
      </div>

      <div className="macos-section-header">API & Integration Usage</div>
      {loading ? (
        <div className="macos-group">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="macos-group-item">
              <div className="flex items-center justify-between">
                <div className="h-4 bg-muted/40 rounded animate-pulse w-20" />
                <div className="h-4 bg-muted/30 rounded animate-pulse w-24" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="macos-group">
          {[
            { label: 'API Keys', value: `${keysInfo?.active ?? 0} / ${keysInfo?.total ?? 0} active`, icon: Key },
            { label: 'Webhook Endpoints', value: `${endpointsInfo?.active ?? 0} / ${endpointsInfo?.total ?? 0} active`, icon: Link2 },
            { label: 'Webhook Deliveries', value: `${((billingData?.deliveries as Record<string, number>)?.successful ?? 0)} successful`, icon: Activity },
          ].map(item => (
            <div key={item.label} className="macos-group-item">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <item.icon className="size-4 text-muted-foreground" />
                  <span className="text-[13px]">{item.label}</span>
                </div>
                <span className="text-[13px] font-medium">{item.value}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="macos-section-header">Payment Information</div>
      <div className="macos-group">
        <div className="macos-group-item">
          <div className="flex justify-between text-[13px]">
            <span className="text-muted-foreground">Payment Method</span>
            <span className="font-medium">Bank Transfer — HBL Account ****7821</span>
          </div>
        </div>
        <div className="macos-group-item">
          <div className="flex justify-between text-[13px]">
            <span className="text-muted-foreground">Last Payment</span>
            <span>March 3, 2026</span>
          </div>
        </div>
        <div className="macos-group-item">
          <div className="flex justify-between text-[13px]">
            <span className="text-muted-foreground">Next Billing Date</span>
            <span className="font-medium">April 1, 2026</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Users & Roles Settings ──
function UsersSettings() {
  const [users, setUsers] = useState<Record<string, unknown>[]>([])
  const [permissions, setPermissions] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [usersRes, rbacRes] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/security?section=rbac'),
      ])
      if (!usersRes.ok) throw new Error('Failed to load users')
      const usersData = await usersRes.json()
      const rbacData = await rbacRes.json()

      setUsers(usersData.users ?? [])
      setPermissions(rbacData.permissions ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  if (error) return <ErrorBanner message={error} onRetry={fetchData} />

  // Compute role counts from users
  const roleCounts = users.reduce<Record<string, number>>((acc, u) => {
    const role = String(u.role ?? 'Unknown')
    acc[role] = (acc[role] || 0) + 1
    return acc
  }, {})

  // Group permissions by role for display
  const roleDescriptions: Record<string, string> = {
    Admin: 'Full system access including user management and billing',
    'Station Manager': 'Operations, pricing, finance, reports, and settings',
    Manager: 'Multi-station oversight with read-only finance access',
    Operator: 'Forecourt, sales, and basic tank monitoring',
    Cashier: 'Sales processing and shift management',
    Attendant: 'View-only forecourt and basic sales entry',
  }

  return (
    <div className="space-y-4" style={{ fontStyle: 'normal !important' }}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[20px] font-semibold tracking-tight">Users & Roles</h2>
          <p className="text-[13px] text-muted-foreground -mt-2">Manage user accounts, roles, and permissions</p>
        </div>
        <button className="macos-btn text-[12px] px-3 py-1.5 flex items-center gap-1.5">
          <Plus className="size-3.5" /> Add User
        </button>
      </div>

      <div className="macos-section-header">User Accounts</div>
      {loading ? (
        <div className="space-y-1">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : users.length === 0 ? (
        <div className="macos-card p-6 text-center">
          <Users className="size-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-[13px] text-muted-foreground">No users found</p>
        </div>
      ) : (
        <div className="space-y-1">
          {users.map(user => {
            const status = user.isActive ? 'active' : 'inactive'
            const st = USER_STATUS[status] || USER_STATUS.inactive
            const role = String(user.role ?? 'Unknown')
            return (
              <div key={String(user.id)} className="macos-card p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="size-9 rounded-[10px] bg-teal-500/10 flex items-center justify-center text-[11px] font-bold text-teal-600 dark:text-teal-400">
                      {String(user.name ?? '?').split(' ').map(w => w[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <h3 className="text-[13px] font-medium">{String(user.name ?? '—')}</h3>
                      <p className="text-[11px] text-muted-foreground">{String(user.email ?? '—')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className={`text-[9px] px-1.5 py-0 font-semibold ${ROLE_COLORS[role] || ''}`}>
                      {role}
                    </Badge>
                    <div className="flex items-center gap-1.5">
                      <div className={`macos-status-dot ${st.dot}`} />
                      <span className={`text-[10px] font-medium capitalize ${st.text}`}>{status}</span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="macos-section-header">Role Permissions</div>
      <div className="macos-group">
        {Object.entries(roleCounts).length > 0 ? (
          Object.entries(roleCounts).map(([role, count]) => (
            <div key={role} className="macos-group-item">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[13px] font-medium">{role}</span>
                  <p className="text-[11px] text-muted-foreground">{roleDescriptions[role] ?? 'Custom role'}</p>
                </div>
                <span className="text-[11px] text-muted-foreground">{count} user{count > 1 ? 's' : ''}</span>
              </div>
            </div>
          ))
        ) : loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="macos-group-item">
              <div className="flex items-center justify-between">
                <div className="h-4 bg-muted/40 rounded animate-pulse w-32" />
                <div className="h-4 bg-muted/30 rounded animate-pulse w-16" />
              </div>
            </div>
          ))
        ) : (
          <div className="macos-group-item text-center py-4 text-[12px] text-muted-foreground">No roles defined</div>
        )}
      </div>
    </div>
  )
}

// ── Backup Settings ──
function BackupSettings() {
  const [backups, setBackups] = useState<Record<string, unknown>[]>([])
  const [overview, setOverview] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [overviewRes, backupsRes] = await Promise.all([
        fetch('/api/security'),
        fetch('/api/security?section=backups'),
      ])
      if (!overviewRes.ok) throw new Error('Failed to load backup data')
      const overviewData = await overviewRes.json()
      const backupsData = await backupsRes.json()

      setOverview(overviewData.overview ?? null)
      setBackups(backupsData.backups ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  if (error) return <ErrorBanner message={error} onRetry={fetchData} />

  const lastBackup = overview?.lastBackup as Record<string, unknown> | null | undefined

  return (
    <div className="space-y-4" style={{ fontStyle: 'normal !important' }}>
      <h2 className="text-[20px] font-semibold tracking-tight">Backup</h2>
      <p className="text-[13px] text-muted-foreground -mt-2">Configure automated backups and restore from previous snapshots</p>

      <div className="macos-card p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-[10px] bg-emerald-500/10 flex items-center justify-center">
              <Database className="size-5 text-emerald-500" />
            </div>
            <div>
              <h3 className="text-[13px] font-semibold">Automatic Backup</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {lastBackup
                  ? `Last backup: ${lastBackup.completedAt ? new Date(String(lastBackup.completedAt)).toLocaleString('en-PK', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}`
                  : loading ? 'Loading...' : 'No backup data available'}
              </p>
            </div>
          </div>
          <Switch defaultChecked={true} />
        </div>
      </div>

      <div className="macos-section-header">Backup Configuration</div>
      <div className="macos-group">
        {[
          { label: 'Frequency', value: 'Every 6 hours', icon: Clock },
          { label: 'Retention Period', value: '30 days', icon: Calendar },
          { label: 'Encryption', value: 'AES-256', icon: Shield },
        ].map(item => (
          <div key={item.label} className="macos-group-item">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <item.icon className="size-3.5 text-muted-foreground" />
                <span className="text-[13px] text-muted-foreground">{item.label}</span>
              </div>
              <span className="text-[13px] font-medium">{item.value}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 pt-1">
        <button className="macos-btn text-[12px] px-3 py-1.5 flex items-center gap-1.5">
          <Download className="size-3.5" /> Backup Now
        </button>
        <button className="macos-btn-secondary text-[12px] px-3 py-1.5 flex items-center gap-1.5">
          <RotateCcw className="size-3.5" /> Restore from Backup
        </button>
      </div>

      <div className="macos-section-header">Backup History</div>
      <div className="macos-card overflow-hidden">
        <div className="max-h-[260px] overflow-y-auto">
          <table className="macos-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Size</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} cols={5} />)
              ) : backups.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-6 text-[12px] text-muted-foreground">No backup records found</td></tr>
              ) : (
                backups.map(bk => (
                  <tr key={String(bk.id)}>
                    <td className="text-[12px] whitespace-nowrap">
                      {bk.createdAt ? new Date(String(bk.createdAt)).toLocaleString('en-PK', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                    <td>
                      <Badge variant="outline" className={`text-[9px] px-1.5 py-0 ${bk.backupType === 'manual' ? 'bg-teal-500/10 text-teal-600 border-teal-500/20' : 'bg-slate-500/10 text-slate-500 border-slate-500/20'}`}>
                        {String(bk.backupType ?? 'auto')}
                      </Badge>
                    </td>
                    <td className="text-[12px] text-muted-foreground">{bk.fileSize ? `${(Number(bk.fileSize) / (1024 * 1024)).toFixed(1)} MB` : '—'}</td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <div className={`macos-status-dot ${bk.status === 'completed' ? 'macos-status-online' : 'macos-status-warning'}`} />
                        <span className={`text-[10px] ${bk.status === 'completed' ? 'text-emerald-600 dark:text-emerald-400' : 'text-teal-600 dark:text-teal-400'}`}>
                          {String(bk.status === 'completed' ? 'Complete' : bk.status === 'in_progress' ? 'In Progress' : String(bk.status))}
                        </span>
                      </div>
                    </td>
                    <td>
                      <button className="size-6 rounded-md flex items-center justify-center hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors" title="Restore">
                        <RotateCcw className="size-3 text-muted-foreground" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ── About Settings ──
function AboutSettings() {
  return (
    <div className="space-y-4" style={{ fontStyle: 'normal !important' }}>
      <h2 className="text-[20px] font-semibold tracking-tight">About FuelFlow OS</h2>
      <p className="text-[13px] text-muted-foreground -mt-2">System information and version details</p>

      <div className="macos-card p-6 text-center">
        <div className="size-16 rounded-2xl fuel-gradient flex items-center justify-center mx-auto mb-4 shadow-lg">
          <Fuel className="size-8 text-white" />
        </div>
        <h3 className="text-[18px] font-bold">FuelFlow OS</h3>
        <p className="text-[13px] text-muted-foreground mt-1">ApexFlow Ecosystem</p>
        <p className="text-[15px] font-semibold mt-2" style={{ color: '#e8930c' }}>Version 3.2.1</p>
        <p className="text-[11px] text-muted-foreground mt-1">Build 2026.03.04.1847 • macOS Golden Gate</p>
      </div>

      <div className="macos-section-header">System Information</div>
      <div className="macos-group">
        {[
          { label: 'Platform', value: 'FuelFlow OS for macOS Golden Gate' },
          { label: 'Version', value: '3.2.1 (Build 1847)' },
          { label: 'Architecture', value: 'Next.js 16 / TypeScript 5 / Tailwind CSS 4' },
          { label: 'Database', value: 'PostgreSQL / Prisma ORM' },
          { label: 'License', value: 'Enterprise — Active' },
        ].map(item => (
          <div key={item.label} className="macos-group-item">
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-muted-foreground">{item.label}</span>
              <span className="text-[13px] font-medium">{item.value}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="macos-section-header">Runtime Status</div>
      <div className="macos-group">
        {[
          { label: 'Uptime', value: '14d 7h 32m', icon: Activity },
          { label: 'Node Version', value: 'Bun 1.2.x', icon: Zap },
          { label: 'Connected Devices', value: '30', icon: Cpu },
          { label: 'Active Sessions', value: '7', icon: Users },
          { label: 'Database Size', value: '248 MB', icon: Database },
          { label: 'Cache Status', value: 'Healthy', icon: Layers },
        ].map(item => (
          <div key={item.label} className="macos-group-item">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <item.icon className="size-3.5 text-muted-foreground" />
                <span className="text-[13px] text-muted-foreground">{item.label}</span>
              </div>
              <span className="text-[13px] font-medium">{item.value}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="macos-section-header">Acknowledgments</div>
      <div className="macos-card p-4">
        <p className="text-[12px] text-muted-foreground leading-relaxed">
          FuelFlow OS is built on the ApexFlow Ecosystem platform, designed for modern fuel retail operations in Pakistan.
          Powered by Next.js, TypeScript, Tailwind CSS, and Prisma. Communication protocols support IFSF, PARIUS, DFS, and TLS-350 standards.
          All transaction data is encrypted with AES-256. Compliance with OGRA and PRA regulatory requirements.
        </p>
      </div>

      <div className="text-center pt-4">
        <p className="text-[11px] text-muted-foreground">© 2023–2026 ApexFlow Technologies (Pvt.) Ltd. All rights reserved.</p>
      </div>
    </div>
  )
}
