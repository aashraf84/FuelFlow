import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const section = searchParams.get('section')

    switch (section) {
      case 'protocols': {
        const protocols = await db.commProtocol.findMany({
          include: { connections: true },
          orderBy: { createdAt: 'desc' },
        })
        return NextResponse.json({ protocols })
      }

      case 'connections': {
        const connections = await db.commConnection.findMany({
          include: {
            protocol: { select: { id: true, name: true, protocolType: true, transportType: true } },
          },
          orderBy: { lastConnectedAt: 'desc' },
          take: 100,
        })
        return NextResponse.json({ connections })
      }

      case 'logs': {
        const logs = await db.commLog.findMany({
          orderBy: { createdAt: 'desc' },
          take: 100,
        })
        return NextResponse.json({ logs })
      }

      default: {
        const [protocolCount, activeConnections, recentLogs] = await Promise.all([
          db.commProtocol.count({ where: { isActive: true } }),
          db.commConnection.count({ where: { connectionState: 'connected' } }),
          db.commLog.findMany({
            where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
            orderBy: { createdAt: 'desc' },
          }),
        ])

        const errorLogs = recentLogs.filter(l => !l.isSuccess)
        const errorRate = recentLogs.length > 0 ? ((errorLogs.length / recentLogs.length) * 100).toFixed(1) : '0'

        return NextResponse.json({
          overview: {
            protocolsConfigured: protocolCount,
            activeConnections,
            messagesToday: recentLogs.length,
            errorRate: `${errorRate}%`,
          },
        })
      }
    }
  } catch (error) {
    console.error('Comms API error:', error)
    return NextResponse.json({ error: 'Failed to fetch comms data' }, { status: 500 })
  }
}
