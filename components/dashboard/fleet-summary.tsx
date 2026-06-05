'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ChevronRight, Rocket } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { SHIP_TYPES, SHIP_STATUS_COLORS, type ShipType, type ShipStatus } from '@/lib/constants'
import type { ShipWithOwner } from '@/types'

interface FleetSummaryProps {
  ships: ShipWithOwner[]
}

export function FleetSummary({ ships }: FleetSummaryProps) {
  // Grouper par type pour afficher un résumé
  const typeCount = ships.reduce<Record<string, number>>((acc, ship) => {
    acc[ship.ship_type] = (acc[ship.ship_type] ?? 0) + 1
    return acc
  }, {})

  if (ships.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <h3 className="text-sm font-semibold text-foreground mb-4">Flotte</h3>
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <Rocket className="h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">Aucun vaisseau enregistré</p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground">Flotte ({ships.length})</h3>
        <Link
          href="/flotte"
          className="text-xs text-primary hover:text-primary/80 flex items-center gap-0.5 transition-colors"
        >
          Voir tout
          <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Résumé par type */}
      <div className="px-5 py-3 border-b border-border">
        <div className="flex flex-wrap gap-2">
          {Object.entries(typeCount).map(([type, count]) => (
            <div
              key={type}
              className="flex items-center gap-1.5 text-xs text-muted-foreground"
            >
              <span className="font-medium text-foreground">{count}</span>
              <span>{SHIP_TYPES[type as ShipType] ?? type}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Liste des vaisseaux récents */}
      <div className="divide-y divide-border">
        {ships.slice(0, 5).map((ship, i) => (
          <motion.div
            key={ship.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-center gap-3 px-5 py-3 hover:bg-accent/50 transition-colors"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded bg-primary/10 border border-primary/20 shrink-0">
              <Rocket className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{ship.name}</p>
              <p className="text-xs text-muted-foreground truncate">
                {ship.model}
                {ship.manufacturer ? ` — ${ship.manufacturer}` : ''}
              </p>
            </div>
            <Badge
              variant="outline"
              className={`text-[10px] px-1.5 py-0 shrink-0 ${SHIP_STATUS_COLORS[ship.status as ShipStatus]}`}
            >
              {ship.status === 'disponible' ? 'Dispo' : ship.status === 'en_mission' ? 'Mission' : ship.status}
            </Badge>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
