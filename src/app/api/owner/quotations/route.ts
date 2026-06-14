import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    const where: Record<string, unknown> = {}
    if (clientId) where.clientId = clientId
    if (status) where.status = status

    const [quotations, total] = await Promise.all([
      db.quotation.findMany({
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
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      db.quotation.count({ where }),
    ])

    return NextResponse.json({
      quotations,
      pagination: { total, limit, offset, hasMore: offset + limit < total },
    })
  } catch (error) {
    console.error('Owner Quotations GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch quotations' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      clientId,
      clientName,
      clientEmail,
      clientPhone,
      clientAddress,
      status,
      issueDate,
      validUntil,
      subtotal,
      taxRate,
      taxAmount,
      discountRate,
      discountAmount,
      total,
      notes,
      terms,
      internalNotes,
      items,
    } = body

    if (!clientName || !issueDate || !validUntil || subtotal === undefined || total === undefined) {
      return NextResponse.json(
        { error: 'clientName, issueDate, validUntil, subtotal, and total are required' },
        { status: 400 }
      )
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'At least one quotation item is required' },
        { status: 400 }
      )
    }

    // Generate quotation number: QT-2025-0001
    const year = new Date().getFullYear()
    const quotationCount = await db.quotation.count()
    const sequence = String(quotationCount + 1).padStart(4, '0')
    const quotationNumber = `QT-${year}-${sequence}`

    // Ensure uniqueness
    let finalQuotationNumber = quotationNumber
    let counter = quotationCount + 2
    while (await db.quotation.findUnique({ where: { quotationNumber: finalQuotationNumber } })) {
      const seq = String(counter).padStart(4, '0')
      finalQuotationNumber = `QT-${year}-${seq}`
      counter++
    }

    const parsedTaxRate = parseFloat(String(taxRate || 0))
    const parsedTaxAmount = parseFloat(String(taxAmount || 0))
    const parsedDiscountRate = parseFloat(String(discountRate || 0))
    const parsedDiscountAmount = parseFloat(String(discountAmount || 0))
    const parsedSubtotal = parseFloat(String(subtotal))
    const parsedTotal = parseFloat(String(total))

    const quotation = await db.quotation.create({
      data: {
        quotationNumber: finalQuotationNumber,
        clientId: clientId || null,
        clientName,
        clientEmail: clientEmail || null,
        clientPhone: clientPhone || null,
        clientAddress: clientAddress || null,
        status: status || 'draft',
        issueDate: new Date(issueDate),
        validUntil: new Date(validUntil),
        subtotal: parsedSubtotal,
        taxRate: parsedTaxRate,
        taxAmount: parsedTaxAmount,
        discountRate: parsedDiscountRate,
        discountAmount: parsedDiscountAmount,
        total: parsedTotal,
        notes: notes || null,
        terms: terms || null,
        internalNotes: internalNotes || null,
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
          },
        },
        items: { orderBy: { sortOrder: 'asc' } },
      },
    })

    return NextResponse.json({ quotation }, { status: 201 })
  } catch (error) {
    console.error('Owner Quotations POST error:', error)
    return NextResponse.json({ error: 'Failed to create quotation' }, { status: 500 })
  }
}
