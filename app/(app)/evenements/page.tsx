import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { EventsClient } from './events-client'
import type { EventWithDetails, EventAttendee } from '@/types'
import { getRolePrivilege } from '@/lib/constants'

export const metadata: Metadata = { title: 'Événements' }
export const dynamic = 'force-dynamic'

export default async function EvenementsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  // Récupérer le privilège de l'utilisateur connecté
  let userPrivilege = 0
  let isOrganizer = false
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    userPrivilege = getRolePrivilege(profile?.role ?? '')
    isOrganizer = userPrivilege >= 300 // Gardien+
  }

  // Un événement est "à venir" si son statut est actif ET sa date est dans le futur.
  // S'il est planifié/en_cours mais que la date est dépassée, il va dans "passés"
  // même si l'organisateur a oublié de le clôturer.
  const now = new Date().toISOString()

  const [upcomingRes, terminatedRes, overdueRes, userAttendeesRes, countRes] = await Promise.all([
    // À venir : statut actif + date future
    supabase
      .from('events')
      .select('*')
      .in('status', ['planifie', 'en_cours'])
      .gte('start_at', now)
      .lte('min_privilege', userPrivilege)
      .order('start_at', { ascending: true }),
    // Passés officiels : terminé ou annulé
    supabase
      .from('events')
      .select('*')
      .in('status', ['termine', 'annule'])
      .lte('min_privilege', userPrivilege)
      .order('start_at', { ascending: false })
      .limit(20),
    // Passés de facto : statut actif mais date dépassée (oubli de clôture)
    supabase
      .from('events')
      .select('*')
      .in('status', ['planifie', 'en_cours'])
      .lt('start_at', now)
      .lte('min_privilege', userPrivilege)
      .order('start_at', { ascending: false })
      .limit(10),
    // Participations de l'utilisateur courant
    user
      ? supabase.from('event_attendees').select('*').eq('profile_id', user.id)
      : Promise.resolve({ data: [] }),
    // Comptage participants confirmés par event
    supabase.from('event_attendees').select('event_id').eq('status', 'confirme'),
  ])

  const upcomingRaw = upcomingRes.data

  // Fusion + tri par date desc, cap à 30 entrées
  const pastRaw = [
    ...(terminatedRes.data ?? []),
    ...(overdueRes.data ?? []),
  ]
    .sort((a, b) => new Date(b.start_at).getTime() - new Date(a.start_at).getTime())
    .slice(0, 30)

  const userAttendees = (userAttendeesRes.data as EventAttendee[]) ?? []
  const countData = countRes.data

  const countMap = (countData ?? []).reduce<Record<string, number>>((acc, row) => {
    acc[row.event_id] = (acc[row.event_id] ?? 0) + 1
    return acc
  }, {})

  function enrichEvents(raw: typeof upcomingRaw): EventWithDetails[] {
    return (raw ?? []).map((e) => ({
      ...e,
      type: e.type as EventWithDetails['type'],
      status: e.status as EventWithDetails['status'],
      attendee_count: countMap[e.id] ?? 0,
      attendees: userAttendees.filter((a) => a.event_id === e.id),
    }))
  }

  return (
    <EventsClient
      upcomingEvents={enrichEvents(upcomingRaw)}
      pastEvents={enrichEvents(pastRaw)}
      currentUserId={user?.id}
      isOrganizer={isOrganizer}
    />
  )
}
