export function isDiscordConfigured(): boolean {
  return !!(process.env.DISCORD_BOT_TOKEN && process.env.DISCORD_GUILD_ID)
}

// Construit la mention Discord adaptée au rang minimum requis pour un événement.
// Les rôles Discord avec privilege >= minPrivilege sont mentionnés.
// Si aucun ID de rôle n'est configuré, retourne @everyone.
export function buildEventMention(minPrivilege: number): string {
  const roleMap: { privilege: number; envKey: string }[] = [
    { privilege: 100,  envKey: 'DISCORD_ROLE_ID_ASPIRANT' },
    { privilege: 150,  envKey: 'DISCORD_ROLE_ID_CONSACRE' },
    { privilege: 300,  envKey: 'DISCORD_ROLE_ID_GARDIEN' },
    { privilege: 400,  envKey: 'DISCORD_ROLE_ID_INQUISITEUR' },
    { privilege: 600,  envKey: 'DISCORD_ROLE_ID_MAITRE_INQUISITEUR' },
    { privilege: 1000, envKey: 'DISCORD_ROLE_ID_SAGE' },
  ]

  if (minPrivilege <= 50) return '@everyone'

  const mentions = roleMap
    .filter(({ privilege, envKey }) => privilege >= minPrivilege && process.env[envKey])
    .map(({ envKey }) => `<@&${process.env[envKey]}>`)

  return mentions.length > 0 ? mentions.join(' ') : '@everyone'
}

export async function postToDiscordChannel(channelId: string, content: string): Promise<boolean> {
  const token = process.env.DISCORD_BOT_TOKEN
  if (!token || !channelId) return false
  try {
    const res = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bot ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    })
    return res.ok
  } catch {
    return false
  }
}

interface DiscordEventPayload {
  name: string
  description?: string | null
  scheduled_start_time: string
  scheduled_end_time?: string | null
  location?: string | null
}

export async function createDiscordScheduledEvent(
  event: DiscordEventPayload,
): Promise<string | null> {
  const token = process.env.DISCORD_BOT_TOKEN
  const guildId = process.env.DISCORD_GUILD_ID
  if (!token || !guildId) return null

  try {
    const res = await fetch(`https://discord.com/api/v10/guilds/${guildId}/scheduled-events`, {
      method: 'POST',
      headers: {
        Authorization: `Bot ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: event.name,
        ...(event.description ? { description: event.description } : {}),
        scheduled_start_time: event.scheduled_start_time,
        ...(event.scheduled_end_time ? { scheduled_end_time: event.scheduled_end_time } : {}),
        privacy_level: 2,
        entity_type: 3,
        entity_metadata: { location: event.location || 'En ligne' },
      }),
    })

    if (!res.ok) {
      if (process.env.NODE_ENV === 'development') {
        const err = await res.text()
        console.error('[Discord] createScheduledEvent error:', res.status, err)
      }
      return null
    }

    const data = (await res.json()) as { id: string }
    return data.id
  } catch {
    return null
  }
}
