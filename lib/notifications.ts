import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

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
}
