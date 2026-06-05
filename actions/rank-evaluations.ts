'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getRolePrivilege } from '@/lib/constants'
import { createNotification } from '@/lib/notifications'
import { InitiateEvaluationSchema, type ActionResult } from '@/types'

export async function initiateEvaluation(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Non authentifié' }

  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (getRolePrivilege(me?.role ?? '') < 600) {
    return { success: false, error: 'Maître Inquisiteur requis' }
  }

  const parsed = InitiateEvaluationSchema.safeParse({
    member_id:    formData.get('member_id'),
    instructions: formData.get('instructions'),
  })
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Données invalides' }
  }

  const { data: member } = await supabase
    .from('profiles')
    .select('display_name, username')
    .eq('id', parsed.data.member_id)
    .single()

  const { error } = await supabase.from('rank_evaluations').insert({
    member_id:    parsed.data.member_id,
    initiated_by: user.id,
    instructions: parsed.data.instructions,
  })

  if (error) {
    if (error.code === '23505') {
      return { success: false, error: 'Ce membre a déjà une épreuve en cours' }
    }
    return { success: false, error: error.message }
  }

  const admin = createAdminClient()
  await createNotification(admin, {
    profile_id: parsed.data.member_id,
    type: 'rank_evaluation',
    title: 'Épreuve de rang assignée',
    message: `${member?.display_name ?? member?.username ?? 'Membre'}, le Conseil vous a désigné pour une épreuve de réévaluation de rang.`,
    link: '/profil',
  })

  revalidatePath('/admin/promotions')
  return { success: true, data: undefined }
}

export async function updateEvaluationStatus(
  evalId: string,
  status: 'in_progress' | 'passed' | 'failed' | 'cancelled',
): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Non authentifié' }

  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (getRolePrivilege(me?.role ?? '') < 600) {
    return { success: false, error: 'Maître Inquisiteur requis' }
  }

  const { error } = await supabase
    .from('rank_evaluations')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', evalId)

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/promotions')
  revalidatePath('/profil')
  return { success: true, data: undefined }
}
