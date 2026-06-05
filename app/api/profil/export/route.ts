import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const [
    { data: profile },
    { data: ships },
    { data: registrations },
    { data: attendances },
    { data: points },
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('username, display_name, bio, star_citizen_handle, discord_id, role, joined_at, last_seen_at, is_active')
      .eq('id', user.id)
      .single(),
    supabase
      .from('ships')
      .select('name, model, manufacturer, ship_type, status, crew_size, is_org_ship, notes, created_at')
      .eq('owner_id', user.id),
    supabase
      .from('op_registrations')
      .select('preferred_role, notes, status, created_at, operations(title, status, start_at)')
      .eq('profile_id', user.id),
    supabase
      .from('event_attendees')
      .select('status, registered_at, events(title, type, start_at)')
      .eq('profile_id', user.id),
    supabase
      .from('member_points')
      .select('points, reason, reason_detail, created_at')
      .eq('profile_id', user.id)
      .order('created_at', { ascending: false }),
  ])

  const payload = {
    exported_at: new Date().toISOString(),
    profile,
    ships: ships ?? [],
    operation_registrations: registrations ?? [],
    event_attendances: attendances ?? [],
    points_history: points ?? [],
  }

  const json = JSON.stringify(payload, null, 2)

  return new NextResponse(json, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': 'attachment; filename="mes-donnees-inqfr.json"',
    },
  })
}
