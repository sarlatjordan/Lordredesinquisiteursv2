import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getRolePrivilege } from '@/lib/constants'
import { PromotionsClient } from './promotions-client'
import type { RankEvaluationWithProfiles, PromotionHistoryItem, Profile } from '@/types'

export const metadata: Metadata = { title: 'Épreuves de rang' }
export const dynamic = 'force-dynamic'

export default async function AdminPromotionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (getRolePrivilege(me?.role ?? '') < 600) redirect('/dashboard')

  const [{ data: rawEvals }, { data: rawMembers }, { data: rawHistory }] = await Promise.all([
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

  const evaluations = (rawEvals as unknown as RankEvaluationWithProfiles[]) ?? []
  const members = (rawMembers as Pick<Profile, 'id' | 'username' | 'display_name' | 'role'>[]) ?? []
  const history = (rawHistory as unknown as PromotionHistoryItem[]) ?? []

  return <PromotionsClient evaluations={evaluations} members={members} history={history} />
}
