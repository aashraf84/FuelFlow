import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const stationId = searchParams.get('stationId')
    const tenantId = searchParams.get('tenantId')

    const where: Record<string, unknown> = { status: 'active' }
    if (stationId) where.stationId = stationId
    if (tenantId) where.tenantId = tenantId

    const prices = await db.fuelPrice.findMany({
      where,
      orderBy: [{ fuelType: 'asc' }, { effectiveFrom: 'desc' }],
    })

    return NextResponse.json({ prices })
  } catch (error) {
    console.error('Prices GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch fuel prices' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      tenantId,
      stationId,
      fuelType,
      fuelGrade,
      pricePerUnit,
      currency,
      effectiveFrom,
      updatedBy,
    } = body

    if (!tenantId || !fuelType || !pricePerUnit) {
      return NextResponse.json(
        { error: 'tenantId, fuelType, and pricePerUnit are required' },
        { status: 400 }
      )
    }

    // Expire previous active prices for this fuel type
    const expireFilter: Record<string, unknown> = {
      tenantId,
      fuelType,
      status: 'active',
    }
    if (stationId) expireFilter.stationId = stationId

    await db.fuelPrice.updateMany({
      where: expireFilter,
      data: {
        status: 'expired',
        effectiveTo: new Date(),
      },
    })

    // Get the previous price for reference
    const previousPrice = await db.fuelPrice.findFirst({
      where: { tenantId, fuelType, stationId: stationId || null },
      orderBy: { effectiveFrom: 'desc' },
      select: { pricePerUnit: true },
    })

    // Create new price record
    const price = await db.fuelPrice.create({
      data: {
        tenantId,
        stationId: stationId || null,
        fuelType,
        fuelGrade,
        pricePerUnit: parseFloat(String(pricePerUnit)),
        previousPrice: previousPrice?.pricePerUnit || null,
        currency: currency || 'PKR',
        effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : new Date(),
        status: 'active',
        updatedBy,
      },
    })

    return NextResponse.json({ price }, { status: 201 })
  } catch (error) {
    console.error('Prices POST error:', error)
    return NextResponse.json(
      { error: 'Failed to update fuel prices' },
      { status: 500 }
    )
  }
}
