'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AlertTriangle, CheckCircle2, X, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { INVENTORY_UNITS, type InventoryUnit } from '@/lib/constants'
import { fulfillPendingResource, rejectPendingResource } from '@/actions/operations'
import type { OpResourceWithOp } from '@/types'

interface PendingResourcesProps {
  resources: OpResourceWithOp[]
}

export function PendingResources({ resources: initial }: PendingResourcesProps) {
  const router = useRouter()
  const [resources, setResources] = useState(initial)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isPending, startTransition] = useTransition()

  if (resources.length === 0) return null

  function handleFulfill(id: string) {
    setErrors((e) => ({ ...e, [id]: '' }))
    startTransition(async () => {
      const result = await fulfillPendingResource(id)
      if (result.success) {
        setResources((prev) => prev.filter((r) => r.id !== id))
        router.refresh()
      } else {
        setErrors((e) => ({ ...e, [id]: result.error }))
      }
    })
  }

  function handleReject(id: string) {
    setErrors((e) => ({ ...e, [id]: '' }))
    startTransition(async () => {
      const result = await rejectPendingResource(id)
      if (result.success) {
        setResources((prev) => prev.filter((r) => r.id !== id))
        router.refresh()
      } else {
        setErrors((e) => ({ ...e, [id]: result.error }))
      }
    })
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-amber-400" />
        <h3 className="text-sm font-semibold text-foreground">
          Demandes de ressources en attente ({resources.length})
        </h3>
      </div>
      <div className="rounded-lg border border-amber-400/20 bg-amber-400/5 divide-y divide-border overflow-hidden">
        {resources.map((res) => (
          <div key={res.id} className="px-4 py-3 space-y-2">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">{res.item_name}</p>
                <p className="text-xs text-muted-foreground">
                  {res.quantity} {INVENTORY_UNITS[res.unit as InventoryUnit] ?? res.unit}
                  {res.notes && <span className="ml-2 italic">— {res.notes}</span>}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                {res.operation && (
                  <Link href={`/operations/${res.operation.id}`}>
                    <Badge variant="outline" className="text-[10px] text-muted-foreground hover:text-foreground cursor-pointer">
                      {res.operation.title}
                    </Badge>
                  </Link>
                )}
                {res.item_id && (
                  <Link href={`/logistique/${res.item_id}`}>
                    <Button variant="outline" size="sm" className="h-7 text-xs">
                      Voir le stock
                    </Button>
                  </Link>
                )}
                <Button
                  size="sm"
                  className="h-7 text-xs gap-1 bg-green-400/10 text-green-400 border border-green-400/30 hover:bg-green-400/20"
                  variant="outline"
                  disabled={isPending}
                  onClick={() => handleFulfill(res.id)}
                >
                  {isPending
                    ? <Loader2 className="h-3 w-3 animate-spin" />
                    : <CheckCircle2 className="h-3 w-3" />
                  }
                  {res.item_id ? 'Approuver' : 'Marquer traité'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs gap-1 text-destructive border-destructive/30 hover:bg-destructive/10"
                  disabled={isPending}
                  onClick={() => handleReject(res.id)}
                >
                  <X className="h-3 w-3" />
                  Rejeter
                </Button>
              </div>
            </div>
            {errors[res.id] && (
              <p className="text-xs text-destructive">{errors[res.id]}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
