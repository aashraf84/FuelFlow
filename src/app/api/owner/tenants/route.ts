import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import {
  provisionTenantDatabase,
  generateTenantDbName,
  getTenantDatabaseStatus,
  dropTenantDatabase,
  migrateTenantSchema,
} from '@/lib/tenant-db'

// ── GET: List all tenant databases with status ──

export async function GET() {
  try {
    const tenants = await db.tenantDatabase.findMany({
      include: {
        client: {
          select: {
            id: true,
            companyName: true,
            slug: true,
            status: true,
            databaseStatus: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Enrich with live status for active tenants
    const enriched = await Promise.all(
      tenants.map(async (tenant) => {
        if (tenant.status === 'active') {
          try {
            const liveStatus = await getTenantDatabaseStatus(tenant.databaseName)
            return {
              ...tenant,
              liveSize: liveStatus.size,
              liveTableCount: liveStatus.tableCount,
              liveExists: liveStatus.exists,
            }
          } catch {
            return { ...tenant, liveSize: null, liveTableCount: null, liveExists: false }
          }
        }
        return { ...tenant, liveSize: null, liveTableCount: null, liveExists: false }
      })
    )

    const summary = {
      total: tenants.length,
      active: tenants.filter((t) => t.status === 'active').length,
      provisioning: tenants.filter((t) => t.status === 'provisioning' || t.status === 'provisioning_schema').length,
      pending: tenants.filter((t) => t.status === 'pending').length,
      error: tenants.filter((t) => t.status === 'error').length,
      suspended: tenants.filter((t) => t.status === 'suspended').length,
    }

    return NextResponse.json({ tenants: enriched, summary })
  } catch (error) {
    console.error('Tenants GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch tenant databases' }, { status: 500 })
  }
}

// ── POST: Provision a new tenant database for a client ──

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { clientId, force } = body

    if (!clientId) {
      return NextResponse.json({ error: 'clientId is required' }, { status: 400 })
    }

    // Check if client exists
    const client = await db.ownerClient.findUnique({
      where: { id: clientId },
      include: { tenantDatabase: true },
    })

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    // Check if tenant database already exists
    if (client.tenantDatabase && !force) {
      return NextResponse.json({
        error: 'Tenant database already exists for this client. Use force=true to reprovision.',
        existing: client.tenantDatabase,
      }, { status: 409 })
    }

    // Generate database name
    const dbName = generateTenantDbName(client.slug)

    // Create or update TenantDatabase record
    const tenantDb = await db.tenantDatabase.upsert({
      where: { clientId: client.id },
      update: {
        databaseName: dbName,
        status: 'provisioning',
        errorMessage: null,
      },
      create: {
        clientId: client.id,
        databaseName: dbName,
        databaseUrl: 'pending',
        directUrl: 'pending',
        status: 'provisioning',
      },
    })

    // Update client status
    await db.ownerClient.update({
      where: { id: clientId },
      data: { databaseStatus: 'provisioning', databaseName: dbName },
    })

    // Step 1: Provision the database in Neon + push schema
    const provisionResult = await provisionTenantDatabase(dbName)

    if (!provisionResult.success) {
      await db.tenantDatabase.update({
        where: { id: tenantDb.id },
        data: { status: 'error', errorMessage: provisionResult.error },
      })
      await db.ownerClient.update({
        where: { id: clientId },
        data: { databaseStatus: 'error' },
      })
      return NextResponse.json({
        error: 'Failed to provision database',
        details: provisionResult.error,
      }, { status: 500 })
    }

    // Update with actual URLs
    await db.tenantDatabase.update({
      where: { id: tenantDb.id },
      data: {
        databaseUrl: provisionResult.poolerUrl,
        directUrl: provisionResult.directUrl,
        status: 'provisioning_schema',
        provisionedAt: new Date(),
      },
    })

    // Step 2: If schema wasn't pushed during provisioning, push it now
    let schemaPushed = provisionResult.schemaPushed
    let tablesCreated = 0

    if (!schemaPushed) {
      await db.tenantDatabase.update({
        where: { id: tenantDb.id },
        data: { status: 'provisioning_schema' },
      })

      const migrateResult = await migrateTenantSchema(dbName)
      schemaPushed = migrateResult.success
      tablesCreated = migrateResult.tablesCreated

      if (!migrateResult.success) {
        await db.tenantDatabase.update({
          where: { id: tenantDb.id },
          data: { status: 'error', errorMessage: `Schema migration failed: ${migrateResult.error}` },
        })
        await db.ownerClient.update({
          where: { id: clientId },
          data: { databaseStatus: 'error' },
        })
        return NextResponse.json({
          error: 'Database created but schema migration failed',
          details: migrateResult.error,
          databaseName: dbName,
        }, { status: 500 })
      }
    } else {
      // Get table count
      try {
        const statusResult = await getTenantDatabaseStatus(dbName)
        tablesCreated = statusResult.tableCount || 0
      } catch {
        // Ignore
      }
    }

    // Step 3: Activate
    await db.tenantDatabase.update({
      where: { id: tenantDb.id },
      data: {
        status: 'active',
        activatedAt: new Date(),
        schemaVersion: '1.0.0',
        lastMigratedAt: new Date(),
        tableCount: tablesCreated,
        errorMessage: null,
      },
    })

    await db.ownerClient.update({
      where: { id: clientId },
      data: {
        databaseUrl: provisionResult.poolerUrl,
        databaseName: dbName,
        databaseStatus: 'active',
      },
    })

    const result = await db.tenantDatabase.findUnique({
      where: { id: tenantDb.id },
      include: { client: true },
    })

    return NextResponse.json({
      message: 'Tenant database provisioned successfully',
      tenant: result,
      tablesCreated,
    }, { status: 201 })
  } catch (error) {
    console.error('Tenant POST error:', error)
    return NextResponse.json({ error: 'Failed to provision tenant database' }, { status: 500 })
  }
}

// ── DELETE: Drop a tenant database ──

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')

    if (!clientId) {
      return NextResponse.json({ error: 'clientId is required' }, { status: 400 })
    }

    const tenantDb = await db.tenantDatabase.findUnique({
      where: { clientId },
    })

    if (!tenantDb) {
      return NextResponse.json({ error: 'Tenant database not found' }, { status: 404 })
    }

    // Drop the database from Neon
    const dropResult = await dropTenantDatabase(tenantDb.databaseName)

    if (!dropResult.success) {
      return NextResponse.json({
        error: 'Failed to drop database',
        details: dropResult.error,
      }, { status: 500 })
    }

    // Delete the tenant database record
    await db.tenantDatabase.delete({
      where: { id: tenantDb.id },
    })

    // Update client record
    await db.ownerClient.update({
      where: { id: clientId },
      data: { databaseStatus: 'pending', databaseUrl: null, databaseName: null },
    })

    return NextResponse.json({ message: 'Tenant database dropped successfully' })
  } catch (error) {
    console.error('Tenant DELETE error:', error)
    return NextResponse.json({ error: 'Failed to drop tenant database' }, { status: 500 })
  }
}
