'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Shield, Users, AlertTriangle, HardDrive, Lock, Key, Clock,
  RefreshCw, Monitor, Ban, CheckCircle2, XCircle, Eye,
  Globe, Fingerprint, Server, Activity, Search, Filter,
  ChevronRight, Wifi, Database, Scan, ScanFace, FileWarning,
  Loader2,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAppStore } from '@/stores/app-store'

// ── Types ──────────────────────────────────────────────────

interface SecurityOverview {
  activeSessions: number
  unresolvedAlerts: number
  lastBackup: {
    id: string
    backupType: string
    status: string
    completedAt: string | null
    fileSize: number | null
  } | null
  activeEncryptionKeys: number
}

interface SecuritySessionData {
  id: string
  userId: string
  tenantId: string | null
  tokenHash: string | null
  ipAddress: string | null
  userAgent: string | null
  deviceInfo: string | null
  loginAt: string
  lastActivityAt: string
  logoutAt: string | null
  status: string
  expiresAt: string | null
  user: { id: string; name: string; email: string; role: string }
}

interface RBACPermissionData {
  id: string
  tenantId: string | null
  role: string
  module: string
  action: string
  isAllowed: boolean
}

interface SecurityAlertData {
  id: string
  tenantId: string | null
  stationId: string | null
  alertType: string
  severity: string
  title: string
  description: string | null
  sourceIp: string | null
  targetEntity: string | null
  targetEntityId: string | null
  isResolved: boolean
  resolvedAt: string | null
  resolvedBy: string | null
  createdAt: string
}

interface EncryptionKeyData {
  id: string
  tenantId: string | null
  keyType: string
  keyReference: string
  isActive: boolean
  rotatedAt: string | null
  expiresAt: string | null
  createdAt: string
}

interface AuditLogData {
  id: string
  userId: string | null
  tenantId: string | null
  action: string
  entity: string
  entityId: string | null
  details: string | null
  ipAddress: string | null
  userAgent: string | null
  createdAt: string
  user: { id: string; name: string; email: string; role: string } | null
}

// ── Helpers ──────────────────────────────────────────────

const THREAT_MAP: Record<string, { label: string; color: string; dot: string }> = {
  low: { label: 'Low', color: 'text-emerald-600 dark:text-emerald-400', dot: 'macos-status-online' },
  medium: { label: 'Medium', color: 'text-teal-600 dark:text-teal-400', dot: 'macos-status-warning' },
  high: { label: 'High', color: 'text-red-600 dark:text-red-400', dot: 'macos-status-error' },
}

const LEVEL_MAP: Record<string, string> = {
  info: 'text-muted-foreground',
  warning: 'text-teal-600 dark:text-teal-400',
  critical: 'text-red-600 dark:text-red-400',
  error: 'text-red-600 dark:text-red-400',
}

const ALERT_TYPE_MAP: Record<string, { dot: string; bg: string }> = {
  critical: { dot: 'macos-status-error', bg: 'bg-red-500/5 border-red-500/10' },
  error: { dot: 'macos-status-error', bg: 'bg-red-500/5 border-red-500/10' },
  warning: { dot: 'macos-status-warning', bg: 'bg-teal-500/5 border-teal-500/10' },
  info: { dot: 'macos-status-online', bg: 'bg-emerald-500/5 border-emerald-500/10' },
}

const PERMISSION_COLORS: Record<string, string> = {
  full: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  edit: 'bg-teal-500/10 text-teal-600 border-teal-500/20',
  write: 'bg-teal-500/10 text-teal-600 border-teal-500/20',
  view: 'bg-sky-500/10 text-sky-600 border-sky-500/20',
  read: 'bg-sky-500/10 text-sky-600 border-sky-500/20',
  none: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  deny: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
}

const ROLE_COLORS: Record<string, string> = {
  superadmin: 'bg-red-500/10 text-red-600 border-red-500/20',
  admin: 'bg-teal-500/10 text-teal-600 border-teal-500/20',
  manager: 'bg-teal-500/10 text-teal-600 border-teal-500/20',
  operator: 'bg-sky-500/10 text-sky-600 border-sky-500/20',
  cashier: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  attendant: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
  viewer: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
}

const SEVERITY_MAP: Record<string, string> = {
  error: 'critical',
  critical: 'critical',
  warning: 'warning',
  info: 'info',
}

const KEY_TYPE_MAP: Record<string, string> = {
  aes256: 'AES-256-GCM',
  aes128: 'AES-128-CBC',
  rsa2048: 'RSA-2048',
  rsa4096: 'RSA-4096',
  hmac256: 'HMAC-SHA256',
}

// ── Skeleton ──────────────────────────────────────────────

function SkeletonRow({ cols }: { cols: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="py-3 px-4">
          <div className="h-3.5 rounded bg-muted/40 animate-pulse" style={{ width: `${60 + Math.random() * 40}%` }} />
        </td>
      ))}
    </tr>
  )
}

// ── Component ──────────────────────────────────────────────

export default function SecurityCenterModule() {
  const [activeTab, setActiveTab] = useState('overview')
  const [auditFilter, setAuditFilter] = useState('all')

  // Data state
  const [overview, setOverview] = useState<SecurityOverview | null>(null)
  const [sessions, setSessions] = useState<SecuritySessionData[]>([])
  const [permissions, setPermissions] = useState<RBACPermissionData[]>([])
  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlertData[]>([])
  const [encryptionKeys, setEncryptionKeys] = useState<EncryptionKeyData[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLogData[]>([])

  // Loading & error state
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [overviewRes, sessionsRes, rbacRes, alertsRes, encryptionRes, auditRes] = await Promise.all([
        fetch('/api/security'),
        fetch('/api/security?section=sessions'),
        fetch('/api/security?section=rbac'),
        fetch('/api/security?section=alerts'),
        fetch('/api/security?section=encryption'),
        fetch('/api/audit?limit=50'),
      ])

      if (!overviewRes.ok) throw new Error('Failed to fetch security data')

      const overviewData = await overviewRes.json()
      const sessionsData = await sessionsRes.json()
      const rbacData = await rbacRes.json()
      const alertsData = await alertsRes.json()
      const encryptionData = await encryptionRes.json()
      const auditData = await auditRes.json()

      setOverview(overviewData.overview || null)
      setSessions(sessionsData.sessions || [])
      setPermissions(rbacData.permissions || [])
      setSecurityAlerts(alertsData.alerts || [])
      setEncryptionKeys(encryptionData.keys || [])
      setAuditLogs(auditData.logs || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleRevokeSession = async (sessionId: string) => {
    setActionLoading(sessionId)
    try {
      const res = await fetch('/api/security', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'revoke_session', sessionId }),
      })
      if (res.ok) {
        setSessions(prev => prev.filter(s => s.id !== sessionId))
      }
    } catch (err) {
      console.error('Revoke session error:', err)
    } finally {
      setActionLoading(null)
    }
  }

  const handleResolveAlert = async (alertId: string) => {
    setActionLoading(alertId)
    try {
      const res = await fetch('/api/security', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resolve_alert', alertId }),
      })
      if (res.ok) {
        setSecurityAlerts(prev => prev.map(a => a.id === alertId ? { ...a, isResolved: true, resolvedAt: new Date().toISOString() } : a))
      }
    } catch (err) {
      console.error('Resolve alert error:', err)
    } finally {
      setActionLoading(null)
    }
  }

  // Determine threat level based on unresolved alerts
  const threatLevel = (() => {
    const unresolvedCritical = securityAlerts.filter(a => !a.isResolved && (a.severity === 'critical' || a.severity === 'error')).length
    const unresolvedWarning = securityAlerts.filter(a => !a.isResolved && a.severity === 'warning').length
    if (unresolvedCritical > 0) return 'high'
    if (unresolvedWarning > 2) return 'medium'
    return 'low'
  })()

  const threat = THREAT_MAP[threatLevel]

  const filteredLogs = auditFilter === 'all'
    ? auditLogs
    : auditLogs.filter(l => {
        if (auditFilter === 'critical') return l.action.toLowerCase().includes('fail') || l.action.toLowerCase().includes('delete')
        if (auditFilter === 'warning') return l.action.toLowerCase().includes('update') || l.action.toLowerCase().includes('warning')
        return true
      })

  // Build RBAC matrix from permissions
  const rbacMatrix = (() => {
    const roleMap = new Map<string, Map<string, string>>()
    permissions.forEach(p => {
      if (!roleMap.has(p.role)) roleMap.set(p.role, new Map())
      const modules = roleMap.get(p.role)!
      const current = modules.get(p.module)
      if (p.isAllowed) {
        if (p.action === 'delete' || p.action === 'approve' || p.action === 'configure') {
          modules.set(p.module, 'full')
        } else if (p.action === 'write' && current !== 'full') {
          modules.set(p.module, 'edit')
        } else if (p.action === 'read' && !current) {
          modules.set(p.module, 'view')
        }
      } else if (!current) {
        modules.set(p.module, 'none')
      }
    })
    return Array.from(roleMap.entries()).map(([role, modules]) => ({
      role,
      modules: Object.fromEntries(modules),
    }))
  })()

  // Compute compliance score based on resolved alerts and active keys
  const complianceScore = (() => {
    if (!overview) return 0
    const total = securityAlerts.length || 1
    const resolved = securityAlerts.filter(a => a.isResolved).length
    const hasActiveKeys = overview.activeEncryptionKeys > 0
    const base = Math.round((resolved / total) * 100)
    return hasActiveKeys ? Math.min(100, base + 10) : base
  })()

  if (error) {
    return (
      <div className="macos-card p-8 text-center">
        <AlertTriangle className="size-8 text-red-500 mx-auto mb-3" />
        <p className="text-[13px] font-semibold text-red-500 mb-1">Failed to load security data</p>
        <p className="text-[12px] text-muted-foreground mb-3">{error}</p>
        <button onClick={fetchData} className="macos-btn gap-1.5">
          <RefreshCw className="size-3.5" /> Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4" style={{ fontStyle: 'normal !important' }}>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="overflow-x-auto pb-1">
          <TabsList className="h-8 w-max gap-0.5 bg-muted/50">
            <TabsTrigger value="overview" className="text-[11px] px-3 h-6 data-[state=active]:bg-teal-500/15 data-[state=active]:text-teal-600">Overview</TabsTrigger>
            <TabsTrigger value="audit" className="text-[11px] px-3 h-6 data-[state=active]:bg-teal-500/15 data-[state=active]:text-teal-600">Audit Log</TabsTrigger>
            <TabsTrigger value="sessions" className="text-[11px] px-3 h-6 data-[state=active]:bg-teal-500/15 data-[state=active]:text-teal-600">Sessions</TabsTrigger>
            <TabsTrigger value="rbac" className="text-[11px] px-3 h-6 data-[state=active]:bg-teal-500/15 data-[state=active]:text-teal-600">RBAC</TabsTrigger>
            <TabsTrigger value="alerts" className="text-[11px] px-3 h-6 data-[state=active]:bg-teal-500/15 data-[state=active]:text-teal-600">Alerts</TabsTrigger>
            <TabsTrigger value="encryption" className="text-[11px] px-3 h-6 data-[state=active]:bg-teal-500/15 data-[state=active]:text-teal-600">Encryption</TabsTrigger>
          </TabsList>
        </div>

        {/* ── Overview ── */}
        <TabsContent value="overview" className="mt-4 space-y-4">
          {loading ? (
            <div className="space-y-4">
              <div className="macos-card p-5 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="size-14 rounded-2xl bg-muted/40" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 rounded bg-muted/40 w-48" />
                    <div className="h-3 rounded bg-muted/40 w-64" />
                  </div>
                  <div className="size-14 rounded bg-muted/40" />
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="macos-card p-4 animate-pulse">
                    <div className="h-3 rounded bg-muted/40 w-24 mb-2" />
                    <div className="h-8 rounded bg-muted/40 w-12" />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* Threat Level Banner */}
              <div className="macos-card p-5">
                <div className="flex items-center gap-4">
                  <div className="size-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                    <Shield className="size-7 text-emerald-500" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-[15px] font-semibold">Security Status</h2>
                      <div className="flex items-center gap-1.5">
                        <div className={`macos-status-dot ${threat.dot}`} />
                        <span className={`text-[11px] font-semibold ${threat.color}`}>Threat Level: {threat.label}</span>
                      </div>
                    </div>
                    <p className="text-[12px] text-muted-foreground">
                      {overview?.unresolvedAlerts ? `${overview.unresolvedAlerts} unresolved alerts` : 'All security services operating normally. No active threats detected.'}
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{complianceScore}</div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Compliance</div>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Active Sessions', value: overview?.activeSessions ?? 0, icon: Monitor, accent: '#34c759' },
                  { label: 'Unresolved Alerts', value: overview?.unresolvedAlerts ?? 0, icon: Ban, accent: '#ff3b30' },
                  { label: 'Last Backup', value: overview?.lastBackup ? new Date(overview.lastBackup.completedAt || '').toLocaleDateString('en-PK', { month: 'short', day: 'numeric' }) : 'Never', icon: HardDrive, accent: '#ff9f0a', isText: true },
                  { label: 'Encryption Keys', value: overview?.activeEncryptionKeys ?? 0, icon: Key, accent: '#e8930c' },
                ].map((stat) => (
                  <div key={stat.label} className="macos-card p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">{stat.label}</p>
                        <p className={`text-2xl font-bold mt-0.5 ${stat.isText ? 'text-[16px]' : ''}`} style={{ color: stat.accent }}>{stat.value}</p>
                      </div>
                      <div className="size-9 rounded-[10px] flex items-center justify-center" style={{ backgroundColor: `${stat.accent}12` }}>
                        <stat.icon className="size-4" style={{ color: stat.accent }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Recent Alerts Preview */}
              <div>
                <div className="macos-section-header">Recent Alerts</div>
                <div className="macos-group mt-1">
                  {securityAlerts.length === 0 ? (
                    <div className="macos-group-item text-center py-6 text-[13px] text-muted-foreground">No security alerts</div>
                  ) : (
                    securityAlerts.slice(0, 3).map(alert => {
                      const severity = SEVERITY_MAP[alert.severity] || alert.severity
                      const cfg = ALERT_TYPE_MAP[severity] || ALERT_TYPE_MAP['info']
                      return (
                        <div key={alert.id} className="macos-group-item flex items-center gap-3">
                          <div className={`macos-status-dot ${cfg.dot}`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[13px] font-medium">{alert.title}</span>
                              {alert.isResolved && (
                                <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Resolved</Badge>
                              )}
                            </div>
                            <p className="text-[11px] text-muted-foreground truncate">{alert.description || alert.alertType}</p>
                          </div>
                          <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                            {new Date(alert.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </>
          )}
        </TabsContent>

        {/* ── Audit Log ── */}
        <TabsContent value="audit" className="mt-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <input className="macos-search pl-8 py-1.5 text-[12px]" placeholder="Search audit logs..." />
            </div>
            <div className="flex items-center gap-1.5">
              {['all', 'info', 'warning', 'critical'].map(f => (
                <button
                  key={f}
                  onClick={() => setAuditFilter(f)}
                  className={`text-[11px] px-2.5 py-1 rounded-md font-medium transition-colors capitalize ${
                    auditFilter === f
                      ? 'bg-teal-500/15 text-teal-600 dark:text-teal-400'
                      : 'text-muted-foreground hover:bg-black/[0.03] dark:hover:bg-white/[0.04]'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="macos-card overflow-hidden">
            <div className="max-h-[420px] overflow-y-auto">
              <table className="macos-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>User</th>
                    <th>Action</th>
                    <th>Entity</th>
                    <th>Details</th>
                    <th>IP</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} cols={6} />)
                  ) : filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center text-[13px] text-muted-foreground py-8">No audit logs found</td>
                    </tr>
                  ) : (
                    filteredLogs.map(log => {
                      const level = log.action.toLowerCase().includes('fail') || log.action.toLowerCase().includes('delete') ? 'critical' :
                                    log.action.toLowerCase().includes('update') ? 'warning' : 'info'
                      return (
                        <tr key={log.id}>
                          <td className="text-[12px] font-mono text-muted-foreground whitespace-nowrap">
                            {new Date(log.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </td>
                          <td className="text-[13px] font-medium">{log.user?.name || 'System'}</td>
                          <td>
                            <span className={`text-[12px] font-medium ${LEVEL_MAP[level] || ''}`}>{log.action}</span>
                          </td>
                          <td>
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">{log.entity}</Badge>
                          </td>
                          <td className="text-[12px] text-muted-foreground max-w-[250px] truncate">{log.details || '—'}</td>
                          <td className="text-[11px] font-mono text-muted-foreground">{log.ipAddress || '—'}</td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground">{filteredLogs.length} log entries</p>
        </TabsContent>

        {/* ── Active Sessions ── */}
        <TabsContent value="sessions" className="mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="macos-section-header">Active Sessions</div>
            <button className="macos-btn-secondary text-[11px] px-2.5 py-1 flex items-center gap-1">
              <Ban className="size-3" /> Revoke All
            </button>
          </div>
          <div className="macos-card overflow-hidden">
            <div className="max-h-[400px] overflow-y-auto">
              <table className="macos-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Device</th>
                    <th>IP</th>
                    <th>Login</th>
                    <th>Last Active</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} cols={7} />)
                  ) : sessions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center text-[13px] text-muted-foreground py-8">No active sessions</td>
                    </tr>
                  ) : (
                    sessions.map(s => (
                      <tr key={s.id}>
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="size-7 rounded-lg bg-teal-500/10 flex items-center justify-center text-[10px] font-bold text-teal-600 dark:text-teal-400">
                              {s.user?.name?.split(' ').map(w => w[0]).join('').slice(0, 2) || 'SY'}
                            </div>
                            <span className="text-[13px] font-medium">{s.user?.name || 'Unknown'}</span>
                          </div>
                        </td>
                        <td>
                          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 font-semibold ${ROLE_COLORS[s.user?.role?.toLowerCase()] || ''}`}>
                            {s.user?.role || 'Unknown'}
                          </Badge>
                        </td>
                        <td className="text-[12px] text-muted-foreground">{s.deviceInfo || s.userAgent || 'Unknown'}</td>
                        <td className="text-[11px] font-mono text-muted-foreground">{s.ipAddress || '—'}</td>
                        <td className="text-[12px] text-muted-foreground">
                          {new Date(s.loginAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="text-[12px]">
                          {(() => {
                            const diff = Date.now() - new Date(s.lastActivityAt).getTime()
                            const mins = Math.floor(diff / 60000)
                            return mins < 1 ? 'Just now' : mins < 60 ? `${mins} min ago` : `${Math.floor(mins / 60)} hr ago`
                          })()}
                        </td>
                        <td>
                          <button
                            onClick={() => handleRevokeSession(s.id)}
                            disabled={actionLoading === s.id}
                            className="text-[11px] text-red-500 hover:text-red-600 font-medium transition-colors disabled:opacity-50"
                          >
                            {actionLoading === s.id ? <Loader2 className="size-3 animate-spin" /> : 'Revoke'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* ── RBAC Matrix ── */}
        <TabsContent value="rbac" className="mt-4 space-y-3">
          <div className="macos-section-header">Role-Based Access Control Matrix</div>
          {loading ? (
            <div className="macos-card p-6 animate-pulse space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-8 rounded bg-muted/40" />
              ))}
            </div>
          ) : rbacMatrix.length === 0 ? (
            <div className="macos-card p-8 text-center text-[13px] text-muted-foreground">No RBAC permissions configured</div>
          ) : (
            <div className="macos-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="macos-table">
                  <thead>
                    <tr>
                      <th>Role</th>
                      {rbacMatrix[0] && Object.keys(rbacMatrix[0].modules).map(mod => (
                        <th key={mod} className="text-center">{mod}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rbacMatrix.map(row => (
                      <tr key={row.role}>
                        <td>
                          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 font-semibold capitalize ${ROLE_COLORS[row.role.toLowerCase()] || ''}`}>
                            {row.role}
                          </Badge>
                        </td>
                        {Object.entries(row.modules).map(([mod, perm]) => (
                          <td key={mod} className="text-center">
                            <Badge variant="outline" className={`text-[9px] px-1.5 py-0 font-semibold capitalize ${PERMISSION_COLORS[perm] || PERMISSION_COLORS['none']}`}>
                              {perm}
                            </Badge>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          <div className="flex items-center gap-4 mt-2">
            {Object.entries(PERMISSION_COLORS).map(([perm, cls]) => (
              <div key={perm} className="flex items-center gap-1.5">
                <Badge variant="outline" className={`text-[9px] px-1.5 py-0 font-semibold capitalize ${cls}`}>{perm}</Badge>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* ── Security Alerts ── */}
        <TabsContent value="alerts" className="mt-4 space-y-3">
          <div className="macos-section-header">Security Alerts Feed</div>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="macos-card p-4 animate-pulse">
                  <div className="flex items-start gap-3">
                    <div className="size-3 rounded-full bg-muted/40 mt-1.5" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 rounded bg-muted/40 w-48" />
                      <div className="h-3 rounded bg-muted/40 w-full" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : securityAlerts.length === 0 ? (
            <div className="macos-card p-8 text-center text-[13px] text-muted-foreground">No security alerts</div>
          ) : (
            <div className="space-y-2">
              {securityAlerts.map((alert, i) => {
                const severity = SEVERITY_MAP[alert.severity] || alert.severity
                const cfg = ALERT_TYPE_MAP[severity] || ALERT_TYPE_MAP['info']
                return (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className={`macos-card p-4 border ${cfg.bg}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`macos-status-dot mt-1.5 ${cfg.dot}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[13px] font-semibold">{alert.title}</span>
                          <Badge variant="outline" className={`text-[9px] px-1.5 py-0 font-semibold capitalize ${
                            alert.severity === 'critical' || alert.severity === 'error' ? 'bg-red-500/10 text-red-600 border-red-500/20' :
                            alert.severity === 'warning' ? 'bg-teal-500/10 text-teal-600 border-teal-500/20' :
                            'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                          }`}>
                            {alert.severity}
                          </Badge>
                          {alert.isResolved && (
                            <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                              <CheckCircle2 className="size-2.5 mr-0.5" /> Resolved
                            </Badge>
                          )}
                        </div>
                        <p className="text-[12px] text-muted-foreground">{alert.description || alert.alertType}</p>
                      </div>
                      <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                        {new Date(alert.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {!alert.isResolved && (
                      <div className="flex gap-2 mt-3 ml-5">
                        <button
                          onClick={() => handleResolveAlert(alert.id)}
                          disabled={actionLoading === alert.id}
                          className="macos-btn text-[11px] px-2.5 py-1 disabled:opacity-50"
                        >
                          {actionLoading === alert.id ? <Loader2 className="size-3 animate-spin" /> : 'Acknowledge'}
                        </button>
                        <button className="macos-btn-secondary text-[11px] px-2.5 py-1">Investigate</button>
                      </div>
                    )}
                  </motion.div>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* ── Encryption Keys ── */}
        <TabsContent value="encryption" className="mt-4 space-y-3">
          <div className="macos-card p-5">
            <div className="flex items-start gap-4">
              <div className="size-10 rounded-[10px] bg-teal-500/10 flex items-center justify-center shrink-0">
                <Fingerprint className="size-5 text-teal-500" />
              </div>
              <div className="flex-1">
                <h3 className="text-[13px] font-semibold">Encryption Management</h3>
                <p className="text-[12px] text-muted-foreground mt-0.5">All encryption keys are managed and rotated according to security policy. Keys are stored in a secure vault with AES-256 encryption at rest.</p>
              </div>
              <button className="macos-btn text-[11px] px-2.5 py-1 flex items-center gap-1">
                <RefreshCw className="size-3" /> Rotate All
              </button>
            </div>
          </div>

          <div className="macos-section-header">Encryption Keys</div>
          <div className="macos-card overflow-hidden">
            <div className="max-h-[350px] overflow-y-auto">
              <table className="macos-table">
                <thead>
                  <tr>
                    <th>Key ID</th>
                    <th>Algorithm</th>
                    <th>Purpose</th>
                    <th>Created</th>
                    <th>Last Rotated</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} cols={6} />)
                  ) : encryptionKeys.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center text-[13px] text-muted-foreground py-8">No encryption keys found</td>
                    </tr>
                  ) : (
                    encryptionKeys.map(key => (
                      <tr key={key.id}>
                        <td className="font-mono text-[12px] text-teal-600 dark:text-teal-400">{key.keyReference.slice(0, 12)}…</td>
                        <td className="text-[12px] font-mono">{KEY_TYPE_MAP[key.keyType] || key.keyType.toUpperCase()}</td>
                        <td className="text-[13px]">{key.keyReference}</td>
                        <td className="text-[12px] text-muted-foreground">{new Date(key.createdAt).toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                        <td className="text-[12px] text-muted-foreground">
                          {key.rotatedAt ? new Date(key.rotatedAt).toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' }) : 'Never'}
                        </td>
                        <td>
                          <div className="flex items-center gap-1.5">
                            <div className={`macos-status-dot ${key.isActive ? 'macos-status-online' : 'macos-status-offline'}`} />
                            <span className={`text-[11px] font-medium ${key.isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}>
                              {key.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
