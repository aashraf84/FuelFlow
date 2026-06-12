import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const includeDetails = searchParams.get('includeDetails') === 'true'

    const where: Record<string, unknown> = {}
    if (status) where.status = status

    const fleetAccounts = await db.fleetAccount.findMany({
      where,
      include: {
        tenant: {
          select: { id: true, name: true, slug: true },
        },
        _count: {
          select: { vehicles: true, drivers: true, fuelCards: true, fuelings: true },
        },
        ...(includeDetails ? {
          vehicles: { where: { isActive: true } },
          drivers: { where: { isActive: true } },
          fuelCards: { where: { isActive: true } },
        } : {}),
      },
      orderBy: { createdAt: 'desc' },
    })

    const fleetWithDetails = fleetAccounts.map((account) => {
      const base: Record<string, unknown> = {
        id: account.id,
        tenantId: account.tenantId,
        companyName: account.companyName,
        contactPerson: account.contactPerson,
        phone: account.phone,
        email: account.email,
        address: account.address,
        creditLimit: account.creditLimit,
        currentBalance: account.currentBalance,
        dailyLimit: account.dailyLimit,
        monthlyLimit: account.monthlyLimit,
        fuelTypes: account.fuelTypes,
        paymentTerms: account.paymentTerms,
        taxExempt: account.taxExempt,
        status: account.status,
        vehicleCount: account._count.vehicles,
        driverCount: account._count.drivers,
        fuelCardCount: account._count.fuelCards,
        fuelingCount: account._count.fuelings,
        tenant: account.tenant,
        createdAt: account.createdAt,
        updatedAt: account.updatedAt,
      }

      if (includeDetails) {
        base.vehicles = account.vehicles || []
        base.drivers = account.drivers || []
        base.fuelCards = (account.fuelCards || []).map((fc: { id: string; cardNumber: string; cardType: string; rfidTag: string | null; dailyLimit: number | null; monthlyLimit: number | null; balance: number; isActive: boolean; expiryDate: Date | null }) => ({
          id: fc.id,
          cardNumber: fc.cardNumber,
          cardType: fc.cardType,
          rfidTag: fc.rfidTag,
          dailyLimit: fc.dailyLimit,
          monthlyLimit: fc.monthlyLimit,
          balance: fc.balance,
          isActive: fc.isActive,
          expiryDate: fc.expiryDate,
        }))
      }

      return base
    })

    // Summary
    const summary = {
      totalAccounts: fleetWithDetails.length,
      activeAccounts: fleetWithDetails.filter(f => f.status === 'active').length,
      totalVehicles: fleetWithDetails.reduce((sum: number, f) => sum + (f.vehicleCount as number), 0),
      totalDrivers: fleetWithDetails.reduce((sum: number, f) => sum + (f.driverCount as number), 0),
      totalFuelCards: fleetWithDetails.reduce((sum: number, f) => sum + (f.fuelCardCount as number), 0),
      totalCreditLimit: fleetWithDetails.reduce((sum: number, f) => sum + (f.creditLimit as number), 0),
      totalCurrentBalance: fleetWithDetails.reduce((sum: number, f) => sum + (f.currentBalance as number), 0),
      totalOutstanding: fleetWithDetails.reduce((sum: number, f) => sum + ((f.creditLimit as number) - (f.currentBalance as number)), 0),
    }

    return NextResponse.json({ fleetAccounts: fleetWithDetails, summary })
  } catch (error) {
    console.error('Fleet GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch fleet accounts' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      tenantId,
      companyName,
      contactPerson,
      phone,
      email,
      address,
      creditLimit,
      dailyLimit,
      monthlyLimit,
      fuelTypes,
      paymentTerms,
      taxExempt,
    } = body

    if (!tenantId || !companyName) {
      return NextResponse.json(
        { error: 'tenantId and companyName are required' },
        { status: 400 }
      )
    }

    const fleetAccount = await db.fleetAccount.create({
      data: {
        tenantId,
        companyName,
        contactPerson,
        phone,
        email,
        address,
        creditLimit: creditLimit ? parseFloat(String(creditLimit)) : 0,
        dailyLimit: dailyLimit ? parseFloat(String(dailyLimit)) : null,
        monthlyLimit: monthlyLimit ? parseFloat(String(monthlyLimit)) : null,
        fuelTypes,
        paymentTerms,
        taxExempt: taxExempt || false,
        status: 'active',
      },
    })

    return NextResponse.json({ fleetAccount }, { status: 201 })
  } catch (error) {
    console.error('Fleet POST error:', error)
    return NextResponse.json(
      { error: 'Failed to create fleet account' },
      { status: 500 }
    )
  }
}
