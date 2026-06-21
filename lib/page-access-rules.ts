import { unstable_cache } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import type { PageAccessRule } from '@/types'

export const getPageAccessRules = unstable_cache(
  async (): Promise<PageAccessRule[]> => {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('page_access_rules')
      .select('*')
      .order('path')
    return (data ?? []) as PageAccessRule[]
  },
  ['page-access-rules'],
  { revalidate: 60, tags: ['page-access-rules'] }
)

export function getMinPrivilegeForPath(rules: PageAccessRule[], pathname: string): number {
  const sorted = [...rules].sort((a, b) => b.path.length - a.path.length)
  const match = sorted.find(r => pathname === r.path || pathname.startsWith(r.path + '/'))
  return match?.min_privilege ?? 100
}
