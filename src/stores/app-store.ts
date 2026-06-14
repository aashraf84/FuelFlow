import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ModuleKey = 
  | 'dashboard'
  | 'forecourt'
  | 'tanks'
  | 'sales'
  | 'fleet'
  | 'pricing'
  | 'retail'
  | 'employees'
  | 'finance'
  | 'multisite'
  | 'ai-suite'
  | 'ev-cng'
  | 'settings'
  | 'devices'
  | 'security'
  | 'comms'
  | 'reports'
  | 'api-webhooks'
  | 'owner'

export type AccessLevel = 'full' | 'view-only'

export interface AuthUser {
  id: string
  name: string
  email: string
  role: string
  avatar: string | null
  isDemo: boolean
  tenant: {
    id: string
    name: string
    slug: string
    subscription: string
    isActive: boolean
  } | null
  lastLogin: string | null
}

interface AppState {
  activeModule: ModuleKey
  sidebarOpen: boolean
  sidebarCollapsed: boolean
  selectedStation: string
  theme: 'light' | 'dark'
  // Auth state
  isAuthenticated: boolean
  authUser: AuthUser | null
  accessLevel: AccessLevel
  // Actions
  setActiveModule: (module: ModuleKey) => void
  setSidebarOpen: (open: boolean) => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setSelectedStation: (station: string) => void
  setTheme: (theme: 'light' | 'dark') => void
  login: (user: AuthUser, accessLevel: AccessLevel) => void
  logout: () => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      activeModule: 'dashboard',
      sidebarOpen: true,
      sidebarCollapsed: false,
      selectedStation: 'all',
      theme: 'light',
      // Auth
      isAuthenticated: false,
      authUser: null,
      accessLevel: 'full',
      // Actions
      setActiveModule: (module) => set({ activeModule: module }),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      setSelectedStation: (station) => set({ selectedStation: station }),
      setTheme: (theme) => set({ theme }),
      login: (user, accessLevel) =>
        set({
          isAuthenticated: true,
          authUser: user,
          accessLevel,
          activeModule: 'dashboard',
        }),
      logout: () =>
        set({
          isAuthenticated: false,
          authUser: null,
          accessLevel: 'full',
          activeModule: 'dashboard',
        }),
    }),
    {
      name: 'fuelflow-auth',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        authUser: state.authUser,
        accessLevel: state.accessLevel,
      }),
    }
  )
)
