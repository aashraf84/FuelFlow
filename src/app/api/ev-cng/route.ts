import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const stationId = searchParams.get('stationId')

    const evWhere: Record<string, unknown> = { isActive: true }
    const cngWhere: Record<string, unknown> = { isActive: true }
    if (stationId) {
      evWhere.stationId = stationId
      cngWhere.stationId = stationId
    }

    const [evChargers, cngDispensers] = await Promise.all([
      db.eVCharger.findMany({
        where: evWhere,
        include: {
          station: {
            select: { id: true, name: true, code: true, city: true },
          },
          sessions: {
            where: { status: 'active' },
            take: 1,
            orderBy: { startedAt: 'desc' },
          },
        },
        orderBy: { code: 'asc' },
      }),
      db.cNGDispenser.findMany({
        where: cngWhere,
        include: {
          station: {
            select: { id: true, name: true, code: true, city: true },
          },
        },
        orderBy: { code: 'asc' },
      }),
    ])

    const evChargersWithStatus = evChargers.map((charger) => ({
      id: charger.id,
      name: charger.name,
      code: charger.code,
      connectorType: charger.connectorType,
      maxPowerKw: charger.maxPowerKw,
      status: charger.status,
      currentSession: charger.currentSession,
      isActive: charger.isActive,
      station: charger.station,
      activeSession: charger.sessions[0] || null,
      createdAt: charger.createdAt,
      updatedAt: charger.updatedAt,
    }))

    const cngDispensersWithStatus = cngDispensers.map((dispenser) => ({
      id: dispenser.id,
      name: dispenser.name,
      code: dispenser.code,
      pressure: dispenser.pressure,
      status: dispenser.status,
      isActive: dispenser.isActive,
      station: dispenser.station,
      createdAt: dispenser.createdAt,
      updatedAt: dispenser.updatedAt,
    }))

    // Summary statistics
    const evSummary = {
      total: evChargersWithStatus.length,
      available: evChargersWithStatus.filter((c) => c.status === 'available').length,
      charging: evChargersWithStatus.filter((c) => c.status === 'charging').length,
      occupied: evChargersWithStatus.filter((c) => c.status === 'occupied').length,
      offline: evChargersWithStatus.filter((c) => c.status === 'offline').length,
      error: evChargersWithStatus.filter((c) => c.status === 'error').length,
    }

    const cngSummary = {
      total: cngDispensersWithStatus.length,
      idle: cngDispensersWithStatus.filter((d) => d.status === 'idle').length,
      dispensing: cngDispensersWithStatus.filter((d) => d.status === 'dispensing').length,
      stopped: cngDispensersWithStatus.filter((d) => d.status === 'stopped').length,
      error: cngDispensersWithStatus.filter((d) => d.status === 'error').length,
    }

    return NextResponse.json({
      evChargers: evChargersWithStatus,
      cngDispensers: cngDispensersWithStatus,
      summary: { ev: evSummary, cng: cngSummary },
    })
  } catch (error) {
    console.error('EV-CNG GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch EV/CNG data' },
      { status: 500 }
    )
  }
}
