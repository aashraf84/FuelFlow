import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const section = searchParams.get('section')

    switch (section) {
      case 'sessions': {
        const sessions = await db.securitySession.findMany({
          where: { status: 'active' },
          include: { user: { select: { id: true, name: true, email: true, role: true } } },
          orderBy: { loginAt: 'desc' },
          take: 50,
        })
        return NextResponse.json({ sessions })
      }

      case 'rbac': {
        const permissions = await db.rBACPermission.findMany({
          orderBy: [{ role: 'asc' }, { module: 'asc' }, { action: 'asc' }],
        })
        return NextResponse.json({ permissions })
      }

      case 'alerts': {
        const alerts = await db.securityAlert.findMany({
          orderBy: { createdAt: 'desc' },
          take: 50,
        })
        return NextResponse.json({ alerts })
      }

      case 'backups': {
        const backups = await db.backupRecord.findMany({
          orderBy: { createdAt: 'desc' },
          take: 30,
        })
        return NextResponse.json({ backups })
      }

      case 'encryption': {
        const keys = await db.encryptionKey.findMany({
          orderBy: { createdAt: 'desc' },
        })
        return NextResponse.json({ keys })
      }

      default: {
        const [activeSessions, unresolvedAlerts, lastBackup, activeKeys] = await Promise.all([
          db.securitySession.count({ where: { status: 'active' } }),
          db.securityAlert.count({ where: { isResolved: false } }),
          db.backupRecord.findFirst({ where: { status: 'completed' }, orderBy: { completedAt: 'desc' } }),
          db.encryptionKey.count({ where: { isActive: true } }),
        ])

        return NextResponse.json({
          overview: {
            activeSessions,
            unresolvedAlerts,
            lastBackup: lastBackup ? {
              id: lastBackup.id,
              backupType: lastBackup.backupType,
              status: lastBackup.status,
              completedAt: lastBackup.completedAt,
              fileSize: lastBackup.fileSize,
            } : null,
            activeEncryptionKeys: activeKeys,
          },
        })
      }
    }
  } catch (error) {
    console.error('Security API error:', error)
    return NextResponse.json({ error: 'Failed to fetch security data' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'revoke_session': {
        const { sessionId } = body
        if (!sessionId) return NextResponse.json({ error: 'sessionId required' }, { status: 400 })
        const session = await db.securitySession.update({
          where: { id: sessionId },
          data: { status: 'revoked', logoutAt: new Date() },
        })
        return NextResponse.json({ session })
      }

      case 'resolve_alert': {
        const { alertId, resolvedBy } = body
        if (!alertId) return NextResponse.json({ error: 'alertId required' }, { status: 400 })
        const alert = await db.securityAlert.update({
          where: { id: alertId },
          data: { isResolved: true, resolvedAt: new Date(), resolvedBy: resolvedBy || 'system' },
        })
        return NextResponse.json({ alert })
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error) {
    console.error('Security POST error:', error)
    return NextResponse.json({ error: 'Failed to process security action' }, { status: 500 })
  }
}
