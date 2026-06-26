import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { RapportBugClient } from './rapport-bug-client'
import type { BugReport } from '@/types'

export const metadata: Metadata = { title: 'Signalement & Idées' }
export const dynamic = 'force-dynamic'

export default async function RapportBugPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data } = await supabase
    .from('bug_reports')
    .select('*')
    .eq('profile_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Signalement & Idées</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Signale un bug ou propose une amélioration pour le site.
        </p>
      </div>
      <RapportBugClient ownReports={(data ?? []) as BugReport[]} />
    </div>
  )
}
