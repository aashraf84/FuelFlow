import { create } from 'zustand'

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

interface AppState {
  activeModule: ModuleKey
  sidebarOpen: boolean
  sidebarCollapsed: boolean
  selectedStation: string
  theme: 'light' | 'dark'
  setActiveModule: (module: ModuleKey) => void
  setSidebarOpen: (open: boolean) => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setSelectedStation: (station: string) => void
  setTheme: (theme: 'light' | 'dark') => void
}

export const useAppStore = create<AppState>((set) => ({
  activeModule: 'dashboard',
  sidebarOpen: true,
  sidebarCollapsed: false,
  selectedStation: 'all',
  theme: 'light',
  setActiveModule: (module) => set({ activeModule: module }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  setSelectedStation: (station) => set({ selectedStation: station }),
  setTheme: (theme) => set({ theme }),
}))
