import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId')
    const isActive = searchParams.get('isActive')
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    const where: Record<string, unknown> = {}
    if (tenantId) where.tenantId = tenantId
    if (isActive !== null && isActive !== undefined) where.isActive = isActive === 'true'

    const [promotions, total] = await Promise.all([
      db.promotion.findMany({
        where,
        include: {
          usage: {
            orderBy: { createdAt: 'desc' },
            take: 20,
          },
          _count: { select: { usage: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      db.promotion.count({ where }),
    ])

    const promotionsWithUsage = promotions.map(p => ({
      id: p.id,
      name: p.name,
      description: p.description,
      discountType: p.discountType,
      discountValue: p.discountValue,
      applicableTo: p.applicableTo,
      fuelType: p.fuelType,
      minimumPurchase: p.minimumPurchase,
      validFrom: p.validFrom,
      validTo: p.validTo,
      isActive: p.isActive,
      totalUsage: p._count.usage,
      totalDiscount: p.usage.reduce((sum, u) => sum + u.discountAmount, 0),
      recentUsage: p.usage,
      createdAt: p.createdAt,
    }))

    return NextResponse.json({
      promotions: promotionsWithUsage,
      pagination: { total, limit, offset, hasMore: offset + limit < total },
    })
  } catch (error) {
    console.error('Promotions GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch promotions' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { tenantId, name, description, discountType, discountValue, applicableTo, fuelType, minimumPurchase, validFrom, validTo } = body

    if (!tenantId || !name || !discountType || discountValue === undefined || !applicableTo || !validFrom || !validTo) {
      return NextResponse.json({ error: 'tenantId, name, discountType, discountValue, applicableTo, validFrom, and validTo are required' }, { status: 400 })
    }

    const promotion = await db.promotion.create({
      data: {
        tenantId,
        name,
        description,
        discountType,
        discountValue: parseFloat(String(discountValue)),
        applicableTo,
        fuelType: fuelType || null,
        minimumPurchase: minimumPurchase ? parseFloat(String(minimumPurchase)) : null,
        validFrom: new Date(validFrom),
        validTo: new Date(validTo),
        isActive: true,
      },
    })

    return NextResponse.json({ promotion }, { status: 201 })
  } catch (error) {
    console.error('Promotions POST error:', error)
    return NextResponse.json({ error: 'Failed to create promotion' }, { status: 500 })
  }
}
