'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getRolePrivilege, POINT_REASONS, POINTS_MILESTONE_THRESHOLDS, RANK_EVALUATION_THRESHOLDS, type Role } from '@/lib/constants'
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

  // Récupérer le total actuel + le rang du membre avant l'attribution (FEAT-15 / FEAT-16)
  const [targetResult, oldTotalResult] = await Promise.all([
    supabase.from('profiles').select('role').eq('id', parsed.data.profile_id).single(),
    supabase.from('member_points').select('points').eq('profile_id', parsed.data.profile_id),
  ])
  const targetRole = (targetResult.data?.role ?? '') as Role
  const oldTotal = (oldTotalResult.data ?? []).reduce((sum, r) => sum + r.points, 0)

  const { error } = await supabase.from('member_points').insert({
    profile_id:   parsed.data.profile_id,
    points:       parsed.data.points,
    reason:       parsed.data.reason,
    reason_detail: parsed.data.reason_detail ?? null,
    awarded_by:   user.id,
  })

  if (error) return { success: false, error: error.message }

  const newTotal = oldTotal + parsed.data.points

  const sign = parsed.data.points > 0 ? '+' : ''
  const label = POINT_REASONS[parsed.data.reason]
  await createNotification(supabase, {
    profile_id: parsed.data.profile_id,
    type: 'points',
    title: `${sign}${parsed.data.points} point${Math.abs(parsed.data.points) > 1 ? 's' : ''} — ${label}`,
    message: parsed.data.reason_detail ?? undefined,
    link: '/profil',
  })

  // FEAT-16 : paliers de points généraux — notification "un Sage peut te contacter"
  for (const milestone of POINTS_MILESTONE_THRESHOLDS) {
    if (oldTotal < milestone && newTotal >= milestone) {
      await createNotification(supabase, {
        profile_id: parsed.data.profile_id,
        type: 'milestone',
        title: `${milestone} points atteints — Le Conseil t'observe`,
        message: `Tu as franchi le cap des ${milestone} points. Un Sage peut te contacter prochainement.`,
        link: '/profil',
      })
    }
  }

  // FEAT-15 : seuil de rang — notification épreuve disponible
  const rankThreshold = RANK_EVALUATION_THRESHOLDS[targetRole]
  if (rankThreshold && oldTotal < rankThreshold && newTotal >= rankThreshold) {
    const { data: activeEval } = await supabase
      .from('rank_evaluations')
      .select('id')
      .eq('member_id', parsed.data.profile_id)
      .in('status', ['pending', 'in_progress'])
      .maybeSingle()

    if (!activeEval) {
      await createNotification(supabase, {
        profile_id: parsed.data.profile_id,
        type: 'rank_ready',
        title: 'Seuil de points atteint — Épreuve de rang disponible',
        message: 'Tu as atteint le seuil de points requis pour ton prochain rang. Le Commandement peut désormais initier ton épreuve.',
        link: '/profil',
      })
    }
  }

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
