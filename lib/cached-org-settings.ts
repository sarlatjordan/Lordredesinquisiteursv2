import { unstable_cache } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import type { OrgSettings } from '@/types'

export const getCachedOrgSettings = unstable_cache(
  async (): Promise<OrgSettings | null> => {
    const admin = createAdminClient()
    const { data } = await admin.from('org_settings').select('*').single()
    return (data as OrgSettings) ?? null
  },
  ['org-settings'],
  { revalidate: 60, tags: ['org-settings'] }
)
