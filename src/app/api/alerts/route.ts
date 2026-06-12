import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const stationId = searchParams.get('stationId')
    const severity = searchParams.get('severity')
    const alertType = searchParams.get('alertType')
    const isRead = searchParams.get('isRead')
    const isResolved = searchParams.get('isResolved')

    const where: Record<string, unknown> = {}
    if (stationId) where.stationId = stationId
    if (severity) where.severity = severity
    if (alertType) where.alertType = alertType
    if (isRead !== null && isRead !== undefined) where.isRead = isRead === 'true'
    if (isResolved !== null && isResolved !== undefined) where.isResolved = isResolved === 'true'

    const alerts = await db.aIAlert.findMany({
      where,
      include: {
        station: {
          select: { id: true, name: true, code: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ alerts })
  } catch (error) {
    console.error('Alerts GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch alerts' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, isRead, isResolved } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Alert id is required' },
        { status: 400 }
      )
    }

    const existingAlert = await db.aIAlert.findUnique({ where: { id } })
    if (!existingAlert) {
      return NextResponse.json(
        { error: 'Alert not found' },
        { status: 404 }
      )
    }

    const updateData: Record<string, unknown> = {}
    if (isRead !== undefined) updateData.isRead = Boolean(isRead)
    if (isResolved !== undefined) {
      updateData.isResolved = Boolean(isResolved)
      if (isResolved) updateData.resolvedAt = new Date()
    }

    const alert = await db.aIAlert.update({
      where: { id },
      data: updateData,
      include: {
        station: { select: { id: true, name: true, code: true } },
      },
    })

    return NextResponse.json({ alert })
  } catch (error) {
    console.error('Alerts PUT error:', error)
    return NextResponse.json(
      { error: 'Failed to update alert' },
      { status: 500 }
    )
  }
}
