import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const client = await db.ownerClient.findUnique({
      where: { id },
      include: {
        subscriptions: {
          include: {
            plan: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        invoices: {
          include: {
            items: true,
            payments: { orderBy: { paidAt: 'desc' } },
          },
          orderBy: { createdAt: 'desc' },
        },
        quotations: {
          include: { items: true },
          orderBy: { createdAt: 'desc' },
        },
        licenseKeys: {
          include: {
            plan: { select: { id: true, name: true, slug: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        devices: {
          orderBy: { createdAt: 'desc' },
        },
        tenantDatabase: true,
      },
    })

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    return NextResponse.json({ client })
  } catch (error) {
    console.error('Owner Client GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch client' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const existing = await db.ownerClient.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}
    const allowedFields = [
      'companyName', 'contactPerson', 'email', 'phone', 'address',
      'city', 'state', 'country', 'postalCode', 'website',
      'taxId', 'registrationNumber', 'logo', 'industry', 'notes', 'status',
    ]

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }

    // Regenerate slug if companyName is being updated
    if (body.companyName && body.companyName !== existing.companyName) {
      const baseSlug = body.companyName
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_]+/g, '-')
        .replace(/^-+|-+$/g, '')

      let slug = baseSlug
      let counter = 1
      const existingSlug = await db.ownerClient.findUnique({ where: { slug } })
      while (existingSlug && existingSlug.id !== id) {
        slug = `${baseSlug}-${counter}`
        counter++
      }
      updateData.slug = slug
    }

    const client = await db.ownerClient.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: {
            subscriptions: true,
            invoices: true,
            devices: true,
            licenseKeys: true,
          },
        },
        tenantDatabase: true,
      },
    })

    return NextResponse.json({ client })
  } catch (error) {
    console.error('Owner Client PUT error:', error)
    return NextResponse.json({ error: 'Failed to update client' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existing = await db.ownerClient.findUnique({
      where: { id },
      include: {
        _count: {
          select: { subscriptions: true },
        },
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    const activeSubscriptions = await db.clientSubscription.count({
      where: {
        clientId: id,
        status: { in: ['active', 'trial'] },
      },
    })

    if (activeSubscriptions > 0) {
      return NextResponse.json(
        { error: 'Cannot delete client with active subscriptions. Please cancel all subscriptions first.' },
        { status: 400 }
      )
    }

    await db.ownerClient.delete({ where: { id } })

    return NextResponse.json({ message: 'Client deleted successfully' })
  } catch (error) {
    console.error('Owner Client DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 })
  }
}
