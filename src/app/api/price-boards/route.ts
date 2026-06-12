import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const boards = await db.priceBoard.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json({ boards })
  } catch (error) {
    console.error('Price Boards GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch price boards' }, { status: 500 })
  }
}
