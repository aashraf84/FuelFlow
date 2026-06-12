import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const stationId = searchParams.get('stationId')
    const tankId = searchParams.get('tankId')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    const where: Record<string, unknown> = {}
    if (stationId) where.stationId = stationId
    if (tankId) where.tankId = tankId
    if (status) where.status = status

    const [deliveries, total] = await Promise.all([
      db.fuelDelivery.findMany({
        where,
        include: {
          tank: { select: { id: true, name: true, code: true, fuelType: true } },
          supplier: { select: { id: true, name: true, code: true } },
          station: { select: { id: true, name: true, code: true } },
        },
        orderBy: { deliveryDate: 'desc' },
        take: limit,
        skip: offset,
      }),
      db.fuelDelivery.count({ where }),
    ])

    // Summary
    const allDeliveries = await db.fuelDelivery.findMany({
      where: stationId ? { stationId } : {},
      select: { expectedVolume: true, actualVolume: true, status: true, totalCost: true, variance: true },
    })

    const summary = {
      totalDeliveries: allDeliveries.length,
      completed: allDeliveries.filter(d => d.status === 'completed').length,
      pending: allDeliveries.filter(d => d.status === 'pending').length,
      discrepancy: allDeliveries.filter(d => d.status === 'discrepancy').length,
      totalExpectedVolume: allDeliveries.reduce((sum, d) => sum + d.expectedVolume, 0),
      totalActualVolume: allDeliveries.filter(d => d.status !== 'pending').reduce((sum, d) => sum + d.actualVolume, 0),
      totalCost: allDeliveries.filter(d => d.totalCost).reduce((sum, d) => sum + (d.totalCost || 0), 0),
      totalVariance: allDeliveries.filter(d => d.variance).reduce((sum, d) => sum + (d.variance || 0), 0),
    }

    return NextResponse.json({
      deliveries,
      summary,
      pagination: { total, limit, offset, hasMore: offset + limit < total },
    })
  } catch (error) {
    console.error('Deliveries GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch fuel deliveries' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { stationId, tankId, supplierId, supplierName, tankerNumber, driverName, expectedVolume, productType, deliveryDate, notes, costPerUnit } = body

    if (!stationId || !tankId || !supplierName || !expectedVolume || !productType || !deliveryDate) {
      return NextResponse.json({ error: 'stationId, tankId, supplierName, expectedVolume, productType, and deliveryDate are required' }, { status: 400 })
    }

    const delivery = await db.fuelDelivery.create({
      data: {
        stationId,
        tankId,
        supplierId: supplierId || null,
        supplierName,
        tankerNumber,
        driverName,
        expectedVolume: parseFloat(String(expectedVolume)),
        productType,
        status: 'pending',
        deliveryDate: new Date(deliveryDate),
        notes,
        costPerUnit: costPerUnit ? parseFloat(String(costPerUnit)) : null,
        totalCost: costPerUnit ? parseFloat(String(expectedVolume)) * parseFloat(String(costPerUnit)) : null,
      },
      include: { tank: { select: { name: true, code: true } } },
    })

    return NextResponse.json({ delivery }, { status: 201 })
  } catch (error) {
    console.error('Deliveries POST error:', error)
    return NextResponse.json({ error: 'Failed to create fuel delivery' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, status, actualVolume, density, temperature, variance, completedAt, notes } = body

    if (!id) {
      return NextResponse.json({ error: 'Delivery id is required' }, { status: 400 })
    }

    const existing = await db.fuelDelivery.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Fuel delivery not found' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}
    if (status) updateData.status = status
    if (actualVolume !== undefined) updateData.actualVolume = parseFloat(String(actualVolume))
    if (density !== undefined) updateData.density = parseFloat(String(density))
    if (temperature !== undefined) updateData.temperature = parseFloat(String(temperature))
    if (variance !== undefined) updateData.variance = parseFloat(String(variance))
    if (completedAt) updateData.completedAt = new Date(completedAt)
    else if (status === 'completed') updateData.completedAt = new Date()
    if (notes) updateData.notes = notes

    const delivery = await db.fuelDelivery.update({
      where: { id },
      data: updateData,
      include: { tank: { select: { name: true, code: true } } },
    })

    return NextResponse.json({ delivery })
  } catch (error) {
    console.error('Deliveries PUT error:', error)
    return NextResponse.json({ error: 'Failed to update fuel delivery' }, { status: 500 })
  }
}
