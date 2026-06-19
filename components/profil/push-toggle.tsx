'use client'

import { useEffect, useState } from 'react'
import { Bell, BellOff, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function PushToggle() {
  const [supported, setSupported] = useState(false)
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setLoading(false)
      return
    }
    setSupported(true)

    async function check() {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js')
        const sub = await reg.pushManager.getSubscription()
        setSubscribed(!!sub)
      } catch {
        // permission refusée ou SW non supporté
      } finally {
        setLoading(false)
      }
    }
    check()
  }, [])

  async function handleSubscribe() {
    setError(null)
    setLoading(true)
    try {
      const { publicKey } = await fetch('/api/push').then((r) => r.json())
      if (!publicKey) { setError('Notifications push non configurées sur le serveur.'); return }

      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      })
      await fetch('/api/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub.toJSON()),
      })
      setSubscribed(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors de l\'abonnement')
    } finally {
      setLoading(false)
    }
  }

  async function handleUnsubscribe() {
    setError(null)
    setLoading(true)
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await fetch('/api/push', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        })
        await sub.unsubscribe()
      }
      setSubscribed(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors du désabonnement')
    } finally {
      setLoading(false)
    }
  }

  if (!supported) return null

  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-4 py-3">
      <div className="space-y-0.5">
        <p className="text-sm font-medium">Notifications navigateur</p>
        <p className="text-xs text-muted-foreground">
          {subscribed
            ? 'Vous recevez des alertes pour les ops, événements et messages.'
            : 'Activez pour recevoir des alertes même hors de l\'application.'}
        </p>
      </div>

      <div className="flex flex-col items-end gap-1 shrink-0 ml-4">
        <Button
          size="sm"
          variant={subscribed ? 'outline' : 'default'}
          onClick={subscribed ? handleUnsubscribe : handleSubscribe}
          disabled={loading}
          className="gap-1.5"
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : subscribed ? (
            <><BellOff className="h-3.5 w-3.5" /> Désactiver</>
          ) : (
            <><Bell className="h-3.5 w-3.5" /> Activer</>
          )}
        </Button>
        {error && <p className="text-[11px] text-destructive max-w-48 text-right">{error}</p>}
      </div>
    </div>
  )
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)))
}
