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

    const handovers = await db.shiftHandover.findMany({
      where: { stationId: station.id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      station: {
        id: station.id,
        name: station.name,
        code: station.code,
      },
      handovers,
    })
  } catch (error) {
    console.error('Shift Handover GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch shift handovers' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      stationId, fromShiftId, toShiftId, fromAttendantId, toAttendantId,
      cashHandedOver, cashExpected, cashVariance, pumpReadings,
      openIssues, notes, status,
    } = body

    if (!stationId || !fromShiftId || !toShiftId || !fromAttendantId || !toAttendantId) {
      return NextResponse.json(
        { error: 'stationId, fromShiftId, toShiftId, fromAttendantId, and toAttendantId are required' },
        { status: 400 }
      )
    }

    if (cashHandedOver === undefined || cashExpected === undefined) {
      return NextResponse.json(
        { error: 'cashHandedOver and cashExpected are required' },
        { status: 400 }
      )
    }

    const handover = await db.shiftHandover.create({
      data: {
        stationId,
        fromShiftId,
        toShiftId,
        fromAttendantId,
        toAttendantId,
        cashHandedOver,
        cashExpected,
        cashVariance: cashVariance !== undefined ? cashVariance : cashHandedOver - cashExpected,
        pumpReadings: pumpReadings || null,
        openIssues: openIssues || null,
        notes: notes || null,
        status: status || 'pending',
      },
    })

    return NextResponse.json({ handover }, { status: 201 })
  } catch (error) {
    console.error('Shift Handover POST error:', error)
    return NextResponse.json(
      { error: 'Failed to create shift handover' },
      { status: 500 }
    )
  }
}
