'use client'

import { useState, useTransition } from 'react'
import { Users, ClipboardList, TrendingUp, Palmtree, Trash2 } from 'lucide-react'
import { CandidaturesClient } from '../candidatures/candidatures-client'
import { PromotionsClient } from '../promotions/promotions-client'
import { deleteAbsence } from '@/actions/absences'
import { useRouter } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { getInitials } from '@/lib/utils'
import { ROLE_COLORS } from '@/lib/constants'
import type { Application, RankEvaluationWithProfiles, PromotionHistoryItem, Profile, AbsenceWithProfile } from '@/types'

interface GestionMembresClientProps {
  evaluations: RankEvaluationWithProfiles[]
  members: Pick<Profile, 'id' | 'username' | 'display_name' | 'role'>[]
  history: PromotionHistoryItem[]
  applications: Application[]
  absences: AbsenceWithProfile[]
  isSage: boolean
}

type Tab = 'promotions' | 'candidatures' | 'absences'

export function GestionMembresClient({
  evaluations,
  members,
  history,
  applications,
  absences,
  isSage,
}: GestionMembresClientProps) {
  const [tab, setTab] = useState<Tab>('promotions')
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleDeleteAbsence(id: string) {
    startTransition(async () => {
      await deleteAbsence(id)
      router.refresh()
    })
  }

  const pendingApps = applications.filter((a) => a.status === 'pending').length

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 border border-primary/30 shrink-0">
          <Users className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold text-foreground">Gestion Membres</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Candidatures et épreuves de rang
          </p>
        </div>

        {isSage && (
          <div className="flex rounded-lg border border-border overflow-hidden shrink-0">
            <button
              onClick={() => setTab('promotions')}
              className={[
                'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors',
                tab === 'promotions'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted',
              ].join(' ')}
            >
              <TrendingUp className="h-3.5 w-3.5" />
              Promotions
            </button>
            <button
              onClick={() => setTab('candidatures')}
              className={[
                'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors border-l border-border',
                tab === 'candidatures'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted',
              ].join(' ')}
            >
              <ClipboardList className="h-3.5 w-3.5" />
              Candidatures
              {pendingApps > 0 && (
                <span className="ml-1 inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-amber-400 text-[9px] font-bold text-black">
                  {pendingApps}
                </span>
              )}
            </button>
            <button
              onClick={() => setTab('absences')}
              className={[
                'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors border-l border-border',
                tab === 'absences'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted',
              ].join(' ')}
            >
              <Palmtree className="h-3.5 w-3.5" />
              Absences
              {absences.length > 0 && (
                <span className="ml-1 inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-muted-foreground/30 text-[9px] font-bold text-foreground">
                  {absences.length}
                </span>
              )}
            </button>
          </div>
        )}
      </div>

      {(tab === 'promotions' || !isSage) && (
        <PromotionsClient evaluations={evaluations} members={members} history={history} />
      )}
      {tab === 'candidatures' && isSage && (
        <CandidaturesClient applications={applications} />
      )}
      {tab === 'absences' && isSage && (
        <div className="space-y-3">
          {absences.length === 0 ? (
            <div className="rounded-lg border border-border bg-card p-8 text-center">
              <Palmtree className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Aucune absence planifiée.</p>
            </div>
          ) : (
            absences.map((a) => {
              const name = a.profile.display_name ?? a.profile.username
              const initials = getInitials(name)
              const roleColor = ROLE_COLORS[a.profile.role as keyof typeof ROLE_COLORS] ?? 'bg-muted'
              return (
                <div key={a.id} className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarImage src={a.profile.avatar_url ?? undefined} />
                    <AvatarFallback className={`text-xs text-white ${roleColor}`}>{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{name}</p>
                    <p className="text-xs text-muted-foreground">
                      {a.start_date} → {a.end_date}
                      {a.reason && ` — ${a.reason}`}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                    disabled={isPending}
                    onClick={() => handleDeleteAbsence(a.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
