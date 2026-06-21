import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getRolePrivilege } from '@/lib/constants'
import { BugsClient } from './bugs-client'

export const metadata: Metadata = { title: 'Rapports de bug' }
export const dynamic = 'force-dynamic'

export default async function AdminBugsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (getRolePrivilege(me?.role ?? '') < 600) redirect('/admin')

  const { data } = await supabase
    .from('bug_reports')
    .select('*, profile:profiles(username, display_name)')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Rapports de bug</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Bugs signalés par les membres — cliquer pour développer et gérer.
        </p>
      </div>
      <BugsClient bugs={(data ?? []) as unknown as Parameters<typeof BugsClient>[0]['bugs']} />
    </div>
  )
}
