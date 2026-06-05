'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { InventoryItemForm } from '@/components/logistique/inventory-item-form'
import { updateInventoryItem } from '@/actions/logistics'
import type { InventoryItem, InventoryItemInput } from '@/types'

interface EditItemClientProps {
  item: InventoryItem
}

export function EditItemClient({ item }: EditItemClientProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isPending, start] = useTransition()

  function handleSubmit(data: InventoryItemInput) {
    setError(null)
    start(async () => {
      const result = await updateInventoryItem(item.id, data)
      if (!result.success) { setError(result.error); return }
      router.push(`/logistique/${item.id}`)
    })
  }

  return (
    <div className="space-y-4">
      {error && (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}
      <InventoryItemForm
        initialData={{
          name:        item.name,
          type:        item.type,
          unit:        item.unit,
          description: item.description ?? '',
        }}
        onSubmit={handleSubmit}
        isPending={isPending}
        onCancel={() => router.push(`/logistique/${item.id}`)}
      />
    </div>
  )
}
