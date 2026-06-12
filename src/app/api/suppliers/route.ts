import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId')
    const category = searchParams.get('category')

    const where: Record<string, unknown> = {}
    if (tenantId) where.tenantId = tenantId
    if (category) where.category = category

    const suppliers = await db.supplier.findMany({
      where,
      include: {
        _count: {
          select: { invoices: true, purchaseOrders: true, deliveries: true },
        },
      },
      orderBy: { name: 'asc' },
    })

    const suppliersWithCounts = suppliers.map(s => ({
      id: s.id,
      name: s.name,
      code: s.code,
      contactPerson: s.contactPerson,
      phone: s.phone,
      email: s.email,
      address: s.address,
      city: s.city,
      category: s.category,
      paymentTerms: s.paymentTerms,
      taxId: s.taxId,
      isActive: s.isActive,
      invoiceCount: s._count.invoices,
      purchaseOrderCount: s._count.purchaseOrders,
      deliveryCount: s._count.deliveries,
      createdAt: s.createdAt,
    }))

    return NextResponse.json({ suppliers: suppliersWithCounts })
  } catch (error) {
    console.error('Suppliers GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch suppliers' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { tenantId, name, code, contactPerson, phone, email, address, city, category, paymentTerms, taxId } = body

    if (!tenantId || !name || !category) {
      return NextResponse.json({ error: 'tenantId, name, and category are required' }, { status: 400 })
    }

    const supplier = await db.supplier.create({
      data: { tenantId, name, code, contactPerson, phone, email, address, city, category, paymentTerms, taxId, isActive: true },
    })

    return NextResponse.json({ supplier }, { status: 201 })
  } catch (error) {
    console.error('Suppliers POST error:', error)
    return NextResponse.json({ error: 'Failed to create supplier' }, { status: 500 })
  }
}
