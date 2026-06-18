'use client'

import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { Loader2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MarkdownEditor } from '@/components/ui/markdown-editor'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { ShipModelCombobox } from './ship-model-combobox'
import { SHIP_TYPES } from '@/lib/constants'
import type { ShipModel, ShipCreateInput } from '@/types'

interface ShipFormValues {
  name: string
  model: string
  manufacturer?: string
  ship_type: 'combat' | 'transport' | 'minage' | 'exploration' | 'support' | 'multirole' | 'autre'
  crew_size: string
  is_org_ship: boolean
  purchased_in_game: boolean
  notes?: string
}

interface ShipFormProps {
  onSubmit: (data: ShipCreateInput) => Promise<void>
  isPending?: boolean
  onCancel?: () => void
}

export function ShipForm({ onSubmit, isPending = false, onCancel }: ShipFormProps) {
  const [manualMode, setManualMode] = useState(false)
  const [rsiModelName, setRsiModelName] = useState<string | undefined>()

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
    setError,
  } = useForm<ShipFormValues>({
    defaultValues: { ship_type: 'multirole', crew_size: '1', is_org_ship: false, purchased_in_game: false },
  })

  const watchedModel = watch('model')

  // Quand l'utilisateur sélectionne un modèle RSI → auto-remplir les champs
  function handleRsiModelSelect(model: ShipModel | null) {
    if (!model) {
      setRsiModelName(undefined)
      return
    }
    setRsiModelName(model.name)
    setValue('model', model.name)
    setValue('manufacturer', model.manufacturer ?? '')
    const validType = model.ship_type as ShipFormValues['ship_type']
    const knownTypes: ShipFormValues['ship_type'][] = ['combat', 'transport', 'minage', 'exploration', 'support', 'multirole', 'autre']
    setValue('ship_type', knownTypes.includes(validType) ? validType : 'autre')
    setValue('crew_size', String(model.max_crew ?? 1))
    // Si le nom du vaisseau est vide, pré-remplir avec le nom du modèle
    if (!watch('name')) setValue('name', model.name)
  }

  function handleManualMode() {
    setManualMode(true)
    setRsiModelName(undefined)
  }

  function handleValidSubmit(raw: ShipFormValues) {
    if (!raw.name || raw.name.length < 2) {
      setError('name', { message: 'Nom requis (min. 2 caractères)' })
      return
    }
    if (!raw.model || raw.model.length < 2) {
      setError('model', { message: 'Modèle requis (min. 2 caractères)' })
      return
    }
    const data: ShipCreateInput = {
      ...raw,
      crew_size: parseInt(raw.crew_size, 10) || 1,
    }
    return onSubmit(data)
  }

  return (
    <form onSubmit={handleSubmit(handleValidSubmit)} className="space-y-4">

      {/* Sélection du modèle RSI */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label>Modèle RSI *</Label>
          {rsiModelName && (
            <Badge variant="outline" className="text-[10px] px-1.5 text-primary border-primary/30 bg-primary/10 gap-1">
              <Sparkles className="h-2.5 w-2.5" />
              Auto-rempli
            </Badge>
          )}
        </div>

        {manualMode ? (
          <div className="space-y-1">
            <Input
              placeholder="Constellation Andromeda"
              aria-invalid={!!errors.model}
              {...register('model', { required: 'Modèle requis', minLength: { value: 2, message: 'Minimum 2 caractères' } })}
            />
            <button
              type="button"
              onClick={() => setManualMode(false)}
              className="text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              ← Utiliser le catalogue RSI
            </button>
          </div>
        ) : (
          <ShipModelCombobox
            value={rsiModelName}
            onSelect={handleRsiModelSelect}
            onManual={handleManualMode}
            disabled={isPending}
          />
        )}
        {errors.model && <p className="text-xs text-destructive">{errors.model.message}</p>}
      </div>

      {/* Nom du vaisseau (in-game name) */}
      <div className="space-y-1.5">
        <Label htmlFor="name">Nom du vaisseau *</Label>
        <Input
          id="name"
          placeholder="Inquisiteur I, Shadow Blade…"
          aria-invalid={!!errors.name}
          {...register('name', { required: 'Nom requis', minLength: { value: 2, message: 'Minimum 2 caractères' } })}
        />
        <p className="text-[11px] text-muted-foreground">Le nom que tu donnes à ton vaisseau en jeu</p>
        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
      </div>

      {/* Fabricant + Équipage */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="manufacturer">Fabricant</Label>
          <Input id="manufacturer" placeholder="RSI, Drake, Aegis…" {...register('manufacturer')} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="crew_size">Équipage</Label>
          <Input id="crew_size" type="number" min={1} max={100} placeholder="1" {...register('crew_size')} />
        </div>
      </div>

      {/* Type */}
      <div className="space-y-1.5">
        <Label htmlFor="ship_type">Type *</Label>
        <Controller
          name="ship_type"
          control={control}
          render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger id="ship_type"><SelectValue placeholder="Choisir…" /></SelectTrigger>
              <SelectContent>
                {Object.entries(SHIP_TYPES).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>

      {/* Notes */}
      <div className="space-y-1.5">
        <Label htmlFor="notes">Notes</Label>
        <Controller
          name="notes"
          control={control}
          render={({ field }) => (
            <MarkdownEditor
              id="notes"
              value={field.value ?? ''}
              onChange={field.onChange}
              placeholder="Rôle, équipements particuliers…"
              rows={2}
            />
          )}
        />
      </div>

      {/* Vaisseau de l'org */}
      <Controller
        name="is_org_ship"
        control={control}
        render={({ field }) => (
          <div className="flex items-center gap-3">
            <Switch id="is_org_ship" checked={field.value} onCheckedChange={field.onChange} />
            <Label htmlFor="is_org_ship" className="cursor-pointer">
              Vaisseau de l&apos;organisation
            </Label>
          </div>
        )}
      />

      {/* Acheté en jeu (SC 1.0) */}
      <Controller
        name="purchased_in_game"
        control={control}
        render={({ field }) => (
          <div className="flex items-center gap-3">
            <Switch id="purchased_in_game" checked={field.value} onCheckedChange={field.onChange} />
            <div>
              <Label htmlFor="purchased_in_game" className="cursor-pointer">
                Acheté en jeu (UEC)
              </Label>
              <p className="text-[11px] text-muted-foreground">Acquis avec des UEC in-game, pas via le Pledge Store</p>
            </div>
          </div>
        )}
      />

      <div className="flex gap-2 justify-end pt-2">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} disabled={isPending}>Annuler</Button>
        )}
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Ajouter le vaisseau
        </Button>
      </div>
    </form>
  )
}
