'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { EventWithDetails } from '@/types'

const DAY_NAMES = ['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM', 'DIM']
const SHORT_MONTHS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']

const EVENT_COLORS: Record<string, string> = {
  operation: 'border-l-red-500 bg-red-500/10 text-foreground',
  reunion:   'border-l-blue-500 bg-blue-500/10 text-foreground',
  formation: 'border-l-violet-500 bg-violet-500/10 text-foreground',
  social:    'border-l-emerald-500 bg-emerald-500/10 text-foreground',
  autre:     'border-l-zinc-500 bg-zinc-500/10 text-foreground',
}

function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const dow = d.getDay()
  d.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1))
  d.setHours(0, 0, 0, 0)
  return d
}

function fmtDate(d: Date) {
  return `${String(d.getDate()).padStart(2, '0')} ${SHORT_MONTHS[d.getMonth()]}`
}

interface Props {
  events: EventWithDetails[]
  canManage: boolean
  onViewEvent: (e: EventWithDetails) => void
  onManageEvent: (e: EventWithDetails) => void
}

export function CalendarWeekView({ events, canManage, onViewEvent, onManageEvent }: Props) {
  const today = new Date()
  const [weekStart, setWeekStart] = useState(getWeekStart(today))

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + i)
    return d
  })

  const weekEnd = days[6]
  const weekLabel = `${fmtDate(weekStart)} — ${fmtDate(weekEnd)} ${weekEnd.getFullYear()}`

  const isToday = (d: Date) =>
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()

  function handleEvent(e: EventWithDetails) {
    if (canManage) onManageEvent(e)
    else onViewEvent(e)
  }

  function prevWeek() {
    setWeekStart(d => { const n = new Date(d); n.setDate(n.getDate() - 7); return n })
  }
  function nextWeek() {
    setWeekStart(d => { const n = new Date(d); n.setDate(n.getDate() + 7); return n })
  }

  return (
    <div className="flex flex-col gap-2 lg:h-[calc(100dvh-220px)] lg:min-h-[360px]">
      {/* Navigation */}
      <div className="flex items-center justify-between px-1 shrink-0">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={prevWeek}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-foreground font-mono">
          {weekLabel}
        </span>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={nextWeek}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* 7 columns — flex-1 fills remaining height */}
      <div className="flex-1 min-h-0 grid grid-cols-7 gap-1.5">
        {days.map((day, i) => {
          const dayEvents = events
            .filter(e => {
              const d = new Date(e.start_at)
              return d.getDate() === day.getDate() &&
                     d.getMonth() === day.getMonth() &&
                     d.getFullYear() === day.getFullYear()
            })
            .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime())

          const tod = isToday(day)

          return (
            <div
              key={i}
              className={[
                'relative flex flex-col rounded-sm border overflow-hidden',
                tod ? 'border-primary/50 bg-primary/5' : 'border-border/40 bg-card/40',
              ].join(' ')}
            >
              {/* Day header — fixed */}
              <div className={[
                'shrink-0 px-1 py-2 border-b text-center',
                tod ? 'border-primary/30 bg-primary/10' : 'border-border/30',
              ].join(' ')}>
                <p className={[
                  'text-[8px] font-bold uppercase tracking-[0.12em]',
                  tod ? 'text-primary' : 'text-muted-foreground/60',
                ].join(' ')}>
                  {DAY_NAMES[i]}
                </p>
                <p className={[
                  'text-sm font-bold font-mono leading-none mt-0.5',
                  tod ? 'text-primary' : 'text-foreground',
                ].join(' ')}>
                  {String(day.getDate()).padStart(2, '0')}
                </p>
              </div>

              {/* Events — scrollable, fills remaining column height */}
              <div className="flex-1 overflow-y-auto p-1 space-y-1 min-h-0">
                {dayEvents.length === 0 ? (
                  <p className="text-[9px] text-muted-foreground/25 font-mono text-center mt-4 select-none">—</p>
                ) : (
                  dayEvents.map(ev => (
                    <button
                      key={ev.id}
                      onClick={() => handleEvent(ev)}
                      title={ev.title}
                      className={[
                        'w-full text-left border-l-2 rounded-[2px] px-1 py-0.5 transition-opacity hover:opacity-80',
                        EVENT_COLORS[ev.type] ?? 'border-l-primary bg-primary/10 text-foreground',
                      ].join(' ')}
                    >
                      <p className="text-[8px] font-medium truncate leading-tight">{ev.title}</p>
                      <p className="text-[8px] font-mono text-muted-foreground leading-tight">
                        {new Date(ev.start_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </button>
                  ))
                )}
              </div>

              <span className="absolute top-0.5 left-0.5 w-1.5 h-1.5 border-t border-l border-border/50 pointer-events-none" />
              <span className="absolute bottom-0.5 right-0.5 w-1.5 h-1.5 border-b border-r border-border/50 pointer-events-none" />
            </div>
          )
        })}
      </div>
    </div>
  )
}
