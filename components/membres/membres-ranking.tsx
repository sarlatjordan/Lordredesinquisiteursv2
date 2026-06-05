'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Trophy, Shield } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { getInitials } from '@/lib/utils'
import { ROLES, ROLE_COLORS, type Role } from '@/lib/constants'
import { AwardPointsDialog } from '@/components/membres/award-points-dialog'
import type { ProfileWithPoints } from '@/types'

interface MembresRankingProps {
  members: ProfileWithPoints[]
  currentUserId?: string
  canAwardPoints?: boolean
}

const MEDAL: Record<number, string> = { 0: '🥇', 1: '🥈', 2: '🥉' }

export function MembresRanking({ members, currentUserId, canAwardPoints = false }: MembresRankingProps) {
  const withPoints = members.filter((m) => m.total_points > 0)
  const noPoints   = members.filter((m) => m.total_points <= 0)

  if (members.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <Trophy className="h-10 w-10 text-muted-foreground/40" />
        <p className="text-muted-foreground">Aucun point attribué pour l&apos;instant.</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {withPoints.map((member, i) => (
        <RankRow
          key={member.id}
          member={member}
          rank={i}
          currentUserId={currentUserId}
          canAwardPoints={canAwardPoints}
        />
      ))}

      {withPoints.length > 0 && noPoints.length > 0 && (
        <div className="py-2 border-t border-border mt-4">
          <p className="text-xs text-muted-foreground px-4 mb-2 uppercase tracking-wide">Sans points</p>
        </div>
      )}

      {noPoints.map((member, i) => (
        <RankRow
          key={member.id}
          member={member}
          rank={withPoints.length + i}
          currentUserId={currentUserId}
          canAwardPoints={canAwardPoints}
          dimmed
        />
      ))}
    </div>
  )
}

function RankRow({
  member, rank, currentUserId, canAwardPoints, dimmed = false,
}: {
  member: ProfileWithPoints
  rank: number
  currentUserId?: string
  canAwardPoints: boolean
  dimmed?: boolean
}) {
  const isMe = member.id === currentUserId
  const medal = MEDAL[rank]

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: rank * 0.03 }}
      className={`flex items-center gap-4 rounded-lg border px-4 py-3 transition-colors ${
        isMe
          ? 'border-primary/30 bg-primary/5'
          : 'border-border bg-card hover:border-primary/20'
      } ${dimmed ? 'opacity-50' : ''}`}
    >
      {/* Rang */}
      <div className="w-8 text-center shrink-0">
        {medal ? (
          <span className="text-lg">{medal}</span>
        ) : (
          <span className="text-sm font-semibold text-muted-foreground">#{rank + 1}</span>
        )}
      </div>

      {/* Avatar */}
      <Avatar className="h-9 w-9 border border-border shrink-0">
        <AvatarImage src={member.avatar_url ?? undefined} />
        <AvatarFallback className="bg-primary/10 text-primary text-xs">
          {getInitials(member.display_name ?? member.username)}
        </AvatarFallback>
      </Avatar>

      {/* Infos */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <Link href={`/membres/${member.username}`} className="text-sm font-semibold hover:text-primary transition-colors truncate">
            {member.display_name ?? member.username}
            {isMe && <span className="ml-1 text-[10px] text-primary">(moi)</span>}
          </Link>
          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${ROLE_COLORS[member.role as Role]}`}>
            <Shield className="h-2.5 w-2.5 mr-1" />
            {ROLES[member.role as Role] ?? member.role}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">@{member.username}</p>
      </div>

      {/* Points */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="text-right">
          <p className={`text-sm font-bold ${member.total_points > 0 ? 'text-amber-400' : 'text-muted-foreground'}`}>
            {member.total_points > 0 ? `+${member.total_points}` : member.total_points}
          </p>
          <p className="text-[10px] text-muted-foreground">points</p>
        </div>

        {canAwardPoints && !isMe && (
          <AwardPointsDialog
            target={{ id: member.id, username: member.username, display_name: member.display_name }}
          />
        )}
      </div>
    </motion.div>
  )
}
