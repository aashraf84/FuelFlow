import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const station = await db.station.findFirst({
      orderBy: { createdAt: 'asc' },
    })

    if (!station) {
      return NextResponse.json(
        { error: 'No station found' },
        { status: 404 }
      )
    }

    const events = await db.nozzleEvent.findMany({
      where: { stationId: station.id },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    return NextResponse.json({
      station: {
        id: station.id,
        name: station.name,
        code: station.code,
      },
      events,
    })
  } catch (error) {
    console.error('Nozzle Events GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch nozzle events' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      stationId, nozzleId, eventType, volume, meterReading,
      fuelType, attendantId, vehiclePlate, rfidTag,
      isAuthorized, dataJson,
    } = body

    if (!stationId || !nozzleId || !eventType) {
      return NextResponse.json(
        { error: 'stationId, nozzleId, and eventType are required' },
        { status: 400 }
      )
    }

    const validEventTypes = [
      'nozzle_up', 'nozzle_down', 'fueling_start', 'fueling_end',
      'unauthorized', 'lock', 'unlock', 'disable', 'enable', 'error',
    ]
    if (!validEventTypes.includes(eventType)) {
      return NextResponse.json(
        { error: `Invalid eventType. Must be one of: ${validEventTypes.join(', ')}` },
        { status: 400 }
      )
    }

    // Verify nozzle exists
    const nozzle = await db.nozzle.findUnique({
      where: { id: nozzleId },
    })

    if (!nozzle) {
      return NextResponse.json(
        { error: 'Nozzle not found' },
        { status: 404 }
      )
    }

    const event = await db.nozzleEvent.create({
      data: {
        stationId,
        nozzleId,
        eventType,
        volume: volume || null,
        meterReading: meterReading || null,
        fuelType: fuelType || null,
        attendantId: attendantId || null,
        vehiclePlate: vehiclePlate || null,
        rfidTag: rfidTag || null,
        isAuthorized: isAuthorized !== undefined ? isAuthorized : true,
        dataJson: dataJson || null,
      },
    })

    return NextResponse.json({ event }, { status: 201 })
  } catch (error) {
    console.error('Nozzle Events POST error:', error)
    return NextResponse.json(
      { error: 'Failed to create nozzle event' },
      { status: 500 }
    )
  }
}
