'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { CalendarDays, MapPin, Clock, ArrowRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDateTime, formatRelativeTime } from '@/lib/utils'
import { EVENT_TYPES, EVENT_TYPE_COLORS, type EventType } from '@/lib/constants'
import type { Event } from '@/types'

interface EventsPreviewProps {
  events: Event[]
  isLoggedIn: boolean
}

export function EventsPreview({ events, isLoggedIn }: EventsPreviewProps) {
  if (events.length === 0) return null

  return (
    <section id="events" className="py-24 px-6 bg-card/30">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6 }}
          className="flex items-end justify-between mb-12 flex-wrap gap-4"
        >
          <div>
            <p className="text-xs font-semibold tracking-[0.25em] text-primary/70 uppercase mb-3">
              Activités à venir
            </p>
            <h2 className="text-3xl sm:text-4xl font-black text-foreground">
              Opérations & Événements
            </h2>
          </div>
          {isLoggedIn && (
            <Button asChild variant="outline" size="sm" className="gap-1.5">
              <Link href="/evenements">
                Voir tout
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          )}
        </motion.div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event, i) => (
            <motion.article
              key={event.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-30px' }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              className="rounded-xl border border-border bg-card overflow-hidden hover:border-primary/20 transition-colors"
            >
              <div className={`h-0.5 ${EVENT_TYPE_COLORS[event.type as EventType]?.split(' ')[2] ?? ''}`} />
              <div className="p-5 space-y-3">
                <Badge
                  variant="outline"
                  className={`text-[10px] px-1.5 py-0 ${EVENT_TYPE_COLORS[event.type as EventType]}`}
                >
                  {EVENT_TYPES[event.type as EventType]}
                </Badge>
                <h3 className="font-semibold text-foreground leading-snug">{event.title}</h3>
                {event.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{event.description}</p>
                )}
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <CalendarDays className="h-3 w-3" />
                    {formatDateTime(event.start_at)}
                  </span>
                  {event.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {event.location}
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-primary/70">
                    <Clock className="h-3 w-3" />
                    {formatRelativeTime(event.start_at)}
                  </span>
                </div>
              </div>
            </motion.article>
          ))}
        </div>

        {!isLoggedIn && (
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-8 text-center text-sm text-muted-foreground"
          >
            <Link href="/login" className="text-primary hover:underline">Connectez-vous</Link>
            {' '}pour voir tous les événements et vous inscrire.
          </motion.p>
        )}
      </div>
    </section>
  )
}
