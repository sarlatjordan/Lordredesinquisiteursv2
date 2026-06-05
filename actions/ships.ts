'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { ShipCreateSchema, type ShipCreateInput, type ActionResult } from '@/types'
import type { Ship } from '@/types'

export async function createShip(input: ShipCreateInput): Promise<ActionResult<Ship>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Non authentifié' }

  const parsed = ShipCreateSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Données invalides' }
  }

  const { data, error } = await supabase
    .from('ships')
    .insert({ ...parsed.data, owner_id: user.id })
    .select()
    .single()

  if (error) return { success: false, error: error.message }

  revalidatePath('/flotte')
  revalidatePath('/dashboard')
  revalidateTag('public-stats', { expire: 0 })
  return { success: true, data: data as Ship }
}

export async function updateShipStatus(
  shipId: string,
  status: 'disponible' | 'en_mission' | 'maintenance' | 'indisponible'
): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Non authentifié' }

  const { error } = await supabase
    .from('ships')
    .update({ status })
    .eq('id', shipId)

  if (error) return { success: false, error: error.message }

  revalidatePath('/flotte')
  revalidatePath('/dashboard')
  return { success: true, data: undefined }
}

export async function deleteShip(shipId: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Non authentifié' }

  const { error } = await supabase
    .from('ships')
    .delete()
    .eq('id', shipId)

  if (error) return { success: false, error: error.message }

  revalidatePath('/flotte')
  revalidatePath('/dashboard')
  revalidateTag('public-stats', { expire: 0 })
  return { success: true, data: undefined }
}
