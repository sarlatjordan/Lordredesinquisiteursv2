'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAuthWithPrivilege } from '@/lib/auth-helpers'
import { WarJournalSchema, type WarJournalInput, type ActionResult, type WarJournalWithAuthor } from '@/types'
import { isUUID } from '@/lib/utils'

export async function createJournalEntry(input: WarJournalInput): Promise<ActionResult<string>> {
  const parsed = WarJournalSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

  const { supabase, user, privilege } = await getAuthWithPrivilege()
  if (!user) return { success: false, error: 'Non authentifié' }
  if (privilege < 400) return { success: false, error: 'Accès refusé — Inquisiteur requis' }

  const { data, error } = await supabase
    .from('war_journal')
    .insert({ ...parsed.data, author_id: user.id })
    .select('id')
    .single()

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/journal')
  return { success: true, data: data.id }
}

export async function updateJournalEntry(id: string, input: WarJournalInput): Promise<ActionResult> {
  if (!isUUID(id)) return { success: false, error: 'ID invalide' }

  const parsed = WarJournalSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

  const { supabase, privilege } = await getAuthWithPrivilege()
  if (privilege < 400) return { success: false, error: 'Accès refusé' }

  const { error } = await supabase
    .from('war_journal')
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/journal')
  return { success: true, data: undefined }
}

export async function deleteJournalEntry(id: string): Promise<ActionResult> {
  if (!isUUID(id)) return { success: false, error: 'ID invalide' }

  const { supabase, privilege } = await getAuthWithPrivilege()
  if (privilege < 400) return { success: false, error: 'Accès refusé' }

  const { error } = await supabase.from('war_journal').delete().eq('id', id)
  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/journal')
  return { success: true, data: undefined }
}

export async function getPublishedJournalEntries(): Promise<WarJournalWithAuthor[]> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('war_journal')
    .select('*, author:profiles(username, display_name, avatar_url), operation:operations(id, title)')
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .limit(10)

  return (data as unknown as WarJournalWithAuthor[]) ?? []
}

export async function getAllJournalEntries(): Promise<WarJournalWithAuthor[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('war_journal')
    .select('*, author:profiles(username, display_name, avatar_url), operation:operations(id, title)')
    .order('created_at', { ascending: false })

  return (data as unknown as WarJournalWithAuthor[]) ?? []
}
