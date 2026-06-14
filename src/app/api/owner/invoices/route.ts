import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')
    const status = searchParams.get('status')
    const subscriptionId = searchParams.get('subscriptionId')
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    const where: Record<string, unknown> = {}
    if (clientId) where.clientId = clientId
    if (status) where.status = status
    if (subscriptionId) where.subscriptionId = subscriptionId

    const [invoices, total] = await Promise.all([
      db.invoice.findMany({
        where,
        include: {
          client: {
            select: {
              id: true,
              companyName: true,
              slug: true,
              email: true,
              phone: true,
            },
          },
          items: { orderBy: { sortOrder: 'asc' } },
          _count: {
            select: { payments: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      db.invoice.count({ where }),
    ])

    return NextResponse.json({
      invoices,
      pagination: { total, limit, offset, hasMore: offset + limit < total },
    })
  } catch (error) {
    console.error('Owner Invoices GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      clientId,
      subscriptionId,
      status,
      issueDate,
      dueDate,
      subtotal,
      taxRate,
      taxAmount,
      discountRate,
      discountAmount,
      total,
      notes,
      terms,
      items,
    } = body

    if (!clientId || !issueDate || !dueDate || subtotal === undefined || total === undefined) {
      return NextResponse.json(
        { error: 'clientId, issueDate, dueDate, subtotal, and total are required' },
        { status: 400 }
      )
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'At least one invoice item is required' },
        { status: 400 }
      )
    }

    // Generate invoice number: INV-2025-0001
    const year = new Date().getFullYear()
    const invoiceCount = await db.invoice.count()
    const sequence = String(invoiceCount + 1).padStart(4, '0')
    const invoiceNumber = `INV-${year}-${sequence}`

    // Ensure uniqueness
    let finalInvoiceNumber = invoiceNumber
    let counter = invoiceCount + 2
    while (await db.invoice.findUnique({ where: { invoiceNumber: finalInvoiceNumber } })) {
      const seq = String(counter).padStart(4, '0')
      finalInvoiceNumber = `INV-${year}-${seq}`
      counter++
    }

    const parsedTaxRate = parseFloat(String(taxRate || 0))
    const parsedTaxAmount = parseFloat(String(taxAmount || 0))
    const parsedDiscountRate = parseFloat(String(discountRate || 0))
    const parsedDiscountAmount = parseFloat(String(discountAmount || 0))
    const parsedSubtotal = parseFloat(String(subtotal))
    const parsedTotal = parseFloat(String(total))
    const balanceDue = parsedTotal - 0 // Initially no payments

    const invoice = await db.invoice.create({
      data: {
        invoiceNumber: finalInvoiceNumber,
        clientId,
        subscriptionId: subscriptionId || null,
        status: status || 'draft',
        issueDate: new Date(issueDate),
        dueDate: new Date(dueDate),
        subtotal: parsedSubtotal,
        taxRate: parsedTaxRate,
        taxAmount: parsedTaxAmount,
        discountRate: parsedDiscountRate,
        discountAmount: parsedDiscountAmount,
        total: parsedTotal,
        paidAmount: 0,
        balanceDue: balanceDue,
        notes: notes || null,
        terms: terms || null,
        items: {
          create: items.map((item: { description: string; quantity: number; unitPrice: number; amount: number; sortOrder?: number }, index: number) => ({
            description: item.description,
            quantity: parseFloat(String(item.quantity || 1)),
            unitPrice: parseFloat(String(item.unitPrice)),
            amount: parseFloat(String(item.amount)),
            sortOrder: item.sortOrder ?? index,
          })),
        },
      },
      include: {
        client: {
          select: {
            id: true,
            companyName: true,
            slug: true,
            email: true,
          },
        },
        items: { orderBy: { sortOrder: 'asc' } },
      },
    })

    return NextResponse.json({ invoice }, { status: 201 })
  } catch (error) {
    console.error('Owner Invoices POST error:', error)
    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 })
  }
}
