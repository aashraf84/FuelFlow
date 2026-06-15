import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

// Helper: retry a database operation up to 3 times with exponential backoff
export async function dbRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  let lastError: unknown
  for (let i = 0; i < retries; i++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      const isConnectionError =
        error instanceof Error && (
          error.message.includes('connect') ||
          error.message.includes('Connection') ||
          error.message.includes('timed out') ||
          error.message.includes('ECONNREFUSED') ||
          error.message.includes('Closed') ||
          error.message.includes('P1001') ||
          error.message.includes('P1002')
        )
      if (!isConnectionError || i === retries - 1) throw error
      // Exponential backoff: 500ms, 1000ms, 2000ms
      const delay = Math.min(500 * Math.pow(2, i), 3000)
      console.warn(`[dbRetry] Attempt ${i + 1} failed, retrying in ${delay}ms...`, error instanceof Error ? error.message : '')
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }
  throw lastError
}
