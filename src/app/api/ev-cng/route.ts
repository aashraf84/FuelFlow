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

    const [evChargers, cngDispensers, chargingSessions] = await Promise.all([
      db.eVCharger.findMany({
        where: evWhere,
        include: {
          station: {
            select: { id: true, name: true, code: true, city: true },
          },
          sessions: {
            orderBy: { startedAt: 'desc' },
            take: 5,
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
      db.chargingSession.findMany({
        where: stationId ? { stationId } : {},
        include: {
          evCharger: { select: { name: true, code: true, connectorType: true } },
        },
        orderBy: { startedAt: 'desc' },
        take: 20,
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
      recentSessions: charger.sessions,
      totalSessions: charger.sessions.length,
      totalRevenue: charger.sessions.reduce((sum, s) => sum + s.totalAmount, 0),
      totalEnergy: charger.sessions.reduce((sum, s) => sum + s.energyKwh, 0),
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
      totalRevenue: evChargersWithStatus.reduce((sum, c) => sum + c.totalRevenue, 0),
      totalEnergyDispensed: evChargersWithStatus.reduce((sum, c) => sum + c.totalEnergy, 0),
    }

    const cngSummary = {
      total: cngDispensersWithStatus.length,
      idle: cngDispensersWithStatus.filter((d) => d.status === 'idle').length,
      dispensing: cngDispensersWithStatus.filter((d) => d.status === 'dispensing').length,
      stopped: cngDispensersWithStatus.filter((d) => d.status === 'stopped').length,
      error: cngDispensersWithStatus.filter((d) => d.status === 'error').length,
    }

    const chargingSummary = {
      totalSessions: chargingSessions.length,
      activeSessions: chargingSessions.filter(s => s.status === 'active').length,
      completedSessions: chargingSessions.filter(s => s.status === 'completed').length,
      totalRevenue: chargingSessions.reduce((sum, s) => sum + s.totalAmount, 0),
      totalEnergyKwh: chargingSessions.reduce((sum, s) => sum + s.energyKwh, 0),
    }

    return NextResponse.json({
      evChargers: evChargersWithStatus,
      cngDispensers: cngDispensersWithStatus,
      chargingSessions,
      summary: { ev: evSummary, cng: cngSummary, charging: chargingSummary },
    })
  } catch (error) {
    console.error('EV-CNG GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch EV/CNG data' },
      { status: 500 }
    )
  }
}
