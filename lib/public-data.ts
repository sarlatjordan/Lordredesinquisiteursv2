import { unstable_cache } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import type { MediaGallery, Event } from '@/types'

export const getPublicGallery = unstable_cache(
  async () => {
    const admin = createAdminClient()
    const { data } = await admin
      .from('media_gallery')
      .select('*')
      .order('created_at', { ascending: false })
    return (data as MediaGallery[]) ?? []
  },
  ['public-gallery'],
  { revalidate: 1800, tags: ['public-gallery'] }
)

export const getPublicCalendarEvents = unstable_cache(
  async (year: number, monthIndex: number) => {
    const admin = createAdminClient()
    const start = new Date(year, monthIndex, 1).toISOString()
    const end   = new Date(year, monthIndex + 1, 0, 23, 59, 59).toISOString()
    const { data } = await admin
      .from('events')
      .select('id, title, type, status, start_at, end_at, location, description, min_privilege')
      .eq('min_privilege', 0)
      .in('status', ['planifie', 'en_cours'])
      .gte('start_at', start)
      .lte('start_at', end)
      .order('start_at', { ascending: true })
    return (data as Event[]) ?? []
  },
  ['public-calendar'],
  { revalidate: 900, tags: ['public-calendar'] }
)
