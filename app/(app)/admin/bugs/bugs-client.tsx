'use client'

import { useState, useTransition } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Flame, Clock, AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, Loader2, Bug, Lightbulb } from 'lucide-react'
import { updateBugReport } from '@/actions/bug-reports'
import { formatDateTime } from '@/lib/utils'
import type { BugReport } from '@/types'

type BugReportWithProfile = BugReport & {
  profile: { username: string; display_name: string | null } | null
}

const SEVERITY_COLORS: Record<BugReport['severity'], string> = {
  faible:   'bg-green-500/10 text-green-400 border-green-500/20',
  moyen:    'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  eleve:    'bg-orange-500/10 text-orange-400 border-orange-500/20',
  critique: 'bg-red-500/10 text-red-400 border-red-500/20',
}
const SEVERITY_LABELS: Record<BugReport['severity'], string> = {
  faible: 'Faible', moyen: 'Moyen', eleve: 'Élevé', critique: 'Critique',
}
const STATUS_LABELS: Record<BugReport['status'], string> = {
  ouvert: 'Ouvert', en_cours: 'En cours', resolu: 'Résolu', ferme: 'Fermé',
}
const STATUS_COLORS: Record<BugReport['status'], string> = {
  ouvert:   'bg-sky-500/10 text-sky-400 border-sky-500/20',
  en_cours: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  resolu:   'bg-green-500/10 text-green-400 border-green-500/20',
  ferme:    'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
}
const STATUS_ICONS: Record<BugReport['status'], React.ElementType> = {
  ouvert: Clock, en_cours: AlertTriangle, resolu: CheckCircle2, ferme: CheckCircle2,
}

function BugRow({ bug }: { bug: BugReportWithProfile }) {
  const [expanded, setExpanded] = useState(false)
  const [status, setStatus] = useState(bug.status)
  const [note, setNote] = useState(bug.admin_note ?? '')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const StatusIcon = STATUS_ICONS[status]

  function handleSave() {
    setError(null)
    startTransition(async () => {
      const result = await updateBugReport(bug.id, { status, admin_note: note })
      if (!result.success) setError(result.error ?? 'Erreur')
    })
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {bug.severity === 'critique' && <Flame className="h-3.5 w-3.5 text-red-400 shrink-0" />}
          <span className="text-sm font-medium text-foreground truncate">{bug.title}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant="outline" className={`text-xs ${TYPE_COLORS[bug.type ?? 'bug']}`}>
            {(bug.type ?? 'bug') === 'bug'
              ? <Bug className="h-3 w-3 mr-1" />
              : <Lightbulb className="h-3 w-3 mr-1" />
            }
            {TYPE_LABELS[bug.type ?? 'bug']}
          </Badge>
          <Badge variant="outline" className={`text-xs ${SEVERITY_COLORS[bug.severity]}`}>
            {SEVERITY_LABELS[bug.severity]}
          </Badge>
          <Badge variant="outline" className={`text-xs ${STATUS_COLORS[status]}`}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {STATUS_LABELS[status]}
          </Badge>
          <span className="text-xs text-muted-foreground hidden sm:block">
            {bug.profile?.display_name ?? bug.profile?.username ?? '?'}
          </span>
          <span className="text-xs text-muted-foreground/60 hidden md:block">
            {formatDateTime(bug.created_at)}
          </span>
          {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-border bg-muted/10">
          {bug.page_url && (
            <p className="text-xs text-muted-foreground font-mono pt-3">{bug.page_url}</p>
          )}
          <p className="text-sm text-foreground/80 whitespace-pre-wrap">{bug.description}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">Statut</p>
              <Select value={status} onValueChange={(v) => setStatus(v as BugReport['status'])}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ouvert">Ouvert</SelectItem>
                  <SelectItem value="en_cours">En cours</SelectItem>
                  <SelectItem value="resolu">Résolu</SelectItem>
                  <SelectItem value="ferme">Fermé</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">Note pour le membre</p>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Explication, lien commit, workaround…"
                rows={2}
                className="text-xs resize-none"
                maxLength={1000}
              />
            </div>
          </div>

          {error && (
            <p className="text-xs text-destructive">{error}</p>
          )}
          <div className="flex justify-end">
            <Button size="sm" onClick={handleSave} disabled={isPending}>
              {isPending && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
              Enregistrer
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

const TYPE_COLORS: Record<string, string> = {
  bug:          'bg-red-500/10 text-red-400 border-red-500/20',
  amelioration: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
}
const TYPE_LABELS: Record<string, string> = {
  bug:          'Bug',
  amelioration: 'Idée',
}

const FILTER_STATUS = ['tous', 'ouvert', 'en_cours', 'resolu', 'ferme'] as const
const FILTER_TYPE = ['tous', 'bug', 'amelioration'] as const
type FilterStatus = typeof FILTER_STATUS[number]
type FilterType = typeof FILTER_TYPE[number]

export function BugsClient({ bugs }: { bugs: BugReportWithProfile[] }) {
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('ouvert')
  const [filterType, setFilterType] = useState<FilterType>('tous')

  const filtered = bugs
    .filter(b => filterStatus === 'tous' || b.status === filterStatus)
    .filter(b => filterType === 'tous' || (b.type ?? 'bug') === filterType)

  const counts = bugs.reduce((acc, b) => { acc[b.status] = (acc[b.status] ?? 0) + 1; return acc }, {} as Record<string, number>)
  const typeCounts = bugs.reduce((acc, b) => { const t = b.type ?? 'bug'; acc[t] = (acc[t] ?? 0) + 1; return acc }, {} as Record<string, number>)

  return (
    <div className="space-y-4">
      {/* Filtres statut */}
      <div className="flex gap-2 flex-wrap">
        {FILTER_STATUS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFilterStatus(s)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              filterStatus === s
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-muted/30 text-muted-foreground border-border hover:border-border/80 hover:text-foreground'
            }`}
          >
            {s === 'tous' ? 'Tous' : STATUS_LABELS[s as BugReport['status']]}
            {s !== 'tous' && counts[s] ? ` (${counts[s]})` : ''}
            {s === 'tous' && ` (${bugs.length})`}
          </button>
        ))}
      </div>
      {/* Filtres type */}
      <div className="flex gap-2 flex-wrap">
        {FILTER_TYPE.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setFilterType(t)}
            className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              filterType === t
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-muted/30 text-muted-foreground border-border hover:border-border/80 hover:text-foreground'
            }`}
          >
            {t === 'bug' && <Bug className="h-3 w-3" />}
            {t === 'amelioration' && <Lightbulb className="h-3 w-3" />}
            {t === 'tous' ? 'Tous types' : TYPE_LABELS[t]}
            {t !== 'tous' && typeCounts[t] ? ` (${typeCounts[t]})` : ''}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">Aucun élément dans cette catégorie.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map(bug => <BugRow key={bug.id} bug={bug} />)}
        </div>
      )}
    </div>
  )
}
