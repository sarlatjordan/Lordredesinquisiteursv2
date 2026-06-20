'use client'

import { useState, useTransition, useEffect } from 'react'
import { Gamepad2, Volume2, Loader2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toggleInGame } from '@/actions/in-game'
import { getInitials } from '@/lib/utils'

interface InGameMember {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  in_game_since: string
}

interface VoiceChannel {
  channelId: string
  channelName: string
  members: string[]
}

interface PresenceWidgetProps {
  inGameMembers: InGameMember[]
  myInGameSince: string | null
}

export function PresenceWidget({ inGameMembers, myInGameSince }: PresenceWidgetProps) {
  const [isInGame, setIsInGame] = useState(myInGameSince !== null)
  const [isPending, startTransition] = useTransition()
  const [toggleError, setToggleError] = useState<string | null>(null)

  const [voiceChannels, setVoiceChannels] = useState<VoiceChannel[]>([])
  const [voiceLoading, setVoiceLoading] = useState(true)

  useEffect(() => {
    let active = true
    async function fetchVoice() {
      try {
        const res = await fetch('/api/discord/voice')
        const json = await res.json()
        if (active) setVoiceChannels(json.channels ?? [])
      } catch {
        if (active) setVoiceChannels([])
      } finally {
        if (active) setVoiceLoading(false)
      }
    }
    fetchVoice()
    const id = setInterval(fetchVoice, 30_000)
    return () => { active = false; clearInterval(id) }
  }, [])

  function handleToggle() {
    const next = !isInGame
    setIsInGame(next)
    setToggleError(null)
    startTransition(async () => {
      const result = await toggleInGame(next)
      if (!result.success) {
        setIsInGame(!next)
        setToggleError(result.error ?? 'Erreur')
      }
    })
  }

  const totalOnline = inGameMembers.length + voiceChannels.reduce((s, c) => s + c.members.length, 0)

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
          <h3 className="text-sm font-semibold">Présence de l'Ordre</h3>
          {totalOnline > 0 && (
            <span className="inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-primary/15 text-[10px] font-bold text-primary">
              {totalOnline}
            </span>
          )}
        </div>

        <button
          onClick={handleToggle}
          disabled={isPending}
          className={[
            'relative inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all duration-200',
            isInGame
              ? 'bg-green-500/15 text-green-400 border border-green-500/30 hover:bg-green-500/25'
              : 'bg-muted text-muted-foreground border border-border hover:bg-accent hover:text-foreground',
          ].join(' ')}
        >
          {isPending ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <span className={['h-1.5 w-1.5 rounded-full', isInGame ? 'bg-green-400' : 'bg-muted-foreground'].join(' ')} />
          )}
          {isInGame ? 'En jeu' : 'Rejoindre'}
        </button>
      </div>

      {toggleError && <p className="text-xs text-destructive">{toggleError}</p>}

      {/* En jeu */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5">
          <Gamepad2 className="h-3.5 w-3.5 text-muted-foreground" />
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
            En jeu {inGameMembers.length > 0 && `(${inGameMembers.length})`}
          </p>
        </div>
        {inGameMembers.length === 0 ? (
          <p className="text-xs text-muted-foreground pl-5">Personne en jeu.</p>
        ) : (
          <div className="flex flex-wrap gap-2 pl-5">
            {inGameMembers.map((m) => (
              <div key={m.id} className="flex items-center gap-1.5">
                <div className="relative">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={m.avatar_url ?? undefined} />
                    <AvatarFallback className="text-[9px] bg-muted">
                      {getInitials(m.display_name ?? m.username)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-green-400 border border-card" />
                </div>
                <div>
                  <p className="text-xs font-medium leading-none">{m.display_name ?? m.username}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {formatDistanceToNow(new Date(m.in_game_since), { addSuffix: true, locale: fr })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Vocal Discord */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5">
          <Volume2 className="h-3.5 w-3.5 text-muted-foreground" />
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
            En vocal Discord
          </p>
          {voiceLoading && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
        </div>
        {!voiceLoading && voiceChannels.length === 0 ? (
          <p className="text-xs text-muted-foreground pl-5">Personne en vocal.</p>
        ) : (
          <div className="space-y-1.5 pl-5">
            {voiceChannels.map((ch) => (
              <div key={ch.channelId}>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1"># {ch.channelName}</p>
                <div className="flex flex-wrap gap-1">
                  {ch.members.map((name) => (
                    <span
                      key={name}
                      className="inline-flex items-center px-2 py-0.5 rounded-full bg-primary/10 text-[11px] text-primary font-medium"
                    >
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
