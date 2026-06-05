'use client'

import { useState, useTransition } from 'react'
import { Loader2, Plus, Trash2, CheckCircle2, Clock, XCircle, PackageCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { INVENTORY_UNITS, type InventoryUnit } from '@/lib/constants'
import { addOperationResource, removeOperationResource } from '@/actions/operations'
import type { OpResource, InventoryItemWithStock } from '@/types'

interface OpResourcesPanelProps {
  operationId: string
  resources: OpResource[]
  inventoryItems: InventoryItemWithStock[]
  onUpdate: () => void
}

const STATUS_CONFIG = {
  reserved:        { label: 'Réservé',   icon: CheckCircle2, class: 'text-green-400 bg-green-400/10 border-green-400/30' },
  pending_request: { label: 'En attente', icon: Clock,        class: 'text-amber-400 bg-amber-400/10 border-amber-400/30' },
  released:        { label: 'Libéré',    icon: XCircle,      class: 'text-muted-foreground bg-muted/50 border-border' },
  utilized:        { label: 'Utilisé',   icon: PackageCheck, class: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/30' },
} as const

export function OpResourcesPanel({ operationId, resources, inventoryItems, onUpdate }: OpResourcesPanelProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [selectedItemId, setSelectedItemId] = useState('')
  const [itemName, setItemName] = useState('')
  const [quantity, setQuantity] = useState('')
  const [unit, setUnit] = useState<string>('unit')
  const [notes, setNotes] = useState('')

  function handleSelectItem(value: string) {
    const itemId = value === '__none__' ? '' : value
    setSelectedItemId(itemId)
    if (itemId) {
      const found = inventoryItems.find((i) => i.id === itemId)
      if (found) {
        setItemName(found.name)
        setUnit(found.unit)
      }
    } else {
      setItemName('')
    }
  }

  function handleAdd() {
    const qty = parseInt(quantity, 10)
    if (!itemName.trim()) { setError('Nom de ressource requis'); return }
    if (!qty || qty <= 0) { setError('Quantité invalide'); return }
    setError(null)

    startTransition(async () => {
      const result = await addOperationResource(operationId, {
        item_id: selectedItemId || null,
        item_name: itemName,
        quantity: qty,
        unit,
        notes,
      })
      if (result.success) {
        setSelectedItemId('')
        setItemName('')
        setQuantity('')
        setUnit('unit')
        setNotes('')
        onUpdate()
      } else {
        setError(result.error)
      }
    })
  }

  function handleRemove(resourceId: string) {
    setError(null)
    startTransition(async () => {
      const result = await removeOperationResource(resourceId, operationId)
      if (result.success) onUpdate()
      else setError(result.error)
    })
  }

  const availableToAdd = inventoryItems.filter(
    (i) => !resources.some((r) => r.item_id === i.id && r.status !== 'released')
  )

  return (
    <div className="space-y-3">
      {resources.length === 0 ? (
        <p className="text-xs text-muted-foreground">Aucune ressource requise.</p>
      ) : (
        <ul className="space-y-2">
          {resources.map((res) => {
            const cfg = STATUS_CONFIG[res.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.pending_request
            const StatusIcon = cfg.icon
            return (
              <li key={res.id} className="flex items-center justify-between gap-2 rounded-md border border-border bg-card/50 px-3 py-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm font-medium text-foreground truncate">{res.item_name}</span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {res.quantity} {INVENTORY_UNITS[res.unit as InventoryUnit] ?? res.unit}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="outline" className={`text-[10px] px-1.5 py-0 gap-1 ${cfg.class}`}>
                    <StatusIcon className="h-2.5 w-2.5" />
                    {cfg.label}
                  </Badge>
                  {res.status !== 'released' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      aria-label="Retirer la ressource"
                      disabled={isPending}
                      onClick={() => handleRemove(res.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {/* Formulaire d'ajout */}
      <div className="border-t border-border pt-3 space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Ajouter une ressource
        </p>

        <div className="space-y-2">
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Depuis l&apos;inventaire</Label>
              <Select value={selectedItemId || '__none__'} onValueChange={handleSelectItem}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Sélectionner un item…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={'__none__'}>— Aucun (demande libre) —</SelectItem>
                  {availableToAdd.map((item) => {
                    const available = item.stock ? item.stock.quantity - item.stock.reserved_quantity : 0
                    return (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name}
                        <span className="text-muted-foreground ml-1 text-xs">({available} dispo.)</span>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Qté *</Label>
              <Input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="h-8 text-xs w-20"
                placeholder="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Nom de la ressource *</Label>
              <Input
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="Ex: Laranite, Quantainium…"
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Unité</Label>
              <Select value={unit} onValueChange={setUnit}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(INVENTORY_UNITS) as [InventoryUnit, string][]).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Notes (facultatif)</Label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Usage, priorité…"
              className="h-8 text-xs"
            />
          </div>
        </div>

        {error && (
          <div className="rounded-md bg-destructive/10 border border-destructive/30 px-3 py-2">
            <p className="text-xs text-destructive">{error}</p>
          </div>
        )}

        <Button size="sm" className="gap-1.5 w-full" onClick={handleAdd} disabled={isPending}>
          {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
          {selectedItemId ? 'Réserver depuis l\'inventaire' : 'Créer une demande de ressource'}
        </Button>
      </div>
    </div>
  )
}
