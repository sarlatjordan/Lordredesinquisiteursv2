'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getRolePrivilege } from '@/lib/constants'
import { ProgressionUpsertSchema, type ProgressionUpsertInput, type ActionResult } from '@/types'

export async function upsertProgression(input: ProgressionUpsertInput): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Non authentifié' }

  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (getRolePrivilege(me?.role ?? '') < 1000) {
    return { success: false, error: 'Sage requis' }
  }

  const parsed = ProgressionUpsertSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Données invalides' }
  }

  const { profile_id, ...rest } = parsed.data

  const { error } = await supabase.from('member_progressions').upsert({
    profile_id,
    ...rest,
    updated_by: user.id,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'profile_id' })

  if (error) return { success: false, error: error.message }

  revalidatePath('/membres')
  revalidatePath(`/membres/${input.profile_id}`)
  revalidateTag('public-stats', { expire: 0 })
  return { success: true, data: undefined }
}
