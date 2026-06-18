'use server'

import { revalidatePath } from 'next/cache'
import { getAuthWithPrivilege } from '@/lib/auth-helpers'
import {
  EventCreateSchema,
  EventUpdateSchema,
  type EventCreateInput,
  type EventUpdateInput,
  type ActionResult,
  type AttendeeWithProfile,
  type Profile,
} from '@/types'
import type { Event } from '@/types'
import { PRIVILEGE } from '@/lib/constants'
import { checkAndAwardEventBadges, awardBadge } from '@/lib/award-badge'
import { createDiscordScheduledEvent } from '@/lib/discord'

interface CreateEventOptions {
  sendToDiscord?: boolean
  createOperation?: boolean
}

export async function createEvent(
  input: EventCreateInput,
  options: CreateEventOptions = {},
): Promise<ActionResult<Event>> {
  const { supabase, user, privilege } = await getAuthWithPrivilege()
  if (!user) return { success: false, error: 'Non authentifié' }

  const parsed = EventCreateSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Données invalides' }

  if (privilege < PRIVILEGE.CREATE_EVENTS) return { success: false, error: 'Droits insuffisants — Aspirant requis' }

  // Envoi Discord en premier pour récupérer le discord_event_id
  let discordEventId: string | null = null
  if (options.sendToDiscord) {
    discordEventId = await createDiscordScheduledEvent({
      name: parsed.data.title,
      description: parsed.data.description,
      scheduled_start_time: new Date(parsed.data.start_at).toISOString(),
      scheduled_end_time: parsed.data.end_at ? new Date(parsed.data.end_at).toISOString() : null,
      location: parsed.data.location,
    })
  }

  const { data, error } = await supabase
    .from('events')
    .insert({
      ...parsed.data,
      created_by: user.id,
      ...(discordEventId ? { discord_event_id: discordEventId } : {}),
    })
    .select()
    .single()

  if (error) return { success: false, error: error.message }

  // Création de l'opération liée (MI+ requis)
  if (options.createOperation && parsed.data.type === 'operation' && privilege >= PRIVILEGE.CREATE_OPS) {
    await supabase.from('operations').insert({
      title: parsed.data.title,
      description: parsed.data.description || null,
      system_name: parsed.data.location || 'À définir',
      type: 'combat',
      status: 'planifie',
      departure_at: parsed.data.start_at,
      risk_level: 'medium',
      min_privilege: parsed.data.min_privilege ?? 100,
      created_by: user.id,
    })
    revalidatePath('/operations')
  }

  revalidatePath('/evenements')
  revalidatePath('/dashboard')
  return { success: true, data: data as Event }
}

export async function updateEvent(id: string, input: EventUpdateInput): Promise<ActionResult<Event>> {
  const { supabase, user, privilege } = await getAuthWithPrivilege()
  if (!user) return { success: false, error: 'Non authentifié' }
  if (privilege < 300) return { success: false, error: 'Droits insuffisants — Gardien requis' }

  const parsed = EventUpdateSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Données invalides' }

  const { data, error } = await supabase
    .from('events')
    .update(parsed.data)
    .eq('id', id)
    .select()
    .single()

  if (error) return { success: false, error: error.message }

  revalidatePath('/evenements')
  revalidatePath('/dashboard')
  return { success: true, data: data as Event }
}

export async function saveEventReport(id: string, report: string): Promise<ActionResult> {
  const { supabase, user, privilege } = await getAuthWithPrivilege()
  if (!user) return { success: false, error: 'Non authentifié' }
  if (privilege < 300) return { success: false, error: 'Droits insuffisants — Gardien requis' }

  const { error } = await supabase
    .from('events')
    .update({ report: report.trim() || null })
    .eq('id', id)

  if (error) return { success: false, error: error.message }

  void awardBadge(user.id, 'first_report')
  revalidatePath('/evenements')
  return { success: true, data: undefined }
}

export async function getEventAttendees(eventId: string): Promise<ActionResult<AttendeeWithProfile[]>> {
  const { supabase, user } = await getAuthWithPrivilege()
  if (!user) return { success: false, error: 'Non authentifié' }

  const { data, error } = await supabase
    .from('event_attendees')
    .select('*, profile:profiles(id, username, display_name, role)')
    .eq('event_id', eventId)
    .order('registered_at', { ascending: true })

  if (error) return { success: false, error: error.message }
  return { success: true, data: data as unknown as AttendeeWithProfile[] }
}

export async function getOrgMembers(): Promise<ActionResult<Pick<Profile, 'id' | 'username' | 'display_name' | 'role'>[]>> {
  const { supabase, user } = await getAuthWithPrivilege()
  if (!user) return { success: false, error: 'Non authentifié' }

  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, display_name, role')
    .eq('is_active', true)
    .order('display_name', { ascending: true })

  if (error) return { success: false, error: error.message }
  return { success: true, data: data as Pick<Profile, 'id' | 'username' | 'display_name' | 'role'>[] }
}

export async function addAttendeeByOrganizer(
  eventId: string,
  profileId: string,
  status: 'confirme' | 'peut_etre'
): Promise<ActionResult> {
  const { supabase, user, privilege } = await getAuthWithPrivilege()
  if (!user) return { success: false, error: 'Non authentifié' }
  if (privilege < 300) return { success: false, error: 'Droits insuffisants — Gardien requis' }

  const { error } = await supabase
    .from('event_attendees')
    .upsert(
      { event_id: eventId, profile_id: profileId, status },
      { onConflict: 'event_id,profile_id' }
    )

  if (error) return { success: false, error: error.message }

  revalidatePath('/evenements')
  return { success: true, data: undefined }
}

export async function removeAttendeeByOrganizer(
  eventId: string,
  profileId: string
): Promise<ActionResult> {
  const { supabase, user, privilege } = await getAuthWithPrivilege()
  if (!user) return { success: false, error: 'Non authentifié' }
  if (privilege < 300) return { success: false, error: 'Droits insuffisants — Gardien requis' }

  const { error } = await supabase
    .from('event_attendees')
    .delete()
    .eq('event_id', eventId)
    .eq('profile_id', profileId)

  if (error) return { success: false, error: error.message }

  revalidatePath('/evenements')
  return { success: true, data: undefined }
}

export async function registerForEvent(
  eventId: string,
  status: 'confirme' | 'peut_etre'
): Promise<ActionResult> {
  const { supabase, user } = await getAuthWithPrivilege()
  if (!user) return { success: false, error: 'Non authentifié' }

  const { error } = await supabase
    .from('event_attendees')
    .upsert(
      { event_id: eventId, profile_id: user.id, status },
      { onConflict: 'event_id,profile_id' }
    )

  if (error) return { success: false, error: error.message }

  void checkAndAwardEventBadges(user.id)
  revalidatePath('/evenements')
  return { success: true, data: undefined }
}

export async function unregisterFromEvent(eventId: string): Promise<ActionResult> {
  const { supabase, user } = await getAuthWithPrivilege()
  if (!user) return { success: false, error: 'Non authentifié' }

  const { error } = await supabase
    .from('event_attendees')
    .delete()
    .eq('event_id', eventId)
    .eq('profile_id', user.id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/evenements')
  return { success: true, data: undefined }
}

export async function updateEventStatus(
  eventId: string,
  status: 'planifie' | 'en_cours' | 'termine' | 'annule'
): Promise<ActionResult> {
  const { supabase, user, privilege } = await getAuthWithPrivilege()
  if (!user) return { success: false, error: 'Non authentifié' }
  if (privilege < 300) return { success: false, error: 'Droits insuffisants — Gardien requis' }

  const { error } = await supabase
    .from('events')
    .update({ status })
    .eq('id', eventId)

  if (error) return { success: false, error: error.message }

  revalidatePath('/evenements')
  revalidatePath('/dashboard')
  return { success: true, data: undefined }
}
