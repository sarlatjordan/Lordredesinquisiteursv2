'use client'

import { useState, useTransition, KeyboardEvent } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ACTIVITY_LEVELS, type ActivityLevel } from '@/lib/constants'
import { upsertProgression } from '@/actions/progression'
import { ClipboardEdit, X, Plus, AlertCircle } from 'lucide-react'
import type { MemberProgression, Profile } from '@/types'

interface ProgressionFormProps {
  target: Pick<Profile, 'id' | 'username' | 'display_name'>
  current: MemberProgression | null
  onSuccess?: () => void
}

export function ProgressionForm({ target, current, onSuccess }: ProgressionFormProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [activityLevel, setActivityLevel] = useState<string>(current?.activity_level ?? '')
  const [favoriteActivity, setFavoriteActivity] = useState(current?.favorite_activity ?? '')
  const [trainings, setTrainings] = useState<string[]>(current?.trainings_received ?? [])
  const [trainingInput, setTrainingInput] = useState('')
  const [notesSage, setNotesSage] = useState(current?.notes_sage ?? '')

  function addTraining() {
    const val = trainingInput.trim()
    if (val && !trainings.includes(val)) {
      setTrainings((prev) => [...prev, val])
    }
    setTrainingInput('')
  }

  function onTrainingKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') { e.preventDefault(); addTraining() }
  }

  function removeTraining(t: string) {
    setTrainings((prev) => prev.filter((x) => x !== t))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const result = await upsertProgression({
        profile_id:        target.id,
        activity_level:    activityLevel as ActivityLevel || undefined,
        favorite_activity: favoriteActivity || undefined,
        trainings_received: trainings,
        notes_sage:        notesSage || undefined,
      })
      if (result.success) {
        setOpen(false)
        onSuccess?.()
      } else {
        setError(result.error)
      }
    })
  }

  const targetName = target.display_name ?? target.username

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs">
          <ClipboardEdit className="h-3.5 w-3.5" />
          Modifier la progression
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Fiche de progression</DialogTitle>
          <DialogDescription>
            Mise à jour de la progression de <strong>{targetName}</strong>.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {error && (
            <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label id="prog-activity-label">Niveau d&apos;activité</Label>
              <Select value={activityLevel} onValueChange={setActivityLevel}>
                <SelectTrigger aria-labelledby="prog-activity-label">
                  <SelectValue placeholder="Non défini" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Non défini</SelectItem>
                  {(Object.entries(ACTIVITY_LEVELS) as [ActivityLevel, string][]).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="fav-activity">Activité favorite</Label>
              <Input
                id="fav-activity"
                value={favoriteActivity}
                onChange={(e) => setFavoriteActivity(e.target.value)}
                placeholder="Ex: Combat PVP, Minage…"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Formations reçues</Label>
            <div className="flex gap-2">
              <Input
                value={trainingInput}
                onChange={(e) => setTrainingInput(e.target.value)}
                onKeyDown={onTrainingKey}
                placeholder="Nom de la formation…"
                className="flex-1"
              />
              <Button type="button" size="sm" variant="outline" onClick={addTraining} className="shrink-0 gap-1">
                <Plus className="h-3.5 w-3.5" />
                Ajouter
              </Button>
            </div>
            {trainings.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {trainings.map((t) => (
                  <Badge key={t} variant="outline" className="gap-1 text-xs pr-1">
                    {t}
                    <button
                      type="button"
                      onClick={() => removeTraining(t)}
                      className="ml-0.5 rounded text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes-sage">Notes Sage <span className="text-[10px] text-muted-foreground">(privées)</span></Label>
            <Textarea
              id="notes-sage"
              value={notesSage}
              onChange={(e) => setNotesSage(e.target.value)}
              placeholder="Observations sur le membre, axes d'amélioration, fiabilité…"
              rows={3}
              className="resize-none"
            />
          </div>

          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1" disabled={isPending}>
              Annuler
            </Button>
            <Button type="submit" className="flex-1" disabled={isPending}>
              {isPending ? 'Enregistrement…' : 'Enregistrer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
