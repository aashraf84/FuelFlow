import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const stationId = searchParams.get('stationId')

    const where: Record<string, unknown> = {}
    if (stationId) where.stationId = stationId

    const reconciliations = await db.reconciliation.findMany({
      where,
      include: {
        tank: { select: { id: true, name: true, fuelType: true } },
      },
      orderBy: { date: 'desc' },
    })

    return NextResponse.json({ reconciliations })
  } catch (error) {
    console.error('Reconciliations GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch reconciliations' }, { status: 500 })
  }
}
