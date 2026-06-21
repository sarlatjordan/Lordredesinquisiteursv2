import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getRolePrivilege } from '@/lib/constants'
import { getAllJournalEntries } from '@/actions/war-journal'
import { JournalClient } from './journal-client'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Journal de guerre' }

export default async function JournalPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || getRolePrivilege(profile.role) < 400) redirect('/dashboard')

  const entries = await getAllJournalEntries()

  return <JournalClient entries={entries} />
}
