import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { key } = body

    if (!key || typeof key !== 'string') {
      return NextResponse.json(
        { valid: false, error: 'Serial key is required' },
        { status: 400 }
      )
    }

    const serialKey = await db.serialKey.findUnique({
      where: { key: key.trim() },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    })

    if (!serialKey) {
      return NextResponse.json(
        { valid: false, error: 'Invalid serial key', status: 'invalid' },
        { status: 404 }
      )
    }

    // Check key status
    if (serialKey.status === 'expired') {
      return NextResponse.json(
        {
          valid: false,
          error: 'This serial key has expired',
          status: 'expired',
          expiredAt: serialKey.expiresAt,
        },
        { status: 410 }
      )
    }

    if (serialKey.status === 'revoked') {
      return NextResponse.json(
        {
          valid: false,
          error: 'This serial key has been revoked',
          status: 'revoked',
        },
        { status: 403 }
      )
    }

    // If inactive — valid key, not yet activated
    if (serialKey.status === 'inactive') {
      return NextResponse.json({
        valid: true,
        status: 'inactive',
        keyId: serialKey.id,
        plan: serialKey.plan,
        maxStations: serialKey.maxStations,
        maxDispensers: serialKey.maxDispensers,
        maxUsers: serialKey.maxUsers,
        expiresAt: serialKey.expiresAt,
        message: 'Serial key is valid and ready for activation',
      })
    }

    // If active — already assigned to a tenant
    if (serialKey.status === 'active') {
      return NextResponse.json({
        valid: true,
        status: 'active',
        keyId: serialKey.id,
        plan: serialKey.plan,
        maxStations: serialKey.maxStations,
        maxDispensers: serialKey.maxDispensers,
        maxUsers: serialKey.maxUsers,
        activatedAt: serialKey.activatedAt,
        expiresAt: serialKey.expiresAt,
        tenant: serialKey.tenant
          ? {
              id: serialKey.tenant.id,
              name: serialKey.tenant.name,
              slug: serialKey.tenant.slug,
            }
          : null,
        message: 'Serial key is already activated',
      })
    }

    // Fallback for unexpected status values
    return NextResponse.json(
      { valid: false, error: `Unknown key status: ${serialKey.status}` },
      { status: 400 }
    )
  } catch (error) {
    console.error('[validate-serial] Error:', error)
    return NextResponse.json(
      { valid: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
