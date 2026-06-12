import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const stationId = searchParams.get('stationId')

    const where = stationId ? { stationId } : {}

    const tanks = await db.tank.findMany({
      where,
      include: {
        station: {
          select: { id: true, name: true, code: true },
        },
        tankReadings: {
          take: 5,
          orderBy: { readingAt: 'desc' },
        },
        calibrations: {
          take: 1,
          orderBy: { calibrationDate: 'desc' },
        },
        deliveries: {
          where: { status: { in: ['pending', 'arriving', 'unloading'] } },
          take: 3,
          orderBy: { deliveryDate: 'desc' },
        },
        reconciliations: {
          take: 1,
          orderBy: { date: 'desc' },
        },
      },
      orderBy: { code: 'asc' },
    })

    // Get meter records for nozzles connected to these tanks via dispensers
    const tankIds = tanks.map(t => t.id)

    const tanksWithLevel = tanks.map((tank) => {
      const levelPercentage =
        tank.capacity > 0
          ? Math.round((tank.currentLevel / tank.capacity) * 1000) / 10
          : 0

      let computedStatus = tank.status
      if (tank.status === 'normal' && levelPercentage < 15) {
        computedStatus = 'critical'
      } else if (tank.status === 'normal' && levelPercentage < 25) {
        computedStatus = 'low'
      }

      return {
        id: tank.id,
        name: tank.name,
        code: tank.code,
        stationId: tank.stationId,
        fuelType: tank.fuelType,
        capacity: tank.capacity,
        currentLevel: tank.currentLevel,
        levelPercentage,
        waterLevel: tank.waterLevel,
        temperature: tank.temperature,
        density: tank.density,
        atgType: tank.atgType,
        status: computedStatus,
        lastReading: tank.lastReading,
        station: tank.station,
        recentReadings: tank.tankReadings,
        latestCalibration: tank.calibrations[0] || null,
        pendingDeliveries: tank.deliveries,
        latestReconciliation: tank.reconciliations[0] || null,
        createdAt: tank.createdAt,
        updatedAt: tank.updatedAt,
      }
    })

    // Get meter records for nozzles at this station
    const meterRecords = stationId
      ? await db.meterRecord.findMany({
          where: { stationId },
          include: {
            nozzle: {
              select: {
                id: true,
                nozzleNumber: true,
                fuelType: true,
                dispenser: { select: { name: true, code: true } },
              },
            },
          },
          take: 20,
          orderBy: { recordedAt: 'desc' },
        })
      : []

    return NextResponse.json({ tanks: tanksWithLevel, meterRecords })
  } catch (error) {
    console.error('Tanks GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tanks' },
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
      code,
      capacity,
      fuelType,
      atgType,
      atgIpAddress,
      atgPort,
    } = body

    if (!stationId || !name || !code || !capacity || !fuelType) {
      return NextResponse.json(
        { error: 'stationId, name, code, capacity, and fuelType are required' },
        { status: 400 }
      )
    }

    const tank = await db.tank.create({
      data: {
        stationId,
        name,
        code,
        capacity: parseFloat(String(capacity)),
        fuelType,
        atgType,
        atgIpAddress,
        atgPort: atgPort ? parseInt(String(atgPort), 10) : null,
        status: 'normal',
      },
      include: {
        station: { select: { id: true, name: true, code: true } },
      },
    })

    return NextResponse.json({ tank }, { status: 201 })
  } catch (error) {
    console.error('Tanks POST error:', error)
    return NextResponse.json(
      { error: 'Failed to create tank' },
      { status: 500 }
    )
  }
}
