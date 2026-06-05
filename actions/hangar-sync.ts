'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { ActionResult } from '@/types'
import { getRolePrivilege, PRIVILEGE } from '@/lib/constants'

// ─── Types RSI API interne ────────────────────────────────────────────────────

interface RsiLoginResponse {
  success: number
  code?: string
  data?: { token?: string; account_id?: string }
  msg?: string
}

interface RsiShipEntry {
  id?: number | string
  name?: string
  manufacturer_name?: string
  ship_name?: string
  title?: string
  [key: string]: unknown
}

interface RsiHangarResponse {
  success: number
  data?: {
    ships?: RsiShipEntry[]
    listing?: RsiShipEntry[]
    [key: string]: unknown
  }
  msg?: string
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface SyncResult {
  added: number
  skipped: number
  total: number
}

// ─── Helper : récupérer le profil de l'utilisateur courant ───────────────────

async function getCurrentProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  return profile
}

// ─── Helper : trouver le modèle RSI le plus proche ───────────────────────────

async function findClosestModel(supabase: Awaited<ReturnType<typeof createClient>>, shipName: string) {
  // Recherche exacte d'abord
  const { data: exact } = await supabase
    .from('ship_models')
    .select('*')
    .ilike('name', shipName)
    .limit(1)
    .single()
  if (exact) return exact

  // Recherche partielle (inclut le nom)
  const { data: partial } = await supabase
    .from('ship_models')
    .select('*')
    .ilike('name', `%${shipName}%`)
    .limit(1)
    .single()
  return partial ?? null
}

// ─── Sync via RSI Handle (starcitizen-api.com) ────────────────────────────────

export async function syncHangarFromRsi(targetProfileId?: string): Promise<ActionResult<SyncResult>> {
  const supabase = await createClient()
  const profile = await getCurrentProfile()
  if (!profile) return { success: false, error: 'Non authentifié' }

  // Si targetProfileId fourni, vérifier droits admin
  const profileId = targetProfileId ?? profile.id
  if (targetProfileId && targetProfileId !== profile.id && getRolePrivilege(profile.role) < PRIVILEGE.MANAGE_FLEET) {
    return { success: false, error: 'Droits insuffisants — Gardien requis pour sync un autre profil' }
  }

  // Récupérer le handle RSI du profil cible
  let handle = profile.star_citizen_handle
  if (targetProfileId && targetProfileId !== profile.id) {
    const { data: targetProfile } = await supabase
      .from('profiles')
      .select('star_citizen_handle')
      .eq('id', targetProfileId)
      .single()
    handle = targetProfile?.star_citizen_handle ?? null
  }

  if (!handle) {
    return { success: false, error: 'Handle RSI non configuré sur ton profil. Va dans Paramètres → Profil pour l\'ajouter.' }
  }

  const apiKey = process.env.SC_API_KEY
  if (!apiKey) {
    return { success: false, error: 'Clé API starcitizen-api.com non configurée (SC_API_KEY manquant).' }
  }

  // Appel API
  let rsiShips: Array<{ name: string; [key: string]: unknown }>
  try {
    const res = await fetch(
      `https://api.starcitizen-api.com/${apiKey}/v1/live/user/${encodeURIComponent(handle)}/ships`,
      { next: { revalidate: 0 } }
    )
    if (res.status === 404) {
      return { success: false, error: `Hangar introuvable pour « ${handle} ». Vérifie que ton hangar est Public sur le site RSI.` }
    }
    if (!res.ok) throw new Error(`API error ${res.status}`)
    const json = await res.json()
    if (json.status !== 'ok' || !Array.isArray(json.data)) {
      throw new Error('Réponse API invalide')
    }
    rsiShips = json.data
  } catch (err: unknown) {
    return { success: false, error: `Erreur API : ${err instanceof Error ? err.message : String(err)}` }
  }

  return await upsertShipsForProfile(supabase, profileId, rsiShips.map(s => String(s.name)))
}

// ─── Sync via CSV export RSI ──────────────────────────────────────────────────
// Format CSV officiel RSI :
//   Type,Name,SKU,Price,Upgrade Applied,CCU'd
//   ship,"Aegis Avenger Titan",CC-..., $75.00,,No

export async function syncHangarFromCsv(
  csvContent: string,
  targetProfileId?: string
): Promise<ActionResult<SyncResult>> {
  const supabase = await createClient()
  const profile = await getCurrentProfile()
  if (!profile) return { success: false, error: 'Non authentifié' }

  const profileId = targetProfileId ?? profile.id
  if (targetProfileId && targetProfileId !== profile.id && getRolePrivilege(profile.role) < PRIVILEGE.MANAGE_FLEET) {
    return { success: false, error: 'Droits insuffisants — Gardien requis' }
  }

  // Parser CSV minimal
  const lines = csvContent.trim().split('\n').filter(Boolean)
  if (lines.length < 2) return { success: false, error: 'CSV vide ou invalide' }

  // Détecter les colonnes depuis l'en-tête
  const headers = parseCsvLine(lines[0]).map(h => h.toLowerCase().trim())
  const nameIdx = headers.findIndex(h => h === 'name')
  const typeIdx = headers.findIndex(h => h === 'type')

  if (nameIdx === -1) {
    return { success: false, error: 'Colonne "Name" introuvable dans le CSV. Vérifie le format d\'export RSI.' }
  }

  const shipNames: string[] = []
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i])
    const rowType = typeIdx >= 0 ? cols[typeIdx]?.toLowerCase() : 'ship'
    if (rowType && rowType !== 'ship') continue // skip upgrades, packages, etc.
    const name = cols[nameIdx]?.trim()
    if (name) shipNames.push(name)
  }

  if (shipNames.length === 0) {
    return { success: false, error: 'Aucun vaisseau trouvé dans le CSV.' }
  }

  return await upsertShipsForProfile(supabase, profileId, shipNames)
}

// ─── Core : créer/mettre à jour les vaisseaux pour un profil ─────────────────

async function upsertShipsForProfile(
  supabase: Awaited<ReturnType<typeof createClient>>,
  profileId: string,
  shipNames: string[]
): Promise<ActionResult<SyncResult>> {
  // Récupérer les vaisseaux existants de ce profil
  const { data: existingShips } = await supabase
    .from('ships')
    .select('model')
    .eq('owner_id', profileId)

  const existingModels = new Set((existingShips ?? []).map(s => s.model.toLowerCase()))

  let added = 0
  let skipped = 0

  for (const shipName of shipNames) {
    const normalizedName = shipName.toLowerCase()

    // Skip si déjà dans le hangar
    if (existingModels.has(normalizedName)) {
      skipped++
      continue
    }

    // Trouver le modèle RSI correspondant pour auto-remplir les données
    const model = await findClosestModel(supabase, shipName)

    const shipData = {
      name: model?.name ?? shipName,       // Nom = modèle RSI ou nom brut
      model: model?.name ?? shipName,
      manufacturer: model?.manufacturer ?? null,
      ship_type: (model?.ship_type ?? 'autre') as 'combat' | 'transport' | 'minage' | 'exploration' | 'support' | 'multirole' | 'autre',
      crew_size: model?.max_crew ?? 1,
      owner_id: profileId,
      status: 'disponible' as const,
      is_org_ship: false,
      notes: 'Importé depuis le hangar RSI',
    }

    const { error } = await supabase.from('ships').insert(shipData)
    if (!error) {
      added++
      existingModels.add(normalizedName) // éviter les doublons dans la même passe
    }
  }

  revalidatePath('/flotte')
  revalidatePath('/dashboard')

  return {
    success: true,
    data: { added, skipped, total: shipNames.length },
  }
}

// ─── Sync via identifiants RSI (API interne RSI) ─────────────────────────────
// Le mot de passe est utilisé une seule fois pour obtenir un token, jamais stocké.

export async function syncHangarFromRsiLogin(
  rsiUsername: string,
  rsiPassword: string,
  targetProfileId?: string
): Promise<ActionResult<SyncResult>> {
  const supabase = await createClient()
  const profile = await getCurrentProfile()
  if (!profile) return { success: false, error: 'Non authentifié' }

  const profileId = targetProfileId ?? profile.id
  if (targetProfileId && targetProfileId !== profile.id && getRolePrivilege(profile.role) < PRIVILEGE.MANAGE_FLEET) {
    return { success: false, error: 'Droits insuffisants — Gardien requis' }
  }

  // ── Étape 1 : Token anonyme RSI ─────────────────────────────────────────────
  let rsiToken: string
  let allCookies = ''
  try {
    // RSI flow en 2 étapes :
    // 1. setAuthToken → retourne un JWT anonyme (data = string directe)
    // 2. signin → utilise ce JWT pour s'authentifier → retourne un JWT utilisateur

    const RSI_BASE = 'https://robertsspaceindustries.com'
    const commonHeaders = {
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Origin': RSI_BASE,
      'Referer': `${RSI_BASE}/en/login`,
    }

    // Étape 1a : token anonyme
    const anonRes = await fetch(`${RSI_BASE}/api/account/v2/setAuthToken`, {
      method: 'POST',
      headers: { ...commonHeaders, 'X-Rsi-Token': 'anonymous' },
      body: JSON.stringify({}),
      cache: 'no-store',
    })
    if (!anonRes.ok) return { success: false, error: `RSI indisponible (${anonRes.status})` }

    const anonData = await anonRes.json()
    const anonToken: string = typeof anonData.data === 'string' ? anonData.data : (anonData.data?.token ?? '')
    // Récupérer les cookies de session
    const anonCookies = anonRes.headers.getSetCookie?.() ?? []

    if (!anonToken) return { success: false, error: 'Impossible d\'obtenir un token anonyme RSI' }

    // Étape 1b : upgrade vers token utilisateur
    const loginRes = await fetch(`${RSI_BASE}/api/account/v2/setAuthToken`, {
      method: 'POST',
      headers: {
        ...commonHeaders,
        'X-Rsi-Token': anonToken,
        'Cookie': anonCookies.join('; '),
      },
      body: JSON.stringify({ username: rsiUsername, password: rsiPassword }),
      cache: 'no-store',
    })

    const loginText = await loginRes.text()
    let loginData: RsiLoginResponse & { data?: string | { token?: string } }
    try { loginData = JSON.parse(loginText) }
    catch { return { success: false, error: `Réponse RSI invalide : ${loginText.slice(0, 100)}` } }

    if (process.env.NODE_ENV === 'development') {
      console.log('[RSI login] success:', loginData.success, 'code:', loginData.code ?? loginData.msg)
    }

    if (!loginData.success) {
      const msg = (loginData.msg ?? loginData.code ?? '').toLowerCase()
      if (msg.includes('password') || msg.includes('invalid') || msg.includes('wrong') || msg.includes('incorrect')) {
        return { success: false, error: 'Identifiants RSI incorrects.' }
      }
      return { success: false, error: `Connexion échouée : ${loginData.msg ?? loginData.code ?? 'Erreur inconnue'}` }
    }

    rsiToken = typeof loginData.data === 'string' ? loginData.data : (loginData.data?.token ?? '')
    if (!rsiToken) return { success: false, error: 'Token RSI manquant dans la réponse' }

    // Cookies de la session authentifiée
    const loginCookies = loginRes.headers.getSetCookie?.() ?? []
    const allCookies = [...anonCookies, ...loginCookies].join('; ')

  } catch (err: unknown) {
    return { success: false, error: `Impossible de contacter RSI : ${err instanceof Error ? err.message : String(err)}` }
  }

  // ── Étape 2 : Récupération du hangar ────────────────────────────────────────
  let shipNames: string[]
  try {
    const RSI_BASE2 = 'https://robertsspaceindustries.com'
    const baseHeaders = {
      'Content-Type': 'application/json',
      'X-Rsi-Token': rsiToken,
      'Rsi-Token': rsiToken,
      'Cookie': allCookies,
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Origin': RSI_BASE2,
      'Referer': `${RSI_BASE2}/en/account/pledges`,
    }
    const baseBody = JSON.stringify({ itemsPerPage: 1000, offset: 0, sort: 'name', direction: 'asc' })

    // Endpoints qui répondent 400 (existent mais mauvais body) — tester différents formats
    const bodyVariants = [
      JSON.stringify({ itemsPerPage: 100, page: 1 }),
      JSON.stringify({ page: 1, pagesize: 100 }),
      JSON.stringify({ type: 'ship', page: 1, pagesize: 100 }),
      JSON.stringify({}),
    ]

    const endpoints: Array<{ url: string; method: string; body: string | undefined }> = [
      // Anciens endpoints (404 connus, on réessaie avec cookies)
      { url: `${RSI_BASE2}/api/ship-upgrades/userData`, method: 'POST', body: baseBody },
      // Endpoints 400 — tenter différents formats de body
      ...bodyVariants.map(b => ({ url: `${RSI_BASE2}/api/account/v2/ships`, method: 'POST', body: b })),
      ...bodyVariants.map(b => ({ url: `${RSI_BASE2}/api/account/v2/pledges`, method: 'POST', body: b })),
      // GET sans body
      { url: `${RSI_BASE2}/api/account/v2/ships`, method: 'GET', body: undefined },
      { url: `${RSI_BASE2}/api/account/v2/pledges`, method: 'GET', body: undefined },
      // Page HTML (server-side render avec cookies auth)
      { url: `${RSI_BASE2}/en/account/pledges?page=1&pagesize=100`, method: 'GET', body: undefined },
    ]

    let hangarData: RsiHangarResponse | null = null

    for (const ep of endpoints) {
      const res = await fetch(ep.url, {
        method: ep.method,
        headers: baseHeaders,
        body: ep.body,
        cache: 'no-store',
      })
      if (res.status === 400) {
        const errText = await res.text()
        if (process.env.NODE_ENV === 'development') {
          console.log(`[RSI hangar] ${ep.url} → 400 body:`, errText.slice(0, 200))
        }
        continue
      }
      if (process.env.NODE_ENV === 'development') {
        console.log(`[RSI hangar] ${ep.url} → ${res.status}`)
      }
      if (!res.ok) continue

      const text = await res.text()

      // Si c'est la page HTML des pledges
      if (ep.url.includes('/en/account/pledges')) {
        if (process.env.NODE_ENV === 'development') {
          console.log('[RSI pledges HTML] length:', text.length)
        }

        // Chercher __NEXT_DATA__ (Next.js SSR)
        const nextDataMatch = text.match(/<script id="__NEXT_DATA__"[^>]*>([^<]+)<\/script>/)
        if (nextDataMatch) {
          if (process.env.NODE_ENV === 'development') {
            console.log('[RSI pledges HTML] found __NEXT_DATA__, length:', nextDataMatch[1].length)
            console.log('[RSI pledges HTML] __NEXT_DATA__ snippet:', nextDataMatch[1].slice(0, 500))
          }
        } else {
          if (process.env.NODE_ENV === 'development') {
            console.log('[RSI pledges HTML] no __NEXT_DATA__ found')
          }
        }

        // Chercher window.__INITIAL_STATE__
        const initialStateMatch = text.match(/window\.__INITIAL_STATE__\s*=\s*({.+?})\s*;/)
        if (initialStateMatch && process.env.NODE_ENV === 'development') console.log('[RSI pledges HTML] found __INITIAL_STATE__')

        // Chercher des noms de vaisseaux connus
        const knownShips = ['avenger', 'constellation', 'cutlass', 'hornet', 'freelancer', 'aurora', 'prospector', '300i', 'gladius']
        const foundShips = knownShips.filter(s => text.toLowerCase().includes(s))
        if (process.env.NODE_ENV === 'development') {
          console.log('[RSI pledges HTML] ships found in HTML:', foundShips)
        }

        // Log un snippet du milieu du HTML (après les scripts du head)
        const bodyStart = text.indexOf('<body')
        if (bodyStart > 0 && process.env.NODE_ENV === 'development') console.log('[RSI pledges HTML] body snippet:', text.slice(bodyStart, bodyStart + 1000))

        hangarData = { success: 1, data: { _html: text } as unknown as RsiHangarResponse['data'] }
        break
      }

      try {
        const json = JSON.parse(text) as RsiHangarResponse
        if (json.success) { hangarData = json; break }
        if (process.env.NODE_ENV === 'development') {
          console.log(`[RSI hangar] success=0 msg=${json.msg}`)
        }
      } catch { continue }
    }

    if (!hangarData) {
      return { success: false, error: 'Aucun endpoint RSI hangar disponible. RSI a peut-être changé son API.' }
    }

    // L'API peut retourner ships, listing, ou data directement
    const entries: RsiShipEntry[] = hangarData.data?.ships ?? hangarData.data?.listing ?? []

    if (entries.length === 0) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[RSI hangar] data keys:', Object.keys(hangarData.data ?? {}))
      }
      return { success: false, error: 'Aucun vaisseau trouvé. Log console pour debug structure.' }
    }

    shipNames = entries
      .map(s => (s.name ?? s.ship_name ?? s.title ?? '').trim())
      .filter(Boolean)
  } catch (err: unknown) {
    return { success: false, error: `Erreur hangar : ${err instanceof Error ? err.message : String(err)}` }
  }

  // ── Étape 3 : Import dans la DB ──────────────────────────────────────────────
  return await upsertShipsForProfile(supabase, profileId, shipNames)
}

// ─── Sync via bookmarklet (appelé depuis la page /flotte?rsi_import=...) ─────

export async function syncHangarFromBookmarklet(
  shipNames: string[],
  targetProfileId?: string
): Promise<ActionResult<SyncResult>> {
  const supabase = await createClient()
  const profile = await getCurrentProfile()
  if (!profile) return { success: false, error: 'Non authentifié' }
  const profileId = targetProfileId ?? profile.id
  return await upsertShipsForProfile(supabase, profileId, shipNames)
}

// ─── Helper CSV parser (gère les guillemets) ──────────────────────────────────

function parseCsvLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++ }
      else inQuotes = !inQuotes
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += ch
    }
  }
  result.push(current.trim())
  return result
}
