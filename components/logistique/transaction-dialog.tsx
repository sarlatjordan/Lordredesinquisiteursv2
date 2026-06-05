'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button }   from '@/components/ui/button'
import { Input }    from '@/components/ui/input'
import { Label }    from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { INVENTORY_TX_TYPES, type InventoryTxType } from '@/lib/constants'
import { submitTransaction, directAdjust } from '@/actions/logistics'

// ─── Dialog membre : dépôt / retrait (pending workflow) ──────────────────────

interface MemberTxDialogProps {
  itemId: string
  itemName: string
  defaultType?: 'deposit' | 'withdrawal'
  children: React.ReactNode
}

export function MemberTxDialog({
  itemId,
  itemName,
  defaultType = 'deposit',
  children,
}: MemberTxDialogProps) {
  const router = useRouter()
  const [open, setOpen]       = useState(false)
  const [type, setType]       = useState<'deposit' | 'withdrawal'>(defaultType)
  const [qty,  setQty]        = useState('')
  const [notes, setNotes]     = useState('')
  const [error, setError]     = useState<string | null>(null)
  const [isPending, start]    = useTransition()

  function reset() {
    setType(defaultType)
    setQty('')
    setNotes('')
    setError(null)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const quantity = parseInt(qty, 10)
    if (!quantity || quantity <= 0) { setError('Quantité invalide'); return }

    start(async () => {
      const result = await submitTransaction(itemId, type, quantity, notes)
      if (!result.success) { setError(result.error); return }
      reset()
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset() }}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Demande de transaction</DialogTitle>
          <DialogDescription>{itemName}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label id="tx-type-label">Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as 'deposit' | 'withdrawal')}>
              <SelectTrigger aria-labelledby="tx-type-label"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="deposit">Dépôt</SelectItem>
                <SelectItem value="withdrawal">Retrait</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tx-qty">Quantité *</Label>
            <Input
              id="tx-qty"
              type="number"
              min="1"
              step="1"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              placeholder="Ex: 10"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tx-notes">Notes</Label>
            <Textarea
              id="tx-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contexte, origine des items, etc."
              rows={2}
              className="resize-none"
            />
          </div>

          {error && (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
              Annuler
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Envoi…' : 'Envoyer la demande'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Dialog Gardien+ : ajustement direct ─────────────────────────────────────

interface DirectAdjustDialogProps {
  itemId: string
  itemName: string
  operations: { id: string; title: string }[]
  children: React.ReactNode
}

export function DirectAdjustDialog({
  itemId,
  itemName,
  operations,
  children,
}: DirectAdjustDialogProps) {
  const router = useRouter()
  const [open,        setOpen]        = useState(false)
  const [type,        setType]        = useState<InventoryTxType>('deposit')
  const [qty,         setQty]         = useState('')
  const [notes,       setNotes]       = useState('')
  const [operationId, setOperationId] = useState<string>('none')
  const [error,       setError]       = useState<string | null>(null)
  const [isPending,   start]          = useTransition()

  function reset() {
    setType('deposit')
    setQty('')
    setNotes('')
    setOperationId('none')
    setError(null)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const quantity = parseInt(qty, 10)
    if (!quantity || quantity <= 0) { setError('Quantité invalide'); return }

    start(async () => {
      const opId = operationId !== 'none' ? operationId : undefined
      const result = await directAdjust(itemId, type, quantity, notes, opId)
      if (!result.success) { setError(result.error); return }
      reset()
      setOpen(false)
      router.refresh()
    })
  }

  const showOpSelect = type === 'reservation' || type === 'release'

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset() }}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ajustement direct</DialogTitle>
          <DialogDescription>{itemName} — effet immédiat sur le stock</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label id="da-type-label">Type *</Label>
            <Select value={type} onValueChange={(v) => setType(v as InventoryTxType)}>
              <SelectTrigger aria-labelledby="da-type-label"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.entries(INVENTORY_TX_TYPES) as [InventoryTxType, string][]).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="da-qty">Quantité *</Label>
            <Input
              id="da-qty"
              type="number"
              min="1"
              step="1"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              placeholder="Ex: 10"
              required
            />
          </div>

          {showOpSelect && operations.length > 0 && (
            <div className="space-y-1.5">
              <Label id="da-op-label">Opération liée</Label>
              <Select value={operationId} onValueChange={setOperationId}>
                <SelectTrigger aria-labelledby="da-op-label"><SelectValue placeholder="Aucune" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucune</SelectItem>
                  {operations.map((op) => (
                    <SelectItem key={op.id} value={op.id}>{op.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="da-notes">Notes</Label>
            <Textarea
              id="da-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Raison de l'ajustement, contexte…"
              rows={2}
              className="resize-none"
            />
          </div>

          {error && (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
              Annuler
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Application…' : 'Appliquer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
