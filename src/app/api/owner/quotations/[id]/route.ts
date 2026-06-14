import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const quotation = await db.quotation.findUnique({
      where: { id },
      include: {
        client: {
          select: {
            id: true,
            companyName: true,
            slug: true,
            email: true,
            phone: true,
            address: true,
          },
        },
        items: { orderBy: { sortOrder: 'asc' } },
      },
    })

    if (!quotation) {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 })
    }

    return NextResponse.json({ quotation })
  } catch (error) {
    console.error('Owner Quotation GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch quotation' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const existing = await db.quotation.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}

    if (body.status) updateData.status = body.status
    if (body.notes !== undefined) updateData.notes = body.notes
    if (body.terms !== undefined) updateData.terms = body.terms
    if (body.internalNotes !== undefined) updateData.internalNotes = body.internalNotes
    if (body.validUntil) updateData.validUntil = new Date(body.validUntil)

    // Handle conversion to invoice
    if (body.status === 'converted' && existing.status !== 'converted') {
      updateData.convertedInvoiceId = body.convertedInvoiceId || null
    }

    const quotation = await db.quotation.update({
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
        items: { orderBy: { sortOrder: 'asc' } },
      },
    })

    return NextResponse.json({ quotation })
  } catch (error) {
    console.error('Owner Quotation PUT error:', error)
    return NextResponse.json({ error: 'Failed to update quotation' }, { status: 500 })
  }
}
