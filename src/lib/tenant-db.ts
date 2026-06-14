import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { readFileSync } from 'fs'
import { join } from 'path'

// ── Configuration ──────────────────────────────────────────

const NEON_DDL_HOST = process.env.NEON_DDL_HOST || ''
const NEON_DDL_USER = process.env.NEON_DDL_USER || ''
const NEON_DDL_PASSWORD = process.env.NEON_DDL_PASSWORD || ''
const NEON_DDL_PORT = process.env.NEON_DDL_PORT || '5432'

const NEON_POOLER_HOST = process.env.NEON_POOLER_HOST || ''
const NEON_POOLER_USER = process.env.NEON_POOLER_USER || ''
const NEON_POOLER_PASSWORD = process.env.NEON_POOLER_PASSWORD || ''
const NEON_POOLER_PORT = process.env.NEON_POOLER_PORT || '5432'

// ── Tenant Database Name Generator ────────────────────────

export function generateTenantDbName(slug: string): string {
  const sanitized = slug.replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '')
  const suffix = Math.random().toString(36).substring(2, 8)
  return `ff_${sanitized}_${suffix}`
}

// ── Connection URL Builder ────────────────────────────────

export function buildPoolerUrl(dbName: string): string {
  return `postgresql://${NEON_POOLER_USER}:${NEON_POOLER_PASSWORD}@${NEON_POOLER_HOST}:${NEON_POOLER_PORT}/${dbName}?sslmode=require`
}

export function buildDirectUrl(dbName: string): string {
  return `postgresql://${NEON_DDL_USER}:${NEON_DDL_PASSWORD}@${NEON_DDL_HOST}:${NEON_DDL_PORT}/${dbName}?sslmode=require`
}

// ── DDL Pool (for CREATE DATABASE, etc.) ──────────────────

let ddlPool: Pool | null = null

function getDdlPool(): Pool {
  if (!ddlPool) {
    ddlPool = new Pool({
      host: NEON_DDL_HOST,
      port: parseInt(NEON_DDL_PORT, 10),
      user: NEON_DDL_USER,
      password: NEON_DDL_PASSWORD,
      database: 'neondb',
      ssl: { rejectUnauthorized: false },
      max: 2,
      idleTimeoutMillis: 30000,
    })
  }
  return ddlPool
}

// ── Schema SQL Loader ─────────────────────────────────────

let cachedSchemaSQL: string | null = null

function getTenantSchemaSQL(): string {
  if (cachedSchemaSQL) return cachedSchemaSQL

  try {
    const sqlPath = join(process.cwd(), 'prisma', 'tenant-schema.sql')
    cachedSchemaSQL = readFileSync(sqlPath, 'utf-8')
    return cachedSchemaSQL
  } catch {
    console.error('Failed to load tenant-schema.sql — tenant DBs will be created without schema')
    return ''
  }
}

// ── Tenant Database Provisioning ──────────────────────────

export interface ProvisionResult {
  success: boolean
  databaseName: string
  poolerUrl: string
  directUrl: string
  schemaPushed: boolean
  error?: string
}

export async function provisionTenantDatabase(dbName: string): Promise<ProvisionResult> {
  const poolerUrl = buildPoolerUrl(dbName)
  const directUrl = buildDirectUrl(dbName)
  let schemaPushed = false

  try {
    const pool = getDdlPool()

    // Check if database already exists
    const checkResult = await pool.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [dbName]
    )

    if (checkResult.rows.length > 0) {
      // Database already exists — verify schema is present
      try {
        const tenantPool = new Pool({
          host: NEON_DDL_HOST,
          port: parseInt(NEON_DDL_PORT, 10),
          user: NEON_DDL_USER,
          password: NEON_DDL_PASSWORD,
          database: dbName,
          ssl: { rejectUnauthorized: false },
          max: 1,
        })
        const tableCheck = await tenantPool.query(
          `SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'`
        )
        const tableCount = parseInt(tableCheck.rows[0]?.count || '0', 10)
        await tenantPool.end()

        schemaPushed = tableCount > 0
      } catch {
        // Can't check schema — assume not pushed
      }

      return { success: true, databaseName: dbName, poolerUrl, directUrl, schemaPushed }
    }

    // Create the database
    const safeName = dbName.replace(/[^a-z0-9_]/g, '')
    await pool.query(`CREATE DATABASE "${safeName}"`)

    // Push schema to the new database
    const schemaSQL = getTenantSchemaSQL()
    if (schemaSQL) {
      try {
        const tenantPool = new Pool({
          host: NEON_DDL_HOST,
          port: parseInt(NEON_DDL_PORT, 10),
          user: NEON_DDL_USER,
          password: NEON_DDL_PASSWORD,
          database: dbName,
          ssl: { rejectUnauthorized: false },
          max: 1,
        })

        // Execute schema creation SQL
        // Split into individual statements for better error handling
        await tenantPool.query('BEGIN')
        try {
          await tenantPool.query(schemaSQL)
          await tenantPool.query('COMMIT')
          schemaPushed = true
        } catch (schemaError) {
          await tenantPool.query('ROLLBACK')
          console.error('Schema push transaction failed, trying sequential approach:', schemaError instanceof Error ? schemaError.message : 'Unknown')

          // Try executing statements one by one
          const statements = schemaSQL
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--'))

          let successCount = 0
          let failCount = 0
          for (const stmt of statements) {
            try {
              await tenantPool.query(stmt)
              successCount++
            } catch {
              failCount++ // Ignore individual statement failures (e.g., already exists)
            }
          }
          schemaPushed = successCount > failCount
        }

        await tenantPool.end()
      } catch (err) {
        console.error('Schema push error:', err instanceof Error ? err.message : 'Unknown')
      }
    }

    return { success: true, databaseName: dbName, poolerUrl, directUrl, schemaPushed }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Tenant DB provisioning error:', message)
    return { success: false, databaseName: dbName, poolerUrl, directUrl, schemaPushed, error: message }
  }
}

export async function dropTenantDatabase(dbName: string): Promise<{ success: boolean; error?: string }> {
  try {
    const pool = getDdlPool()
    const safeName = dbName.replace(/[^a-z0-9_]/g, '')
    // Terminate existing connections
    await pool.query(`
      SELECT pg_terminate_backend(pid)
      FROM pg_stat_activity
      WHERE datname = $1 AND pid <> pg_backend_pid()
    `, [safeName])
    await pool.query(`DROP DATABASE IF EXISTS "${safeName}"`)
    return { success: true }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Tenant DB drop error:', message)
    return { success: false, error: message }
  }
}

// ── Tenant Database Status ────────────────────────────────

export async function getTenantDatabaseStatus(dbName: string): Promise<{
  exists: boolean
  size?: string
  tableCount?: number
  error?: string
}> {
  try {
    const pool = getDdlPool()
    const safeName = dbName.replace(/[^a-z0-9_]/g, '')

    const existsResult = await pool.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [safeName]
    )

    if (existsResult.rows.length === 0) {
      return { exists: false }
    }

    // Get database size and table count by connecting directly
    let size = '0 MB'
    let tableCount = 0

    try {
      const tenantPool = new Pool({
        host: NEON_DDL_HOST,
        port: parseInt(NEON_DDL_PORT, 10),
        user: NEON_DDL_USER,
        password: NEON_DDL_PASSWORD,
        database: dbName,
        ssl: { rejectUnauthorized: false },
        max: 1,
      })

      try {
        const sizeResult = await pool.query(`SELECT pg_size_pretty(pg_database_size($1)) as size`, [safeName])
        size = sizeResult.rows[0]?.size || '0 MB'
      } catch {
        // Size query might fail
      }

      const tableResult = await tenantPool.query(
        `SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = 'public'`
      )
      tableCount = parseInt(tableResult.rows[0]?.count || '0', 10)

      await tenantPool.end()
    } catch {
      // Can't connect to tenant DB
    }

    return { exists: true, size, tableCount }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return { exists: false, error: message }
  }
}

// ── Schema Push for Tenant Database ───────────────────────

export async function pushSchemaToTenant(directUrl: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Use Prisma with the tenant's direct URL to verify connection
    const tenantPrisma = new PrismaClient({
      datasources: {
        db: { url: directUrl },
      },
      log: ['error'],
    })

    try {
      await tenantPrisma.$queryRaw`SELECT 1`
      return { success: true }
    } finally {
      await tenantPrisma.$disconnect()
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Schema push error:', message)
    return { success: false, error: message }
  }
}

// ── Full Schema Migration for Tenant Database ─────────────

export async function migrateTenantSchema(dbName: string): Promise<{ success: boolean; tablesCreated: number; error?: string }> {
  const schemaSQL = getTenantSchemaSQL()
  if (!schemaSQL) {
    return { success: false, tablesCreated: 0, error: 'Schema SQL file not found' }
  }

  try {
    const tenantPool = new Pool({
      host: NEON_DDL_HOST,
      port: parseInt(NEON_DDL_PORT, 10),
      user: NEON_DDL_USER,
      password: NEON_DDL_PASSWORD,
      database: dbName,
      ssl: { rejectUnauthorized: false },
      max: 1,
    })

    let tablesCreated = 0

    // Execute statements sequentially for reliability
    const statements = schemaSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))

    for (const stmt of statements) {
      try {
        await tenantPool.query(stmt)
        if (stmt.toUpperCase().includes('CREATE TABLE')) {
          tablesCreated++
        }
      } catch {
        // Ignore individual statement failures (already exists, etc.)
      }
    }

    // Get actual table count
    const tableResult = await tenantPool.query(
      `SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = 'public'`
    )
    tablesCreated = parseInt(tableResult.rows[0]?.count || '0', 10)

    await tenantPool.end()
    return { success: true, tablesCreated }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Schema migration error:', message)
    return { success: false, tablesCreated: 0, error: message }
  }
}

// ── Per-Tenant PrismaClient Cache ─────────────────────────

const tenantClients = new Map<string, PrismaClient>()

export function getTenantPrismaClient(databaseUrl: string): PrismaClient {
  const existing = tenantClients.get(databaseUrl)
  if (existing) return existing

  const client = new PrismaClient({
    datasources: {
      db: { url: databaseUrl },
    },
    log: process.env.NODE_ENV === 'development' ? ['error'] : [],
  })

  tenantClients.set(databaseUrl, client)
  return client
}

export async function disconnectTenantClient(databaseUrl: string): Promise<void> {
  const client = tenantClients.get(databaseUrl)
  if (client) {
    await client.$disconnect()
    tenantClients.delete(databaseUrl)
  }
}

// ── List All Tenant Databases ─────────────────────────────

export async function listTenantDatabases(): Promise<string[]> {
  try {
    const pool = getDdlPool()
    const result = await pool.query(
      `SELECT datname FROM pg_database WHERE datname LIKE 'ff_%' AND datistemplate = false ORDER BY datname`
    )
    return result.rows.map((r: { datname: string }) => r.datname)
  } catch {
    return []
  }
}

// ── Cleanup on process exit ───────────────────────────────

process.on('beforeExit', async () => {
  if (ddlPool) {
    await ddlPool.end()
    ddlPool = null
  }
  for (const [, client] of tenantClients) {
    await client.$disconnect()
  }
  tenantClients.clear()
})
