import { unstable_cache } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'

const STATS_FALLBACK = { memberCount: 0, shipCount: 0, opCompletedCount: 0, opThisMonthCount: 0 }

export const getPublicStats = unstable_cache(
  async () => {
    try {
      const admin = createAdminClient()
      const startOfMonth = new Date(
        new Date().getFullYear(),
        new Date().getMonth(),
        1,
      ).toISOString()

      const [
        { count: memberCount },
        { count: shipCount },
        { count: opCompletedCount },
        { count: opThisMonthCount },
      ] = await Promise.all([
        admin.from('profiles').select('*', { count: 'exact', head: true }).eq('is_active', true),
        admin.from('ships').select('*', { count: 'exact', head: true }),
        admin.from('operations').select('*', { count: 'exact', head: true }).eq('status', 'termine'),
        admin
          .from('operations')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', startOfMonth),
      ])

      return {
        memberCount: memberCount ?? 0,
        shipCount: shipCount ?? 0,
        opCompletedCount: opCompletedCount ?? 0,
        opThisMonthCount: opThisMonthCount ?? 0,
      }
    } catch {
      return STATS_FALLBACK
    }
  },
  ['public-stats'],
  { revalidate: 3600, tags: ['public-stats'] },
)
