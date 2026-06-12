import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const stationId = searchParams.get('stationId')
    const isResolved = searchParams.get('isResolved')
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    const alertWhere: Record<string, unknown> = {}
    if (stationId) alertWhere.stationId = stationId
    if (isResolved !== null && isResolved !== undefined) alertWhere.isResolved = isResolved === 'true'

    const vaporWhere: Record<string, unknown> = {}
    if (stationId) vaporWhere.stationId = stationId

    const [alerts, vaporReadings] = await Promise.all([
      db.environmentalAlert.findMany({
        where: alertWhere,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      db.vaporRecoveryReading.findMany({
        where: vaporWhere,
        orderBy: { readingAt: 'desc' },
        take: limit,
      }),
    ])

    // Summary
    const allAlerts = await db.environmentalAlert.findMany({
      where: stationId ? { stationId } : {},
      select: { severity: true, alertType: true, isResolved: true, isReportable: true },
    })

    const summary = {
      totalAlerts: allAlerts.length,
      unresolved: allAlerts.filter(a => !a.isResolved).length,
      reportable: allAlerts.filter(a => a.isReportable).length,
      critical: allAlerts.filter(a => a.severity === 'critical' && !a.isResolved).length,
      warning: allAlerts.filter(a => a.severity === 'warning' && !a.isResolved).length,
      byType: {
        leak: allAlerts.filter(a => a.alertType === 'leak').length,
        spill: allAlerts.filter(a => a.alertType === 'spill').length,
        vapor: allAlerts.filter(a => a.alertType === 'vapor').length,
        water_intrusion: allAlerts.filter(a => a.alertType === 'water_intrusion').length,
        overfill: allAlerts.filter(a => a.alertType === 'overfill').length,
        epa_violation: allAlerts.filter(a => a.alertType === 'epa_violation').length,
      },
    }

    return NextResponse.json({
      alerts,
      vaporReadings,
      summary,
    })
  } catch (error) {
    console.error('Environmental GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch environmental data' }, { status: 500 })
  }
}
