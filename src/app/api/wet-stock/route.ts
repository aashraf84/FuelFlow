import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'overview'
    const stationId = searchParams.get('stationId')

    switch (type) {
      case 'transfers': {
        const where = stationId ? { stationId } : {}
        const transfers = await db.fuelTransfer.findMany({
          where,
          orderBy: { createdAt: 'desc' },
        })
        return NextResponse.json({ transfers })
      }

      case 'theft_alerts': {
        const where = stationId ? { stationId } : {}
        const theftAlerts = await db.theftAlert.findMany({
          where,
          orderBy: { createdAt: 'desc' },
        })
        return NextResponse.json({ theftAlerts })
      }

      case 'shrinkage': {
        const where = stationId ? { stationId } : {}
        const shrinkage = await db.shrinkageRecord.findMany({
          where,
          orderBy: { periodStart: 'desc' },
        })
        return NextResponse.json({ shrinkage })
      }

      case 'overview': {
        const transferWhere = stationId ? { stationId } : {}
        const theftWhere = stationId ? { stationId } : {}
        const shrinkageWhere = stationId ? { stationId } : {}

        const [
          transferCount,
          pendingTransfers,
          theftAlertCount,
          openTheftAlerts,
          shrinkageCount,
          totalShrinkageResult,
        ] = await Promise.all([
          db.fuelTransfer.count({ where: transferWhere }),
          db.fuelTransfer.count({ where: { ...transferWhere, status: 'pending' } }),
          db.theftAlert.count({ where: theftWhere }),
          db.theftAlert.count({ where: { ...theftWhere, isInvestigated: false } }),
          db.shrinkageRecord.count({ where: shrinkageWhere }),
          db.shrinkageRecord.aggregate({
            where: shrinkageWhere,
            _sum: { shrinkage: true },
          }),
        ])

        return NextResponse.json({
          overview: {
            transfers: { total: transferCount, pending: pendingTransfers },
            theftAlerts: { total: theftAlertCount, open: openTheftAlerts },
            shrinkage: {
              total: shrinkageCount,
              totalShrinkageVolume: totalShrinkageResult._sum.shrinkage || 0,
            },
          },
        })
      }

      default:
        return NextResponse.json(
          { error: `Unknown type: ${type}. Valid types: transfers, theft_alerts, shrinkage, overview` },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Wet Stock GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch wet stock data' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'create_transfer': {
        const {
          stationId, fromTankId, toTankId, fuelType, volume,
          reason, approvedBy, notes,
        } = body

        if (!stationId || !fuelType || !volume || !reason) {
          return NextResponse.json(
            { error: 'stationId, fuelType, volume, and reason are required' },
            { status: 400 }
          )
        }

        const transfer = await db.fuelTransfer.create({
          data: {
            stationId,
            fromTankId: fromTankId || null,
            toTankId: toTankId || null,
            fuelType,
            volume,
            reason,
            approvedBy: approvedBy || null,
            notes: notes || null,
          },
        })

        return NextResponse.json({ transfer }, { status: 201 })
      }

      case 'investigate_theft': {
        const { alertId, investigatedBy, investigationNotes, isConfirmed } = body
        if (!alertId || !investigatedBy) {
          return NextResponse.json(
            { error: 'alertId and investigatedBy are required' },
            { status: 400 }
          )
        }

        const alert = await db.theftAlert.update({
          where: { id: alertId },
          data: {
            isInvestigated: true,
            investigatedBy,
            investigationNotes: investigationNotes || null,
            isConfirmed: isConfirmed !== undefined ? isConfirmed : null,
          },
        })

        return NextResponse.json({ alert })
      }

      case 'review_shrinkage': {
        const { recordId, reviewedBy, notes } = body
        if (!recordId || !reviewedBy) {
          return NextResponse.json(
            { error: 'recordId and reviewedBy are required' },
            { status: 400 }
          )
        }

        const record = await db.shrinkageRecord.update({
          where: { id: recordId },
          data: {
            isReviewed: true,
            reviewedBy,
            notes: notes || null,
          },
        })

        return NextResponse.json({ record })
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}. Valid actions: create_transfer, investigate_theft, review_shrinkage` },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Wet Stock POST error:', error)
    return NextResponse.json(
      { error: 'Failed to process wet stock action' },
      { status: 500 }
    )
  }
}
