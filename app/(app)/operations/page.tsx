import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getRolePrivilege } from '@/lib/constants'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { OpCard } from '@/components/operations/op-card'
import { Target, Plus } from 'lucide-react'
import type { OperationWithDetails, Profile } from '@/types'

export const metadata: Metadata = { title: 'Opérations' }
export const dynamic = 'force-dynamic'

export default async function OperationsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  let userPrivilege = 0
  let canManage = false
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    userPrivilege = getRolePrivilege(profile?.role ?? '')
    canManage = userPrivilege >= 300
  }

  const cols = 'id, title, description, type, status, risk_level, system_name, departure_at, commander_id, estimated_duration_min, min_privilege'
  const [{ data: activeRaw }, { data: pastRaw }] = await Promise.all([
    supabase
      .from('operations')
      .select(cols)
      .in('status', ['planned', 'active'])
      .order('departure_at', { ascending: true }),
    supabase
      .from('operations')
      .select(cols)
      .in('status', ['completed', 'cancelled'])
      .order('departure_at', { ascending: false })
      .limit(20),
  ])

  // Compter les inscriptions et charger les commandants en parallèle
  const allOpIds = [...(activeRaw ?? []), ...(pastRaw ?? [])].map((o) => o.id)
  const commanderIds = [...new Set([...(activeRaw ?? []), ...(pastRaw ?? [])].map((o) => o.commander_id).filter(Boolean))] as string[]

  const [{ data: countData }, { data: commanderProfiles }] = await Promise.all([
    allOpIds.length > 0
      ? supabase.from('op_registrations').select('operation_id').in('operation_id', allOpIds)
      : Promise.resolve({ data: [] as { operation_id: string }[] }),
    commanderIds.length > 0
      ? supabase.from('profiles').select('id, username, display_name, avatar_url').in('id', commanderIds)
      : Promise.resolve({ data: [] as { id: string; username: string; display_name: string | null; avatar_url: string | null }[] }),
  ])

  const countMap = (countData ?? []).reduce<Record<string, number>>((acc, row) => {
    acc[row.operation_id] = (acc[row.operation_id] ?? 0) + 1
    return acc
  }, {})

  const commanderMap = (commanderProfiles ?? []).reduce<Record<string, Pick<Profile, 'username' | 'display_name' | 'avatar_url'>>>((acc, p) => {
    acc[p.id] = p
    return acc
  }, {})

  function enrich(raw: typeof activeRaw): OperationWithDetails[] {
    return ((raw ?? []).map((o) => ({
      ...o,
      type: o.type as OperationWithDetails['type'],
      status: o.status as OperationWithDetails['status'],
      risk_level: o.risk_level as OperationWithDetails['risk_level'],
      registration_count: countMap[o.id] ?? 0,
      commander: o.commander_id ? commanderMap[o.commander_id] ?? null : null,
    })) as unknown as OperationWithDetails[])
  }

  const active = enrich(activeRaw)
  const past = enrich(pastRaw)

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Opérations</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {active.length} opération{active.length > 1 ? 's' : ''} active{active.length > 1 ? 's' : ''}
          </p>
        </div>
        {canManage && (
          <Button asChild size="sm" className="gap-1.5">
            <Link href="/operations/new">
              <Plus className="h-4 w-4" />
              Nouvelle opération
            </Link>
          </Button>
        )}
      </div>

      <Tabs defaultValue="active">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="active">À venir / En cours ({active.length})</TabsTrigger>
          <TabsTrigger value="past">Historique ({past.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-4">
          {active.length === 0 ? (
            <EmptyState message="Aucune opération planifiée" />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {active.map((op, i) => <OpCard key={op.id} op={op} index={i} />)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="past" className="mt-4">
          {past.length === 0 ? (
            <EmptyState message="Aucune opération passée" />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {past.map((op, i) => <OpCard key={op.id} op={op} index={i} />)}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <Target className="h-10 w-10 text-muted-foreground/40" />
      <p className="text-muted-foreground">{message}</p>
    </div>
  )
}
