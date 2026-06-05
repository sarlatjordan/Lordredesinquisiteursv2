'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Shield, Star, ExternalLink, Loader2 } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatDate, getInitials } from '@/lib/utils'
import { ROLES, ROLE_COLORS, type Role } from '@/lib/constants'
import { updateMemberRole } from '@/actions/members'
import { AwardPointsDialog } from '@/components/membres/award-points-dialog'
import type { Profile } from '@/types'

interface MemberCardProps {
  profile: Profile
  index?: number
  isAdmin?: boolean
  canAwardPoints?: boolean
  currentUserId?: string
  totalPoints?: number
}

export function MemberCard({ profile, index = 0, isAdmin = false, canAwardPoints = false, currentUserId, totalPoints = 0 }: MemberCardProps) {
  const [isPending, startTransition] = useTransition()
  const [currentRole, setCurrentRole] = useState<Role>(profile.role as Role)

  const canEditRole = isAdmin && profile.id !== currentUserId

  function handleRoleChange(newRole: Role) {
    startTransition(async () => {
      const result = await updateMemberRole(profile.id, newRole)
      if (result.success) setCurrentRole(newRole)
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="group rounded-lg border border-border bg-card p-4 hover:border-primary/20 hover:bg-accent/30 transition-all duration-200"
    >
      <div className="flex items-start gap-3">
        <Avatar className="h-10 w-10 border border-border shrink-0">
          <AvatarImage src={profile.avatar_url ?? undefined} alt={profile.display_name ?? profile.username} />
          <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
            {getInitials(profile.display_name ?? profile.username)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href={`/membres/${profile.username}`}
              className="text-sm font-semibold text-foreground hover:text-primary transition-colors truncate"
            >
              {profile.display_name ?? profile.username}
            </Link>

            {canEditRole ? (
              <div className="flex items-center gap-1.5 shrink-0">
                {isPending && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
                <Select
                  value={currentRole}
                  onValueChange={(v) => handleRoleChange(v as Role)}
                  disabled={isPending}
                >
                  <SelectTrigger
                    className={`h-5 text-[10px] px-1.5 py-0 border rounded-full w-auto gap-1 ${ROLE_COLORS[currentRole]}`}
                  >
                    <Shield className="h-2.5 w-2.5" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.entries(ROLES) as [Role, string][]).map(([value, label]) => (
                      <SelectItem key={value} value={value} className="text-xs">
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <Badge
                variant="outline"
                className={`text-[10px] px-1.5 py-0 shrink-0 ${ROLE_COLORS[currentRole]}`}
              >
                <Shield className="h-2.5 w-2.5 mr-1" />
                {ROLES[currentRole]}
              </Badge>
            )}
          </div>

          <p className="text-xs text-muted-foreground mt-0.5">@{profile.username}</p>

          {profile.star_citizen_handle && (
            <div className="flex items-center gap-1 mt-1.5">
              <Star className="h-3 w-3 text-amber-400/70" />
              <a
                href={`https://robertsspaceindustries.com/citizens/${profile.star_citizen_handle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground hover:text-primary flex items-center gap-0.5 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                {profile.star_citizen_handle}
                <ExternalLink className="h-2.5 w-2.5" />
              </a>
            </div>
          )}

          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <p className="text-[10px] text-muted-foreground/60">
              Membre depuis {formatDate(profile.joined_at)}
            </p>
            {totalPoints > 0 && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-amber-400 bg-amber-400/10 border-amber-400/30">
                ⚡ {totalPoints} pts
              </Badge>
            )}
          </div>

          {canAwardPoints && profile.id !== currentUserId && (
            <div className="mt-2">
              <AwardPointsDialog
                target={{ id: profile.id, username: profile.username, display_name: profile.display_name }}
              />
            </div>
          )}
        </div>

        <div
          className={`h-2 w-2 rounded-full shrink-0 mt-1 ${profile.is_active ? 'bg-green-400' : 'bg-muted-foreground/30'}`}
          title={profile.is_active ? 'Actif' : 'Inactif'}
        />
      </div>

      {profile.bio && (
        <p className="text-xs text-muted-foreground mt-3 line-clamp-2 border-t border-border pt-3">
          {profile.bio}
        </p>
      )}
    </motion.div>
  )
}
