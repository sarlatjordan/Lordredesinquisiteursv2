'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import {
  Package, Edit, Trash2, ArrowDownCircle, ArrowUpCircle,
  Settings2, Check, X, Clock, ChevronDown,
} from 'lucide-react'
import { formatDateTime } from '@/lib/utils'
import {
  INVENTORY_ITEM_TYPES,
  INVENTORY_ITEM_TYPE_COLORS,
  INVENTORY_UNITS,
  INVENTORY_TX_TYPES,
  INVENTORY_TX_TYPE_COLORS,
  INVENTORY_TX_STATUS,
  INVENTORY_TX_STATUS_COLORS,
  type InventoryItemType,
  type InventoryUnit,
  type InventoryTxType,
  type InventoryTxStatus,
} from '@/lib/constants'
import { deleteInventoryItem, processTransaction } from '@/actions/logistics'
import { MemberTxDialog, DirectAdjustDialog } from '@/components/logistique/transaction-dialog'
import type { InventoryItem, InventoryStock, InventoryTransactionWithProfile } from '@/types'

interface ItemDetailProps {
  item:          InventoryItem
  stock:         InventoryStock | null
  transactions:  InventoryTransactionWithProfile[]
  operations:    { id: string; title: string }[]
  currentUserId: string
  canManage:     boolean
  canDelete:     boolean
}

export function ItemDetail({
  item,
  stock,
  transactions,
  operations,
  currentUserId,
  canManage,
  canDelete,
}: ItemDetailProps) {
  const router = useRouter()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [isPending, start] = useTransition()
  const [processError, setProcessError] = useState<string | null>(null)
  const [showHistory, setShowHistory] = useState(true)

  const type      = item.type as InventoryItemType
  const unit      = item.unit as InventoryUnit
  const qty       = stock?.quantity ?? 0
  const reserved  = stock?.reserved_quantity ?? 0
  const available = Math.max(0, qty - reserved)

  const pending   = transactions.filter((t) => t.status === 'pending')
  const history   = transactions.filter((t) => t.status !== 'pending')

  const [deleteError, setDeleteError] = useState<string | null>(null)

  function handleDelete() {
    setDeleteError(null)
    start(async () => {
      const result = await deleteInventoryItem(item.id)
      if (result.success) router.push('/logistique')
      else setDeleteError(result.error)
    })
  }

  function handleProcess(txId: string, approve: boolean) {
    setProcessError(null)
    start(async () => {
      const result = await processTransaction(txId, item.id, approve)
      if (!result.success) { setProcessError(result.error); return }
      router.refresh()
    })
  }

  function formatQty(n: number) {
    if (unit === 'uec') return new Intl.NumberFormat('fr-FR').format(n) + ' UEC'
    return `${n.toLocaleString('fr-FR')} ${INVENTORY_UNITS[unit]}`
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
        <div className="flex items-start gap-3 flex-wrap">
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 ${INVENTORY_ITEM_TYPE_COLORS[type]}`}>
            <Package className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold">{item.name}</h1>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge variant="outline" className={INVENTORY_ITEM_TYPE_COLORS[type]}>
                {INVENTORY_ITEM_TYPES[type]}
              </Badge>
              <Badge variant="outline" className="text-muted-foreground">
                {INVENTORY_UNITS[unit]}
              </Badge>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 shrink-0">
            <MemberTxDialog itemId={item.id} itemName={item.name} defaultType="deposit">
              <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs text-green-400 border-green-400/30 hover:bg-green-400/10">
                <ArrowDownCircle className="h-3.5 w-3.5" />
                Déposer
              </Button>
            </MemberTxDialog>

            <MemberTxDialog itemId={item.id} itemName={item.name} defaultType="withdrawal">
              <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs text-red-400 border-red-400/30 hover:bg-red-400/10">
                <ArrowUpCircle className="h-3.5 w-3.5" />
                Retirer
              </Button>
            </MemberTxDialog>

            {canManage && (
              <>
                <DirectAdjustDialog itemId={item.id} itemName={item.name} operations={operations}>
                  <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs text-cyan-400 border-cyan-400/30 hover:bg-cyan-400/10">
                    <Settings2 className="h-3.5 w-3.5" />
                    Ajustement direct
                  </Button>
                </DirectAdjustDialog>

                <Button asChild size="sm" variant="outline" className="h-8 gap-1.5 text-xs">
                  <Link href={`/logistique/${item.id}/edit`}>
                    <Edit className="h-3.5 w-3.5" />
                    Modifier
                  </Link>
                </Button>
              </>
            )}

            {canDelete && (
              <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs text-destructive border-destructive/30 hover:bg-destructive/10">
                    <Trash2 className="h-3.5 w-3.5" />
                    Supprimer
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Supprimer cet item ?</DialogTitle>
                    <DialogDescription>
                      &laquo; {item.name} &raquo; et tout son historique seront supprimés définitivement.
                    </DialogDescription>
                  </DialogHeader>
                  {deleteError && (
                    <div className="rounded-md bg-destructive/10 border border-destructive/30 px-3 py-2 mx-6">
                      <p className="text-xs text-destructive">{deleteError}</p>
                    </div>
                  )}
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setDeleteOpen(false)}>Annuler</Button>
                    <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
                      {isPending ? 'Suppression…' : 'Supprimer'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {item.description && (
          <p className="text-sm text-muted-foreground max-w-2xl">{item.description}</p>
        )}
      </motion.div>

      {/* Stock boxes */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-3 gap-4"
      >
        <div className="rounded-lg border border-border bg-card p-4 text-center space-y-1">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Total</p>
          <p className="text-2xl font-bold text-foreground">{qty.toLocaleString('fr-FR')}</p>
          <p className="text-[10px] text-muted-foreground">{INVENTORY_UNITS[unit]}</p>
        </div>
        <div className="rounded-lg border border-amber-400/20 bg-amber-400/5 p-4 text-center space-y-1">
          <p className="text-[11px] font-semibold text-amber-400/80 uppercase tracking-wide">Réservé</p>
          <p className="text-2xl font-bold text-amber-400">{reserved.toLocaleString('fr-FR')}</p>
          <p className="text-[10px] text-amber-400/60">{INVENTORY_UNITS[unit]}</p>
        </div>
        <div className={`rounded-lg border p-4 text-center space-y-1 ${
          available > 0
            ? 'border-green-400/20 bg-green-400/5'
            : 'border-border bg-card'
        }`}>
          <p className={`text-[11px] font-semibold uppercase tracking-wide ${available > 0 ? 'text-green-400/80' : 'text-muted-foreground'}`}>
            Disponible
          </p>
          <p className={`text-2xl font-bold ${available > 0 ? 'text-green-400' : 'text-muted-foreground'}`}>
            {available.toLocaleString('fr-FR')}
          </p>
          <p className={`text-[10px] ${available > 0 ? 'text-green-400/60' : 'text-muted-foreground/50'}`}>
            {INVENTORY_UNITS[unit]}
          </p>
        </div>
      </motion.div>

      <Separator />

      {/* Demandes en attente — visible Gardien+ */}
      {canManage && pending.length > 0 && (
        <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-4 w-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wide">
              En attente d&apos;approbation ({pending.length})
            </h3>
          </div>

          {processError && (
            <p className="mb-3 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {processError}
            </p>
          )}

          <div className="space-y-2">
            {pending.map((tx) => (
              <TxRow
                key={tx.id}
                tx={tx}
                unit={unit}
                showActions={true}
                onApprove={() => handleProcess(tx.id, true)}
                onReject={() => handleProcess(tx.id, false)}
                isPending={isPending}
              />
            ))}
          </div>
        </motion.section>
      )}

      {/* Historique */}
      <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.12 }}>
        <button
          onClick={() => setShowHistory((v) => !v)}
          className="flex w-full items-center justify-between gap-2 mb-3 group"
          aria-expanded={showHistory}
        >
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide group-hover:text-foreground transition-colors">
            Historique ({history.length})
          </h3>
          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${showHistory ? '' : '-rotate-90'}`} />
        </button>

        {showHistory && (
          history.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">Aucune transaction.</p>
          ) : (
            <div className="space-y-2">
              {history.map((tx) => (
                <TxRow
                  key={tx.id}
                  tx={tx}
                  unit={unit}
                  showActions={false}
                  currentUserId={currentUserId}
                />
              ))}
            </div>
          )
        )}
      </motion.section>
    </div>
  )
}

// ─── Ligne transaction ────────────────────────────────────────────────────────

interface TxRowProps {
  tx:            InventoryTransactionWithProfile
  unit:          InventoryUnit
  showActions:   boolean
  currentUserId?: string
  onApprove?:    () => void
  onReject?:     () => void
  isPending?:    boolean
}

function TxRow({ tx, unit, showActions, onApprove, onReject, isPending }: TxRowProps) {
  const txType   = tx.type   as InventoryTxType
  const txStatus = tx.status as InventoryTxStatus
  const sign     = txType === 'deposit' || txType === 'reservation' ? '+' : '−'
  const qtyStr   = unit === 'uec'
    ? `${sign}${new Intl.NumberFormat('fr-FR').format(tx.quantity)} UEC`
    : `${sign}${tx.quantity.toLocaleString('fr-FR')} ${INVENTORY_UNITS[unit]}`

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card/50 px-4 py-3">
      <Avatar className="h-7 w-7 shrink-0 border border-border">
        <AvatarImage src={tx.member.avatar_url ?? undefined} />
        <AvatarFallback className="bg-primary/10 text-primary text-[10px]">
          {(tx.member.display_name ?? tx.member.username).slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className="text-sm font-medium truncate">
            {tx.member.display_name ?? tx.member.username}
          </span>
          <Badge variant="outline" className={`text-[9px] px-1 py-0 ${INVENTORY_TX_TYPE_COLORS[txType]}`}>
            {INVENTORY_TX_TYPES[txType]}
          </Badge>
          <Badge variant="outline" className={`text-[9px] px-1 py-0 ${INVENTORY_TX_STATUS_COLORS[txStatus]}`}>
            {INVENTORY_TX_STATUS[txStatus]}
          </Badge>
        </div>
        {tx.notes && <p className="text-xs text-muted-foreground mt-0.5 truncate">{tx.notes}</p>}
        <p className="text-[10px] text-muted-foreground/60 mt-0.5">{formatDateTime(tx.created_at)}</p>
      </div>

      <div className="shrink-0 text-right">
        <span className={`text-sm font-bold tabular-nums ${
          txType === 'deposit'     ? 'text-green-400' :
          txType === 'withdrawal'  ? 'text-red-400'   :
          txType === 'reservation' ? 'text-amber-400' :
                                     'text-blue-400'
        }`}>
          {qtyStr}
        </span>
      </div>

      {showActions && (
        <div className="flex gap-1.5 shrink-0">
          <Button
            size="sm"
            className="h-7 w-7 p-0 bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20"
            variant="outline"
            onClick={onApprove}
            disabled={isPending}
            aria-label="Approuver"
          >
            <Check className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="sm"
            className="h-7 w-7 p-0 bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20"
            variant="outline"
            onClick={onReject}
            disabled={isPending}
            aria-label="Refuser"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  )
}
