'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { CalendarDays, ChevronRight, MapPin, Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { formatDateTime } from '@/lib/utils'
import { EVENT_TYPES, EVENT_TYPE_COLORS, type EventType } from '@/lib/constants'
import type { EventWithDetails } from '@/types'

interface RecentEventsProps {
  events: EventWithDetails[]
}

export function RecentEvents({ events }: RecentEventsProps) {
  if (events.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <h3 className="text-sm font-semibold text-foreground mb-4">Prochains événements</h3>
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <CalendarDays className="h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">Aucun événement planifié</p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground">Prochains événements</h3>
        <Link
          href="/evenements"
          className="text-xs text-primary hover:text-primary/80 flex items-center gap-0.5 transition-colors"
        >
          Voir tout
          <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="divide-y divide-border">
        {events.map((event, i) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Link
              href={`/evenements`}
              className="flex items-start gap-3 px-5 py-3.5 hover:bg-accent/50 transition-colors group"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                    {event.title}
                  </p>
                  <Badge
                    variant="outline"
                    className={`text-[10px] px-1.5 py-0 shrink-0 ${EVENT_TYPE_COLORS[event.type as EventType]}`}
                  >
                    {EVENT_TYPES[event.type as EventType]}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <CalendarDays className="h-3 w-3" />
                    {formatDateTime(event.start_at)}
                  </span>
                  {event.location && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate max-w-[120px]">{event.location}</span>
                    </span>
                  )}
                  {event.attendee_count !== undefined && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {event.attendee_count}
                      {event.max_attendees ? `/${event.max_attendees}` : ''}
                    </span>
                  )}
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
