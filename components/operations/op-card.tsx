'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Clock, MapPin, Users, Shield } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { formatDateTime, formatRelativeTime } from '@/lib/utils'
import {
  OP_TYPES, OP_TYPE_COLORS, OP_STATUS, OP_STATUS_COLORS,
  OP_RISK, OP_RISK_COLORS,
  type OpType, type OpStatus, type OpRisk,
} from '@/lib/constants'
import type { OperationWithDetails } from '@/types'

interface OpCardProps {
  op: OperationWithDetails
  index?: number
}

export function OpCard({ op, index = 0 }: OpCardProps) {
  const isPast = op.status === 'termine' || op.status === 'annule'
  const opType = op.type as OpType
  const opStatus = op.status as OpStatus
  const opRisk = op.risk_level as OpRisk

  return (
    <Link href={`/operations/${op.id}`}>
      <motion.article
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        className="rounded-lg border border-border bg-card overflow-hidden hover:border-primary/30 transition-colors group cursor-pointer h-full"
        aria-label={`Opération : ${op.title}`}
      >
        <div className={`h-0.5 w-full ${OP_TYPE_COLORS[opType]?.split(' ')[2] ?? ''}`} />

        <div className="p-4 space-y-3">
          <div className="flex items-start gap-2 flex-wrap">
            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${OP_TYPE_COLORS[opType]}`}>
              {OP_TYPES[opType]}
            </Badge>
            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${OP_STATUS_COLORS[opStatus]}`}>
              {OP_STATUS[opStatus]}
            </Badge>
            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${OP_RISK_COLORS[opRisk]} ml-auto`}>
              <Shield className="h-2.5 w-2.5 mr-1" />
              {OP_RISK[opRisk]}
            </Badge>
          </div>

          <div>
            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
              {op.title}
            </h3>
            {op.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{op.description}</p>
            )}
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3 shrink-0" />
              {op.system_name}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3 shrink-0" />
              {formatDateTime(op.departure_at)}
            </span>
            {op.registration_count !== undefined && (
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3 shrink-0" />
                {op.registration_count} inscrit{op.registration_count !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {!isPast && (
            <p className="text-xs font-medium text-primary">
              {formatRelativeTime(op.departure_at)}
            </p>
          )}

          {op.commander && (
            <p className="text-[11px] text-muted-foreground border-t border-border pt-2">
              Cdt : {op.commander.display_name ?? op.commander.username}
            </p>
          )}
        </div>
      </motion.article>
    </Link>
  )
}
