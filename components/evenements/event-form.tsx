'use client'

import { useForm, Controller, useWatch } from 'react-hook-form'
import { Loader2, Send, Swords } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MarkdownEditor } from '@/components/ui/markdown-editor'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { AbsenceTips } from '@/components/ui/absence-tips'
import { EVENT_TYPES, EVENT_STATUS, ROLES, ROLE_PRIVILEGES, type Role } from '@/lib/constants'
import type { AbsenceWithProfile } from '@/types'

interface EventFormValues {
  title: string
  description?: string
  type: 'operation' | 'reunion' | 'formation' | 'social' | 'sortie' | 'autre'
  status?: 'planned' | 'active' | 'completed' | 'cancelled'
  start_at: string
  end_at?: string
  location?: string
  max_attendees?: string
  min_privilege: string
  sendToDiscord: boolean
  createOperation: boolean
}

export interface EventFormData {
  title: string
  description?: string
  type: 'operation' | 'reunion' | 'formation' | 'social' | 'sortie' | 'autre'
  status?: 'planned' | 'active' | 'completed' | 'cancelled'
  start_at: string
  end_at?: string
  location?: string
  max_attendees?: number
  min_privilege: number
  sendToDiscord?: boolean
  createOperation?: boolean
}

interface EventFormProps {
  onSubmit: (data: EventFormData) => void | Promise<void>
  isPending?: boolean
  onCancel?: () => void
  defaultValues?: Partial<EventFormValues>
  submitLabel?: string
  showStatus?: boolean
  serverError?: string | null
  canDiscordSync?: boolean
  canCreateOp?: boolean
  absences?: AbsenceWithProfile[]
  open?: boolean
}

export function EventForm({
  onSubmit,
  isPending = false,
  onCancel,
  defaultValues,
  submitLabel = "Créer l'événement",
  showStatus = false,
  serverError,
  canDiscordSync = false,
  canCreateOp = false,
  absences = [],
  open = false,
}: EventFormProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    setError,
  } = useForm<EventFormValues>({
    defaultValues: {
      type: 'operation',
      min_privilege: '0',
      status: 'planned',
      sendToDiscord: false,
      createOperation: false,
      ...defaultValues,
    },
  })

  const watchedType  = useWatch({ control, name: 'type' })
  const watchedStart = useWatch({ control, name: 'start_at' })
  const watchedEnd   = useWatch({ control, name: 'end_at' })

  function handleValidSubmit(raw: EventFormValues) {
    if (!raw.title || raw.title.length < 3) {
      setError('title', { message: 'Titre requis (min. 3 caractères)' })
      return
    }
    if (!raw.start_at) {
      setError('start_at', { message: 'Date de début requise' })
      return
    }
    // datetime-local values have no timezone — new Date() interprets them as local time,
    // toISOString() converts to UTC before storing in Supabase (timestamptz column).
    const data: EventFormData = {
      ...raw,
      start_at: new Date(raw.start_at).toISOString(),
      end_at: raw.end_at ? new Date(raw.end_at).toISOString() : undefined,
      max_attendees: raw.max_attendees ? parseInt(raw.max_attendees, 10) : undefined,
      min_privilege: parseInt(raw.min_privilege, 10) || 0,
      createOperation: watchedType === 'operation' ? raw.createOperation : false,
    }
    return onSubmit(data)
  }

  const rankOptions = (Object.entries(ROLE_PRIVILEGES) as [Role, number][])
    .sort((a, b) => a[1] - b[1])

  return (
    <form onSubmit={handleSubmit(handleValidSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="title">Titre *</Label>
        <Input
          id="title"
          placeholder="Opération Aube Noire"
          aria-invalid={!!errors.title}
          {...register('title', { required: 'Titre requis', minLength: { value: 3, message: 'Minimum 3 caractères' } })}
        />
        {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <Controller
          name="description"
          control={control}
          render={({ field }) => (
            <MarkdownEditor
              id="description"
              value={field.value ?? ''}
              onChange={field.onChange}
              placeholder="Détails de l'événement…"
              rows={3}
            />
          )}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="type">Type *</Label>
          <Controller
            name="type"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger id="type"><SelectValue placeholder="Choisir…" /></SelectTrigger>
                <SelectContent>
                  {Object.entries(EVENT_TYPES).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
        {showStatus ? (
          <div className="space-y-1.5">
            <Label htmlFor="status">Statut</Label>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger id="status"><SelectValue placeholder="Statut…" /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(EVENT_STATUS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        ) : (
          <div className="space-y-1.5">
            <Label htmlFor="max_attendees">Max. participants</Label>
            <Input id="max_attendees" type="number" min={1} placeholder="Illimité" {...register('max_attendees')} />
          </div>
        )}
      </div>

      {showStatus && (
        <div className="space-y-1.5">
          <Label htmlFor="max_attendees">Max. participants</Label>
          <Input id="max_attendees" type="number" min={1} placeholder="Illimité" {...register('max_attendees')} />
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="start_at">Début *</Label>
          <Input
            id="start_at"
            type="datetime-local"
            aria-invalid={!!errors.start_at}
            {...register('start_at', { required: 'Date de début requise' })}
          />
          {errors.start_at && <p className="text-xs text-destructive">{errors.start_at.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="end_at">Fin</Label>
          <Input id="end_at" type="datetime-local" {...register('end_at')} />
        </div>
      </div>

      <AbsenceTips
        absences={absences}
        startDate={watchedStart ? watchedStart.slice(0, 10) : ''}
        endDate={watchedEnd ? watchedEnd.slice(0, 10) : ''}
        open={open}
      />

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="location">Lieu</Label>
          <Input id="location" placeholder="Système Stanton…" {...register('location')} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="min_privilege">Rang minimum requis</Label>
          <Controller
            name="min_privilege"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger id="min_privilege"><SelectValue placeholder="Tous" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Tous (public)</SelectItem>
                  {rankOptions.map(([role, privilege]) => (
                    <SelectItem key={role} value={String(privilege)}>
                      {ROLES[role]}+
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>

      {(canDiscordSync || (canCreateOp && watchedType === 'operation')) && (
        <div className="rounded-md border border-border bg-muted/30 px-3 py-3 space-y-2.5">
          {canDiscordSync && (
            <Controller
              name="sendToDiscord"
              control={control}
              render={({ field }) => (
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <Checkbox
                    id="sendToDiscord"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                  <Send className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-sm">Publier sur Discord</span>
                </label>
              )}
            />
          )}
          {canCreateOp && watchedType === 'operation' && (
            <Controller
              name="createOperation"
              control={control}
              render={({ field }) => (
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <Checkbox
                    id="createOperation"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                  <Swords className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-sm">Créer l&apos;opération liée</span>
                </label>
              )}
            />
          )}
        </div>
      )}

      {serverError && (
        <div className="rounded-md bg-destructive/10 border border-destructive/30 px-3 py-2">
          <p className="text-xs text-destructive">{serverError}</p>
        </div>
      )}

      <div className="flex gap-2 justify-end pt-2">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} disabled={isPending}>Annuler</Button>
        )}
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
