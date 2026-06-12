import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const stationId = searchParams.get('stationId')
    const tankId = searchParams.get('tankId')

    const where: Record<string, unknown> = {}
    if (stationId) where.stationId = stationId
    if (tankId) where.tankId = tankId

    const calibrations = await db.tankCalibration.findMany({
      where,
      include: {
        tank: { select: { id: true, name: true, code: true, fuelType: true, capacity: true } },
        station: { select: { id: true, name: true, code: true } },
      },
      orderBy: { calibrationDate: 'desc' },
    })

    return NextResponse.json({ calibrations })
  } catch (error) {
    console.error('Calibrations GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch calibrations' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { stationId, tankId, calibrationDate, calibratedBy, certificateNumber, volumeTable, notes } = body

    if (!stationId || !tankId || !calibrationDate || !volumeTable) {
      return NextResponse.json({ error: 'stationId, tankId, calibrationDate, and volumeTable are required' }, { status: 400 })
    }

    const calibration = await db.tankCalibration.create({
      data: {
        stationId,
        tankId,
        calibrationDate: new Date(calibrationDate),
        calibratedBy,
        certificateNumber,
        volumeTable: typeof volumeTable === 'string' ? volumeTable : JSON.stringify(volumeTable),
        notes,
      },
      include: { tank: { select: { name: true, code: true } } },
    })

    return NextResponse.json({ calibration }, { status: 201 })
  } catch (error) {
    console.error('Calibrations POST error:', error)
    return NextResponse.json({ error: 'Failed to create calibration' }, { status: 500 })
  }
}
