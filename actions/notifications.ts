'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { ActionResult, Notification } from '@/types'

export async function markRead(notificationId: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Non authentifié' }

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
    .eq('profile_id', user.id)

  if (error) return { success: false, error: error.message }
  revalidatePath('/', 'layout')
  return { success: true, data: undefined }
}

export async function markAllRead(): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Non authentifié' }

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('profile_id', user.id)
    .eq('is_read', false)

  if (error) return { success: false, error: error.message }
  revalidatePath('/', 'layout')
  return { success: true, data: undefined }
}

export async function getNotifications(): Promise<ActionResult<Notification[]>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Non authentifié' }

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('profile_id', user.id)
    .order('created_at', { ascending: false })
    .limit(15)

  if (error) return { success: false, error: error.message }
  return { success: true, data: (data ?? []) as Notification[] }
}
