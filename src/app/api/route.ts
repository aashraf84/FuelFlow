import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Dynamic import to avoid cold-start penalty
    const { db } = await import('@/lib/db')

    const stationCount = await db.station.count()
    const userCount = await db.user.count()
    const fuelingCount = await db.fueling.count()

    return NextResponse.json({
      status: 'healthy',
      service: 'FuelFlow OS',
      version: '1.0.0',
      database: 'connected',
      stats: {
        stations: stationCount,
        users: userCount,
        fuelings: fuelingCount,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json({
      status: 'degraded',
      service: 'FuelFlow OS',
      version: '1.0.0',
      database: 'error',
      error: error instanceof Error ? error.message : 'Unknown database error',
      timestamp: new Date().toISOString(),
    }, { status: 503 })
  }
}
