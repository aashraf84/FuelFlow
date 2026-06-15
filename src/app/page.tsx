'use client'

import { useState, useEffect, useCallback, useSyncExternalStore } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from 'next-themes'
import {
  LayoutDashboard,
  Fuel,
  Droplets,
  Receipt,
  Truck,
  DollarSign,
  ShoppingCart,
  Users,
  Wallet,
  Building2,
  Brain,
  Zap,
  Settings,
  Search,
  Bell,
  Moon,
  Sun,
  ChevronDown,
  LogOut,
  User,
  Shield,
  Cpu,
  Wifi,
  Eye,
  EyeOff,
  ChevronRight,
  BarChart3,
  Radio,
  Crown,
  type LucideIcon,
} from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAppStore, type ModuleKey } from '@/stores/app-store'
import { useIsMobile } from '@/hooks/use-mobile'
import dynamic from 'next/dynamic'

// Lazy-load heavy module components to reduce initial compilation memory
const DashboardOverview = dynamic(() => import('@/components/fuelflow/DashboardOverview'), { ssr: false })
const ForecourtModule = dynamic(() => import('@/components/fuelflow/ForecourtModule'), { ssr: false })
const TanksModule = dynamic(() => import('@/components/fuelflow/TanksModule'), { ssr: false })
const SalesModule = dynamic(() => import('@/components/fuelflow/SalesModule'), { ssr: false })
const FleetModule = dynamic(() => import('@/components/fuelflow/FleetModule'), { ssr: false })
const PricingModule = dynamic(() => import('@/components/fuelflow/PricingModule'), { ssr: false })
const RetailModule = dynamic(() => import('@/components/fuelflow/RetailModule'), { ssr: false })
const EmployeesModule = dynamic(() => import('@/components/fuelflow/EmployeesModule'), { ssr: false })
const FinanceModule = dynamic(() => import('@/components/fuelflow/FinanceModule'), { ssr: false })
const MultiSiteModule = dynamic(() => import('@/components/fuelflow/MultiSiteModule'), { ssr: false })
const AISuiteModule = dynamic(() => import('@/components/fuelflow/AISuiteModule'), { ssr: false })
const EVCNGModule = dynamic(() => import('@/components/fuelflow/EVCNGModule'), { ssr: false })
const SettingsModule = dynamic(() => import('@/components/fuelflow/SettingsModule'), { ssr: false })
const DeviceIntegrationModule = dynamic(() => import('@/components/fuelflow/DeviceIntegrationModule'), { ssr: false })
const SecurityCenterModule = dynamic(() => import('@/components/fuelflow/SecurityCenterModule'), { ssr: false })
const CommsLayerModule = dynamic(() => import('@/components/fuelflow/CommsLayerModule'), { ssr: false })
const ReportBuilderModule = dynamic(() => import('@/components/fuelflow/ReportBuilderModule'), { ssr: false })
const APIWebhooksModule = dynamic(() => import('@/components/fuelflow/APIWebhooksModule'), { ssr: false })
const LoginPage = dynamic(() => import('@/components/fuelflow/LoginPage'), { ssr: false })
const OwnerModule = dynamic(() => import('@/components/fuelflow/OwnerModule'), { ssr: false })

// ── Navigation Configuration ──────────────────────────────

interface NavItem {
  key: ModuleKey
  label: string
  icon: LucideIcon
  section?: string
  sectionColor?: string
}

// Section color palette — each section gets a unique solid bg + white text when active
const sectionColors: Record<string, { bg: string; text: string; darkBg: string; darkText: string; dot: string; headerText: string; darkHeaderText: string }> = {
  Overview:     { bg: 'bg-teal-600',       text: 'text-white',         darkBg: 'dark:bg-teal-500',         darkText: 'dark:text-white',         dot: 'bg-teal-500',      headerText: 'text-teal-600',      darkHeaderText: 'dark:text-teal-400' },
  Operations:   { bg: 'bg-emerald-600',    text: 'text-white',         darkBg: 'dark:bg-emerald-500',      darkText: 'dark:text-white',         dot: 'bg-emerald-500',   headerText: 'text-emerald-600',   darkHeaderText: 'dark:text-emerald-400' },
  Business:     { bg: 'bg-cyan-600',       text: 'text-white',         darkBg: 'dark:bg-cyan-500',         darkText: 'dark:text-white',         dot: 'bg-cyan-500',      headerText: 'text-cyan-600',      darkHeaderText: 'dark:text-cyan-400' },
  Management:   { bg: 'bg-rose-600',       text: 'text-white',         darkBg: 'dark:bg-rose-500',         darkText: 'dark:text-white',         dot: 'bg-rose-500',      headerText: 'text-rose-600',      darkHeaderText: 'dark:text-rose-400' },
  Intelligence: { bg: 'bg-violet-600',     text: 'text-white',         darkBg: 'dark:bg-violet-500',       darkText: 'dark:text-white',         dot: 'bg-violet-500',    headerText: 'text-violet-600',    darkHeaderText: 'dark:text-violet-400' },
  System:       { bg: 'bg-slate-600',      text: 'text-white',         darkBg: 'dark:bg-slate-500',        darkText: 'dark:text-white',         dot: 'bg-slate-500',     headerText: 'text-slate-600',     darkHeaderText: 'dark:text-slate-400' },
}

const navItems: NavItem[] = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, section: 'Overview' },
  { key: 'forecourt', label: 'Forecourt', icon: Fuel, section: 'Operations' },
  { key: 'tanks', label: 'Tanks & Wet Stock', icon: Droplets, section: 'Operations' },
  { key: 'sales', label: 'Fuel Sales', icon: Receipt, section: 'Operations' },
  { key: 'fleet', label: 'Fleet & RFID', icon: Truck, section: 'Operations' },
  { key: 'pricing', label: 'Price Management', icon: DollarSign, section: 'Business' },
  { key: 'retail', label: 'Retail Store', icon: ShoppingCart, section: 'Business' },
  { key: 'employees', label: 'Employees', icon: Users, section: 'Business' },
  { key: 'finance', label: 'Finance', icon: Wallet, section: 'Business' },
  { key: 'multisite', label: 'Multi-Site', icon: Building2, section: 'Management' },
  { key: 'ai-suite', label: 'AI Suite', icon: Brain, section: 'Intelligence' },
  { key: 'ev-cng', label: 'EV & CNG', icon: Zap, section: 'Intelligence' },
  { key: 'devices', label: 'Device Integration', icon: Cpu, section: 'System' },
  { key: 'security', label: 'Security Center', icon: Shield, section: 'System' },
  { key: 'comms', label: 'Comms Layer', icon: Wifi, section: 'System' },
  { key: 'reports', label: 'Report Builder', icon: BarChart3, section: 'System' },
  { key: 'api-webhooks', label: 'API & Webhooks', icon: Radio, section: 'System' },
  { key: 'settings', label: 'Settings', icon: Settings, section: 'System' },
  { key: 'owner', label: 'Owner Console', icon: Crown, section: 'System' },
]

const moduleComponents: Record<ModuleKey, React.ComponentType> = {
  dashboard: DashboardOverview,
  forecourt: ForecourtModule,
  tanks: TanksModule,
  sales: SalesModule,
  fleet: FleetModule,
  pricing: PricingModule,
  retail: RetailModule,
  employees: EmployeesModule,
  finance: FinanceModule,
  multisite: MultiSiteModule,
  'ai-suite': AISuiteModule,
  'ev-cng': EVCNGModule,
  devices: DeviceIntegrationModule,
  security: SecurityCenterModule,
  comms: CommsLayerModule,
  reports: ReportBuilderModule,
  'api-webhooks': APIWebhooksModule,
  settings: SettingsModule,
  owner: OwnerModule,
}

const staticStations = [
  { value: 'all', label: 'All Stations' },
  { value: 'downtown', label: 'Downtown Station' },
  { value: 'highway', label: 'Highway Plaza' },
  { value: 'airport', label: 'Airport Terminal' },
  { value: 'suburban', label: 'Suburban Branch' },
]

// ── Sub-Components ────────────────────────────────────────

function LiveClock() {
  const [time, setTime] = useState<string>('')
  const [date, setDate] = useState<string>('')

  useEffect(() => {
    function update() {
      const now = new Date()
      setTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }))
      setDate(now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }))
    }
    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="hidden sm:flex items-center gap-2 text-[12px]">
      <span className="font-medium text-foreground/70 font-mono">{time}</span>
      <span className="text-muted-foreground">{date}</span>
    </div>
  )
}

// macOS Sidebar Navigation Content
function SidebarNavContent({
  activeModule,
  setActiveModule,
  selectedStation,
  setSelectedStation,
  isViewOnly,
  isSuperAdmin,
  userName,
  userInitials,
  userRole,
  onNavClick,
}: {
  activeModule: ModuleKey
  setActiveModule: (m: ModuleKey) => void
  selectedStation: string
  setSelectedStation: (s: string) => void
  isViewOnly: boolean
  isSuperAdmin: boolean
  userName: string
  userInitials: string
  userRole: string
  onNavClick?: () => void
}) {
  // Group nav items by section
  const sections = navItems.reduce<Record<string, NavItem[]>>((acc, item) => {
    const section = item.section || 'Other'
    if (!acc[section]) acc[section] = []
    acc[section].push(item)
    return acc
  }, {})

  return (
    <div className="flex h-full flex-col py-2">
      {/* Logo Area */}
      <div className="flex items-center gap-2.5 px-4 pb-3 pt-1">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-[10px] fuel-gradient shadow-sm">
          <Fuel className="size-4 text-white" />
        </div>
        <div className="min-w-0">
          <h1 className="text-[13px] font-bold text-foreground tracking-tight leading-tight">FuelFlow OS</h1>
          <p className="text-[10px] text-muted-foreground leading-tight">ApexFlow Ecosystem</p>
        </div>
      </div>

      {/* View Only Badge */}
      {isViewOnly && (
        <div className="px-3 pb-1">
          <div className="flex items-center gap-1.5 rounded-md bg-teal-500/10 border border-teal-500/15 px-2 py-1">
            <EyeOff className="size-3 text-teal-500" />
            <span className="text-[10px] font-semibold text-teal-600 dark:text-teal-400">View Only</span>
          </div>
        </div>
      )}

      {/* Station Selector */}
      <div className="px-3 pb-2 pt-1">
        <Select value={selectedStation} onValueChange={setSelectedStation}>
          <SelectTrigger className="h-7 w-full text-[12px] bg-black/[0.03] dark:bg-white/[0.04] border-0 rounded-md focus:ring-1 focus:ring-teal-500/30">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {staticStations.map((s) => (
              <SelectItem key={s.value} value={s.value} className="text-[12px]">
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 overflow-y-auto px-2 pb-2">
        {Object.entries(sections).map(([section, items]) => {
          const colors = sectionColors[section] || sectionColors.System
          return (
            <div key={section} className="mb-1">
              <div className={`macos-section-header px-1 ${colors.headerText} ${colors.darkHeaderText}`}>
                <span className={`macos-section-dot ${colors.dot}`} />
                {section}
              </div>
              {items.map((item) => {
                const isActive = activeModule === item.key
                const Icon = item.icon
                return (
                  <button
                    key={item.key}
                    onClick={() => {
                      setActiveModule(item.key)
                      onNavClick?.()
                    }}
                    className={`macos-sidebar-item w-full ${isActive ? 'active' : ''} ${isActive ? `${colors.bg} ${colors.text} ${colors.darkBg} ${colors.darkText}` : ''}`}
                  >
                    <Icon className="size-[15px] shrink-0" strokeWidth={isActive ? 2 : 1.5} />
                    <span className="truncate">{item.label}</span>
                    {item.key === 'ai-suite' && !isActive && (
                      <span className="ml-auto text-[9px] font-bold rounded-md bg-violet-500/15 text-violet-600 dark:text-violet-400 px-1.5 py-0.5">
                        AI
                      </span>
                    )}
                    {item.key === 'ai-suite' && isActive && (
                      <span className="ml-auto text-[9px] font-bold rounded-md bg-white/20 text-white px-1.5 py-0.5">
                        AI
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          )
        })}
      </nav>

      {/* User Profile at Bottom */}
      <div className="border-t border-border px-3 py-2.5">
        <div className="flex items-center gap-2.5">
          <Avatar className={`size-7 border ${isSuperAdmin ? 'border-orange-500/30' : 'border-teal-500/20'}`}>
            <AvatarFallback className={`${isSuperAdmin ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400' : 'bg-teal-500/10 text-teal-600 dark:text-teal-400'} text-[10px] font-bold rounded-md`}>
              {userInitials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold text-foreground truncate">{userName}</p>
            <div className="flex items-center gap-1.5">
              {isSuperAdmin && <Crown className="size-2.5 text-orange-500" />}
              <p className={`text-[10px] ${isSuperAdmin ? 'text-orange-500 font-semibold' : 'text-muted-foreground'}`}>{userRole}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main App Component ────────────────────────────────────

export default function Home() {
  const {
    activeModule,
    setActiveModule,
    sidebarCollapsed,
    setSidebarCollapsed,
    sidebarOpen,
    setSidebarOpen,
    selectedStation,
    setSelectedStation,
    isAuthenticated,
    authUser,
    accessLevel,
    logout,
  } = useAppStore()

  const { theme, setTheme } = useTheme()
  const isMobile = useIsMobile()
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )

  const currentNav = navItems.find((n) => n.key === activeModule)
  const ActiveModuleComponent = moduleComponents[activeModule]
  const stationLabel = staticStations.find((s) => s.value === selectedStation)?.label ?? 'All Stations'
  const isViewOnly = accessLevel === 'view-only'

  const isSuperAdmin = authUser?.role === 'superadmin'
  const userName = authUser?.name || 'James Morrison'
  const userInitials = userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
  const userRole = authUser?.isDemo ? 'Demo Viewer' : authUser?.role === 'superadmin' ? 'Super Admin' : authUser?.role || 'Station Manager'

  const handleLogout = useCallback(async () => {
    try {
      await fetch('/api/auth/session', { method: 'DELETE' })
    } catch {
      // ignore
    }
    logout()
  }, [logout])

  // Loading screen during hydration
  if (!mounted) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl fuel-gradient">
            <Fuel className="size-5 text-white" />
          </div>
          <span className="text-[15px] font-semibold text-foreground">FuelFlow OS</span>
        </div>
      </div>
    )
  }

  // Not authenticated — show login
  if (!isAuthenticated) {
    return <LoginPage />
  }

  // ── Authenticated App Shell ──

  return (
    <div className="flex h-screen overflow-hidden macos-window-bg">
      {/* ── Desktop Sidebar ── */}
      {!isMobile && (
        <motion.aside
          initial={false}
          animate={{ width: sidebarCollapsed ? 0 : 260 }}
          transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
          className="macos-sidebar relative flex shrink-0 flex-col overflow-hidden"
          style={{ width: sidebarCollapsed ? 0 : 260 }}
        >
          <SidebarNavContent
            activeModule={activeModule}
            setActiveModule={setActiveModule}
            selectedStation={selectedStation}
            setSelectedStation={setSelectedStation}
            isViewOnly={isViewOnly}
            isSuperAdmin={isSuperAdmin}
            userName={userName}
            userInitials={userInitials}
            userRole={userRole}
          />
        </motion.aside>
      )}

      {/* ── Mobile Sidebar Sheet ── */}
      {isMobile && (
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side="left" className="w-[280px] p-0 macos-sidebar border-0">
            <SheetHeader className="sr-only">
              <SheetTitle>Navigation Menu</SheetTitle>
            </SheetHeader>
            <SidebarNavContent
              activeModule={activeModule}
              setActiveModule={setActiveModule}
              selectedStation={selectedStation}
              setSelectedStation={setSelectedStation}
              isViewOnly={isViewOnly}
              isSuperAdmin={isSuperAdmin}
              userName={userName}
              userInitials={userInitials}
              userRole={userRole}
              onNavClick={() => setSidebarOpen(false)}
            />
          </SheetContent>
        </Sheet>
      )}

      {/* ── Main Content Area ── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* ── macOS Titlebar ── */}
        <header className="macos-titlebar flex h-[52px] shrink-0 items-center px-4 gap-3 z-20">
          {/* Sidebar Toggle */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="flex items-center justify-center size-7 rounded-md hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors"
            title={sidebarCollapsed ? 'Show Sidebar' : 'Hide Sidebar'}
          >
            <ChevronRight className={`size-3.5 text-muted-foreground transition-transform ${sidebarCollapsed ? '' : 'rotate-180'}`} />
          </button>

          {/* Center: Module Title */}
          <div className="flex-1 flex items-center justify-center">
            <div className="flex items-center gap-2">
              {currentNav && (() => {
                const secColors = sectionColors[currentNav.section || 'System'] || sectionColors.System
                return (
                  <>
                    <currentNav.icon className={`size-3.5 ${secColors.headerText} ${secColors.darkHeaderText}`} strokeWidth={1.5} />
                    <span className={`text-[13px] font-semibold ${secColors.headerText} ${secColors.darkHeaderText}`}>{currentNav?.label || 'Dashboard'}</span>
                  </>
                )
              })()}
            </div>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-1.5">
            {/* View Only Badge */}
            {isViewOnly && (
              <Badge variant="outline" className="hidden sm:flex items-center gap-1 text-[10px] px-2 py-0 border-teal-500/20 text-teal-600 dark:text-teal-400 bg-teal-500/5 rounded-md font-medium">
                <EyeOff className="size-3" />
                View Only
              </Badge>
            )}

            <LiveClock />

            {/* WebSocket Status */}
            <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-md bg-black/[0.02] dark:bg-white/[0.03]" title="Forecourt Controller Connection">
              <div className="macos-status-dot macos-status-online" />
              <span className="text-[11px] font-medium text-muted-foreground">Live</span>
            </div>

            {/* Notification Bell */}
            <button className="relative flex items-center justify-center size-7 rounded-md hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors">
              <Bell className="size-4 text-muted-foreground" />
              <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                3
              </span>
            </button>

            {/* AI Alerts */}
            <button className="relative flex items-center justify-center size-7 rounded-md hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors" title="AI Alerts - 1 critical">
              <Brain className="size-4 text-muted-foreground" />
              <span className="absolute -top-0.5 -right-0.5 flex size-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-red-500" />
              </span>
            </button>

            {/* Theme Toggle */}
            <button
              className="flex items-center justify-center size-7 rounded-md hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              {theme === 'dark' ? <Sun className="size-4 text-muted-foreground" /> : <Moon className="size-4 text-muted-foreground" />}
            </button>

            {/* User Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1.5 rounded-md px-1.5 py-1 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors">
                  <Avatar className={`size-6 border ${isSuperAdmin ? 'border-orange-500/20' : 'border-teal-500/15'}`}>
                    <AvatarFallback className={`${isSuperAdmin ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400' : 'bg-teal-500/10 text-teal-600 dark:text-teal-400'} text-[9px] font-bold rounded-[5px]`}>
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <ChevronDown className="size-3 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 rounded-xl shadow-lg border-border/50">
                <div className="px-3 py-2">
                  <div className="flex items-center gap-1.5">
                    <p className="text-[13px] font-semibold">{userName}</p>
                    {isSuperAdmin && <Crown className="size-3 text-orange-500" />}
                  </div>
                  <p className="text-[11px] text-muted-foreground">{authUser?.email || 'j.morrison@apexfuel.com'}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    {isSuperAdmin && (
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-orange-500/20 text-orange-500 bg-orange-500/5 rounded-md">
                        <Crown className="size-2.5 mr-0.5" />
                        Super Admin
                      </Badge>
                    )}
                    {isViewOnly && (
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-teal-500/20 text-teal-500 bg-teal-500/5 rounded-md">
                        <Eye className="size-2.5 mr-0.5" />
                        View Only
                      </Badge>
                    )}
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-[13px] rounded-md">
                  <User className="mr-2 size-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem className="text-[13px] rounded-md">
                  <Settings className="mr-2 size-4" />
                  Preferences
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-[13px] rounded-md text-red-500 focus:text-red-500" onClick={handleLogout}>
                  <LogOut className="mr-2 size-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* ── Content Area ── */}
        <main className="flex-1 overflow-y-auto macos-content">
          {/* View Only Notice */}
          {isViewOnly && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mx-6 mt-4 flex items-center gap-2.5 rounded-xl border border-teal-500/15 bg-teal-500/5 px-4 py-2.5"
            >
              <Eye className="size-4 text-teal-500 shrink-0" />
              <p className="text-[12px] text-teal-700 dark:text-teal-400">
                You are in <strong>View Only</strong> mode. All modifications are disabled.
                <span className="text-muted-foreground ml-1">Sign in with a full account to make changes.</span>
              </p>
            </motion.div>
          )}

          {/* Active Module with Animation */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeModule}
              initial={{ opacity: 0, y: 6, scale: 0.995 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.995 }}
              transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
              className="p-6"
            >
              <ActiveModuleComponent />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
