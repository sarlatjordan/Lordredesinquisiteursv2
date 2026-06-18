'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MarkdownEditor } from '@/components/ui/markdown-editor'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Check, ChevronsUpDown, Loader2, Minus, Plus } from 'lucide-react'
import {
  OP_TYPES, OP_STATUS, OP_RISK, OP_ROLES, SC_SYSTEMS,
  type OpType, type OpStatus, type OpRisk, type OpRole,
} from '@/lib/constants'
import type { OperationCreateInput } from '@/types'
import type { Profile } from '@/types'

interface OpFormProps {
  initialData?: Partial<OperationCreateInput>
  members: Pick<Profile, 'id' | 'username' | 'display_name'>[]
  onSubmit: (data: OperationCreateInput) => void
  isPending: boolean
  onCancel: () => void
  showStatus?: boolean
}

const ROLE_KEYS = Object.keys(OP_ROLES) as OpRole[]

export function OpForm({ initialData, members, onSubmit, isPending, onCancel, showStatus = false }: OpFormProps) {
  const [systemOpen, setSystemOpen] = useState(false)
  const [commanderOpen, setCommanderOpen] = useState(false)

  const [title, setTitle] = useState(initialData?.title ?? '')
  const [systemName, setSystemName] = useState(initialData?.system_name ?? '')
  const [type, setType] = useState<OpType>((initialData?.type as OpType) ?? 'combat')
  const [status, setStatus] = useState<OpStatus>((initialData?.status as OpStatus) ?? 'planned')
  const [departureAt, setDepartureAt] = useState(initialData?.departure_at ?? '')
  const [durationMin, setDurationMin] = useState(initialData?.estimated_duration_min?.toString() ?? '')
  const [riskLevel, setRiskLevel] = useState<OpRisk>((initialData?.risk_level as OpRisk) ?? 'medium')
  const [commanderId, setCommanderId] = useState(initialData?.commander_id ?? '')
  const [description, setDescription] = useState(initialData?.description ?? '')
  const [minPrivilege, setMinPrivilege] = useState(initialData?.min_privilege?.toString() ?? '100')

  // Compteurs de rôles
  const initialCounts = ROLE_KEYS.reduce<Record<OpRole, number>>((acc, r) => ({ ...acc, [r]: 0 }), {} as Record<OpRole, number>)
  if (initialData?.role_slots) {
    for (const r of initialData.role_slots) initialCounts[r as OpRole] = (initialCounts[r as OpRole] ?? 0) + 1
  }
  const [roleCounts, setRoleCounts] = useState<Record<OpRole, number>>(initialCounts)

  function adjustRole(role: OpRole, delta: number) {
    setRoleCounts((prev) => ({ ...prev, [role]: Math.max(0, (prev[role] ?? 0) + delta) }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const role_slots: OpRole[] = []
    for (const r of ROLE_KEYS) {
      for (let i = 0; i < roleCounts[r]; i++) role_slots.push(r)
    }
    onSubmit({
      title,
      system_name: systemName,
      type,
      status,
      departure_at: departureAt,
      estimated_duration_min: durationMin ? Number(durationMin) : undefined,
      risk_level: riskLevel,
      commander_id: commanderId || undefined,
      description: description || undefined,
      min_privilege: Number(minPrivilege) || 100,
      role_slots,
    })
  }

  const commanderLabel = commanderId
    ? (members.find((m) => m.id === commanderId)?.display_name ?? members.find((m) => m.id === commanderId)?.username ?? '')
    : 'Sélectionner...'

  const totalSlots = Object.values(roleCounts).reduce((a, b) => a + b, 0)

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Titre */}
      <div className="space-y-1.5">
        <Label htmlFor="op-title">Nom de l&apos;opération *</Label>
        <Input
          id="op-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex: Raid minier sur Lyria"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Système */}
        <div className="space-y-1.5">
          <Label>Système *</Label>
          <Popover open={systemOpen} onOpenChange={setSystemOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" role="combobox" className="w-full justify-between font-normal">
                {systemName || 'Choisir...'}
                <ChevronsUpDown className="h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0">
              <Command>
                <CommandInput placeholder="Filtrer..." />
                <CommandList>
                  <CommandEmpty>Aucun système trouvé.</CommandEmpty>
                  <CommandGroup>
                    {SC_SYSTEMS.map((s) => (
                      <CommandItem key={s} value={s} onSelect={() => { setSystemName(s); setSystemOpen(false) }}>
                        <Check className={cn('mr-2 h-4 w-4', systemName === s ? 'opacity-100' : 'opacity-0')} />
                        {s}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {/* Type */}
        <div className="space-y-1.5">
          <Label id="op-type-label">Type *</Label>
          <Select value={type} onValueChange={(v) => setType(v as OpType)}>
            <SelectTrigger aria-labelledby="op-type-label"><SelectValue /></SelectTrigger>
            <SelectContent>
              {(Object.entries(OP_TYPES) as [OpType, string][]).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Départ */}
        <div className="space-y-1.5">
          <Label htmlFor="op-departure">Heure de départ *</Label>
          <Input
            id="op-departure"
            type="datetime-local"
            value={departureAt}
            onChange={(e) => setDepartureAt(e.target.value)}
            required
          />
        </div>

        {/* Durée */}
        <div className="space-y-1.5">
          <Label htmlFor="op-duration">Durée estimée (min)</Label>
          <Input
            id="op-duration"
            type="number"
            min="0"
            value={durationMin}
            onChange={(e) => setDurationMin(e.target.value)}
            placeholder="Ex: 90"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Niveau de risque */}
        <div className="space-y-1.5">
          <Label id="op-risk-label">Niveau de risque</Label>
          <Select value={riskLevel} onValueChange={(v) => setRiskLevel(v as OpRisk)}>
            <SelectTrigger aria-labelledby="op-risk-label"><SelectValue /></SelectTrigger>
            <SelectContent>
              {(Object.entries(OP_RISK) as [OpRisk, string][]).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Statut (edit uniquement) */}
        {showStatus && (
          <div className="space-y-1.5">
            <Label id="op-status-label">Statut</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as OpStatus)}>
              <SelectTrigger aria-labelledby="op-status-label"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.entries(OP_STATUS) as [OpStatus, string][]).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Commandant */}
      <div className="space-y-1.5">
        <Label>Commandant</Label>
        <Popover open={commanderOpen} onOpenChange={setCommanderOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" role="combobox" className="w-full justify-between font-normal">
              {commanderLabel}
              <ChevronsUpDown className="h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0">
            <Command filter={(value, search) => {
              const m = members.find((m) => m.id === value)
              const label = `${m?.display_name ?? ''} ${m?.username ?? ''}`.toLowerCase()
              return label.includes(search.toLowerCase()) ? 1 : 0
            }}>
              <CommandInput placeholder="Chercher un membre..." />
              <CommandList>
                <CommandEmpty>Aucun membre trouvé.</CommandEmpty>
                <CommandGroup>
                  {members.map((m) => (
                    <CommandItem key={m.id} value={m.id} onSelect={() => { setCommanderId(m.id); setCommanderOpen(false) }}>
                      <Check className={cn('mr-2 h-4 w-4', commanderId === m.id ? 'opacity-100' : 'opacity-0')} />
                      {m.display_name ?? m.username}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* Description / briefing */}
      <div className="space-y-1.5">
        <Label htmlFor="op-desc">Briefing</Label>
        <MarkdownEditor
          id="op-desc"
          value={description}
          onChange={setDescription}
          placeholder="Objectifs, contexte, consignes tactiques..."
          rows={4}
        />
      </div>

      {/* Accès minimum */}
      <div className="space-y-1.5">
        <Label id="op-access-label">Accès minimum (privilege)</Label>
        <Select value={minPrivilege} onValueChange={setMinPrivilege}>
          <SelectTrigger aria-labelledby="op-access-label"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="50">Visiteur+</SelectItem>
            <SelectItem value="100">Aspirant+</SelectItem>
            <SelectItem value="150">Consacré+</SelectItem>
            <SelectItem value="300">Gardien+</SelectItem>
            <SelectItem value="400">Inquisiteur+</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Slots de rôles */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Postes requis</Label>
          {totalSlots > 0 && (
            <Badge variant="outline" className="text-[10px]">{totalSlots} poste{totalSlots > 1 ? 's' : ''}</Badge>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {ROLE_KEYS.map((role) => (
            <div key={role} className="flex items-center justify-between rounded-md border border-border px-3 py-1.5 bg-muted/30">
              <span className="text-xs text-foreground">{OP_ROLES[role]}</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => adjustRole(role, -1)}
                  disabled={roleCounts[role] === 0}
                  className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-30 transition-colors"
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span className={cn('w-4 text-center text-xs font-medium', roleCounts[role] > 0 ? 'text-primary' : 'text-muted-foreground')}>
                  {roleCounts[role]}
                </span>
                <button
                  type="button"
                  onClick={() => adjustRole(role, 1)}
                  className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1" disabled={isPending}>
          Annuler
        </Button>
        <Button type="submit" className="flex-1" disabled={isPending}>
          {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Enregistrement…</> : 'Enregistrer'}
        </Button>
      </div>
    </form>
  )
}
