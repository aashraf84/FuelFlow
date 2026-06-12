import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const cameras = await db.aNPRCamera.findMany({
      where: { isActive: true },
      orderBy: { code: 'asc' },
    })
    return NextResponse.json({ cameras })
  } catch (error) {
    console.error('ANPR Cameras GET error:', error)
    return NextResponse.json({ cameras: [] })
  }
}
