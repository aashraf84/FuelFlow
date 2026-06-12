import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const stationId = searchParams.get('stationId')
    const gameType = searchParams.get('gameType')
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    const where: Record<string, unknown> = {}
    if (stationId) where.stationId = stationId
    if (gameType) where.gameType = gameType

    const [sales, total] = await Promise.all([
      db.lotterySale.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      db.lotterySale.count({ where }),
    ])

    // Summary
    const allSales = await db.lotterySale.findMany({
      where: stationId ? { stationId } : {},
      select: { saleAmount: true, commission: true, gameType: true, ticketCount: true },
    })

    const summary = {
      totalSales: allSales.length,
      totalRevenue: allSales.reduce((sum, s) => sum + s.saleAmount, 0),
      totalCommission: allSales.reduce((sum, s) => sum + s.commission, 0),
      totalTickets: allSales.reduce((sum, s) => sum + s.ticketCount, 0),
      byGameType: {
        scratch: { count: allSales.filter(s => s.gameType === 'scratch').length, revenue: allSales.filter(s => s.gameType === 'scratch').reduce((sum, s) => sum + s.saleAmount, 0) },
        draw: { count: allSales.filter(s => s.gameType === 'draw').length, revenue: allSales.filter(s => s.gameType === 'draw').reduce((sum, s) => sum + s.saleAmount, 0) },
        online: { count: allSales.filter(s => s.gameType === 'online').length, revenue: allSales.filter(s => s.gameType === 'online').reduce((sum, s) => sum + s.saleAmount, 0) },
      },
    }

    return NextResponse.json({
      sales,
      summary,
      pagination: { total, limit, offset, hasMore: offset + limit < total },
    })
  } catch (error) {
    console.error('Lottery GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch lottery sales' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { stationId, shiftId, gameType, ticketCount, saleAmount, commission } = body

    if (!stationId || !gameType || !saleAmount) {
      return NextResponse.json({ error: 'stationId, gameType, and saleAmount are required' }, { status: 400 })
    }

    const sale = await db.lotterySale.create({
      data: {
        stationId,
        shiftId,
        gameType,
        ticketCount: ticketCount || 1,
        saleAmount: parseFloat(String(saleAmount)),
        commission: commission ? parseFloat(String(commission)) : Math.round(parseFloat(String(saleAmount)) * 0.05),
        status: 'completed',
      },
    })

    return NextResponse.json({ sale }, { status: 201 })
  } catch (error) {
    console.error('Lottery POST error:', error)
    return NextResponse.json({ error: 'Failed to record lottery sale' }, { status: 500 })
  }
}
