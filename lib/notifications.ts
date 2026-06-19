import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { sendPushToUser } from '@/lib/push'

export async function createNotification(
  supabase: SupabaseClient<Database>,
  {
    profile_id,
    type,
    title,
    message,
    link,
  }: {
    profile_id: string
    type: string
    title: string
    message?: string
    link?: string
  }
) {
  await supabase.from('notifications').insert({
    profile_id,
    type,
    title,
    message: message ?? null,
    link: link ?? null,
  })

  await sendPushToUser(profile_id, { title, body: message, url: link })
}
