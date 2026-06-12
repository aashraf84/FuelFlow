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
          customer: { select: { id: true, name: true, loyaltyPoints: true, membershipTier: true } },
        },
      }),
      db.fueling.count({ where }),
    ])

    // Add loyalty points info to response
    const fuelingsWithLoyalty = fuelings.map(f => ({
      ...f,
      loyaltyInfo: f.customer ? {
        customerName: f.customer.name,
        membershipTier: f.customer.membershipTier,
        currentPoints: f.customer.loyaltyPoints,
        pointsEarned: f.loyaltyPoints,
      } : null,
    }))

    return NextResponse.json({
      fuelings: fuelingsWithLoyalty,
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
      customerId,
    } = body

    if (!stationId || !dispenserId || !nozzleId || !fuelType || !volume || !pricePerUnit) {
      return NextResponse.json(
        { error: 'stationId, dispenserId, nozzleId, fuelType, volume, and pricePerUnit are required' },
        { status: 400 }
      )
    }

    const computedTotal = totalAmount || Math.round(volume * pricePerUnit * 100) / 100

    // Calculate loyalty points (1 point per 100 PKR spent)
    const loyaltyPoints = Math.floor(computedTotal / 100)

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
        customerId,
        loyaltyPoints,
        status: 'completed',
        startedAt: new Date(),
        completedAt: new Date(),
      },
      include: {
        dispenser: { select: { name: true, code: true } },
        nozzle: { select: { nozzleNumber: true, fuelType: true } },
        attendant: { select: { name: true } },
        customer: { select: { name: true, loyaltyPoints: true } },
      },
    })

    // Update customer loyalty points if applicable
    if (customerId && loyaltyPoints > 0) {
      await db.customer.update({
        where: { id: customerId },
        data: {
          loyaltyPoints: { increment: loyaltyPoints },
          totalSpent: { increment: computedTotal },
          totalVisits: { increment: 1 },
          lastVisit: new Date(),
        },
      })
    }

    return NextResponse.json({ fueling }, { status: 201 })
  } catch (error) {
    console.error('Fuelings POST error:', error)
    return NextResponse.json(
      { error: 'Failed to create fueling transaction' },
      { status: 500 }
    )
  }
}
