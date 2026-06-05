'use client'

import { motion } from 'framer-motion'
import { CalendarDays, MapPin, Users, Clock, CheckCircle2, HelpCircle, Settings2, CalendarPlus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDateTime, formatRelativeTime } from '@/lib/utils'
import { EVENT_TYPES, EVENT_TYPE_COLORS, EVENT_STATUS, type EventType, type EventStatus } from '@/lib/constants'
import { Lock } from 'lucide-react'
import type { EventWithDetails } from '@/types'

interface EventCardProps {
  event: EventWithDetails
  currentUserId?: string
  isOrganizer?: boolean
  onRegister?: (eventId: string, status: 'confirme' | 'peut_etre') => void
  onUnregister?: (eventId: string) => void
  onManage?: (event: EventWithDetails) => void
  onView?: (event: EventWithDetails) => void
  index?: number
}

export function EventCard({
  event,
  currentUserId,
  isOrganizer = false,
  onRegister,
  onUnregister,
  onManage,
  onView,
  index = 0,
}: EventCardProps) {
  const isAttending = event.attendees?.some(
    (a) => a.profile_id === currentUserId && a.status === 'confirme'
  )
  const isMaybeAttending = event.attendees?.some(
    (a) => a.profile_id === currentUserId && a.status === 'peut_etre'
  )
  const isPast = event.status === 'termine' || event.status === 'annule'
  const isCancelled = event.status === 'annule'

  const statusColor: Record<EventStatus, string> = {
    planifie: 'text-blue-400 bg-blue-400/10 border-blue-400/30',
    en_cours: 'text-green-400 bg-green-400/10 border-green-400/30',
    termine:  'text-muted-foreground bg-muted/50 border-border',
    annule:   'text-destructive bg-destructive/10 border-destructive/30',
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`rounded-lg border border-border bg-card overflow-hidden transition-colors group ${onView ? 'cursor-pointer hover:border-primary/40' : 'hover:border-primary/20'}`}
      aria-label={`Événement : ${event.title}`}
      onClick={() => onView?.(event)}
    >
      <div className={`h-0.5 w-full ${EVENT_TYPE_COLORS[event.type as EventType]?.split(' ')[2] ?? ''}`} />

      <div className="p-4 space-y-3">
        <div className="flex items-start gap-2 flex-wrap">
          <Badge
            variant="outline"
            className={`text-[10px] px-1.5 py-0 ${EVENT_TYPE_COLORS[event.type as EventType]}`}
          >
            {EVENT_TYPES[event.type as EventType]}
          </Badge>
          <Badge
            variant="outline"
            className={`text-[10px] px-1.5 py-0 ${statusColor[event.status as EventStatus]}`}
          >
            {EVENT_STATUS[event.status as EventStatus]}
          </Badge>
          {event.min_privilege > 0 && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-muted-foreground border-border">
              <Lock className="h-2.5 w-2.5" />
            </Badge>
          )}
          {isOrganizer && onManage && (
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 ml-auto text-muted-foreground hover:text-foreground"
              onClick={(e) => { e.stopPropagation(); onManage(event) }}
              title="Gérer l'événement"
            >
              <Settings2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        <div>
          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
            {event.title}
          </h3>
          {event.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{event.description}</p>
          )}
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <CalendarDays className="h-3 w-3 shrink-0" />
            {formatDateTime(event.start_at)}
          </span>
          {event.location && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate max-w-[160px]">{event.location}</span>
            </span>
          )}
          {event.attendee_count !== undefined && (
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3 shrink-0" />
              {event.attendee_count}
              {event.max_attendees ? `/${event.max_attendees}` : ''} participant{event.attendee_count !== 1 ? 's' : ''}
            </span>
          )}
          {!isPast && !isCancelled && (
            <span className="flex items-center gap-1 text-primary">
              <Clock className="h-3 w-3 shrink-0" />
              {formatRelativeTime(event.start_at)}
            </span>
          )}
        </div>

        {event.report && isPast && (
          <p className="text-xs text-muted-foreground border-t border-border pt-2 line-clamp-2 italic">
            {event.report}
          </p>
        )}

        {!isPast && !isCancelled && currentUserId && onRegister && onUnregister && (
          <div className="flex gap-2 pt-1">
            {isAttending ? (
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs text-green-400 border-green-400/30 hover:bg-green-400/10"
                onClick={(e) => { e.stopPropagation(); onUnregister(event.id) }}
              >
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Inscrit — Se désinscrire
              </Button>
            ) : isMaybeAttending ? (
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs text-amber-400 border-amber-400/30 hover:bg-amber-400/10"
                onClick={(e) => { e.stopPropagation(); onUnregister(event.id) }}
              >
                <HelpCircle className="h-3 w-3 mr-1" />
                Peut-être — Se désinscrire
              </Button>
            ) : (
              <>
                <Button size="sm" className="h-7 text-xs" onClick={(e) => { e.stopPropagation(); onRegister(event.id, 'confirme') }}>
                  Participer
                </Button>
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={(e) => { e.stopPropagation(); onRegister(event.id, 'peut_etre') }}>
                  Peut-être
                </Button>
              </>
            )}
          </div>
        )}

        {!isPast && !isCancelled && (
          <a
            href={`/api/evenements/${event.id}/ics`}
            download
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary transition-colors"
          >
            <CalendarPlus className="h-3 w-3" />
            Ajouter au calendrier
          </a>
        )}
      </div>
    </motion.article>
  )
}
