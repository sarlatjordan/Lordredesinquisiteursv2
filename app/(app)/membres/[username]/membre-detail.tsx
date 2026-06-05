'use client'

import { motion } from 'framer-motion'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { getInitials, formatDate } from '@/lib/utils'
import {
  ROLES, ROLE_COLORS, ROLE_PRIVILEGES,
  ACTIVITY_LEVELS, ACTIVITY_LEVEL_COLORS,
  POINT_REASONS,
  type Role, type ActivityLevel, type PointReason,
} from '@/lib/constants'
import { ProgressionForm } from '@/components/membres/progression-form'
import { AwardPointsDialog } from '@/components/membres/award-points-dialog'
import { Shield, Star, ExternalLink, CalendarDays, Target, Rocket, Zap, ChevronUp, ChevronDown, FileText, Lock } from 'lucide-react'
import type { ProfileWithPoints, MemberProgression, MemberPromotion, MemberPoints } from '@/types'

interface Stats {
  eventCount: number
  opCount: number
  shipCount: number
}

interface Permissions {
  isSage: boolean
  canAwardPoints: boolean
  isOwnProfile: boolean
}

interface MembreDetailProps {
  profile: ProfileWithPoints
  progression: MemberProgression | null
  promotions: (MemberPromotion & { promoter_name?: string })[]
  points: (MemberPoints & { awarder_name?: string })[]
  stats: Stats
  permissions: Permissions
}

export function MembreDetail({
  profile, progression, promotions, points,
  stats: { eventCount, opCount, shipCount },
  permissions: { isSage, canAwardPoints, isOwnProfile },
}: MembreDetailProps) {
  const role = profile.role as Role

  const RANK_ORDER: Role[] = ['visiteur', 'aspirant', 'consacre', 'gardien', 'inquisiteur', 'maitre_inquisiteur', 'sage']
  const currentIdx  = RANK_ORDER.indexOf(role)
  const nextRole    = RANK_ORDER[currentIdx + 1] as Role | undefined

  return (
    <div className="space-y-8">
      {/* Header profil */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-5 flex-wrap">
        <Avatar className="h-16 w-16 border-2 border-border shrink-0">
          <AvatarImage src={profile.avatar_url ?? undefined} />
          <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
            {getInitials(profile.display_name ?? profile.username)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-foreground">
              {profile.display_name ?? profile.username}
            </h1>
            <Badge variant="outline" className={`${ROLE_COLORS[role]}`}>
              <Shield className="h-3 w-3 mr-1" />
              {ROLES[role]}
            </Badge>
            {profile.total_points > 0 && (
              <Badge variant="outline" className="text-amber-400 bg-amber-400/10 border-amber-400/30">
                <Zap className="h-3 w-3 mr-1" />
                {profile.total_points} pts
              </Badge>
            )}
          </div>

          <p className="text-sm text-muted-foreground">@{profile.username}</p>

          {profile.star_citizen_handle && (
            <a
              href={`https://robertsspaceindustries.com/citizens/${profile.star_citizen_handle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              <Star className="h-3 w-3 text-amber-400/70" />
              {profile.star_citizen_handle}
              <ExternalLink className="h-2.5 w-2.5" />
            </a>
          )}

          {profile.bio && (
            <p className="text-sm text-muted-foreground pt-1 max-w-lg">{profile.bio}</p>
          )}
        </div>

        {/* Actions Sage */}
        <div className="flex flex-col gap-2 shrink-0">
          {isSage && (
            <ProgressionForm
              target={{ id: profile.id, username: profile.username, display_name: profile.display_name }}
              current={progression}
            />
          )}
          {canAwardPoints && !isOwnProfile && (
            <AwardPointsDialog
              target={{ id: profile.id, username: profile.username, display_name: profile.display_name }}
            />
          )}
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3"
      >
        {[
          { icon: CalendarDays, label: 'Événements', value: eventCount },
          { icon: Target,       label: 'Opérations', value: opCount },
          { icon: Rocket,       label: 'Vaisseaux',  value: shipCount },
          { icon: Zap,          label: 'Points',      value: profile.total_points, amber: true },
        ].map(({ icon: Icon, label, value, amber }) => (
          <div key={label} className="rounded-lg border border-border bg-card p-4 text-center">
            <Icon className={`h-5 w-5 mx-auto mb-1 ${amber ? 'text-amber-400' : 'text-primary'}`} />
            <p className={`text-2xl font-bold ${amber && value > 0 ? 'text-amber-400' : 'text-foreground'}`}>{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </motion.div>

      <Separator />

      {/* Corps — deux colonnes */}
      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        {/* Colonne gauche — progression */}
        <div className="space-y-6">
          {/* Fiche progression */}
          <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">Progression</h3>

            {progression || isSage ? (
              <div className="rounded-lg border border-border bg-card p-4 space-y-4">
                {/* Activité */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Niveau d&apos;activité</span>
                  {progression?.activity_level ? (
                    <Badge variant="outline" className={ACTIVITY_LEVEL_COLORS[progression.activity_level as ActivityLevel]}>
                      {ACTIVITY_LEVELS[progression.activity_level as ActivityLevel]}
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground/50">—</span>
                  )}
                </div>

                {/* Activité favorite */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Spécialité</span>
                  <span className="text-sm font-medium text-foreground">
                    {progression?.favorite_activity ?? <span className="text-muted-foreground/50 font-normal">—</span>}
                  </span>
                </div>

                {/* Formations */}
                {(progression?.trainings_received?.length ?? 0) > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Formations</p>
                    <div className="flex flex-wrap gap-1.5">
                      {progression!.trainings_received.map((t) => (
                        <Badge key={t} variant="outline" className="text-xs text-cyan-400 border-cyan-400/30 bg-cyan-400/10">
                          {t}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Rang suivant */}
                {nextRole && (
                  <div className="border-t border-border pt-3">
                    <p className="text-xs text-muted-foreground mb-1.5">Vers {ROLES[nextRole]}</p>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${Math.round((currentIdx / (RANK_ORDER.length - 1)) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Notes sage — visible sages seulement */}
                {isSage && progression?.notes_sage && (
                  <div className="border-t border-border pt-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Lock className="h-3 w-3 text-amber-400" />
                      <p className="text-xs font-semibold text-amber-400">Notes Sage</p>
                    </div>
                    <p className="text-xs text-muted-foreground whitespace-pre-wrap">{progression.notes_sage}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-border bg-muted/20 p-6 text-center">
                <FileText className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Aucune fiche de progression renseignée.</p>
              </div>
            )}
          </motion.section>

          {/* Historique des points */}
          {(isSage || canAwardPoints || isOwnProfile) && points.length > 0 && (
            <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">Points récents</h3>
              <div className="space-y-2">
                {points.map((p, i) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex items-center gap-3 rounded-md border border-border bg-muted/20 px-3 py-2"
                  >
                    {p.points > 0
                      ? <ChevronUp className="h-4 w-4 text-green-400 shrink-0" />
                      : <ChevronDown className="h-4 w-4 text-destructive shrink-0" />
                    }
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{POINT_REASONS[p.reason as PointReason]}</span>
                        {p.reason_detail && (
                          <span className="text-xs text-foreground/70 truncate">— {p.reason_detail}</span>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground/60">
                        {formatDate(p.created_at)}{p.awarder_name ? ` · par ${p.awarder_name}` : ''}
                      </p>
                    </div>
                    <span className={`text-sm font-bold shrink-0 ${p.points > 0 ? 'text-green-400' : 'text-destructive'}`}>
                      {p.points > 0 ? '+' : ''}{p.points}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.section>
          )}
        </div>

        {/* Colonne droite — infos + promotions */}
        <div className="space-y-6">
          <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.08 }}>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">Informations</h3>
            <div className="rounded-lg border border-border bg-card p-4 space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Membre depuis</span>
                <span>{formatDate(profile.joined_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Statut</span>
                <Badge variant="outline" className={profile.is_active ? 'text-green-400 border-green-400/30 bg-green-400/10' : 'text-muted-foreground'}>
                  {profile.is_active ? 'Actif' : 'Inactif'}
                </Badge>
              </div>
            </div>
          </motion.section>

          {/* Historique promotions */}
          <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.12 }}>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
              Promotions ({promotions.length})
            </h3>
            {promotions.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2">Aucune promotion enregistrée.</p>
            ) : (
              <div className="space-y-2">
                {promotions.map((p, i) => {
                  const fromRole = p.from_role as Role
                  const toRole   = p.to_role as Role
                  const isUp     = (ROLE_PRIVILEGES[toRole] ?? 0) > (ROLE_PRIVILEGES[fromRole] ?? 0)
                  return (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="flex items-start gap-3 rounded-md border border-border bg-muted/20 px-3 py-2"
                    >
                      {isUp
                        ? <ChevronUp className="h-4 w-4 text-green-400 mt-0.5 shrink-0" />
                        : <ChevronDown className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                      }
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Badge variant="outline" className={`text-[10px] px-1 py-0 ${ROLE_COLORS[fromRole] ?? ''}`}>
                            {ROLES[fromRole] ?? fromRole}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">→</span>
                          <Badge variant="outline" className={`text-[10px] px-1 py-0 ${ROLE_COLORS[toRole] ?? ''}`}>
                            {ROLES[toRole] ?? toRole}
                          </Badge>
                        </div>
                        <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                          {formatDate(p.promoted_at)}{p.promoter_name ? ` · par ${p.promoter_name}` : ''}
                          {p.points_at_promotion != null ? ` · ${p.points_at_promotion} pts` : ''}
                        </p>
                        {p.reason && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{p.reason}</p>}
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </motion.section>
        </div>
      </div>
    </div>
  )
}
