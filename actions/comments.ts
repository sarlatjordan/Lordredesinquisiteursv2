'use server'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import type { CommentWithAuthor } from '@/types'

type CommentResult =
  | { success: true; data: CommentWithAuthor }
  | { success: false; error: string }

type SimpleResult =
  | { success: true }
  | { success: false; error: string }

const AddSchema = z.object({
  entity_type: z.enum(['operation', 'event']),
  entity_id:   z.string().uuid(),
  content:     z.string().min(1).max(2000),
})

export async function addComment(
  entity_type: 'operation' | 'event',
  entity_id: string,
  content: string,
): Promise<CommentResult> {
  const parsed = AddSchema.safeParse({ entity_type, entity_id, content })
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Non authentifié' }

  const { data, error } = await supabase
    .from('comments')
    .insert({
      entity_type: parsed.data.entity_type,
      entity_id:   parsed.data.entity_id,
      author_id:   user.id,
      content:     parsed.data.content.trim(),
    })
    .select('*, author:profiles(id, username, display_name, avatar_url)')
    .single()

  if (error) return { success: false, error: error.message }

  return { success: true, data: data as unknown as CommentWithAuthor }
}

export async function deleteComment(id: string): Promise<SimpleResult> {
  if (!id) return { success: false, error: 'ID manquant' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Non authentifié' }

  const { error } = await supabase.from('comments').delete().eq('id', id)
  if (error) return { success: false, error: error.message }

  return { success: true }
}

export async function fetchComments(
  entity_type: 'operation' | 'event',
  entity_id: string,
): Promise<{ success: true; data: CommentWithAuthor[] } | { success: false; error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Non authentifié' }

  const { data, error } = await supabase
    .from('comments')
    .select('*, author:profiles(id, username, display_name, avatar_url)')
    .eq('entity_type', entity_type)
    .eq('entity_id', entity_id)
    .order('created_at', { ascending: true })

  if (error) return { success: false, error: error.message }

  return { success: true, data: (data ?? []) as unknown as CommentWithAuthor[] }
}
