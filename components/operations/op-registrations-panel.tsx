'use client'

import { useTransition, useState } from 'react'
import { motion } from 'framer-motion'
import { Check, X, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { OP_ROLES, type OpRole } from '@/lib/constants'
import { updateRegistrationStatus } from '@/actions/operations'
import type { OpRegistrationWithProfile } from '@/types'

interface OpRegistrationsPanelProps {
  operationId: string
  registrations: OpRegistrationWithProfile[]
  onUpdate: () => void
}

const STATUS_COLORS: Record<string, string> = {
  pending:   'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
  confirmed: 'text-green-400 bg-green-400/10 border-green-400/30',
  rejected:  'text-destructive bg-destructive/10 border-destructive/30',
}

const STATUS_LABELS: Record<string, string> = {
  pending:   'En attente',
  confirmed: 'Confirmé',
  rejected:  'Refusé',
}

interface RowProps {
  reg: OpRegistrationWithProfile
  index: number
  disabled: boolean
  onConfirm?: () => void
  onReject?: () => void
}

function RegistrationRow({ reg, index, disabled, onConfirm, onReject }: RowProps) {
  const name = reg.profile?.display_name ?? reg.profile?.username ?? 'Membre'
  const initials = name.slice(0, 2).toUpperCase()

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="flex items-start gap-3 rounded-md border border-border bg-muted/20 p-3"
    >
      <Avatar className="h-7 w-7 mt-0.5 shrink-0">
        <AvatarFallback className="text-[10px] bg-primary/10 text-primary">{initials}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium">{name}</span>
          <Badge variant="outline" className={`text-[10px] px-1 py-0 ${STATUS_COLORS[reg.status]}`}>
            {STATUS_LABELS[reg.status]}
          </Badge>
          {reg.preferred_role && (
            <Badge variant="outline" className="text-[10px] px-1 py-0 text-muted-foreground">
              {OP_ROLES[reg.preferred_role as OpRole]}
            </Badge>
          )}
        </div>
        {reg.notes && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{reg.notes}</p>
        )}
      </div>
      <div className="flex gap-1 shrink-0">
        {onConfirm && (
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-green-400 hover:bg-green-400/10"
            onClick={onConfirm}
            disabled={disabled}
            aria-label="Confirmer"
          >
            <Check className="h-3.5 w-3.5" />
          </Button>
        )}
        {onReject && (
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-destructive hover:bg-destructive/10"
            onClick={onReject}
            disabled={disabled}
            aria-label="Refuser"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </motion.div>
  )
}

export function OpRegistrationsPanel({ operationId, registrations, onUpdate }: OpRegistrationsPanelProps) {
  const [isPending, startTransition] = useTransition()
  const [panelError, setPanelError] = useState<string | null>(null)

  function handleStatus(registrationId: string, status: 'confirmed' | 'rejected') {
    setPanelError(null)
    startTransition(async () => {
      const result = await updateRegistrationStatus(registrationId, status, operationId)
      if (!result.success) { setPanelError(result.error); return }
      onUpdate()
    })
  }

  const pending   = registrations.filter((r) => r.status === 'pending')
  const confirmed = registrations.filter((r) => r.status === 'confirmed')
  const rejected  = registrations.filter((r) => r.status === 'rejected')

  if (registrations.length === 0) {
    return (
      <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
        <Clock className="h-4 w-4" />
        Aucune inscription pour l&apos;instant.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {panelError && (
        <div className="rounded-md bg-destructive/10 border border-destructive/30 px-3 py-2">
          <p className="text-xs text-destructive">{panelError}</p>
        </div>
      )}
      {pending.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            En attente ({pending.length})
          </p>
          {pending.map((reg, i) => (
            <RegistrationRow
              key={reg.id}
              reg={reg}
              index={i}
              disabled={isPending}
              onConfirm={() => handleStatus(reg.id, 'confirmed')}
              onReject={() => handleStatus(reg.id, 'rejected')}
            />
          ))}
        </div>
      )}

      {confirmed.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Confirmés ({confirmed.length})
          </p>
          {confirmed.map((reg, i) => (
            <RegistrationRow
              key={reg.id}
              reg={reg}
              index={i}
              disabled={isPending}
              onReject={() => handleStatus(reg.id, 'rejected')}
            />
          ))}
        </div>
      )}

      {rejected.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Refusés ({rejected.length})
          </p>
          {rejected.map((reg, i) => (
            <RegistrationRow
              key={reg.id}
              reg={reg}
              index={i}
              disabled={isPending}
              onConfirm={() => handleStatus(reg.id, 'confirmed')}
            />
          ))}
        </div>
      )}
    </div>
  )
}
