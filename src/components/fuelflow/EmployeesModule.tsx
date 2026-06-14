'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users,
  Clock,
  Wallet,
  Calendar,
  CheckCircle2,
  XCircle,
  UserPlus,
  TrendingUp,
  ArrowUpRight,
  Briefcase,
  Coffee,
  Shield,
  Wrench,
  Banknote,
  AlertCircle,
  RefreshCw,
  Loader2,
} from 'lucide-react'
import { useAppStore } from '@/stores/app-store'

// ── Types ──────────────────────────────────────────────────

interface EmployeeData {
  id: string
  stationId: string
  name: string
  employeeId: string | null
  role: string
  phone: string | null
  email: string | null
  hireDate: string | null
  salary: number | null
  commissionRate: number
  status: string
  avatar: string | null
  station: { id: string; name: string; code: string | null } | null
  shiftCount: number
  fuelingCount: number
  attendanceCount: number
  latestPayroll: { id: string; netPay: number; status: string; periodStart: string; periodEnd: string } | null
  pendingLeaveRequests: { id: string; leaveType: string; startDate: string; endDate: string; status: string }[]
  todayAttendance: { employeeId: string; checkIn: string; checkOut: string | null; status: string; hoursWorked: number | null } | null
}

interface LeaveRequestData {
  id: string
  stationId: string
  employeeId: string
  leaveType: string
  startDate: string
  endDate: string
  reason: string | null
  status: string
  approvedBy: string | null
  createdAt: string
  employee: { id: string; name: string; role: string; employeeId: string | null }
  station: { id: string; name: string; code: string | null }
}

interface PayrollSummary {
  totalRecords: number
  totalNetPay: number
  totalBaseSalary: number
  totalDeductions: number
  totalOvertime: number
  totalCommissions: number
  pendingCount: number
  paidCount: number
}

// ── Helpers ───────────────────────────────────────────────

const pkr = (n: number) => `PKR ${n.toLocaleString()}`

const roleConfig: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  manager: { icon: Briefcase, color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-500/10' },
  supervisor: { icon: Shield, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10' },
  attendant: { icon: Users, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-500/10' },
  cashier: { icon: Banknote, color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-500/10' },
  maintenance: { icon: Wrench, color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-500/10' },
}

const statusConfig: Record<string, { dot: string; label: string; color: string }> = {
  active: { dot: 'macos-status-online', label: 'Active', color: 'text-emerald-600 dark:text-emerald-400' },
  'on-shift': { dot: 'macos-status-online', label: 'On Shift', color: 'text-emerald-600 dark:text-emerald-400' },
  'on-leave': { dot: 'macos-status-warning', label: 'On Leave', color: 'text-teal-500' },
  'off-duty': { dot: 'macos-status-offline', label: 'Off Duty', color: 'text-muted-foreground' },
  new: { dot: 'macos-status-online', label: 'New', color: 'text-emerald-600 dark:text-emerald-400' },
  inactive: { dot: 'macos-status-offline', label: 'Inactive', color: 'text-muted-foreground' },
}

const leaveStatusConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  approved: { icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400', label: 'Approved' },
  rejected: { icon: XCircle, color: 'text-red-500', label: 'Rejected' },
  pending: { icon: AlertCircle, color: 'text-teal-500', label: 'Pending' },
}

type TabKey = 'employees' | 'attendance' | 'payroll' | 'leave'

const tabs: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: 'employees', label: 'Employees', icon: Users },
  { key: 'attendance', label: 'Attendance', icon: Clock },
  { key: 'payroll', label: 'Payroll', icon: Wallet },
  { key: 'leave', label: 'Leave Requests', icon: Calendar },
]

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

function SkeletonCard() {
  return (
    <div className="macos-card p-4 animate-pulse">
      <div className="h-3 rounded bg-muted/40 w-20 mb-2" />
      <div className="h-6 rounded bg-muted/40 w-12" />
    </div>
  )
}

// ── Component ─────────────────────────────────────────────

export default function EmployeesModule() {
  const [activeTab, setActiveTab] = useState<TabKey>('employees')
  const [employees, setEmployees] = useState<EmployeeData[]>([])
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequestData[]>([])
  const [payrollSummary, setPayrollSummary] = useState<PayrollSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { selectedStation } = useAppStore()

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const stationParam = selectedStation && selectedStation !== 'all' ? `?stationId=${selectedStation}` : ''
      const [empRes, leaveRes, payrollRes] = await Promise.all([
        fetch(`/api/employees${stationParam}`),
        fetch(`/api/leave${stationParam}`),
        fetch(`/api/payroll${stationParam}`),
      ])

      if (!empRes.ok || !leaveRes.ok || !payrollRes.ok) {
        throw new Error('Failed to fetch employee data')
      }

      const empData = await empRes.json()
      const leaveData = await leaveRes.json()
      const payrollData = await payrollRes.json()

      setEmployees(empData.employees || [])
      setLeaveRequests(leaveData.requests || [])
      setPayrollSummary(payrollData.summary || null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [selectedStation])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const totalEmp = employees.length
  const onShift = employees.filter(e => e.status === 'active' || e.status === 'on-shift' || e.status === 'new').length
  const onLeave = employees.filter(e => e.status === 'on-leave').length
  const newEmp = employees.filter(e => e.status === 'new').length

  if (error) {
    return (
      <div className="macos-card p-8 text-center">
        <AlertCircle className="size-8 text-red-500 mx-auto mb-3" />
        <p className="text-[13px] font-semibold text-red-500 mb-1">Failed to load employee data</p>
        <p className="text-[12px] text-muted-foreground mb-3">{error}</p>
        <button onClick={fetchData} className="macos-btn gap-1.5">
          <RefreshCw className="size-3.5" /> Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-5" style={{ fontStyle: 'normal !important' }}>
      {/* ── Summary Stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          [
            { label: 'Total Employees', value: totalEmp.toString(), icon: Users, accent: false },
            { label: 'On Shift', value: onShift.toString(), icon: Clock, accent: false },
            { label: 'On Leave', value: onLeave.toString(), icon: Coffee, accent: false },
            { label: 'New Hires', value: newEmp.toString(), icon: UserPlus, accent: true },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
              className="macos-card p-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{stat.label}</p>
                  <p className={`text-[20px] font-bold mt-1 ${stat.accent ? 'fuel-text-gradient' : 'text-foreground'}`}>
                    {stat.value}
                  </p>
                </div>
                <div className={`size-8 rounded-lg flex items-center justify-center ${stat.accent ? 'bg-teal-500/10' : 'bg-black/[0.03] dark:bg-white/[0.05]'}`}>
                  <stat.icon className={`size-4 ${stat.accent ? 'text-teal-500' : 'text-muted-foreground'}`} strokeWidth={1.5} />
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* ── Tab Bar ── */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 -mb-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key
          const Icon = tab.icon
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium transition-all duration-150 whitespace-nowrap ${
                isActive
                  ? 'bg-teal-500/10 text-teal-600 dark:text-teal-400'
                  : 'text-muted-foreground hover:bg-black/[0.03] dark:hover:bg-white/[0.05] hover:text-foreground'
              }`}
            >
              <Icon className="size-3.5" strokeWidth={isActive ? 2 : 1.5} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* ── Tab Content ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
        >
          {activeTab === 'employees' && <EmployeesTab employees={employees} loading={loading} onRefresh={fetchData} />}
          {activeTab === 'attendance' && <AttendanceTab employees={employees} loading={loading} />}
          {activeTab === 'payroll' && <PayrollTab employees={employees} payrollSummary={payrollSummary} loading={loading} />}
          {activeTab === 'leave' && <LeaveTab leaveRequests={leaveRequests} loading={loading} onRefresh={fetchData} />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

// ── Employees Tab ─────────────────────────────────────────

function EmployeesTab({ employees, loading, onRefresh }: { employees: EmployeeData[]; loading: boolean; onRefresh: () => void }) {
  const getRoleLabel = (role: string) => role.charAt(0).toUpperCase() + role.slice(1)

  return (
    <div className="macos-card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div>
          <h3 className="text-[13px] font-semibold">Employees</h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">{employees.length} total employees across stations</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onRefresh} className="macos-btn-secondary !px-2.5 !py-1 text-[11px] gap-1">
            <RefreshCw className="size-3" />
          </button>
          <button className="macos-btn gap-1">
            <UserPlus className="size-3.5" /> Add Employee
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="macos-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Role</th>
              <th>Station</th>
              <th>Shift</th>
              <th className="text-right">Salary</th>
              <th className="text-right">Commission</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={7} />)
            ) : employees.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-[13px] text-muted-foreground">
                  No employees found. Add employees or seed the database.
                </td>
              </tr>
            ) : (
              employees.map((emp) => {
                const role = roleConfig[emp.role] || roleConfig['attendant']
                const status = statusConfig[emp.status] || statusConfig['off-duty']
                const RoleIcon = role.icon
                return (
                  <tr key={emp.id}>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <div className={`size-8 rounded-lg flex items-center justify-center ${role.bg}`}>
                          <span className={`text-[11px] font-bold ${role.color}`}>
                            {emp.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </span>
                        </div>
                        <div>
                          <p className="text-[13px] font-semibold">{emp.name}</p>
                          <p className="text-[11px] text-muted-foreground">{emp.employeeId || emp.id.slice(0, 8)} · {emp.phone || '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <RoleIcon className={`size-3 ${role.color}`} />
                        <span className="text-[12px] font-medium">{getRoleLabel(emp.role)}</span>
                      </div>
                    </td>
                    <td className="text-muted-foreground">{emp.station?.name || '—'}</td>
                    <td>
                      <span className="macos-pill bg-black/[0.04] dark:bg-white/[0.06] text-muted-foreground">
                        {emp.todayAttendance ? (emp.todayAttendance.checkIn ? 'Morning' : '—') : '—'}
                      </span>
                    </td>
                    <td className="text-right font-mono">{emp.salary ? pkr(emp.salary) : '—'}</td>
                    <td className="text-right">
                      {emp.commissionRate > 0 ? (
                        <span className="font-mono text-teal-600 dark:text-teal-400">{emp.commissionRate}%</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <div className={`macos-status-dot ${status.dot}`} />
                        <span className={`text-[11px] font-medium ${status.color}`}>{status.label}</span>
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
  )
}

// ── Attendance Tab ────────────────────────────────────────

function AttendanceTab({ employees, loading }: { employees: EmployeeData[]; loading: boolean }) {
  const present = employees.filter(e => e.todayAttendance && e.todayAttendance.checkIn).length
  const onLeave = employees.filter(e => e.status === 'on-leave').length
  const offDuty = employees.filter(e => !e.todayAttendance || !e.todayAttendance.checkIn).length
  const late = employees.filter(e => e.todayAttendance && e.todayAttendance.status === 'late').length
  const total = employees.length || 1
  const rate = total > 0 ? Math.round((present / total) * 100) : 0

  const attStats = [
    { label: 'Present', value: present, total, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10', dot: 'macos-status-online' },
    { label: 'On Leave', value: onLeave, total, color: 'text-teal-500', bg: 'bg-teal-500/10', dot: 'macos-status-warning' },
    { label: 'Off Duty', value: offDuty, total, color: 'text-muted-foreground', bg: 'bg-black/[0.03] dark:bg-white/[0.05]', dot: 'macos-status-offline' },
    { label: 'Late Check-in', value: late, total, color: 'text-red-500', bg: 'bg-red-500/10', dot: 'macos-status-error' },
  ]

  const activeEmployees = employees.filter(e => e.status === 'active' || e.status === 'on-shift' || e.status === 'new')

  return (
    <div className="space-y-4">
      {/* Attendance Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          attStats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
              className="macos-card p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className={`macos-status-dot ${s.dot}`} />
                <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{s.label}</span>
              </div>
              <p className={`text-[24px] font-bold ${s.color}`}>{s.value}</p>
              <p className="text-[11px] text-muted-foreground">{Math.round((s.value / s.total) * 100)}% of workforce</p>
            </motion.div>
          ))
        )}
      </div>

      {/* Attendance Rate Card */}
      <div className="macos-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-[13px] font-semibold">Attendance Rate</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">Current shift overview</p>
          </div>
          <div className="text-right">
            <p className="text-[28px] font-bold fuel-text-gradient">{rate}%</p>
            <div className="flex items-center gap-1 justify-end mt-0.5">
              <TrendingUp className="size-3 text-emerald-500" />
              <span className="text-[11px] font-medium text-emerald-500">Live data</span>
            </div>
          </div>
        </div>
        <div className="w-full h-2 rounded-full bg-black/[0.04] dark:bg-white/[0.06] overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${rate}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="h-full rounded-full fuel-gradient"
          />
        </div>
      </div>

      {/* Who's On Shift */}
      <div className="macos-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-[13px] font-semibold">Currently Active</h3>
        </div>
        {loading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-10 rounded-lg bg-muted/30 animate-pulse" />
            ))}
          </div>
        ) : activeEmployees.length === 0 ? (
          <div className="p-8 text-center text-[13px] text-muted-foreground">No active employees</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-0">
            {activeEmployees.map((emp) => {
              const role = roleConfig[emp.role] || roleConfig['attendant']
              return (
                <div key={emp.id} className="macos-group-item !py-3 !px-4 flex items-center gap-2.5">
                  <div className={`size-9 rounded-lg flex items-center justify-center ${role.bg} shrink-0`}>
                    <span className={`text-[11px] font-bold ${role.color}`}>
                      {emp.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold truncate">{emp.name}</p>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] font-medium ${role.color}`}>{emp.role}</span>
                      {emp.todayAttendance && (
                        <span className="text-[10px] text-muted-foreground">· {new Date(emp.todayAttendance.checkIn).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Payroll Tab ───────────────────────────────────────────

function PayrollTab({ employees, payrollSummary, loading }: { employees: EmployeeData[]; payrollSummary: PayrollSummary | null; loading: boolean }) {
  const pr = payrollSummary || {
    totalNetPay: 0, totalBaseSalary: 0, totalDeductions: 0,
    totalOvertime: 0, totalCommissions: 0, pendingCount: 0, paidCount: 0,
  }

  // Derive period from current month
  const period = new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })

  return (
    <div className="space-y-4">
      {/* Payroll Overview Card */}
      <div className="macos-card p-5">
        {loading ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-4 rounded bg-muted/40 w-32" />
            <div className="h-8 rounded bg-muted/40 w-40" />
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between mb-5">
              <div>
                <h3 className="text-[13px] font-semibold">Payroll Overview</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">Period: {period}</p>
              </div>
              <div className="text-right">
                <p className="text-[11px] text-muted-foreground uppercase font-semibold">Net Payable</p>
                <p className="text-[28px] font-bold fuel-text-gradient">{pkr(pr.totalNetPay)}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Base Salary', value: pr.totalBaseSalary, icon: Wallet },
                { label: 'Overtime', value: pr.totalOvertime, icon: Clock },
                { label: 'Commissions', value: pr.totalCommissions, icon: TrendingUp },
                { label: 'Deductions', value: pr.totalDeductions, icon: ArrowUpRight, negative: true },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <item.icon className="size-3 text-muted-foreground" />
                    <span className="text-[11px] text-muted-foreground font-medium">{item.label}</span>
                  </div>
                  <p className={`text-[16px] font-bold ${item.negative ? 'text-red-500' : 'text-foreground'}`}>
                    {item.negative ? '-' : ''}{pkr(item.value)}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Payment Status */}
      <div className="grid grid-cols-2 gap-3">
        <div className="macos-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="macos-status-dot macos-status-online" />
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Paid</span>
          </div>
          <p className="text-[24px] font-bold text-emerald-600 dark:text-emerald-400">{pr.paidCount}</p>
          <p className="text-[11px] text-muted-foreground">employees paid this period</p>
        </div>
        <div className="macos-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="macos-status-dot macos-status-warning" />
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Pending</span>
          </div>
          <p className="text-[24px] font-bold text-teal-500">{pr.pendingCount}</p>
          <p className="text-[11px] text-muted-foreground">awaiting processing</p>
        </div>
      </div>

      {/* Salary Breakdown by Role */}
      <div className="macos-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-[13px] font-semibold">Salary Breakdown by Role</h3>
        </div>
        {loading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-10 rounded-lg bg-muted/30 animate-pulse" />
            ))}
          </div>
        ) : (
          (() => {
            const roleGroups = employees.reduce<Record<string, { count: number; totalSalary: number }>>((acc, emp) => {
              if (!acc[emp.role]) acc[emp.role] = { count: 0, totalSalary: 0 }
              acc[emp.role].count++
              acc[emp.role].totalSalary += emp.salary || 0
              return acc
            }, {})

            return Object.entries(roleGroups).map(([role, data]) => {
              const rc = roleConfig[role] || roleConfig['attendant']
              const RIcon = rc.icon
              return (
                <div key={role} className="macos-group-item flex items-center justify-between !px-4">
                  <div className="flex items-center gap-3">
                    <div className={`size-8 rounded-lg flex items-center justify-center ${rc.bg}`}>
                      <RIcon className={`size-4 ${rc.color}`} />
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold">{role.charAt(0).toUpperCase() + role.slice(1)}</p>
                      <p className="text-[11px] text-muted-foreground">{data.count} employees</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[13px] font-semibold text-teal-600 dark:text-teal-400">{pkr(data.totalSalary)}</p>
                    <p className="text-[11px] text-muted-foreground">avg {data.count > 0 ? pkr(Math.round(data.totalSalary / data.count)) : '—'}/mo</p>
                  </div>
                </div>
              )
            })
          })()
        )}
      </div>
    </div>
  )
}

// ── Leave Tab ─────────────────────────────────────────────

function LeaveTab({ leaveRequests, loading, onRefresh }: { leaveRequests: LeaveRequestData[]; loading: boolean; onRefresh: () => void }) {
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const pending = leaveRequests.filter(l => l.status === 'pending').length
  const approved = leaveRequests.filter(l => l.status === 'approved').length
  const rejected = leaveRequests.filter(l => l.status === 'rejected').length

  const handleLeaveAction = async (id: string, status: 'approved' | 'rejected') => {
    setActionLoading(id)
    try {
      const res = await fetch('/api/leave', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      })
      if (res.ok) {
        onRefresh()
      }
    } catch (err) {
      console.error('Leave action error:', err)
    } finally {
      setActionLoading(null)
    }
  }

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' })
    } catch {
      return dateStr
    }
  }

  const getDays = (start: string, end: string) => {
    try {
      const s = new Date(start)
      const e = new Date(end)
      return Math.max(1, Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1)
    } catch {
      return 1
    }
  }

  return (
    <div className="space-y-4">
      {/* Leave Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="macos-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="macos-status-dot macos-status-warning" />
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Pending</span>
          </div>
          <p className="text-[20px] font-bold text-teal-500">{pending}</p>
        </div>
        <div className="macos-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="macos-status-dot macos-status-online" />
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Approved</span>
          </div>
          <p className="text-[20px] font-bold text-emerald-600 dark:text-emerald-400">{approved}</p>
        </div>
        <div className="macos-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="macos-status-dot macos-status-error" />
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Rejected</span>
          </div>
          <p className="text-[20px] font-bold text-red-500">{rejected}</p>
        </div>
      </div>

      {/* Leave Requests List */}
      <div className="macos-card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="text-[13px] font-semibold">Leave Requests</h3>
          <span className="text-[11px] text-muted-foreground">{leaveRequests.length} total requests</span>
        </div>
        <div className="overflow-x-auto">
          <table className="macos-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Role</th>
                <th>Type</th>
                <th>From</th>
                <th>To</th>
                <th className="text-center">Days</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} cols={9} />)
              ) : leaveRequests.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-[13px] text-muted-foreground">
                    No leave requests found
                  </td>
                </tr>
              ) : (
                leaveRequests.map((lr) => {
                  const statusCfg = leaveStatusConfig[lr.status] || leaveStatusConfig['pending']
                  const StatusIcon = statusCfg.icon
                  return (
                    <tr key={lr.id}>
                      <td className="font-semibold">{lr.employee?.name || 'Unknown'}</td>
                      <td className="text-muted-foreground">{lr.employee?.role ? lr.employee.role.charAt(0).toUpperCase() + lr.employee.role.slice(1) : '—'}</td>
                      <td>
                        <span className={`macos-pill ${
                          lr.leaveType === 'sick'
                            ? 'bg-red-500/10 text-red-500'
                            : lr.leaveType === 'annual'
                              ? 'bg-teal-500/10 text-teal-600 dark:text-teal-400'
                              : 'bg-black/[0.04] dark:bg-white/[0.06] text-muted-foreground'
                        }`}>
                          {lr.leaveType.charAt(0).toUpperCase() + lr.leaveType.slice(1)} Leave
                        </span>
                      </td>
                      <td className="font-mono text-[12px]">{formatDate(lr.startDate)}</td>
                      <td className="font-mono text-[12px]">{formatDate(lr.endDate)}</td>
                      <td className="text-center">{getDays(lr.startDate, lr.endDate)}</td>
                      <td className="text-muted-foreground max-w-32 truncate">{lr.reason || '—'}</td>
                      <td>
                        <div className="flex items-center gap-1.5">
                          <StatusIcon className={`size-3 ${statusCfg.color}`} />
                          <span className={`text-[11px] font-medium ${statusCfg.color}`}>{statusCfg.label}</span>
                        </div>
                      </td>
                      <td>
                        {lr.status === 'pending' && (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleLeaveAction(lr.id, 'approved')}
                              disabled={actionLoading === lr.id}
                              className="macos-btn-secondary !px-2.5 !py-1 text-[11px] text-emerald-600 dark:text-emerald-400 gap-1 disabled:opacity-50"
                            >
                              {actionLoading === lr.id ? <Loader2 className="size-3 animate-spin" /> : <CheckCircle2 className="size-3" />} Approve
                            </button>
                            <button
                              onClick={() => handleLeaveAction(lr.id, 'rejected')}
                              disabled={actionLoading === lr.id}
                              className="macos-btn-secondary !px-2.5 !py-1 text-[11px] text-red-500 gap-1 disabled:opacity-50"
                            >
                              <XCircle className="size-3" /> Reject
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
