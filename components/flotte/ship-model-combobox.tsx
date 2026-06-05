'use client'

import { useState } from 'react'
import { Check, ChevronsUpDown, Loader2, Pencil } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useShipModels } from '@/hooks/use-ship-models'
import type { ShipModel } from '@/types'

interface ShipModelComboboxProps {
  value?: string           // nom du modèle sélectionné
  onSelect: (model: ShipModel | null) => void
  onManual?: () => void    // bascule vers saisie manuelle
  disabled?: boolean
}

export function ShipModelCombobox({ value, onSelect, onManual, disabled }: ShipModelComboboxProps) {
  const [open, setOpen] = useState(false)
  const { data: models = [], isLoading } = useShipModels()

  const selected = models.find(m => m.name === value) ?? null
  const hasModels = models.length > 0

  return (
    <div className="space-y-1.5">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled || isLoading}
            className={cn(
              'w-full justify-between font-normal text-left',
              !selected && 'text-muted-foreground'
            )}
          >
            <span className="truncate">
              {isLoading
                ? 'Chargement des modèles…'
                : !hasModels
                ? 'Aucun modèle — sync la matrice RSI d\'abord'
                : selected
                ? selected.name
                : 'Chercher un modèle RSI…'}
            </span>
            {isLoading
              ? <Loader2 className="ml-2 h-4 w-4 shrink-0 animate-spin opacity-50" />
              : <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />}
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-[460px] p-0" align="start">
          <Command filter={(value, search) => {
            // Recherche sur nom + fabricant + focus
            const model = models.find(m => m.name.toLowerCase() === value.toLowerCase())
            if (!model) return 0
            const haystack = `${model.name} ${model.manufacturer ?? ''} ${model.focus ?? ''}`.toLowerCase()
            return haystack.includes(search.toLowerCase()) ? 1 : 0
          }}>
            <CommandInput placeholder="Constellation, Cutlass, Hammerhead…" />
            <CommandList>
              <CommandEmpty>
                Aucun vaisseau trouvé.
                {onManual && (
                  <button
                    type="button"
                    onClick={() => { setOpen(false); onManual() }}
                    className="mt-2 block text-xs text-primary hover:underline mx-auto"
                  >
                    Saisir manuellement
                  </button>
                )}
              </CommandEmpty>
              <CommandGroup>
                {models.map((model) => (
                  <CommandItem
                    key={model.id}
                    value={model.name}
                    onSelect={() => {
                      onSelect(selected?.id === model.id ? null : model)
                      setOpen(false)
                    }}
                    className="flex items-center gap-2 py-2"
                  >
                    <Check className={cn('h-4 w-4 shrink-0', selected?.id === model.id ? 'opacity-100' : 'opacity-0')} />
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-medium">{model.name}</span>
                      <span className="text-xs text-muted-foreground truncate">
                        {[model.manufacturer, model.focus].filter(Boolean).join(' — ')}
                      </span>
                    </div>
                    <span className="ml-auto text-[10px] text-muted-foreground/70 capitalize shrink-0">
                      {model.ship_type}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Lien saisie manuelle */}
      {onManual && hasModels && (
        <button
          type="button"
          onClick={onManual}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          <Pencil className="h-3 w-3" />
          Saisir manuellement
        </button>
      )}
    </div>
  )
}
