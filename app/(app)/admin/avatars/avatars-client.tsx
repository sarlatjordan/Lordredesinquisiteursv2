'use client'

import { useState, useTransition } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, XCircle, ImageIcon, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { approveAvatar, rejectAvatar } from '@/actions/members'
import { getInitials } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import type { ProfileWithPendingAvatar } from '@/types'

interface AvatarsClientProps {
  profiles: ProfileWithPendingAvatar[]
}

function AvatarRow({ profile }: { profile: ProfileWithPendingAvatar }) {
  const [actionError, setActionError] = useState<string | null>(null)
  const [loadingAction, setLoadingAction] = useState<'approve' | 'reject' | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleApprove() {
    setActionError(null)
    setLoadingAction('approve')
    startTransition(async () => {
      const res = await approveAvatar(profile.id)
      if (!res.success) { setActionError(res.error); setLoadingAction(null) }
      else { router.refresh() }
    })
  }

  function handleReject() {
    setActionError(null)
    setLoadingAction('reject')
    startTransition(async () => {
      const res = await rejectAvatar(profile.id)
      if (!res.success) { setActionError(res.error); setLoadingAction(null) }
      else { router.refresh() }
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-4 p-4 rounded-lg border border-border bg-card"
    >
      {/* Avatar actuel */}
      <div className="space-y-1 shrink-0">
        <p className="text-[10px] text-muted-foreground text-center">Actuel</p>
        <Avatar className="h-14 w-14 border border-border">
          <AvatarImage src={profile.avatar_url ?? undefined} />
          <AvatarFallback className="bg-muted text-muted-foreground text-sm">
            {getInitials(profile.display_name ?? profile.username)}
          </AvatarFallback>
        </Avatar>
      </div>

      {/* Flèche */}
      <div className="flex items-center self-center text-muted-foreground shrink-0 mt-4">→</div>

      {/* Photo soumise */}
      <div className="space-y-1 shrink-0">
        <p className="text-[10px] text-muted-foreground text-center">Soumise</p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={profile.avatar_pending_url!}
          alt={`Photo soumise par ${profile.username}`}
          className="h-14 w-14 rounded-full object-cover border-2 border-amber-500/40"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
        />
      </div>

      {/* Infos + actions */}
      <div className="flex-1 min-w-0 space-y-2">
        <div>
          <p className="font-medium text-foreground">{profile.display_name ?? profile.username}</p>
          <p className="text-xs text-muted-foreground">@{profile.username}</p>
        </div>
        <p className="text-[11px] text-muted-foreground break-all line-clamp-1">{profile.avatar_pending_url}</p>
        {actionError && (
          <p className="text-xs text-destructive">{actionError}</p>
        )}
        <div className="flex gap-2 flex-wrap">
          <Button
            size="sm"
            className="gap-1.5 bg-green-600 hover:bg-green-500 text-white"
            onClick={handleApprove}
            disabled={isPending}
          >
            {isPending && loadingAction === 'approve'
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : <CheckCircle2 className="h-3.5 w-3.5" />
            }
            Approuver
          </Button>
          <Button
            size="sm"
            variant="destructive"
            className="gap-1.5"
            onClick={handleReject}
            disabled={isPending}
          >
            {isPending && loadingAction === 'reject'
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : <XCircle className="h-3.5 w-3.5" />
            }
            Refuser
          </Button>
        </div>
      </div>
    </motion.div>
  )
}

export function AvatarsClient({ profiles }: AvatarsClientProps) {
  if (profiles.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <ImageIcon className="h-10 w-10 text-muted-foreground/40" />
        <p className="text-muted-foreground">Aucune photo en attente de validation</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {profiles.map((p) => (
        <AvatarRow key={p.id} profile={p} />
      ))}
    </div>
  )
}
