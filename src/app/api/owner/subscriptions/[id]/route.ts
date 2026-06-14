import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const existing = await db.clientSubscription.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}
    const allowedFields = [
      'status', 'billingCycle', 'autoRenew', 'notes',
    ]

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }

    // Handle date fields
    if (body.startDate) updateData.startDate = new Date(body.startDate)
    if (body.endDate) updateData.endDate = new Date(body.endDate)
    if (body.trialEnd) updateData.trialEnd = new Date(body.trialEnd)
    if (body.currentPeriodStart) updateData.currentPeriodStart = new Date(body.currentPeriodStart)
    if (body.currentPeriodEnd) updateData.currentPeriodEnd = new Date(body.currentPeriodEnd)

    // Set cancelledAt if status is being changed to cancelled
    if (body.status === 'cancelled') {
      updateData.cancelledAt = new Date()
      updateData.autoRenew = false
    }

    const subscription = await db.clientSubscription.update({
      where: { id },
      data: updateData,
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

    return NextResponse.json({ subscription })
  } catch (error) {
    console.error('Owner Subscription PUT error:', error)
    return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 })
  }
}
