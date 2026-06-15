import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getRolePrivilege, ROLES, type Role } from '@/lib/constants'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Users, Clock } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import type { Profile } from '@/types'

export const metadata: Metadata = { title: 'Activité membres' }
export const dynamic = 'force-dynamic'

export default async function AdminActivitePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const admin = createAdminClient()

  const [profileResult, rawResult] = await Promise.all([
    supabase.from('profiles').select('role').eq('id', user.id).single(),
    admin.from('profiles').select('*').eq('is_active', true).lt('last_seen_at', thirtyDaysAgo).order('last_seen_at', { ascending: true }),
  ])

  if (!profileResult.data || getRolePrivilege(profileResult.data.role) < 1000) redirect('/dashboard')

  const members = (rawResult.data as Profile[]) ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/30 shrink-0">
          <Users className="h-5 w-5 text-amber-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">Activité membres</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {members.length} membre{members.length > 1 ? 's' : ''} inactif{members.length > 1 ? 's' : ''} depuis plus de 30 jours
          </p>
        </div>
      </div>

      {members.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <Users className="h-10 w-10 text-muted-foreground/40" />
          <p className="text-muted-foreground">Tous les membres sont actifs récemment. 🎉</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <ul className="divide-y divide-border">
            {members.map((member) => (
              <li key={member.id}>
                <Link
                  href={`/membres/${member.username}`}
                  className="flex items-center gap-4 px-4 py-3 hover:bg-accent/50 transition-colors"
                >
                  <Avatar className="h-9 w-9 border border-border shrink-0">
                    <AvatarImage src={member.avatar_url ?? undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {member.username.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {member.display_name ?? member.username}
                    </p>
                    <p className="text-xs text-muted-foreground">@{member.username}</p>
                  </div>

                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-muted-foreground shrink-0 hidden sm:inline-flex">
                    {ROLES[member.role as Role] ?? member.role}
                  </Badge>

                  <div className="text-right shrink-0">
                    <p className="text-xs text-amber-400 flex items-center gap-1 justify-end">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(member.last_seen_at), { locale: fr, addSuffix: true })}
                    </p>
                    <p className="text-[10px] text-muted-foreground/60">
                      {new Date(member.last_seen_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
