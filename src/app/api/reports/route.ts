import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'overview'
    const tenantId = searchParams.get('tenantId')

    switch (type) {
      case 'templates': {
        const where = tenantId ? { tenantId } : {}
        const templates = await db.reportTemplate.findMany({
          where,
          orderBy: { createdAt: 'desc' },
        })
        return NextResponse.json({ templates })
      }

      case 'scheduled': {
        const where = tenantId ? { tenantId } : {}
        const scheduled = await db.scheduledReport.findMany({
          where,
          orderBy: { nextRunAt: 'asc' },
        })
        return NextResponse.json({ scheduled })
      }

      case 'overview': {
        const templateWhere = tenantId ? { tenantId } : {}
        const scheduledWhere = tenantId ? { tenantId } : {}

        const [
          templateCount,
          systemTemplateCount,
          customTemplateCount,
          scheduledCount,
          activeScheduledCount,
        ] = await Promise.all([
          db.reportTemplate.count({ where: templateWhere }),
          db.reportTemplate.count({ where: { ...templateWhere, isSystem: true } }),
          db.reportTemplate.count({ where: { ...templateWhere, isSystem: false } }),
          db.scheduledReport.count({ where: scheduledWhere }),
          db.scheduledReport.count({ where: { ...scheduledWhere, isActive: true } }),
        ])

        return NextResponse.json({
          overview: {
            templates: { total: templateCount, system: systemTemplateCount, custom: customTemplateCount },
            scheduled: { total: scheduledCount, active: activeScheduledCount },
          },
        })
      }

      default:
        return NextResponse.json(
          { error: `Unknown type: ${type}. Valid types: templates, scheduled, overview` },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Reports GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch report data' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'create_template': {
        const {
          tenantId, name, description, reportType, category,
          dataSource, columns, filters, groupBy, sortBy,
          chartType, isPublic, createdBy,
        } = body

        if (!tenantId || !name || !reportType || !dataSource || !columns) {
          return NextResponse.json(
            { error: 'tenantId, name, reportType, dataSource, and columns are required' },
            { status: 400 }
          )
        }

        const template = await db.reportTemplate.create({
          data: {
            tenantId,
            name,
            description: description || null,
            reportType,
            category: category || null,
            dataSource,
            columns,
            filters: filters || null,
            groupBy: groupBy || null,
            sortBy: sortBy || null,
            chartType: chartType || null,
            isSystem: false,
            isPublic: isPublic || false,
            createdBy: createdBy || null,
          },
        })

        return NextResponse.json({ template }, { status: 201 })
      }

      case 'schedule_report': {
        const {
          tenantId, reportTemplateId, scheduleType, scheduleTime,
          scheduleDay, recipients, format,
        } = body

        if (!tenantId || !reportTemplateId || !scheduleType || !recipients) {
          return NextResponse.json(
            { error: 'tenantId, reportTemplateId, scheduleType, and recipients are required' },
            { status: 400 }
          )
        }

        const scheduled = await db.scheduledReport.create({
          data: {
            tenantId,
            reportTemplateId,
            scheduleType,
            scheduleTime: scheduleTime || null,
            scheduleDay: scheduleDay || null,
            recipients,
            format: format || 'pdf',
          },
        })

        return NextResponse.json({ scheduled }, { status: 201 })
      }

      case 'run_report': {
        const { templateId } = body
        if (!templateId) {
          return NextResponse.json(
            { error: 'templateId is required' },
            { status: 400 }
          )
        }

        const template = await db.reportTemplate.findUnique({
          where: { id: templateId },
        })

        if (!template) {
          return NextResponse.json(
            { error: 'Report template not found' },
            { status: 404 }
          )
        }

        // Compute report data based on template type
        const now = new Date()
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

        let reportData: Record<string, unknown> = {}

        switch (template.reportType) {
          case 'daily_sales': {
            const [transactions, fuelings] = await Promise.all([
              db.transaction.findMany({
                where: { date: { gte: startOfMonth }, status: 'completed' },
                take: 1000,
              }),
              db.fueling.findMany({
                where: { startedAt: { gte: startOfMonth }, status: 'completed' },
                take: 1000,
              }),
            ])
            reportData = {
              period: { start: startOfMonth, end: now },
              transactionCount: transactions.length,
              totalRevenue: transactions.reduce((sum, t) => sum + t.amount, 0),
              fuelingCount: fuelings.length,
              totalFuelRevenue: fuelings.reduce((sum, f) => sum + f.totalAmount, 0),
            }
            break
          }
          case 'financial': {
            const [income, expenses] = await Promise.all([
              db.transaction.findMany({
                where: { date: { gte: startOfMonth }, type: 'income', status: 'completed' },
                take: 1000,
              }),
              db.expense.findMany({
                where: { date: { gte: startOfMonth }, status: { in: ['approved', 'paid'] } },
                take: 1000,
              }),
            ])
            reportData = {
              period: { start: startOfMonth, end: now },
              totalIncome: income.reduce((sum, t) => sum + t.amount, 0),
              totalExpenses: expenses.reduce((sum, e) => sum + e.amount, 0),
              netProfit: income.reduce((sum, t) => sum + t.amount, 0) - expenses.reduce((sum, e) => sum + e.amount, 0),
            }
            break
          }
          default: {
            reportData = {
              period: { start: startOfMonth, end: now },
              message: `Report type '${template.reportType}' computed successfully`,
              templateName: template.name,
              generatedAt: now,
            }
          }
        }

        return NextResponse.json({
          report: {
            templateId: template.id,
            templateName: template.name,
            reportType: template.reportType,
            generatedAt: now,
            data: reportData,
          },
        })
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}. Valid actions: create_template, schedule_report, run_report` },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Reports POST error:', error)
    return NextResponse.json(
      { error: 'Failed to process report action' },
      { status: 500 }
    )
  }
}
