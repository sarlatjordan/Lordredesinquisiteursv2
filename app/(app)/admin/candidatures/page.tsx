import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { CandidaturesClient } from './candidatures-client'
import { getRolePrivilege } from '@/lib/constants'
import type { Application } from '@/types'
import { ClipboardList } from 'lucide-react'

export const metadata: Metadata = { title: 'Candidatures' }
export const dynamic = 'force-dynamic'

export default async function CandidaturesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || getRolePrivilege(profile.role) < 1000) {
    redirect('/dashboard')
  }

  const admin = createAdminClient()
  const { data: applications } = await admin
    .from('applications')
    .select('*')
    .order('submitted_at', { ascending: false })

  const data = (applications as Application[]) ?? []
  const pendingCount = data.filter((a) => a.status === 'pending').length

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 border border-primary/30 shrink-0">
          <ClipboardList className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">Candidatures</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {data.length} candidature{data.length > 1 ? 's' : ''} au total
            {pendingCount > 0 && (
              <span className="ml-2 text-amber-400 font-medium">
                · {pendingCount} en attente de décision
              </span>
            )}
          </p>
        </div>
      </div>

      <CandidaturesClient applications={data} />
    </div>
  )
}
