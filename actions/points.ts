'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getRolePrivilege, POINT_REASONS } from '@/lib/constants'
import { AwardPointsSchema, type AwardPointsInput, type ActionResult } from '@/types'
import { createNotification } from '@/lib/notifications'

export async function awardPoints(input: AwardPointsInput): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Non authentifié' }

  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (getRolePrivilege(me?.role ?? '') < 300) {
    return { success: false, error: 'Privilege insuffisant (Gardien requis)' }
  }

  const parsed = AwardPointsSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Données invalides' }
  }

  const { error } = await supabase.from('member_points').insert({
    profile_id:   parsed.data.profile_id,
    points:       parsed.data.points,
    reason:       parsed.data.reason,
    reason_detail: parsed.data.reason_detail ?? null,
    awarded_by:   user.id,
  })

  if (error) return { success: false, error: error.message }

  const sign = parsed.data.points > 0 ? '+' : ''
  const label = POINT_REASONS[parsed.data.reason]
  await createNotification(supabase, {
    profile_id: parsed.data.profile_id,
    type: 'points',
    title: `${sign}${parsed.data.points} point${Math.abs(parsed.data.points) > 1 ? 's' : ''} — ${label}`,
    message: parsed.data.reason_detail ?? undefined,
    link: '/profil',
  })

  revalidatePath('/membres')
  revalidatePath('/profil')
  return { success: true, data: undefined }
}

export async function deletePoints(pointId: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Non authentifié' }

  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (getRolePrivilege(me?.role ?? '') < 1000) {
    return { success: false, error: 'Sage requis' }
  }

  const { error } = await supabase.from('member_points').delete().eq('id', pointId)
  if (error) return { success: false, error: error.message }

  revalidatePath('/membres')
  revalidatePath('/profil')
  return { success: true, data: undefined }
}
