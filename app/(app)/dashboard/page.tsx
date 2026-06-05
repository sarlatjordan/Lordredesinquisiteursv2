import type { Metadata } from 'next'
import { Users, CalendarDays, Rocket } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getRolePrivilege, PRIVILEGE } from '@/lib/constants'
import { StatsCard } from '@/components/dashboard/stats-card'
import { RecruitmentStatusCard } from '@/components/dashboard/recruitment-status-card'
import { GuildBankCard } from '@/components/dashboard/guild-bank-card'
import { RecentEvents } from '@/components/dashboard/recent-events'
import { FleetSummary } from '@/components/dashboard/fleet-summary'
import { OnboardingChecklist } from '@/components/dashboard/onboarding-checklist'
import type { EventWithDetails, ShipWithOwner, InventoryStockRow } from '@/types'
import { ONBOARDING_CONFIGS, type RankOnboardingConfig } from '@/lib/constants'
import { getCachedOrgSettings } from '@/lib/cached-org-settings'

export const metadata: Metadata = { title: 'Tableau de bord' }
export const dynamic = 'force-dynamic'

type RawEvent = {
  id: string; title: string; description: string | null; type: string; status: string
  start_at: string; end_at: string | null; location: string | null; max_attendees: number | null
  min_privilege: number; report: string | null; created_by: string | null; created_at: string; updated_at: string
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: me } = user
    ? await supabase.from('profiles').select('role, bio, star_citizen_handle').eq('id', user.id).single()
    : { data: null }
  const privilege = getRolePrivilege(me?.role ?? '')

  const canViewBank = privilege >= PRIVILEGE.VIEW_GUILD_BANK

  const [
    { count: memberCount },
    { count: activeEventCount },
    { count: shipCount },
    { data: upcomingRaw },
    { data: recentShips },
    orgSettings,
    { data: uecItemsRaw },
    { data: attendeeCounts },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('events').select('*', { count: 'exact', head: true }).in('status', ['planifie', 'en_cours']),
    supabase.from('ships').select('*', { count: 'exact', head: true }),
    supabase
      .from('events')
      .select('*')
      .in('status', ['planifie', 'en_cours'])
      .gte('start_at', new Date().toISOString())
      .order('start_at', { ascending: true })
      .limit(5),
    supabase
      .from('ships')
      .select('*, owner:profiles(username, display_name, avatar_url)')
      .order('created_at', { ascending: false })
      .limit(5),
    getCachedOrgSettings(),
    // Solde UEC : uniquement si l'utilisateur a les droits
    canViewBank
      ? supabase
          .from('inventory_items')
          .select('inventory_stock(quantity, reserved_quantity)')
          .eq('type', 'uec')
      : Promise.resolve({ data: [] }),
    supabase.from('event_attendees').select('event_id').eq('status', 'confirme'),
  ])

  // Calcul du solde UEC disponible (quantité totale - réservée)
  // Supabase retourne inventory_stock comme objet (1-1) ou tableau (1-N) selon la relation —
  // on normalise systématiquement en tableau pour éviter le crash .reduce()
  const uecBalance = (uecItemsRaw ?? []).reduce((sum, item) => {
    const raw = (item as unknown as { inventory_stock: InventoryStockRow | InventoryStockRow[] | null }).inventory_stock
    const stocks: InventoryStockRow[] = !raw ? [] : Array.isArray(raw) ? raw : [raw]
    return sum + stocks.reduce((s, st) => s + (st.quantity - st.reserved_quantity), 0)
  }, 0)

  // Onboarding par rang — Aspirant (100) et Consacré (150)
  let onboardingConfig: RankOnboardingConfig | null = null
  let onboardingCompletedSteps: string[] = []
  let onboardingStepsDone: Record<string, boolean> = {}

  const roleKey = me?.role ?? ''
  const rankConfig = ONBOARDING_CONFIGS[roleKey as keyof typeof ONBOARDING_CONFIGS] ?? null

  if (rankConfig && user) {
    onboardingConfig = rankConfig
    const stepKeys = rankConfig.steps.map(s => s.key)

    if (roleKey === 'aspirant') {
      const [progressResult, shipResult, opResult] = await Promise.all([
        supabase.from('onboarding_progress').select('step').eq('profile_id', user.id).in('step', [...stepKeys, rankConfig.bonusStep]),
        supabase.from('ships').select('*', { count: 'exact', head: true }).eq('owner_id', user.id),
        supabase.from('op_registrations').select('*', { count: 'exact', head: true }).eq('profile_id', user.id),
      ])
      onboardingCompletedSteps = (progressResult.data ?? []).map(r => r.step).filter(s => s !== rankConfig.bonusStep)
      onboardingStepsDone = {
        profile:   !!(me?.bio && me?.star_citizen_handle),
        ship:      (shipResult.count ?? 0) > 0,
        operation: (opResult.count ?? 0) > 0,
      }
    } else if (roleKey === 'consacre') {
      const [progressResult, profileResult, eventResult] = await Promise.all([
        supabase.from('onboarding_progress').select('step').eq('profile_id', user.id).in('step', [...stepKeys, rankConfig.bonusStep]),
        supabase.from('profiles').select('discord_id').eq('id', user.id).single(),
        supabase.from('event_attendees').select('*', { count: 'exact', head: true }).eq('profile_id', user.id).eq('status', 'confirme'),
      ])
      onboardingCompletedSteps = (progressResult.data ?? []).map(r => r.step).filter(s => s !== rankConfig.bonusStep)
      onboardingStepsDone = {
        discord_joined: !!(profileResult.data?.discord_id),
        first_event:    (eventResult.count ?? 0) > 0,
      }
    }
  }

  const countMap = (attendeeCounts ?? []).reduce<Record<string, number>>((acc, row) => {
    acc[row.event_id] = (acc[row.event_id] ?? 0) + 1
    return acc
  }, {})

  const normalizedEvents: EventWithDetails[] = ((upcomingRaw as RawEvent[]) ?? []).map((e) => ({
    id: e.id,
    title: e.title,
    description: e.description,
    type: e.type as EventWithDetails['type'],
    status: e.status as EventWithDetails['status'],
    start_at: e.start_at,
    end_at: e.end_at,
    location: e.location,
    max_attendees: e.max_attendees,
    min_privilege: e.min_privilege ?? 0,
    report: e.report,
    created_by: e.created_by,
    created_at: e.created_at,
    updated_at: e.updated_at,
    attendee_count: countMap[e.id] ?? 0,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Tableau de bord</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Vue d&apos;ensemble de l&apos;Ordre des Inquisiteurs
        </p>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Membres actifs" value={memberCount ?? 0} icon={<Users className="h-5 w-5" />}        description="Voir la liste →"         variant="cyan"    index={0} href="/membres" />
        <StatsCard title="Événements"     value={activeEventCount ?? 0} icon={<CalendarDays className="h-5 w-5" />} description="Voir le calendrier →" variant="amber"   index={1} href="/evenements" />
        <StatsCard title="Vaisseaux"      value={shipCount ?? 0} icon={<Rocket className="h-5 w-5" />}         description="Voir la flotte →"        variant="green"   index={2} href="/flotte" />
        <RecruitmentStatusCard open={orgSettings?.recruitment_open ?? true} canToggle={privilege >= 600} index={3} />
      </div>

      {onboardingConfig && (
        <OnboardingChecklist
          config={onboardingConfig}
          completedSteps={onboardingCompletedSteps}
          stepsDone={onboardingStepsDone}
        />
      )}

      {canViewBank && (
        <GuildBankCard balance={uecBalance} index={4} />
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <RecentEvents events={normalizedEvents} />
        <FleetSummary ships={(recentShips as unknown as ShipWithOwner[]) ?? []} />
      </div>
    </div>
  )
}

