import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getPublicStats } from '@/lib/public-stats'
import { PublicNav } from '@/components/landing/public-nav'
import { StarfieldCanvas } from '@/components/landing/starfield-canvas'
import { Hero } from '@/components/landing/hero'
import { StatsBar } from '@/components/landing/stats-bar'
import { HistorySection } from '@/components/landing/history-section'
import { AboutSection } from '@/components/landing/about-section'
import { EventsPreview } from '@/components/landing/events-preview'
import { CtaSection } from '@/components/landing/cta-section'
import { DiscordSection } from '@/components/landing/discord-section'
import { LandingFooter } from '@/components/landing/landing-footer'
import { WarJournalSection } from '@/components/landing/war-journal-section'
import { getPublishedJournalEntries } from '@/actions/war-journal'
import type { Event, WarJournalWithAuthor } from '@/types'

export const metadata: Metadata = {
  title: "L'Ordre des Inquisiteurs — Organisation Star Citizen",
  description:
    "INQFR est une organisation Star Citizen d'élite opérant dans le quadrant Alpha. Discipline, tactique et honneur.",
}

interface RootPageProps {
  searchParams: Promise<{
    code?: string
    token_hash?: string
    type?: string
  }>
}

export default async function RootPage({ searchParams }: RootPageProps) {
  const params = await searchParams

  // Forward les tokens auth Supabase vers le callback
  if (params.code || params.token_hash) {
    const qs = new URLSearchParams()
    if (params.code) qs.set('code', params.code)
    if (params.token_hash) qs.set('token_hash', params.token_hash)
    if (params.type) qs.set('type', params.type)
    redirect(`/auth/callback?${qs.toString()}`)
  }

  // Vérifier si l'utilisateur est connecté (sans redirection — la landing est accessible à tous)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const isLoggedIn = !!user

  const admin = createAdminClient()
  const [stats, { data: publicEvents }, journalEntries] = await Promise.all([
    getPublicStats(),
    admin
      .from('events')
      .select('*')
      .in('status', ['planifie', 'en_cours'])
      .eq('min_privilege', 0)
      .gte('start_at', new Date().toISOString())
      .order('start_at', { ascending: true })
      .limit(3),
    getPublishedJournalEntries(),
  ])
  const { memberCount, shipCount, opCompletedCount } = stats

  return (
    <div className="min-h-screen bg-background text-foreground">
      <StarfieldCanvas />
      <div className="relative" style={{ zIndex: 1 }}>
      <PublicNav isLoggedIn={isLoggedIn} />

      <main>
        <Hero isLoggedIn={isLoggedIn} />

        <StatsBar
          memberCount={memberCount}
          shipCount={shipCount}
          opCount={opCompletedCount}
        />

        <HistorySection />

        <AboutSection />

        <EventsPreview
          events={(publicEvents as Event[]) ?? []}
          isLoggedIn={isLoggedIn}
        />

        <WarJournalSection entries={journalEntries as WarJournalWithAuthor[]} />

        <DiscordSection />

        <CtaSection />
      </main>

      <LandingFooter />
      </div>
    </div>
  )
}
