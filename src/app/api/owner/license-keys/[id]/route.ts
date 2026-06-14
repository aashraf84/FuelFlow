import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const existing = await db.licenseKey.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'License key not found' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}

    // Handle assignment
    if (body.action === 'assign') {
      if (!body.clientId) {
        return NextResponse.json(
          { error: 'clientId is required for assignment' },
          { status: 400 }
        )
      }

      // Verify client exists
      const client = await db.ownerClient.findUnique({ where: { id: body.clientId } })
      if (!client) {
        return NextResponse.json({ error: 'Client not found' }, { status: 404 })
      }

      updateData.clientId = body.clientId
      updateData.status = 'assigned'
      updateData.assignedAt = new Date()

      if (body.planId) updateData.planId = body.planId
      if (body.expiresAt) updateData.expiresAt = new Date(body.expiresAt)
      if (body.maxStations !== undefined) updateData.maxStations = parseInt(String(body.maxStations))
      if (body.maxDispensers !== undefined) updateData.maxDispensers = parseInt(String(body.maxDispensers))
      if (body.maxUsers !== undefined) updateData.maxUsers = parseInt(String(body.maxUsers))
    }

    // Handle revocation
    if (body.action === 'revoke') {
      updateData.clientId = null
      updateData.planId = null
      updateData.status = 'revoked'
      updateData.revokedAt = new Date()
    }

    // Handle general status update
    if (!body.action && body.status) {
      updateData.status = body.status

      if (body.status === 'assigned' && body.clientId) {
        updateData.clientId = body.clientId
        updateData.assignedAt = new Date()
      }
      if (body.status === 'revoked') {
        updateData.clientId = null
        updateData.revokedAt = new Date()
      }
    }

    if (body.notes !== undefined) updateData.notes = body.notes

    const licenseKey = await db.licenseKey.update({
      where: { id },
      data: updateData,
      include: {
        client: {
          select: {
            id: true,
            companyName: true,
            slug: true,
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

    return NextResponse.json({ licenseKey })
  } catch (error) {
    console.error('Owner License Key PUT error:', error)
    return NextResponse.json({ error: 'Failed to update license key' }, { status: 500 })
  }
}
