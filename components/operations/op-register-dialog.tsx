'use client'

import { useState, useTransition } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { OP_ROLES, type OpRole } from '@/lib/constants'
import { registerForOperation, unregisterFromOperation } from '@/actions/operations'
import type { OpRegistration } from '@/types'
import { CheckCircle2, UserPlus, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface OpRegisterDialogProps {
  operationId: string
  myRegistration: OpRegistration | null
  onSuccess: () => void
}

const STATUS_LABELS: Record<string, string> = {
  pending:   'En attente de confirmation',
  confirmed: 'Confirmé',
  rejected:  'Refusé',
}

const STATUS_COLORS: Record<string, string> = {
  pending:   'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
  confirmed: 'text-green-400 bg-green-400/10 border-green-400/30',
  rejected:  'text-destructive bg-destructive/10 border-destructive/30',
}

export function OpRegisterDialog({ operationId, myRegistration, onSuccess }: OpRegisterDialogProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [preferredRole, setPreferredRole] = useState<string>(myRegistration?.preferred_role ?? 'none')
  const [notes, setNotes] = useState(myRegistration?.notes ?? '')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitError(null)
    startTransition(async () => {
      const result = await registerForOperation(operationId, {
        preferred_role: (preferredRole === 'none' ? '' : preferredRole) as OpRole | undefined,
        notes: notes || undefined,
      })
      if (result.success) {
        setOpen(false)
        onSuccess()
      } else {
        setSubmitError(result.error)
      }
    })
  }

  function handleUnregister() {
    setSubmitError(null)
    startTransition(async () => {
      const result = await unregisterFromOperation(operationId)
      if (result.success) {
        setOpen(false)
        onSuccess()
      } else {
        setSubmitError(result.error)
      }
    })
  }

  if (myRegistration) {
    const status = myRegistration.status
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-3 flex-wrap">
          <Badge variant="outline" className={STATUS_COLORS[status]}>
            <CheckCircle2 className="h-3 w-3 mr-1" />
            {STATUS_LABELS[status]}
          </Badge>
          {myRegistration.preferred_role && (
            <span className="text-xs text-muted-foreground">
              Rôle préféré : {OP_ROLES[myRegistration.preferred_role as OpRole]}
            </span>
          )}
          {status === 'pending' && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
              onClick={handleUnregister}
              disabled={isPending}
            >
              <X className="h-3 w-3 mr-1" />
              Se désinscrire
            </Button>
          )}
        </div>
        {submitError && (
          <div className="rounded-md bg-destructive/10 border border-destructive/30 px-3 py-2">
            <p className="text-xs text-destructive">{submitError}</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <UserPlus className="h-4 w-4" />
          S&apos;inscrire à l&apos;opération
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Inscription à l&apos;opération</DialogTitle>
          <DialogDescription>
            Indiquez votre rôle préféré. Le commandant confirmera les participations.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label id="reg-role-label">Rôle préféré</Label>
            <Select value={preferredRole} onValueChange={setPreferredRole}>
              <SelectTrigger aria-labelledby="reg-role-label">
                <SelectValue placeholder="Aucune préférence" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Aucune préférence</SelectItem>
                {(Object.entries(OP_ROLES) as [OpRole, string][]).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="reg-notes">Message pour le commandant</Label>
            <Textarea
              id="reg-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: disponible dès 20h, je peux piloter un Cutlass..."
              rows={3}
              className="resize-none"
            />
          </div>
          {submitError && (
            <div className="rounded-md bg-destructive/10 border border-destructive/30 px-3 py-2">
              <p className="text-xs text-destructive">{submitError}</p>
            </div>
          )}
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1" disabled={isPending}>
              Annuler
            </Button>
            <Button type="submit" className="flex-1" disabled={isPending}>
              {isPending ? 'Envoi...' : 'S\'inscrire'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
