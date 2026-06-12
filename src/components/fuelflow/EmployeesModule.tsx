'use client'

import { useState, useEffect } from 'react'
import {
  Users,
  Clock,
  Wallet,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  UserPlus,
  BadgeCheck,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Separator } from '@/components/ui/separator'

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

interface PayrollRecord {
  id: string
  periodStart: string
  periodEnd: string
  baseSalary: number
  overtimeHours: number
  overtimePay: number
  commissions: number
  deductions: number
  taxDeductions: number
  netPay: number
  status: string
  paidDate: string | null
  employee: { id: string; name: string; role: string }
}

interface LeaveRequest {
  id: string
  leaveType: string
  startDate: string
  endDate: string
  reason: string | null
  status: string
  approvedBy: string | null
  createdAt: string
  employee: { id: string; name: string; role: string }
}

const ROLE_COLORS: Record<string, string> = {
  manager: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  supervisor: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  attendant: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  cashier: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  maintenance: 'bg-slate-500/10 text-slate-600 border-slate-500/20',
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}><CardContent className="p-4"><Skeleton className="h-40 w-full" /></CardContent></Card>
        ))}
      </div>
    </div>
  )
}

export default function EmployeesModule() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([])
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('employees')

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const [empRes, payRes, leaveRes] = await Promise.all([
          fetch('/api/employees'),
          fetch('/api/payroll'),
          fetch('/api/leave'),
        ])
        if (empRes.ok) {
          const data = await empRes.json()
          setEmployees(data.employees || [])
        }
        if (payRes.ok) {
          const data = await payRes.json()
          setPayrollRecords(data.payrollRecords || [])
        }
        if (leaveRes.ok) {
          const data = await leaveRes.json()
          setLeaveRequests(data.leaveRequests || [])
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleLeaveAction = async (id: string, status: string) => {
    try {
      await fetch('/api/leave', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      })
      setLeaveRequests(prev => prev.map(lr => lr.id === id ? { ...lr, status } : lr))
    } catch {}
  }

  if (loading) return <LoadingSkeleton />
  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <AlertTriangle className="size-8 text-red-500 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" size="sm" className="mt-2" onClick={() => window.location.reload()}>Retry</Button>
        </CardContent>
      </Card>
    )
  }

  const todayAttendance = employees.filter(e => e.status === 'active').length

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="employees">Employees</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="payroll">Payroll</TabsTrigger>
          <TabsTrigger value="leave">Leave Requests</TabsTrigger>
        </TabsList>

        {/* Employees */}
        <TabsContent value="employees" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold">Employees</CardTitle>
                  <CardDescription className="text-xs">{employees.length} total employees</CardDescription>
                </div>
                <Button size="sm" className="gap-1"><UserPlus className="size-3" /> Add Employee</Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="max-h-96">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Name</TableHead>
                      <TableHead className="text-xs">Role</TableHead>
                      <TableHead className="text-xs text-right">Salary</TableHead>
                      <TableHead className="text-xs text-right">Commission</TableHead>
                      <TableHead className="text-xs">Phone</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employees.map((emp) => (
                      <TableRow key={emp.id}>
                        <TableCell className="text-xs font-medium">{emp.name}</TableCell>
                        <TableCell>
                          <Badge
                            className={`text-[9px] px-1.5 py-0 border capitalize ${ROLE_COLORS[emp.role] || ''}`}
                          >
                            {emp.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-right">
                          {emp.salary ? `Rs. ${emp.salary.toLocaleString()}` : 'N/A'}
                        </TableCell>
                        <TableCell className="text-xs text-right">
                          {emp.commissionRate > 0 ? `${emp.commissionRate}%` : '-'}
                        </TableCell>
                        <TableCell className="text-xs">{emp.phone || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge
                            variant={emp.status === 'active' ? 'outline' : 'secondary'}
                            className="text-[10px] px-1.5 py-0 capitalize"
                          >
                            {emp.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Attendance */}
        <TabsContent value="attendance" className="mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Present Today</p>
                    <p className="text-xl font-bold">{todayAttendance}</p>
                  </div>
                  <CheckCircle2 className="size-8 text-emerald-500/30" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Total Employees</p>
                    <p className="text-xl font-bold">{employees.length}</p>
                  </div>
                  <Users className="size-8 text-amber-500/30" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Attendance Rate</p>
                    <p className="text-xl font-bold">
                      {employees.length > 0 ? Math.round((todayAttendance / employees.length) * 100) : 0}%
                    </p>
                  </div>
                  <Clock className="size-8 text-blue-500/30" />
                </div>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Today&apos;s Attendance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {employees.filter(e => e.status === 'active').map((emp) => (
                  <div key={emp.id} className="rounded-lg border p-3 text-center">
                    <div className="size-10 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-2">
                      <span className="text-sm font-bold text-amber-600">
                        {emp.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </span>
                    </div>
                    <p className="text-xs font-medium truncate">{emp.name}</p>
                    <Badge className={`text-[9px] px-1.5 py-0 border capitalize mt-1 ${ROLE_COLORS[emp.role] || ''}`}>
                      {emp.role}
                    </Badge>
                    <div className="mt-2">
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0 text-emerald-600 border-emerald-500/30 bg-emerald-500/10">
                        Present
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payroll */}
        <TabsContent value="payroll" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Payroll Records</CardTitle>
              <CardDescription className="text-xs">{payrollRecords.length} records</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="max-h-96">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Employee</TableHead>
                      <TableHead className="text-xs">Period</TableHead>
                      <TableHead className="text-xs text-right">Base Salary</TableHead>
                      <TableHead className="text-xs text-right">Overtime</TableHead>
                      <TableHead className="text-xs text-right">Commissions</TableHead>
                      <TableHead className="text-xs text-right">Deductions</TableHead>
                      <TableHead className="text-xs text-right">Net Pay</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payrollRecords.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-xs text-muted-foreground py-8">No payroll records</TableCell>
                      </TableRow>
                    ) : (
                      payrollRecords.map((pr) => (
                        <TableRow key={pr.id}>
                          <TableCell className="text-xs font-medium">{pr.employee?.name || 'N/A'}</TableCell>
                          <TableCell className="text-xs font-mono">
                            {new Date(pr.periodStart).toLocaleDateString()} - {new Date(pr.periodEnd).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-xs text-right">Rs. {Math.round(pr.baseSalary).toLocaleString()}</TableCell>
                          <TableCell className="text-xs text-right">Rs. {Math.round(pr.overtimePay).toLocaleString()}</TableCell>
                          <TableCell className="text-xs text-right">Rs. {Math.round(pr.commissions).toLocaleString()}</TableCell>
                          <TableCell className="text-xs text-right text-red-500">Rs. {Math.round(pr.deductions + pr.taxDeductions).toLocaleString()}</TableCell>
                          <TableCell className="text-xs text-right font-bold text-emerald-600">Rs. {Math.round(pr.netPay).toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge
                              variant={pr.status === 'paid' ? 'outline' : pr.status === 'approved' ? 'outline' : 'secondary'}
                              className="text-[10px] px-1.5 py-0 capitalize"
                            >
                              {pr.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Leave Requests */}
        <TabsContent value="leave" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Leave Requests</CardTitle>
              <CardDescription className="text-xs">{leaveRequests.length} requests</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="max-h-96">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Employee</TableHead>
                      <TableHead className="text-xs">Type</TableHead>
                      <TableHead className="text-xs">From</TableHead>
                      <TableHead className="text-xs">To</TableHead>
                      <TableHead className="text-xs">Reason</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaveRequests.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-xs text-muted-foreground py-8">No leave requests</TableCell>
                      </TableRow>
                    ) : (
                      leaveRequests.map((lr) => (
                        <TableRow key={lr.id}>
                          <TableCell className="text-xs font-medium">{lr.employee?.name || 'N/A'}</TableCell>
                          <TableCell className="text-xs capitalize">{lr.leaveType}</TableCell>
                          <TableCell className="text-xs font-mono">{new Date(lr.startDate).toLocaleDateString()}</TableCell>
                          <TableCell className="text-xs font-mono">{new Date(lr.endDate).toLocaleDateString()}</TableCell>
                          <TableCell className="text-xs text-muted-foreground max-w-32 truncate">{lr.reason || '-'}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                lr.status === 'approved' ? 'outline' :
                                lr.status === 'rejected' ? 'destructive' : 'secondary'
                              }
                              className="text-[10px] px-1.5 py-0 capitalize"
                            >
                              {lr.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {lr.status === 'pending' && (
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-6 text-[10px] gap-1 text-emerald-600"
                                  onClick={() => handleLeaveAction(lr.id, 'approved')}
                                >
                                  <CheckCircle2 className="size-3" /> Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-6 text-[10px] gap-1 text-red-600"
                                  onClick={() => handleLeaveAction(lr.id, 'rejected')}
                                >
                                  <XCircle className="size-3" /> Reject
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
