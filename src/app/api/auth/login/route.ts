import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyPassword } from '@/lib/auth'

export async function POST(request: Request) {
  let body: { email?: string; password?: string; serialKey?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Invalid request format' },
      { status: 400 }
    )
  }

  try {
    const { email, password, serialKey } = body

    // Validate required fields
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    if (!password || typeof password !== 'string') {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      )
    }

    // If a serial key is provided, validate and potentially activate it
    let activatedSerialKey: { id: string; status: string; tenantId: string | null } | null = null
    if (serialKey && typeof serialKey === 'string') {
      const foundKey = await db.serialKey.findUnique({
        where: { key: serialKey.trim() },
      })

      if (!foundKey) {
        return NextResponse.json(
          { error: 'Invalid serial key' },
          { status: 401 }
        )
      }

      if (foundKey.status === 'expired') {
        return NextResponse.json(
          { error: 'Serial key has expired' },
          { status: 410 }
        )
      }

      if (foundKey.status === 'revoked') {
        return NextResponse.json(
          { error: 'Serial key has been revoked' },
          { status: 403 }
        )
      }

      // Activate inactive key — associate it with the user's tenant on login
      if (foundKey.status === 'inactive') {
        activatedSerialKey = { id: foundKey.id, status: foundKey.status, tenantId: foundKey.tenantId }
      }

      // If already active, just note it
      if (foundKey.status === 'active') {
        activatedSerialKey = { id: foundKey.id, status: foundKey.status, tenantId: foundKey.tenantId }
      }
    }

    // Find user by email
    const user = await db.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
            subscription: true,
            isActive: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Check if user is active
    if (!user.isActive) {
      return NextResponse.json(
        { error: 'Account is deactivated. Please contact your administrator.' },
        { status: 403 }
      )
    }

    // Check password (demo users might not have a passwordHash)
    if (user.passwordHash) {
      const passwordValid = await verifyPassword(password, user.passwordHash)
      if (!passwordValid) {
        return NextResponse.json(
          { error: 'Invalid email or password' },
          { status: 401 }
        )
      }
    } else {
      // User has no password set — cannot log in with password
      return NextResponse.json(
        { error: 'Account is not configured for password login' },
        { status: 401 }
      )
    }

    // Activate serial key if it was inactive and we now have the user's tenantId
    if (
      activatedSerialKey &&
      activatedSerialKey.status === 'inactive' &&
      !activatedSerialKey.tenantId
    ) {
      await db.serialKey.update({
        where: { id: activatedSerialKey.id },
        data: {
          tenantId: user.tenantId,
          status: 'active',
          activatedAt: new Date(),
        },
      })
    }

    // Update last login
    await db.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    })

    // Build response — exclude sensitive fields
    const userResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      isDemo: user.isDemo,
      tenant: user.tenant
        ? {
            id: user.tenant.id,
            name: user.tenant.name,
            slug: user.tenant.slug,
            subscription: user.tenant.subscription,
            isActive: user.tenant.isActive,
          }
        : null,
      lastLogin: new Date().toISOString(),
    }

    return NextResponse.json({
      success: true,
      user: userResponse,
      accessLevel: user.isDemo ? 'view-only' : 'full',
    })
  } catch (error) {
    console.error('[login] Error:', error)
    // Check if it's a database connection error
    const message = error instanceof Error && error.message.includes('connect')
      ? 'Unable to connect to database. Please try again.'
      : 'Service temporarily unavailable. Please try again.'
    return NextResponse.json(
      { error: message },
      { status: 503 }
    )
  }
}
