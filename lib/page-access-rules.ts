import { createAdminClient } from '@/lib/supabase/admin'
import type { PageAccessRule } from '@/types'

export async function getPageAccessRules(): Promise<PageAccessRule[]> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('page_access_rules')
    .select('*')
    .order('path')
  return (data ?? []) as PageAccessRule[]
}

export function getMinPrivilegeForPath(rules: PageAccessRule[], pathname: string): number {
  const sorted = [...rules].sort((a, b) => b.path.length - a.path.length)
  const match = sorted.find(r => pathname === r.path || pathname.startsWith(r.path + '/'))
  return match?.min_privilege ?? 100
}
