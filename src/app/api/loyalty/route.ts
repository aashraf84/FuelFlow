import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId')

    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId is required' }, { status: 400 })
    }

    // Get loyalty rules
    const rules = await db.loyaltyRule.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    })

    // Get customer summary
    const customers = await db.customer.findMany({
      where: { tenantId, isActive: true },
      select: {
        id: true,
        name: true,
        phone: true,
        loyaltyPoints: true,
        membershipTier: true,
        totalSpent: true,
        totalVisits: true,
        lastVisit: true,
      },
      orderBy: { totalSpent: 'desc' },
    })

    const customerSummary = {
      totalCustomers: customers.length,
      totalLoyaltyPoints: customers.reduce((sum, c) => sum + c.loyaltyPoints, 0),
      totalSpent: customers.reduce((sum, c) => sum + c.totalSpent, 0),
      byTier: {
        platinum: customers.filter(c => c.membershipTier === 'platinum').length,
        gold: customers.filter(c => c.membershipTier === 'gold').length,
        silver: customers.filter(c => c.membershipTier === 'silver').length,
        basic: customers.filter(c => c.membershipTier === 'basic').length,
      },
      topCustomers: customers.slice(0, 10),
    }

    return NextResponse.json({ rules, customerSummary })
  } catch (error) {
    console.error('Loyalty GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch loyalty data' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { tenantId, name, pointsPerUnit, fuelType, minimumPurchase, bonusMultiplier, validFrom, validTo } = body

    if (!tenantId || !name) {
      return NextResponse.json({ error: 'tenantId and name are required' }, { status: 400 })
    }

    const rule = await db.loyaltyRule.create({
      data: {
        tenantId,
        name,
        pointsPerUnit: pointsPerUnit ? parseFloat(String(pointsPerUnit)) : 1,
        fuelType: fuelType || null,
        minimumPurchase: minimumPurchase ? parseFloat(String(minimumPurchase)) : null,
        bonusMultiplier: bonusMultiplier ? parseFloat(String(bonusMultiplier)) : 1,
        isActive: true,
        validFrom: validFrom ? new Date(validFrom) : null,
        validTo: validTo ? new Date(validTo) : null,
      },
    })

    return NextResponse.json({ rule }, { status: 201 })
  } catch (error) {
    console.error('Loyalty POST error:', error)
    return NextResponse.json({ error: 'Failed to create loyalty rule' }, { status: 500 })
  }
}
