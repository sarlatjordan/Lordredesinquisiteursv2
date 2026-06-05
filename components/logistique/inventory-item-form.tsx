'use client'

import { useState } from 'react'
import { Button }   from '@/components/ui/button'
import { Input }    from '@/components/ui/input'
import { Label }    from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  INVENTORY_ITEM_TYPES,
  INVENTORY_UNITS,
  type InventoryItemType,
  type InventoryUnit,
} from '@/lib/constants'
import type { InventoryItemInput } from '@/types'

interface InventoryItemFormProps {
  initialData?: Partial<InventoryItemInput>
  onSubmit: (data: InventoryItemInput) => void
  isPending: boolean
  onCancel: () => void
}

export function InventoryItemForm({
  initialData,
  onSubmit,
  isPending,
  onCancel,
}: InventoryItemFormProps) {
  const [name,        setName]        = useState(initialData?.name ?? '')
  const [type,        setType]        = useState<InventoryItemType>((initialData?.type as InventoryItemType) ?? 'loot')
  const [unit,        setUnit]        = useState<InventoryUnit>((initialData?.unit as InventoryUnit) ?? 'unit')
  const [description, setDescription] = useState(initialData?.description ?? '')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit({ name, type, unit, description })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="inv-name">Nom *</Label>
        <Input
          id="inv-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Laranite, F7C Hornet Blueprint, UEC mission…"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Type *</Label>
          <Select value={type} onValueChange={(v) => setType(v as InventoryItemType)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {(Object.entries(INVENTORY_ITEM_TYPES) as [InventoryItemType, string][]).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Unité *</Label>
          <Select value={unit} onValueChange={(v) => setUnit(v as InventoryUnit)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {(Object.entries(INVENTORY_UNITS) as [InventoryUnit, string][]).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="inv-desc">Description</Label>
        <Textarea
          id="inv-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Où trouver cet item, à quoi il sert, remarques…"
          rows={3}
          className="resize-none"
        />
      </div>

      <div className="flex gap-3 pt-1">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1" disabled={isPending}>
          Annuler
        </Button>
        <Button type="submit" className="flex-1" disabled={isPending}>
          {isPending ? 'Enregistrement…' : 'Enregistrer'}
        </Button>
      </div>
    </form>
  )
}
