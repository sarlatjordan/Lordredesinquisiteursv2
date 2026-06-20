'use client'

import { createPortal } from 'react-dom'
import { useEffect, useState } from 'react'
import { Palmtree, X } from 'lucide-react'
import type { AbsenceWithProfile } from '@/types'

interface AbsenceTipsProps {
  absences: AbsenceWithProfile[]
  startDate: string
  endDate: string
  open: boolean
}

export function AbsenceTips({ absences, startDate, endDate, open }: AbsenceTipsProps) {
  const [mounted, setMounted] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => { setMounted(true) }, [])
  useEffect(() => { if (!open) setDismissed(false) }, [open])
  useEffect(() => { setDismissed(false) }, [startDate, endDate])

  if (!mounted || !open || !startDate || dismissed) return null

  const matching = absences.filter(
    (a) => a.start_date <= (endDate || startDate) && a.end_date >= startDate
  )
  if (matching.length === 0) return null

  return createPortal(
    <div className="fixed bottom-4 right-4 z-[200] w-64 rounded-xl border border-amber-500/30 bg-card/95 backdrop-blur-sm shadow-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider">
          <Palmtree className="h-3.5 w-3.5" />
          {matching.length === 1 ? '1 membre absent' : `${matching.length} membres absents`}
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <ul className="space-y-2">
        {matching.map((a) => (
          <li key={a.id}>
            <p className="text-xs font-medium text-amber-300">
              {a.profile.display_name ?? a.profile.username}
            </p>
            <p className="text-[10px] text-amber-400/60 leading-relaxed">
              {a.start_date} → {a.end_date}
              {a.reason ? ` — ${a.reason}` : ''}
            </p>
          </li>
        ))}
      </ul>
    </div>,
    document.body
  )
}
