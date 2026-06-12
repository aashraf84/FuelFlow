import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const readers = await db.rFIDReader.findMany({
      where: { isActive: true },
      orderBy: { code: 'asc' },
    })
    return NextResponse.json({ readers })
  } catch (error) {
    console.error('RFID Readers GET error:', error)
    return NextResponse.json({ readers: [] })
  }
}
