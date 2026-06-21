'use server'

import { revalidatePath } from 'next/cache'
import { getAuthWithPrivilege } from '@/lib/auth-helpers'
import { MapPointSchema, type MapPointInput, type ActionResult, type MapPoint, type MapJumpLane } from '@/types'


export async function createMapPoint(input: MapPointInput): Promise<ActionResult<MapPoint>> {
  const { supabase, user, privilege } = await getAuthWithPrivilege()
  if (!user) return { success: false, error: 'Non authentifié' }
  if (privilege < 300) return { success: false, error: 'Gardien requis' }

  const parsed = MapPointSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Données invalides' }

  const { data, error } = await supabase
    .from('map_points')
    .insert({ ...parsed.data, created_by: user.id })
    .select()
    .single()

  if (error) return { success: false, error: error.message }
  revalidatePath('/carte')
  return { success: true, data: data as MapPoint }
}

export async function updateMapPoint(id: string, input: MapPointInput): Promise<ActionResult<MapPoint>> {
  const { supabase, user, privilege } = await getAuthWithPrivilege()
  if (!user) return { success: false, error: 'Non authentifié' }
  if (privilege < 300) return { success: false, error: 'Gardien requis' }

  const parsed = MapPointSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Données invalides' }

  const { data, error } = await supabase
    .from('map_points')
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) return { success: false, error: error.message }
  revalidatePath('/carte')
  return { success: true, data: data as MapPoint }
}

export async function deleteMapPoint(id: string): Promise<ActionResult> {
  const { supabase, user, privilege } = await getAuthWithPrivilege()
  if (!user) return { success: false, error: 'Non authentifié' }
  if (privilege < 1000) return { success: false, error: 'Sage requis' }

  const { error } = await supabase.from('map_points').delete().eq('id', id)
  if (error) return { success: false, error: error.message }
  revalidatePath('/carte')
  return { success: true, data: undefined }
}

// ─── Jump lanes ───────────────────────────────────────────────────────────────

export async function createJumpLane(
  rawA: string,
  rawB: string
): Promise<ActionResult<MapJumpLane>> {
  const { supabase, user, privilege } = await getAuthWithPrivilege()
  if (!user) return { success: false, error: 'Non authentifié' }
  if (privilege < 1000) return { success: false, error: 'Sage requis' }

  const trimA = rawA.trim()
  const trimB = rawB.trim()
  if (!trimA || !trimB) return { success: false, error: 'Deux systèmes requis' }
  if (trimA === trimB) return { success: false, error: 'Les deux systèmes doivent être différents' }

  // Normalisation : system_a < system_b (contrainte DB)
  const [system_a, system_b] = [trimA, trimB].sort()

  const { data, error } = await supabase
    .from('map_jump_lanes')
    .insert({ system_a, system_b, created_by: user.id })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') return { success: false, error: 'Cette connexion existe déjà' }
    return { success: false, error: error.message }
  }

  revalidatePath('/carte')
  return { success: true, data: data as MapJumpLane }
}

export async function deleteJumpLane(id: string): Promise<ActionResult> {
  const { supabase, user, privilege } = await getAuthWithPrivilege()
  if (!user) return { success: false, error: 'Non authentifié' }
  if (privilege < 1000) return { success: false, error: 'Sage requis' }

  const { error } = await supabase.from('map_jump_lanes').delete().eq('id', id)
  if (error) return { success: false, error: error.message }
  revalidatePath('/carte')
  return { success: true, data: undefined }
}

// ─── Positions systèmes (Sage) ────────────────────────────────────────────────

export async function upsertSystemPosition(
  systemName: string,
  x: number,
  y: number,
): Promise<ActionResult> {
  const { supabase, user, privilege } = await getAuthWithPrivilege()
  if (!user) return { success: false, error: 'Non authentifié' }
  if (privilege < 1000) return { success: false, error: 'Sage requis' }

  const trimmed = systemName.trim()
  if (!trimmed) return { success: false, error: 'Nom requis' }

  const { error } = await supabase
    .from('map_system_positions')
    .upsert({ system_name: trimmed, x, y, updated_at: new Date().toISOString() }, { onConflict: 'system_name' })

  if (error) return { success: false, error: error.message }
  return { success: true, data: undefined }
}

export async function deleteSystemPosition(systemName: string): Promise<ActionResult> {
  const { supabase, user, privilege } = await getAuthWithPrivilege()
  if (!user) return { success: false, error: 'Non authentifié' }
  if (privilege < 1000) return { success: false, error: 'Sage requis' }

  const { error } = await supabase
    .from('map_system_positions')
    .delete()
    .eq('system_name', systemName)

  if (error) return { success: false, error: error.message }
  revalidatePath('/carte')
  return { success: true, data: undefined }
}
