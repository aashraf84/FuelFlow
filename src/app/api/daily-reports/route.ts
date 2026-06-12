import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const stationId = searchParams.get('stationId')
    const days = parseInt(searchParams.get('days') || '30', 10)

    const where: Record<string, unknown> = {}
    if (stationId) where.stationId = stationId

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    startDate.setHours(0, 0, 0, 0)

    where.reportDate = { gte: startDate }

    const reports = await db.dailyReport.findMany({
      where,
      include: {
        station: { select: { id: true, name: true, code: true, city: true } },
      },
      orderBy: { reportDate: 'desc' },
    })

    // Summary over the period
    const summary = {
      totalRevenue: reports.reduce((sum, r) => sum + r.totalRevenue, 0),
      totalFuelRevenue: reports.reduce((sum, r) => sum + r.fuelRevenue, 0),
      totalRetailRevenue: reports.reduce((sum, r) => sum + r.retailRevenue, 0),
      totalVolume: reports.reduce((sum, r) => sum + r.totalVolume, 0),
      totalTransactions: reports.reduce((sum, r) => sum + r.transactionCount, 0),
      totalExpenses: reports.reduce((sum, r) => sum + r.expenses, 0),
      totalNetProfit: reports.reduce((sum, r) => sum + r.netProfit, 0),
      avgDailyRevenue: reports.length > 0 ? reports.reduce((sum, r) => sum + r.totalRevenue, 0) / reports.length : 0,
      avgDailyVolume: reports.length > 0 ? reports.reduce((sum, r) => sum + r.totalVolume, 0) / reports.length : 0,
    }

    return NextResponse.json({ reports, summary, days })
  } catch (error) {
    console.error('Daily reports GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch daily reports' }, { status: 500 })
  }
}
