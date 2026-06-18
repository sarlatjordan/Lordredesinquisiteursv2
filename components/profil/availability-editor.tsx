'use client'

import { useState, useTransition } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AVAILABILITY_DAYS, AVAILABILITY_SLOTS } from '@/lib/constants'
import { saveAvailability } from '@/actions/availability'
import type { AvailabilityGrid } from '@/types'
import { cn } from '@/lib/utils'

interface AvailabilityEditorProps {
  initial: AvailabilityGrid
}

export function AvailabilityEditor({ initial }: AvailabilityEditorProps) {
  const [grid, setGrid] = useState<AvailabilityGrid>(initial)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  function toggle(day: number, slot: number) {
    setSaved(false)
    setGrid((prev) => {
      const daySlots = prev[day] ?? []
      const hasSlot = daySlots.includes(slot)
      return {
        ...prev,
        [day]: hasSlot ? daySlots.filter((s) => s !== slot) : [...daySlots, slot],
      }
    })
  }

  function handleSave() {
    setError(null)
    setSaved(false)
    startTransition(async () => {
      const result = await saveAvailability(grid)
      if (!result.success) { setError(result.error); return }
      setSaved(true)
    })
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-separate border-spacing-1">
          <thead>
            <tr>
              <th className="w-24 text-left text-muted-foreground font-medium pb-1" />
              {AVAILABILITY_DAYS.map((day) => (
                <th key={day} className="text-center text-muted-foreground font-medium pb-1 w-12">{day}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {AVAILABILITY_SLOTS.map((slotLabel, slot) => (
              <tr key={slot}>
                <td className="text-muted-foreground py-0.5 pr-2">{slotLabel}</td>
                {AVAILABILITY_DAYS.map((_, day) => {
                  const active = (grid[day] ?? []).includes(slot)
                  return (
                    <td key={day} className="text-center">
                      <button
                        type="button"
                        onClick={() => toggle(day, slot)}
                        className={cn(
                          'w-8 h-8 rounded-md border transition-colors',
                          active
                            ? 'bg-primary border-primary text-primary-foreground'
                            : 'bg-muted/30 border-border hover:border-primary/50'
                        )}
                        aria-label={`${AVAILABILITY_DAYS[day]} ${slotLabel}`}
                      />
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {error && (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
      )}

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={isPending} size="sm">
          {isPending && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
          Enregistrer
        </Button>
        {saved && <span className="text-xs text-green-500">Disponibilités enregistrées</span>}
      </div>
    </div>
  )
}
