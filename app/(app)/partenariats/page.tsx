import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getRolePrivilege } from '@/lib/constants'
import { PartnershipCard } from '@/components/partenariats/partnership-card'
import { Handshake, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Partnership } from '@/types'

export const metadata: Metadata = { title: 'Partenariats' }
export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{ rel?: string; status?: string }>
}

export default async function PartenariatsPage({ searchParams }: PageProps) {
  const { rel, status } = await searchParams
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: me } = user
    ? await supabase.from('profiles').select('role').eq('id', user.id).single()
    : { data: null }
  const canManage = getRolePrivilege(me?.role ?? '') >= 300

  let query = supabase
    .from('partnerships')
    .select('*')
    .order('relationship')
    .order('name')

  if (rel)    query = query.eq('relationship', rel as Partnership['relationship'])
  if (status) query = query.eq('status',       status as Partnership['status'])

  const { data } = await query
  const partnerships = (data ?? []) as Partnership[]

  const RELATIONS = ['alliance', 'neutral', 'trading', 'enemy'] as const
  const STATUSES  = ['active', 'negotiating', 'inactive'] as const
  const REL_LABELS: Record<string, string> = { alliance: 'Alliance', neutral: 'Neutre', trading: 'Commerce', enemy: 'Ennemi' }
  const STA_LABELS: Record<string, string> = { active: 'Actif', negotiating: 'En négociation', inactive: 'Inactif' }

  const countByRel = partnerships.reduce<Record<string, number>>((acc, p) => {
    acc[p.relationship] = (acc[p.relationship] ?? 0) + 1
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Partenariats</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {partnerships.length} partenariat{partnerships.length > 1 ? 's' : ''}
          </p>
        </div>
        {canManage && (
          <Button asChild size="sm" className="gap-1.5">
            <Link href="/partenariats/new">
              <Plus className="h-4 w-4" />
              Nouveau partenariat
            </Link>
          </Button>
        )}
      </div>

      {/* Filtres relation */}
      <div className="flex flex-wrap gap-2">
        <FilterChip href="/partenariats" label={`Tous (${partnerships.length})`} active={!rel && !status} />
        {RELATIONS.filter((r) => countByRel[r]).map((r) => (
          <FilterChip key={r} href={`/partenariats?rel=${r}`} label={`${REL_LABELS[r]} (${countByRel[r]})`} active={rel === r} />
        ))}
        <span className="border-l border-border mx-1" />
        {STATUSES.map((s) => (
          <FilterChip key={s} href={`/partenariats?status=${s}`} label={STA_LABELS[s]} active={status === s} />
        ))}
      </div>

      {partnerships.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <Handshake className="h-10 w-10 text-muted-foreground/40" />
          <p className="text-muted-foreground">Aucun partenariat enregistré.</p>
          {canManage && (
            <Button asChild size="sm" variant="outline">
              <Link href="/partenariats/new">Ajouter le premier</Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {partnerships.map((p, i) => (
            <PartnershipCard key={p.id} partnership={p} index={i} />
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
