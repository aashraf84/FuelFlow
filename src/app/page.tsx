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
  ChevronLeft,
  ChevronRight,
  Search,
  Bell,
  Moon,
  Sun,
  Menu,
  ChevronDown,
  LogOut,
  User,
  Shield,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
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

import DashboardOverview from '@/components/fuelflow/DashboardOverview'
import ForecourtModule from '@/components/fuelflow/ForecourtModule'
import TanksModule from '@/components/fuelflow/TanksModule'
import SalesModule from '@/components/fuelflow/SalesModule'
import FleetModule from '@/components/fuelflow/FleetModule'
import PricingModule from '@/components/fuelflow/PricingModule'
import RetailModule from '@/components/fuelflow/RetailModule'
import EmployeesModule from '@/components/fuelflow/EmployeesModule'
import FinanceModule from '@/components/fuelflow/FinanceModule'
import MultiSiteModule from '@/components/fuelflow/MultiSiteModule'
import AISuiteModule from '@/components/fuelflow/AISuiteModule'
import EVCNGModule from '@/components/fuelflow/EVCNGModule'
import SettingsModule from '@/components/fuelflow/SettingsModule'

const navItems: { key: ModuleKey; label: string; icon: React.ElementType }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'forecourt', label: 'Forecourt', icon: Fuel },
  { key: 'tanks', label: 'Tanks & Wet Stock', icon: Droplets },
  { key: 'sales', label: 'Fuel Sales', icon: Receipt },
  { key: 'fleet', label: 'Fleet & RFID', icon: Truck },
  { key: 'pricing', label: 'Price Management', icon: DollarSign },
  { key: 'retail', label: 'Retail Store', icon: ShoppingCart },
  { key: 'employees', label: 'Employees', icon: Users },
  { key: 'finance', label: 'Finance', icon: Wallet },
  { key: 'multisite', label: 'Multi-Site', icon: Building2 },
  { key: 'ai-suite', label: 'AI Suite', icon: Brain },
  { key: 'ev-cng', label: 'EV & CNG', icon: Zap },
  { key: 'settings', label: 'Settings', icon: Settings },
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
  settings: SettingsModule,
}

const staticStations = [
  { value: 'all', label: 'All Stations' },
  { value: 'downtown', label: 'Downtown Station' },
  { value: 'highway', label: 'Highway Plaza' },
  { value: 'airport', label: 'Airport Terminal' },
  { value: 'suburban', label: 'Suburban Branch' },
]

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
    <div className="hidden sm:flex flex-col items-end text-xs">
      <span className="font-mono font-medium">{time}</span>
      <span className="text-muted-foreground">{date}</span>
    </div>
  )
}

function SidebarNavContent({
  collapsed,
  activeModule,
  setActiveModule,
  selectedStation,
  setSelectedStation,
  onNavClick,
}: {
  collapsed: boolean
  activeModule: ModuleKey
  setActiveModule: (m: ModuleKey) => void
  selectedStation: string
  setSelectedStation: (s: string) => void
  onNavClick?: () => void
}) {
  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-700/50">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/20">
          <Fuel className="size-5 text-white" />
        </div>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            className="overflow-hidden"
          >
            <h1 className="text-base font-bold text-white tracking-tight">FuelFlow OS</h1>
            <p className="text-[10px] text-slate-400 leading-tight">ApexFlow Ecosystem</p>
          </motion.div>
        )}
      </div>

      {/* Station Selector */}
      {!collapsed && (
        <div className="px-3 py-3">
          <Select value={selectedStation} onValueChange={setSelectedStation}>
            <SelectTrigger className="h-8 w-full border-slate-600 bg-slate-800/50 text-xs text-slate-200 hover:bg-slate-700/50 focus:ring-amber-500/30">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {staticStations.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      {collapsed && <div className="py-2" />}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5">
        {navItems.map((item) => {
          const isActive = activeModule === item.key
          const Icon = item.icon
          return (
            <button
              key={item.key}
              onClick={() => {
                setActiveModule(item.key)
                onNavClick?.()
              }}
              className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-amber-500/15 text-amber-400 sidebar-nav-active'
                  : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'
              }`}
              title={collapsed ? item.label : undefined}
            >
              <Icon
                className={`size-4 shrink-0 transition-colors ${
                  isActive ? 'text-amber-400' : 'text-slate-500 group-hover:text-slate-300'
                }`}
              />
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="truncate"
                >
                  {item.label}
                </motion.span>
              )}
              {!collapsed && item.key === 'ai-suite' && (
                <Badge className="ml-auto text-[9px] px-1.5 py-0 bg-amber-500/20 text-amber-400 border-amber-500/30 hover:bg-amber-500/30">
                  AI
                </Badge>
              )}
            </button>
          )
        })}
      </nav>

      {/* User Profile */}
      <div className="border-t border-slate-700/50 px-3 py-3">
        {!collapsed ? (
          <div className="flex items-center gap-3">
            <Avatar className="size-8 border-2 border-amber-500/30">
              <AvatarFallback className="bg-amber-500/20 text-amber-400 text-xs font-semibold">
                JM
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-200 truncate">James Morrison</p>
              <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-amber-500/30 text-amber-400 bg-amber-500/10">
                <Shield className="size-2.5 mr-0.5" />
                Station Manager
              </Badge>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <Avatar className="size-8 border-2 border-amber-500/30">
              <AvatarFallback className="bg-amber-500/20 text-amber-400 text-xs font-semibold">
                JM
              </AvatarFallback>
            </Avatar>
          </div>
        )}
      </div>
    </div>
  )
}

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

  const toggleSidebar = useCallback(() => {
    if (isMobile) {
      setSidebarOpen(!sidebarOpen)
    } else {
      setSidebarCollapsed(!sidebarCollapsed)
    }
  }, [isMobile, sidebarOpen, sidebarCollapsed, setSidebarOpen, setSidebarCollapsed])

  const sidebarWidth = sidebarCollapsed ? 68 : 280

  if (!mounted) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-600">
            <Fuel className="size-5 text-white" />
          </div>
          <span className="text-lg font-bold">FuelFlow OS</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <motion.aside
          initial={false}
          animate={{ width: sidebarWidth }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          className="relative flex shrink-0 flex-col bg-slate-900 dark:bg-slate-950 text-white overflow-hidden"
        >
          <SidebarNavContent
            collapsed={sidebarCollapsed}
            activeModule={activeModule}
            setActiveModule={setActiveModule}
            selectedStation={selectedStation}
            setSelectedStation={setSelectedStation}
          />

          {/* Collapse Toggle */}
          <button
            onClick={toggleSidebar}
            className="absolute right-0 top-7 z-10 flex size-5 items-center justify-center rounded-l-md border border-r-0 border-slate-700 bg-slate-800 text-slate-400 hover:text-amber-400 hover:bg-slate-700 transition-colors"
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="size-3" />
            ) : (
              <ChevronLeft className="size-3" />
            )}
          </button>
        </motion.aside>
      )}

      {/* Mobile Sidebar Sheet */}
      {isMobile && (
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side="left" className="w-[280px] p-0 bg-slate-900 dark:bg-slate-950 border-slate-700">
            <SheetHeader className="sr-only">
              <SheetTitle>Navigation Menu</SheetTitle>
            </SheetHeader>
            <SidebarNavContent
              collapsed={false}
              activeModule={activeModule}
              setActiveModule={setActiveModule}
              selectedStation={selectedStation}
              setSelectedStation={setSelectedStation}
              onNavClick={() => setSidebarOpen(false)}
            />
          </SheetContent>
        </Sheet>
      )}

      {/* Main Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header Bar */}
        <header className="flex h-14 shrink-0 items-center gap-3 border-b bg-background px-4">
          {/* Mobile menu button */}
          {isMobile && (
            <Button variant="ghost" size="icon" className="shrink-0" onClick={() => setSidebarOpen(true)}>
              <Menu className="size-5" />
            </Button>
          )}

          {/* Station Name */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="hidden sm:flex size-7 items-center justify-center rounded-md bg-amber-500/10">
              <Fuel className="size-3.5 text-amber-500" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold truncate">{stationLabel}</h2>
              <p className="hidden sm:block text-[10px] text-muted-foreground leading-tight">{currentNav?.label || 'Dashboard'}</p>
            </div>
          </div>

          <Separator orientation="vertical" className="hidden sm:block h-6" />

          {/* Search Bar */}
          <div className="hidden md:flex items-center flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search transactions, pumps, customers..."
                className="h-8 w-full rounded-md border bg-muted/50 pl-8 pr-3 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/50 transition-colors"
                readOnly
              />
            </div>
          </div>

          <div className="flex-1 md:hidden" />

          {/* Live Clock */}
          <LiveClock />

          {/* WebSocket Status */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground" title="Forecourt Controller Connection">
            <div className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="hidden lg:inline">Live</span>
          </div>

          {/* Notification Bell */}
          <Button variant="ghost" size="icon" className="relative shrink-0">
            <Bell className="size-4" />
            <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
              3
            </span>
          </Button>

          {/* AI Alerts */}
          <Button variant="ghost" size="icon" className="relative shrink-0" title="AI Alerts - 1 critical">
            <Brain className="size-4" />
            <span className="absolute right-1.5 top-1.5 flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-red-500" />
            </span>
          </Button>

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </Button>

          {/* User Avatar Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="shrink-0 gap-2 px-2 h-8">
                <Avatar className="size-7">
                  <AvatarFallback className="bg-amber-500/20 text-amber-600 text-xs font-semibold">
                    JM
                  </AvatarFallback>
                </Avatar>
                <ChevronDown className="size-3 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">James Morrison</p>
                <p className="text-xs text-muted-foreground">j.morrison@apexfuel.com</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 size-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 size-4" />
                Preferences
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600 focus:text-red-600">
                <LogOut className="mr-2 size-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* Module Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {/* Module Header */}
          <div className="mb-6">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <LayoutDashboard className="size-3" />
              <span>FuelFlow OS</span>
              <span>/</span>
              <span className="text-foreground font-medium">{currentNav?.label}</span>
            </div>
          </div>

          {/* Active Module */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeModule}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
            >
              <ActiveModuleComponent />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
