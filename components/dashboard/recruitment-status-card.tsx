'use client'

import { useState, useTransition } from 'react'
import { motion } from 'framer-motion'
import { Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { setRecruitmentOpen } from '@/actions/org-settings'

interface RecruitmentStatusCardProps {
  open: boolean
  canToggle: boolean
  index?: number
}

export function RecruitmentStatusCard({ open, canToggle, index = 3 }: RecruitmentStatusCardProps) {
  const [isOpen, setIsOpen] = useState(open)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleToggle() {
    const next = !isOpen
    setError(null)
    startTransition(async () => {
      const result = await setRecruitmentOpen(next)
      if (result.success) {
        setIsOpen(next)
      } else {
        setError(result.error)
      }
    })
  }

  const iconStyle = isOpen
    ? 'text-green-400 bg-green-400/10'
    : 'text-destructive bg-destructive/10'
  const valueStyle = isOpen ? 'text-green-400' : 'text-destructive'

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.06 }}
      className="relative rounded-lg border border-border bg-card p-5 overflow-hidden group hover:border-primary/20 transition-colors"
    >
      <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      </div>

      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider truncate">
            Recrutements
          </p>
          <p className={cn('text-2xl font-bold mt-1', valueStyle)}>
            {isOpen ? 'Ouvert' : 'Fermé'}
          </p>
          {canToggle ? (
            <button
              onClick={handleToggle}
              disabled={isPending}
              className="text-xs text-muted-foreground mt-1 hover:text-foreground transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isPending ? 'Mise à jour…' : isOpen ? 'Fermer le recrutement' : 'Ouvrir le recrutement'}
            </button>
          ) : (
            <p className="text-xs text-muted-foreground mt-1">Candidatures org</p>
          )}
          {error && <p className="text-xs text-destructive mt-1">{error}</p>}
        </div>
        <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg shrink-0', iconStyle)}>
          <Users className="h-5 w-5" />
        </div>
      </div>
    </motion.div>
  )
}
