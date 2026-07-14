import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { RegisterClient } from './register-client'

export const dynamic = 'force-dynamic'

export default async function RegisterPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, username')
    .eq('id', user.id)
    .single()

  return (
    <RegisterClient
      email={user.email ?? ''}
      defaultDisplayName={profile?.display_name ?? profile?.username ?? ''}
    />
  )
}
