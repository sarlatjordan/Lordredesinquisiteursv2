'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { ProfileUpdateSchema, type ProfileUpdateInput, type ActionResult } from '@/types'
import type { Profile } from '@/types'
import { ROLES } from '@/lib/constants'
import { createNotification } from '@/lib/notifications'

export async function updateProfile(input: ProfileUpdateInput): Promise<ActionResult<Profile>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Non authentifié' }

  const parsed = ProfileUpdateSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Données invalides' }
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(parsed.data)
    .eq('id', user.id)
    .select()
    .single()

  if (error) return { success: false, error: error.message }

  revalidatePath('/membres')
  revalidatePath('/profil')
  revalidateTag('public-stats', { expire: 0 })
  return { success: true, data: data as Profile }
}

export async function updateMemberRole(
  memberId: string,
  role: 'visiteur' | 'aspirant' | 'consacre' | 'gardien' | 'inquisiteur' | 'maitre_inquisiteur' | 'sage'
): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Non authentifié' }

  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (me?.role !== 'sage') return { success: false, error: 'Droits insuffisants — Sage requis' }

  // Rôle actuel du membre (pour l'historique)
  const { data: target } = await supabase.from('profiles').select('role, username').eq('id', memberId).single()
  if (!target) return { success: false, error: 'Membre introuvable' }

  const { error } = await supabase.from('profiles').update({ role }).eq('id', memberId)
  if (error) return { success: false, error: error.message }

  // Points totaux au moment de la promotion
  const { data: pts } = await supabase.from('member_points').select('points').eq('profile_id', memberId)
  const totalPoints = (pts ?? []).reduce((sum, r) => sum + r.points, 0)

  // Historique promotion
  await supabase.from('member_promotions').insert({
    profile_id:          memberId,
    from_role:           target.role,
    to_role:             role,
    promoted_by:         user.id,
    points_at_promotion: totalPoints,
  })

  const fromLabel = ROLES[target.role as keyof typeof ROLES] ?? target.role
  const toLabel   = ROLES[role as keyof typeof ROLES] ?? role
  await createNotification(supabase, {
    profile_id: memberId,
    type: 'promotion',
    title: `Promotion : ${fromLabel} → ${toLabel}`,
    message: 'Le Haut Conseil a statué sur votre progression.',
    link: '/profil',
  })

  revalidatePath('/membres')
  revalidatePath(`/membres/${target.username}`)
  revalidateTag('public-stats', { expire: 0 })
  return { success: true, data: undefined }
}
