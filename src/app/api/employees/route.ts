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
          select: { shifts: true, fuelings: true },
        },
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ employees })
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
