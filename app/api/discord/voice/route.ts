import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

interface DiscordVoiceState {
  user_id: string
  channel_id: string | null
  member?: {
    nick: string | null
    user: { id: string; username: string; global_name: string | null }
  }
}

interface DiscordChannel {
  id: string
  name: string
  type: number
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const token = process.env.DISCORD_BOT_TOKEN
  const guildId = process.env.DISCORD_GUILD_ID

  if (!token || !guildId) {
    return NextResponse.json({ channels: [] })
  }

  try {
    const [voiceRes, channelRes] = await Promise.all([
      fetch(`https://discord.com/api/v10/guilds/${guildId}/voice-states`, {
        headers: { Authorization: `Bot ${token}` },
        next: { revalidate: 0 },
      }),
      fetch(`https://discord.com/api/v10/guilds/${guildId}/channels`, {
        headers: { Authorization: `Bot ${token}` },
        next: { revalidate: 30 },
      }),
    ])

    if (!voiceRes.ok || !channelRes.ok) {
      return NextResponse.json({ channels: [] })
    }

    const voiceStates: DiscordVoiceState[] = await voiceRes.json()
    const allChannels: DiscordChannel[] = await channelRes.json()

    const voiceChannels = allChannels.filter((c) => c.type === 2)

    const result = voiceChannels
      .map((ch) => {
        const members = voiceStates
          .filter((vs) => vs.channel_id === ch.id)
          .map((vs) => vs.member?.nick ?? vs.member?.user?.global_name ?? vs.member?.user?.username ?? 'Inconnu')
        return { channelId: ch.id, channelName: ch.name, members }
      })
      .filter((ch) => ch.members.length > 0)

    return NextResponse.json({ channels: result })
  } catch {
    return NextResponse.json({ channels: [] })
  }
}
