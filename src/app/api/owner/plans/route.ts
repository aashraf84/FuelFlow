import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const isActive = searchParams.get('isActive')

    const where: Record<string, unknown> = {}
    if (isActive !== null) where.isActive = isActive === 'true'

    const plans = await db.subscriptionPlan.findMany({
      where,
      include: {
        _count: {
          select: {
            subscriptions: true,
            licenseKeys: true,
          },
        },
      },
      orderBy: { sortOrder: 'asc' },
    })

    return NextResponse.json({ plans })
  } catch (error) {
    console.error('Owner Plans GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch plans' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      description,
      priceMonthly,
      priceAnnual,
      currency,
      maxStations,
      maxDispensers,
      maxUsers,
      maxDevices,
      features,
      isPopular,
      isActive,
      sortOrder,
    } = body

    if (!name || priceMonthly === undefined || priceAnnual === undefined) {
      return NextResponse.json(
        { error: 'name, priceMonthly, and priceAnnual are required' },
        { status: 400 }
      )
    }

    const slug = generateSlug(name)

    // Check for existing slug
    const existing = await db.subscriptionPlan.findUnique({ where: { slug } })
    if (existing) {
      return NextResponse.json(
        { error: 'A plan with this name already exists' },
        { status: 400 }
      )
    }

    const plan = await db.subscriptionPlan.create({
      data: {
        name,
        slug,
        description: description || null,
        priceMonthly: parseFloat(String(priceMonthly)),
        priceAnnual: parseFloat(String(priceAnnual)),
        currency: currency || 'PKR',
        maxStations: maxStations ?? 1,
        maxDispensers: maxDispensers ?? 4,
        maxUsers: maxUsers ?? 5,
        maxDevices: maxDevices ?? 10,
        features: typeof features === 'object' ? JSON.stringify(features) : (features || '[]'),
        isPopular: isPopular ?? false,
        isActive: isActive ?? true,
        sortOrder: sortOrder ?? 0,
      },
    })

    return NextResponse.json({ plan }, { status: 201 })
  } catch (error) {
    console.error('Owner Plans POST error:', error)
    return NextResponse.json({ error: 'Failed to create plan' }, { status: 500 })
  }
}
