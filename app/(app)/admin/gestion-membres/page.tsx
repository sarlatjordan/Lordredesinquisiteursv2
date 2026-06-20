import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getRolePrivilege } from '@/lib/constants'
import { GestionMembresClient } from './gestion-membres-client'
import type { Application, RankEvaluationWithProfiles, PromotionHistoryItem, Profile } from '@/types'

export const metadata: Metadata = { title: 'Gestion Membres' }
export const dynamic = 'force-dynamic'

export default async function GestionMembresPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const privilege = getRolePrivilege(me?.role ?? '')
  if (privilege < 600) redirect('/dashboard')

  const isSage = privilege >= 1000

  const [evalsResult, membersResult, historyResult] = await Promise.all([
    supabase
      .from('rank_evaluations')
      .select('*, member:profiles!rank_evaluations_member_id_fkey(id,username,display_name,avatar_url,role), initiator:profiles!rank_evaluations_initiated_by_fkey(id,username,display_name)')
      .in('status', ['pending', 'in_progress'])
      .order('created_at', { ascending: true }),
    supabase
      .from('profiles')
      .select('id, username, display_name, role')
      .in('role', ['aspirant', 'consacre', 'gardien', 'inquisiteur', 'maitre_inquisiteur'])
      .eq('is_active', true)
      .order('display_name', { ascending: true }),
    supabase
      .from('member_promotions')
      .select('*, member:profiles!profile_id(id,username,display_name,avatar_url,role), promoter:profiles!promoted_by(id,username,display_name)')
      .order('promoted_at', { ascending: false })
      .limit(100),
  ])

  const evaluations = (evalsResult.data as unknown as RankEvaluationWithProfiles[]) ?? []
  const members = (membersResult.data as Pick<Profile, 'id' | 'username' | 'display_name' | 'role'>[]) ?? []
  const history = (historyResult.data as unknown as PromotionHistoryItem[]) ?? []

  let applications: Application[] = []
  if (isSage) {
    const admin = createAdminClient()
    const { data } = await admin
      .from('applications')
      .select('*')
      .order('submitted_at', { ascending: false })
    applications = (data as Application[]) ?? []
  }

  return (
    <GestionMembresClient
      evaluations={evaluations}
      members={members}
      history={history}
      applications={applications}
      isSage={isSage}
    />
  )
}
