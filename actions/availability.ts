'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { ActionResult, AvailabilityGrid } from '@/types'

export async function getMyAvailability(): Promise<AvailabilityGrid> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return {}

  const { data } = await supabase
    .from('member_availability')
    .select('day_of_week, slot')
    .eq('profile_id', user.id)

  const grid: AvailabilityGrid = {}
  for (const row of data ?? []) {
    if (!grid[row.day_of_week]) grid[row.day_of_week] = []
    grid[row.day_of_week].push(row.slot)
  }
  return grid
}

export async function saveAvailability(grid: AvailabilityGrid): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Non authentifié' }

  const rows = Object.entries(grid).flatMap(([day, slots]) =>
    (slots ?? []).map((slot) => ({
      profile_id: user.id,
      day_of_week: Number(day),
      slot,
    }))
  )

  const { error: delErr } = await supabase
    .from('member_availability')
    .delete()
    .eq('profile_id', user.id)

  if (delErr) return { success: false, error: delErr.message }

  if (rows.length > 0) {
    const { error: insErr } = await supabase
      .from('member_availability')
      .insert(rows)

    if (insErr) return { success: false, error: insErr.message }
  }

  revalidatePath('/profil')
  return { success: true, data: undefined }
}

export async function getTeamAvailability(): Promise<Record<string, AvailabilityGrid>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return {}

  const { data } = await supabase
    .from('member_availability')
    .select('profile_id, day_of_week, slot')

  const result: Record<string, AvailabilityGrid> = {}
  for (const row of data ?? []) {
    if (!result[row.profile_id]) result[row.profile_id] = {}
    if (!result[row.profile_id][row.day_of_week]) result[row.profile_id][row.day_of_week] = []
    result[row.profile_id][row.day_of_week].push(row.slot)
  }
  return result
}
