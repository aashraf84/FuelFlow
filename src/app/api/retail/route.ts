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

    const products = await db.retailProduct.findMany({
      where,
      include: {
        station: {
          select: { id: true, name: true, code: true },
        },
      },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    })

    const productsWithStatus = products.map((product) => ({
      ...product,
      stockStatus:
        product.stockQty <= 0
          ? 'out_of_stock'
          : product.stockQty <= product.minStock
            ? 'low_stock'
            : 'in_stock',
    }))

    return NextResponse.json({ products: productsWithStatus })
  } catch (error) {
    console.error('Retail GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch retail products' },
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
