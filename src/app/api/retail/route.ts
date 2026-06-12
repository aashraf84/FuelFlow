import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const stationId = searchParams.get('stationId')
    const category = searchParams.get('category')

    const where: Record<string, unknown> = { isActive: true }
    if (stationId) where.stationId = stationId
    if (category) where.category = category

    const [products, carWashSessions, lotterySales, lubricantProducts] = await Promise.all([
      db.retailProduct.findMany({
        where,
        include: {
          station: {
            select: { id: true, name: true, code: true },
          },
        },
        orderBy: [{ category: 'asc' }, { name: 'asc' }],
      }),
      db.carWashSession.findMany({
        where: stationId ? { stationId } : {},
        select: { id: true, washType: true, amount: true, paymentMethod: true, status: true, startedAt: true, vehiclePlate: true },
        orderBy: { startedAt: 'desc' },
        take: 20,
      }),
      db.lotterySale.findMany({
        where: stationId ? { stationId } : {},
        select: { id: true, gameType: true, ticketCount: true, saleAmount: true, commission: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      db.lubricantProduct.findMany({
        where: stationId ? { stationId, isActive: true } : { isActive: true },
        include: {
          station: { select: { id: true, name: true, code: true } },
        },
        orderBy: [{ category: 'asc' }, { name: 'asc' }],
      }),
    ])

    const productsWithStatus = products.map((product) => ({
      ...product,
      stockStatus:
        product.stockQty <= 0
          ? 'out_of_stock'
          : product.stockQty <= product.minStock
            ? 'low_stock'
            : 'in_stock',
    }))

    // Car wash summary
    const carWashSummary = {
      totalSessions: carWashSessions.length,
      totalRevenue: carWashSessions.reduce((sum, s) => sum + s.amount, 0),
      byType: {
        basic: carWashSessions.filter(s => s.washType === 'basic').length,
        premium: carWashSessions.filter(s => s.washType === 'premium').length,
        deluxe: carWashSessions.filter(s => s.washType === 'deluxe').length,
      },
    }

    // Lottery summary
    const lotterySummary = {
      totalSales: lotterySales.length,
      totalRevenue: lotterySales.reduce((sum, s) => sum + s.saleAmount, 0),
      totalCommission: lotterySales.reduce((sum, s) => sum + s.commission, 0),
      totalTickets: lotterySales.reduce((sum, s) => sum + s.ticketCount, 0),
    }

    return NextResponse.json({
      products: productsWithStatus,
      lubricantProducts,
      carWash: {
        sessions: carWashSessions,
        summary: carWashSummary,
      },
      lottery: {
        sales: lotterySales,
        summary: lotterySummary,
      },
    })
  } catch (error) {
    console.error('Retail GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch retail data' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      stationId,
      name,
      sku,
      category,
      barcode,
      price,
      costPrice,
      stockQty,
      minStock,
      unit,
    } = body

    if (!stationId || !name || !price) {
      return NextResponse.json(
        { error: 'stationId, name, and price are required' },
        { status: 400 }
      )
    }

    const product = await db.retailProduct.create({
      data: {
        stationId,
        name,
        sku,
        category,
        barcode,
        price: parseFloat(String(price)),
        costPrice: costPrice ? parseFloat(String(costPrice)) : null,
        stockQty: stockQty ? parseInt(String(stockQty), 10) : 0,
        minStock: minStock ? parseInt(String(minStock), 10) : 5,
        unit: unit || 'piece',
      },
      include: {
        station: { select: { id: true, name: true, code: true } },
      },
    })

    return NextResponse.json({ product }, { status: 201 })
  } catch (error) {
    console.error('Retail POST error:', error)
    return NextResponse.json(
      { error: 'Failed to create retail product' },
      { status: 500 }
    )
  }
}
