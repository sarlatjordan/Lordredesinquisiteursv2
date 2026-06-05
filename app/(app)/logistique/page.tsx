import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getRolePrivilege, INVENTORY_ITEM_TYPES, type InventoryItemType } from '@/lib/constants'
import { InventoryItemCard } from '@/components/logistique/inventory-item-card'
import { Package, Plus, Landmark } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PendingResources } from '@/components/logistique/pending-resources'
import type { InventoryItem, InventoryStock, InventoryItemWithStock } from '@/types'
import type { OpResourceWithOp } from '@/types'

export const metadata: Metadata = { title: 'Logistique' }
export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{ type?: string }>
}

export default async function LogistiquePage({ searchParams }: PageProps) {
  const { type: typeFilter } = await searchParams
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: me } = user
    ? await supabase.from('profiles').select('role').eq('id', user.id).single()
    : { data: null }
  const canManage = getRolePrivilege(me?.role ?? '') >= 300

  const [
    { data: itemsRaw },
    { data: stocksRaw },
    { data: pendingResourcesRaw },
  ] = await Promise.all([
    supabase.from('inventory_items').select('*').order('type').order('name'),
    supabase.from('inventory_stock').select('*'),
    supabase
      .from('op_resources')
      .select('*, operation:operations(id,title,status), item:inventory_items(name,type)')
      .eq('status', 'pending_request')
      .order('created_at', { ascending: false }),
  ])

  const stockMap = (stocksRaw ?? []).reduce<Record<string, InventoryStock>>((acc, s) => {
    acc[s.item_id] = s as InventoryStock
    return acc
  }, {})

  const allItems: InventoryItemWithStock[] = (itemsRaw ?? []).map((item) => ({
    ...(item as InventoryItem),
    stock: stockMap[item.id] ?? null,
  }))

  const filtered = typeFilter
    ? allItems.filter((i) => i.type === typeFilter)
    : allItems

  const countByType = allItems.reduce<Record<string, number>>((acc, i) => {
    acc[i.type] = (acc[i.type] ?? 0) + 1
    return acc
  }, {})

  // Solde UEC corporatif : somme disponible de tous les items type='uec'
  const uecItems = allItems.filter((i) => i.type === 'uec')
  const uecBalance = uecItems.reduce((sum, i) => {
    const avail = i.stock ? i.stock.quantity - i.stock.reserved_quantity : 0
    return sum + avail
  }, 0)

  const pendingResources = (pendingResourcesRaw ?? []) as unknown as OpResourceWithOp[]

  const TYPES = Object.keys(INVENTORY_ITEM_TYPES) as InventoryItemType[]

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Logistique</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {allItems.length} item{allItems.length > 1 ? 's' : ''} en inventaire
          </p>
        </div>
        {canManage && (
          <Button asChild size="sm" className="gap-1.5">
            <Link href="/logistique/new">
              <Plus className="h-4 w-4" />
              Ajouter un item
            </Link>
          </Button>
        )}
      </div>

      {/* Solde corporatif */}
      <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 flex items-center gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
          <Landmark className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Solde corporatif</p>
          <p className="text-2xl font-bold text-primary tabular-nums">
            {uecBalance.toLocaleString('fr-FR')} <span className="text-base font-medium">UEC</span>
          </p>
          {uecItems.length > 1 && (
            <p className="text-xs text-muted-foreground mt-0.5">{uecItems.length} comptes UEC</p>
          )}
        </div>
      </div>

      {/* Demandes de ressources en attente (opérations) */}
      <PendingResources resources={pendingResources} />

      {/* Filtres type */}
      <div className="flex flex-wrap gap-2">
        <FilterChip href="/logistique" label={`Tous (${allItems.length})`} active={!typeFilter} />
        {TYPES.filter((t) => countByType[t]).map((t) => (
          <FilterChip
            key={t}
            href={`/logistique?type=${t}`}
            label={`${INVENTORY_ITEM_TYPES[t]} (${countByType[t]})`}
            active={typeFilter === t}
          />
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <Package className="h-10 w-10 text-muted-foreground/40" />
          <p className="text-muted-foreground">
            {typeFilter ? 'Aucun item dans cette catégorie.' : 'Inventaire vide.'}
          </p>
          {canManage && (
            <Button asChild size="sm" variant="outline">
              <Link href="/logistique/new">Ajouter le premier item</Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((item, i) => (
            <InventoryItemCard key={item.id} item={item} index={i} />
          ))}
        </div>
      )}
    </div>
  )
}

function FilterChip({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
        active
          ? 'bg-primary/10 text-primary border-primary/30'
          : 'bg-card text-muted-foreground border-border hover:border-primary/20'
      }`}
    >
      {label}
    </Link>
  )
}
