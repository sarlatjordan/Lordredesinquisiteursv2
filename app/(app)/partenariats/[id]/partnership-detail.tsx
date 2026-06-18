'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTransition, useState } from 'react'
import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ExternalLink, Building2, User, Edit, Trash2, FileText, StickyNote } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import {
  PARTNERSHIP_TYPES, PARTNERSHIP_RELATIONS, PARTNERSHIP_RELATION_COLORS,
  PARTNERSHIP_STATUS, PARTNERSHIP_STATUS_COLORS,
  type PartnershipRelation, type PartnershipStatus, type PartnershipType,
} from '@/lib/constants'
import { deletePartnership } from '@/actions/partnerships'
import { MarkdownContent } from '@/components/ui/markdown-content'
import type { Partnership } from '@/types'

interface PartnershipDetailProps {
  partnership: Partnership
  canManage: boolean
  canDelete: boolean
}

export function PartnershipDetail({ partnership: p, canManage, canDelete }: PartnershipDetailProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [deleteOpen, setDeleteOpen] = useState(false)

  const relation  = p.relationship as PartnershipRelation
  const status    = p.status       as PartnershipStatus
  const type      = p.type         as PartnershipType
  const TypeIcon  = type === 'org' ? Building2 : User

  const rsiLink = type === 'org' && p.org_rsi_id
    ? `https://robertsspaceindustries.com/orgs/${p.org_rsi_id}`
    : p.contact_handle
    ? `https://robertsspaceindustries.com/citizens/${p.contact_handle}`
    : null

  function handleDelete() {
    startTransition(async () => {
      const result = await deletePartnership(p.id)
      if (result.success) router.push('/partenariats')
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
        <div className="flex items-start gap-3 flex-wrap">
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 ${PARTNERSHIP_RELATION_COLORS[relation]}`}>
            <TypeIcon className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold">{p.name}</h1>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge variant="outline" className={PARTNERSHIP_RELATION_COLORS[relation]}>
                {PARTNERSHIP_RELATIONS[relation]}
              </Badge>
              <Badge variant="outline" className={PARTNERSHIP_STATUS_COLORS[status]}>
                {PARTNERSHIP_STATUS[status]}
              </Badge>
              <Badge variant="outline" className="text-muted-foreground">
                {PARTNERSHIP_TYPES[type]}
              </Badge>
            </div>
          </div>

          {canManage && (
            <div className="flex gap-2 shrink-0">
              <Button asChild size="sm" variant="outline" className="h-8 gap-1.5 text-xs">
                <Link href={`/partenariats/${p.id}/edit`}>
                  <Edit className="h-3.5 w-3.5" />
                  Modifier
                </Link>
              </Button>
              {canDelete && (
                <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs text-destructive border-destructive/30 hover:bg-destructive/10">
                      <Trash2 className="h-3.5 w-3.5" />
                      Supprimer
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Supprimer ce partenariat ?</DialogTitle>
                      <DialogDescription>
                        &laquo; {p.name} &raquo; sera supprimé définitivement.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setDeleteOpen(false)}>Annuler</Button>
                      <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
                        {isPending ? 'Suppression…' : 'Supprimer'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          )}
        </div>

        {/* Contact */}
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          {p.contact_handle && (
            <span>Contact : <span className="text-foreground font-medium">@{p.contact_handle}</span></span>
          )}
          {rsiLink && (
            <a href={rsiLink} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:underline text-sm">
              Voir sur RSI <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
          <span className="text-muted-foreground/60">Ajouté le {formatDate(p.created_at)}</span>
        </div>
      </motion.div>

      <Separator />

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        {/* Termes */}
        <div className="space-y-6">
          {p.terms ? (
            <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
              <div className="flex items-center gap-2 mb-3">
                <FileText className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Termes et conditions</h3>
              </div>
              <div className="rounded-lg border border-border bg-muted/20 p-4">
                <div className="text-sm text-foreground leading-relaxed"><MarkdownContent>{p.terms}</MarkdownContent></div>
              </div>
            </motion.section>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
              className="rounded-lg border border-dashed border-border bg-muted/10 p-6 text-center">
              <FileText className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Aucun terme renseigné.</p>
            </motion.div>
          )}

          {p.notes && (
            <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
              <div className="flex items-center gap-2 mb-3">
                <StickyNote className="h-4 w-4 text-amber-400" />
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Notes internes</h3>
              </div>
              <div className="rounded-lg border border-amber-400/20 bg-amber-400/5 p-4">
                <div className="text-sm text-foreground leading-relaxed"><MarkdownContent>{p.notes}</MarkdownContent></div>
              </div>
            </motion.section>
          )}
        </div>

        {/* Sidebar infos */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.08 }} className="space-y-4">
          <div className="rounded-lg border border-border bg-card p-4 space-y-3 text-sm">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Informations</h3>
            <div className="space-y-2">
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground shrink-0">Type</span>
                <span className="font-medium text-right">{PARTNERSHIP_TYPES[type]}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground shrink-0">Relation</span>
                <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${PARTNERSHIP_RELATION_COLORS[relation]}`}>
                  {PARTNERSHIP_RELATIONS[relation]}
                </Badge>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground shrink-0">Statut</span>
                <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${PARTNERSHIP_STATUS_COLORS[status]}`}>
                  {PARTNERSHIP_STATUS[status]}
                </Badge>
              </div>
              {p.contact_handle && (
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground shrink-0">Handle</span>
                  <span className="font-mono text-xs text-right truncate">@{p.contact_handle}</span>
                </div>
              )}
              {p.org_rsi_id && (
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground shrink-0">ID Org</span>
                  <span className="font-mono text-xs text-right">{p.org_rsi_id}</span>
                </div>
              )}
              <div className="flex justify-between gap-2 border-t border-border pt-2">
                <span className="text-muted-foreground shrink-0">Ajouté le</span>
                <span className="text-xs text-right">{formatDate(p.created_at)}</span>
              </div>
              {p.updated_at !== p.created_at && (
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground shrink-0">Modifié le</span>
                  <span className="text-xs text-right">{formatDate(p.updated_at)}</span>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
