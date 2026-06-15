import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: Request) {
  let body: { key?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { valid: false, error: 'Invalid request format' },
      { status: 400 }
    )
  }

  try {
    const { key } = body

    if (!key || typeof key !== 'string') {
      return NextResponse.json(
        { valid: false, error: 'Serial key is required' },
        { status: 400 }
      )
    }

    const trimmedKey = key.trim()

    // ── First check SerialKey table (tenant-level keys) ──
    const serialKey = await db.serialKey.findUnique({
      where: { key: trimmedKey },
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

    if (serialKey) {
      // Check key status
      if (serialKey.status === 'expired') {
        return NextResponse.json(
          { valid: false, error: 'This serial key has expired', status: 'expired', expiredAt: serialKey.expiresAt },
          { status: 410 }
        )
      }

      if (serialKey.status === 'revoked') {
        return NextResponse.json(
          { valid: false, error: 'This serial key has been revoked', status: 'revoked' },
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
            ? { id: serialKey.tenant.id, name: serialKey.tenant.name, slug: serialKey.tenant.slug }
            : null,
          message: 'Serial key is already activated',
        })
      }

      return NextResponse.json(
        { valid: false, error: `Unknown key status: ${serialKey.status}` },
        { status: 400 }
      )
    }

    // ── Fallback: Check LicenseKey table (owner-level keys) ──
    const licenseKey = await db.licenseKey.findUnique({
      where: { key: trimmedKey },
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
        plan: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    })

    if (licenseKey) {
      if (licenseKey.status === 'revoked') {
        return NextResponse.json(
          { valid: false, error: 'This license key has been revoked', status: 'revoked' },
          { status: 403 }
        )
      }

      if (licenseKey.status === 'expired') {
        return NextResponse.json(
          { valid: false, error: 'This license key has expired', status: 'expired', expiredAt: licenseKey.expiresAt },
          { status: 410 }
        )
      }

      // assigned or available — valid key
      const planSlug = licenseKey.plan?.slug || 'starter'
      return NextResponse.json({
        valid: true,
        status: licenseKey.status === 'assigned' ? 'active' : 'inactive',
        keyId: licenseKey.id,
        keyType: 'license',
        plan: planSlug,
        maxStations: licenseKey.maxStations,
        maxDispensers: licenseKey.maxDispensers,
        maxUsers: licenseKey.maxUsers,
        activatedAt: licenseKey.assignedAt,
        expiresAt: licenseKey.expiresAt,
        tenant: licenseKey.client
          ? { id: licenseKey.client.id, name: licenseKey.client.companyName, slug: licenseKey.client.slug }
          : null,
        message: licenseKey.status === 'assigned'
          ? 'License key is active and assigned'
          : 'License key is valid and ready for activation',
      })
    }

    // No key found in either table
    return NextResponse.json(
      { valid: false, error: 'Invalid serial key', status: 'invalid' },
      { status: 404 }
    )
  } catch (error) {
    console.error('[validate-serial] Error:', error)
    // Check if it's a database connection error
    const message = error instanceof Error && error.message.includes('connect')
      ? 'Unable to connect to database. Please try again.'
      : 'Service temporarily unavailable. Please try again.'
    return NextResponse.json(
      { valid: false, error: message },
      { status: 503 }
    )
  }
}
