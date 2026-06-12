import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const stationId = searchParams.get('stationId')
    const status = searchParams.get('status')

    const where: Record<string, unknown> = {}
    if (stationId) where.stationId = stationId
    if (status) where.status = status

    const shifts = await db.shift.findMany({
      where,
      include: {
        station: { select: { id: true, name: true, code: true } },
        attendant: { select: { id: true, name: true, role: true } },
        _count: { select: { fuelings: true, retailTransactions: true } },
      },
      orderBy: { openedAt: 'desc' },
    })

    return NextResponse.json({ shifts })
  } catch (error) {
    console.error('Shifts GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch shifts' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { stationId, attendantId, openingCash, notes } = body

    if (!stationId) {
      return NextResponse.json(
        { error: 'stationId is required' },
        { status: 400 }
      )
    }

    // Find the latest shift number for the station
    const latestShift = await db.shift.findFirst({
      where: { stationId },
      orderBy: { shiftNumber: 'desc' },
      select: { shiftNumber: true },
    })

    const shiftNumber = (latestShift?.shiftNumber || 0) + 1

    const shift = await db.shift.create({
      data: {
        stationId,
        shiftNumber,
        attendantId,
        openedAt: new Date(),
        openingCash: openingCash ? parseFloat(String(openingCash)) : 0,
        status: 'open',
        notes,
      },
      include: {
        station: { select: { id: true, name: true, code: true } },
        attendant: { select: { id: true, name: true, role: true } },
      },
    })

    return NextResponse.json({ shift }, { status: 201 })
  } catch (error) {
    console.error('Shifts POST error:', error)
    return NextResponse.json(
      { error: 'Failed to open shift' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, closingCash, expectedCash, notes } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Shift id is required' },
        { status: 400 }
      )
    }

    const existingShift = await db.shift.findUnique({ where: { id } })
    if (!existingShift) {
      return NextResponse.json(
        { error: 'Shift not found' },
        { status: 404 }
      )
    }

    if (existingShift.status !== 'open') {
      return NextResponse.json(
        { error: 'Shift is already closed' },
        { status: 400 }
      )
    }

    const parsedClosingCash = closingCash ? parseFloat(String(closingCash)) : 0
    const parsedExpectedCash = expectedCash ? parseFloat(String(expectedCash)) : 0
    const cashVariance = parsedClosingCash - parsedExpectedCash

    // Aggregate shift totals from fuelings
    const shiftFuelings = await db.fueling.findMany({
      where: { shiftId: id, status: 'completed' },
      select: { totalAmount: true, volume: true, fuelType: true },
    })

    const totalSales = shiftFuelings.reduce((sum, f) => sum + f.totalAmount, 0)
    const totalVolume = shiftFuelings.reduce((sum, f) => sum + f.volume, 0)

    const shift = await db.shift.update({
      where: { id },
      data: {
        closedAt: new Date(),
        closingCash: parsedClosingCash,
        expectedCash: parsedExpectedCash,
        cashVariance,
        totalSales: Math.round(totalSales * 100) / 100,
        totalVolume: Math.round(totalVolume * 10) / 10,
        fuelSales: Math.round(totalSales * 100) / 100,
        status: 'closed',
        notes,
      },
      include: {
        station: { select: { id: true, name: true, code: true } },
        attendant: { select: { id: true, name: true, role: true } },
      },
    })

    return NextResponse.json({ shift })
  } catch (error) {
    console.error('Shifts PUT error:', error)
    return NextResponse.json(
      { error: 'Failed to close shift' },
      { status: 500 }
    )
  }
}
