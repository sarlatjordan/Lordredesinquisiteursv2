'use client'

import { useState } from 'react'
import { Users, ClipboardList, TrendingUp } from 'lucide-react'
import { CandidaturesClient } from '../candidatures/candidatures-client'
import { PromotionsClient } from '../promotions/promotions-client'
import type { Application, RankEvaluationWithProfiles, PromotionHistoryItem, Profile } from '@/types'

interface GestionMembresClientProps {
  evaluations: RankEvaluationWithProfiles[]
  members: Pick<Profile, 'id' | 'username' | 'display_name' | 'role'>[]
  history: PromotionHistoryItem[]
  applications: Application[]
  isSage: boolean
}

export function GestionMembresClient({
  evaluations,
  members,
  history,
  applications,
  isSage,
}: GestionMembresClientProps) {
  const [tab, setTab] = useState<'promotions' | 'candidatures'>('promotions')

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
              {applications.filter((a) => a.status === 'pending').length > 0 && (
                <span className="ml-1 inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-amber-400 text-[9px] font-bold text-black">
                  {applications.filter((a) => a.status === 'pending').length}
                </span>
              )}
            </button>
          </div>
        )}
      </div>

      {tab === 'promotions' || !isSage ? (
        <PromotionsClient evaluations={evaluations} members={members} history={history} />
      ) : (
        <CandidaturesClient applications={applications} />
      )}
    </div>
  )
}
