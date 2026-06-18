'use client'

import { useState, useTransition } from 'react'
import { Coins, Loader2, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Checkbox } from '@/components/ui/checkbox'
import { createLootSplit, deleteLootSplit } from '@/actions/loot'
import type { OperationLootWithShares, LootShareWithProfile } from '@/types'
import type { Profile } from '@/types'
import { getInitials } from '@/lib/utils'

interface LootPanelProps {
  operationId: string
  loots: OperationLootWithShares[]
  participants: Pick<Profile, 'id' | 'username' | 'display_name' | 'avatar_url'>[]
  canManage: boolean
}

export function LootPanel({ operationId, loots, participants, canManage }: LootPanelProps) {
  const [open, setOpen] = useState(false)
  const [totalAuec, setTotalAuec] = useState('')
  const [note, setNote] = useState('')
  const [selected, setSelected] = useState<string[]>(participants.map((p) => p.id))
  const [formError, setFormError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function toggleParticipant(id: string) {
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])
  }

  function handleCreate() {
    setFormError(null)
    startTransition(async () => {
      const result = await createLootSplit(operationId, {
        total_auec: totalAuec as unknown as number,
        note: note || undefined,
        participant_ids: selected,
      })
      if (!result.success) { setFormError(result.error); return }
      setOpen(false)
      setTotalAuec('')
      setNote('')
      setSelected(participants.map((p) => p.id))
    })
  }

  function handleDelete(lootId: string) {
    startTransition(async () => {
      await deleteLootSplit(lootId, operationId)
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Coins className="h-4 w-4 text-yellow-400" />
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Butin</h3>
        </div>
        {canManage && (
          <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Distribuer
          </Button>
        )}
      </div>

      {loots.length === 0 && (
        <p className="text-sm text-muted-foreground">Aucun butin enregistré pour cette opération.</p>
      )}

      {loots.map((loot) => (
        <div key={loot.id} className="rounded-lg border border-border bg-muted/20 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-yellow-400">{loot.total_auec.toLocaleString()} aUEC</p>
            {canManage && (
              <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(loot.id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
          {loot.note && <p className="text-xs text-muted-foreground italic">{loot.note}</p>}
          <div className="space-y-1.5">
            {loot.shares.map((s: LootShareWithProfile) => (
              <div key={s.id} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={s.profile.avatar_url ?? undefined} />
                    <AvatarFallback className="text-[9px]">{getInitials(s.profile.display_name ?? s.profile.username)}</AvatarFallback>
                  </Avatar>
                  <span className="text-foreground/80">{s.profile.display_name ?? s.profile.username}</span>
                </div>
                <span className="font-mono text-yellow-400/80">{s.amount.toLocaleString()} aUEC</span>
              </div>
            ))}
          </div>
        </div>
      ))}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Distribuer le butin</DialogTitle>
            <DialogDescription>Le montant total sera réparti équitablement entre les participants sélectionnés.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="loot-auec">Total aUEC *</Label>
              <Input id="loot-auec" type="number" min={1} placeholder="50000" value={totalAuec} onChange={(e) => setTotalAuec(e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="loot-note">Note (optionnel)</Label>
              <Input id="loot-note" placeholder="Cargo récupéré, prime…" value={note} onChange={(e) => setNote(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Participants</Label>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {participants.map((p) => (
                  <label key={p.id} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={selected.includes(p.id)}
                      onCheckedChange={() => toggleParticipant(p.id)}
                    />
                    <span className="text-sm">{p.display_name ?? p.username}</span>
                  </label>
                ))}
              </div>
            </div>

            {selected.length > 0 && totalAuec && Number(totalAuec) > 0 && (
              <p className="text-xs text-muted-foreground">
                ≈ {Math.floor(Number(totalAuec) / selected.length).toLocaleString()} aUEC / personne
              </p>
            )}

            {formError && (
              <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{formError}</p>
            )}

            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => setOpen(false)}>Annuler</Button>
              <Button onClick={handleCreate} disabled={isPending || !totalAuec || selected.length === 0}>
                {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Distribuer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
