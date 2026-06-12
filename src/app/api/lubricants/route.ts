import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const stationId = searchParams.get('stationId')

    const where: Record<string, unknown> = { isActive: true }
    if (stationId) where.stationId = stationId

    const products = await db.lubricantProduct.findMany({
      where,
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    })

    return NextResponse.json({ products })
  } catch (error) {
    console.error('Lubricants GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch lubricants' }, { status: 500 })
  }
}
