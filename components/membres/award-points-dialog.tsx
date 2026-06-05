'use client'

import { useState, useTransition } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { POINT_REASONS, type PointReason } from '@/lib/constants'
import { awardPoints } from '@/actions/points'
import { Zap, AlertCircle } from 'lucide-react'
import type { Profile } from '@/types'

interface AwardPointsDialogProps {
  target: Pick<Profile, 'id' | 'username' | 'display_name'>
  onSuccess?: () => void
}

export function AwardPointsDialog({ target, onSuccess }: AwardPointsDialogProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [points, setPoints] = useState('')
  const [reason, setReason] = useState<PointReason>('op_participated')
  const [reasonDetail, setReasonDetail] = useState('')

  function reset() {
    setPoints('')
    setReason('op_participated')
    setReasonDetail('')
    setError(null)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const result = await awardPoints({
        profile_id: target.id,
        points: Number(points),
        reason,
        reason_detail: reasonDetail || undefined,
      })
      if (result.success) {
        setOpen(false)
        reset()
        onSuccess?.()
      } else {
        setError(result.error)
      }
    })
  }

  const targetName = target.display_name ?? target.username
  const isNegative = Number(points) < 0

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset() }}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="h-7 gap-1 text-[11px] px-2 text-amber-400 border-amber-400/30 hover:bg-amber-400/10">
          <Zap className="h-3 w-3" />
          Points
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Attribuer des points</DialogTitle>
          <DialogDescription>
            Points d&apos;implication pour <strong>{targetName}</strong>. Valeur négative = pénalité.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {error && (
            <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="pts-amount">Montant de points *</Label>
            <Input
              id="pts-amount"
              type="number"
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              placeholder="Ex: 50 ou -10"
              required
              className={isNegative ? 'border-destructive/50 text-destructive' : ''}
            />
            {isNegative && (
              <p className="text-[11px] text-destructive">Pénalité — valeur négative</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label id="pts-reason-label">Motif *</Label>
            <Select value={reason} onValueChange={(v) => setReason(v as PointReason)}>
              <SelectTrigger aria-labelledby="pts-reason-label">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(POINT_REASONS) as [PointReason, string][]).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="pts-detail">Détail (optionnel)</Label>
            <Textarea
              id="pts-detail"
              value={reasonDetail}
              onChange={(e) => setReasonDetail(e.target.value)}
              placeholder="Ex: Op Raid minier sur Lyria, présence exemplaire…"
              rows={2}
              className="resize-none"
            />
          </div>

          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1" disabled={isPending}>
              Annuler
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isPending || !points}
              variant={isNegative ? 'destructive' : 'default'}
            >
              {isPending ? 'Enregistrement…' : isNegative ? 'Appliquer pénalité' : 'Attribuer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
