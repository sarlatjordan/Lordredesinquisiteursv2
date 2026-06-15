import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { EventsClient } from './events-client'
import type { EventWithDetails, EventAttendee } from '@/types'
import { getRolePrivilege, PRIVILEGE } from '@/lib/constants'
import { isDiscordConfigured } from '@/lib/discord'

export const metadata: Metadata = { title: 'Événements' }
export const dynamic = 'force-dynamic'

export default async function EvenementsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  let userPrivilege = 0
  let canCreate = false
  let canManage = false

  // Profil + inscriptions + comptage en parallèle — les requêtes événements dépendent de userPrivilege
  const [profileResult, userAttendeesRes, countRes] = await Promise.all([
    user ? supabase.from('profiles').select('role').eq('id', user.id).single() : Promise.resolve({ data: null }),
    user ? supabase.from('event_attendees').select('*').eq('profile_id', user.id) : Promise.resolve({ data: [] }),
    supabase.from('event_attendees').select('event_id').eq('status', 'confirme'),
  ])

  if (profileResult.data) {
    userPrivilege = getRolePrivilege(profileResult.data.role ?? '')
    canCreate = userPrivilege >= PRIVILEGE.CREATE_EVENTS
    canManage = userPrivilege >= PRIVILEGE.MANAGE_EVENTS
  }

  const discordConfigured = isDiscordConfigured()
  const canCreateOp = userPrivilege >= PRIVILEGE.CREATE_OPS

  const now = new Date().toISOString()

  const [upcomingRes, terminatedRes, overdueRes] = await Promise.all([
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
      canCreate={canCreate}
      canManage={canManage}
      canDiscordSync={discordConfigured}
      canCreateOp={canCreateOp}
    />
  )
}
