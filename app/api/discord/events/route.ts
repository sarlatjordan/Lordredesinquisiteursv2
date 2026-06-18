import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

// Subset du Scheduled Event Discord qu'on utilise
interface DiscordScheduledEvent {
  id: string
  name: string
  description?: string | null
  scheduled_start_time: string
  scheduled_end_time?: string | null
  status?: number // 1=SCHEDULED 2=ACTIVE 3=COMPLETED 4=CANCELED
  entity_metadata?: { location?: string | null } | null
}

function mapStatus(status: number | undefined): 'planned' | 'active' | 'completed' | 'cancelled' {
  switch (status) {
    case 2: return 'active'
    case 3: return 'completed'
    case 4: return 'cancelled'
    default: return 'planned'
  }
}

export async function POST(request: NextRequest) {
  const secret = process.env.DISCORD_WEBHOOK_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'Discord non configuré sur ce serveur' }, { status: 503 })
  }

  if (request.headers.get('x-webhook-secret') !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: DiscordScheduledEvent
  try {
    body = (await request.json()) as DiscordScheduledEvent
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 })
  }

  if (!body.id || !body.name || !body.scheduled_start_time) {
    return NextResponse.json(
      { error: 'Champs requis manquants : id, name, scheduled_start_time' },
      { status: 400 },
    )
  }

  const supabase = createAdminClient()

  const { error } = await supabase.from('events').upsert(
    {
      discord_event_id: body.id,
      title: body.name,
      description: body.description || null,
      type: 'operation',
      status: mapStatus(body.status),
      start_at: body.scheduled_start_time,
      end_at: body.scheduled_end_time || null,
      location: body.entity_metadata?.location || null,
      min_privilege: 100,
      created_by: null,
    },
    { onConflict: 'discord_event_id' },
  )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
