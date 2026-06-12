import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { ShipCard } from '@/components/flotte/ship-card'
import { AddShipButton } from '@/components/flotte/add-ship-button'
import { HangarSyncDialog } from '@/components/flotte/hangar-sync-dialog'
import { SyncMatrixButton } from '@/components/flotte/sync-matrix-button'
import { BookmarkletImporter } from '@/components/flotte/bookmarklet-importer'
import { FlotteOwnerFilter } from '@/components/flotte/flotte-owner-filter'
import { Rocket } from 'lucide-react'
import type { ShipWithOwner } from '@/types'
import { SHIP_TYPES, type ShipType, getRolePrivilege, PRIVILEGE } from '@/lib/constants'

export const metadata: Metadata = { title: 'Flotte' }
export const dynamic = 'force-dynamic'

interface FlottePageProps {
  searchParams: Promise<{ type?: string; status?: string; owner?: string; rsi_import?: string }>
}

export default async function FlottePage({ searchParams }: FlottePageProps) {
  const { type, status, owner, rsi_import } = await searchParams
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const [shipsResult, profileResult, modelsResult] = await Promise.all([
    supabase
      .from('ships')
      .select(`*, owner:profiles(username, display_name, avatar_url)`)
      .order('name', { ascending: true }),
    user
      ? supabase.from('profiles').select('role, star_citizen_handle').eq('id', user.id).single()
      : Promise.resolve({ data: null }),
    supabase
      .from('ship_models')
      .select('name, image_url'),
  ])

  // Tri global par nom de vaisseau A→Z
  const allShips = ((shipsResult.data as unknown as ShipWithOwner[]) ?? []).sort((a, b) =>
    a.name.localeCompare(b.name, 'fr')
  )

  const profile = profileResult.data
  const isAdmin = getRolePrivilege(profile?.role ?? '') >= PRIVILEGE.SYNC_MATRIX

  const modelImageMap: Record<string, string | null> = {}
  for (const m of ((modelsResult.data ?? []) as Array<{ name: string; image_url: string | null }>)) {
    modelImageMap[m.name] = m.image_url
  }

  // Liste des propriétaires uniques pour le filtre
  const ownerMap = new Map<string, string>()
  for (const ship of allShips) {
    if (ship.owner) ownerMap.set(ship.owner.username, ship.owner.display_name ?? ship.owner.username)
  }
  const owners = Array.from(ownerMap.entries())
    .sort(([, a], [, b]) => a.localeCompare(b, 'fr'))
    .map(([username, displayName]) => ({ username, displayName }))
  const hasOrgShips = allShips.some((s) => !s.owner)

  // Agrégats sur la flotte complète (avant filtre d'affichage)
  const orgShipsCount = allShips.filter((s) => !s.owner).length
  const available = allShips.filter((s) => s.status === 'disponible').length
  const typeCount = allShips.reduce<Record<string, number>>((acc, s) => {
    acc[s.ship_type] = (acc[s.ship_type] ?? 0) + 1
    return acc
  }, {})

  // Filtrage pour la grille d'affichage uniquement
  let ships = allShips
  if (type) ships = ships.filter((s) => s.ship_type === type)
  if (status) ships = ships.filter((s) => s.status === status)
  if (owner === 'org') ships = ships.filter((s) => !s.owner)
  else if (owner) ships = ships.filter((s) => s.owner?.username === owner)

  const hasActiveFilters = type || status || owner

  return (
    <div className="space-y-6">
      {rsi_import && <BookmarkletImporter encoded={rsi_import} />}

      {/* En-tête */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Flotte</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {ships.length} vaisseau{ships.length > 1 ? 'x' : ''} affiché{ships.length > 1 ? 's' : ''}
            {orgShipsCount > 0 && ` — ${orgShipsCount} de l'org`}
            {available > 0 && ` — ${available} disponible${available > 1 ? 's' : ''}`}
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          <HangarSyncDialog targetProfileId={user?.id} />
          <AddShipButton />
        </div>
      </div>

      {/* Bouton admin : sync matrice RSI */}
      {isAdmin && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-border bg-muted/20">
          <span className="text-xs text-muted-foreground">Admin ·</span>
          <SyncMatrixButton />
        </div>
      )}

      {/* Filtres */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Filtre par type */}
        <a
          href={owner ? `/flotte?owner=${owner}` : '/flotte'}
          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
            !type ? 'bg-primary/10 text-primary border-primary/30' : 'bg-card text-muted-foreground border-border hover:border-primary/20'
          }`}
        >
          Tous
        </a>
        {Object.entries(typeCount).map(([t, count]) => {
          const isActive = type === t
          const href = isActive
            ? (owner ? `/flotte?owner=${owner}` : '/flotte')
            : (owner ? `/flotte?type=${t}&owner=${owner}` : `/flotte?type=${t}`)
          return (
            <a
              key={t}
              href={href}
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                isActive ? 'bg-primary/10 text-primary border-primary/30' : 'bg-card text-muted-foreground border-border hover:border-primary/20'
              }`}
            >
              {SHIP_TYPES[t as ShipType] ?? t} ({count})
            </a>
          )
        })}

        {/* Pin corpo */}
        {hasOrgShips && (
          <>
            <div className="w-px h-5 bg-border mx-1" />
            <a
              href={owner === 'org' ? (type ? `/flotte?type=${type}` : '/flotte') : (type ? `/flotte?type=${type}&owner=org` : '/flotte?owner=org')}
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                owner === 'org' ? 'bg-primary/10 text-primary border-primary/30' : 'bg-card text-muted-foreground border-border hover:border-primary/20'
              }`}
            >
              Corpo ({orgShipsCount})
            </a>
          </>
        )}

        {/* Séparateur visuel */}
        <div className="w-px h-5 bg-border mx-1" />

        {/* Filtre par propriétaire */}
        <FlotteOwnerFilter owners={owners} hasOrgShips={hasOrgShips} />
      </div>

      {/* Grille de vaisseaux — triée par nom, à plat */}
      {ships.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <Rocket className="h-10 w-10 text-muted-foreground/40" />
          <p className="text-muted-foreground">Aucun vaisseau trouvé.</p>
          {hasActiveFilters && (
            <a href="/flotte" className="text-sm text-primary hover:underline">
              Effacer les filtres
            </a>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ships.map((ship, i) => (
            <ShipCard
              key={ship.id}
              ship={ship}
              index={i}
              currentUserId={user?.id}
              isAdmin={isAdmin}
              imageUrl={modelImageMap[ship.model] ?? null}
            />
          ))}
        </div>
      )}
    </div>
  )
}
