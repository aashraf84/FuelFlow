import { NextResponse } from 'next/server'
import { db, dbRetry } from '@/lib/db'

export async function GET() {
  try {
    const station = await dbRetry(() => db.station.findFirst({ where: { isActive: true } }))
    if (!station) return NextResponse.json({ error: 'No station' }, { status: 404 })

    const tid = station.tenantId
    const sid = station.id
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekStart = new Date(now.getTime() - 7 * 86400000)

    // Use sequential queries to avoid overwhelming Neon serverless connections
    // This is more memory-efficient than Promise.all with many parallel queries
    const todayFuelings = await dbRetry(() =>
      db.fueling.findMany({
        where: { stationId: sid, status: 'completed', completedAt: { gte: todayStart } },
        select: { id: true, fuelType: true, volume: true, totalAmount: true, paymentMethod: true, completedAt: true, startedAt: true },
      })
    )

    const weekFuelings = await dbRetry(() =>
      db.fueling.findMany({
        where: { stationId: sid, status: 'completed', completedAt: { gte: weekStart } },
        select: { totalAmount: true },
      })
    )

    const dispensers = await dbRetry(() =>
      db.dispenser.findMany({ where: { stationId: sid, isActive: true }, select: { status: true, nozzles: { select: { id: true } } } })
    )

    const tanks = await dbRetry(() => db.tank.findMany({ where: { stationId: sid } }))

    const currentShift = await dbRetry(() =>
      db.shift.findFirst({ where: { stationId: sid, status: 'open' }, include: { attendant: true, supervisor: true } })
    )

    // Lightweight counts instead of full records for alerts
    const [criticalAlerts, warningAlerts, totalAlerts] = await Promise.all([
      dbRetry(() => db.aIAlert.count({ where: { tenantId: tid, isResolved: false, severity: 'critical' } })),
      dbRetry(() => db.aIAlert.count({ where: { tenantId: tid, isResolved: false, severity: 'warning' } })),
      dbRetry(() => db.aIAlert.count({ where: { tenantId: tid, isResolved: false } })),
    ])

    const notifications = await dbRetry(() =>
      db.notification.findMany({
        where: { tenantId: tid, isRead: false },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, title: true, message: true, type: true, priority: true, isRead: true, createdAt: true },
      })
    )

    const totalExpenses = await dbRetry(() =>
      db.expense.aggregate({ where: { stationId: sid, date: { gte: todayStart } }, _sum: { amount: true } })
    )

    const envAlertsCount = await dbRetry(() => db.environmentalAlert.count({ where: { stationId: sid, isResolved: false } }))

    const retailProducts = await dbRetry(() =>
      db.retailProduct.findMany({
        where: { stationId: sid, isActive: true },
        orderBy: { stockQty: 'asc' },
        take: 5,
        select: { id: true, name: true, category: true, price: true, stockQty: true, minStock: true },
      })
    )

    const fleetAccounts = await dbRetry(() =>
      db.fleetAccount.findMany({
        where: { tenantId: tid, status: 'active' },
        select: { id: true, companyName: true, currentBalance: true, creditLimit: true, _count: { select: { vehicles: true, drivers: true, fuelCards: true } } },
      })
    )

    const [carWashCount, carWashRevenue] = await Promise.all([
      dbRetry(() => db.carWashSession.count({ where: { stationId: sid, startedAt: { gte: todayStart } } })),
      dbRetry(() => db.carWashSession.aggregate({ where: { stationId: sid, startedAt: { gte: todayStart } }, _sum: { amount: true } })),
    ])

    const [lotteryCount, lotteryRevenue, lotteryCommission] = await Promise.all([
      dbRetry(() => db.lotterySale.count({ where: { stationId: sid, createdAt: { gte: todayStart } } })),
      dbRetry(() => db.lotterySale.aggregate({ where: { stationId: sid, createdAt: { gte: todayStart } }, _sum: { saleAmount: true } })),
      dbRetry(() => db.lotterySale.aggregate({ where: { stationId: sid, createdAt: { gte: todayStart } }, _sum: { commission: true } })),
    ])

    const supplierInvoicesPending = await dbRetry(() => db.supplierInvoice.count({ where: { stationId: sid, status: 'pending' } }))

    const allStations = await dbRetry(() =>
      db.station.findMany({ where: { isActive: true }, select: { id: true, name: true, code: true, city: true, stationType: true } })
    )

    const dailyReports = await dbRetry(() =>
      db.dailyReport.findMany({ where: { stationId: sid }, orderBy: { reportDate: 'desc' }, take: 7 })
    )

    const recentFuelings = await dbRetry(() =>
      db.fueling.findMany({
        where: { stationId: sid, status: 'completed' },
        include: { dispenser: { select: { name: true } }, attendant: { select: { name: true } } },
        orderBy: { completedAt: 'desc' },
        take: 10,
      })
    )

    const [employeesOnDuty, customers] = await Promise.all([
      dbRetry(() => db.employee.count({ where: { stationId: sid, status: 'active' } })),
      dbRetry(() => db.customer.count({ where: { tenantId: tid, isActive: true } })),
    ])

    // Compute KPIs
    const revenueToday = todayFuelings.reduce((s, f) => s + f.totalAmount, 0)
    const revenueWeek = weekFuelings.reduce((s, f) => s + f.totalAmount, 0)
    const expenseTotal = totalExpenses._sum.amount || 0
    const fuelSoldToday = todayFuelings.reduce((s, f) => s + f.volume, 0)
    const activeDispensers = dispensers.filter(d => d.status !== 'maintenance' && d.status !== 'error').length

    // Hourly revenue chart
    const revenueChart = []
    for (let h = 6; h <= Math.min(now.getHours(), 23); h++) {
      const hourFuelings = todayFuelings.filter(f => {
        const t = f.completedAt || f.startedAt
        return t && new Date(t).getHours() === h
      })
      revenueChart.push({ hour: `${String(h).padStart(2, '0')}:00`, value: Math.round(hourFuelings.reduce((s, f) => s + f.totalAmount, 0)) })
    }

    // Fuel breakdown
    const fuelMap: Record<string, { volume: number; revenue: number }> = {}
    for (const f of todayFuelings) {
      if (!fuelMap[f.fuelType]) fuelMap[f.fuelType] = { volume: 0, revenue: 0 }
      fuelMap[f.fuelType].volume += f.volume
      fuelMap[f.fuelType].revenue += f.totalAmount
    }

    // Tank levels
    const tankLevels = tanks.map(t => ({
      id: t.id, product: t.fuelType.charAt(0).toUpperCase() + t.fuelType.slice(1),
      level: Math.round((t.currentLevel / t.capacity) * 100), capacity: t.capacity,
      currentLitres: Math.round(t.currentLevel), status: t.currentLevel / t.capacity < 0.2 ? 'critical' : t.currentLevel / t.capacity < 0.3 ? 'warning' : 'normal',
      temperature: Math.round(t.temperature * 10) / 10, waterLevel: Math.round(t.waterLevel),
    }))

    // Recent transactions
    const recentTransactions = recentFuelings.map(f => ({
      id: f.id,
      time: f.completedAt ? new Date(f.completedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : '--:--',
      pump: f.dispenser?.name?.replace('Pump ', '') || '?',
      product: f.fuelType.charAt(0).toUpperCase() + f.fuelType.slice(1),
      litres: Math.round(f.volume * 10) / 10,
      amount: Math.round(f.totalAmount * 100) / 100,
      payment: f.paymentMethod.charAt(0).toUpperCase() + f.paymentMethod.slice(1),
      attendant: f.attendant?.name || 'N/A',
    }))

    // Fleet summary
    const fleetSummary = {
      totalAccounts: fleetAccounts.length,
      totalOutstanding: fleetAccounts.reduce((s, a) => s + a.currentBalance, 0),
      totalVehicles: fleetAccounts.reduce((s, a) => s + (a._count?.vehicles || 0), 0),
      totalDrivers: fleetAccounts.reduce((s, a) => s + (a._count?.drivers || 0), 0),
      totalFuelCards: fleetAccounts.reduce((s, a) => s + (a._count?.fuelCards || 0), 0),
      accounts: fleetAccounts.map(a => ({ id: a.id, companyName: a.companyName, balance: a.currentBalance, creditLimit: a.creditLimit, vehicles: a._count?.vehicles || 0, drivers: a._count?.drivers || 0, fuelCards: a._count?.fuelCards || 0 })),
    }

    return NextResponse.json({
      kpis: {
        revenue: { today: Math.round(revenueToday), week: Math.round(revenueWeek), month: Math.round(revenueWeek), currency: 'PKR' },
        fuelSold: { value: Math.round(fuelSoldToday), unit: 'litres' },
        activePumps: { value: activeDispensers, total: dispensers.length },
        alerts: { value: totalAlerts, critical: criticalAlerts, warning: warningAlerts },
        netProfit: { value: Math.round(revenueToday - expenseTotal), currency: 'PKR' },
      },
      tankLevels,
      recentTransactions,
      revenueChart,
      fuelBreakdown: Object.entries(fuelMap).map(([type, data]) => ({ type: type.charAt(0).toUpperCase() + type.slice(1), volume: Math.round(data.volume), revenue: Math.round(data.revenue) })),
      stationInfo: {
        name: station.name, code: station.code, status: 'operational',
        shift: currentShift ? `Shift #${currentShift.shiftNumber}` : 'No Active Shift',
        attendant: currentShift?.attendant?.name || 'N/A',
        supervisor: currentShift?.supervisor?.name || 'N/A',
      },
      shiftInfo: currentShift ? {
        id: currentShift.id, name: `Shift #${currentShift.shiftNumber}`,
        attendant: currentShift.attendant?.name || 'N/A',
        supervisor: currentShift.supervisor?.name || 'N/A',
        openedAt: currentShift.openedAt,
        sales: currentShift.totalSales, fuelSales: currentShift.fuelSales, retailSales: currentShift.retailSales,
        cardSales: currentShift.cardSales, fleetSales: currentShift.fleetSales, cashSales: currentShift.cashSales,
        transactionCount: currentShift.transactionCount,
      } : null,
      allStations,
      notifications: notifications.map(n => ({ id: n.id, title: n.title, message: n.message, type: n.type, priority: n.priority, isRead: n.isRead, createdAt: n.createdAt })),
      environmentalAlertsCount: envAlertsCount,
      carWash: { sessionsToday: carWashCount, revenue: carWashRevenue._sum.amount || 0 },
      lottery: { salesToday: lotteryCount, revenue: lotteryRevenue._sum.saleAmount || 0, commission: lotteryCommission._sum.commission || 0 },
      supplierInvoicesPending,
      fleetSummary,
      dailyReport: dailyReports[0] || null,
      topSellingProducts: retailProducts.map(p => ({ id: p.id, name: p.name, category: p.category, price: p.price, stockQty: p.stockQty, minStock: p.minStock })),
      employeeOnDuty: employeesOnDuty,
      totalCustomers: customers,
    })
  } catch (error) {
    console.error('Dashboard error:', error)
    const isDbError = error instanceof Error && (
      error.message.includes('connect') ||
      error.message.includes('Connection') ||
      error.message.includes('Closed') ||
      error.message.includes('timed out') ||
      error.message.includes('P1001') ||
      error.message.includes('P1002') ||
      error.message.includes('P1006') ||
      error.message.includes('P1008')
    )
    return NextResponse.json(
      { error: isDbError ? 'Database connection issue. Please refresh.' : 'Dashboard load failed' },
      { status: isDbError ? 503 : 500 }
    )
  }
}
