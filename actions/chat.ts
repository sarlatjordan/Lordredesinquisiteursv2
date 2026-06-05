'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getRolePrivilege } from '@/lib/constants'
import {
  SendMessageSchema,
  CreateChannelSchema,
  type SendMessageInput,
  type CreateChannelInput,
  type ActionResult,
  type ChatMessageWithAuthor,
} from '@/types'

export async function sendMessage(input: SendMessageInput): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Non authentifié' }

  const parsed = SendMessageSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Données invalides' }

  const { error } = await supabase.from('chat_messages').insert({
    channel_id: parsed.data.channelId,
    author_id: user.id,
    content: parsed.data.content,
  })

  if (error) return { success: false, error: error.message }
  return { success: true, data: undefined }
}

export async function createChannel(input: CreateChannelInput): Promise<ActionResult<{ id: string }>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Non authentifié' }

  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (getRolePrivilege(me?.role ?? '') < 600) {
    return { success: false, error: 'Maître Inquisiteur requis pour créer un canal' }
  }

  const parsed = CreateChannelSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Données invalides' }

  const { data, error } = await supabase
    .from('chat_channels')
    .insert({ ...parsed.data, created_by: user.id })
    .select('id')
    .single()

  if (error) return { success: false, error: error.message }

  revalidatePath('/messages')
  return { success: true, data: { id: data.id } }
}

export async function archiveChannel(channelId: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Non authentifié' }

  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (getRolePrivilege(me?.role ?? '') < 600) {
    return { success: false, error: 'Maître Inquisiteur requis' }
  }

  const { error } = await supabase
    .from('chat_channels')
    .update({ is_archived: true })
    .eq('id', channelId)

  if (error) return { success: false, error: error.message }

  revalidatePath('/messages')
  return { success: true, data: undefined }
}

export async function markChannelSeen(channelId: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Non authentifié' }

  const { error } = await supabase.from('chat_member_seen').upsert(
    { profile_id: user.id, channel_id: channelId, last_seen_at: new Date().toISOString() },
    { onConflict: 'profile_id,channel_id' }
  )

  if (error) return { success: false, error: error.message }
  return { success: true, data: undefined }
}

export async function markChannelsRead(channelIds: string[]): Promise<ActionResult> {
  if (channelIds.length === 0) return { success: true, data: undefined }
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Non authentifié' }

  const now = new Date().toISOString()
  const { error } = await supabase.from('chat_member_seen').upsert(
    channelIds.map((id) => ({ profile_id: user.id, channel_id: id, last_seen_at: now })),
    { onConflict: 'profile_id,channel_id' }
  )

  if (error) return { success: false, error: error.message }
  return { success: true, data: undefined }
}

export async function getChannelMessages(channelId: string): Promise<ActionResult<ChatMessageWithAuthor[]>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Non authentifié' }

  const { data, error } = await supabase
    .from('chat_messages')
    .select('*, author:profiles(id, username, display_name, avatar_url)')
    .eq('channel_id', channelId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return { success: false, error: error.message }
  return { success: true, data: ((data ?? []).reverse()) as unknown as ChatMessageWithAuthor[] }
}

export async function loadMoreMessages(
  channelId: string,
  before: string
): Promise<ActionResult<ChatMessageWithAuthor[]>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Non authentifié' }

  const { data, error } = await supabase
    .from('chat_messages')
    .select('*, author:profiles(id, username, display_name, avatar_url)')
    .eq('channel_id', channelId)
    .lt('created_at', before)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return { success: false, error: error.message }
  return { success: true, data: ((data ?? []).reverse()) as unknown as ChatMessageWithAuthor[] }
}
