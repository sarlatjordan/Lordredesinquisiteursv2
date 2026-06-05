'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Rocket, CheckCircle, AlertCircle, Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { syncHangarFromBookmarklet } from '@/actions/hangar-sync'

interface RsiShipEntry { name: string; manufacturer?: string }

export function RsiBookmarkletImport() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [ships, setShips] = useState<RsiShipEntry[]>([])
  const [status, setStatus] = useState<'confirm' | 'success' | 'error' | null>(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const raw = searchParams.get('rsi_import')
    if (!raw) return
    try {
      const decoded = JSON.parse(decodeURIComponent(escape(atob(raw))))
      if (Array.isArray(decoded) && decoded.length > 0) setShips(decoded)
    } catch { /* ignore */ }
  }, [searchParams])

  if (!ships.length || !status && ships.length === 0) return null

  function dismiss() {
    setShips([])
    setStatus(null)
    const url = new URL(window.location.href)
    url.searchParams.delete('rsi_import')
    router.replace(url.pathname)
  }

  function handleImport() {
    startTransition(async () => {
      const result = await syncHangarFromBookmarklet(ships.map(s => s.name))
      if (result.success) {
        setStatus('success')
        setMessage(`${result.data.added} vaisseau${result.data.added > 1 ? 'x' : ''} ajouté${result.data.added > 1 ? 's' : ''}${result.data.skipped > 0 ? `, ${result.data.skipped} déjà présent${result.data.skipped > 1 ? 's' : ''}` : ''}`)
        router.refresh()
      } else {
        setStatus('error')
        setMessage(result.error)
      }
    })
  }

  if (status === 'success') return (
    <div className="flex items-center gap-3 rounded-lg border border-green-500/20 bg-green-500/10 p-4">
      <CheckCircle className="h-5 w-5 text-green-400 shrink-0" />
      <div>
        <p className="text-sm font-medium text-green-400">Import RSI réussi !</p>
        <p className="text-xs text-muted-foreground">{message}</p>
      </div>
      <Button variant="ghost" size="sm" onClick={dismiss} className="ml-auto">OK</Button>
    </div>
  )

  if (status === 'error') return (
    <div className="flex items-center gap-3 rounded-lg border border-destructive/20 bg-destructive/10 p-4">
      <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
      <div>
        <p className="text-sm font-medium text-destructive">Erreur d&apos;import</p>
        <p className="text-xs text-muted-foreground">{message}</p>
      </div>
      <Button variant="ghost" size="sm" onClick={dismiss} className="ml-auto">Fermer</Button>
    </div>
  )

  return (
    <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <Rocket className="h-4 w-4 text-primary shrink-0" />
          <p className="text-sm font-medium text-foreground">
            Import RSI — {ships.length} vaisseau{ships.length > 1 ? 'x' : ''} détecté{ships.length > 1 ? 's' : ''}
          </p>
        </div>
        <button onClick={dismiss} className="text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="max-h-32 overflow-y-auto space-y-1">
        {ships.map((s, i) => (
          <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="h-1 w-1 rounded-full bg-primary/50 shrink-0" />
            <span>{s.name}{s.manufacturer ? ` — ${s.manufacturer}` : ''}</span>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Button size="sm" onClick={handleImport} disabled={isPending} className="gap-1.5">
          {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Importer dans INQFR
        </Button>
        <Button size="sm" variant="ghost" onClick={dismiss} disabled={isPending}>Annuler</Button>
      </div>
    </div>
  )
}
