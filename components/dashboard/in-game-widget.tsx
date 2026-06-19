'use client'

import { useState, useTransition } from 'react'
import { Gamepad2, Loader2 } from 'lucide-react'
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

interface InGameWidgetProps {
  members: InGameMember[]
  myInGameSince: string | null
}

export function InGameWidget({ members, myInGameSince }: InGameWidgetProps) {
  const [isInGame, setIsInGame] = useState(myInGameSince !== null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleToggle() {
    const next = !isInGame
    setIsInGame(next)
    setError(null)
    startTransition(async () => {
      const result = await toggleInGame(next)
      if (!result.success) {
        setIsInGame(!next)
        setError(result.error ?? 'Erreur')
      }
    })
  }

  const otherMembers = members.filter(m => !members.find(x => x.id === m.id && myInGameSince !== null && m.in_game_since === myInGameSince))

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Gamepad2 className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">En jeu</h3>
          {members.length > 0 && (
            <span className="inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-primary/15 text-[10px] font-bold text-primary">
              {members.length}
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
          {isInGame ? 'Je suis en jeu' : 'Rejoindre'}
        </button>
      </div>

      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}

      {members.length === 0 && !isInGame && (
        <p className="text-xs text-muted-foreground">Personne en jeu pour le moment.</p>
      )}

      {members.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {members.map((m) => (
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
                <p className="text-xs font-medium text-foreground leading-none">
                  {m.display_name ?? m.username}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {formatDistanceToNow(new Date(m.in_game_since), { addSuffix: true, locale: fr })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
