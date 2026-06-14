import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'userId query parameter is required' },
        { status: 400 }
      )
    }

    // Dynamic import to avoid circular dependency issues
    const { db } = await import('@/lib/db')

    const user = await db.user.findUnique({
      where: { id: userId },
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
        { error: 'User not found', authenticated: false },
        { status: 404 }
      )
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: 'Account is deactivated', authenticated: false },
        { status: 403 }
      )
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        isDemo: user.isDemo,
        lastLogin: user.lastLogin,
        tenant: user.tenant
          ? {
              id: user.tenant.id,
              name: user.tenant.name,
              slug: user.tenant.slug,
              subscription: user.tenant.subscription,
              isActive: user.tenant.isActive,
            }
          : null,
      },
      accessLevel: user.isDemo ? 'view-only' : 'full',
    })
  } catch (error) {
    console.error('[session GET] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  // Simple logout endpoint — in a real app this would clear
  // cookies / session tokens / invalidate JWTs
  return NextResponse.json({
    success: true,
    message: 'Logged out successfully',
  })
}
