import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const stationId = searchParams.get('stationId') || undefined
    const forecastType = searchParams.get('forecastType') || undefined
    const fuelType = searchParams.get('fuelType') || undefined
    const days = parseInt(searchParams.get('days') || '7', 10)

    const now = new Date()
    const periodStart = new Date()
    periodStart.setDate(periodStart.getDate() - days)
    periodStart.setHours(0, 0, 0, 0)

    // Build where clause for forecasts
    const forecastWhere: Record<string, unknown> = {
      periodStart: { gte: periodStart },
    }
    if (stationId) forecastWhere.stationId = stationId
    if (forecastType) forecastWhere.forecastType = forecastType
    if (fuelType) forecastWhere.fuelType = fuelType

    // Fetch forecast records
    const forecasts = await db.aIForecast.findMany({
      where: forecastWhere,
      orderBy: { periodStart: 'asc' },
    })

    // Build where clause for fuelings (actual data)
    const fuelingWhere: Record<string, unknown> = {
      startedAt: { gte: periodStart },
      status: 'completed',
    }
    if (stationId) fuelingWhere.stationId = stationId
    if (fuelType) fuelingWhere.fuelType = fuelType

    // Fetch fueling records for actual values
    const fuelings = await db.fueling.findMany({
      where: fuelingWhere,
      select: {
        startedAt: true,
        volume: true,
        fuelType: true,
      },
    })

    // Generate chart data: one entry per day in the range
    const chartData: { day: string; actual: number; predicted: number }[] = []

    // Helper to format a Date as YYYY-MM-DD
    const formatDay = (d: Date): string => {
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return `${y}-${m}-${day}`
    }

    // Build lookup maps for quick access
    const actualByDay = new Map<string, number>()
    for (const f of fuelings) {
      const dayKey = formatDay(new Date(f.startedAt))
      actualByDay.set(dayKey, (actualByDay.get(dayKey) || 0) + f.volume)
    }

    const predictedByDay = new Map<string, number>()
    for (const f of forecasts) {
      // Use periodStart to determine which day the forecast belongs to
      const dayKey = formatDay(new Date(f.periodStart))
      predictedByDay.set(dayKey, (predictedByDay.get(dayKey) || 0) + f.predictedValue)
    }

    // Build chart data for each day in the range
    for (let i = 0; i <= days; i++) {
      const d = new Date(periodStart)
      d.setDate(d.getDate() + i)
      const dayKey = formatDay(d)

      chartData.push({
        day: dayKey,
        actual: Math.round((actualByDay.get(dayKey) || 0) * 100) / 100,
        predicted: Math.round((predictedByDay.get(dayKey) || 0) * 100) / 100,
      })
    }

    // Build summary
    const totalPredicted = forecasts.reduce((sum, f) => sum + f.predictedValue, 0)
    const avgConfidence =
      forecasts.length > 0
        ? forecasts.reduce((sum, f) => sum + f.confidence, 0) / forecasts.length
        : 0
    const forecastTypes = [...new Set(forecasts.map((f) => f.forecastType))]

    const summary = {
      totalPredicted: Math.round(totalPredicted * 100) / 100,
      avgConfidence: Math.round(avgConfidence * 100) / 100,
      forecastTypes,
    }

    return NextResponse.json({
      forecasts,
      chartData,
      summary,
    })
  } catch (error) {
    console.error('AI Forecasts GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch AI forecasts' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      tenantId,
      stationId,
      forecastType,
      fuelType,
      predictedValue,
      confidence,
      periodStart,
      periodEnd,
    } = body

    // Validate required fields
    if (!tenantId) {
      return NextResponse.json(
        { error: 'tenantId is required' },
        { status: 400 }
      )
    }
    if (!stationId) {
      return NextResponse.json(
        { error: 'stationId is required' },
        { status: 400 }
      )
    }
    if (!forecastType) {
      return NextResponse.json(
        { error: 'forecastType is required' },
        { status: 400 }
      )
    }
    if (predictedValue === undefined || predictedValue === null) {
      return NextResponse.json(
        { error: 'predictedValue is required' },
        { status: 400 }
      )
    }
    if (confidence === undefined || confidence === null) {
      return NextResponse.json(
        { error: 'confidence is required' },
        { status: 400 }
      )
    }
    if (!periodStart) {
      return NextResponse.json(
        { error: 'periodStart is required' },
        { status: 400 }
      )
    }
    if (!periodEnd) {
      return NextResponse.json(
        { error: 'periodEnd is required' },
        { status: 400 }
      )
    }

    const forecast = await db.aIForecast.create({
      data: {
        tenantId,
        stationId,
        forecastType,
        fuelType: fuelType || null,
        predictedValue: parseFloat(String(predictedValue)),
        confidence: parseFloat(String(confidence)),
        periodStart: new Date(periodStart),
        periodEnd: new Date(periodEnd),
      },
    })

    return NextResponse.json({ forecast }, { status: 201 })
  } catch (error) {
    console.error('AI Forecasts POST error:', error)
    return NextResponse.json(
      { error: 'Failed to create AI forecast' },
      { status: 500 }
    )
  }
}
