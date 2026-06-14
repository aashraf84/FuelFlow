import { createHmac, randomBytes } from 'crypto'

const SALT_LENGTH = 32

/**
 * Hash a password using HMAC-SHA512 with salt
 * Lightweight approach suitable for serverless/edge environments
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LENGTH).toString('hex')
  const hash = createHmac('sha512', salt).update(password).digest('hex')
  return `${salt}:${hash}`
}

/**
 * Verify a password against a stored hash
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  try {
    const [salt, hash] = storedHash.split(':')
    if (!salt || !hash) return false
    const computedHash = createHmac('sha512', salt).update(password).digest('hex')
    return computedHash === hash
  } catch {
    return false
  }
}
