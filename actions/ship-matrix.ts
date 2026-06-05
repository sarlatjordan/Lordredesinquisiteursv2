'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { ActionResult } from '@/types'
import { getRolePrivilege, PRIVILEGE } from '@/lib/constants'

// ─── Types RSI Ship Matrix API ────────────────────────────────────────────────

interface RsiShip {
  id: number
  name: string
  focus: string
  type: string
  manufacturer: { name: string } | null
  max_crew: number | string
  min_crew: number | string
  cargocapacity: number | string
  production_status: string
  url: string
  media: Array<{ images: { product_thumb_large?: string; store_hub_large?: string } }>
}

interface RsiMatrixResponse {
  success: number
  data: RsiShip[]
}

// ─── Mapping types RSI → types INQFR ─────────────────────────────────────────

function mapRsiType(type: string, focus: string): string {
  const f = (focus ?? '').toLowerCase()
  const t = (type ?? '').toLowerCase()

  if (f.includes('mining') || f.includes('minage')) return 'minage'
  if (f.includes('fighter') || f.includes('bomber') || f.includes('interceptor') || f.includes('gunship') || f.includes('attack')) return 'combat'
  if (t === 'combat') return 'combat'
  if (f.includes('freight') || f.includes('cargo') || f.includes('hauler') || f.includes('tanker')) return 'transport'
  if (t === 'transport') return 'transport'
  if (f.includes('exploration') || f.includes('pathfinder')) return 'exploration'
  if (t === 'exploration') return 'exploration'
  if (f.includes('support') || f.includes('medical') || f.includes('repair') || f.includes('rescue')) return 'support'
  if (t === 'support') return 'support'
  if (t === 'multi' || f.includes('multi')) return 'multirole'

  return 'autre'
}

// ─── Action principale ────────────────────────────────────────────────────────

export async function syncShipMatrix(): Promise<ActionResult<{ count: number }>> {
  const supabase = await createClient()

  // Vérification admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Non authentifié' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (getRolePrivilege(profile?.role ?? '') < PRIVILEGE.SYNC_MATRIX) {
    return { success: false, error: 'Droits insuffisants — Sage requis' }
  }

  // Fetch RSI Ship Matrix
  let rsiData: RsiShip[]
  try {
    const res = await fetch('https://robertsspaceindustries.com/ship-matrix/index', {
      next: { revalidate: 0 },
    })
    if (!res.ok) throw new Error(`RSI API error: ${res.status}`)
    const json: RsiMatrixResponse = await res.json()
    if (!json.success || !Array.isArray(json.data)) {
      throw new Error('Réponse RSI invalide')
    }
    rsiData = json.data
  } catch (err: unknown) {
    return { success: false, error: `Impossible de contacter RSI : ${err instanceof Error ? err.message : String(err)}` }
  }

  // Mapper et préparer l'upsert
  const rows = rsiData.map((ship) => ({
    id: ship.id,
    name: ship.name,
    manufacturer: ship.manufacturer?.name ?? null,
    ship_type: mapRsiType(ship.type, ship.focus),
    focus: ship.focus ?? null,
    min_crew: Math.round(Number(ship.min_crew)) || 1,
    max_crew: Math.round(Number(ship.max_crew)) || 1,
    cargo_capacity: Math.round(Number(ship.cargocapacity)) || 0,
    production_status: ship.production_status ?? null,
    rsi_url: ship.url ? `https://robertsspaceindustries.com${ship.url}` : null,
    image_url: ship.media?.[0]?.images?.store_hub_large ?? ship.media?.[0]?.images?.product_thumb_large ?? null,
    synced_at: new Date().toISOString(),
  }))

  // Upsert par batch de 100 — via admin client (bypass RLS)
  const adminClient = createAdminClient()
  const BATCH = 100
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH)
    const { error } = await adminClient
      .from('ship_models')
      .upsert(batch, { onConflict: 'id' })
    if (error) return { success: false, error: `Erreur upsert batch ${i}: ${error.message}` }
  }

  revalidatePath('/flotte')
  return { success: true, data: { count: rows.length } }
}

// ─── Lecture légère pour autocomplete ────────────────────────────────────────

export async function getShipModels() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('ship_models')
    .select('id, name, manufacturer, ship_type, focus, min_crew, max_crew')
    .order('name')
  if (error) return []
  return data
}
