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
