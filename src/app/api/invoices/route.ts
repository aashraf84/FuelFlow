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

    const [invoices, total] = await Promise.all([
      db.supplierInvoice.findMany({
        where,
        include: {
          supplier: { select: { id: true, name: true, code: true, category: true } },
          station: { select: { id: true, name: true, code: true } },
        },
        orderBy: { invoiceDate: 'desc' },
        take: limit,
        skip: offset,
      }),
      db.supplierInvoice.count({ where }),
    ])

    return NextResponse.json({
      invoices,
      pagination: { total, limit, offset, hasMore: offset + limit < total },
    })
  } catch (error) {
    console.error('Invoices GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { stationId, supplierId, invoiceNumber, invoiceDate, dueDate, totalAmount, taxAmount, netAmount, notes } = body

    if (!stationId || !supplierId || !invoiceNumber || !invoiceDate || !totalAmount) {
      return NextResponse.json({ error: 'stationId, supplierId, invoiceNumber, invoiceDate, and totalAmount are required' }, { status: 400 })
    }

    const tax = taxAmount || 0
    const net = netAmount || (totalAmount + tax)

    const invoice = await db.supplierInvoice.create({
      data: {
        stationId,
        supplierId,
        invoiceNumber,
        invoiceDate: new Date(invoiceDate),
        dueDate: dueDate ? new Date(dueDate) : null,
        totalAmount: parseFloat(String(totalAmount)),
        taxAmount: parseFloat(String(tax)),
        netAmount: parseFloat(String(net)),
        status: 'pending',
        notes,
      },
      include: { supplier: { select: { name: true, code: true } } },
    })

    return NextResponse.json({ invoice }, { status: 201 })
  } catch (error) {
    console.error('Invoices POST error:', error)
    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, status, paidAmount, paidDate } = body

    if (!id) {
      return NextResponse.json({ error: 'Invoice id is required' }, { status: 400 })
    }

    const existing = await db.supplierInvoice.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}
    if (status) updateData.status = status
    if (paidAmount !== undefined) updateData.paidAmount = parseFloat(String(paidAmount))
    if (paidDate) updateData.paidDate = new Date(paidDate)

    const invoice = await db.supplierInvoice.update({
      where: { id },
      data: updateData,
      include: { supplier: { select: { name: true, code: true } } },
    })

    return NextResponse.json({ invoice })
  } catch (error) {
    console.error('Invoices PUT error:', error)
    return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 })
  }
}
