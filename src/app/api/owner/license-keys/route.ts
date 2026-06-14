import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

function generateLicenseKey(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Exclude confusing chars like I, O, 0, 1
  const generateSegment = (): string => {
    let segment = ''
    for (let i = 0; i < 4; i++) {
      segment += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return segment
  }
  return `FF-${generateSegment()}-${generateSegment()}-${generateSegment()}`
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')
    const planId = searchParams.get('planId')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    const where: Record<string, unknown> = {}
    if (clientId) where.clientId = clientId
    if (planId) where.planId = planId
    if (status) where.status = status

    const [licenseKeys, total] = await Promise.all([
      db.licenseKey.findMany({
        where,
        include: {
          client: {
            select: {
              id: true,
              companyName: true,
              slug: true,
              email: true,
            },
          },
          plan: {
            select: {
              id: true,
              name: true,
              slug: true,
              priceMonthly: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      db.licenseKey.count({ where }),
    ])

    return NextResponse.json({
      licenseKeys,
      pagination: { total, limit, offset, hasMore: offset + limit < total },
    })
  } catch (error) {
    console.error('Owner License Keys GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch license keys' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      clientId,
      planId,
      status,
      maxStations,
      maxDispensers,
      maxUsers,
      expiresAt,
      notes,
    } = body

    // Generate a unique license key
    let key = generateLicenseKey()
    let attempts = 0
    while (await db.licenseKey.findUnique({ where: { key } })) {
      key = generateLicenseKey()
      attempts++
      if (attempts > 100) {
        return NextResponse.json(
          { error: 'Failed to generate a unique license key' },
          { status: 500 }
        )
      }
    }

    // If planId is provided, use the plan's limits as defaults
    let planMaxStations = maxStations ?? 1
    let planMaxDispensers = maxDispensers ?? 4
    let planMaxUsers = maxUsers ?? 5

    if (planId) {
      const plan = await db.subscriptionPlan.findUnique({ where: { id: planId } })
      if (plan) {
        planMaxStations = maxStations ?? plan.maxStations
        planMaxDispensers = maxDispensers ?? plan.maxDispensers
        planMaxUsers = maxUsers ?? plan.maxUsers
      }
    }

    const licenseKey = await db.licenseKey.create({
      data: {
        key,
        clientId: clientId || null,
        planId: planId || null,
        status: status || 'available',
        maxStations: planMaxStations,
        maxDispensers: planMaxDispensers,
        maxUsers: planMaxUsers,
        assignedAt: clientId ? new Date() : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        notes: notes || null,
      },
      include: {
        client: {
          select: {
            id: true,
            companyName: true,
            slug: true,
          },
        },
        plan: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    })

    return NextResponse.json({ licenseKey }, { status: 201 })
  } catch (error) {
    console.error('Owner License Keys POST error:', error)
    return NextResponse.json({ error: 'Failed to create license key' }, { status: 500 })
  }
}
