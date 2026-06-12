'use client'

import { useState, useEffect } from 'react'
import {
  Users,
  AlertTriangle,
  Phone,
  Mail,
  Calendar,
  BadgeCheck,
  Clock,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'

interface Employee {
  id: string
  name: string
  employeeId: string | null
  role: string
  phone: string | null
  email: string | null
  hireDate: string | null
  salary: number | null
  commissionRate: number
  status: string
  station: { id: string; name: string; code: string }
  _count: { shifts: number; fuelings: number }
}

function RoleBadge({ role }: { role: string }) {
  const configs: Record<string, { className: string; label: string }> = {
    attendant: { className: 'bg-blue-500/10 text-blue-600 border-blue-200 dark:text-blue-400 dark:border-blue-800', label: 'Attendant' },
    manager: { className: 'bg-amber-500/10 text-amber-600 border-amber-200 dark:text-amber-400 dark:border-amber-800', label: 'Manager' },
    supervisor: { className: 'bg-purple-500/10 text-purple-600 border-purple-200 dark:text-purple-400 dark:border-purple-800', label: 'Supervisor' },
    cashier: { className: 'bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:text-emerald-400 dark:border-emerald-800', label: 'Cashier' },
    maintenance: { className: 'bg-gray-500/10 text-gray-600 border-gray-200 dark:text-gray-400 dark:border-gray-800', label: 'Maintenance' },
  }
  const config = configs[role] || { className: 'bg-gray-500/10 text-gray-600 border-gray-200', label: role }
  return (
    <Badge variant="outline" className={`text-[10px] ${config.className}`}>
      {config.label}
    </Badge>
  )
}

function StatusBadge({ status }: { status: string }) {
  const configs: Record<string, { className: string; label: string }> = {
    active: { className: 'bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:text-emerald-400 dark:border-emerald-800', label: 'Active' },
    on_leave: { className: 'bg-amber-500/10 text-amber-600 border-amber-200 dark:text-amber-400 dark:border-amber-800', label: 'On Leave' },
    terminated: { className: 'bg-red-500/10 text-red-600 border-red-200 dark:text-red-400 dark:border-red-800', label: 'Terminated' },
  }
  const config = configs[status] || configs.active
  return (
    <Badge variant="outline" className={`text-[10px] ${config.className}`}>
      {config.label}
    </Badge>
  )
}

export default function EmployeesModule() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/employees')
        if (!res.ok) throw new Error('Failed to fetch')
        const json = await res.json()
        setEmployees(json.employees || [])
      } catch (err) {
        console.error('Failed to fetch employees:', err)
        setError('Failed to load employee data')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const activeCount = employees.filter(e => e.status === 'active').length
  const onLeaveCount = employees.filter(e => e.status === 'on_leave').length

  if (error) {
    return (
      <div className="module-enter space-y-6">
        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="size-10 mx-auto text-red-500 mb-2" />
            <p className="text-sm font-medium text-red-700 dark:text-red-400">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="module-enter space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-amber-500/10">
          <Users className="size-5 text-amber-500" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Employee Management</h2>
          <p className="text-sm text-muted-foreground">
            Staff rostering, attendance, roles, and performance tracking
          </p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-amber-500/10">
              <Users className="size-5 text-amber-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Employees</p>
              <p className="text-lg font-bold">{loading ? '-' : employees.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-500/10">
              <BadgeCheck className="size-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Active</p>
              <p className="text-lg font-bold">{loading ? '-' : activeCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-amber-500/10">
              <Clock className="size-5 text-amber-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">On Leave</p>
              <p className="text-lg font-bold">{loading ? '-' : onLeaveCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Employee table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Employee Directory</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : employees.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              <Users className="size-10 mx-auto text-muted-foreground/30 mb-2" />
              <p>No employees found</p>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Name</TableHead>
                    <TableHead className="text-xs">ID</TableHead>
                    <TableHead className="text-xs">Role</TableHead>
                    <TableHead className="text-xs">Contact</TableHead>
                    <TableHead className="text-xs">Salary</TableHead>
                    <TableHead className="text-xs">Commission</TableHead>
                    <TableHead className="text-xs">Shifts</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.map((emp) => (
                    <TableRow key={emp.id}>
                      <TableCell className="text-xs font-medium">{emp.name}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{emp.employeeId || '-'}</TableCell>
                      <TableCell className="text-xs">
                        <RoleBadge role={emp.role} />
                      </TableCell>
                      <TableCell className="text-xs">
                        <div className="space-y-0.5">
                          {emp.phone && (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Phone className="size-2.5" />
                              <span>{emp.phone}</span>
                            </div>
                          )}
                          {emp.email && (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Mail className="size-2.5" />
                              <span className="truncate max-w-[120px]">{emp.email}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs font-medium">
                        {emp.salary ? `Rs. ${Math.round(emp.salary).toLocaleString()}` : '-'}
                      </TableCell>
                      <TableCell className="text-xs">
                        {emp.commissionRate > 0 ? `${emp.commissionRate}%` : '-'}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {emp._count.shifts} shifts / {emp._count.fuelings} fuelings
                      </TableCell>
                      <TableCell className="text-xs">
                        <StatusBadge status={emp.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
