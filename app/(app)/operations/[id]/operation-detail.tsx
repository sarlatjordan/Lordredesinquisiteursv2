'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import {
  OP_TYPES, OP_TYPE_COLORS, OP_STATUS, OP_STATUS_COLORS,
  OP_RISK, OP_RISK_COLORS, OP_ROLES,
  type OpType, type OpStatus, type OpRisk, type OpRole,
} from '@/lib/constants'
import { formatDateTime } from '@/lib/utils'
import { OpRegisterDialog } from '@/components/operations/op-register-dialog'
import { OpRoleManager } from '@/components/operations/op-role-manager'
import { OpRegistrationsPanel } from '@/components/operations/op-registrations-panel'
import { OpResourcesPanel } from '@/components/operations/op-resources-panel'
import { deleteOperation, saveOperationDebrief, updateOperation } from '@/actions/operations'
import type { OperationWithDetails, Profile, Ship, InventoryItemWithStock } from '@/types'
import { Clock, MapPin, Shield, Timer, Edit, Trash2, Users, Loader2, PlayCircle, CheckCircle2, XCircle } from 'lucide-react'
import { MarkdownEditor } from '@/components/ui/markdown-editor'
import { MarkdownContent } from '@/components/ui/markdown-content'
import { LootPanel } from '@/components/operations/loot-panel'
import { Label } from '@/components/ui/label'

interface OperationDetailProps {
  operation: OperationWithDetails
  currentUserId: string
  canManage: boolean
  members: Pick<Profile, 'id' | 'username' | 'display_name'>[]
  inventoryItems: InventoryItemWithStock[]
  loots: import('@/types').OperationLootWithShares[]
  ships: Pick<Ship, 'id' | 'name' | 'model' | 'ship_type' | 'is_org_ship' | 'status'>[]
}

export function OperationDetail({ operation: initialOp, currentUserId, canManage, members, inventoryItems, loots, ships }: OperationDetailProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [loadingStatus, setLoadingStatus] = useState<string | null>(null)
  const op = initialOp
  const [debrief, setDebrief] = useState(op.debrief ?? '')
  const [debriefSaved, setDebriefSaved] = useState(false)
  const [debriefError, setDebriefError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const opType    = op.type      as OpType
  const opStatus  = op.status    as OpStatus
  const opRisk    = op.risk_level as OpRisk

  const isPast = opStatus === 'completed' || opStatus === 'cancelled'
  const isCommanderOrManager = canManage || op.commander_id === currentUserId

  const confirmedRegistrations = (op.registrations ?? []).filter((r) => r.status === 'confirmed')

  const durationLabel = op.estimated_duration_min
    ? op.estimated_duration_min >= 60
      ? `${Math.floor(op.estimated_duration_min / 60)}h${op.estimated_duration_min % 60 > 0 ? (op.estimated_duration_min % 60) + 'm' : ''}`
      : `${op.estimated_duration_min}m`
    : null

  function handleDelete() {
    setActionError(null)
    startTransition(async () => {
      const result = await deleteOperation(op.id)
      if (result.success) router.push('/operations')
      else setActionError(result.error)
    })
  }

  function handleStatus(status: 'active' | 'completed' | 'cancelled') {
    setActionError(null)
    setLoadingStatus(status)
    startTransition(async () => {
      const result = await updateOperation(op.id, { status })
      setLoadingStatus(null)
      if (!result.success) { setActionError(result.error); return }
      router.refresh()
    })
  }

  function handleSaveDebrief() {
    setDebriefSaved(false)
    setDebriefError(null)
    startTransition(async () => {
      const result = await saveOperationDebrief(op.id, debrief)
      if (result.success) {
        setDebriefSaved(true)
        router.refresh()
      } else {
        setDebriefError(result.error)
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-3"
      >
        <div className="flex items-start gap-2 flex-wrap">
          <Badge variant="outline" className={`${OP_TYPE_COLORS[opType]}`}>
            {OP_TYPES[opType]}
          </Badge>
          <Badge variant="outline" className={`${OP_STATUS_COLORS[opStatus]}`}>
            {OP_STATUS[opStatus]}
          </Badge>
          <Badge variant="outline" className={`${OP_RISK_COLORS[opRisk]}`}>
            <Shield className="h-3 w-3 mr-1" />
            Risque {OP_RISK[opRisk]}
          </Badge>
          <div className="ml-auto flex items-center gap-2 flex-wrap">
            {canManage && (
              <>
                {opStatus === 'planned' && (
                  <Button
                    size="sm" variant="outline"
                    className="h-8 gap-1.5 text-xs text-blue-400 border-blue-400/30 hover:bg-blue-400/10"
                    disabled={isPending}
                    onClick={() => handleStatus('active')}
                  >
                    {loadingStatus === 'active' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <PlayCircle className="h-3.5 w-3.5" />}
                    Lancer
                  </Button>
                )}
                {(opStatus === 'planned' || opStatus === 'active') && (
                  <>
                    <Button
                      size="sm" variant="outline"
                      className="h-8 gap-1.5 text-xs text-green-400 border-green-400/30 hover:bg-green-400/10"
                      disabled={isPending}
                      onClick={() => handleStatus('completed')}
                    >
                      {loadingStatus === 'completed' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                      Terminer
                    </Button>
                    <Button
                      size="sm" variant="outline"
                      className="h-8 gap-1.5 text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
                      disabled={isPending}
                      onClick={() => handleStatus('cancelled')}
                    >
                      {loadingStatus === 'cancelled' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
                      Annuler
                    </Button>
                  </>
                )}
                <Button asChild size="sm" variant="outline" className="h-8 gap-1.5 text-xs">
                  <Link href={`/operations/${op.id}/edit`}>
                    <Edit className="h-3.5 w-3.5" />
                    Modifier
                  </Link>
                </Button>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs text-destructive border-destructive/30 hover:bg-destructive/10">
                      <Trash2 className="h-3.5 w-3.5" />
                      Supprimer
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Supprimer l&apos;opération ?</DialogTitle>
                      <DialogDescription>
                        Cette action supprime définitivement &laquo; {op.title} &raquo; et toutes les inscriptions associées.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button variant="outline">Annuler</Button>
                      <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={isPending}
                      >
                        {isPending ? 'Suppression...' : 'Supprimer'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </>
            )}
          </div>
        </div>

        {actionError && (
          <div className="rounded-md bg-destructive/10 border border-destructive/30 px-3 py-2">
            <p className="text-xs text-destructive">{actionError}</p>
          </div>
        )}

        <h1 className="text-3xl font-bold text-foreground">{op.title}</h1>

        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <MapPin className="h-4 w-4 text-primary" />
            Système {op.system_name}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-primary" />
            {formatDateTime(op.departure_at)}
          </span>
          {durationLabel && (
            <span className="flex items-center gap-1.5">
              <Timer className="h-4 w-4 text-primary" />
              ~{durationLabel}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <Users className="h-4 w-4 text-primary" />
            {op.registration_count ?? 0} inscrit{(op.registration_count ?? 0) !== 1 ? 's' : ''}
          </span>
        </div>

        {op.commander && (
          <div className="flex items-center gap-2">
            <Avatar className="h-7 w-7">
              <AvatarImage src={op.commander.avatar_url ?? undefined} />
              <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                {(op.commander.display_name ?? op.commander.username ?? 'C').slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground">
              Commandant : <span className="text-foreground font-medium">{op.commander.display_name ?? op.commander.username}</span>
            </span>
          </div>
        )}
      </motion.div>

      <Separator />

      {/* Corps en deux colonnes */}
      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        {/* Colonne gauche — briefing + inscription perso */}
        <div className="space-y-6">
          {op.description ? (
            <motion.section
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Briefing</h3>
              <div className="rounded-lg border border-border bg-muted/20 p-4">
                <div className="text-sm text-foreground leading-relaxed"><MarkdownContent>{op.description}</MarkdownContent></div>
              </div>
            </motion.section>
          ) : null}

          {/* Inscription membre */}
          {!isPast && (
            <motion.section
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Mon inscription</h3>
              <OpRegisterDialog
                operationId={op.id}
                myRegistration={op.my_registration ?? null}
                onSuccess={() => router.refresh()}
              />
            </motion.section>
          )}
        </div>

        {/* Colonne droite — rôles + gestion inscriptions */}
        <div className="space-y-6">
          {/* Slots de rôles */}
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
          >
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Postes ({op.role_slots?.length ?? 0})
            </h3>

            {isCommanderOrManager ? (
              <OpRoleManager
                operationId={op.id}
                slots={op.role_slots ?? []}
                confirmedRegistrations={confirmedRegistrations}
                ships={ships}
                onUpdate={() => router.refresh()}
              />
            ) : (
              /* Vue lecture seule */
              <div className="space-y-1.5">
                {(op.role_slots ?? []).length === 0 ? (
                  <p className="text-xs text-muted-foreground">Aucun poste défini.</p>
                ) : (
                  (op.role_slots ?? []).map((slot) => {
                    const slotRole = slot.role as OpRole
                    const assignedName = slot.assigned_profile?.display_name ?? slot.assigned_profile?.username
                    return (
                      <div key={slot.id} className="flex items-center justify-between rounded-md border border-border bg-muted/20 px-3 py-2">
                        <span className="text-xs font-medium">{OP_ROLES[slotRole]}</span>
                        <span className={`text-xs ${assignedName ? 'text-green-400' : 'text-muted-foreground'}`}>
                          {assignedName ?? '—'}
                        </span>
                      </div>
                    )
                  })
                )}
              </div>
            )}
          </motion.section>

          {/* Gestion inscriptions (Gardien+ / commandant) */}
          {isCommanderOrManager && (
            <motion.section
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Inscriptions ({(op.registrations ?? []).length})
              </h3>
              <OpRegistrationsPanel
                operationId={op.id}
                registrations={op.registrations ?? []}
                onUpdate={() => router.refresh()}
              />
            </motion.section>
          )}

          {/* Ressources opération */}
          {(isCommanderOrManager || (op.resources ?? []).length > 0) && (
            <motion.section
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.22 }}
            >
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Ressources ({(op.resources ?? []).filter(r => r.status !== 'released').length})
              </h3>
              {isCommanderOrManager ? (
                <OpResourcesPanel
                  operationId={op.id}
                  resources={op.resources ?? []}
                  inventoryItems={inventoryItems}
                  onUpdate={() => router.refresh()}
                />
              ) : (
                <ul className="space-y-1.5">
                  {(op.resources ?? []).filter(r => r.status !== 'released').map((res) => (
                    <li key={res.id} className="flex items-center justify-between rounded-md border border-border bg-muted/20 px-3 py-2 text-xs">
                      <span className="font-medium">{res.item_name}</span>
                      <span className="text-muted-foreground">{res.quantity} {res.unit}</span>
                    </li>
                  ))}
                </ul>
              )}
            </motion.section>
          )}
        </div>
      </div>

      {/* Section débrief */}
      {(isCommanderOrManager || op.debrief) && (
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Separator className="mb-6" />
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Débrief
          </h3>

          {isCommanderOrManager ? (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="debrief" className="sr-only">Débrief</Label>
                <MarkdownEditor
                  id="debrief"
                  value={debrief}
                  onChange={(v) => { setDebrief(v); setDebriefSaved(false) }}
                  placeholder="Résumé de l'opération, résultats, points d'amélioration…"
                  rows={8}
                />
              </div>
              {debriefError && (
                <div className="rounded-md bg-destructive/10 border border-destructive/30 px-3 py-2">
                  <p className="text-xs text-destructive">{debriefError}</p>
                </div>
              )}
              <div className="flex items-center justify-between">
                {debriefSaved ? (
                  <p className="text-xs text-green-400">Débrief enregistré</p>
                ) : <span />}
                <Button size="sm" onClick={handleSaveDebrief} disabled={isPending}>
                  {isPending && <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />}
                  Enregistrer le débrief
                </Button>
              </div>
            </div>
          ) : (
            op.debrief && (
              <div className="rounded-lg border border-border bg-muted/20 p-4">
                <div className="text-sm text-foreground leading-relaxed"><MarkdownContent>{op.debrief}</MarkdownContent></div>
              </div>
            )
          )}
        </motion.section>
      )}

      {/* Section Butin */}
      {(op.status === 'completed' || loots.length > 0) && (
        <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div className="rounded-lg border border-border bg-muted/20 p-4">
            <LootPanel
              operationId={op.id}
              loots={loots}
              participants={(op.registrations ?? [])
                .filter((r) => r.status === 'confirmed')
                .map((r) => r.profile)
                .filter(Boolean) as import('@/types').Profile[]}
              canManage={canManage}
            />
          </div>
        </motion.section>
      )}
    </div>
  )
}
