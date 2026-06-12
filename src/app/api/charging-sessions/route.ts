import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const stationId = searchParams.get('stationId')
    const status = searchParams.get('status')

    const where: Record<string, unknown> = {}
    if (stationId) where.stationId = stationId
    if (status) where.status = status

    const sessions = await db.chargingSession.findMany({
      where,
      include: {
        evCharger: { select: { id: true, name: true, code: true } },
      },
      orderBy: { startedAt: 'desc' },
      take: 50,
    })

    return NextResponse.json({ sessions })
  } catch (error) {
    console.error('Charging Sessions GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch charging sessions' }, { status: 500 })
  }
}
