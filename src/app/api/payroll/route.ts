import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const stationId = searchParams.get('stationId')
    const employeeId = searchParams.get('employeeId')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    const where: Record<string, unknown> = {}
    if (stationId) where.stationId = stationId
    if (employeeId) where.employeeId = employeeId
    if (status) where.status = status

    const [records, total] = await Promise.all([
      db.payrollRecord.findMany({
        where,
        include: {
          employee: { select: { id: true, name: true, role: true, employeeId: true } },
          station: { select: { id: true, name: true, code: true } },
        },
        orderBy: { periodStart: 'desc' },
        take: limit,
        skip: offset,
      }),
      db.payrollRecord.count({ where }),
    ])

    // Summary
    const allRecords = await db.payrollRecord.findMany({
      where: stationId ? { stationId } : {},
      select: { netPay: true, status: true, baseSalary: true, deductions: true, taxDeductions: true, overtimePay: true, commissions: true },
    })

    const summary = {
      totalRecords: allRecords.length,
      totalNetPay: allRecords.reduce((sum, r) => sum + r.netPay, 0),
      totalBaseSalary: allRecords.reduce((sum, r) => sum + r.baseSalary, 0),
      totalDeductions: allRecords.reduce((sum, r) => sum + r.deductions + r.taxDeductions, 0),
      totalOvertime: allRecords.reduce((sum, r) => sum + r.overtimePay, 0),
      totalCommissions: allRecords.reduce((sum, r) => sum + r.commissions, 0),
      pendingCount: allRecords.filter(r => r.status === 'pending').length,
      paidCount: allRecords.filter(r => r.status === 'paid').length,
    }

    return NextResponse.json({
      records,
      summary,
      pagination: { total, limit, offset, hasMore: offset + limit < total },
    })
  } catch (error) {
    console.error('Payroll GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch payroll records' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { stationId, employeeId, periodStart, periodEnd, baseSalary, overtimeHours, overtimePay, commissions, deductions, taxDeductions, netPay } = body

    if (!stationId || !employeeId || !periodStart || !periodEnd || !baseSalary || netPay === undefined) {
      return NextResponse.json({ error: 'stationId, employeeId, periodStart, periodEnd, baseSalary, and netPay are required' }, { status: 400 })
    }

    const record = await db.payrollRecord.create({
      data: {
        stationId,
        employeeId,
        periodStart: new Date(periodStart),
        periodEnd: new Date(periodEnd),
        baseSalary: parseFloat(String(baseSalary)),
        overtimeHours: overtimeHours ? parseFloat(String(overtimeHours)) : 0,
        overtimePay: overtimePay ? parseFloat(String(overtimePay)) : 0,
        commissions: commissions ? parseFloat(String(commissions)) : 0,
        deductions: deductions ? parseFloat(String(deductions)) : 0,
        taxDeductions: taxDeductions ? parseFloat(String(taxDeductions)) : 0,
        netPay: parseFloat(String(netPay)),
        status: 'pending',
      },
      include: { employee: { select: { name: true, role: true } } },
    })

    return NextResponse.json({ record }, { status: 201 })
  } catch (error) {
    console.error('Payroll POST error:', error)
    return NextResponse.json({ error: 'Failed to create payroll record' }, { status: 500 })
  }
}
