import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const stationId = searchParams.get('stationId')
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    const where = stationId ? { stationId } : {}

    const [fuelings, total] = await Promise.all([
      db.fueling.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { startedAt: 'desc' },
        include: {
          dispenser: { select: { name: true, code: true } },
          nozzle: { select: { nozzleNumber: true, fuelType: true } },
          attendant: { select: { id: true, name: true } },
          shift: { select: { id: true, shiftNumber: true, status: true } },
          fleetAccount: { select: { id: true, companyName: true } },
        },
      }),
      db.fueling.count({ where }),
    ])

    return NextResponse.json({
      fuelings,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    })
  } catch (error) {
    console.error('Fuelings GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch fueling transactions' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      stationId,
      dispenserId,
      nozzleId,
      shiftId,
      fuelType,
      volume,
      pricePerUnit,
      totalAmount,
      paymentMethod,
      meterStart,
      meterEnd,
      attendantId,
      vehiclePlate,
      rfidTag,
      fleetAccountId,
    } = body

    if (!stationId || !dispenserId || !nozzleId || !fuelType || !volume || !pricePerUnit) {
      return NextResponse.json(
        { error: 'stationId, dispenserId, nozzleId, fuelType, volume, and pricePerUnit are required' },
        { status: 400 }
      )
    }

    const computedTotal = totalAmount || Math.round(volume * pricePerUnit * 100) / 100

    const fueling = await db.fueling.create({
      data: {
        stationId,
        dispenserId,
        nozzleId,
        shiftId,
        fuelType,
        volume: parseFloat(String(volume)),
        pricePerUnit: parseFloat(String(pricePerUnit)),
        totalAmount: computedTotal,
        paymentMethod: paymentMethod || 'cash',
        meterStart: meterStart ? parseFloat(String(meterStart)) : 0,
        meterEnd: meterEnd ? parseFloat(String(meterEnd)) : 0,
        attendantId,
        vehiclePlate,
        rfidTag,
        fleetAccountId,
        status: 'completed',
        startedAt: new Date(),
        completedAt: new Date(),
      },
      include: {
        dispenser: { select: { name: true, code: true } },
        nozzle: { select: { nozzleNumber: true, fuelType: true } },
        attendant: { select: { name: true } },
      },
    })

    return NextResponse.json({ fueling }, { status: 201 })
  } catch (error) {
    console.error('Fuelings POST error:', error)
    return NextResponse.json(
      { error: 'Failed to create fueling transaction' },
      { status: 500 }
    )
  }
}
