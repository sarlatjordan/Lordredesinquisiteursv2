'use server'

import { z } from 'zod'
import { revalidatePath, revalidateTag } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { ProfileUpdateSchema, AvatarSubmitSchema, type ProfileUpdateInput, type AvatarSubmitInput, type ActionResult } from '@/types'
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

// ─── FEAT-20 : Workflow validation photo de profil ───────────────────────────

export async function submitAvatarForApproval(input: AvatarSubmitInput): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Non authentifié' }

  const parsed = AvatarSubmitSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'URL invalide' }

  const { error } = await supabase
    .from('profiles')
    .update({ avatar_pending_url: parsed.data.url })
    .eq('id', user.id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/profil')
  return { success: true, data: undefined }
}

export async function approveAvatar(profileId: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Non authentifié' }

  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (me?.role !== 'sage') return { success: false, error: 'Droits insuffisants — Sage requis' }

  const { data: target } = await supabase
    .from('profiles')
    .select('avatar_pending_url, username')
    .eq('id', profileId)
    .single()

  if (!target) return { success: false, error: 'Membre introuvable' }
  if (!target.avatar_pending_url) return { success: false, error: 'Aucune photo en attente' }

  const admin = createAdminClient()
  const { error } = await admin
    .from('profiles')
    .update({ avatar_url: target.avatar_pending_url, avatar_pending_url: null })
    .eq('id', profileId)

  if (error) return { success: false, error: error.message }

  await createNotification(supabase, {
    profile_id: profileId,
    type: 'avatar_approved',
    title: 'Photo de profil approuvée',
    message: 'Votre photo de profil a été validée par le Conseil.',
    link: '/profil',
  })

  revalidatePath('/profil')
  revalidatePath('/membres')
  revalidatePath(`/membres/${target.username}`)
  return { success: true, data: undefined }
}

export async function rejectAvatar(profileId: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Non authentifié' }

  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (me?.role !== 'sage') return { success: false, error: 'Droits insuffisants — Sage requis' }

  const { data: target } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', profileId)
    .single()

  if (!target) return { success: false, error: 'Membre introuvable' }

  const admin = createAdminClient()
  const { error } = await admin
    .from('profiles')
    .update({ avatar_pending_url: null })
    .eq('id', profileId)

  if (error) return { success: false, error: error.message }

  await createNotification(supabase, {
    profile_id: profileId,
    type: 'avatar_rejected',
    title: 'Photo de profil refusée',
    message: 'Votre photo de profil n\'a pas été retenue. Vous pouvez en soumettre une nouvelle depuis votre profil.',
    link: '/profil',
  })

  revalidatePath('/profil')
  return { success: true, data: undefined }
}

// ─── Gestion des rôles ────────────────────────────────────────────────────────

const MemberRoleSchema = z.enum(['visiteur', 'aspirant', 'consacre', 'gardien', 'inquisiteur', 'maitre_inquisiteur', 'sage'])

export async function updateMemberRole(
  memberId: string,
  role: 'visiteur' | 'aspirant' | 'consacre' | 'gardien' | 'inquisiteur' | 'maitre_inquisiteur' | 'sage'
): Promise<ActionResult> {
  const idParsed = z.string().uuid().safeParse(memberId)
  if (!idParsed.success) return { success: false, error: 'Identifiant membre invalide' }
  const roleParsed = MemberRoleSchema.safeParse(role)
  if (!roleParsed.success) return { success: false, error: 'Rang invalide' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Non authentifié' }

  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (me?.role !== 'sage') return { success: false, error: 'Droits insuffisants — Sage requis' }

  // Rôle actuel du membre (pour l'historique)
  const { data: target } = await supabase.from('profiles').select('role, username').eq('id', idParsed.data).single()
  if (!target) return { success: false, error: 'Membre introuvable' }

  // Mise à jour du rôle + points totaux en parallèle
  const [{ error }, { data: pts }] = await Promise.all([
    supabase.from('profiles').update({ role: roleParsed.data }).eq('id', idParsed.data),
    supabase.from('member_points').select('points').eq('profile_id', idParsed.data),
  ])
  if (error) return { success: false, error: error.message }

  const totalPoints = (pts ?? []).reduce((sum, r) => sum + r.points, 0)

  // Historique promotion
  await supabase.from('member_promotions').insert({
    profile_id:          idParsed.data,
    from_role:           target.role,
    to_role:             roleParsed.data,
    promoted_by:         user.id,
    points_at_promotion: totalPoints,
  })

  const fromLabel = ROLES[target.role as keyof typeof ROLES] ?? target.role
  const toLabel   = ROLES[roleParsed.data as keyof typeof ROLES] ?? roleParsed.data
  await createNotification(supabase, {
    profile_id: idParsed.data,
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
