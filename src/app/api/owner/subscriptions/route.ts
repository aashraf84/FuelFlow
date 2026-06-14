import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

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

    const [subscriptions, total] = await Promise.all([
      db.clientSubscription.findMany({
        where,
        include: {
          client: {
            select: {
              id: true,
              companyName: true,
              slug: true,
              contactPerson: true,
              email: true,
              status: true,
            },
          },
          plan: true,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      db.clientSubscription.count({ where }),
    ])

    return NextResponse.json({
      subscriptions,
      pagination: { total, limit, offset, hasMore: offset + limit < total },
    })
  } catch (error) {
    console.error('Owner Subscriptions GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      clientId,
      planId,
      status,
      billingCycle,
      startDate,
      endDate,
      trialEnd,
      currentPeriodStart,
      currentPeriodEnd,
      autoRenew,
      notes,
    } = body

    if (!clientId || !planId || !startDate) {
      return NextResponse.json(
        { error: 'clientId, planId, and startDate are required' },
        { status: 400 }
      )
    }

    // Verify client exists
    const client = await db.ownerClient.findUnique({ where: { id: clientId } })
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    // Verify plan exists
    const plan = await db.subscriptionPlan.findUnique({ where: { id: planId } })
    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    const subscription = await db.clientSubscription.create({
      data: {
        clientId,
        planId,
        status: status || 'active',
        billingCycle: billingCycle || 'monthly',
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        trialEnd: trialEnd ? new Date(trialEnd) : null,
        currentPeriodStart: currentPeriodStart ? new Date(currentPeriodStart) : null,
        currentPeriodEnd: currentPeriodEnd ? new Date(currentPeriodEnd) : null,
        autoRenew: autoRenew ?? true,
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
        plan: true,
      },
    })

    return NextResponse.json({ subscription }, { status: 201 })
  } catch (error) {
    console.error('Owner Subscriptions POST error:', error)
    return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 })
  }
}
