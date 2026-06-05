import { createHmac, timingSafeEqual } from 'crypto'

export function generateIcsToken(userId: string): string {
  const secret = process.env.ICS_HMAC_SECRET
  if (!secret) throw new Error('ICS_HMAC_SECRET env var is not set')
  return createHmac('sha256', secret).update(userId).digest('hex')
}

export function verifyIcsToken(userId: string, token: string): boolean {
  try {
    const expected = generateIcsToken(userId)
    // Comparaison timing-safe pour éviter les timing attacks
    return timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(token, 'hex'))
  } catch {
    return false
  }
}
