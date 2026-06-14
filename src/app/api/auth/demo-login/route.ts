import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/auth'

const DEMO_USER_EMAIL = 'demo@fuelflow.app'
const DEMO_TENANT_SLUG = 'demo-station'
const DEMO_TENANT_NAME = 'Demo Fuel Station'

export async function POST() {
  try {
    // Ensure a demo tenant exists
    let tenant = await db.tenant.findUnique({
      where: { slug: DEMO_TENANT_SLUG },
    })

    if (!tenant) {
      tenant = await db.tenant.create({
        data: {
          name: DEMO_TENANT_NAME,
          slug: DEMO_TENANT_SLUG,
          subscription: 'professional',
          isActive: true,
        },
      })
    }

    // Find or create the demo user
    let user = await db.user.findUnique({
      where: { email: DEMO_USER_EMAIL },
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
      const passwordHash = await hashPassword('demo1234')

      user = await db.user.create({
        data: {
          email: DEMO_USER_EMAIL,
          name: 'Demo User',
          passwordHash,
          role: 'viewer',
          isDemo: true,
          isActive: true,
          tenantId: tenant.id,
        },
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
    }

    // Make sure user is marked as demo (in case it was manually changed)
    if (!user.isDemo) {
      await db.user.update({
        where: { id: user.id },
        data: { isDemo: true },
      })
    }

    // Update last login
    await db.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    })

    const userResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      isDemo: true,
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
      accessLevel: 'view-only',
      message: 'Logged in as demo user with view-only access',
    })
  } catch (error) {
    console.error('[demo-login] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
