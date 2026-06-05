'use client'

import { useState, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
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

function StatusBadge({ status }: { status: Application['status'] }) {
  const styles = {
    pending:  'text-amber-400 bg-amber-400/10 border-amber-400/30',
    accepted: 'text-green-400 bg-green-400/10 border-green-400/30',
    refused:  'text-red-400 bg-red-400/10 border-red-400/30',
  }
  const labels = {
    pending:  'En attente',
    accepted: 'Acceptée',
    refused:  'Refusée',
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status]}`}>
      {labels[status]}
    </span>
  )
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
          <Button
            onClick={handleRefuse}
            disabled={isPending}
            variant="destructive"
          >
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
  onAccepted,
  onRefused,
}: {
  application: Application
  onAccepted: (id: string) => void
  onRefused: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [dialog, setDialog] = useState<'accept' | 'refuse' | null>(null)

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className="rounded-xl border border-border bg-card overflow-hidden"
      >
        <div className="p-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-foreground font-mono">{application.rsi_handle}</h3>
                <StatusBadge status={application.status} />
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                <span>Discord : <strong className="text-foreground">{application.discord_handle}</strong></span>
                <span>Email : <strong className="text-foreground">{application.email}</strong></span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Soumis le {formatDate(application.submitted_at)}
                {application.reviewed_at && (
                  <> · Traité le {formatDate(application.reviewed_at)}</>
                )}
              </p>
            </div>

            {application.status === 'pending' && (
              <div className="flex gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-400"
                  onClick={() => setDialog('refuse')}
                >
                  <XCircle className="h-3.5 w-3.5 mr-1" />
                  Refuser
                </Button>
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => setDialog('accept')}
                >
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                  Accepter
                </Button>
              </div>
            )}
          </div>

          {/* Découverte + motivation */}
          <div className="mt-4 space-y-2">
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground/70">Découverte via :</span>{' '}
              {application.how_found}
            </p>

            <div>
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
              >
                {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                {expanded ? 'Masquer' : 'Lire'} la motivation
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
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap border-l-2 border-border pl-3">
                      {application.motivation}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {application.admin_notes && (
              <p className="text-xs text-muted-foreground/70 italic">
                Notes : {application.admin_notes}
              </p>
            )}
          </div>

          {/* Lien RSI */}
          <div className="mt-3">
            <a
              href={`https://robertsspaceindustries.com/en/citizens/${application.rsi_handle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              <ExternalLink className="h-3 w-3" />
              Profil RSI
            </a>
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
    </>
  )
}

// ─── Composant principal ──────────────────────────────────────────────────────

type Tab = 'pending' | 'accepted' | 'refused'

interface CandidaturesClientProps {
  applications: Application[]
}

const TABS: { id: Tab; label: string }[] = [
  { id: 'pending',  label: 'En attente' },
  { id: 'accepted', label: 'Acceptées' },
  { id: 'refused',  label: 'Refusées' },
]

export function CandidaturesClient({ applications: initial }: CandidaturesClientProps) {
  const [applications, setApplications] = useState<Application[]>(initial)

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

  const counts = {
    pending:  applications.filter((a) => a.status === 'pending').length,
    accepted: applications.filter((a) => a.status === 'accepted').length,
    refused:  applications.filter((a) => a.status === 'refused').length,
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="pending">
        <TabsList className="h-auto bg-transparent p-0 gap-2 flex-wrap">
          {TABS.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="group flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors
                data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:border-primary/30
                data-[state=inactive]:bg-card data-[state=inactive]:text-muted-foreground data-[state=inactive]:border-border
                data-[state=inactive]:hover:border-primary/20 data-[state=inactive]:hover:text-foreground"
            >
              {tab.label}
              <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full text-xs font-bold
                group-data-[state=active]:bg-primary/20 group-data-[state=active]:text-primary
                group-data-[state=inactive]:bg-muted group-data-[state=inactive]:text-muted-foreground">
                {counts[tab.id]}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>

        {TABS.map(({ id }) => {
          const items = applications.filter((a) => a.status === id)
          return (
            <TabsContent key={id} value={id} className="mt-6">
              {items.length === 0 ? (
                <div className="py-16 text-center text-muted-foreground">
                  <p className="text-sm">Aucune candidature dans cette catégorie.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <AnimatePresence mode="popLayout">
                    {items.map((app) => (
                      <CandidatureCard
                        key={app.id}
                        application={app}
                        onAccepted={handleAccepted}
                        onRefused={handleRefused}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </TabsContent>
          )
        })}
      </Tabs>
    </div>
  )
}
