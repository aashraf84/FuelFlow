import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const stationId = searchParams.get('stationId')

    const where = stationId ? { stationId } : {}

    const dispensers = await db.dispenser.findMany({
      where,
      include: {
        station: {
          select: { id: true, name: true, code: true, city: true },
        },
        nozzles: {
          where: { isActive: true },
          orderBy: { nozzleNumber: 'asc' },
        },
      },
      orderBy: { code: 'asc' },
    })

    return NextResponse.json({ dispensers })
  } catch (error) {
    console.error('Dispensers GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dispensers' },
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
      manufacturer,
      model,
      serialNumber,
      controllerType,
      communicationType,
      ipAddress,
      port,
    } = body

    if (!stationId || !name || !code) {
      return NextResponse.json(
        { error: 'stationId, name, and code are required' },
        { status: 400 }
      )
    }

    const dispenser = await db.dispenser.create({
      data: {
        stationId,
        name,
        code,
        manufacturer,
        model,
        serialNumber,
        controllerType,
        communicationType,
        ipAddress,
        port,
        status: 'idle',
      },
      include: {
        station: { select: { id: true, name: true, code: true } },
        nozzles: true,
      },
    })

    return NextResponse.json({ dispenser }, { status: 201 })
  } catch (error) {
    console.error('Dispensers POST error:', error)
    return NextResponse.json(
      { error: 'Failed to create dispenser' },
      { status: 500 }
    )
  }
}
