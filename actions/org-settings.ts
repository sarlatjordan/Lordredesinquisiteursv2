'use server'

import { z } from 'zod'
import { revalidatePath, revalidateTag } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getRolePrivilege } from '@/lib/constants'
import type { OrgSettings, ActionResult } from '@/types'

export async function getOrgSettings(): Promise<OrgSettings | null> {
  const supabase = await createClient()
  const { data } = await supabase.from('org_settings').select('*').single()
  return (data as OrgSettings) ?? null
}

export async function setRecruitmentOpen(open: boolean): Promise<ActionResult> {
  const parsed = z.boolean().safeParse(open)
  if (!parsed.success) return { success: false, error: 'Paramètre invalide' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Non authentifié' }

  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const privilege = getRolePrivilege(me?.role ?? '')
  if (privilege < 600) return { success: false, error: 'Maître Inquisiteur requis' }

  const { error } = await supabase
    .from('org_settings')
    .update({ recruitment_open: parsed.data, updated_at: new Date().toISOString(), updated_by: user.id })
    .eq('id', true)

  if (error) return { success: false, error: error.message }

  revalidateTag('org-settings', { expire: 0 })
  revalidatePath('/dashboard')
  revalidatePath('/recrutement')
  return { success: true, data: undefined }
}
