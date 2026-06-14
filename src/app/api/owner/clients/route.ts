import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (search) {
      where.OR = [
        { companyName: { contains: search } },
        { contactPerson: { contains: search } },
        { email: { contains: search } },
        { slug: { contains: search } },
      ]
    }

    const [clients, total] = await Promise.all([
      db.ownerClient.findMany({
        where,
        include: {
          _count: {
            select: {
              subscriptions: true,
              invoices: true,
              devices: true,
              licenseKeys: true,
            },
          },
          tenantDatabase: {
            select: {
              id: true,
              databaseName: true,
              status: true,
              totalSize: true,
              tableCount: true,
              activatedAt: true,
              lastMigratedAt: true,
              schemaVersion: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      db.ownerClient.count({ where }),
    ])

    return NextResponse.json({
      clients,
      pagination: { total, limit, offset, hasMore: offset + limit < total },
    })
  } catch (error) {
    console.error('Owner Clients GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      companyName,
      contactPerson,
      email,
      phone,
      address,
      city,
      state,
      country,
      postalCode,
      website,
      taxId,
      registrationNumber,
      logo,
      industry,
      notes,
      status,
    } = body

    if (!companyName || !contactPerson || !email || !phone) {
      return NextResponse.json(
        { error: 'companyName, contactPerson, email, and phone are required' },
        { status: 400 }
      )
    }

    const baseSlug = generateSlug(companyName)
    let slug = baseSlug
    let counter = 1
    while (await db.ownerClient.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`
      counter++
    }

    const client = await db.ownerClient.create({
      data: {
        companyName,
        slug,
        contactPerson,
        email,
        phone,
        address: address || null,
        city: city || null,
        state: state || null,
        country: country || 'Pakistan',
        postalCode: postalCode || null,
        website: website || null,
        taxId: taxId || null,
        registrationNumber: registrationNumber || null,
        logo: logo || null,
        industry: industry || null,
        notes: notes || null,
        status: status || 'active',
      },
      include: {
        _count: {
          select: {
            subscriptions: true,
            invoices: true,
            devices: true,
          },
        },
      },
    })

    return NextResponse.json({ client }, { status: 201 })
  } catch (error) {
    console.error('Owner Clients POST error:', error)
    return NextResponse.json({ error: 'Failed to create client' }, { status: 500 })
  }
}
