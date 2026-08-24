'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getAuthWithPrivilege } from '@/lib/auth-helpers'
import { BacklogItemSchema, type BacklogItemInput, type ActionResult, type BacklogItem } from '@/types'
import { isUUID } from '@/lib/utils'

export async function createBacklogItem(input: BacklogItemInput): Promise<ActionResult<string>> {
  const parsed = BacklogItemSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

  const { supabase, user, privilege } = await getAuthWithPrivilege()
  if (!user) return { success: false, error: 'Non authentifié' }
  if (privilege < 600) return { success: false, error: 'Accès refusé — Maître Inquisiteur requis' }

  const { data, error } = await supabase
    .from('backlog_items')
    .insert({ ...parsed.data, created_by: user.id })
    .select('id')
    .single()

  if (error) {
    if (error.code === '23505') return { success: false, error: 'Ce code existe déjà' }
    return { success: false, error: error.message }
  }

  revalidatePath('/admin/backlog')
  return { success: true, data: data.id }
}

export async function updateBacklogItem(id: string, input: BacklogItemInput): Promise<ActionResult> {
  if (!isUUID(id)) return { success: false, error: 'ID invalide' }

  const parsed = BacklogItemSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

  const { supabase, privilege } = await getAuthWithPrivilege()
  if (privilege < 600) return { success: false, error: 'Accès refusé' }

  const { error } = await supabase
    .from('backlog_items')
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    if (error.code === '23505') return { success: false, error: 'Ce code existe déjà' }
    return { success: false, error: error.message }
  }

  revalidatePath('/admin/backlog')
  return { success: true, data: undefined }
}

export async function setBacklogItemStatus(
  id: string,
  status: 'planned' | 'in_progress' | 'done',
): Promise<ActionResult> {
  if (!isUUID(id)) return { success: false, error: 'ID invalide' }

  const { supabase, privilege } = await getAuthWithPrivilege()
  if (privilege < 600) return { success: false, error: 'Accès refusé' }

  const { error } = await supabase
    .from('backlog_items')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/backlog')
  return { success: true, data: undefined }
}

export async function deleteBacklogItem(id: string): Promise<ActionResult> {
  if (!isUUID(id)) return { success: false, error: 'ID invalide' }

  const { supabase, privilege } = await getAuthWithPrivilege()
  if (privilege < 600) return { success: false, error: 'Accès refusé' }

  const { error } = await supabase.from('backlog_items').delete().eq('id', id)
  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/backlog')
  return { success: true, data: undefined }
}

export async function getBacklogItems(): Promise<BacklogItem[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('backlog_items')
    .select('*')
    .order('created_at', { ascending: false })

  return data ?? []
}
