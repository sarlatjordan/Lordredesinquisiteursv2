require('dotenv').config()

const { Client, GatewayIntentBits } = require('discord.js')
const { createClient } = require('@supabase/supabase-js')

const GUILD_ID = process.env.DISCORD_GUILD_ID

const discord = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
})

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

function memberName(member) {
  return member.nickname ?? member.user.globalName ?? member.user.username
}

async function syncGuild(guild) {
  const rows = []
  for (const [, channel] of guild.channels.cache.filter(c => c.type === 2)) {
    for (const [, member] of channel.members) {
      rows.push({
        user_id: member.id,
        username: memberName(member),
        channel_id: channel.id,
        channel_name: channel.name,
        updated_at: new Date().toISOString(),
      })
    }
  }

  await supabase.from('discord_voice_states').delete().neq('user_id', '')
  if (rows.length > 0) {
    await supabase.from('discord_voice_states').insert(rows)
  }

  console.log(`[sync] ${rows.length} membre(s) en vocal`)
}

discord.on('ready', async () => {
  console.log(`[bot] Connecté en tant que ${discord.user.tag}`)
  const guild = discord.guilds.cache.get(GUILD_ID)
  if (guild) await syncGuild(guild)
})

discord.on('voiceStateUpdate', async (oldState, newState) => {
  const userId = newState.id

  if (!newState.channelId) {
    await supabase.from('discord_voice_states').delete().eq('user_id', userId)
    console.log(`[voice] ${userId} a quitté le vocal`)
    return
  }

  const username = memberName(newState.member)
  await supabase.from('discord_voice_states').upsert({
    user_id: userId,
    username,
    channel_id: newState.channelId,
    channel_name: newState.channel.name,
    updated_at: new Date().toISOString(),
  })
  console.log(`[voice] ${username} → #${newState.channel.name}`)
})

discord.login(process.env.DISCORD_BOT_TOKEN)
