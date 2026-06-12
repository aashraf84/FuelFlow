import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const stationId = searchParams.get('stationId')
    const supplierId = searchParams.get('supplierId')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    const where: Record<string, unknown> = {}
    if (stationId) where.stationId = stationId
    if (supplierId) where.supplierId = supplierId
    if (status) where.status = status

    const [purchaseOrders, total] = await Promise.all([
      db.purchaseOrder.findMany({
        where,
        include: {
          supplier: { select: { id: true, name: true, code: true, category: true } },
          station: { select: { id: true, name: true, code: true } },
        },
        orderBy: { orderDate: 'desc' },
        take: limit,
        skip: offset,
      }),
      db.purchaseOrder.count({ where }),
    ])

    return NextResponse.json({
      purchaseOrders,
      pagination: { total, limit, offset, hasMore: offset + limit < total },
    })
  } catch (error) {
    console.error('Purchase orders GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch purchase orders' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { stationId, supplierId, poNumber, orderDate, expectedDate, items, totalAmount, notes } = body

    if (!stationId || !supplierId || !poNumber || !orderDate || !totalAmount) {
      return NextResponse.json({ error: 'stationId, supplierId, poNumber, orderDate, and totalAmount are required' }, { status: 400 })
    }

    const purchaseOrder = await db.purchaseOrder.create({
      data: {
        stationId,
        supplierId,
        poNumber,
        orderDate: new Date(orderDate),
        expectedDate: expectedDate ? new Date(expectedDate) : null,
        items: typeof items === 'string' ? items : JSON.stringify(items),
        totalAmount: parseFloat(String(totalAmount)),
        status: 'draft',
        notes,
      },
      include: { supplier: { select: { name: true, code: true } } },
    })

    return NextResponse.json({ purchaseOrder }, { status: 201 })
  } catch (error) {
    console.error('Purchase orders POST error:', error)
    return NextResponse.json({ error: 'Failed to create purchase order' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, status, approvedBy, notes } = body

    if (!id) {
      return NextResponse.json({ error: 'Purchase order id is required' }, { status: 400 })
    }

    const existing = await db.purchaseOrder.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}
    if (status) updateData.status = status
    if (approvedBy) updateData.approvedBy = approvedBy
    if (notes) updateData.notes = notes

    const purchaseOrder = await db.purchaseOrder.update({
      where: { id },
      data: updateData,
      include: { supplier: { select: { name: true, code: true } } },
    })

    return NextResponse.json({ purchaseOrder })
  } catch (error) {
    console.error('Purchase orders PUT error:', error)
    return NextResponse.json({ error: 'Failed to update purchase order' }, { status: 500 })
  }
}
