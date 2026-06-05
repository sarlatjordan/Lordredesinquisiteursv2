import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { ProfilClient } from './profil-client'
import { redirect } from 'next/navigation'

export const metadata: Metadata = { title: 'Mon profil' }
export const dynamic = 'force-dynamic'

export default async function ProfilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  type ActiveEval = {
    id: string
    status: 'pending' | 'in_progress'
    instructions: string | null
    created_at: string
  }

  const [{ data: profile }, evalResult] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase
      .from('rank_evaluations')
      .select('id, status, instructions, created_at')
      .eq('member_id', user.id)
      .in('status', ['pending', 'in_progress'])
      .maybeSingle(),
  ])
  const activeEval = evalResult.data as ActiveEval | null

  return (
    <ProfilClient
      profile={profile}
      email={user.email ?? ''}
      activeEvaluation={activeEval ?? null}
    />
  )
}
