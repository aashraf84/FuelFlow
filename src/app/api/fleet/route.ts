import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const fleetAccounts = await db.fleetAccount.findMany({
      where: { status: 'active' },
      include: {
        _count: {
          select: { vehicles: true, drivers: true, fuelCards: true },
        },
        tenant: {
          select: { id: true, name: true, slug: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const fleetWithStats = fleetAccounts.map((account) => ({
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
      status: account.status,
      vehicleCount: account._count.vehicles,
      driverCount: account._count.drivers,
      fuelCardCount: account._count.fuelCards,
      tenant: account.tenant,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
    }))

    return NextResponse.json({ fleetAccounts: fleetWithStats })
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
