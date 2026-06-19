import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { data } = await supabase
    .from('discord_voice_states')
    .select('user_id, username, channel_id, channel_name')

  const byChannel = new Map<string, { channelName: string; members: string[] }>()

  for (const row of data ?? []) {
    if (!byChannel.has(row.channel_id)) {
      byChannel.set(row.channel_id, { channelName: row.channel_name, members: [] })
    }
    byChannel.get(row.channel_id)!.members.push(row.username)
  }

  const channels = Array.from(byChannel.entries()).map(([channelId, data]) => ({
    channelId,
    channelName: data.channelName,
    members: data.members,
  }))

  return NextResponse.json({ channels })
}
