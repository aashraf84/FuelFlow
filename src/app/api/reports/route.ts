import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Helper to parse date params safely
function parseDate(value: string | null): Date | undefined {
  if (!value) return undefined
  const d = new Date(value)
  return isNaN(d.getTime()) ? undefined : d
}

// Build common where clause for station/date filtering
function buildWhere(stationId: string | null, dateFrom?: Date, dateTo?: Date, dateField = 'createdAt') {
  const where: Record<string, unknown> = {}
  if (stationId) where.stationId = stationId
  if (dateFrom || dateTo) {
    where[dateField] = {
      ...(dateFrom ? { gte: dateFrom } : {}),
      ...(dateTo ? { lte: dateTo } : {}),
    }
  }
  return where
}

// Standard report response structure
function reportResponse(reportType: string, columns: string[], rows: Record<string, unknown>[], summary: Record<string, unknown>, dateFrom?: Date, dateTo?: Date) {
  return NextResponse.json({
    report: {
      reportType,
      generatedAt: new Date().toISOString(),
      period: { from: (dateFrom || new Date()).toISOString(), to: (dateTo || new Date()).toISOString() },
      columns,
      rows,
      summary,
    },
  })
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'overview'
    const reportType = searchParams.get('reportType') || ''
    const stationId = searchParams.get('stationId')
    const tenantId = searchParams.get('tenantId')
    const dateFrom = parseDate(searchParams.get('dateFrom'))
    const dateTo = parseDate(searchParams.get('dateTo'))

    switch (type) {
      case 'report': {
        return await handleReport(reportType, stationId, tenantId, dateFrom, dateTo)
      }
      case 'templates': {
        const where = tenantId ? { tenantId } : {}
        const templates = await db.reportTemplate.findMany({ where, orderBy: { createdAt: 'desc' } })
        return NextResponse.json({ templates })
      }
      case 'scheduled': {
        const where = tenantId ? { tenantId } : {}
        const scheduled = await db.scheduledReport.findMany({ where, orderBy: { nextRunAt: 'asc' } })
        return NextResponse.json({ scheduled })
      }
      case 'overview': {
        const tWhere = tenantId ? { tenantId } : {}
        const [templateCount, systemCount, customCount, scheduledCount, activeCount] = await Promise.all([
          db.reportTemplate.count({ where: tWhere }),
          db.reportTemplate.count({ where: { ...tWhere, isSystem: true } }),
          db.reportTemplate.count({ where: { ...tWhere, isSystem: false } }),
          db.scheduledReport.count({ where: tenantId ? { tenantId } : {} }),
          db.scheduledReport.count({ where: { ...tWhere, isActive: true } }),
        ])
        return NextResponse.json({
          overview: {
            templates: { total: templateCount, system: systemCount, custom: customCount },
            scheduled: { total: scheduledCount, active: activeCount },
          },
        })
      }
      default:
        return NextResponse.json({ error: `Unknown type: ${type}` }, { status: 400 })
    }
  } catch (error) {
    console.error('Reports GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch report data' }, { status: 500 })
  }
}

async function handleReport(reportType: string, stationId: string | null, tenantId: string | null, dateFrom?: Date, dateTo?: Date) {
  try {
    switch (reportType) {
      case 'daily_sales': return await dailySalesReport(stationId, dateFrom, dateTo)
      case 'shift_summary': return await shiftSummaryReport(stationId, dateFrom, dateTo)
      case 'tank_reconciliation': return await tankReconciliationReport(stationId, dateFrom, dateTo)
      case 'fuel_inventory': return await fuelInventoryReport(stationId, dateFrom, dateTo)
      case 'financial_summary': return await financialSummaryReport(stationId, tenantId, dateFrom, dateTo)
      case 'price_history': return await priceHistoryReport(tenantId, dateFrom, dateTo)
      case 'fleet_summary': return await fleetSummaryReport(tenantId, dateFrom, dateTo)
      case 'employee_performance': return await employeePerformanceReport(stationId, dateFrom, dateTo)
      case 'delivery_log': return await deliveryLogReport(stationId, dateFrom, dateTo)
      case 'retail_sales': return await retailSalesReport(stationId, dateFrom, dateTo)
      case 'loyalty_summary': return await loyaltySummaryReport(tenantId, dateFrom, dateTo)
      case 'ev_cng_sessions': return await evCngSessionsReport(stationId, dateFrom, dateTo)
      case 'expense_report': return await expenseReport(stationId, dateFrom, dateTo)
      case 'attendance_report': return await attendanceReport(stationId, dateFrom, dateTo)
      case 'reconciliation_report': return await reconciliationReport(stationId, dateFrom, dateTo)
      case 'cash_reconciliation': return await cashReconciliationReport(stationId, dateFrom, dateTo)
      case 'supplier_statement': return await supplierStatementReport(stationId, tenantId, dateFrom, dateTo)
      case 'environmental_report': return await environmentalReport(stationId, dateFrom, dateTo)
      case 'security_audit': return await securityAuditReport(tenantId, dateFrom, dateTo)
      case 'station_performance': return await stationPerformanceReport(tenantId, dateFrom, dateTo)
      case 'nozzle_sales': return await nozzleSalesReport(stationId, dateFrom, dateTo)
      case 'product_sales': return await productSalesReport(stationId, dateFrom, dateTo)
      case 'payment_mode': return await paymentModeReport(stationId, dateFrom, dateTo)
      case 'hourly_sales': return await hourlySalesReport(stationId, dateFrom, dateTo)
      case 'meter_reading': return await meterReadingReport(stationId, dateFrom, dateTo)
      case 'dip_reading': return await dipReadingReport(stationId, dateFrom, dateTo)
      case 'stock_gain_loss': return await stockGainLossReport(stationId, dateFrom, dateTo)
      case 'lubricant_inventory': return await lubricantInventoryReport(stationId, dateFrom, dateTo)
      case 'profit_loss': return await profitLossReport(stationId, tenantId, dateFrom, dateTo)
      case 'credit_billing': return await creditBillingReport(tenantId, dateFrom, dateTo)
      case 'tax_report': return await taxReport(stationId, tenantId, dateFrom, dateTo)
      case 'ap_aging': return await apAgingReport(tenantId, dateFrom, dateTo)
      case 'ar_aging': return await arAgingReport(tenantId, dateFrom, dateTo)
      case 'shift_handover': return await shiftHandoverReport(stationId, dateFrom, dateTo)
      case 'dispenser_uptime': return await dispenserUptimeReport(stationId, dateFrom, dateTo)
      case 'credit_ledger': return await creditLedgerReport(tenantId, dateFrom, dateTo)
      case 'redemption': return await redemptionReport(tenantId, dateFrom, dateTo)
      case 'ogra_compliance': return await ograComplianceReport(stationId, dateFrom, dateTo)
      case 'calibration': return await calibrationReport(stationId, dateFrom, dateTo)
      default: return NextResponse.json({ error: `Unknown reportType: ${reportType}` }, { status: 400 })
    }
  } catch (error) {
    console.error(`Report error [${reportType}]:`, error)
    return reportResponse(reportType, [], [], { error: 'Failed to generate report' }, dateFrom, dateTo)
  }
}

// =====================================================
// 1. DAILY SALES REPORT
// =====================================================
async function dailySalesReport(stationId: string | null, dateFrom?: Date, dateTo?: Date) {
  try {
    const where = buildWhere(stationId, dateFrom, dateTo, 'startedAt') as Record<string, unknown>
    where.status = 'completed'
    const fuelings = await db.fueling.findMany({ where, orderBy: { startedAt: 'desc' }, take: 5000 })

    // Group by date
    const byDate: Record<string, { date: string; totalVolume: number; totalRevenue: number; transactionCount: number }> = {}
    for (const f of fuelings) {
      const dk = new Date(f.startedAt).toISOString().split('T')[0]
      if (!byDate[dk]) byDate[dk] = { date: dk, totalVolume: 0, totalRevenue: 0, transactionCount: 0 }
      byDate[dk].totalVolume += f.volume
      byDate[dk].totalRevenue += f.totalAmount
      byDate[dk].transactionCount += 1
    }

    const totalVolume = fuelings.reduce((s, f) => s + f.volume, 0)
    const totalRevenue = fuelings.reduce((s, f) => s + f.totalAmount, 0)
    const columns = ['date', 'transactionCount', 'totalVolume', 'totalRevenue']
    const rows = Object.values(byDate).sort((a, b) => b.date.localeCompare(a.date)).map((d) => ({
      date: d.date, transactionCount: d.transactionCount, totalVolume: Math.round(d.totalVolume * 100) / 100, totalRevenue: Math.round(d.totalRevenue * 100) / 100,
    }))
    return reportResponse('daily_sales', columns, rows, {
      totalDays: rows.length, totalTransactions: fuelings.length,
      totalVolume: Math.round(totalVolume * 100) / 100, totalRevenue: Math.round(totalRevenue * 100) / 100,
      averageTicket: fuelings.length ? Math.round((totalRevenue / fuelings.length) * 100) / 100 : 0,
    }, dateFrom, dateTo)
  } catch { return reportResponse('daily_sales', [], [], { totalDays: 0, totalTransactions: 0, totalVolume: 0, totalRevenue: 0 }, dateFrom, dateTo) }
}

// =====================================================
// 2. SHIFT SUMMARY REPORT
// =====================================================
async function shiftSummaryReport(stationId: string | null, dateFrom?: Date, dateTo?: Date) {
  try {
    const where = buildWhere(stationId, dateFrom, dateTo, 'openedAt') as Record<string, unknown>
    const shifts = await db.shift.findMany({ where, orderBy: { openedAt: 'desc' }, take: 500 })
    const columns = ['shiftNumber', 'openedAt', 'closedAt', 'totalSales', 'fuelSales', 'retailSales', 'cashSales', 'cardSales', 'fleetSales', 'transactionCount', 'status']
    const rows = shifts.map((s) => ({
      shiftNumber: s.shiftNumber, openedAt: s.openedAt.toISOString(), closedAt: s.closedAt?.toISOString() || 'Open',
      totalSales: s.totalSales, fuelSales: s.fuelSales, retailSales: s.retailSales,
      cashSales: s.cashSales, cardSales: s.cardSales, fleetSales: s.fleetSales,
      transactionCount: s.transactionCount, status: s.status,
    }))
    const totalSales = shifts.reduce((s, sh) => s + sh.totalSales, 0)
    const totalFuel = shifts.reduce((s, sh) => s + sh.fuelSales, 0)
    return reportResponse('shift_summary', columns, rows, {
      totalShifts: shifts.length, totalSales: Math.round(totalSales * 100) / 100,
      totalFuelSales: Math.round(totalFuel * 100) / 100,
      avgSalesPerShift: shifts.length ? Math.round((totalSales / shifts.length) * 100) / 100 : 0,
    }, dateFrom, dateTo)
  } catch { return reportResponse('shift_summary', [], [], { totalShifts: 0, totalSales: 0, totalFuelSales: 0 }, dateFrom, dateTo) }
}

// =====================================================
// 3. TANK RECONCILIATION
// =====================================================
async function tankReconciliationReport(stationId: string | null, dateFrom?: Date, dateTo?: Date) {
  try {
    const where = buildWhere(stationId, dateFrom, dateTo) as Record<string, unknown>
    const recons = await db.reconciliation.findMany({ where, orderBy: { date: 'desc' }, take: 500, include: { tank: { select: { name: true, fuelType: true } } } })
    const columns = ['tankName', 'fuelType', 'date', 'openingStock', 'deliveries', 'sales', 'closingStock', 'bookStock', 'actualStock', 'variance', 'variancePercentage', 'status']
    const rows = recons.map((r) => ({
      tankName: r.tank?.name || 'Unknown', fuelType: r.tank?.fuelType || 'N/A',
      date: r.date.toISOString(), openingStock: r.openingStock, deliveries: r.deliveries,
      sales: r.sales, closingStock: r.closingStock, bookStock: r.bookStock, actualStock: r.actualStock,
      variance: Math.round(r.variance * 100) / 100, variancePercentage: Math.round(r.variancePercentage * 100) / 100, status: r.status,
    }))
    const avgVariance = recons.length ? recons.reduce((s, r) => s + r.variancePercentage, 0) / recons.length : 0
    return reportResponse('tank_reconciliation', columns, rows, {
      totalRecords: recons.length, avgVariance: Math.round(avgVariance * 100) / 100,
      highVariance: recons.filter((r) => Math.abs(r.variancePercentage) > 0.5).length,
    }, dateFrom, dateTo)
  } catch { return reportResponse('tank_reconciliation', [], [], { totalRecords: 0, avgVariance: 0, highVariance: 0 }, dateFrom, dateTo) }
}

// =====================================================
// 4. FUEL INVENTORY
// =====================================================
async function fuelInventoryReport(stationId: string | null, _dateFrom?: Date, _dateTo?: Date) {
  try {
    const where = stationId ? { stationId } : {}
    const tanks = await db.tank.findMany({ where, orderBy: { name: 'asc' } })
    const columns = ['name', 'code', 'fuelType', 'capacity', 'currentLevel', 'utilization', 'waterLevel', 'temperature', 'status', 'lastReading']
    const rows = tanks.map((t) => ({
      name: t.name, code: t.code, fuelType: t.fuelType, capacity: t.capacity,
      currentLevel: t.currentLevel, utilization: t.capacity > 0 ? Math.round((t.currentLevel / t.capacity) * 10000) / 100 : 0,
      waterLevel: t.waterLevel, temperature: Math.round(t.temperature * 10) / 10,
      status: t.status, lastReading: t.lastReading?.toISOString() || 'Never',
    }))
    const totalCapacity = tanks.reduce((s, t) => s + t.capacity, 0)
    const totalCurrent = tanks.reduce((s, t) => s + t.currentLevel, 0)
    return reportResponse('fuel_inventory', columns, rows, {
      totalTanks: tanks.length, totalCapacity, totalCurrentLevel: totalCurrent,
      avgUtilization: totalCapacity > 0 ? Math.round((totalCurrent / totalCapacity) * 10000) / 100 : 0,
      lowTanks: tanks.filter((t) => t.capacity > 0 && (t.currentLevel / t.capacity) < 0.2).length,
    }, _dateFrom, _dateTo)
  } catch { return reportResponse('fuel_inventory', [], [], { totalTanks: 0, totalCapacity: 0, totalCurrentLevel: 0 }, _dateFrom, _dateTo) }
}

// =====================================================
// 5. FINANCIAL SUMMARY
// =====================================================
async function financialSummaryReport(stationId: string | null, tenantId: string | null, dateFrom?: Date, dateTo?: Date) {
  try {
    const tWhere = buildWhere(stationId, dateFrom, dateTo, 'date') as Record<string, unknown>
    tWhere.status = 'completed'
    if (tenantId) tWhere.tenantId = tenantId
    const transactions = await db.transaction.findMany({ where: tWhere, take: 5000 })

    const eWhere = buildWhere(stationId, dateFrom, dateTo, 'date') as Record<string, unknown>
    eWhere.status = { in: ['approved', 'paid'] }
    const expenses = await db.expense.findMany({ where: eWhere, take: 5000 })

    const totalIncome = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0)

    const columns = ['type', 'category', 'amount', 'paymentMethod', 'date', 'status']
    const incomeRows = transactions.filter((t) => t.type === 'income').slice(0, 200).map((t) => ({
      type: 'Income', category: t.category, amount: t.amount, paymentMethod: t.paymentMethod,
      date: t.date.toISOString(), status: t.status,
    }))
    const expenseRows = expenses.slice(0, 200).map((e) => ({
      type: 'Expense', category: e.category, amount: e.amount, paymentMethod: e.paymentMethod || 'N/A',
      date: e.date.toISOString(), status: e.status,
    }))
    const rows = [...incomeRows, ...expenseRows]
    return reportResponse('financial_summary', columns, rows, {
      totalIncome: Math.round(totalIncome * 100) / 100, totalExpenses: Math.round(totalExpenses * 100) / 100,
      netProfit: Math.round((totalIncome - totalExpenses) * 100) / 100,
      profitMargin: totalIncome > 0 ? Math.round(((totalIncome - totalExpenses) / totalIncome) * 10000) / 100 : 0,
    }, dateFrom, dateTo)
  } catch { return reportResponse('financial_summary', [], [], { totalIncome: 0, totalExpenses: 0, netProfit: 0 }, dateFrom, dateTo) }
}

// =====================================================
// 6. PRICE HISTORY
// =====================================================
async function priceHistoryReport(tenantId: string | null, dateFrom?: Date, dateTo?: Date) {
  try {
    const where: Record<string, unknown> = {}
    if (tenantId) where.tenantId = tenantId
    if (dateFrom || dateTo) {
      where.effectiveFrom = { ...(dateFrom ? { gte: dateFrom } : {}), ...(dateTo ? { lte: dateTo } : {}) }
    }
    const prices = await db.fuelPrice.findMany({ where, orderBy: { effectiveFrom: 'desc' }, take: 500 })
    const columns = ['fuelType', 'fuelGrade', 'pricePerUnit', 'previousPrice', 'currency', 'effectiveFrom', 'effectiveTo', 'status', 'isGovernment']
    const rows = prices.map((p) => ({
      fuelType: p.fuelType, fuelGrade: p.fuelGrade || 'Standard', pricePerUnit: p.pricePerUnit,
      previousPrice: p.previousPrice, currency: p.currency, effectiveFrom: p.effectiveFrom.toISOString(),
      effectiveTo: p.effectiveTo?.toISOString() || 'Until Changed', status: p.status, isGovernment: p.isGovernment,
    }))
    return reportResponse('price_history', columns, rows, {
      totalPriceChanges: prices.length,
      fuelTypes: [...new Set(prices.map((p) => p.fuelType))].length,
      latestPetrol: prices.find((p) => p.fuelType === 'petrol')?.pricePerUnit || 0,
      latestDiesel: prices.find((p) => p.fuelType === 'diesel')?.pricePerUnit || 0,
    }, dateFrom, dateTo)
  } catch { return reportResponse('price_history', [], [], { totalPriceChanges: 0, fuelTypes: 0 }, dateFrom, dateTo) }
}

// =====================================================
// 7. FLEET SUMMARY
// =====================================================
async function fleetSummaryReport(tenantId: string | null, _dateFrom?: Date, _dateTo?: Date) {
  try {
    const where = tenantId ? { tenantId } : {}
    const fleets = await db.fleetAccount.findMany({ where, orderBy: { companyName: 'asc' }, include: { fuelCards: true } })
    const columns = ['companyName', 'contactPerson', 'phone', 'creditLimit', 'currentBalance', 'dailyLimit', 'paymentTerms', 'status', 'fuelCardCount']
    const rows = fleets.map((f) => ({
      companyName: f.companyName, contactPerson: f.contactPerson || 'N/A', phone: f.phone || 'N/A',
      creditLimit: f.creditLimit, currentBalance: f.currentBalance, dailyLimit: f.dailyLimit || 0,
      paymentTerms: f.paymentTerms || 'N/A', status: f.status, fuelCardCount: f.fuelCards.length,
    }))
    const totalCredit = fleets.reduce((s, f) => s + f.creditLimit, 0)
    const totalOutstanding = fleets.reduce((s, f) => s + f.currentBalance, 0)
    return reportResponse('fleet_summary', columns, rows, {
      totalFleets: fleets.length, totalCreditLimit: totalCredit,
      totalOutstanding: Math.round(totalOutstanding * 100) / 100,
      activeFleets: fleets.filter((f) => f.status === 'active').length,
    }, _dateFrom, _dateTo)
  } catch { return reportResponse('fleet_summary', [], [], { totalFleets: 0, totalCreditLimit: 0, totalOutstanding: 0 }, _dateFrom, _dateTo) }
}

// =====================================================
// 8. EMPLOYEE PERFORMANCE
// =====================================================
async function employeePerformanceReport(stationId: string | null, dateFrom?: Date, dateTo?: Date) {
  try {
    const where = stationId ? { stationId } : {}
    const employees = await db.employee.findMany({ where, orderBy: { name: 'asc' } })
    const columns = ['name', 'employeeId', 'role', 'phone', 'status', 'salary', 'commissionRate', 'hireDate']
    const rows = employees.map((e) => ({
      name: e.name, employeeId: e.employeeId || 'N/A', role: e.role,
      phone: e.phone || 'N/A', status: e.status, salary: e.salary || 0,
      commissionRate: e.commissionRate, hireDate: e.hireDate?.toISOString() || 'N/A',
    }))
    const totalSalary = employees.reduce((s, e) => s + (e.salary || 0), 0)
    return reportResponse('employee_performance', columns, rows, {
      totalEmployees: employees.length, activeEmployees: employees.filter((e) => e.status === 'active').length,
      totalMonthlyPayroll: Math.round(totalSalary * 100) / 100,
      avgSalary: employees.length ? Math.round((totalSalary / employees.length) * 100) / 100 : 0,
    }, dateFrom, dateTo)
  } catch { return reportResponse('employee_performance', [], [], { totalEmployees: 0, activeEmployees: 0, totalMonthlyPayroll: 0 }, dateFrom, dateTo) }
}

// =====================================================
// 9. DELIVERY LOG
// =====================================================
async function deliveryLogReport(stationId: string | null, dateFrom?: Date, dateTo?: Date) {
  try {
    const where = buildWhere(stationId, dateFrom, dateTo, 'deliveryDate') as Record<string, unknown>
    const deliveries = await db.fuelDelivery.findMany({ where, orderBy: { deliveryDate: 'desc' }, take: 500 })
    const columns = ['supplierName', 'productType', 'expectedVolume', 'actualVolume', 'variance', 'density', 'temperature', 'status', 'deliveryDate', 'invoiceNumber', 'totalCost']
    const rows = deliveries.map((d) => ({
      supplierName: d.supplierName, productType: d.productType, expectedVolume: d.expectedVolume,
      actualVolume: d.actualVolume, variance: d.variance || (d.actualVolume - d.expectedVolume),
      density: d.density || 0, temperature: d.temperature || 0, status: d.status,
      deliveryDate: d.deliveryDate.toISOString(), invoiceNumber: d.invoiceNumber || 'N/A',
      totalCost: d.totalCost || 0,
    }))
    const totalExpected = deliveries.reduce((s, d) => s + d.expectedVolume, 0)
    const totalActual = deliveries.reduce((s, d) => s + d.actualVolume, 0)
    const totalCost = deliveries.reduce((s, d) => s + (d.totalCost || 0), 0)
    return reportResponse('delivery_log', columns, rows, {
      totalDeliveries: deliveries.length, totalExpectedVolume: Math.round(totalExpected * 100) / 100,
      totalActualVolume: Math.round(totalActual * 100) / 100, totalCost: Math.round(totalCost * 100) / 100,
      pendingDeliveries: deliveries.filter((d) => d.status === 'pending').length,
    }, dateFrom, dateTo)
  } catch { return reportResponse('delivery_log', [], [], { totalDeliveries: 0, totalExpectedVolume: 0, totalActualVolume: 0, totalCost: 0 }, dateFrom, dateTo) }
}

// =====================================================
// 10. RETAIL SALES
// =====================================================
async function retailSalesReport(stationId: string | null, dateFrom?: Date, dateTo?: Date) {
  try {
    const where = buildWhere(stationId, dateFrom, dateTo) as Record<string, unknown>
    const transactions = await db.retailTransaction.findMany({ where, orderBy: { createdAt: 'desc' }, take: 2000 })
    const columns = ['id', 'totalAmount', 'paymentMethod', 'discountAmount', 'loyaltyPointsUsed', 'status', 'createdAt']
    const rows = transactions.map((t) => ({
      id: t.id.slice(-8), totalAmount: t.totalAmount, paymentMethod: t.paymentMethod,
      discountAmount: t.discountAmount, loyaltyPointsUsed: t.loyaltyPointsUsed,
      status: t.status, createdAt: t.createdAt.toISOString(),
    }))
    const totalRevenue = transactions.reduce((s, t) => s + t.totalAmount, 0)
    const totalDiscount = transactions.reduce((s, t) => s + t.discountAmount, 0)
    return reportResponse('retail_sales', columns, rows, {
      totalTransactions: transactions.length, totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalDiscounts: Math.round(totalDiscount * 100) / 100,
      avgTransaction: transactions.length ? Math.round((totalRevenue / transactions.length) * 100) / 100 : 0,
    }, dateFrom, dateTo)
  } catch { return reportResponse('retail_sales', [], [], { totalTransactions: 0, totalRevenue: 0, totalDiscounts: 0 }, dateFrom, dateTo) }
}

// =====================================================
// 11. LOYALTY SUMMARY
// =====================================================
async function loyaltySummaryReport(tenantId: string | null, _dateFrom?: Date, _dateTo?: Date) {
  try {
    const where = tenantId ? { tenantId } : {}
    const customers = await db.customer.findMany({ where, orderBy: { totalSpent: 'desc' }, take: 500 })
    const columns = ['name', 'phone', 'email', 'loyaltyPoints', 'membershipTier', 'totalSpent', 'totalVisits', 'lastVisit', 'isActive']
    const rows = customers.map((c) => ({
      name: c.name, phone: c.phone || 'N/A', email: c.email || 'N/A',
      loyaltyPoints: c.loyaltyPoints, membershipTier: c.membershipTier,
      totalSpent: c.totalSpent, totalVisits: c.totalVisits,
      lastVisit: c.lastVisit?.toISOString() || 'Never', isActive: c.isActive,
    }))
    const totalPoints = customers.reduce((s, c) => s + c.loyaltyPoints, 0)
    const totalSpent = customers.reduce((s, c) => s + c.totalSpent, 0)
    return reportResponse('loyalty_summary', columns, rows, {
      totalCustomers: customers.length, totalLoyaltyPoints: totalPoints,
      totalSpent: Math.round(totalSpent * 100) / 100,
      activeCustomers: customers.filter((c) => c.isActive).length,
    }, _dateFrom, _dateTo)
  } catch { return reportResponse('loyalty_summary', [], [], { totalCustomers: 0, totalLoyaltyPoints: 0, totalSpent: 0 }, _dateFrom, _dateTo) }
}

// =====================================================
// 12. EV & CNG SESSIONS
// =====================================================
async function evCngSessionsReport(stationId: string | null, dateFrom?: Date, dateTo?: Date) {
  try {
    const sWhere = buildWhere(stationId, dateFrom, dateTo, 'startedAt') as Record<string, unknown>
    const sessions = await db.chargingSession.findMany({ where: sWhere, orderBy: { startedAt: 'desc' }, take: 500 })
    const columns = ['vehiclePlate', 'energyKwh', 'durationMinutes', 'pricePerKwh', 'totalAmount', 'paymentMethod', 'status', 'startedAt', 'completedAt']
    const rows = sessions.map((s) => ({
      vehiclePlate: s.vehiclePlate || 'N/A', energyKwh: s.energyKwh, durationMinutes: s.durationMinutes,
      pricePerKwh: s.pricePerKwh, totalAmount: s.totalAmount, paymentMethod: s.paymentMethod,
      status: s.status, startedAt: s.startedAt.toISOString(), completedAt: s.completedAt?.toISOString() || 'Active',
    }))
    const totalEnergy = sessions.reduce((s, se) => s + se.energyKwh, 0)
    const totalRevenue = sessions.reduce((s, se) => s + se.totalAmount, 0)
    return reportResponse('ev_cng_sessions', columns, rows, {
      totalSessions: sessions.length, totalEnergyKwh: Math.round(totalEnergy * 100) / 100,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      activeSessions: sessions.filter((s) => s.status === 'active').length,
    }, dateFrom, dateTo)
  } catch { return reportResponse('ev_cng_sessions', [], [], { totalSessions: 0, totalEnergyKwh: 0, totalRevenue: 0 }, dateFrom, dateTo) }
}

// =====================================================
// 13. EXPENSE REPORT
// =====================================================
async function expenseReport(stationId: string | null, dateFrom?: Date, dateTo?: Date) {
  try {
    const where = buildWhere(stationId, dateFrom, dateTo, 'date') as Record<string, unknown>
    const expenses = await db.expense.findMany({ where, orderBy: { date: 'desc' }, take: 2000 })
    const columns = ['category', 'amount', 'description', 'paymentMethod', 'date', 'status', 'referenceNumber']
    const rows = expenses.map((e) => ({
      category: e.category, amount: e.amount, description: e.description || 'N/A',
      paymentMethod: e.paymentMethod || 'N/A', date: e.date.toISOString(),
      status: e.status, referenceNumber: e.referenceNumber || 'N/A',
    }))
    const totalAmount = expenses.reduce((s, e) => s + e.amount, 0)
    return reportResponse('expense_report', columns, rows, {
      totalExpenses: Math.round(totalAmount * 100) / 100, totalRecords: expenses.length,
      approved: expenses.filter((e) => e.status === 'approved' || e.status === 'paid').length,
      pending: expenses.filter((e) => e.status === 'pending').length,
    }, dateFrom, dateTo)
  } catch { return reportResponse('expense_report', [], [], { totalExpenses: 0, totalRecords: 0, approved: 0, pending: 0 }, dateFrom, dateTo) }
}

// =====================================================
// 14. ATTENDANCE REPORT
// =====================================================
async function attendanceReport(stationId: string | null, dateFrom?: Date, dateTo?: Date) {
  try {
    const where = buildWhere(stationId, dateFrom, dateTo, 'checkIn') as Record<string, unknown>
    const records = await db.attendance.findMany({ where, orderBy: { checkIn: 'desc' }, take: 2000, include: { employee: { select: { name: true, role: true } } } })
    const columns = ['employeeName', 'role', 'checkIn', 'checkOut', 'status', 'hoursWorked', 'notes']
    const rows = records.map((r) => ({
      employeeName: r.employee?.name || 'Unknown', role: r.employee?.role || 'N/A',
      checkIn: r.checkIn.toISOString(), checkOut: r.checkOut?.toISOString() || 'Still In',
      status: r.status, hoursWorked: r.hoursWorked || 0, notes: r.notes || 'N/A',
    }))
    const totalHours = records.reduce((s, r) => s + (r.hoursWorked || 0), 0)
    return reportResponse('attendance_report', columns, rows, {
      totalRecords: records.length, totalHours: Math.round(totalHours * 100) / 100,
      present: records.filter((r) => r.status === 'present').length,
      late: records.filter((r) => r.status === 'late').length,
      absent: records.filter((r) => r.status === 'absent').length,
    }, dateFrom, dateTo)
  } catch { return reportResponse('attendance_report', [], [], { totalRecords: 0, totalHours: 0, present: 0, late: 0, absent: 0 }, dateFrom, dateTo) }
}

// =====================================================
// 15. RECONCILIATION REPORT
// =====================================================
async function reconciliationReport(stationId: string | null, dateFrom?: Date, dateTo?: Date) {
  try {
    const where = buildWhere(stationId, dateFrom, dateTo) as Record<string, unknown>
    const recons = await db.reconciliation.findMany({ where, orderBy: { date: 'desc' }, take: 500, include: { tank: { select: { name: true, fuelType: true } } } })
    const columns = ['tankName', 'fuelType', 'date', 'openingStock', 'deliveries', 'sales', 'closingStock', 'bookStock', 'actualStock', 'variance', 'variancePercentage', 'status']
    const rows = recons.map((r) => ({
      tankName: r.tank?.name || 'Unknown', fuelType: r.tank?.fuelType || 'N/A',
      date: r.date.toISOString(), openingStock: r.openingStock, deliveries: r.deliveries,
      sales: r.sales, closingStock: r.closingStock, bookStock: r.bookStock, actualStock: r.actualStock,
      variance: Math.round(r.variance * 100) / 100, variancePercentage: Math.round(r.variancePercentage * 100) / 100,
      status: r.status,
    }))
    return reportResponse('reconciliation_report', columns, rows, {
      totalRecords: recons.length, pending: recons.filter((r) => r.status === 'pending').length,
      reviewed: recons.filter((r) => r.status === 'reviewed').length,
      approved: recons.filter((r) => r.status === 'approved').length,
    }, dateFrom, dateTo)
  } catch { return reportResponse('reconciliation_report', [], [], { totalRecords: 0, pending: 0, reviewed: 0, approved: 0 }, dateFrom, dateTo) }
}

// =====================================================
// 16. CASH RECONCILIATION
// =====================================================
async function cashReconciliationReport(stationId: string | null, dateFrom?: Date, dateTo?: Date) {
  try {
    const where = buildWhere(stationId, dateFrom, dateTo, 'openedAt') as Record<string, unknown>
    const shifts = await db.shift.findMany({ where, orderBy: { openedAt: 'desc' }, take: 500 })
    const columns = ['shiftNumber', 'openedAt', 'closedAt', 'openingCash', 'cashSales', 'cardSales', 'fleetSales', 'expectedCash', 'closingCash', 'cashVariance', 'status']
    const rows = shifts.map((s) => ({
      shiftNumber: s.shiftNumber, openedAt: s.openedAt.toISOString(), closedAt: s.closedAt?.toISOString() || 'Open',
      openingCash: s.openingCash, cashSales: s.cashSales, cardSales: s.cardSales, fleetSales: s.fleetSales,
      expectedCash: s.expectedCash || 0, closingCash: s.closingCash || 0,
      cashVariance: s.cashVariance || 0, status: s.status,
    }))
    const totalVariance = shifts.reduce((s, sh) => s + (sh.cashVariance || 0), 0)
    return reportResponse('cash_reconciliation', columns, rows, {
      totalShifts: shifts.length, totalCashVariance: Math.round(totalVariance * 100) / 100,
      openShifts: shifts.filter((s) => s.status === 'open').length,
      reconciled: shifts.filter((s) => s.status === 'reconciled').length,
    }, dateFrom, dateTo)
  } catch { return reportResponse('cash_reconciliation', [], [], { totalShifts: 0, totalCashVariance: 0 }, dateFrom, dateTo) }
}

// =====================================================
// 17. SUPPLIER STATEMENT
// =====================================================
async function supplierStatementReport(_stationId: string | null, tenantId: string | null, dateFrom?: Date, dateTo?: Date) {
  try {
    const where: Record<string, unknown> = {}
    if (tenantId) where.tenantId = tenantId
    const suppliers = await db.supplier.findMany({ where, orderBy: { name: 'asc' } })
    const iWhere = buildWhere(null, dateFrom, dateTo, 'invoiceDate') as Record<string, unknown>
    const invoices = await db.supplierInvoice.findMany({ where: iWhere, take: 2000 })
    const columns = ['name', 'category', 'contactPerson', 'phone', 'email', 'paymentTerms', 'isActive', 'totalInvoices', 'totalAmount', 'totalPaid', 'outstanding']
    const rows = suppliers.map((sup) => {
      const supInvoices = invoices.filter((i) => i.supplierId === sup.id)
      const totalAmount = supInvoices.reduce((s, i) => s + i.totalAmount, 0)
      const totalPaid = supInvoices.reduce((s, i) => s + i.paidAmount, 0)
      return {
        name: sup.name, category: sup.category, contactPerson: sup.contactPerson || 'N/A',
        phone: sup.phone || 'N/A', email: sup.email || 'N/A', paymentTerms: sup.paymentTerms || 'N/A',
        isActive: sup.isActive, totalInvoices: supInvoices.length,
        totalAmount: Math.round(totalAmount * 100) / 100, totalPaid: Math.round(totalPaid * 100) / 100,
        outstanding: Math.round((totalAmount - totalPaid) * 100) / 100,
      }
    })
    const totalOutstanding = rows.reduce((s, r) => s + (r.outstanding as number), 0)
    return reportResponse('supplier_statement', columns, rows, {
      totalSuppliers: suppliers.length, totalOutstanding: Math.round(totalOutstanding * 100) / 100,
      activeSuppliers: suppliers.filter((s) => s.isActive).length,
    }, dateFrom, dateTo)
  } catch { return reportResponse('supplier_statement', [], [], { totalSuppliers: 0, totalOutstanding: 0 }, dateFrom, dateTo) }
}

// =====================================================
// 18. ENVIRONMENTAL REPORT
// =====================================================
async function environmentalReport(stationId: string | null, dateFrom?: Date, dateTo?: Date) {
  try {
    const aWhere = buildWhere(stationId, dateFrom, dateTo) as Record<string, unknown>
    const alerts = await db.environmentalAlert.findMany({ where: aWhere, orderBy: { createdAt: 'desc' }, take: 500 })
    const columns = ['type', 'severity', 'message', 'stationId', 'isResolved', 'createdAt', 'resolvedAt']
    const rows = alerts.map((a) => ({
      type: a.alertType, severity: a.severity, message: a.message,
      stationId: a.stationId?.slice(-8) || 'N/A', isResolved: a.isResolved,
      createdAt: a.createdAt.toISOString(), resolvedAt: a.resolvedAt?.toISOString() || 'Unresolved',
    }))
    return reportResponse('environmental_report', columns, rows, {
      totalAlerts: alerts.length, critical: alerts.filter((a) => a.severity === 'critical').length,
      resolved: alerts.filter((a) => a.isResolved).length,
      unresolved: alerts.filter((a) => !a.isResolved).length,
    }, dateFrom, dateTo)
  } catch { return reportResponse('environmental_report', [], [], { totalAlerts: 0, critical: 0, resolved: 0, unresolved: 0 }, dateFrom, dateTo) }
}

// =====================================================
// 19. SECURITY AUDIT
// =====================================================
async function securityAuditReport(tenantId: string | null, dateFrom?: Date, dateTo?: Date) {
  try {
    const aWhere: Record<string, unknown> = {}
    if (tenantId) aWhere.tenantId = tenantId
    if (dateFrom || dateTo) aWhere.createdAt = { ...(dateFrom ? { gte: dateFrom } : {}), ...(dateTo ? { lte: dateTo } : {}) }
    const [alerts, sessions, logs] = await Promise.all([
      db.securityAlert.findMany({ where: aWhere, orderBy: { createdAt: 'desc' }, take: 200 }),
      db.securitySession.findMany({ where: aWhere, orderBy: { createdAt: 'desc' }, take: 200 }),
      db.auditLog.findMany({ where: aWhere, orderBy: { createdAt: 'desc' }, take: 200 }),
    ])
    const columns = ['source', 'action', 'severity', 'details', 'userId', 'createdAt']
    const rows = [
      ...alerts.map((a) => ({ source: 'Alert', action: a.alertType, severity: a.severity, details: a.message, userId: a.userId?.slice(-8) || 'System', createdAt: a.createdAt.toISOString() })),
      ...sessions.map((s) => ({ source: 'Session', action: s.action, severity: 'info', details: `IP: ${s.ipAddress || 'N/A'}`, userId: s.userId?.slice(-8) || 'N/A', createdAt: s.createdAt.toISOString() })),
      ...logs.map((l) => ({ source: 'Audit', action: l.action, severity: 'info', details: l.details || 'N/A', userId: l.userId?.slice(-8) || 'N/A', createdAt: l.createdAt.toISOString() })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 500)
    return reportResponse('security_audit', columns, rows, {
      totalAlerts: alerts.length, totalSessions: sessions.length, totalAuditLogs: logs.length,
      criticalAlerts: alerts.filter((a) => a.severity === 'critical').length,
    }, dateFrom, dateTo)
  } catch { return reportResponse('security_audit', [], [], { totalAlerts: 0, totalSessions: 0, totalAuditLogs: 0 }, dateFrom, dateTo) }
}

// =====================================================
// 20. STATION PERFORMANCE
// =====================================================
async function stationPerformanceReport(tenantId: string | null, dateFrom?: Date, dateTo?: Date) {
  try {
    const where: Record<string, unknown> = {}
    if (tenantId) where.tenantId = tenantId
    const stations = await db.station.findMany({ where, orderBy: { name: 'asc' } })
    const columns = ['name', 'code', 'city', 'stationType', 'isActive', 'timezone', 'currency']
    const rows = stations.map((s) => ({
      name: s.name, code: s.code, city: s.city || 'N/A',
      stationType: s.stationType, isActive: s.isActive,
      timezone: s.timezone, currency: s.currency,
    }))
    return reportResponse('station_performance', columns, rows, {
      totalStations: stations.length, activeStations: stations.filter((s) => s.isActive).length,
      fuelStations: stations.filter((s) => s.stationType === 'fuel' || s.stationType === 'hybrid').length,
      evStations: stations.filter((s) => s.stationType === 'ev' || s.stationType === 'hybrid').length,
    }, dateFrom, dateTo)
  } catch { return reportResponse('station_performance', [], [], { totalStations: 0, activeStations: 0 }, dateFrom, dateTo) }
}

// =====================================================
// 21-40. NEW REPORT TYPES
// =====================================================

async function nozzleSalesReport(stationId: string | null, dateFrom?: Date, dateTo?: Date) {
  try {
    const where = buildWhere(stationId, dateFrom, dateTo, 'startedAt') as Record<string, unknown>
    where.status = 'completed'
    const fuelings = await db.fueling.findMany({ where, orderBy: { startedAt: 'desc' }, take: 5000, include: { nozzle: { select: { name: true, code: true, dispenser: { select: { name: true } } } } } })
    const byNozzle: Record<string, { nozzleName: string; dispenserName: string; transactionCount: number; totalVolume: number; totalRevenue: number }> = {}
    for (const f of fuelings) {
      const nk = f.nozzleId || 'unknown'
      if (!byNozzle[nk]) byNozzle[nk] = { nozzleName: (f.nozzle as { name: string } | null)?.name || 'Unknown', dispenserName: ((f.nozzle as { dispenser: { name: string } } | null)?.dispenser?.name) || 'Unknown', transactionCount: 0, totalVolume: 0, totalRevenue: 0 }
      byNozzle[nk].transactionCount += 1
      byNozzle[nk].totalVolume += f.volume
      byNozzle[nk].totalRevenue += f.totalAmount
    }
    const columns = ['nozzleName', 'dispenserName', 'transactionCount', 'totalVolume', 'totalRevenue']
    const rows = Object.values(byNozzle).map((d) => ({ ...d, totalVolume: Math.round(d.totalVolume * 100) / 100, totalRevenue: Math.round(d.totalRevenue * 100) / 100 }))
    const totalVolume = fuelings.reduce((s, f) => s + f.volume, 0)
    const totalRevenue = fuelings.reduce((s, f) => s + f.totalAmount, 0)
    return reportResponse('nozzle_sales', columns, rows, { totalNozzles: Object.keys(byNozzle).length, totalTransactions: fuelings.length, totalVolume: Math.round(totalVolume * 100) / 100, totalRevenue: Math.round(totalRevenue * 100) / 100 }, dateFrom, dateTo)
  } catch { return reportResponse('nozzle_sales', [], [], { totalNozzles: 0, totalTransactions: 0, totalVolume: 0, totalRevenue: 0 }, dateFrom, dateTo) }
}

async function productSalesReport(stationId: string | null, dateFrom?: Date, dateTo?: Date) {
  try {
    const where = buildWhere(stationId, dateFrom, dateTo, 'startedAt') as Record<string, unknown>
    where.status = 'completed'
    const fuelings = await db.fueling.findMany({ where, take: 5000 })
    const byProduct: Record<string, { fuelType: string; transactionCount: number; totalVolume: number; totalRevenue: number; avgPrice: number }> = {}
    for (const f of fuelings) {
      const pk = f.fuelType || 'unknown'
      if (!byProduct[pk]) byProduct[pk] = { fuelType: pk, transactionCount: 0, totalVolume: 0, totalRevenue: 0, avgPrice: 0 }
      byProduct[pk].transactionCount += 1
      byProduct[pk].totalVolume += f.volume
      byProduct[pk].totalRevenue += f.totalAmount
    }
    for (const k of Object.keys(byProduct)) {
      const p = byProduct[k]
      p.avgPrice = p.totalVolume > 0 ? Math.round((p.totalRevenue / p.totalVolume) * 100) / 100 : 0
      p.totalVolume = Math.round(p.totalVolume * 100) / 100
      p.totalRevenue = Math.round(p.totalRevenue * 100) / 100
    }
    const columns = ['fuelType', 'transactionCount', 'totalVolume', 'totalRevenue', 'avgPrice']
    const rows = Object.values(byProduct)
    const totalRevenue = fuelings.reduce((s, f) => s + f.totalAmount, 0)
    return reportResponse('product_sales', columns, rows, { totalProducts: rows.length, totalTransactions: fuelings.length, totalRevenue: Math.round(totalRevenue * 100) / 100 }, dateFrom, dateTo)
  } catch { return reportResponse('product_sales', [], [], { totalProducts: 0, totalTransactions: 0, totalRevenue: 0 }, dateFrom, dateTo) }
}

async function paymentModeReport(stationId: string | null, dateFrom?: Date, dateTo?: Date) {
  try {
    const where = buildWhere(stationId, dateFrom, dateTo, 'startedAt') as Record<string, unknown>
    where.status = 'completed'
    const fuelings = await db.fueling.findMany({ where, take: 5000 })
    const byPayment: Record<string, { paymentMethod: string; transactionCount: number; totalRevenue: number; percentage: number }> = {}
    const totalRev = fuelings.reduce((s, f) => s + f.totalAmount, 0)
    for (const f of fuelings) {
      const pm = f.paymentMethod || 'cash'
      if (!byPayment[pm]) byPayment[pm] = { paymentMethod: pm, transactionCount: 0, totalRevenue: 0, percentage: 0 }
      byPayment[pm].transactionCount += 1
      byPayment[pm].totalRevenue += f.totalAmount
    }
    for (const k of Object.keys(byPayment)) {
      byPayment[k].totalRevenue = Math.round(byPayment[k].totalRevenue * 100) / 100
      byPayment[k].percentage = totalRev > 0 ? Math.round((byPayment[k].totalRevenue / totalRev) * 10000) / 100 : 0
    }
    const columns = ['paymentMethod', 'transactionCount', 'totalRevenue', 'percentage']
    const rows = Object.values(byPayment)
    return reportResponse('payment_mode', columns, rows, { totalPaymentModes: rows.length, totalTransactions: fuelings.length, totalRevenue: Math.round(totalRev * 100) / 100 }, dateFrom, dateTo)
  } catch { return reportResponse('payment_mode', [], [], { totalPaymentModes: 0, totalTransactions: 0, totalRevenue: 0 }, dateFrom, dateTo) }
}

async function hourlySalesReport(stationId: string | null, dateFrom?: Date, dateTo?: Date) {
  try {
    const where = buildWhere(stationId, dateFrom, dateTo, 'startedAt') as Record<string, unknown>
    where.status = 'completed'
    const fuelings = await db.fueling.findMany({ where, take: 5000 })
    const byHour: Record<number, { hour: number; transactionCount: number; totalVolume: number; totalRevenue: number }> = {}
    for (let h = 0; h < 24; h++) byHour[h] = { hour: h, transactionCount: 0, totalVolume: 0, totalRevenue: 0 }
    for (const f of fuelings) {
      const h = new Date(f.startedAt).getHours()
      byHour[h].transactionCount += 1
      byHour[h].totalVolume += f.volume
      byHour[h].totalRevenue += f.totalAmount
    }
    const columns = ['hour', 'transactionCount', 'totalVolume', 'totalRevenue']
    const rows = Object.values(byHour).map((d) => ({ hour: `${String(d.hour).padStart(2, '0')}:00`, transactionCount: d.transactionCount, totalVolume: Math.round(d.totalVolume * 100) / 100, totalRevenue: Math.round(d.totalRevenue * 100) / 100 }))
    const peakHour = Object.values(byHour).reduce((max, d) => d.totalRevenue > max.totalRevenue ? d : max, byHour[0])
    return reportResponse('hourly_sales', columns, rows, { totalTransactions: fuelings.length, peakHour: `${String(peakHour.hour).padStart(2, '0')}:00`, totalRevenue: Math.round(fuelings.reduce((s, f) => s + f.totalAmount, 0) * 100) / 100 }, dateFrom, dateTo)
  } catch { return reportResponse('hourly_sales', [], [], { totalTransactions: 0, peakHour: '-', totalRevenue: 0 }, dateFrom, dateTo) }
}

async function meterReadingReport(stationId: string | null, dateFrom?: Date, dateTo?: Date) {
  try {
    const where = buildWhere(stationId, dateFrom, dateTo) as Record<string, unknown>
    const records = await db.meterRecord.findMany({ where, orderBy: { createdAt: 'desc' }, take: 500, include: { nozzle: { select: { name: true, code: true } } } })
    const columns = ['nozzleName', 'nozzleCode', 'openingReading', 'closingReading', 'volumeDispensed', 'shiftNumber', 'date', 'status']
    const rows = records.map((r) => ({
      nozzleName: (r.nozzle as { name: string } | null)?.name || 'Unknown',
      nozzleCode: (r.nozzle as { code: string } | null)?.code || 'N/A',
      openingReading: r.openingReading,
      closingReading: r.closingReading,
      volumeDispensed: Math.round((r.closingReading - r.openingReading) * 100) / 100,
      shiftNumber: (r as Record<string, unknown>).shiftNumber || 'N/A',
      date: r.createdAt.toISOString(),
      status: 'completed',
    }))
    return reportResponse('meter_reading', columns, rows, { totalReadings: records.length, totalVolume: Math.round(rows.reduce((s, r) => s + (r.volumeDispensed as number), 0) * 100) / 100 }, dateFrom, dateTo)
  } catch { return reportResponse('meter_reading', [], [], { totalReadings: 0, totalVolume: 0 }, dateFrom, dateTo) }
}

async function dipReadingReport(stationId: string | null, dateFrom?: Date, dateTo?: Date) {
  try {
    const where = buildWhere(stationId, dateFrom, dateTo) as Record<string, unknown>
    const recons = await db.reconciliation.findMany({ where, orderBy: { date: 'desc' }, take: 500, include: { tank: { select: { name: true, fuelType: true } } } })
    const columns = ['tankName', 'fuelType', 'date', 'bookStock', 'actualStock', 'variance', 'variancePercentage']
    const rows = recons.map((r) => ({ tankName: r.tank?.name || 'Unknown', fuelType: r.tank?.fuelType || 'N/A', date: r.date.toISOString(), bookStock: r.bookStock, actualStock: r.actualStock, variance: Math.round(r.variance * 100) / 100, variancePercentage: Math.round(r.variancePercentage * 100) / 100 }))
    return reportResponse('dip_reading', columns, rows, { totalReadings: recons.length, avgVariance: recons.length ? Math.round((recons.reduce((s, r) => s + r.variancePercentage, 0) / recons.length) * 100) / 100 : 0 }, dateFrom, dateTo)
  } catch { return reportResponse('dip_reading', [], [], { totalReadings: 0, avgVariance: 0 }, dateFrom, dateTo) }
}

async function stockGainLossReport(stationId: string | null, dateFrom?: Date, dateTo?: Date) {
  try {
    const where = buildWhere(stationId, dateFrom, dateTo) as Record<string, unknown>
    const recons = await db.reconciliation.findMany({ where, orderBy: { date: 'desc' }, take: 500, include: { tank: { select: { name: true, fuelType: true } } } })
    const columns = ['tankName', 'fuelType', 'date', 'variance', 'variancePercentage', 'status']
    const rows = recons.map((r) => ({ tankName: r.tank?.name || 'Unknown', fuelType: r.tank?.fuelType || 'N/A', date: r.date.toISOString(), variance: Math.round(r.variance * 100) / 100, variancePercentage: Math.round(r.variancePercentage * 100) / 100, status: r.variance > 0 ? 'gain' : r.variance < 0 ? 'loss' : 'balanced' }))
    const totalGain = rows.filter((r) => r.variance > 0).reduce((s, r) => s + r.variance, 0)
    const totalLoss = rows.filter((r) => r.variance < 0).reduce((s, r) => s + r.variance, 0)
    return reportResponse('stock_gain_loss', columns, rows, { totalRecords: recons.length, totalGain: Math.round(totalGain * 100) / 100, totalLoss: Math.round(totalLoss * 100) / 100 }, dateFrom, dateTo)
  } catch { return reportResponse('stock_gain_loss', [], [], { totalRecords: 0, totalGain: 0, totalLoss: 0 }, dateFrom, dateTo) }
}

async function lubricantInventoryReport(stationId: string | null, _dateFrom?: Date, _dateTo?: Date) {
  try {
    const where = stationId ? { stationId } : {}
    const products = await db.retailProduct.findMany({ where: { category: 'lubricant' }, orderBy: { name: 'asc' } })
    const columns = ['name', 'sku', 'category', 'price', 'stock', 'reorderLevel', 'status']
    const rows = products.map((p) => ({ name: p.name, sku: p.sku || 'N/A', category: p.category, price: p.price, stock: p.stock, reorderLevel: (p as Record<string, unknown>).reorderLevel || 0, status: p.stock > 0 ? 'in_stock' : 'out_of_stock' }))
    return reportResponse('lubricant_inventory', columns, rows, { totalProducts: products.length, totalValue: Math.round(products.reduce((s, p) => s + p.price * p.stock, 0) * 100) / 100, lowStock: products.filter((p) => p.stock < 10).length }, _dateFrom, _dateTo)
  } catch { return reportResponse('lubricant_inventory', [], [], { totalProducts: 0, totalValue: 0, lowStock: 0 }, _dateFrom, _dateTo) }
}

async function profitLossReport(stationId: string | null, tenantId: string | null, dateFrom?: Date, dateTo?: Date) {
  try {
    const tWhere = buildWhere(stationId, dateFrom, dateTo, 'date') as Record<string, unknown>
    tWhere.status = 'completed'
    if (tenantId) tWhere.tenantId = tenantId
    const transactions = await db.transaction.findMany({ where: tWhere, take: 5000 })
    const eWhere = buildWhere(stationId, dateFrom, dateTo, 'date') as Record<string, unknown>
    eWhere.status = { in: ['approved', 'paid'] }
    const expenses = await db.expense.findMany({ where: eWhere, take: 5000 })
    const totalRevenue = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
    const cogs = expenses.filter((e) => (e.category || '').toLowerCase().includes('fuel') || (e.category || '').toLowerCase().includes('purchase')).reduce((s, e) => s + e.amount, 0)
    const operatingExpenses = totalRevenue > 0 ? expenses.reduce((s, e) => s + e.amount, 0) - cogs : 0
    const grossProfit = totalRevenue - cogs
    const netProfit = grossProfit - operatingExpenses
    const columns = ['category', 'amount', 'percentage']
    const rows = [
      { category: 'Revenue', amount: Math.round(totalRevenue * 100) / 100, percentage: 100 },
      { category: 'Cost of Goods Sold', amount: Math.round(cogs * 100) / 100, percentage: totalRevenue > 0 ? Math.round((cogs / totalRevenue) * 10000) / 100 : 0 },
      { category: 'Gross Profit', amount: Math.round(grossProfit * 100) / 100, percentage: totalRevenue > 0 ? Math.round((grossProfit / totalRevenue) * 10000) / 100 : 0 },
      { category: 'Operating Expenses', amount: Math.round(operatingExpenses * 100) / 100, percentage: totalRevenue > 0 ? Math.round((operatingExpenses / totalRevenue) * 10000) / 100 : 0 },
      { category: 'Net Profit', amount: Math.round(netProfit * 100) / 100, percentage: totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 10000) / 100 : 0 },
    ]
    return reportResponse('profit_loss', columns, rows, { totalRevenue: Math.round(totalRevenue * 100) / 100, grossProfit: Math.round(grossProfit * 100) / 100, netProfit: Math.round(netProfit * 100) / 100, profitMargin: totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 10000) / 100 : 0 }, dateFrom, dateTo)
  } catch { return reportResponse('profit_loss', [], [], { totalRevenue: 0, grossProfit: 0, netProfit: 0, profitMargin: 0 }, dateFrom, dateTo) }
}

async function creditBillingReport(tenantId: string | null, dateFrom?: Date, dateTo?: Date) {
  try {
    const where: Record<string, unknown> = {}
    if (tenantId) where.tenantId = tenantId
    const fleets = await db.fleetAccount.findMany({ where, orderBy: { companyName: 'asc' }, take: 200 })
    const columns = ['companyName', 'creditLimit', 'currentBalance', 'availableCredit', 'paymentTerms', 'status']
    const rows = fleets.map((f) => ({ companyName: f.companyName, creditLimit: f.creditLimit, currentBalance: f.currentBalance, availableCredit: Math.round((f.creditLimit - f.currentBalance) * 100) / 100, paymentTerms: f.paymentTerms || 'N/A', status: f.status }))
    const totalCredit = fleets.reduce((s, f) => s + f.creditLimit, 0)
    const totalOutstanding = fleets.reduce((s, f) => s + f.currentBalance, 0)
    return reportResponse('credit_billing', columns, rows, { totalAccounts: fleets.length, totalCreditLimit: totalCredit, totalOutstanding: Math.round(totalOutstanding * 100) / 100 }, dateFrom, dateTo)
  } catch { return reportResponse('credit_billing', [], [], { totalAccounts: 0, totalCreditLimit: 0, totalOutstanding: 0 }, dateFrom, dateTo) }
}

async function taxReport(stationId: string | null, tenantId: string | null, dateFrom?: Date, dateTo?: Date) {
  try {
    const tWhere = buildWhere(stationId, dateFrom, dateTo, 'date') as Record<string, unknown>
    tWhere.status = 'completed'
    if (tenantId) tWhere.tenantId = tenantId
    const transactions = await db.transaction.findMany({ where: tWhere, take: 5000 })
    const totalRevenue = transactions.reduce((s, t) => s + t.amount, 0)
    const gstRate = 17
    const gstAmount = Math.round(totalRevenue * gstRate / (100 + gstRate) * 100) / 100
    const columns = ['category', 'totalAmount', 'taxRate', 'taxAmount']
    const rows = [
      { category: 'Fuel Sales GST', totalAmount: Math.round(totalRevenue * 100) / 100, taxRate: gstRate, taxAmount: gstAmount },
    ]
    return reportResponse('tax_report', columns, rows, { totalRevenue: Math.round(totalRevenue * 100) / 100, totalGST: gstAmount, transactionCount: transactions.length }, dateFrom, dateTo)
  } catch { return reportResponse('tax_report', [], [], { totalRevenue: 0, totalGST: 0, transactionCount: 0 }, dateFrom, dateTo) }
}

async function apAgingReport(tenantId: string | null, _dateFrom?: Date, _dateTo?: Date) {
  try {
    const where: Record<string, unknown> = {}
    if (tenantId) where.tenantId = tenantId
    where.status = { in: ['pending', 'approved'] }
    const expenses = await db.expense.findMany({ where, take: 500, include: { supplier: { select: { name: true } } } })
    const columns = ['supplierName', 'category', 'amount', 'status', 'date']
    const rows = expenses.map((e) => ({ supplierName: (e.supplier as { name: string } | null)?.name || 'N/A', category: e.category, amount: e.amount, status: e.status, date: e.date.toISOString() }))
    const totalPayable = expenses.reduce((s, e) => s + e.amount, 0)
    return reportResponse('ap_aging', columns, rows, { totalPayable: Math.round(totalPayable * 100) / 100, currentBuckets: expenses.filter((e) => e.status === 'pending').length, overdueBuckets: 0 }, _dateFrom, _dateTo)
  } catch { return reportResponse('ap_aging', [], [], { totalPayable: 0, currentBuckets: 0, overdueBuckets: 0 }, _dateFrom, _dateTo) }
}

async function arAgingReport(tenantId: string | null, _dateFrom?: Date, _dateTo?: Date) {
  try {
    const where: Record<string, unknown> = {}
    if (tenantId) where.tenantId = tenantId
    const fleets = await db.fleetAccount.findMany({ where, orderBy: { companyName: 'asc' }, take: 200 })
    const columns = ['companyName', 'currentBalance', 'creditLimit', 'paymentTerms', 'status']
    const rows = fleets.filter((f) => f.currentBalance > 0).map((f) => ({ companyName: f.companyName, currentBalance: f.currentBalance, creditLimit: f.creditLimit, paymentTerms: f.paymentTerms || 'N/A', status: f.status }))
    const totalReceivable = rows.reduce((s, r) => s + r.currentBalance, 0)
    return reportResponse('ar_aging', columns, rows, { totalReceivable: Math.round(totalReceivable * 100) / 100, totalAccounts: rows.length }, _dateFrom, _dateTo)
  } catch { return reportResponse('ar_aging', [], [], { totalReceivable: 0, totalAccounts: 0 }, _dateFrom, _dateTo) }
}

async function shiftHandoverReport(stationId: string | null, dateFrom?: Date, dateTo?: Date) {
  try {
    const where = buildWhere(stationId, dateFrom, dateTo, 'openedAt') as Record<string, unknown>
    const shifts = await db.shift.findMany({ where, orderBy: { openedAt: 'desc' }, take: 200 })
    const columns = ['shiftNumber', 'openedAt', 'closedAt', 'openingCash', 'closingCash', 'cashVariance', 'totalSales', 'status']
    const rows = shifts.map((s) => ({
      shiftNumber: s.shiftNumber, openedAt: s.openedAt.toISOString(), closedAt: s.closedAt?.toISOString() || 'Open',
      openingCash: (s as Record<string, unknown>).openingCash || 0, closingCash: (s as Record<string, unknown>).closingCash || 0,
      cashVariance: Math.round(((s as Record<string, unknown>).closingCash as number || 0) - ((s as Record<string, unknown>).openingCash as number || 0) - s.cashSales) * 100 / 100,
      totalSales: s.totalSales, status: s.status,
    }))
    return reportResponse('shift_handover', columns, rows, { totalShifts: shifts.length, totalSales: Math.round(shifts.reduce((s, sh) => s + sh.totalSales, 0) * 100) / 100 }, dateFrom, dateTo)
  } catch { return reportResponse('shift_handover', [], [], { totalShifts: 0, totalSales: 0 }, dateFrom, dateTo) }
}

async function dispenserUptimeReport(stationId: string | null, _dateFrom?: Date, _dateTo?: Date) {
  try {
    const where = stationId ? { stationId } : {}
    const dispensers = await db.dispenser.findMany({ where, orderBy: { name: 'asc' } })
    const columns = ['name', 'code', 'fuelType', 'status', 'nozzleCount', 'location']
    const rows = dispensers.map((d) => ({ name: d.name, code: d.code || 'N/A', fuelType: d.fuelType || 'N/A', status: d.status, nozzleCount: d.nozzleCount || 0, location: d.location || 'N/A' }))
    return reportResponse('dispenser_uptime', columns, rows, { totalDispensers: dispensers.length, activeDispensers: dispensers.filter((d) => d.status === 'active').length, inactiveDispensers: dispensers.filter((d) => d.status !== 'active').length }, _dateFrom, _dateTo)
  } catch { return reportResponse('dispenser_uptime', [], [], { totalDispensers: 0, activeDispensers: 0, inactiveDispensers: 0 }, _dateFrom, _dateTo) }
}

async function creditLedgerReport(tenantId: string | null, _dateFrom?: Date, _dateTo?: Date) {
  try {
    const where: Record<string, unknown> = {}
    if (tenantId) where.tenantId = tenantId
    const fleets = await db.fleetAccount.findMany({ where, orderBy: { companyName: 'asc' }, take: 200 })
    const columns = ['companyName', 'creditLimit', 'currentBalance', 'availableCredit', 'paymentTerms', 'status']
    const rows = fleets.map((f) => ({ companyName: f.companyName, creditLimit: f.creditLimit, currentBalance: f.currentBalance, availableCredit: Math.round((f.creditLimit - f.currentBalance) * 100) / 100, paymentTerms: f.paymentTerms || 'N/A', status: f.status }))
    return reportResponse('credit_ledger', columns, rows, { totalAccounts: fleets.length, totalOutstanding: Math.round(fleets.reduce((s, f) => s + f.currentBalance, 0) * 100) / 100 }, _dateFrom, _dateTo)
  } catch { return reportResponse('credit_ledger', [], [], { totalAccounts: 0, totalOutstanding: 0 }, _dateFrom, _dateTo) }
}

async function redemptionReport(tenantId: string | null, _dateFrom?: Date, _dateTo?: Date) {
  try {
    const where: Record<string, unknown> = {}
    if (tenantId) where.tenantId = tenantId
    const promotions = await db.promotion.findMany({ where, orderBy: { createdAt: 'desc' }, take: 200 })
    const columns = ['name', 'type', 'discountValue', 'startDate', 'endDate', 'status']
    const rows = promotions.map((p) => ({ name: p.name, type: p.type || 'N/A', discountValue: p.discountValue, startDate: p.startDate?.toISOString() || 'N/A', endDate: p.endDate?.toISOString() || 'N/A', status: p.status }))
    return reportResponse('redemption', columns, rows, { totalPromotions: promotions.length, activePromotions: promotions.filter((p) => p.status === 'active').length }, _dateFrom, _dateTo)
  } catch { return reportResponse('redemption', [], [], { totalPromotions: 0, activePromotions: 0 }, _dateFrom, _dateTo) }
}

async function ograComplianceReport(stationId: string | null, _dateFrom?: Date, _dateTo?: Date) {
  try {
    const where = stationId ? { stationId } : {}
    const tanks = await db.tank.findMany({ where, orderBy: { name: 'asc' } })
    const recons = await db.reconciliation.findMany({ where, orderBy: { date: 'desc' }, take: 100, include: { tank: { select: { name: true, fuelType: true } } } })
    const columns = ['tankName', 'fuelType', 'date', 'variance', 'variancePercentage', 'status']
    const rows = recons.map((r) => ({ tankName: r.tank?.name || 'Unknown', fuelType: r.tank?.fuelType || 'N/A', date: r.date.toISOString(), variance: Math.round(r.variance * 100) / 100, variancePercentage: Math.round(r.variancePercentage * 100) / 100, status: r.status }))
    return reportResponse('ogra_compliance', columns, rows, { totalTanks: tanks.length, totalReconciliationRecords: recons.length, complianceRate: recons.length > 0 ? Math.round((recons.filter((r) => Math.abs(r.variancePercentage) < 0.5).length / recons.length) * 10000) / 100 : 100 }, _dateFrom, _dateTo)
  } catch { return reportResponse('ogra_compliance', [], [], { totalTanks: 0, totalReconciliationRecords: 0, complianceRate: 0 }, _dateFrom, _dateTo) }
}

async function calibrationReport(stationId: string | null, _dateFrom?: Date, _dateTo?: Date) {
  try {
    const where = stationId ? { stationId } : {}
    const calibrations = await db.calibration.findMany({ where, orderBy: { createdAt: 'desc' }, take: 200 })
    const columns = ['deviceName', 'deviceType', 'calibrationDate', 'nextDueDate', 'result', 'performedBy', 'status']
    const rows = calibrations.map((c) => ({ deviceName: c.deviceName || 'N/A', deviceType: c.deviceType || 'N/A', calibrationDate: c.calibrationDate?.toISOString() || c.createdAt.toISOString(), nextDueDate: c.nextDueDate?.toISOString() || 'N/A', result: c.result || 'N/A', performedBy: c.performedBy || 'N/A', status: c.status }))
    return reportResponse('calibration', columns, rows, { totalCalibrations: calibrations.length, compliant: calibrations.filter((c) => c.status === 'passed' || c.status === 'compliant').length, pending: calibrations.filter((c) => c.status === 'pending').length }, _dateFrom, _dateTo)
  } catch { return reportResponse('calibration', [], [], { totalCalibrations: 0, compliant: 0, pending: 0 }, _dateFrom, _dateTo) }
}

// Keep existing POST handler for templates and scheduled reports
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action } = body
    switch (action) {
      case 'create_template': {
        const { tenantId, name, description, reportType, category, dataSource, columns, filters, groupBy, sortBy, chartType, isPublic, createdBy } = body
        if (!tenantId || !name || !reportType || !dataSource || !columns) {
          return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }
        const template = await db.reportTemplate.create({
          data: { tenantId, name, description: description || null, reportType, category: category || null, dataSource, columns, filters: filters || null, groupBy: groupBy || null, sortBy: sortBy || null, chartType: chartType || null, isSystem: false, isPublic: isPublic || false, createdBy: createdBy || null },
        })
        return NextResponse.json({ template }, { status: 201 })
      }
      case 'schedule_report': {
        const { tenantId, reportTemplateId, scheduleType, scheduleTime, scheduleDay, recipients, format } = body
        if (!tenantId || !reportTemplateId || !scheduleType || !recipients) {
          return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }
        const scheduled = await db.scheduledReport.create({
          data: { tenantId, reportTemplateId, scheduleType, scheduleTime: scheduleTime || null, scheduleDay: scheduleDay || null, recipients, format: format || 'pdf' },
        })
        return NextResponse.json({ scheduled }, { status: 201 })
      }
      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error) {
    console.error('Reports POST error:', error)
    return NextResponse.json({ error: 'Failed to process report action' }, { status: 500 })
  }
}
