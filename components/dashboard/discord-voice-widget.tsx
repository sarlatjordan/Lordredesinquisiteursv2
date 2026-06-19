'use client'

import { useEffect, useState } from 'react'
import { Volume2, Loader2 } from 'lucide-react'

interface VoiceChannel {
  channelId: string
  channelName: string
  members: string[]
}

export function DiscordVoiceWidget() {
  const [channels, setChannels] = useState<VoiceChannel[]>([])
  const [loading, setLoading] = useState(true)
  const [widgetDisabled, setWidgetDisabled] = useState(false)

  async function fetchVoice() {
    try {
      const res = await fetch('/api/discord/voice')
      const json = await res.json()
      setChannels(json.channels ?? [])
      setWidgetDisabled(json.widgetDisabled ?? false)
    } catch {
      setChannels([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVoice()
    const interval = setInterval(fetchVoice, 30_000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Volume2 className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">En vocal Discord</h3>
        {loading && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground ml-auto" />}
      </div>

      {!loading && widgetDisabled && (
        <p className="text-xs text-muted-foreground">Widget Discord désactivé — activer dans Server Settings → Widget.</p>
      )}

      {!loading && !widgetDisabled && channels.length === 0 && (
        <p className="text-xs text-muted-foreground">Personne en vocal pour le moment.</p>
      )}

      {channels.map((ch) => (
        <div key={ch.channelId} className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide"># {ch.channelName}</p>
          <div className="flex flex-wrap gap-1.5">
            {ch.members.map((name) => (
              <span
                key={name}
                className="inline-flex items-center px-2 py-0.5 rounded-full bg-primary/10 text-xs text-primary font-medium"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
