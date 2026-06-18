'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Users, X } from 'lucide-react'
import { getTeamAvailability } from '@/actions/availability'
import { AVAILABILITY_DAYS, AVAILABILITY_SLOTS } from '@/lib/constants'
import type { AvailabilityGrid } from '@/types'

interface AvailabilityTipsProps {
  open: boolean
}

function heatColor(count: number, max: number): string {
  if (count === 0) return 'bg-muted/30 text-muted-foreground/40'
  const ratio = max > 0 ? count / max : 0
  if (ratio >= 0.7) return 'bg-green-500/20 text-green-400 border-green-500/30'
  if (ratio >= 0.4) return 'bg-amber-500/20 text-amber-400 border-amber-500/30'
  return 'bg-blue-500/10 text-blue-400/70 border-blue-500/20'
}

export function AvailabilityTips({ open }: AvailabilityTipsProps) {
  const [data, setData] = useState<Record<string, AvailabilityGrid>>({})
  const [loading, setLoading] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!open) { setDismissed(false); return }
    setLoading(true)
    getTeamAvailability().then((d) => { setData(d); setLoading(false) })
  }, [open])

  if (!mounted || !open || dismissed) return null

  // Agréger : counts[day][slot] = nb membres dispos
  const counts: number[][] = Array.from({ length: 7 }, () => Array(4).fill(0))
  for (const grid of Object.values(data)) {
    for (const [dayStr, slots] of Object.entries(grid)) {
      const day = Number(dayStr)
      for (const slot of slots) {
        counts[day][slot]++
      }
    }
  }
  const max = Math.max(1, ...counts.flat())

  return createPortal(
    <div className="fixed top-1/2 -translate-y-1/2 right-4 z-[200] w-64 rounded-xl border border-border bg-card/95 backdrop-blur-sm shadow-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          <Users className="h-3.5 w-3.5" />
          Disponibilités habituelles
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {loading ? (
        <p className="text-xs text-muted-foreground text-center py-2">Chargement…</p>
      ) : (
        <>
          <div className="space-y-1.5">
            {/* Header créneaux */}
            <div className="grid grid-cols-5 gap-1 text-[10px] text-muted-foreground/60">
              <div />
              {AVAILABILITY_SLOTS.map((s) => (
                <div key={s} className="text-center truncate">{s.slice(0, 4)}</div>
              ))}
            </div>

            {/* Grille jours × créneaux */}
            {AVAILABILITY_DAYS.map((day, di) => (
              <div key={day} className="grid grid-cols-5 gap-1 items-center">
                <div className="text-[10px] text-muted-foreground font-medium">{day}</div>
                {AVAILABILITY_SLOTS.map((_, si) => {
                  const c = counts[di][si]
                  return (
                    <div
                      key={si}
                      title={`${c} membre${c > 1 ? 's' : ''} disponible${c > 1 ? 's' : ''}`}
                      className={`h-6 rounded border text-[10px] flex items-center justify-center font-mono ${heatColor(c, max)}`}
                    >
                      {c > 0 ? c : ''}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>

          <p className="text-[10px] text-muted-foreground/50 text-center leading-tight">
            Basé sur les dispos renseignées par les membres
          </p>
        </>
      )}
    </div>,
    document.body
  )
}
