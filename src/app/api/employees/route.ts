import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const stationId = searchParams.get('stationId')
    const role = searchParams.get('role')
    const status = searchParams.get('status')

    const where: Record<string, unknown> = {}
    if (stationId) where.stationId = stationId
    if (role) where.role = role
    if (status) where.status = status

    const employees = await db.employee.findMany({
      where,
      include: {
        station: {
          select: { id: true, name: true, code: true },
        },
        _count: {
          select: { shifts: true, fuelings: true, attendance: true },
        },
        payrollRecords: {
          take: 1,
          orderBy: { periodStart: 'desc' },
          select: { id: true, netPay: true, status: true, periodStart: true, periodEnd: true },
        },
        leaveRequests: {
          where: { status: 'pending' },
          select: { id: true, leaveType: true, startDate: true, endDate: true, status: true },
        },
      },
      orderBy: { name: 'asc' },
    })

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    // Get today's attendance for these employees
    const todayAttendance = await db.attendance.findMany({
      where: {
        stationId: stationId || undefined,
        checkIn: { gte: todayStart },
      },
      select: { employeeId: true, checkIn: true, checkOut: true, status: true, hoursWorked: true },
    })

    const attendanceMap = new Map(todayAttendance.map(a => [a.employeeId, a]))

    const employeesEnhanced = employees.map(emp => ({
      id: emp.id,
      stationId: emp.stationId,
      name: emp.name,
      employeeId: emp.employeeId,
      role: emp.role,
      phone: emp.phone,
      email: emp.email,
      hireDate: emp.hireDate,
      salary: emp.salary,
      commissionRate: emp.commissionRate,
      status: emp.status,
      avatar: emp.avatar,
      station: emp.station,
      shiftCount: emp._count.shifts,
      fuelingCount: emp._count.fuelings,
      attendanceCount: emp._count.attendance,
      latestPayroll: emp.payrollRecords[0] || null,
      pendingLeaveRequests: emp.leaveRequests,
      todayAttendance: attendanceMap.get(emp.id) || null,
    }))

    return NextResponse.json({ employees: employeesEnhanced })
  } catch (error) {
    console.error('Employees GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch employees' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      stationId,
      name,
      employeeId,
      role,
      phone,
      email,
      hireDate,
      salary,
      commissionRate,
      avatar,
    } = body

    if (!stationId || !name) {
      return NextResponse.json(
        { error: 'stationId and name are required' },
        { status: 400 }
      )
    }

    const employee = await db.employee.create({
      data: {
        stationId,
        name,
        employeeId,
        role: role || 'attendant',
        phone,
        email,
        hireDate: hireDate ? new Date(hireDate) : null,
        salary: salary ? parseFloat(String(salary)) : null,
        commissionRate: commissionRate ? parseFloat(String(commissionRate)) : 0,
        avatar,
        status: 'active',
      },
      include: {
        station: { select: { id: true, name: true, code: true } },
      },
    })

    return NextResponse.json({ employee }, { status: 201 })
  } catch (error) {
    console.error('Employees POST error:', error)
    return NextResponse.json(
      { error: 'Failed to create employee' },
      { status: 500 }
    )
  }
}
