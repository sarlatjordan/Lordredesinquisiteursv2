'use client'

import { useRef, useState, useTransition } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Bug, Clock, AlertTriangle, Flame, Loader2 } from 'lucide-react'
import { submitBugReport } from '@/actions/bug-reports'
import { formatDateTime } from '@/lib/utils'
import type { BugReport } from '@/types'

const SEVERITY_LABELS: Record<BugReport['severity'], string> = {
  faible:   'Faible',
  moyen:    'Moyen',
  eleve:    'Élevé',
  critique: 'Critique',
}

const SEVERITY_COLORS: Record<BugReport['severity'], string> = {
  faible:   'bg-green-500/10 text-green-400 border-green-500/20',
  moyen:    'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  eleve:    'bg-orange-500/10 text-orange-400 border-orange-500/20',
  critique: 'bg-red-500/10 text-red-400 border-red-500/20',
}

const STATUS_LABELS: Record<BugReport['status'], string> = {
  ouvert:   'Ouvert',
  en_cours: 'En cours',
  resolu:   'Résolu',
  ferme:    'Fermé',
}

const STATUS_COLORS: Record<BugReport['status'], string> = {
  ouvert:   'bg-sky-500/10 text-sky-400 border-sky-500/20',
  en_cours: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  resolu:   'bg-green-500/10 text-green-400 border-green-500/20',
  ferme:    'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
}

const STATUS_ICONS: Record<BugReport['status'], React.ElementType> = {
  ouvert:   Clock,
  en_cours: AlertTriangle,
  resolu:   CheckCircle2,
  ferme:    CheckCircle2,
}

interface Props { ownReports: BugReport[] }

export function RapportBugClient({ ownReports }: Props) {
  const formRef = useRef<HTMLFormElement>(null)
  const [severity, setSeverity] = useState<BugReport['severity']>('moyen')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    const fd = new FormData(e.currentTarget)
    fd.set('severity', severity)
    startTransition(async () => {
      const result = await submitBugReport(fd)
      if (result.success) {
        setSuccess(true)
        formRef.current?.reset()
        setSeverity('moyen')
      } else {
        setError(result.error ?? 'Erreur')
      }
    })
  }

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Formulaire */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <div className="rounded-xl border border-border bg-card p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-destructive/10 border border-destructive/20">
              <Bug className="h-4 w-4 text-destructive" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Nouveau rapport</h3>
              <p className="text-xs text-muted-foreground">Décris le problème rencontré</p>
            </div>
          </div>

          <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="title">Titre <span className="text-destructive">*</span></Label>
              <Input id="title" name="title" placeholder="Résumé court du problème" required minLength={3} maxLength={150} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="severity">Sévérité</Label>
                <Select value={severity} onValueChange={(v) => setSeverity(v as BugReport['severity'])}>
                  <SelectTrigger id="severity">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="faible">Faible — gêne mineure</SelectItem>
                    <SelectItem value="moyen">Moyen — fonctionnalité dégradée</SelectItem>
                    <SelectItem value="eleve">Élevé — blocage partiel</SelectItem>
                    <SelectItem value="critique">Critique — bloquant total</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="page_url">Page concernée</Label>
                <Input id="page_url" name="page_url" placeholder="ex: /evenements" maxLength={500} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Description <span className="text-destructive">*</span></Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Décris le bug : ce que tu faisais, ce qui s'est passé, ce qui était attendu…"
                rows={5}
                required
                minLength={10}
                maxLength={4000}
              />
            </div>

            {error && (
              <p className="rounded-md bg-destructive/10 border border-destructive/30 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}

            {success && (
              <p className="rounded-md bg-green-500/10 border border-green-500/20 px-3 py-2 text-sm text-green-400 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                Rapport envoyé — merci ! On s&apos;en occupe dès que possible.
              </p>
            )}

            <div className="flex justify-end">
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Envoyer le rapport
              </Button>
            </div>
          </form>
        </div>
      </motion.div>

      {/* Mes rapports */}
      {ownReports.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Mes rapports ({ownReports.length})
          </h3>
          <div className="space-y-3">
            {ownReports.map((r) => {
              const StatusIcon = STATUS_ICONS[r.status]
              return (
                <div key={r.id} className="rounded-xl border border-border bg-card/60 p-4 space-y-2">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <p className="text-sm font-medium text-foreground">{r.title}</p>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Badge variant="outline" className={`text-xs ${SEVERITY_COLORS[r.severity]}`}>
                        {r.severity === 'critique' && <Flame className="h-3 w-3 mr-1" />}
                        {SEVERITY_LABELS[r.severity]}
                      </Badge>
                      <Badge variant="outline" className={`text-xs ${STATUS_COLORS[r.status]}`}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {STATUS_LABELS[r.status]}
                      </Badge>
                    </div>
                  </div>
                  {r.page_url && (
                    <p className="text-xs text-muted-foreground font-mono">{r.page_url}</p>
                  )}
                  <p className="text-xs text-muted-foreground line-clamp-2">{r.description}</p>
                  {r.admin_note && (
                    <div className="rounded-md bg-primary/5 border border-primary/15 px-3 py-2">
                      <p className="text-xs text-primary/80">
                        <span className="font-semibold">Note admin :</span> {r.admin_note}
                      </p>
                    </div>
                  )}
                  <p className="text-[10px] text-muted-foreground/60">{formatDateTime(r.created_at)}</p>
                </div>
              )
            })}
          </div>
        </motion.div>
      )}
    </div>
  )
}
