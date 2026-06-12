import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // Get first station as the main station
    const station = await db.station.findFirst({ where: { isActive: true } })
    if (!station) {
      return NextResponse.json({ error: 'No station found' }, { status: 404 })
    }

    // Get current shift
    const currentShift = await db.shift.findFirst({
      where: { stationId: station.id, status: 'open' },
      include: { attendant: true },
    })

    // Today's date range
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - 7)
    weekStart.setHours(0, 0, 0, 0)

    // Revenue today
    const todayFuelings = await db.fueling.findMany({
      where: {
        stationId: station.id,
        status: 'completed',
        completedAt: { gte: todayStart },
      },
    })

    const revenueToday = todayFuelings.reduce((sum, f) => sum + f.totalAmount, 0)
    const volumeToday = todayFuelings.reduce((sum, f) => sum + f.volume, 0)

    // Revenue this week (for comparison)
    const weekFuelings = await db.fueling.findMany({
      where: {
        stationId: station.id,
        status: 'completed',
        completedAt: { gte: weekStart },
      },
    })
    const revenueWeek = weekFuelings.reduce((sum, f) => sum + f.totalAmount, 0)

    // Active dispensers
    const dispensers = await db.dispenser.findMany({
      where: { stationId: station.id, isActive: true },
      include: { nozzles: true },
    })

    const activeDispensers = dispensers.filter(d => d.status !== 'maintenance' && d.status !== 'error').length

    // Tank levels
    const tanks = await db.tank.findMany({
      where: { stationId: station.id },
    })

    const tankLevels = tanks.map(t => ({
      id: t.id,
      product: t.fuelType.charAt(0).toUpperCase() + t.fuelType.slice(1),
      level: Math.round((t.currentLevel / t.capacity) * 100),
      capacity: t.capacity,
      currentLitres: Math.round(t.currentLevel),
      status: t.status === 'low' ? 'warning' : t.status === 'critical' || (t.currentLevel / t.capacity) < 0.2 ? 'critical' : 'normal',
    }))

    // Recent transactions
    const recentFuelings = await db.fueling.findMany({
      where: { stationId: station.id, status: 'completed' },
      include: { dispenser: true, nozzle: true, attendant: true },
      orderBy: { completedAt: 'desc' },
      take: 8,
    })

    const recentTransactions = recentFuelings.map(f => ({
      id: f.id,
      time: f.completedAt ? new Date(f.completedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : '--:--',
      pump: f.dispenser?.name?.replace('Pump ', '') || '?',
      product: f.fuelType.charAt(0).toUpperCase() + f.fuelType.slice(1),
      litres: Math.round(f.volume * 10) / 10,
      amount: Math.round(f.totalAmount * 100) / 100,
      payment: f.paymentMethod.charAt(0).toUpperCase() + f.paymentMethod.slice(1),
    }))

    // Revenue chart (hourly today)
    const revenueChart = []
    const now = new Date()
    const startHour = 6 // Station opens at 6 AM
    const currentHour = now.getHours()
    for (let h = startHour; h <= Math.min(currentHour, 23); h++) {
      const hourStart = new Date(now)
      hourStart.setHours(h, 0, 0, 0)
      const hourEnd = new Date(now)
      hourEnd.setHours(h + 1, 0, 0, 0)
      
      const hourFuelings = todayFuelings.filter(f => {
        const t = f.completedAt || f.startedAt
        return t && t >= hourStart && t < hourEnd
      })
      
      revenueChart.push({
        hour: `${h.toString().padStart(2, '0')}:00`,
        value: Math.round(hourFuelings.reduce((sum, f) => sum + f.totalAmount, 0)),
      })
    }

    // AI alerts
    const alerts = await db.aIAlert.findMany({
      where: { tenantId: station.tenantId, isResolved: false },
    })

    const criticalAlerts = alerts.filter(a => a.severity === 'critical').length
    const warningAlerts = alerts.filter(a => a.severity === 'warning').length

    // Shift info
    const shiftInfo = currentShift ? {
      name: `Shift #${currentShift.shiftNumber}`,
      attendant: currentShift.attendant?.name || 'Unassigned',
      openedAt: currentShift.openedAt,
      sales: currentShift.totalSales,
    } : null

    // Fuel sales breakdown
    const fuelBreakdown: Record<string, { volume: number; revenue: number }> = {}
    for (const f of todayFuelings) {
      if (!fuelBreakdown[f.fuelType]) {
        fuelBreakdown[f.fuelType] = { volume: 0, revenue: 0 }
      }
      fuelBreakdown[f.fuelType].volume += f.volume
      fuelBreakdown[f.fuelType].revenue += f.totalAmount
    }

    return NextResponse.json({
      kpis: {
        revenue: {
          value: Math.round(revenueToday),
          change: 12.3,
          period: 'today',
          currency: 'PKR',
        },
        fuelSold: {
          value: Math.round(volumeToday),
          unit: 'litres',
          change: 8.7,
          period: 'today',
        },
        activePumps: {
          value: activeDispensers,
          total: dispensers.length,
          change: 0,
          period: 'current',
        },
        alerts: {
          value: alerts.length,
          critical: criticalAlerts,
          warning: warningAlerts,
          change: 0,
          period: 'active',
        },
      },
      tankLevels,
      recentTransactions,
      revenueChart,
      stationInfo: {
        name: station.name,
        status: 'operational',
        shift: shiftInfo?.name || 'No Active Shift',
        attendant: shiftInfo?.attendant || 'N/A',
      },
      fuelBreakdown: Object.entries(fuelBreakdown).map(([type, data]) => ({
        type: type.charAt(0).toUpperCase() + type.slice(1),
        volume: Math.round(data.volume),
        revenue: Math.round(data.revenue),
      })),
      shiftInfo,
      allStations: await db.station.findMany({
        where: { isActive: true },
        select: { id: true, name: true, code: true, city: true, stationType: true },
      }),
    })
  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json({ error: 'Failed to load dashboard' }, { status: 500 })
  }
}
