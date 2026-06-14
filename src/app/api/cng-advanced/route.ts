import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const station = await db.station.findFirst({
      where: { stationType: { in: ['cng', 'hybrid'] } },
      orderBy: { createdAt: 'asc' },
    })

    if (!station) {
      return NextResponse.json(
        { error: 'No CNG or hybrid station found' },
        { status: 404 }
      )
    }

    const [compressors, storages] = await Promise.all([
      db.cNGCompressor.findMany({
        where: { stationId: station.id },
        orderBy: { createdAt: 'desc' },
      }),
      db.cNGStorage.findMany({
        where: { stationId: station.id },
        orderBy: { createdAt: 'desc' },
      }),
    ])

    return NextResponse.json({
      station: {
        id: station.id,
        name: station.name,
        code: station.code,
        stationType: station.stationType,
      },
      compressors,
      storages,
    })
  } catch (error) {
    console.error('CNG Advanced GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch CNG data' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'start_compressor': {
        const { compressorId } = body
        if (!compressorId) {
          return NextResponse.json(
            { error: 'compressorId is required' },
            { status: 400 }
          )
        }

        const compressor = await db.cNGCompressor.findUnique({
          where: { id: compressorId },
        })

        if (!compressor) {
          return NextResponse.json(
            { error: 'Compressor not found' },
            { status: 404 }
          )
        }

        if (compressor.status === 'compressing') {
          return NextResponse.json(
            { error: 'Compressor is already compressing' },
            { status: 409 }
          )
        }

        const updated = await db.cNGCompressor.update({
          where: { id: compressorId },
          data: {
            status: 'compressing',
            motorStatus: 'on',
          },
        })

        return NextResponse.json({ compressor: updated })
      }

      case 'stop_compressor': {
        const { compressorId } = body
        if (!compressorId) {
          return NextResponse.json(
            { error: 'compressorId is required' },
            { status: 400 }
          )
        }

        const compressor = await db.cNGCompressor.findUnique({
          where: { id: compressorId },
        })

        if (!compressor) {
          return NextResponse.json(
            { error: 'Compressor not found' },
            { status: 404 }
          )
        }

        if (compressor.status === 'idle') {
          return NextResponse.json(
            { error: 'Compressor is already idle' },
            { status: 409 }
          )
        }

        const updated = await db.cNGCompressor.update({
          where: { id: compressorId },
          data: {
            status: 'idle',
            motorStatus: 'off',
          },
        })

        return NextResponse.json({ compressor: updated })
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}. Valid actions: start_compressor, stop_compressor` },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('CNG Advanced POST error:', error)
    return NextResponse.json(
      { error: 'Failed to process CNG action' },
      { status: 500 }
    )
  }
}
