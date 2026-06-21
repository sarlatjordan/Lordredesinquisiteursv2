import { cache } from 'react'
import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getRolePrivilege } from '@/lib/constants'
import { ArrowLeft } from 'lucide-react'
import { MembreDetail } from './membre-detail'
import type {
  Profile, MemberProgression, MemberPromotion,
  MemberPoints, ProfileWithPoints, MemberBadge,
} from '@/types'

export const dynamic = 'force-dynamic'

// Mémoïsé par React pour la durée d'une requête — évite le double fetch entre
// generateMetadata et le body du Server Component.
const getProfileByUsername = cache(async (username: string) => {
  const supabase = await createClient()
  const { data } = await supabase.from('profiles').select('*').eq('username', username).single()
  return data
})

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
  const { username } = await params
  const data = await getProfileByUsername(username)
  return { title: data?.display_name ?? data?.username ?? 'Membre' }
}

type PromotionWithJoin = MemberPromotion & {
  promoter: { id: string; username: string; display_name: string | null } | null
}
type PointWithJoin = MemberPoints & {
  awarder: { id: string; username: string; display_name: string | null } | null
}

export default async function MembrePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  const supabase = await createClient()

  // Vague 1 : auth + profil en parallèle
  // getProfileByUsername est mémoïsé — si generateMetadata l'a déjà appelé,
  // la seconde résolution est instantanée (pas de RTT supplémentaire).
  const [{ data: { user } }, profileRaw] = await Promise.all([
    supabase.auth.getUser(),
    getProfileByUsername(username),
  ])
  if (!user) redirect('/login')
  if (!profileRaw) notFound()
  const profile = profileRaw as Profile

  // Vague 2 : me (dépend de user.id)
  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const myPrivilege = getRolePrivilege(me?.role ?? '')
  const isSage = myPrivilege >= 1000
  const canAwardPoints = myPrivilege >= 400
  const isOwnProfile = profile.id === user.id
  const canSeePoints = isSage || canAwardPoints || isOwnProfile

  // Vague 3 : tout en parallèle avec JOINs pour promoteur/attribuant
  const [
    { data: progression },
    { data: promotionsRaw },
    { data: pointsRaw },
    { count: eventCount },
    { count: opCount },
    { count: shipCount },
    { data: badgesRaw },
  ] = await Promise.all([
    supabase.from('member_progressions').select('*').eq('profile_id', profile.id).single(),
    supabase.from('member_promotions')
      .select('*, promoter:profiles!promoted_by(id, username, display_name)')
      .eq('profile_id', profile.id)
      .order('promoted_at', { ascending: false }),
    canSeePoints
      ? supabase.from('member_points')
          .select('*, awarder:profiles!awarded_by(id, username, display_name)')
          .eq('profile_id', profile.id)
          .order('created_at', { ascending: false })
          .limit(20)
      : Promise.resolve({ data: [], error: null, count: null, status: 200, statusText: 'OK' }),
    supabase.from('event_attendees').select('*', { count: 'exact', head: true }).eq('profile_id', profile.id).eq('status', 'confirme'),
    supabase.from('op_registrations').select('*', { count: 'exact', head: true }).eq('profile_id', profile.id).eq('status', 'confirmed'),
    supabase.from('ships').select('*', { count: 'exact', head: true }).eq('owner_id', profile.id),
    supabase.from('member_badges').select('*').eq('profile_id', profile.id).order('earned_at', { ascending: true }),
  ])

  const promotions: (MemberPromotion & { promoter_name?: string })[] = (
    (promotionsRaw as unknown as PromotionWithJoin[]) ?? []
  ).map((p) => ({
    ...p,
    promoter: undefined,
    promoter_name: p.promoter ? (p.promoter.display_name ?? p.promoter.username) : undefined,
  }))

  const typedPoints = (pointsRaw as unknown as PointWithJoin[]) ?? []
  const points: (MemberPoints & { awarder_name?: string })[] = typedPoints.map((p) => ({
    ...p,
    awarder: undefined,
    reason: p.reason as MemberPoints['reason'],
    awarder_name: p.awarder ? (p.awarder.display_name ?? p.awarder.username) : undefined,
  }))

  const totalPoints = points.reduce((sum, p) => sum + p.points, 0)

  const profileWithPoints: ProfileWithPoints = { ...profile, total_points: totalPoints }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Link
        href="/membres"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour aux membres
      </Link>

      <MembreDetail
        profile={profileWithPoints}
        progression={progression as MemberProgression | null}
        promotions={promotions}
        points={points}
        badges={(badgesRaw as MemberBadge[]) ?? []}
        stats={{ eventCount: eventCount ?? 0, opCount: opCount ?? 0, shipCount: shipCount ?? 0 }}
        permissions={{ isSage, canAwardPoints, isOwnProfile }}
      />
    </div>
  )
}
