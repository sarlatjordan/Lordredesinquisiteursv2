'use server'

import { z } from 'zod'
import { revalidatePath, revalidateTag } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { ShipCreateSchema, type ShipCreateInput, type ActionResult } from '@/types'
import type { Ship } from '@/types'
import { getRolePrivilege, PRIVILEGE } from '@/lib/constants'

const ShipNameSchema = z.object({
  name: z.string().min(2, 'Minimum 2 caractères').max(100, 'Maximum 100 caractères'),
})

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

const ShipStatusSchema = z.enum(['disponible', 'en_mission', 'maintenance', 'indisponible'])

export async function updateShipStatus(
  shipId: string,
  status: 'disponible' | 'en_mission' | 'maintenance' | 'indisponible'
): Promise<ActionResult> {
  const idParsed = z.string().uuid().safeParse(shipId)
  if (!idParsed.success) return { success: false, error: 'Identifiant vaisseau invalide' }
  const statusParsed = ShipStatusSchema.safeParse(status)
  if (!statusParsed.success) return { success: false, error: 'Statut invalide' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Non authentifié' }

  const { error } = await supabase
    .from('ships')
    .update({ status: statusParsed.data })
    .eq('id', idParsed.data)

  if (error) return { success: false, error: error.message }

  revalidatePath('/flotte')
  revalidatePath('/dashboard')
  return { success: true, data: undefined }
}

export async function deleteShip(shipId: string): Promise<ActionResult> {
  const parsed = z.string().uuid().safeParse(shipId)
  if (!parsed.success) return { success: false, error: 'Identifiant vaisseau invalide' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Non authentifié' }

  const { error } = await supabase
    .from('ships')
    .delete()
    .eq('id', parsed.data)

  if (error) return { success: false, error: error.message }

  revalidatePath('/flotte')
  revalidatePath('/dashboard')
  revalidateTag('public-stats', { expire: 0 })
  return { success: true, data: undefined }
}

export async function updateShipName(shipId: string, name: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Non authentifié' }

  const parsed = ShipNameSchema.safeParse({ name })
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Données invalides' }
  }

  const [{ data: profile }, { data: ship }] = await Promise.all([
    supabase.from('profiles').select('role').eq('id', user.id).single(),
    supabase.from('ships').select('owner_id').eq('id', shipId).single(),
  ])

  if (!ship) return { success: false, error: 'Vaisseau introuvable' }

  const privilege = getRolePrivilege(profile?.role ?? '')
  if (ship.owner_id !== user.id && privilege < PRIVILEGE.MANAGE_FLEET) {
    return { success: false, error: 'Non autorisé' }
  }

  const { error } = await supabase
    .from('ships')
    .update({ name: parsed.data.name })
    .eq('id', shipId)

  if (error) return { success: false, error: error.message }

  revalidatePath('/flotte')
  return { success: true, data: undefined }
}
