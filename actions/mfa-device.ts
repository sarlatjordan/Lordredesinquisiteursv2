'use server'

import { cookies } from 'next/headers'
import { generateDeviceTrustToken } from '@/lib/trusted-device-token'
import { getAuthWithPrivilege } from '@/lib/auth-helpers'
import type { ActionResult } from '@/types'

const DURATIONS_MS = {
  '1h': 60 * 60 * 1000,
  '1d': 24 * 60 * 60 * 1000,
  '1w': 7 * 24 * 60 * 60 * 1000,
  '1m': 30 * 24 * 60 * 60 * 1000,
  '1y': 365 * 24 * 60 * 60 * 1000,
} as const

export type DeviceTrustDuration = keyof typeof DURATIONS_MS

export async function trustCurrentDevice(duration: DeviceTrustDuration): Promise<ActionResult> {
  const { supabase, user } = await getAuthWithPrivilege()
  if (!user) return { success: false, error: 'Non authentifié' }

  const expiresAt = new Date(Date.now() + DURATIONS_MS[duration])

  let token: string
  let deviceId: string
  try {
    ;({ token, deviceId } = generateDeviceTrustToken(user.id, expiresAt))
  } catch {
    return { success: false, error: 'Configuration serveur manquante (MFA_DEVICE_SECRET)' }
  }

  const { error } = await supabase.from('trusted_devices').insert({
    profile_id: user.id,
    device_id: deviceId,
    expires_at: expiresAt.toISOString(),
  })
  if (error) return { success: false, error: error.message }

  const cookieStore = await cookies()
  cookieStore.set('mfa_device_trust', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  })

  return { success: true, data: undefined }
}
