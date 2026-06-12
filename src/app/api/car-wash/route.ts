import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const stationId = searchParams.get('stationId')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    const where: Record<string, unknown> = {}
    if (stationId) where.stationId = stationId
    if (status) where.status = status

    const [sessions, total] = await Promise.all([
      db.carWashSession.findMany({
        where,
        orderBy: { startedAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      db.carWashSession.count({ where }),
    ])

    // Summary stats
    const allSessions = await db.carWashSession.findMany({
      where: stationId ? { stationId } : {},
      select: { amount: true, washType: true, status: true },
    })

    const summary = {
      totalSessions: allSessions.length,
      totalRevenue: allSessions.reduce((sum, s) => sum + s.amount, 0),
      byType: {
        basic: { count: allSessions.filter(s => s.washType === 'basic').length, revenue: allSessions.filter(s => s.washType === 'basic').reduce((sum, s) => sum + s.amount, 0) },
        premium: { count: allSessions.filter(s => s.washType === 'premium').length, revenue: allSessions.filter(s => s.washType === 'premium').reduce((sum, s) => sum + s.amount, 0) },
        deluxe: { count: allSessions.filter(s => s.washType === 'deluxe').length, revenue: allSessions.filter(s => s.washType === 'deluxe').reduce((sum, s) => sum + s.amount, 0) },
      },
    }

    return NextResponse.json({
      sessions,
      summary,
      pagination: { total, limit, offset, hasMore: offset + limit < total },
    })
  } catch (error) {
    console.error('Car wash GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch car wash sessions' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { stationId, shiftId, vehiclePlate, washType, amount, paymentMethod } = body

    if (!stationId || !washType || !amount) {
      return NextResponse.json({ error: 'stationId, washType, and amount are required' }, { status: 400 })
    }

    const session = await db.carWashSession.create({
      data: {
        stationId,
        shiftId,
        vehiclePlate,
        washType,
        amount: parseFloat(String(amount)),
        paymentMethod: paymentMethod || 'cash',
        status: 'completed',
        startedAt: new Date(),
        completedAt: new Date(),
      },
    })

    return NextResponse.json({ session }, { status: 201 })
  } catch (error) {
    console.error('Car wash POST error:', error)
    return NextResponse.json({ error: 'Failed to create car wash session' }, { status: 500 })
  }
}
