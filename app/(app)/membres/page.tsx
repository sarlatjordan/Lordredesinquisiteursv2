import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { MemberCard } from '@/components/membres/member-card'
import { MembresRanking } from '@/components/membres/membres-ranking'
import { Users, Trophy } from 'lucide-react'
import type { Profile, ProfileWithPoints } from '@/types'
import { ROLES, type Role, getRolePrivilege, PRIVILEGE } from '@/lib/constants'

export const metadata: Metadata = { title: 'Membres' }
export const dynamic = 'force-dynamic'

interface MembresPageProps {
  searchParams: Promise<{ role?: string; search?: string; vue?: string }>
}

export default async function MembresPage({ searchParams }: MembresPageProps) {
  const { role, search, vue } = await searchParams
  const isRanking = vue === 'classement'
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  let userPrivilege = 0
  let isAdmin = false
  let canAwardPoints = false
  if (user) {
    const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    userPrivilege = getRolePrivilege(me?.role ?? '')
    isAdmin = userPrivilege >= PRIVILEGE.MANAGE_MEMBERS
    canAwardPoints = userPrivilege >= 300
  }

  // Points totaux par membre — agrégation SQL (évite full-scan JS)
  const { data: pointsData } = await supabase.rpc('get_member_points_totals')
  const pointsMap = (pointsData ?? []).reduce<Record<string, number>>((acc, row) => {
    acc[row.profile_id] = row.total_points
    return acc
  }, {})

  // Membres
  let query = supabase
    .from('profiles')
    .select('id, username, display_name, role, avatar_url, star_citizen_handle, joined_at, is_active, bio')
    .eq('is_active', true)
    .order('role', { ascending: true })
    .order('joined_at', { ascending: true })

  const validRoles = Object.keys(ROLES)
  if (role && validRoles.includes(role)) query = query.eq('role', role as Role)
  if (search) query = query.or(`username.ilike.%${search}%,display_name.ilike.%${search}%,star_citizen_handle.ilike.%${search}%`)

  const { data: members } = await query
  const profiles = (members as unknown as Profile[]) ?? []

  const byRole = profiles.reduce<Record<string, number>>((acc, p) => {
    acc[p.role] = (acc[p.role] ?? 0) + 1
    return acc
  }, {})

  // Classement — tous membres avec leurs points, triés desc
  const ranked: ProfileWithPoints[] = profiles
    .map((p) => ({ ...p, total_points: pointsMap[p.id] ?? 0 }))
    .sort((a, b) => b.total_points - a.total_points)

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Membres</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {profiles.length} membre{profiles.length > 1 ? 's' : ''} actif{profiles.length > 1 ? 's' : ''}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {Object.entries(byRole).map(([r, count]) => (
            <a
              key={r}
              href={role === r ? '/membres' : `/membres?role=${r}`}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                role === r
                  ? 'bg-primary/10 text-primary border-primary/30'
                  : 'bg-card text-muted-foreground border-border hover:border-primary/20'
              }`}
            >
              <Users className="h-3 w-3" />
              {ROLES[r as Role] ?? r} ({count})
            </a>
          ))}
        </div>
      </div>

      {/* Onglets vue */}
      <div className="flex items-center gap-1 border-b border-border">
        <a
          href="/membres"
          className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            !isRanking
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Users className="h-4 w-4" />
          Membres
        </a>
        <a
          href="/membres?vue=classement"
          className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            isRanking
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Trophy className="h-4 w-4" />
          Classement
        </a>
      </div>

      {isRanking ? (
        <MembresRanking members={ranked} currentUserId={user?.id} canAwardPoints={canAwardPoints} />
      ) : (
        <>
          {/* Filtre recherche */}
          <form method="get" className="flex gap-2 max-w-md">
            <input
              name="search"
              defaultValue={search}
              placeholder="Rechercher un membre…"
              className="flex-1 h-9 rounded-md border border-input bg-input px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              aria-label="Rechercher un membre"
            />
            {role && <input type="hidden" name="role" value={role} />}
            <button
              type="submit"
              className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Chercher
            </button>
            {(search || role) && (
              <a
                href="/membres"
                className="h-9 px-3 rounded-md border border-border text-sm text-muted-foreground hover:text-foreground flex items-center transition-colors"
              >
                Réinitialiser
              </a>
            )}
          </form>

          {profiles.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <Users className="h-10 w-10 text-muted-foreground/40" />
              <p className="text-muted-foreground">Aucun membre trouvé.</p>
              {(search || role) && (
                <a href="/membres" className="text-sm text-primary hover:underline">Effacer les filtres</a>
              )}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {profiles.map((profile, i) => (
                <MemberCard
                  key={profile.id}
                  profile={profile}
                  index={i}
                  isAdmin={isAdmin}
                  canAwardPoints={canAwardPoints}
                  currentUserId={user?.id}
                  totalPoints={pointsMap[profile.id] ?? 0}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
