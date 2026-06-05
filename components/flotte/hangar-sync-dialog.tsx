'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import { RefreshCw, Upload, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { syncHangarFromCsv } from '@/actions/hangar-sync'
import { useRouter } from 'next/navigation'

type SyncStatus =
  | { type: 'idle' }
  | { type: 'success'; data: { added: number; skipped: number; total: number } }
  | { type: 'error'; message: string }

interface HangarSyncDialogProps {
  targetProfileId?: string
}

export function HangarSyncDialog({ targetProfileId }: HangarSyncDialogProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [status, setStatus] = useState<SyncStatus>({ type: 'idle' })
  const [csvContent, setCsvContent] = useState('')
  const [bookmarkletHref, setBookmarkletHref] = useState<string | null>(null)
  const bookmarkletLinkRef = useRef<HTMLAnchorElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    if (!open || bookmarkletHref !== null) return
    fetch('/api/hangar-bookmarklet')
      .then(r => r.json())
      .then(({ bookmarklet }: { bookmarklet?: string }) => setBookmarkletHref(bookmarklet ?? ''))
      .catch(() => setBookmarkletHref(''))
  }, [open, bookmarkletHref])

  // Contourne la validation javascript: de React en passant par le DOM directement
  useEffect(() => {
    if (bookmarkletLinkRef.current && bookmarkletHref) {
      bookmarkletLinkRef.current.setAttribute('href', bookmarkletHref)
    }
  }, [bookmarkletHref])

  function reset() {
    setStatus({ type: 'idle' })
    setCsvContent('')
  }

  function handleOpenChange(v: boolean) {
    setOpen(v)
    if (!v) reset()
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setCsvContent(ev.target?.result as string ?? '')
    reader.readAsText(file)
  }

  function handleCsvSync() {
    if (!csvContent) return
    startTransition(async () => {
      setStatus({ type: 'idle' })
      const result = await syncHangarFromCsv(csvContent, targetProfileId)
      if (result.success) {
        setStatus({ type: 'success', data: result.data })
        router.refresh()
      } else {
        setStatus({ type: 'error', message: result.error })
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <RefreshCw className="h-4 w-4" />
          Sync hangar
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Synchroniser le hangar</DialogTitle>
          <DialogDescription>Importe tes vaisseaux depuis la page RSI My Hangar ou via fichier CSV.</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="bookmarklet" className="mt-2">
          <TabsList className="w-full">
            <TabsTrigger value="bookmarklet" className="flex-1">Favori navigateur</TabsTrigger>
            <TabsTrigger value="csv" className="flex-1">CSV</TabsTrigger>
          </TabsList>

          {/* ── Onglet Bookmarklet ───────────────────────────────────────────── */}
          <TabsContent value="bookmarklet" className="space-y-5 pt-2">
            {/* Étape 1 */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-[11px] font-bold text-primary shrink-0">1</span>
                <p className="text-sm text-foreground font-medium">Glisse ce bouton dans ta barre de favoris</p>
              </div>
              <div className="flex justify-center py-3 rounded-lg border border-dashed border-border bg-muted/20">
                {bookmarkletHref === null ? (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Chargement…
                  </div>
                ) : bookmarkletHref === '' ? (
                  <p className="text-xs text-destructive">Erreur de chargement — recharge la page.</p>
                ) : (
                  <a
                    ref={bookmarkletLinkRef}
                    title="Glisse ce bouton dans ta barre de favoris"
                    onClick={(e) => { e.preventDefault(); alert('Glisse ce bouton dans ta barre de favoris !') }}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 18px', borderRadius: '8px', border: '1px solid rgba(99,102,241,0.5)', background: 'rgba(99,102,241,0.12)', color: 'rgb(129,140,248)', fontSize: '14px', fontWeight: 600, textDecoration: 'none', cursor: 'grab', userSelect: 'none', whiteSpace: 'nowrap' }}
                  >
                    ⭐ Sync INQFR
                  </a>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground text-center">
                Affiche-la via <span className="text-foreground">Ctrl+Shift+B</span> si elle est masquée
              </p>
            </div>

            {/* Étape 2 */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-[11px] font-bold text-primary shrink-0">2</span>
                <p className="text-sm text-foreground font-medium">Va sur ta page My Hangar RSI</p>
              </div>
              <a
                href="https://robertsspaceindustries.com/en/account/pledges"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-muted-foreground hover:border-primary/30 hover:text-foreground transition-colors"
              >
                <span>robertsspaceindustries.com / My Hangar</span>
                <span className="text-xs text-primary">↗</span>
              </a>
            </div>

            {/* Étape 3 */}
            <div className="flex items-start gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-[11px] font-bold text-primary shrink-0 mt-0.5">3</span>
              <p className="text-sm text-foreground font-medium">
                Clique le favori <span className="text-primary">⭐ Sync INQFR</span> depuis ta barre — les vaisseaux s&apos;importent automatiquement.
              </p>
            </div>
          </TabsContent>

          {/* ── Onglet CSV ───────────────────────────────────────────────────── */}
          <TabsContent value="csv" className="space-y-4 pt-2">
            <div className="space-y-2 text-xs text-muted-foreground">
              <p className="font-medium text-foreground text-sm">Comment exporter depuis RSI</p>
              <ol className="space-y-1 list-decimal list-inside">
                <li>Connecte-toi sur <span className="text-foreground">robertsspaceindustries.com</span></li>
                <li>Va dans <span className="text-foreground">Account → My Hangar</span></li>
                <li>Clique <span className="text-foreground">Export</span> (bouton en haut à droite)</li>
                <li>Importe le fichier <code className="bg-muted px-1 rounded">.csv</code> ici</li>
              </ol>
            </div>

            <div
              onClick={() => fileInputRef.current?.click()}
              className="group cursor-pointer rounded-lg border-2 border-dashed border-border hover:border-primary/40 transition-colors p-6 text-center space-y-2"
            >
              <Upload className="h-8 w-8 text-muted-foreground/50 group-hover:text-primary/60 transition-colors mx-auto" />
              {csvContent ? (
                <p className="text-sm text-green-400">
                  Fichier chargé — {csvContent.split('\n').length - 1} lignes
                </p>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">Clique ou dépose ton fichier CSV</p>
                  <p className="text-xs text-muted-foreground/60">Format export RSI officiel</p>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            <StatusDisplay status={status} />

            <Button
              onClick={handleCsvSync}
              disabled={isPending || !csvContent}
              className="w-full gap-2"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {isPending ? 'Import en cours…' : 'Importer'}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

function StatusDisplay({ status }: { status: SyncStatus }) {
  if (status.type === 'idle') return null

  if (status.type === 'success') {
    return (
      <div className="flex items-start gap-2 rounded-lg bg-green-500/10 border border-green-500/20 p-3">
        <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 shrink-0" />
        <div className="text-sm">
          <p className="font-medium text-green-400">Import réussi</p>
          <p className="text-muted-foreground text-xs mt-0.5">
            {status.data.added} vaisseau{status.data.added > 1 ? 'x' : ''} ajouté{status.data.added > 1 ? 's' : ''}
            {status.data.skipped > 0 && `, ${status.data.skipped} déjà présent${status.data.skipped > 1 ? 's' : ''}`}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-start gap-2 rounded-lg bg-destructive/10 border border-destructive/20 p-3">
      <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
      <div className="text-sm">
        <p className="font-medium text-destructive">Erreur</p>
        <p className="text-muted-foreground text-xs mt-0.5">{status.message}</p>
      </div>
    </div>
  )
}
