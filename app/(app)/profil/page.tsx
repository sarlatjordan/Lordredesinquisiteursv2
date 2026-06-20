import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { ProfilClient } from './profil-client'
import { redirect } from 'next/navigation'
import { generateIcsToken } from '@/lib/ics-token'
import { getMyAvailability } from '@/actions/availability'
import type { AvailabilityGrid, Absence } from '@/types'

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

  const [{ data: profile }, evalResult, availability, absencesResult] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase
      .from('rank_evaluations')
      .select('id, status, instructions, created_at')
      .eq('member_id', user.id)
      .in('status', ['pending', 'in_progress'])
      .maybeSingle(),
    getMyAvailability(),
    supabase
      .from('absences')
      .select('*')
      .eq('profile_id', user.id)
      .gte('end_date', new Date().toISOString().split('T')[0])
      .order('start_date', { ascending: true }),
  ])
  const activeEval = evalResult.data as ActiveEval | null
  const absences = (absencesResult.data ?? []) as Absence[]

  // Génération du token ICS pour l'abonnement calendrier
  let icsParams: { uid: string; token: string } | null = null
  try {
    icsParams = { uid: user.id, token: generateIcsToken(user.id) }
  } catch {
    // ICS_HMAC_SECRET non configuré — section masquée
  }

  const headersList = await headers()
  const host = headersList.get('host') ?? 'localhost:3000'
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http'
  const appOrigin = `${protocol}://${host}`

  return (
    <ProfilClient
      profile={profile}
      email={user.email ?? ''}
      activeEvaluation={activeEval ?? null}
      icsParams={icsParams}
      appOrigin={appOrigin}
      availability={availability as AvailabilityGrid}
      absences={absences}
    />
  )
}
