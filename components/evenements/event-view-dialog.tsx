'use client'

import { CalendarDays, MapPin, Users, Clock, FileText, CalendarPlus, Lock, ExternalLink } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { formatDateTime, formatRelativeTime, buildGoogleCalendarUrl } from '@/lib/utils'
import { EVENT_TYPES, EVENT_TYPE_COLORS, EVENT_STATUS, type EventType, type EventStatus } from '@/lib/constants'
import { MarkdownContent } from '@/components/ui/markdown-content'
import type { EventWithDetails } from '@/types'

interface EventViewDialogProps {
  event: EventWithDetails | null
  open: boolean
  onClose: () => void
}

export function EventViewDialog({ event, open, onClose }: EventViewDialogProps) {
  if (!event) return null

  const isPast = event.status === 'completed' || event.status === 'cancelled'
  const isCancelled = event.status === 'cancelled'

  const statusColor: Record<EventStatus, string> = {
    planned:   'text-blue-400 bg-blue-400/10 border-blue-400/30',
    active:    'text-green-400 bg-green-400/10 border-green-400/30',
    completed: 'text-muted-foreground bg-muted/50 border-border',
    cancelled: 'text-destructive bg-destructive/10 border-destructive/30',
  }

  const confirmedCount = event.attendees?.filter((a) => a.status === 'confirme').length ?? event.attendee_count ?? 0
  const maybeCount = event.attendees?.filter((a) => a.status === 'peut_etre').length ?? 0

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="pr-6">{event.title}</DialogTitle>
          <DialogDescription>
            {EVENT_TYPES[event.type as EventType]} · {EVENT_STATUS[event.status as EventStatus]}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className={`text-xs ${EVENT_TYPE_COLORS[event.type as EventType]}`}>
              {EVENT_TYPES[event.type as EventType]}
            </Badge>
            <Badge variant="outline" className={`text-xs ${statusColor[event.status as EventStatus]}`}>
              {EVENT_STATUS[event.status as EventStatus]}
            </Badge>
            {event.min_privilege > 0 && (
              <Badge variant="outline" className="text-xs text-muted-foreground border-border gap-1">
                <Lock className="h-3 w-3" />
                Accès restreint
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-1 gap-2 text-sm">
            <div className="flex items-start gap-2 text-muted-foreground">
              <CalendarDays className="h-4 w-4 shrink-0 mt-0.5 text-primary/70" />
              <span>
                {formatDateTime(event.start_at)}
                {event.end_at && (
                  <span className="block text-muted-foreground/70 text-xs mt-0.5">
                    jusqu&apos;au {formatDateTime(event.end_at)}
                  </span>
                )}
              </span>
            </div>
            {event.location && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4 shrink-0 text-primary/70" />
                <span>{event.location}</span>
              </div>
            )}
            {(event.attendee_count !== undefined || event.attendees) && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-4 w-4 shrink-0 text-primary/70" />
                <span>
                  {confirmedCount} confirmé{confirmedCount !== 1 ? 's' : ''}
                  {maybeCount > 0 && ` · ${maybeCount} peut-être`}
                  {event.max_attendees ? ` / ${event.max_attendees} max` : ''}
                </span>
              </div>
            )}
            {!isPast && !isCancelled && (
              <div className="flex items-center gap-2 text-primary">
                <Clock className="h-4 w-4 shrink-0" />
                <span className="font-medium">{formatRelativeTime(event.start_at)}</span>
              </div>
            )}
          </div>

          {event.description && (
            <div className="border-t border-border pt-4">
              <div className="text-sm text-foreground/90 leading-relaxed"><MarkdownContent>{event.description}</MarkdownContent></div>
            </div>
          )}

          {event.creator && (
            <p className="text-xs text-muted-foreground">
              Organisé par{' '}
              <span className="text-foreground/80 font-medium">
                {event.creator.display_name ?? event.creator.username}
              </span>
            </p>
          )}

          {event.report && isPast && (
            <div className="border-t border-border pt-4 space-y-1.5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5" />
                Rapport
              </p>
              <div className="text-sm text-muted-foreground leading-relaxed italic"><MarkdownContent>{event.report}</MarkdownContent></div>
            </div>
          )}

          {!isPast && !isCancelled && (
            <div className="border-t border-border pt-4 flex flex-wrap gap-2">
              <a
                href={buildGoogleCalendarUrl(event)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary border border-border rounded-md px-2.5 py-1.5 transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Ajouter à Google Agenda
              </a>
              <a
                href={`/api/evenements/${event.id}/ics`}
                download
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-border rounded-md px-2.5 py-1.5 transition-colors"
              >
                <CalendarPlus className="h-3.5 w-3.5" />
                Télécharger .ics
              </a>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
