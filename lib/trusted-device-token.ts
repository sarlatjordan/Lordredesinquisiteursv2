import { createHmac, randomUUID } from 'crypto'

function getSecret(): string {
  const s = process.env.MFA_DEVICE_SECRET
  if (!s) throw new Error('MFA_DEVICE_SECRET manquant')
  return s
}

export function generateDeviceTrustToken(
  userId: string,
  expiresAt: Date,
): { token: string; deviceId: string } {
  const deviceId = randomUUID()
  const payload = JSON.stringify({ userId, expiresAt: expiresAt.toISOString(), deviceId })
  const encoded = Buffer.from(payload).toString('base64url')
  const sig = createHmac('sha256', getSecret()).update(encoded).digest('base64url')
  return { token: `${encoded}.${sig}`, deviceId }
}
