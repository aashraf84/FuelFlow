import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const stations = await db.station.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: {
            dispensers: true,
            tanks: true,
            employees: true,
            shifts: { where: { status: 'open' } },
          },
        },
        tanks: {
          select: { currentLevel: true, capacity: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const stationsWithStats = stations.map((station) => {
      const totalCapacity = station.tanks.reduce((sum, t) => sum + t.capacity, 0)
      const totalCurrent = station.tanks.reduce((sum, t) => sum + t.currentLevel, 0)
      const fuelLevelPercentage = totalCapacity > 0
        ? Math.round((totalCurrent / totalCapacity) * 1000) / 10
        : 0

      return {
        id: station.id,
        name: station.name,
        code: station.code,
        city: station.city,
        region: station.region,
        stationType: station.stationType,
        address: station.address,
        isActive: station.isActive,
        dispenserCount: station._count.dispensers,
        tankCount: station._count.tanks,
        employeeCount: station._count.employees,
        activeShifts: station._count.shifts,
        fuelLevelPercentage,
        createdAt: station.createdAt,
      }
    })

    return NextResponse.json({ stations: stationsWithStats })
  } catch (error) {
    console.error('Stations GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stations' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      tenantId,
      name,
      code,
      address,
      city,
      region,
      country,
      phone,
      email,
      latitude,
      longitude,
      stationType,
      operatingHours,
    } = body

    if (!tenantId || !name || !code) {
      return NextResponse.json(
        { error: 'tenantId, name, and code are required' },
        { status: 400 }
      )
    }

    const station = await db.station.create({
      data: {
        tenantId,
        name,
        code,
        address,
        city,
        region,
        country,
        phone,
        email,
        latitude,
        longitude,
        stationType: stationType || 'fuel',
        operatingHours,
      },
    })

    return NextResponse.json({ station }, { status: 201 })
  } catch (error) {
    console.error('Stations POST error:', error)
    return NextResponse.json(
      { error: 'Failed to create station' },
      { status: 500 }
    )
  }
}
