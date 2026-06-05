import type { Metadata } from 'next'
import { PublicNav } from '@/components/landing/public-nav'
import { LandingFooter } from '@/components/landing/landing-footer'
import { createClient } from '@/lib/supabase/server'
import { getPublicCalendarEvents } from '@/lib/public-data'
import { CalendarClient } from './calendar-client'

export const metadata: Metadata = {
  title: 'Calendrier',
  description: 'Activités et opérations publiques de L\'Ordre des Inquisiteurs.',
}

interface CalendrierPageProps {
  searchParams: Promise<{ month?: string }>
}

function parseMonth(raw: string | undefined): [number, number] {
  if (raw && /^\d{4}-\d{2}$/.test(raw)) {
    const [y, m] = raw.split('-').map(Number)
    if (y >= 2020 && y <= 2100 && m >= 1 && m <= 12) {
      return [y, m - 1] // month is 0-indexed for Date
    }
  }
  const now = new Date()
  return [now.getFullYear(), now.getMonth()]
}

export default async function CalendrierPage({ searchParams }: CalendrierPageProps) {
  const { month } = await searchParams
  const [year, monthIndex] = parseMonth(month)

  const start = new Date(year, monthIndex, 1).toISOString()
  const end   = new Date(year, monthIndex + 1, 0, 23, 59, 59).toISOString()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const events = await getPublicCalendarEvents(year, monthIndex)

  const currentMonth = `${year}-${String(monthIndex + 1).padStart(2, '0')}`

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PublicNav isLoggedIn={!!user} />
      <main className="pt-24 pb-16">
        <div className="px-6 max-w-5xl mx-auto space-y-8">
          <div className="pt-4">
            <p className="text-xs font-semibold tracking-[0.25em] text-primary/70 uppercase mb-2">
              Activités publiques
            </p>
            <h1 className="text-3xl sm:text-4xl font-black text-foreground">
              Calendrier de l&apos;Ordre
            </h1>
            <p className="mt-2 text-muted-foreground text-sm">
              Opérations et événements ouverts à tous. Connectez-vous pour voir le programme complet.
            </p>
          </div>

          <CalendarClient
            events={events}
            currentMonth={currentMonth}
          />
        </div>
      </main>
      <LandingFooter />
    </div>
  )
}
