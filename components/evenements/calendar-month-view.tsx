'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { EventWithDetails } from '@/types'

const MONTH_NAMES = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]
const DAY_HEADERS = ['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM', 'DIM']

const EVENT_COLORS: Record<string, string> = {
  operation: 'bg-red-500/75 text-white',
  reunion:   'bg-blue-500/75 text-white',
  formation: 'bg-violet-500/75 text-white',
  social:    'bg-emerald-500/75 text-white',
  autre:     'bg-zinc-500/75 text-white',
}

interface Props {
  events: EventWithDetails[]
  canManage: boolean
  onViewEvent: (e: EventWithDetails) => void
  onManageEvent: (e: EventWithDetails) => void
}

export function CalendarMonthView({ events, canManage, onViewEvent, onManageEvent }: Props) {
  const today = new Date()
  const [anchor, setAnchor] = useState(new Date(today.getFullYear(), today.getMonth(), 1))

  const year = anchor.getFullYear()
  const month = anchor.getMonth()

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDow = new Date(year, month, 1).getDay()
  const startOffset = firstDow === 0 ? 6 : firstDow - 1
  const numWeeks = Math.ceil((startOffset + daysInMonth) / 7)
  const totalCells = numWeeks * 7

  const cells = Array.from({ length: totalCells }, (_, i) => {
    const dayNum = i - startOffset + 1
    if (dayNum < 1 || dayNum > daysInMonth) return { date: null, events: [] as EventWithDetails[] }
    const date = new Date(year, month, dayNum)
    const dayEvents = events
      .filter(e => {
        const d = new Date(e.start_at)
        return d.getFullYear() === year && d.getMonth() === month && d.getDate() === dayNum
      })
      .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime())
    return { date, events: dayEvents }
  })

  const isToday = (d: Date | null) =>
    d !== null &&
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()

  function handleEvent(e: EventWithDetails) {
    if (canManage) onManageEvent(e)
    else onViewEvent(e)
  }

  return (
    <div className="flex flex-col gap-2 lg:h-[calc(100dvh-220px)] lg:min-h-[360px]">
      {/* Navigation */}
      <div className="flex items-center justify-between px-1 shrink-0">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setAnchor(new Date(year, month - 1, 1))}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-semibold uppercase tracking-[0.15em] text-foreground font-mono">
          {MONTH_NAMES[month]} {year}
        </span>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setAnchor(new Date(year, month + 1, 1))}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 shrink-0">
        {DAY_HEADERS.map(d => (
          <div key={d} className="text-center text-[9px] font-bold tracking-[0.12em] uppercase text-muted-foreground py-0.5">
            {d}
          </div>
        ))}
      </div>

      {/* Grid — flex-1 fills remaining height, rows split equally */}
      <div
        className="flex-1 min-h-0 grid grid-cols-7 gap-1"
        style={{ gridTemplateRows: `repeat(${numWeeks}, 1fr)` }}
      >
        {cells.map((cell, idx) => (
          <div
            key={idx}
            className={[
              'relative rounded-sm border p-1 overflow-hidden transition-colors',
              cell.date
                ? isToday(cell.date)
                  ? 'border-primary/50 bg-primary/5'
                  : 'border-border/40 bg-card/40 hover:border-border/60'
                : 'border-transparent',
            ].join(' ')}
          >
            {cell.date && (
              <>
                <span className="absolute top-0.5 left-0.5 w-1.5 h-1.5 border-t border-l border-border/60 pointer-events-none" />
                <span className="absolute bottom-0.5 right-0.5 w-1.5 h-1.5 border-b border-r border-border/60 pointer-events-none" />

                <p className={[
                  'text-[10px] font-mono font-semibold leading-none mb-1 select-none',
                  isToday(cell.date) ? 'text-primary' : 'text-muted-foreground/70',
                ].join(' ')}>
                  {String(cell.date.getDate()).padStart(2, '0')}
                </p>

                <div className="space-y-0.5">
                  {cell.events.slice(0, 3).map(ev => (
                    <button
                      key={ev.id}
                      onClick={() => handleEvent(ev)}
                      title={ev.title}
                      className={[
                        'w-full text-left text-[8px] font-medium px-1 py-0.5 rounded-[2px] truncate leading-tight transition-opacity hover:opacity-80',
                        EVENT_COLORS[ev.type] ?? 'bg-primary/70 text-white',
                      ].join(' ')}
                    >
                      {ev.title}
                    </button>
                  ))}
                  {cell.events.length > 3 && (
                    <p className="text-[8px] text-muted-foreground/60 font-mono pl-0.5">
                      +{cell.events.length - 3}
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 shrink-0">
        {Object.entries({ operation: 'Opération', reunion: 'Réunion', formation: 'Formation', social: 'Social', autre: 'Autre' }).map(([type, label]) => (
          <div key={type} className="flex items-center gap-1.5">
            <span className={`inline-block h-2 w-2 rounded-[1px] ${EVENT_COLORS[type]}`} />
            <span className="text-[10px] text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
