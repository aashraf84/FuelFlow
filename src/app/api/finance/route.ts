import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const stationId = searchParams.get('stationId')
    const period = searchParams.get('period') || 'month' // today, week, month, year

    const now = new Date()
    let startDate: Date

    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        break
      case 'week':
        startDate = new Date(now)
        startDate.setDate(startDate.getDate() - startDate.getDay())
        startDate.setHours(0, 0, 0, 0)
        break
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1)
        break
      default: // month
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    }

    const transactionWhere: Record<string, unknown> = {
      date: { gte: startDate },
      status: 'completed',
    }
    if (stationId) transactionWhere.stationId = stationId

    const expenseWhere: Record<string, unknown> = {
      date: { gte: startDate },
      status: { in: ['approved', 'paid'] },
    }
    if (stationId) expenseWhere.stationId = stationId

    // Fetch transactions, expenses, fueling revenue, supplier invoices, purchase orders, payroll in parallel
    const [transactions, expenses, fuelingRevenue, supplierInvoices, purchaseOrders, payrollRecords] = await Promise.all([
      db.transaction.findMany({
        where: transactionWhere,
        select: { type: true, category: true, amount: true, date: true },
      }),
      db.expense.findMany({
        where: expenseWhere,
        select: { category: true, amount: true, date: true },
      }),
      db.fueling.findMany({
        where: {
          status: 'completed',
          startedAt: { gte: startDate },
          ...(stationId ? { stationId } : {}),
        },
        select: { totalAmount: true, fuelType: true },
      }),
      db.supplierInvoice.findMany({
        where: {
          ...(stationId ? { stationId } : {}),
          invoiceDate: { gte: startDate },
        },
        select: { totalAmount: true, netAmount: true, paidAmount: true, status: true },
      }),
      db.purchaseOrder.findMany({
        where: {
          ...(stationId ? { stationId } : {}),
          orderDate: { gte: startDate },
        },
        select: { totalAmount: true, status: true },
      }),
      db.payrollRecord.findMany({
        where: {
          ...(stationId ? { stationId } : {}),
          periodStart: { gte: startDate },
        },
        select: { netPay: true, status: true },
      }),
    ])

    // Calculate totals
    const totalIncome = transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)

    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)
    const totalFuelRevenue = fuelingRevenue.reduce((sum, f) => sum + f.totalAmount, 0)
    const totalPayrollCosts = payrollRecords.reduce((sum, p) => sum + p.netPay, 0)

    // Supplier invoice summary
    const invoicesPending = supplierInvoices.filter(i => i.status === 'pending' || i.status === 'approved')
    const invoicesPaid = supplierInvoices.filter(i => i.status === 'paid')
    const totalInvoicePending = invoicesPending.reduce((sum, i) => sum + i.netAmount - i.paidAmount, 0)
    const totalInvoicePaid = invoicesPaid.reduce((sum, i) => sum + i.paidAmount, 0)

    // Purchase order summary
    const poOpen = purchaseOrders.filter(p => p.status !== 'received' && p.status !== 'cancelled')
    const totalPOOpen = poOpen.reduce((sum, p) => sum + p.totalAmount, 0)

    // Net profit calculation (income - expenses - payroll)
    const profit = totalIncome - totalExpenses - totalPayrollCosts

    // Breakdown by category
    const incomeByCategory: Record<string, number> = {}
    for (const t of transactions.filter((t) => t.type === 'income')) {
      incomeByCategory[t.category] = (incomeByCategory[t.category] || 0) + t.amount
    }

    const expenseByCategory: Record<string, number> = {}
    for (const e of expenses) {
      expenseByCategory[e.category] = (expenseByCategory[e.category] || 0) + e.amount
    }

    // Fuel revenue breakdown by type
    const fuelRevenueByType: Record<string, number> = {}
    for (const f of fuelingRevenue) {
      fuelRevenueByType[f.fuelType] = (fuelRevenueByType[f.fuelType] || 0) + f.totalAmount
    }

    return NextResponse.json({
      period,
      startDate,
      summary: {
        totalIncome: Math.round(totalIncome * 100) / 100,
        totalExpenses: Math.round(totalExpenses * 100) / 100,
        profit: Math.round(profit * 100) / 100,
        totalFuelRevenue: Math.round(totalFuelRevenue * 100) / 100,
        profitMargin: totalIncome > 0
          ? Math.round((profit / totalIncome) * 1000) / 10
          : 0,
        payrollCosts: Math.round(totalPayrollCosts * 100) / 100,
        netProfit: Math.round(profit * 100) / 100,
      },
      incomeByCategory,
      expenseByCategory,
      fuelRevenueByType,
      supplierInvoices: {
        totalPending: Math.round(totalInvoicePending * 100) / 100,
        totalPaid: Math.round(totalInvoicePaid * 100) / 100,
        pendingCount: invoicesPending.length,
        paidCount: invoicesPaid.length,
      },
      purchaseOrders: {
        totalOpen: Math.round(totalPOOpen * 100) / 100,
        openCount: poOpen.length,
      },
      payroll: {
        totalCost: Math.round(totalPayrollCosts * 100) / 100,
        recordCount: payrollRecords.length,
        paidCount: payrollRecords.filter(p => p.status === 'paid').length,
        pendingCount: payrollRecords.filter(p => p.status === 'pending').length,
      },
      transactionCount: transactions.length,
      expenseCount: expenses.length,
    })
  } catch (error) {
    console.error('Finance GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch financial summary' },
      { status: 500 }
    )
  }
}
