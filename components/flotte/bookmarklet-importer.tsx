'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, AlertCircle, Loader2, X } from 'lucide-react'
import { syncHangarFromBookmarklet } from '@/actions/hangar-sync'

export function BookmarkletImporter({ encoded }: { encoded: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    let shipNames: string[]
    try {
      const raw = decodeURIComponent(escape(atob(encoded)))
      shipNames = JSON.parse(raw)
      if (!Array.isArray(shipNames) || shipNames.length === 0) throw new Error()
    } catch {
      setResult({ type: 'error', message: 'Données du bookmarklet invalides.' })
      return
    }

    startTransition(async () => {
      const res = await syncHangarFromBookmarklet(shipNames)
      if (res.success) {
        const { added, skipped } = res.data
        const msg =
          added > 0
            ? `${added} vaisseau${added > 1 ? 'x' : ''} importé${added > 1 ? 's' : ''}` +
              (skipped > 0 ? ` — ${skipped} déjà présent${skipped > 1 ? 's' : ''}` : '') +
              '.'
            : skipped > 0
              ? `Tous les vaisseaux sont déjà enregistrés (${skipped}).`
              : 'Aucun vaisseau trouvé dans les données.'
        setResult({ type: 'success', message: msg })
      } else {
        setResult({ type: 'error', message: res.error ?? 'Erreur lors de l\'import.' })
      }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [encoded])

  function dismiss() {
    setDismissed(true)
    router.replace('/flotte')
  }

  if (dismissed) return null

  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-lg border px-4 py-3 text-sm ${
        result?.type === 'error'
          ? 'border-destructive/30 bg-destructive/10 text-destructive'
          : result?.type === 'success'
            ? 'border-green-500/30 bg-green-500/10 text-green-400'
            : 'border-border bg-muted/30 text-muted-foreground'
      }`}
    >
      <div className="flex items-center gap-2">
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin shrink-0" />
            <span>Import du hangar RSI en cours…</span>
          </>
        ) : result?.type === 'success' ? (
          <>
            <CheckCircle className="h-4 w-4 shrink-0" />
            <span>{result.message}</span>
          </>
        ) : (
          <>
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{result?.message}</span>
          </>
        )}
      </div>
      {result && (
        <button
          onClick={dismiss}
          className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
          aria-label="Fermer"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
