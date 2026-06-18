'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import type { BadgeKey } from '@/lib/constants'

export async function awardBadge(profileId: string, badgeKey: BadgeKey): Promise<void> {
  const supabase = createAdminClient()
  await supabase
    .from('member_badges')
    .upsert({ profile_id: profileId, badge_key: badgeKey }, { onConflict: 'profile_id,badge_key', ignoreDuplicates: true })
}

export async function checkAndAwardOpBadges(profileId: string): Promise<void> {
  const supabase = createAdminClient()
  const { count } = await supabase
    .from('op_registrations')
    .select('*', { count: 'exact', head: true })
    .eq('profile_id', profileId)

  const total = count ?? 0
  if (total >= 1)  await awardBadge(profileId, 'first_op')
  if (total >= 5)  await awardBadge(profileId, 'ops_5')
  if (total >= 10) await awardBadge(profileId, 'ops_10')
}

export async function checkAndAwardEventBadges(profileId: string): Promise<void> {
  const supabase = createAdminClient()
  const { count } = await supabase
    .from('event_attendees')
    .select('*', { count: 'exact', head: true })
    .eq('profile_id', profileId)

  const total = count ?? 0
  if (total >= 1) await awardBadge(profileId, 'first_event')
  if (total >= 5) await awardBadge(profileId, 'events_5')
}
