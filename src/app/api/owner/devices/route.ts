import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')
    const deviceType = searchParams.get('deviceType')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    const where: Record<string, unknown> = {}
    if (clientId) where.clientId = clientId
    if (deviceType) where.deviceType = deviceType
    if (status) where.status = status

    const [devices, total] = await Promise.all([
      db.clientDevice.findMany({
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
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      db.clientDevice.count({ where }),
    ])

    return NextResponse.json({
      devices,
      pagination: { total, limit, offset, hasMore: offset + limit < total },
    })
  } catch (error) {
    console.error('Owner Devices GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch devices' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      clientId,
      deviceName,
      deviceType,
      serialNumber,
      macAddress,
      ipAddress,
      location,
      status,
      lastSeenAt,
      notes,
    } = body

    if (!clientId || !deviceName || !deviceType) {
      return NextResponse.json(
        { error: 'clientId, deviceName, and deviceType are required' },
        { status: 400 }
      )
    }

    // Verify client exists
    const client = await db.ownerClient.findUnique({ where: { id: clientId } })
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    const device = await db.clientDevice.create({
      data: {
        clientId,
        deviceName,
        deviceType,
        serialNumber: serialNumber || null,
        macAddress: macAddress || null,
        ipAddress: ipAddress || null,
        location: location || null,
        status: status || 'active',
        lastSeenAt: lastSeenAt ? new Date(lastSeenAt) : null,
        notes: notes || null,
      },
      include: {
        client: {
          select: {
            id: true,
            companyName: true,
            slug: true,
          },
        },
      },
    })

    return NextResponse.json({ device }, { status: 201 })
  } catch (error) {
    console.error('Owner Devices POST error:', error)
    return NextResponse.json({ error: 'Failed to create device' }, { status: 500 })
  }
}
