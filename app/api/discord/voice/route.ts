import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

interface WidgetMember {
  id: string
  username: string
  channel_id?: string | null
  avatar_url?: string
}

interface WidgetChannel {
  id: string
  name: string
  position: number
}

interface DiscordWidget {
  channels: WidgetChannel[]
  members: WidgetMember[]
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const guildId = process.env.DISCORD_GUILD_ID

  if (!guildId) {
    return NextResponse.json({ channels: [] })
  }

  try {
    const res = await fetch(`https://discord.com/api/guilds/${guildId}/widget.json`, {
      next: { revalidate: 0 },
    })

    if (!res.ok) {
      return NextResponse.json({ channels: [], widgetDisabled: res.status === 403 })
    }

    const widget: DiscordWidget = await res.json()

    const voiceChannelMap = new Map(widget.channels.map((c) => [c.id, c.name]))

    const byChannel = new Map<string, { channelName: string; members: string[] }>()

    for (const member of widget.members) {
      if (!member.channel_id) continue
      const channelName = voiceChannelMap.get(member.channel_id)
      if (!channelName) continue
      if (!byChannel.has(member.channel_id)) {
        byChannel.set(member.channel_id, { channelName, members: [] })
      }
      byChannel.get(member.channel_id)!.members.push(member.username)
    }

    const channels = Array.from(byChannel.entries()).map(([channelId, data]) => ({
      channelId,
      channelName: data.channelName,
      members: data.members,
    }))

    return NextResponse.json({ channels })
  } catch {
    return NextResponse.json({ channels: [] })
  }
}
