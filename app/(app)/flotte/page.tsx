import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { ShipCard } from '@/components/flotte/ship-card'
import { AddShipButton } from '@/components/flotte/add-ship-button'
import { HangarSyncDialog } from '@/components/flotte/hangar-sync-dialog'
import { SyncMatrixButton } from '@/components/flotte/sync-matrix-button'
import { Rocket } from 'lucide-react'
import type { ShipWithOwner } from '@/types'
import { SHIP_TYPES, type ShipType, getRolePrivilege, PRIVILEGE } from '@/lib/constants'

export const metadata: Metadata = { title: 'Flotte' }
export const dynamic = 'force-dynamic'

interface FlottePageProps {
  searchParams: Promise<{ type?: string; status?: string }>
}

export default async function FlottePage({ searchParams }: FlottePageProps) {
  const { type, status } = await searchParams
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

  // Tri par propriétaire A→Z (ships sans owner = org, mis en tête), puis par nom de vaisseau
  const allShips = ((shipsResult.data as unknown as ShipWithOwner[]) ?? []).sort((a, b) => {
    const nameA = a.owner ? (a.owner.display_name ?? a.owner.username).toLowerCase() : ''
    const nameB = b.owner ? (b.owner.display_name ?? b.owner.username).toLowerCase() : ''
    if (nameA !== nameB) return nameA.localeCompare(nameB, 'fr')
    return a.name.localeCompare(b.name, 'fr')
  })
  const profile = profileResult.data
  const isAdmin = getRolePrivilege(profile?.role ?? '') >= PRIVILEGE.SYNC_MATRIX

  const modelImageMap: Record<string, string | null> = {}
  for (const m of ((modelsResult.data ?? []) as Array<{ name: string; image_url: string | null }>)) {
    modelImageMap[m.name] = m.image_url
  }

  // Agrégats sur la flotte complète (avant filtre d'affichage)
  const orgShips = allShips.filter((s) => s.is_org_ship).length
  const available = allShips.filter((s) => s.status === 'disponible').length
  const typeCount = allShips.reduce<Record<string, number>>((acc, s) => {
    acc[s.ship_type] = (acc[s.ship_type] ?? 0) + 1
    return acc
  }, {})

  // Filtrage pour la grille d'affichage uniquement
  let ships = allShips
  if (type) ships = ships.filter(s => s.ship_type === type)
  if (status) ships = ships.filter(s => s.status === status)

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Flotte</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {ships.length} vaisseau{ships.length > 1 ? 'x' : ''} enregistré{ships.length > 1 ? 's' : ''}
            {orgShips > 0 && ` — ${orgShips} de l'org`}
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

      {/* Filtres par type */}
      <div className="flex flex-wrap gap-2">
        <a
          href="/flotte"
          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
            !type ? 'bg-primary/10 text-primary border-primary/30' : 'bg-card text-muted-foreground border-border hover:border-primary/20'
          }`}
        >
          Tous
        </a>
        {Object.entries(typeCount).map(([t, count]) => (
          <a
            key={t}
            href={type === t ? '/flotte' : `/flotte?type=${t}`}
            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              type === t ? 'bg-primary/10 text-primary border-primary/30' : 'bg-card text-muted-foreground border-border hover:border-primary/20'
            }`}
          >
            {SHIP_TYPES[t as ShipType] ?? t} ({count})
          </a>
        ))}
      </div>

      {/* Grille de vaisseaux — groupés par propriétaire */}
      {ships.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <Rocket className="h-10 w-10 text-muted-foreground/40" />
          <p className="text-muted-foreground">Aucun vaisseau trouvé.</p>
          {(type || status) && (
            <a href="/flotte" className="text-sm text-primary hover:underline">
              Effacer les filtres
            </a>
          )}
        </div>
      ) : (() => {
        // Regroupement par propriétaire (clé = display_name ?? username, ou 'Organisation')
        const groups: { ownerName: string; ships: typeof ships }[] = []
        for (const ship of ships) {
          const key = ship.owner
            ? (ship.owner.display_name ?? ship.owner.username)
            : 'Organisation'
          const grp = groups.find(g => g.ownerName === key)
          if (grp) grp.ships.push(ship)
          else groups.push({ ownerName: key, ships: [ship] })
        }
        return (
          <div className="space-y-8">
            {groups.map((grp) => (
              <div key={grp.ownerName} className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                    {grp.ownerName}
                  </span>
                  <span className="text-xs text-muted-foreground/50">
                    — {grp.ships.length} vaisseau{grp.ships.length > 1 ? 'x' : ''}
                  </span>
                  <div className="flex-1 border-t border-border/50 ml-1" />
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {grp.ships.map((ship, i) => (
                    <ShipCard key={ship.id} ship={ship} index={i} currentUserId={user?.id} isAdmin={isAdmin} imageUrl={modelImageMap[ship.model] ?? null} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )
      })()}
    </div>
  )
}
