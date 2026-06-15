import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  return new PrismaClient({
    log: ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  })
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

// Helper: retry a database operation up to 3 times with exponential backoff
// This is critical for Neon serverless PostgreSQL which can drop idle connections
export async function dbRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  let lastError: unknown
  for (let i = 0; i < retries; i++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      const err = error instanceof Error ? error : new Error(String(error))
      const isConnectionError =
        err.message.includes('connect') ||
        err.message.includes('Connection') ||
        err.message.includes('timed out') ||
        err.message.includes('ECONNREFUSED') ||
        err.message.includes('Closed') ||
        err.message.includes('P1001') ||
        err.message.includes('P1002') ||
        err.message.includes('P1006') ||
        err.message.includes('P1008') ||
        err.message.includes("Can't reach database server") ||
        err.message.includes('Connection terminated') ||
        err.message.includes('Operation was interrupted')

      if (!isConnectionError) throw error

      if (i === retries - 1) throw error

      // Exponential backoff: 2000ms, 4000ms
      const delay = 2000 * Math.pow(2, i)
      console.warn(`[dbRetry] Attempt ${i + 1} failed, retrying in ${delay}ms...`)

      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }
  throw lastError
}
