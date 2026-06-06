'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Shield, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'

export default function MFAPage() {
  const router = useRouter()
  const [factorId, setFactorId] = useState('')
  const [code, setCode]         = useState('')
  const [error, setError]       = useState('')
  const [isPending, setIsPending] = useState(false)
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    void init()
  }, [])

  async function init() {
    const supabase = createClient()

    // Si l'utilisateur est déjà à AAL2, pas besoin de cette page
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
    if (aal?.currentLevel === 'aal2') {
      router.replace('/dashboard')
      return
    }

    const { data: factors } = await supabase.auth.mfa.listFactors()
    const totp = factors?.totp?.find(f => f.status === 'verified')
    if (!totp) {
      // Pas de facteur TOTP enrôlé — ne devrait pas arriver ici
      router.replace('/dashboard')
      return
    }

    setFactorId(totp.id)
    setLoading(false)
  }

  async function handleVerify() {
    if (code.length !== 6 || !factorId) return
    setIsPending(true)
    setError('')
    const supabase = createClient()

    const { data: challenge, error: challengeErr } = await supabase.auth.mfa.challenge({ factorId })
    if (challengeErr || !challenge) {
      setError(challengeErr?.message ?? 'Erreur challenge')
      setIsPending(false)
      return
    }

    const { error: verifyErr } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.id,
      code,
    })

    if (verifyErr) {
      setError('Code incorrect ou expiré')
      setIsPending(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-sm space-y-6"
      >
        <div className="text-center space-y-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 border border-primary/20 mx-auto">
            <Shield className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Vérification en deux étapes</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Saisis le code de ton application d&apos;authentification pour continuer.
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-6 space-y-5">
          <Input
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="000 000"
            value={code}
            onChange={e => { setCode(e.target.value.replace(/\D/g, '')); setError('') }}
            onKeyDown={e => e.key === 'Enter' && code.length === 6 && handleVerify()}
            className="font-mono text-center text-2xl tracking-[0.4em] h-14"
            autoFocus
          />

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-md p-3"
            >
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </motion.div>
          )}

          <Button
            className="w-full"
            onClick={handleVerify}
            disabled={isPending || code.length !== 6}
          >
            {isPending
              ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Vérification…</>
              : 'Confirmer'}
          </Button>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors text-center"
          >
            Se déconnecter
          </button>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Code généré par Google Authenticator, Authy ou toute app TOTP.
        </p>
      </motion.div>
    </div>
  )
}
