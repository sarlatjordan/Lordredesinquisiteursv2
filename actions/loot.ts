'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getAuthWithPrivilege } from '@/lib/auth-helpers'
import { LootSchema, type LootInput, type ActionResult, type OperationLootWithShares } from '@/types'
import { isUUID } from '@/lib/utils'
import { awardBadge } from '@/lib/award-badge'

export async function createLootSplit(operationId: string, input: LootInput): Promise<ActionResult> {
  if (!isUUID(operationId)) return { success: false, error: 'ID invalide' }

  const parsed = LootSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

  const { supabase, user, privilege } = await getAuthWithPrivilege()
  if (!user) return { success: false, error: 'Non authentifié' }
  if (privilege < 300) return { success: false, error: 'Accès refusé — Gardien requis' }

  const { participant_ids, total_auec, note } = parsed.data
  const share = Math.floor(total_auec / participant_ids.length)
  const remainder = total_auec - share * participant_ids.length

  const { data: loot, error: lootErr } = await supabase
    .from('operation_loot')
    .insert({ operation_id: operationId, total_auec, note: note ?? null, created_by: user.id })
    .select('id')
    .single()

  if (lootErr) return { success: false, error: lootErr.message }

  const shares = participant_ids.map((pid, i) => ({
    loot_id: loot.id,
    profile_id: pid,
    amount: i === 0 ? share + remainder : share,
  }))

  const { error: shareErr } = await supabase.from('loot_shares').insert(shares)
  if (shareErr) return { success: false, error: shareErr.message }

  for (const pid of participant_ids) {
    void awardBadge(pid, 'loot_received')
  }

  revalidatePath(`/operations/${operationId}`)
  return { success: true, data: undefined }
}

export async function deleteLootSplit(lootId: string, operationId: string): Promise<ActionResult> {
  if (!isUUID(lootId)) return { success: false, error: 'ID invalide' }

  const { supabase, privilege } = await getAuthWithPrivilege()
  if (privilege < 300) return { success: false, error: 'Accès refusé' }

  const { error } = await supabase.from('operation_loot').delete().eq('id', lootId)
  if (error) return { success: false, error: error.message }

  revalidatePath(`/operations/${operationId}`)
  return { success: true, data: undefined }
}

export async function getOperationLoot(operationId: string): Promise<OperationLootWithShares[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('operation_loot')
    .select('*, shares:loot_shares(*, profile:profiles(id, username, display_name, avatar_url))')
    .eq('operation_id', operationId)
    .order('created_at', { ascending: false })

  return (data as unknown as OperationLootWithShares[]) ?? []
}
