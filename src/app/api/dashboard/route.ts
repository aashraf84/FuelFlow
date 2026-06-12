import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const station = await db.station.findFirst({ where: { isActive: true } })
    if (!station) return NextResponse.json({ error: 'No station' }, { status: 404 })

    const tid = station.tenantId
    const sid = station.id
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekStart = new Date(now.getTime() - 7 * 86400000)

    // Parallel core queries
    const [
      todayFuelings, weekFuelings, dispensers, tanks, currentShift,
      alerts, notifications, expenses, retailProducts, envAlerts,
      fleetAccounts, carWashSessions, lotterySales, supplierInvoices,
      allStations, dailyReports, recentFuelings, customers
    ] = await Promise.all([
      // Today's fuelings
      db.fueling.findMany({ where: { stationId: sid, status: 'completed', completedAt: { gte: todayStart } } }),
      // Week fuelings
      db.fueling.findMany({ where: { stationId: sid, status: 'completed', completedAt: { gte: weekStart } } }),
      // Dispensers
      db.dispenser.findMany({ where: { stationId: sid, isActive: true }, include: { nozzles: true } }),
      // Tanks
      db.tank.findMany({ where: { stationId: sid } }),
      // Current shift
      db.shift.findFirst({ where: { stationId: sid, status: 'open' }, include: { attendant: true, supervisor: true } }),
      // AI alerts
      db.aIAlert.findMany({ where: { tenantId: tid, isResolved: false } }),
      // Notifications
      db.notification.findMany({ where: { tenantId: tid, isRead: false }, orderBy: { createdAt: 'desc' }, take: 5 }),
      // Expenses today
      db.expense.findMany({ where: { stationId: sid, date: { gte: todayStart } } }),
      // Retail products
      db.retailProduct.findMany({ where: { stationId: sid, isActive: true }, orderBy: { stockQty: 'asc' }, take: 5 }),
      // Environmental alerts
      db.environmentalAlert.findMany({ where: { stationId: sid, isResolved: false } }),
      // Fleet accounts
      db.fleetAccount.findMany({ where: { tenantId: tid, status: 'active' }, include: { _count: { select: { vehicles: true, drivers: true, fuelCards: true } } } }),
      // Car wash
      db.carWashSession.findMany({ where: { stationId: sid, startedAt: { gte: todayStart } } }),
      // Lottery
      db.lotterySale.findMany({ where: { stationId: sid, createdAt: { gte: todayStart } } }),
      // Supplier invoices pending
      db.supplierInvoice.findMany({ where: { stationId: sid, status: 'pending' } }),
      // All stations
      db.station.findMany({ where: { isActive: true }, select: { id: true, name: true, code: true, city: true, stationType: true } }),
      // Daily reports
      db.dailyReport.findMany({ where: { stationId: sid }, orderBy: { reportDate: 'desc' }, take: 7 }),
      // Recent fuelings
      db.fueling.findMany({ where: { stationId: sid, status: 'completed' }, include: { dispenser: true, attendant: true }, orderBy: { completedAt: 'desc' }, take: 10 }),
      // Customers count
      db.customer.count({ where: { tenantId: tid, isActive: true } }),
    ])

    // Compute KPIs
    const revenueToday = todayFuelings.reduce((s, f) => s + f.totalAmount, 0)
    const revenueWeek = weekFuelings.reduce((s, f) => s + f.totalAmount, 0)
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0)
    const fuelSoldToday = todayFuelings.reduce((s, f) => s + f.volume, 0)
    const activeDispensers = dispensers.filter(d => d.status !== 'maintenance' && d.status !== 'error').length
    const criticalAlerts = alerts.filter(a => a.severity === 'critical').length
    const warningAlerts = alerts.filter(a => a.severity === 'warning').length

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

    // Car wash & lottery summary
    const carWash = { sessionsToday: carWashSessions.length, revenue: carWashSessions.reduce((s, c) => s + c.amount, 0) }
    const lottery = { salesToday: lotterySales.length, revenue: lotterySales.reduce((s, l) => s + l.saleAmount, 0), commission: lotterySales.reduce((s, l) => s + l.commission, 0) }

    // Employees on duty (from attendance)
    const employeesOnDuty = await db.employee.count({ where: { stationId: sid, status: 'active' } })

    return NextResponse.json({
      kpis: {
        revenue: { today: Math.round(revenueToday), week: Math.round(revenueWeek), month: Math.round(revenueWeek), currency: 'PKR' },
        fuelSold: { value: Math.round(fuelSoldToday), unit: 'litres' },
        activePumps: { value: activeDispensers, total: dispensers.length },
        alerts: { value: alerts.length, critical: criticalAlerts, warning: warningAlerts },
        netProfit: { value: Math.round(revenueToday - totalExpenses), currency: 'PKR' },
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
      environmentalAlertsCount: envAlerts.length,
      carWash,
      lottery,
      supplierInvoicesPending: supplierInvoices.length,
      fleetSummary,
      dailyReport: dailyReports[0] || null,
      topSellingProducts: retailProducts.map(p => ({ id: p.id, name: p.name, category: p.category, price: p.price, stockQty: p.stockQty, minStock: p.minStock })),
      employeeOnDuty: employeesOnDuty,
      totalCustomers: customers,
    })
  } catch (error) {
    console.error('Dashboard error:', error)
    return NextResponse.json({ error: 'Dashboard load failed' }, { status: 500 })
  }
}
