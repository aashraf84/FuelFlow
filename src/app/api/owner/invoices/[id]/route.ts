import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const invoice = await db.invoice.findUnique({
      where: { id },
      include: {
        client: true,
        subscription: {
          include: {
            plan: true,
          },
        },
        items: { orderBy: { sortOrder: 'asc' } },
        payments: { orderBy: { paidAt: 'desc' } },
      },
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    return NextResponse.json({ invoice })
  } catch (error) {
    console.error('Owner Invoice GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch invoice' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const existing = await db.invoice.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // Handle status update
    const updateData: Record<string, unknown> = {}
    if (body.status) updateData.status = body.status
    if (body.notes !== undefined) updateData.notes = body.notes
    if (body.terms !== undefined) updateData.terms = body.terms
    if (body.paidDate) updateData.paidDate = new Date(body.paidDate)

    // Handle adding a payment
    if (body.payment) {
      const payment = body.payment
      if (!payment.amount || !payment.method) {
        return NextResponse.json(
          { error: 'Payment amount and method are required' },
          { status: 400 }
        )
      }

      const paymentAmount = parseFloat(String(payment.amount))
      const newPaidAmount = existing.paidAmount + paymentAmount
      const newBalanceDue = existing.total - newPaidAmount

      // Determine new status based on payment
      let newStatus = existing.status
      if (newBalanceDue <= 0) {
        newStatus = 'paid'
        updateData.paidDate = new Date()
      } else if (newPaidAmount > 0) {
        newStatus = 'partial'
      }

      updateData.paidAmount = newPaidAmount
      updateData.balanceDue = Math.max(0, newBalanceDue)
      updateData.status = newStatus

      // Create the payment record
      await db.invoicePayment.create({
        data: {
          invoiceId: id,
          amount: paymentAmount,
          method: payment.method,
          reference: payment.reference || null,
          paidAt: payment.paidAt ? new Date(payment.paidAt) : new Date(),
          notes: payment.notes || null,
        },
      })
    }

    const invoice = await db.invoice.update({
      where: { id },
      data: updateData,
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
        payments: { orderBy: { paidAt: 'desc' } },
      },
    })

    return NextResponse.json({ invoice })
  } catch (error) {
    console.error('Owner Invoice PUT error:', error)
    return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 })
  }
}
