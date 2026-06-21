import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getRolePrivilege } from '@/lib/constants'
import { getPageAccessRules } from '@/lib/page-access-rules'
import { AccesClient } from './acces-client'

export const metadata: Metadata = { title: 'Gestion des accès' }
export const dynamic = 'force-dynamic'

export default async function AccesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (getRolePrivilege(me?.role ?? '') < 1000) redirect('/admin')

  const rules = await getPageAccessRules()

  return <AccesClient rules={rules} />
}
