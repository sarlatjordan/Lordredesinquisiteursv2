'use client'

import { useTransition, useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Trash2, User, UserCheck, Rocket } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { OP_ROLES, type OpRole } from '@/lib/constants'
import { addRoleSlot, removeRoleSlot, assignSlot, assignShipToSlot } from '@/actions/operations'
import type { OpRoleSlot, OpRoleSlotWithProfile, OpRegistrationWithProfile, Ship } from '@/types'

interface OpRoleManagerProps {
  operationId: string
  slots: OpRoleSlotWithProfile[]
  confirmedRegistrations: OpRegistrationWithProfile[]
  ships: Pick<Ship, 'id' | 'name' | 'model' | 'ship_type' | 'is_org_ship' | 'status'>[]
  onUpdate: () => void
}

export function OpRoleManager({ operationId, slots, confirmedRegistrations, ships, onUpdate }: OpRoleManagerProps) {
  const [isPending, startTransition] = useTransition()
  const [addingRole, setAddingRole] = useState<OpRoleSlot['role']>('pilot')
  const [roleError, setRoleError] = useState<string | null>(null)

  function handleAddSlot() {
    setRoleError(null)
    startTransition(async () => {
      const result = await addRoleSlot(operationId, addingRole)
      if (!result.success) { setRoleError(result.error); return }
      onUpdate()
    })
  }

  function handleRemoveSlot(slotId: string) {
    setRoleError(null)
    startTransition(async () => {
      const result = await removeRoleSlot(slotId, operationId)
      if (!result.success) { setRoleError(result.error); return }
      onUpdate()
    })
  }

  function handleAssign(slotId: string, profileId: string | null) {
    setRoleError(null)
    startTransition(async () => {
      const result = await assignSlot(slotId, profileId, operationId)
      if (!result.success) { setRoleError(result.error); return }
      onUpdate()
    })
  }

  function handleAssignShip(slotId: string, shipId: string | null) {
    setRoleError(null)
    startTransition(async () => {
      const result = await assignShipToSlot(slotId, shipId, operationId)
      if (!result.success) { setRoleError(result.error); return }
      onUpdate()
    })
  }

  return (
    <div className="space-y-3">
      {/* Slots existants */}
      {slots.length === 0 ? (
        <p className="text-xs text-muted-foreground py-2">Aucun poste défini.</p>
      ) : (
        <div className="space-y-2">
          {slots.map((slot, i) => {
            const slotRole = slot.role as OpRole
            const assignedName = slot.assigned_profile?.display_name ?? slot.assigned_profile?.username

            return (
              <motion.div
                key={slot.id}
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center gap-2 rounded-md border border-border bg-muted/20 px-3 py-2"
              >
                <span className="text-xs font-medium w-28 shrink-0 text-foreground">
                  {OP_ROLES[slotRole]}
                </span>

                {/* Assignation */}
                <div className="flex-1 min-w-0">
                  {slot.assigned_profile_id ? (
                    <div className="flex items-center gap-1.5">
                      <UserCheck className="h-3.5 w-3.5 text-green-400 shrink-0" />
                      <span className="text-xs text-green-400 truncate">{assignedName}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <User className="h-3.5 w-3.5 shrink-0" />
                      <span className="text-xs">Non assigné</span>
                    </div>
                  )}
                </div>

                {/* Vaisseau assigné */}
                {slot.ship_id && (
                  <span className="hidden sm:flex items-center gap-1 text-xs text-primary/80 shrink-0">
                    <Rocket className="h-3 w-3" />
                    {ships.find(s => s.id === slot.ship_id)?.name ?? '—'}
                  </span>
                )}

                {/* Combobox vaisseau */}
                <ShipCombobox
                  slot={slot}
                  ships={ships}
                  onAssign={(shipId) => handleAssignShip(slot.id, shipId)}
                  disabled={isPending}
                />

                {/* Combobox assignation membre */}
                <AssignCombobox
                  slot={slot}
                  confirmedRegistrations={confirmedRegistrations}
                  onAssign={(profileId) => handleAssign(slot.id, profileId)}
                  disabled={isPending}
                />

                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                  onClick={() => handleRemoveSlot(slot.id)}
                  disabled={isPending}
                  aria-label="Supprimer le poste"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </motion.div>
            )
          })}
        </div>
      )}

      {roleError && (
        <div className="rounded-md bg-destructive/10 border border-destructive/30 px-3 py-2">
          <p className="text-xs text-destructive">{roleError}</p>
        </div>
      )}

      {/* Ajouter un poste */}
      <div className="flex items-center gap-2 pt-1">
        <Select value={addingRole} onValueChange={(v) => setAddingRole(v as OpRoleSlot['role'])}>
          <SelectTrigger className="h-8 text-xs flex-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.entries(OP_ROLES) as [OpRole, string][]).map(([k, v]) => (
              <SelectItem key={k} value={k as string} className="text-xs">{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size="sm" variant="outline" className="h-8 gap-1 text-xs" onClick={handleAddSlot} disabled={isPending}>
          <Plus className="h-3.5 w-3.5" />
          Ajouter
        </Button>
      </div>
    </div>
  )
}

function ShipCombobox({
  slot, ships, onAssign, disabled,
}: {
  slot: OpRoleSlotWithProfile
  ships: Pick<Ship, 'id' | 'name' | 'model' | 'ship_type' | 'is_org_ship' | 'status'>[]
  onAssign: (shipId: string | null) => void
  disabled: boolean
}) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button size="sm" variant="outline" className="h-7 px-2 text-[11px] gap-1" disabled={disabled}>
          <Rocket className="h-3 w-3" />
          {slot.ship_id ? 'Changer' : 'Vaisseau'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-0" align="end">
        <Command>
          <CommandInput placeholder="Chercher un vaisseau..." className="h-8 text-xs" />
          <CommandList>
            <CommandEmpty className="text-xs py-2 text-center text-muted-foreground">Aucun vaisseau.</CommandEmpty>
            <CommandGroup>
              {slot.ship_id && (
                <CommandItem
                  value="__unassign__"
                  onSelect={() => { onAssign(null); setOpen(false) }}
                  className="text-xs text-destructive"
                >
                  Retirer le vaisseau
                </CommandItem>
              )}
              {ships.map((s) => (
                <CommandItem
                  key={s.id}
                  value={`${s.name} ${s.model}`}
                  onSelect={() => { onAssign(s.id); setOpen(false) }}
                  className="text-xs"
                >
                  <Badge
                    variant="outline"
                    className={`mr-2 h-4 w-4 p-0 flex items-center justify-center text-[8px] ${
                      slot.ship_id === s.id ? 'border-primary bg-primary/10' : ''
                    }`}
                  />
                  <span className="truncate">{s.name}</span>
                  <span className="ml-1 text-muted-foreground shrink-0">{s.model}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

function AssignCombobox({
  slot, confirmedRegistrations, onAssign, disabled,
}: {
  slot: OpRoleSlotWithProfile
  confirmedRegistrations: OpRegistrationWithProfile[]
  onAssign: (profileId: string | null) => void
  disabled: boolean
}) {
  const [open, setOpen] = useState(false)

  const options = confirmedRegistrations.map((r) => ({
    id: r.profile_id,
    label: r.profile?.display_name ?? r.profile?.username ?? r.profile_id,
  }))

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button size="sm" variant="outline" className="h-7 px-2 text-[11px]" disabled={disabled}>
          Assigner
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-0" align="end">
        <Command>
          <CommandInput placeholder="Chercher..." className="h-8 text-xs" />
          <CommandList>
            <CommandEmpty className="text-xs py-2 text-center text-muted-foreground">Aucun membre confirmé.</CommandEmpty>
            <CommandGroup>
              {slot.assigned_profile_id && (
                <CommandItem
                  value="__unassign__"
                  onSelect={() => { onAssign(null); setOpen(false) }}
                  className="text-xs text-destructive"
                >
                  Retirer l&apos;assignation
                </CommandItem>
              )}
              {options.map((o) => (
                <CommandItem
                  key={o.id}
                  value={o.id}
                  onSelect={() => { onAssign(o.id); setOpen(false) }}
                  className="text-xs"
                >
                  <Badge
                    variant="outline"
                    className={`mr-2 h-4 w-4 p-0 flex items-center justify-center text-[8px] ${
                      slot.assigned_profile_id === o.id ? 'border-primary bg-primary/10' : ''
                    }`}
                  />
                  {o.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
