'use client'

import { BADGES, type BadgeKey } from '@/lib/constants'
import type { MemberBadge } from '@/types'

interface MemberBadgesProps {
  badges: MemberBadge[]
}

const BADGE_COLORS: Record<string, string> = {
  amber:  'bg-amber-400/10  text-amber-400  border-amber-400/20',
  orange: 'bg-orange-400/10 text-orange-400 border-orange-400/20',
  blue:   'bg-blue-400/10   text-blue-400   border-blue-400/20',
  cyan:   'bg-cyan-400/10   text-cyan-400   border-cyan-400/20',
  green:  'bg-green-400/10  text-green-400  border-green-400/20',
  purple: 'bg-purple-400/10 text-purple-400 border-purple-400/20',
  yellow: 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20',
}

export function MemberBadges({ badges }: MemberBadgesProps) {
  if (badges.length === 0) return null

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Badges</h3>
      <div className="flex flex-wrap gap-2">
        {badges.map((b) => {
          const def = BADGES[b.badge_key as BadgeKey]
          if (!def) return null
          const colorClass = BADGE_COLORS[def.color] ?? BADGE_COLORS.blue
          return (
            <span
              key={b.badge_key}
              title={def.description}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${colorClass}`}
            >
              <span>{def.emoji}</span>
              {def.label}
            </span>
          )
        })}
      </div>
    </div>
  )
}
