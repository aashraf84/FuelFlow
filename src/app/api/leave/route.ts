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

    const [requests, total] = await Promise.all([
      db.leaveRequest.findMany({
        where,
        include: {
          employee: { select: { id: true, name: true, role: true, employeeId: true } },
          station: { select: { id: true, name: true, code: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      db.leaveRequest.count({ where }),
    ])

    return NextResponse.json({
      requests,
      pagination: { total, limit, offset, hasMore: offset + limit < total },
    })
  } catch (error) {
    console.error('Leave GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch leave requests' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { stationId, employeeId, leaveType, startDate, endDate, reason } = body

    if (!stationId || !employeeId || !leaveType || !startDate || !endDate) {
      return NextResponse.json({ error: 'stationId, employeeId, leaveType, startDate, and endDate are required' }, { status: 400 })
    }

    const leaveRequest = await db.leaveRequest.create({
      data: {
        stationId,
        employeeId,
        leaveType,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        reason,
        status: 'pending',
      },
      include: { employee: { select: { name: true, role: true } } },
    })

    return NextResponse.json({ request: leaveRequest }, { status: 201 })
  } catch (error) {
    console.error('Leave POST error:', error)
    return NextResponse.json({ error: 'Failed to create leave request' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, status, approvedBy } = body

    if (!id || !status) {
      return NextResponse.json({ error: 'id and status are required' }, { status: 400 })
    }

    if (!['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Status must be approved or rejected' }, { status: 400 })
    }

    const existing = await db.leaveRequest.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Leave request not found' }, { status: 404 })
    }

    const leaveRequest = await db.leaveRequest.update({
      where: { id },
      data: { status, approvedBy },
      include: { employee: { select: { name: true, role: true } } },
    })

    return NextResponse.json({ request: leaveRequest })
  } catch (error) {
    console.error('Leave PUT error:', error)
    return NextResponse.json({ error: 'Failed to update leave request' }, { status: 500 })
  }
}
