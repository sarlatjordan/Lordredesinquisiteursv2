'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Package, TrendingDown } from 'lucide-react'
import {
  INVENTORY_ITEM_TYPES,
  INVENTORY_ITEM_TYPE_COLORS,
  INVENTORY_UNITS,
  type InventoryItemType,
  type InventoryUnit,
} from '@/lib/constants'
import type { InventoryItemWithStock } from '@/types'

interface InventoryItemCardProps {
  item: InventoryItemWithStock
  index?: number
}

function formatQty(qty: number, unit: InventoryUnit): string {
  if (unit === 'uec') return new Intl.NumberFormat('fr-FR').format(qty) + ' UEC'
  return `${qty} ${INVENTORY_UNITS[unit]}`
}

export function InventoryItemCard({ item, index = 0 }: InventoryItemCardProps) {
  const type     = item.type as InventoryItemType
  const unit     = item.unit as InventoryUnit
  const stock    = item.stock
  const qty      = stock?.quantity ?? 0
  const reserved = stock?.reserved_quantity ?? 0
  const available = Math.max(0, qty - reserved)
  const isLow    = qty > 0 && available === 0

  return (
    <Link href={`/logistique/${item.id}`}>
      <motion.article
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.04 }}
        className="rounded-lg border border-border bg-card p-4 hover:border-primary/30 transition-colors group cursor-pointer h-full space-y-3"
      >
        <div className={`-mx-4 -mt-4 mb-0 h-0.5 rounded-t-lg ${INVENTORY_ITEM_TYPE_COLORS[type].split(' ')[2]}`} />

        <div className="flex items-start gap-3 pt-2">
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${INVENTORY_ITEM_TYPE_COLORS[type]}`}>
            <Package className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
              {item.name}
            </h3>
            {item.description && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{item.description}</p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${INVENTORY_ITEM_TYPE_COLORS[type]}`}>
            {INVENTORY_ITEM_TYPES[type]}
          </Badge>
          {isLow && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-destructive border-destructive/30 bg-destructive/10">
              <TrendingDown className="h-2.5 w-2.5 mr-0.5" />
              Épuisé
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2 border-t border-border pt-2">
          <div className="text-center">
            <p className="text-[10px] text-muted-foreground/70 uppercase tracking-wide">Total</p>
            <p className="text-sm font-bold text-foreground">{qty.toLocaleString('fr-FR')}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-muted-foreground/70 uppercase tracking-wide">Réservé</p>
            <p className="text-sm font-bold text-amber-400">{reserved.toLocaleString('fr-FR')}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-muted-foreground/70 uppercase tracking-wide">Dispo</p>
            <p className={`text-sm font-bold ${available > 0 ? 'text-green-400' : 'text-muted-foreground'}`}>
              {formatQty(available, unit)}
            </p>
          </div>
        </div>
      </motion.article>
    </Link>
  )
}
