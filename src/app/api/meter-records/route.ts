import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const stationId = searchParams.get('stationId')
    const shiftId = searchParams.get('shiftId')
    const nozzleId = searchParams.get('nozzleId')
    const limit = parseInt(searchParams.get('limit') || '100', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    const where: Record<string, unknown> = {}
    if (stationId) where.stationId = stationId
    if (shiftId) where.shiftId = shiftId
    if (nozzleId) where.nozzleId = nozzleId

    const [records, total] = await Promise.all([
      db.meterRecord.findMany({
        where,
        include: {
          nozzle: {
            select: {
              id: true,
              nozzleNumber: true,
              fuelType: true,
              fuelGrade: true,
              dispenser: { select: { id: true, name: true, code: true } },
            },
          },
        },
        orderBy: { recordedAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      db.meterRecord.count({ where }),
    ])

    return NextResponse.json({
      records,
      pagination: { total, limit, offset, hasMore: offset + limit < total },
    })
  } catch (error) {
    console.error('Meter records GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch meter records' }, { status: 500 })
  }
}
