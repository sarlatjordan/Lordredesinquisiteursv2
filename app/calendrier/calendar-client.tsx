'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, CalendarDays, MapPin, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { EVENT_TYPES, EVENT_TYPE_COLORS, type EventType } from '@/lib/constants'
import { formatDateTime, formatRelativeTime } from '@/lib/utils'
import type { Event } from '@/types'

const DAYS_SHORT  = ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di']
const MONTHS_FR   = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
                     'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']

interface CalendarClientProps {
  events: Event[]
  currentMonth: string // "YYYY-MM"
}

function parseYM(month: string): [number, number] {
  const [y, m] = month.split('-').map(Number)
  return [y, m - 1]
}

function buildCalendarCells(year: number, month: number): (number | null)[] {
  const firstDay  = new Date(year, month, 1)
  const lastDate  = new Date(year, month + 1, 0).getDate()
  const offset    = (firstDay.getDay() + 6) % 7 // 0 = lundi

  const cells: (number | null)[] = [
    ...Array<null>(offset).fill(null),
    ...Array.from({ length: lastDate }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

function navigateMonth(current: string, delta: number): string {
  const [y, m] = parseYM(current)
  const d = new Date(y, m + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function CalendarClient({ events, currentMonth }: CalendarClientProps) {
  const router = useRouter()
  const [year, monthIndex] = parseYM(currentMonth)

  const cells = buildCalendarCells(year, monthIndex)

  // Events groupés par jour du mois
  const byDay = events.reduce<Record<number, Event[]>>((acc, ev) => {
    const d = new Date(ev.start_at).getDate()
    ;(acc[d] ??= []).push(ev)
    return acc
  }, {})

  const today     = new Date()
  const isToday   = (d: number) =>
    today.getFullYear() === year && today.getMonth() === monthIndex && today.getDate() === d

  function go(delta: number) {
    router.push(`/calendrier?month=${navigateMonth(currentMonth, delta)}`)
  }

  return (
    <div className="space-y-8">
      {/* Header navigation mois */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">
          {MONTHS_FR[monthIndex]} {year}
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => go(-1)} aria-label="Mois précédent">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => go(1)} aria-label="Mois suivant">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Grille calendrier */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {/* Jours de la semaine */}
        <div className="grid grid-cols-7 border-b border-border">
          {DAYS_SHORT.map((d) => (
            <div key={d} className="py-2 text-center text-xs font-semibold text-muted-foreground">
              {d}
            </div>
          ))}
        </div>

        {/* Cellules */}
        <div className="grid grid-cols-7">
          {cells.map((day, i) => {
            const dayEvents = day ? (byDay[day] ?? []) : []
            const hasEvents = dayEvents.length > 0
            const todayCell = day !== null && isToday(day)

            return (
              <div
                key={i}
                className={[
                  'min-h-[72px] p-1.5 border-b border-r border-border/50',
                  'last:border-r-0',
                  day === null ? 'bg-muted/20' : '',
                  todayCell ? 'bg-primary/5' : '',
                ].join(' ')}
              >
                {day !== null && (
                  <>
                    <span
                      className={[
                        'inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium mb-1',
                        todayCell
                          ? 'bg-primary text-primary-foreground font-bold'
                          : 'text-muted-foreground',
                      ].join(' ')}
                    >
                      {day}
                    </span>

                    {/* Événements du jour */}
                    <div className="space-y-0.5">
                      {dayEvents.slice(0, 2).map((ev) => (
                        <div
                          key={ev.id}
                          className="truncate text-[10px] px-1 py-0.5 rounded font-medium bg-primary/10 text-primary leading-tight"
                          title={ev.title}
                        >
                          {ev.title}
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <div className="text-[10px] text-muted-foreground px-1">
                          +{dayEvents.length - 2}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Liste des événements du mois */}
      {events.length === 0 ? (
        <div className="py-12 text-center">
          <CalendarDays className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">
            Aucun événement public ce mois-ci.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
            Programme — {events.length} événement{events.length > 1 ? 's' : ''}
          </h3>
          <div className="space-y-3">
            {events.map((ev, i) => (
              <motion.article
                key={ev.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.4 }}
                className="rounded-xl border border-border bg-card p-4 hover:border-primary/20 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="shrink-0 text-center w-12">
                    <p className="text-xs text-muted-foreground">
                      {new Date(ev.start_at).toLocaleDateString('fr-FR', { weekday: 'short' })}
                    </p>
                    <p className="text-2xl font-black text-foreground leading-none">
                      {new Date(ev.start_at).getDate()}
                    </p>
                  </div>

                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-start gap-2 flex-wrap">
                      <Badge
                        variant="outline"
                        className={`text-[10px] px-1.5 py-0 shrink-0 ${EVENT_TYPE_COLORS[ev.type as EventType]}`}
                      >
                        {EVENT_TYPES[ev.type as EventType]}
                      </Badge>
                      <h4 className="font-semibold text-foreground text-sm leading-tight">{ev.title}</h4>
                    </div>

                    {ev.description && (
                      <p className="text-xs text-muted-foreground line-clamp-1">{ev.description}</p>
                    )}

                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" />
                        {formatDateTime(ev.start_at)}
                      </span>
                      {ev.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {ev.location}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-primary/70">
                        <Clock className="h-3 w-3" />
                        {formatRelativeTime(ev.start_at)}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
