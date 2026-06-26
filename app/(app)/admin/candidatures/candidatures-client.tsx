'use client'

import { useState, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  acceptApplication,
  rejectApplication,
  moveToDiscussion,
  regenerateMagicLink,
} from '@/actions/applications'
import type { Application } from '@/types'
import {
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Loader2,
  ExternalLink,
  MessageSquare,
  ArrowRight,
  RefreshCw,
} from 'lucide-react'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

// ─── Dialog Accepter ──────────────────────────────────────────────────────────

function AcceptDialog({
  application,
  onClose,
  onAccepted,
}: {
  application: Application
  onClose: () => void
  onAccepted: (id: string) => void
}) {
  const [isPending, startTransition] = useTransition()
  const [magicLink, setMagicLink] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  function handleAccept() {
    setError(null)
    startTransition(async () => {
      const result = await acceptApplication(application.id)
      if (result.success) {
        setMagicLink(result.magicLink)
        onAccepted(application.id)
      } else {
        setError(result.error)
      }
    })
  }

  async function handleCopy() {
    if (!magicLink) return
    await navigator.clipboard.writeText(magicLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Accepter la candidature</DialogTitle>
          <DialogDescription>
            {magicLink
              ? 'La candidature a été acceptée. Transmettez le lien ci-dessous au nouveau membre via Discord.'
              : `Accepter la candidature de ${application.rsi_handle} ?`}
          </DialogDescription>
        </DialogHeader>

        {!magicLink && (
          <div className="text-sm text-muted-foreground space-y-2 py-2">
            <p>Cette action va :</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Créer un compte Supabase pour <strong className="text-foreground">{application.email}</strong></li>
              <li>Attribuer le rang <strong className="text-foreground">Aspirant</strong></li>
              <li>Générer un lien de première connexion (valable 24h)</li>
            </ul>
          </div>
        )}

        {magicLink && (
          <div className="space-y-3 py-2">
            <div className="flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/5 px-3 py-2.5">
              <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />
              <span className="text-sm text-green-400 font-medium">Candidature acceptée avec succès</span>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">
                Lien de première connexion (valable 24h)
              </p>
              <div className="flex gap-2">
                <code className="flex-1 rounded-md border border-border bg-muted px-3 py-2 text-xs text-foreground break-all font-mono">
                  {magicLink}
                </code>
                <Button size="sm" variant="outline" onClick={handleCopy} className="shrink-0">
                  {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">
                Envoyez ce lien au nouveau membre via Discord. Il expire dans 24h.
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
            <XCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {magicLink ? 'Fermer' : 'Annuler'}
          </Button>
          {!magicLink && (
            <Button onClick={handleAccept} disabled={isPending} className="bg-green-600 hover:bg-green-700 text-white">
              {isPending ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Traitement…</>
              ) : (
                <><CheckCircle2 className="h-4 w-4 mr-2" />Confirmer l&apos;acceptation</>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Dialog Regénérer lien ────────────────────────────────────────────────────

function RegenerateLinkDialog({
  application,
  onClose,
}: {
  application: Application
  onClose: () => void
}) {
  const [isPending, startTransition] = useTransition()
  const [magicLink, setMagicLink] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  function handleGenerate() {
    setError(null)
    startTransition(async () => {
      const result = await regenerateMagicLink(application.id)
      if (result.success) {
        setMagicLink(result.magicLink)
      } else {
        setError(result.error)
      }
    })
  }

  async function handleCopy() {
    if (!magicLink) return
    await navigator.clipboard.writeText(magicLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Regénérer le lien de connexion</DialogTitle>
          <DialogDescription>
            {magicLink
              ? 'Lien généré. Envoyez-le à ' + application.rsi_handle + ' via Discord.'
              : `Générer un nouveau lien de première connexion pour ${application.rsi_handle} (${application.email})`}
          </DialogDescription>
        </DialogHeader>

        {magicLink && (
          <div className="space-y-3 py-2">
            <div className="flex gap-2">
              <code className="flex-1 rounded-md border border-border bg-muted px-3 py-2 text-xs text-foreground break-all font-mono">
                {magicLink}
              </code>
              <Button size="sm" variant="outline" onClick={handleCopy} className="shrink-0">
                {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Ce lien expire dans 24h.</p>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
            <XCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{magicLink ? 'Fermer' : 'Annuler'}</Button>
          {!magicLink && (
            <Button onClick={handleGenerate} disabled={isPending}>
              {isPending ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Génération…</>
              ) : (
                <><RefreshCw className="h-4 w-4 mr-2" />Générer le lien</>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Dialog Refuser ───────────────────────────────────────────────────────────

function RefuseDialog({
  application,
  onClose,
  onRefused,
}: {
  application: Application
  onClose: () => void
  onRefused: (id: string) => void
}) {
  const [isPending, startTransition] = useTransition()
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)

  function handleRefuse() {
    setError(null)
    startTransition(async () => {
      const result = await rejectApplication(application.id, notes.trim() || undefined)
      if (result.success) {
        onRefused(application.id)
        onClose()
      } else {
        setError(result.error)
      }
    })
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Refuser la candidature</DialogTitle>
          <DialogDescription>
            Refuser la candidature de {application.rsi_handle} ?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div>
            <label htmlFor="refuse-notes" className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">
              Notes internes (optionnel)
            </label>
            <Textarea
              id="refuse-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Raison du refus, contexte… (visible uniquement par les Sages)"
              className="resize-none"
            />
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
            <XCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={handleRefuse} disabled={isPending} variant="destructive">
            {isPending ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Traitement…</>
            ) : (
              <><XCircle className="h-4 w-4 mr-2" />Confirmer le refus</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Card candidature ─────────────────────────────────────────────────────────

function CandidatureCard({
  application,
  onMoved,
  onAccepted,
  onRefused,
}: {
  application: Application
  onMoved: (id: string, status: Application['status']) => void
  onAccepted: (id: string) => void
  onRefused: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [dialog, setDialog] = useState<'accept' | 'refuse' | 'regen' | null>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleMoveToDiscussion() {
    setError(null)
    startTransition(async () => {
      const result = await moveToDiscussion(application.id)
      if (result.success) {
        onMoved(application.id, 'en_discussion')
      } else {
        setError(result.error ?? 'Erreur')
      }
    })
  }

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="rounded-xl border border-border bg-card overflow-hidden"
      >
        <div className="p-4">
          <div className="space-y-1 mb-3">
            <h3 className="font-semibold text-foreground font-mono text-sm">{application.rsi_handle}</h3>
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
              <span>Discord : <strong className="text-foreground">{application.discord_handle}</strong></span>
              <span className="truncate max-w-[160px]">{application.email}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {formatDate(application.submitted_at)}
            </p>
          </div>

          <p className="text-xs text-muted-foreground mb-3">
            <span className="text-foreground/60">Via :</span> {application.how_found}
          </p>

          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors mb-2"
          >
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            {expanded ? 'Masquer' : 'Voir'} la motivation
          </button>

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap border-l-2 border-border pl-3 mb-3">
                  {application.motivation}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {application.admin_notes && (
            <p className="text-xs text-muted-foreground/70 italic mb-3">
              Notes : {application.admin_notes}
            </p>
          )}

          {error && (
            <p className="text-xs text-destructive mb-2">{error}</p>
          )}

          <div className="flex items-center gap-2 flex-wrap">
            <a
              href={`https://robertsspaceindustries.com/en/citizens/${application.rsi_handle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              <ExternalLink className="h-3 w-3" />
              RSI
            </a>

            {application.status === 'pending' && (
              <Button
                size="sm"
                variant="outline"
                disabled={isPending}
                onClick={handleMoveToDiscussion}
                className="ml-auto text-xs h-7 border-blue-500/30 text-blue-400 hover:bg-blue-500/10 hover:text-blue-400"
              >
                {isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <>
                    <MessageSquare className="h-3 w-3 mr-1" />
                    En discussion
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </>
                )}
              </Button>
            )}

            {application.status === 'accepted' && (
              <Button
                size="sm"
                variant="outline"
                className="ml-auto text-xs h-7"
                onClick={() => setDialog('regen')}
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Regénérer le lien
              </Button>
            )}

            {application.status === 'en_discussion' && (
              <div className="ml-auto flex gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs h-7 border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-400"
                  onClick={() => setDialog('refuse')}
                >
                  <XCircle className="h-3 w-3 mr-1" />
                  Refuser
                </Button>
                <Button
                  size="sm"
                  className="text-xs h-7 bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => setDialog('accept')}
                >
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Accepter
                </Button>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {dialog === 'accept' && (
        <AcceptDialog
          application={application}
          onClose={() => setDialog(null)}
          onAccepted={onAccepted}
        />
      )}
      {dialog === 'refuse' && (
        <RefuseDialog
          application={application}
          onClose={() => setDialog(null)}
          onRefused={onRefused}
        />
      )}
      {dialog === 'regen' && (
        <RegenerateLinkDialog
          application={application}
          onClose={() => setDialog(null)}
        />
      )}
    </>
  )
}

// ─── Colonne Kanban ───────────────────────────────────────────────────────────

type ColumnConfig = {
  id: Application['status']
  label: string
  color: string
  headerColor: string
  dotColor: string
}

const COLUMNS: ColumnConfig[] = [
  {
    id: 'pending',
    label: 'Reçu',
    color: 'border-amber-500/20 bg-amber-500/3',
    headerColor: 'text-amber-400',
    dotColor: 'bg-amber-400',
  },
  {
    id: 'en_discussion',
    label: 'En discussion',
    color: 'border-blue-500/20 bg-blue-500/3',
    headerColor: 'text-blue-400',
    dotColor: 'bg-blue-400',
  },
  {
    id: 'accepted',
    label: 'Accepté',
    color: 'border-green-500/20 bg-green-500/3',
    headerColor: 'text-green-400',
    dotColor: 'bg-green-400',
  },
  {
    id: 'refused',
    label: 'Refusé',
    color: 'border-red-500/20 bg-red-500/3',
    headerColor: 'text-red-400',
    dotColor: 'bg-red-400',
  },
]

// ─── Composant principal ──────────────────────────────────────────────────────

interface CandidaturesClientProps {
  applications: Application[]
}

export function CandidaturesClient({ applications: initial }: CandidaturesClientProps) {
  const [applications, setApplications] = useState<Application[]>(initial)

  function handleMoved(id: string, status: Application['status']) {
    setApplications((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status } : a))
    )
  }

  function handleAccepted(id: string) {
    setApplications((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, status: 'accepted', reviewed_at: new Date().toISOString() } : a
      )
    )
  }

  function handleRefused(id: string) {
    setApplications((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, status: 'refused', reviewed_at: new Date().toISOString() } : a
      )
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {COLUMNS.map((col) => {
        const items = applications.filter((a) => a.status === col.id)
        return (
          <div
            key={col.id}
            className={`rounded-xl border ${col.color} flex flex-col min-h-[200px]`}
          >
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50">
              <span className={`h-2 w-2 rounded-full ${col.dotColor}`} />
              <span className={`text-sm font-semibold ${col.headerColor}`}>{col.label}</span>
              <span className="ml-auto text-xs font-bold text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                {items.length}
              </span>
            </div>

            <div className="flex-1 p-3 space-y-3 overflow-y-auto max-h-[calc(100vh-280px)]">
              <AnimatePresence mode="popLayout">
                {items.length === 0 ? (
                  <p className="text-xs text-muted-foreground/50 text-center py-8">
                    Aucune candidature
                  </p>
                ) : (
                  items.map((app) => (
                    <CandidatureCard
                      key={app.id}
                      application={app}
                      onMoved={handleMoved}
                      onAccepted={handleAccepted}
                      onRefused={handleRefused}
                    />
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>
        )
      })}
    </div>
  )
}
