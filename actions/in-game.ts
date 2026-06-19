'use server'

import { getAuthWithPrivilege } from '@/lib/auth-helpers'
import { revalidatePath } from 'next/cache'
import type { ActionResult } from '@/types'

export async function toggleInGame(active: boolean): Promise<ActionResult> {
  const { supabase, user } = await getAuthWithPrivilege()
  if (!user) return { success: false, error: 'Non authentifié' }

  const { error } = await supabase
    .from('profiles')
    .update({ in_game_since: active ? new Date().toISOString() : null })
    .eq('id', user.id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard')
  return { success: true, data: undefined }
}
