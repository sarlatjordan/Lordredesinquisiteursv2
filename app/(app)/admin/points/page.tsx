import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getRolePrivilege, POINT_REASONS, ROLE_COLORS, ROLES, type Role, type PointReason } from '@/lib/constants'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import { Zap, ChevronUp, ChevronDown } from 'lucide-react'
import type { Profile } from '@/types'

export const metadata: Metadata = { title: 'Audit des points' }
export const dynamic = 'force-dynamic'

type PointRow = {
  id: string
  profile_id: string
  points: number
  reason: string
  reason_detail: string | null
  awarded_by: string | null
  created_at: string
  member: Pick<Profile, 'id' | 'username' | 'display_name' | 'avatar_url' | 'role'> | null
  awarder: Pick<Profile, 'id' | 'username' | 'display_name'> | null
}

export default async function AdminPointsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (getRolePrivilege(me?.role ?? '') < 1000) redirect('/dashboard')

  const { data: raw } = await supabase
    .from('member_points')
    .select('*, member:profiles!profile_id(id, username, display_name, avatar_url, role), awarder:profiles!awarded_by(id, username, display_name)')
    .order('created_at', { ascending: false })
    .limit(200)

  const rows = (raw as unknown as PointRow[]) ?? []

  const totalPositive = rows.filter(r => r.points > 0).reduce((s, r) => s + r.points, 0)
  const totalNegative = rows.filter(r => r.points < 0).reduce((s, r) => s + r.points, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/30 shrink-0">
          <Zap className="h-5 w-5 text-amber-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">Audit des points</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {rows.length} attribution{rows.length > 1 ? 's' : ''} — 200 plus récentes
            {' · '}
            <span className="text-green-400">+{totalPositive}</span>
            {' / '}
            <span className="text-destructive">{totalNegative}</span>
          </p>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <Zap className="h-10 w-10 text-muted-foreground/40" />
          <p className="text-muted-foreground">Aucune attribution de points enregistrée.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <ul className="divide-y divide-border">
            {rows.map((row) => {
              const memberRole = (row.member?.role ?? 'aspirant') as Role
              return (
                <li key={row.id} className="flex items-start gap-3 px-4 py-3 hover:bg-accent/30 transition-colors">
                  {/* Signe +/- */}
                  <div className="shrink-0 mt-0.5">
                    {row.points > 0
                      ? <ChevronUp className="h-4 w-4 text-green-400" />
                      : <ChevronDown className="h-4 w-4 text-destructive" />
                    }
                  </div>

                  {/* Avatar membre */}
                  <Link href={`/membres/${row.member?.username ?? ''}`} className="shrink-0">
                    <Avatar className="h-8 w-8 border border-border">
                      <AvatarImage src={row.member?.avatar_url ?? undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {(row.member?.username ?? '?').slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Link>

                  {/* Infos principales */}
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        href={`/membres/${row.member?.username ?? ''}`}
                        className="text-sm font-medium text-foreground hover:text-primary transition-colors truncate"
                      >
                        {row.member?.display_name ?? row.member?.username ?? '—'}
                      </Link>
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${ROLE_COLORS[memberRole]}`}>
                        {ROLES[memberRole]}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {POINT_REASONS[row.reason as PointReason] ?? row.reason}
                      {row.reason_detail && (
                        <span className="text-foreground/70"> — {row.reason_detail}</span>
                      )}
                    </p>
                    <p className="text-[10px] text-muted-foreground/60">
                      {formatDate(row.created_at)}
                      {row.awarder && (
                        <> · par <span className="text-foreground/50">{row.awarder.display_name ?? row.awarder.username}</span></>
                      )}
                    </p>
                  </div>

                  {/* Montant */}
                  <span className={`shrink-0 text-sm font-bold tabular-nums ${row.points > 0 ? 'text-green-400' : 'text-destructive'}`}>
                    {row.points > 0 ? '+' : ''}{row.points}
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
