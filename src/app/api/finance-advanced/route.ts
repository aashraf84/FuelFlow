import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'overview'
    const tenantId = searchParams.get('tenantId')
    const stationId = searchParams.get('stationId')

    switch (type) {
      case 'gl_accounts': {
        const where = tenantId ? { tenantId } : {}
        const glAccounts = await db.gLAccount.findMany({
          where,
          orderBy: [{ accountCode: 'asc' }],
        })
        return NextResponse.json({ glAccounts })
      }

      case 'journal_entries': {
        const entryWhere: Record<string, unknown> = {}
        if (tenantId) entryWhere.tenantId = tenantId
        if (stationId) entryWhere.stationId = stationId

        const journalEntries = await db.journalEntry.findMany({
          where: entryWhere,
          include: { lines: true },
          orderBy: { entryDate: 'desc' },
        })
        return NextResponse.json({ journalEntries })
      }

      case 'receivables': {
        const where = tenantId ? { tenantId } : {}
        const receivables = await db.accountReceivable.findMany({
          where,
          orderBy: { dueDate: 'asc' },
        })
        return NextResponse.json({ receivables })
      }

      case 'payables': {
        const where = tenantId ? { tenantId } : {}
        const payables = await db.accountPayable.findMany({
          where,
          orderBy: { dueDate: 'asc' },
        })
        return NextResponse.json({ payables })
      }

      case 'tax_configs': {
        const where = tenantId ? { tenantId } : {}
        const taxConfigs = await db.taxConfig.findMany({
          where,
          orderBy: { effectiveFrom: 'desc' },
        })
        return NextResponse.json({ taxConfigs })
      }

      case 'cash_drawers': {
        const where = stationId ? { stationId } : {}
        const cashDrawers = await db.cashDrawer.findMany({
          where,
          orderBy: { createdAt: 'desc' },
        })
        return NextResponse.json({ cashDrawers })
      }

      case 'safe_drops': {
        const where = stationId ? { stationId } : {}
        const safeDrops = await db.safeDrop.findMany({
          where,
          orderBy: { createdAt: 'desc' },
        })
        return NextResponse.json({ safeDrops })
      }

      case 'overview': {
        const glWhere = tenantId ? { tenantId } : {}
        const arWhere = tenantId ? { tenantId } : {}
        const apWhere = tenantId ? { tenantId } : {}
        const taxWhere = tenantId ? { tenantId } : {}
        const drawerWhere = stationId ? { stationId } : {}
        const dropWhere = stationId ? { stationId } : {}
        const entryWhere2: Record<string, unknown> = {}
        if (tenantId) entryWhere2.tenantId = tenantId
        if (stationId) entryWhere2.stationId = stationId

        const [
          glAccountCount,
          journalEntryCount,
          postedEntryCount,
          receivableCount,
          totalReceivableResult,
          totalReceivablePaidResult,
          payableCount,
          totalPayableResult,
          totalPayablePaidResult,
          taxConfigCount,
          activeTaxConfigCount,
          cashDrawerCount,
          openDrawerCount,
          safeDropCount,
          totalSafeDropResult,
        ] = await Promise.all([
          db.gLAccount.count({ where: glWhere }),
          db.journalEntry.count({ where: entryWhere2 }),
          db.journalEntry.count({ where: { ...entryWhere2, status: 'posted' } }),
          db.accountReceivable.count({ where: arWhere }),
          db.accountReceivable.aggregate({ where: arWhere, _sum: { balance: true } }),
          db.accountReceivable.aggregate({ where: arWhere, _sum: { paidAmount: true } }),
          db.accountPayable.count({ where: apWhere }),
          db.accountPayable.aggregate({ where: apWhere, _sum: { balance: true } }),
          db.accountPayable.aggregate({ where: apWhere, _sum: { paidAmount: true } }),
          db.taxConfig.count({ where: taxWhere }),
          db.taxConfig.count({ where: { ...taxWhere, isActive: true } }),
          db.cashDrawer.count({ where: drawerWhere }),
          db.cashDrawer.count({ where: { ...drawerWhere, status: 'open' } }),
          db.safeDrop.count({ where: dropWhere }),
          db.safeDrop.aggregate({ where: dropWhere, _sum: { amount: true } }),
        ])

        return NextResponse.json({
          overview: {
            glAccounts: { total: glAccountCount },
            journalEntries: { total: journalEntryCount, posted: postedEntryCount },
            receivables: {
              total: receivableCount,
              totalBalance: totalReceivableResult._sum.balance || 0,
              totalPaid: totalReceivablePaidResult._sum.paidAmount || 0,
            },
            payables: {
              total: payableCount,
              totalBalance: totalPayableResult._sum.balance || 0,
              totalPaid: totalPayablePaidResult._sum.paidAmount || 0,
            },
            taxConfigs: { total: taxConfigCount, active: activeTaxConfigCount },
            cashDrawers: { total: cashDrawerCount, open: openDrawerCount },
            safeDrops: { total: safeDropCount, totalAmount: totalSafeDropResult._sum.amount || 0 },
          },
        })
      }

      default:
        return NextResponse.json(
          { error: `Unknown type: ${type}. Valid types: gl_accounts, journal_entries, receivables, payables, tax_configs, cash_drawers, safe_drops, overview` },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Finance Advanced GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch advanced finance data' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'post_entry': {
        const { entryId, postedBy } = body
        if (!entryId) {
          return NextResponse.json(
            { error: 'entryId is required' },
            { status: 400 }
          )
        }

        const entry = await db.journalEntry.update({
          where: { id: entryId },
          data: {
            status: 'posted',
            postedAt: new Date(),
            postedBy: postedBy || null,
          },
        })

        return NextResponse.json({ entry })
      }

      case 'record_payment': {
        const { receivableId, amount, notes } = body
        if (!receivableId || amount === undefined) {
          return NextResponse.json(
            { error: 'receivableId and amount are required' },
            { status: 400 }
          )
        }

        const receivable = await db.accountReceivable.findUnique({
          where: { id: receivableId },
        })

        if (!receivable) {
          return NextResponse.json(
            { error: 'Account receivable not found' },
            { status: 404 }
          )
        }

        const newPaidAmount = receivable.paidAmount + amount
        const newBalance = receivable.amount - newPaidAmount
        const newStatus = newBalance <= 0 ? 'paid' : newPaidAmount > 0 ? 'partial' : 'open'

        const updated = await db.accountReceivable.update({
          where: { id: receivableId },
          data: {
            paidAmount: newPaidAmount,
            balance: Math.max(0, newBalance),
            status: newStatus,
            notes: notes ? `${receivable.notes || ''}\n${notes}`.trim() : receivable.notes,
          },
        })

        return NextResponse.json({ receivable: updated })
      }

      case 'safe_drop': {
        const { stationId, shiftId, drawerId, amount, reason, performedBy, witnessedBy } = body
        if (!stationId || amount === undefined) {
          return NextResponse.json(
            { error: 'stationId and amount are required' },
            { status: 400 }
          )
        }

        const safeDrop = await db.safeDrop.create({
          data: {
            stationId,
            shiftId: shiftId || null,
            drawerId: drawerId || null,
            amount,
            reason: reason || null,
            performedBy: performedBy || null,
            witnessedBy: witnessedBy || null,
          },
        })

        // Update cash drawer safe drops if drawerId provided
        if (drawerId) {
          await db.cashDrawer.update({
            where: { id: drawerId },
            data: { safeDrops: { increment: amount } },
          })
        }

        return NextResponse.json({ safeDrop }, { status: 201 })
      }

      case 'count_drawer': {
        const { drawerId, closingBalance, variance } = body
        if (!drawerId || closingBalance === undefined) {
          return NextResponse.json(
            { error: 'drawerId and closingBalance are required' },
            { status: 400 }
          )
        }

        const drawer = await db.cashDrawer.update({
          where: { id: drawerId },
          data: {
            closingBalance,
            variance: variance !== undefined ? variance : null,
            status: 'counted',
            lastCountedAt: new Date(),
          },
        })

        return NextResponse.json({ drawer })
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}. Valid actions: post_entry, record_payment, safe_drop, count_drawer` },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Finance Advanced POST error:', error)
    return NextResponse.json(
      { error: 'Failed to process advanced finance action' },
      { status: 500 }
    )
  }
}
