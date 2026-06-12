import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId')
    const isRead = searchParams.get('isRead')
    const type = searchParams.get('type')
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    const where: Record<string, unknown> = {}
    if (tenantId) where.tenantId = tenantId
    if (isRead !== null && isRead !== undefined) where.isRead = isRead === 'true'
    if (type) where.type = type

    const [notifications, total, unreadCount] = await Promise.all([
      db.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      db.notification.count({ where }),
      db.notification.count({ where: { ...where, isRead: false } }),
    ])

    return NextResponse.json({
      notifications,
      unreadCount,
      pagination: { total, limit, offset, hasMore: offset + limit < total },
    })
  } catch (error) {
    console.error('Notifications GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, markAll } = body

    if (markAll) {
      const tenantId = body.tenantId
      if (!tenantId) {
        return NextResponse.json({ error: 'tenantId is required for markAll' }, { status: 400 })
      }
      await db.notification.updateMany({
        where: { tenantId, isRead: false },
        data: { isRead: true, readAt: new Date() },
      })
      return NextResponse.json({ success: true, message: 'All notifications marked as read' })
    }

    if (!id) {
      return NextResponse.json({ error: 'Notification id is required' }, { status: 400 })
    }

    const notification = await db.notification.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
    })

    return NextResponse.json({ notification })
  } catch (error) {
    console.error('Notifications PUT error:', error)
    return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 })
  }
}
