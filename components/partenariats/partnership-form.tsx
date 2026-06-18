'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MarkdownEditor } from '@/components/ui/markdown-editor'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  PARTNERSHIP_TYPES, PARTNERSHIP_RELATIONS, PARTNERSHIP_STATUS,
  type PartnershipType, type PartnershipRelation, type PartnershipStatus,
} from '@/lib/constants'
import type { PartnershipInput } from '@/types'

interface PartnershipFormProps {
  initialData?: Partial<PartnershipInput>
  onSubmit: (data: PartnershipInput) => void
  isPending: boolean
  onCancel: () => void
}

export function PartnershipForm({ initialData, onSubmit, isPending, onCancel }: PartnershipFormProps) {
  const [name,          setName]          = useState(initialData?.name           ?? '')
  const [type,          setType]          = useState<PartnershipType>((initialData?.type as PartnershipType) ?? 'org')
  const [relationship,  setRelationship]  = useState<PartnershipRelation>((initialData?.relationship as PartnershipRelation) ?? 'neutral')
  const [contactHandle, setContactHandle] = useState(initialData?.contact_handle ?? '')
  const [orgRsiId,      setOrgRsiId]      = useState(initialData?.org_rsi_id     ?? '')
  const [status,        setStatus]        = useState<PartnershipStatus>((initialData?.status as PartnershipStatus) ?? 'active')
  const [terms,         setTerms]         = useState(initialData?.terms          ?? '')
  const [notes,         setNotes]         = useState(initialData?.notes          ?? '')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit({ name, type, relationship, contact_handle: contactHandle, org_rsi_id: orgRsiId, status, terms, notes })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="p-name">Nom *</Label>
        <Input id="p-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Void Rangers, DarkStar" required />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Type *</Label>
          <Select value={type} onValueChange={(v) => setType(v as PartnershipType)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {(Object.entries(PARTNERSHIP_TYPES) as [PartnershipType, string][]).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Relation *</Label>
          <Select value={relationship} onValueChange={(v) => setRelationship(v as PartnershipRelation)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {(Object.entries(PARTNERSHIP_RELATIONS) as [PartnershipRelation, string][]).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="p-handle">Handle RSI du contact</Label>
          <Input id="p-handle" value={contactHandle} onChange={(e) => setContactHandle(e.target.value)} placeholder="Handle RSI" />
        </div>

        {type === 'org' && (
          <div className="space-y-1.5">
            <Label htmlFor="p-orgid">ID Organisation RSI</Label>
            <Input id="p-orgid" value={orgRsiId} onChange={(e) => setOrgRsiId(e.target.value)} placeholder="Ex: VOIDRNG" />
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <Label>Statut</Label>
        <Select value={status} onValueChange={(v) => setStatus(v as PartnershipStatus)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {(Object.entries(PARTNERSHIP_STATUS) as [PartnershipStatus, string][]).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="p-terms">Termes / Conditions</Label>
        <MarkdownEditor
          id="p-terms"
          value={terms}
          onChange={setTerms}
          placeholder="Termes de l'accord, conditions de l'alliance, zones d'opérations communes…"
          rows={4}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="p-notes">Notes internes</Label>
        <MarkdownEditor
          id="p-notes"
          value={notes}
          onChange={setNotes}
          placeholder="Contexte, historique des relations, points de vigilance…"
          rows={3}
        />
      </div>

      <div className="flex gap-3 pt-1">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1" disabled={isPending}>Annuler</Button>
        <Button type="submit" className="flex-1" disabled={isPending}>
          {isPending ? 'Enregistrement…' : 'Enregistrer'}
        </Button>
      </div>
    </form>
  )
}
