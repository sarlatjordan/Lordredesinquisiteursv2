'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, Mail, Lock, AlertCircle, CheckCircle2, Eye, EyeOff, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

// ─── Bouton Google OAuth ──────────────────────────────────────────────────────

function GoogleButton({ redirectTo }: { redirectTo?: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleClick() {
    setLoading(true)
    setError('')
    const supabase = createClient()
    const callbackUrl = redirectTo
      ? `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`
      : `${window.location.origin}/auth/callback`
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: callbackUrl },
    })
    if (oauthError) {
      setError(oauthError.message)
      setLoading(false)
    }
    // Sinon le navigateur redirige automatiquement vers Google
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2.5 rounded-md border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50 min-h-[44px]"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
        )}
        Continuer avec Google
      </button>
      {error && <p className="text-xs text-destructive text-center">{error}</p>}
    </div>
  )
}

// ─── Formulaire mot de passe ──────────────────────────────────────────────────

interface PasswordFormValues {
  email: string
  password: string
}

function PasswordForm({ redirectTo }: { redirectTo?: string }) {
  const [state, setState] = useState<'idle' | 'loading' | 'error' | 'mfa'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [mfaFactorId, setMfaFactorId] = useState('')
  const [mfaCode, setMfaCode] = useState('')
  const [mfaError, setMfaError] = useState('')
  const [mfaPending, setMfaPending] = useState(false)
  const router = useRouter()

  const { register, handleSubmit, formState: { errors } } = useForm<PasswordFormValues>()

  async function onSubmit(data: PasswordFormValues) {
    setState('loading')
    setErrorMsg('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })
    if (error) {
      setState('error')
      setErrorMsg(
        error.message.includes('Invalid login credentials')
          ? 'Email ou mot de passe incorrect.'
          : error.message.includes('Email not confirmed')
          ? 'Email non confirmé. Vérifie ta boîte mail.'
          : `Erreur : ${error.message}`
      )
      return
    }

    // Vérifie si une 2FA TOTP est requise (AAL2)
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
    if (aal?.nextLevel === 'aal2') {
      const { data: factors } = await supabase.auth.mfa.listFactors()
      const totp = factors?.totp?.find(f => f.status === 'verified')
      if (totp) {
        setMfaFactorId(totp.id)
        setState('mfa')
        return
      }
    }

    router.push(redirectTo || '/dashboard')
    router.refresh()
  }

  async function submitMFA() {
    if (mfaCode.length !== 6) return
    setMfaPending(true)
    setMfaError('')
    const supabase = createClient()
    const { data: challenge, error: challengeErr } = await supabase.auth.mfa.challenge({ factorId: mfaFactorId })
    if (challengeErr || !challenge) {
      setMfaError(challengeErr?.message ?? 'Erreur challenge')
      setMfaPending(false)
      return
    }
    const { error: verifyErr } = await supabase.auth.mfa.verify({
      factorId: mfaFactorId,
      challengeId: challenge.id,
      code: mfaCode,
    })
    if (verifyErr) {
      setMfaError('Code incorrect ou expiré')
      setMfaPending(false)
      return
    }
    router.push(redirectTo || '/dashboard')
    router.refresh()
  }

  // ─── Écran MFA ────────────────────────────────────────────────────────────────
  if (state === 'mfa') {
    return (
      <div className="space-y-5">
        <div className="text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 border border-primary/20 mx-auto mb-3">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <p className="text-sm font-semibold text-foreground">Vérification en deux étapes</p>
          <p className="text-xs text-muted-foreground mt-1">
            Saisis le code à 6 chiffres de ton application d&apos;authentification
          </p>
        </div>

        <Input
          type="text"
          inputMode="numeric"
          maxLength={6}
          placeholder="000 000"
          value={mfaCode}
          onChange={e => { setMfaCode(e.target.value.replace(/\D/g, '')); setMfaError('') }}
          onKeyDown={e => e.key === 'Enter' && mfaCode.length === 6 && submitMFA()}
          className="font-mono text-center text-2xl tracking-[0.4em] h-14"
          autoFocus
        />

        {mfaError && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-md p-3"
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            {mfaError}
          </motion.div>
        )}

        <Button
          className="w-full"
          onClick={submitMFA}
          disabled={mfaPending || mfaCode.length !== 6}
        >
          {mfaPending
            ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Vérification…</>
            : 'Confirmer'}
        </Button>

        <button
          type="button"
          onClick={() => { setState('idle'); setMfaCode(''); setMfaError('') }}
          className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors text-center"
        >
          ← Retour à la connexion
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Adresse email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            id="email"
            type="email"
            placeholder="vous@exemple.com"
            autoComplete="email"
            className="pl-9"
            {...register('email', { required: 'Email requis' })}
          />
        </div>
        {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Mot de passe</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            autoComplete="current-password"
            className="pl-9 pr-9"
            {...register('password', { required: 'Mot de passe requis' })}
          />
          <button
            type="button"
            onClick={() => setShowPassword(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
      </div>

      {state === 'error' && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-2 rounded-md bg-destructive/10 border border-destructive/30 p-3 text-sm text-destructive"
        >
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{errorMsg}</span>
        </motion.div>
      )}

      <Button type="submit" className="w-full" disabled={state === 'loading'}>
        {state === 'loading'
          ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Connexion…</>
          : 'Se connecter'}
      </Button>
    </form>
  )
}

// ─── Formulaire lien magique ──────────────────────────────────────────────────

interface MagicLinkFormValues {
  email: string
}

function MagicLinkForm({ onBack, redirectTo }: { onBack: () => void; redirectTo?: string }) {
  const [state, setState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const { register, handleSubmit, formState: { errors } } = useForm<MagicLinkFormValues>()

  async function onSubmit(data: MagicLinkFormValues) {
    setState('loading')
    const supabase = createClient()

    // On encode la destination dans l'URL de callback pour que
    // /auth/callback puisse rediriger vers la bonne page après le clic
    const callbackUrl = redirectTo
      ? `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`
      : `${window.location.origin}/auth/callback`

    const { error } = await supabase.auth.signInWithOtp({
      email: data.email,
      options: {
        emailRedirectTo: callbackUrl,
        shouldCreateUser: false,
      },
    })
    if (error) {
      setState('error')
      setErrorMsg(error.message)
      return
    }
    setState('success')
  }

  if (state === 'success') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-3 py-4 text-center"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-400/10 border border-green-400/30">
          <CheckCircle2 className="h-6 w-6 text-green-400" />
        </div>
        <div>
          <p className="font-medium text-foreground">Lien envoyé !</p>
          <p className="text-sm text-muted-foreground mt-1">Vérifie ta boîte mail.</p>
        </div>
        <button onClick={onBack} className="text-xs text-primary hover:underline mt-2">
          ← Retour
        </button>
      </motion.div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email-magic">Adresse email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            id="email-magic"
            type="email"
            placeholder="vous@exemple.com"
            autoComplete="email"
            className="pl-9"
            {...register('email', { required: 'Email requis' })}
          />
        </div>
        {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
      </div>

      {state === 'error' && (
        <div className="flex items-start gap-2 rounded-md bg-destructive/10 border border-destructive/30 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <Button type="submit" className="w-full" disabled={state === 'loading'}>
        {state === 'loading'
          ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Envoi…</>
          : 'Recevoir le lien'}
      </Button>

      <button type="button" onClick={onBack} className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors text-center">
        ← Retour à la connexion
      </button>
    </form>
  )
}

// ─── Composant principal ──────────────────────────────────────────────────────

const ERROR_MESSAGES: Record<string, string> = {
  lien_invalide_ou_expire: 'Le lien de connexion est invalide ou a expiré. Demande-en un nouveau.',
}

interface LoginClientProps {
  redirectTo?: string
  errorParam?: string
}

export function LoginClient({ redirectTo, errorParam }: LoginClientProps) {
  const [mode, setMode] = useState<'password' | 'magic'>('password')

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="p-6 border-border bg-card sc-glow">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-foreground">Connexion</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {mode === 'password'
              ? 'Connecte-toi avec ton email et ton mot de passe.'
              : 'Reçois un lien de connexion par email.'}
          </p>
        </div>

        {/* Erreur lien expiré transmise par /auth/callback */}
        {errorParam && ERROR_MESSAGES[errorParam] && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 flex items-start gap-2 rounded-md bg-destructive/10 border border-destructive/30 p-3 text-sm text-destructive"
          >
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{ERROR_MESSAGES[errorParam]}</span>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {mode === 'password' ? (
            <motion.div key="password" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <GoogleButton redirectTo={redirectTo} />

              {/* Séparateur visuel */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-card px-3 text-muted-foreground uppercase tracking-wider">ou</span>
                </div>
              </div>

              <PasswordForm redirectTo={redirectTo} />
              <div className="mt-4 text-center">
                <button
                  onClick={() => setMode('magic')}
                  className="text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  Pas de mot de passe ? Connexion par lien email →
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div key="magic" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <MagicLinkForm onBack={() => setMode('password')} redirectTo={redirectTo} />
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        Accès réservé aux membres de l&apos;Ordre des Inquisiteurs.
      </p>
    </motion.div>
  )
}
