import { createClient } from '@/lib/supabase/server'
import { getRolePrivilege } from '@/lib/constants'

export async function getAuthWithPrivilege() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, user: null, privilege: 0 }
  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  return { supabase, user, privilege: getRolePrivilege(me?.role ?? '') }
}
