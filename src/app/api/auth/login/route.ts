import { NextResponse } from 'next/server'
import { db, dbRetry } from '@/lib/db'
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
      const foundKey = await dbRetry(() =>
        db.serialKey.findUnique({
          where: { key: serialKey.trim() },
        })
      )

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

      if (foundKey.status === 'inactive') {
        activatedSerialKey = { id: foundKey.id, status: foundKey.status, tenantId: foundKey.tenantId }
      }

      if (foundKey.status === 'active') {
        activatedSerialKey = { id: foundKey.id, status: foundKey.status, tenantId: foundKey.tenantId }
      }
    }

    // Find user by email
    const user = await dbRetry(() =>
      db.user.findUnique({
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
    )

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: 'Account is deactivated. Please contact your administrator.' },
        { status: 403 }
      )
    }

    // Check password
    if (user.passwordHash) {
      const passwordValid = await verifyPassword(password, user.passwordHash)
      if (!passwordValid) {
        return NextResponse.json(
          { error: 'Invalid email or password' },
          { status: 401 }
        )
      }
    } else {
      return NextResponse.json(
        { error: 'Account is not configured for password login' },
        { status: 401 }
      )
    }

    // Activate serial key if it was inactive
    if (
      activatedSerialKey &&
      activatedSerialKey.status === 'inactive' &&
      !activatedSerialKey.tenantId
    ) {
      await dbRetry(() =>
        db.serialKey.update({
          where: { id: activatedSerialKey.id },
          data: {
            tenantId: user.tenantId,
            status: 'active',
            activatedAt: new Date(),
          },
        })
      )
    }

    // Update last login
    await dbRetry(() =>
      db.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() },
      })
    )

    // Build response
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
    const isDbError = error instanceof Error && (
      error.message.includes('connect') ||
      error.message.includes('Closed') ||
      error.message.includes('timed out') ||
      error.message.includes('P1001') ||
      error.message.includes('P1002')
    )
    const message = isDbError
      ? 'Unable to connect to database. Please try again in a moment.'
      : 'An unexpected error occurred. Please try again.'
    return NextResponse.json(
      { error: message },
      { status: isDbError ? 503 : 500 }
    )
  }
}
