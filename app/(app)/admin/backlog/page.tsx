import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getRolePrivilege } from '@/lib/constants'
import { getBacklogItems } from '@/actions/backlog'
import { BacklogClient } from './backlog-client'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Backlog' }

export default async function BacklogPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const privilege = getRolePrivilege(profile?.role ?? '')
  if (privilege < 400) redirect('/dashboard')

  const items = await getBacklogItems()

  return <BacklogClient items={items} canEdit={privilege >= 600} />
}
