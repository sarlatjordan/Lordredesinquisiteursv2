'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { ExternalLink, Building2, User } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import {
  PARTNERSHIP_TYPES, PARTNERSHIP_RELATIONS, PARTNERSHIP_RELATION_COLORS,
  PARTNERSHIP_STATUS, PARTNERSHIP_STATUS_COLORS,
  type PartnershipRelation, type PartnershipStatus, type PartnershipType,
} from '@/lib/constants'
import type { Partnership } from '@/types'

interface PartnershipCardProps {
  partnership: Partnership
  index?: number
}

export function PartnershipCard({ partnership: p, index = 0 }: PartnershipCardProps) {
  const relation = p.relationship as PartnershipRelation
  const status   = p.status      as PartnershipStatus
  const type     = p.type        as PartnershipType
  const TypeIcon = type === 'org' ? Building2 : User

  return (
    <Link href={`/partenariats/${p.id}`}>
      <motion.article
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        className="rounded-lg border border-border bg-card p-4 hover:border-primary/30 transition-colors group cursor-pointer h-full space-y-3"
        aria-label={p.name}
      >
        {/* Bande couleur relation */}
        <div className={`-mx-4 -mt-4 mb-0 h-0.5 rounded-t-lg ${PARTNERSHIP_RELATION_COLORS[relation].split(' ')[2]}`} />

        <div className="flex items-start gap-3 pt-2">
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${PARTNERSHIP_RELATION_COLORS[relation]}`}>
            <TypeIcon className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
              {p.name}
            </h3>
            {p.contact_handle && (
              <p className="text-xs text-muted-foreground mt-0.5">@{p.contact_handle}</p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${PARTNERSHIP_RELATION_COLORS[relation]}`}>
            {PARTNERSHIP_RELATIONS[relation]}
          </Badge>
          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${PARTNERSHIP_STATUS_COLORS[status]}`}>
            {PARTNERSHIP_STATUS[status]}
          </Badge>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-muted-foreground">
            {PARTNERSHIP_TYPES[type]}
          </Badge>
        </div>

        {p.terms && (
          <p className="text-xs text-muted-foreground line-clamp-2 border-t border-border pt-2">
            {p.terms}
          </p>
        )}

        <p className="text-[10px] text-muted-foreground/50">
          Ajouté le {formatDate(p.created_at)}
        </p>
      </motion.article>
    </Link>
  )
}
