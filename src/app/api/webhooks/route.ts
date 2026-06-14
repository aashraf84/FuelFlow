import { randomBytes, createHash } from 'crypto'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'overview'
    const tenantId = searchParams.get('tenantId')

    switch (type) {
      case 'keys': {
        const where = tenantId ? { tenantId } : {}
        const keys = await db.aPIKey.findMany({
          where,
          orderBy: { createdAt: 'desc' },
        })
        return NextResponse.json({ keys })
      }

      case 'endpoints': {
        const where = tenantId ? { tenantId } : {}
        const endpoints = await db.webhookEndpoint.findMany({
          where,
          include: {
            _count: { select: { deliveries: true } },
          },
          orderBy: { createdAt: 'desc' },
        })
        const enriched = endpoints.map((ep) => ({
          id: ep.id,
          tenantId: ep.tenantId,
          url: ep.url,
          name: ep.name,
          events: ep.events,
          isActive: ep.isActive,
          lastTriggeredAt: ep.lastTriggeredAt,
          successCount: ep.successCount,
          failureCount: ep.failureCount,
          deliveryCount: ep._count.deliveries,
          createdAt: ep.createdAt,
          updatedAt: ep.updatedAt,
        }))
        return NextResponse.json({ endpoints: enriched })
      }

      case 'deliveries': {
        const where: Record<string, unknown> = {}
        if (tenantId) {
          const endpoints = await db.webhookEndpoint.findMany({
            where: { tenantId },
            select: { id: true },
          })
          where.webhookId = { in: endpoints.map((e) => e.id) }
        }
        const deliveries = await db.webhookDelivery.findMany({
          where,
          orderBy: { deliveredAt: 'desc' },
          take: 100,
        })
        return NextResponse.json({ deliveries })
      }

      case 'overview': {
        const keyWhere = tenantId ? { tenantId } : {}
        const endpointWhere = tenantId ? { tenantId } : {}

        const endpointIds = tenantId
          ? (await db.webhookEndpoint.findMany({ where: { tenantId }, select: { id: true } })).map((e) => e.id)
          : []

        const [
          keyCount,
          activeKeyCount,
          endpointCount,
          activeEndpointCount,
          deliveryCount,
          successDeliveryCount,
          failedDeliveryCount,
        ] = await Promise.all([
          db.aPIKey.count({ where: keyWhere }),
          db.aPIKey.count({ where: { ...keyWhere, isActive: true } }),
          db.webhookEndpoint.count({ where: endpointWhere }),
          db.webhookEndpoint.count({ where: { ...endpointWhere, isActive: true } }),
          tenantId
            ? db.webhookDelivery.count({ where: { webhookId: { in: endpointIds } } })
            : db.webhookDelivery.count(),
          tenantId
            ? db.webhookDelivery.count({ where: { webhookId: { in: endpointIds }, isSuccess: true } })
            : db.webhookDelivery.count({ where: { isSuccess: true } }),
          tenantId
            ? db.webhookDelivery.count({ where: { webhookId: { in: endpointIds }, isSuccess: false } })
            : db.webhookDelivery.count({ where: { isSuccess: false } }),
        ])

        return NextResponse.json({
          overview: {
            keys: { total: keyCount, active: activeKeyCount },
            endpoints: { total: endpointCount, active: activeEndpointCount },
            deliveries: { total: deliveryCount, successful: successDeliveryCount, failed: failedDeliveryCount },
          },
        })
      }

      default:
        return NextResponse.json(
          { error: `Unknown type: ${type}. Valid types: keys, endpoints, deliveries, overview` },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Webhooks GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch webhook data' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'create_key': {
        const { tenantId, name, permissions, allowedIPs, rateLimit, createdBy, expiresAt } = body
        if (!tenantId || !name) {
          return NextResponse.json(
            { error: 'tenantId and name are required' },
            { status: 400 }
          )
        }

        // Generate a unique key hash and prefix
        const rawKey = `ff_${randomBytes(24).toString('hex')}`
        const keyHash = createHash('sha256').update(rawKey).digest('hex')
        const keyPrefix = rawKey.substring(0, 8)

        const apiKey = await db.aPIKey.create({
          data: {
            tenantId,
            keyHash,
            keyPrefix,
            name,
            permissions: permissions || null,
            allowedIPs: allowedIPs || null,
            rateLimit: rateLimit || 1000,
            createdBy: createdBy || null,
            expiresAt: expiresAt ? new Date(expiresAt) : null,
          },
        })

        return NextResponse.json({
          apiKey,
          rawKey, // Only returned once at creation
        }, { status: 201 })
      }

      case 'create_endpoint': {
        const { tenantId, url, name, events, secret } = body
        if (!tenantId || !url || !name || !events) {
          return NextResponse.json(
            { error: 'tenantId, url, name, and events are required' },
            { status: 400 }
          )
        }

        const endpoint = await db.webhookEndpoint.create({
          data: {
            tenantId,
            url,
            name,
            events,
            secret: secret || null,
          },
        })

        return NextResponse.json({ endpoint }, { status: 201 })
      }

      case 'test_endpoint': {
        const { endpointId } = body
        if (!endpointId) {
          return NextResponse.json(
            { error: 'endpointId is required' },
            { status: 400 }
          )
        }

        const endpoint = await db.webhookEndpoint.findUnique({
          where: { id: endpointId },
        })

        if (!endpoint) {
          return NextResponse.json(
            { error: 'Webhook endpoint not found' },
            { status: 404 }
          )
        }

        const delivery = await db.webhookDelivery.create({
          data: {
            webhookId: endpointId,
            event: 'test',
            payload: JSON.stringify({
              event: 'test',
              timestamp: new Date().toISOString(),
              message: 'This is a test delivery from FuelFlow OS',
            }),
            statusCode: 200,
            response: 'Test delivery created',
            isSuccess: true,
          },
        })

        // Update endpoint last triggered
        await db.webhookEndpoint.update({
          where: { id: endpointId },
          data: { lastTriggeredAt: new Date() },
        })

        return NextResponse.json({ delivery }, { status: 201 })
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}. Valid actions: create_key, create_endpoint, test_endpoint` },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Webhooks POST error:', error)
    return NextResponse.json(
      { error: 'Failed to process webhook action' },
      { status: 500 }
    )
  }
}
