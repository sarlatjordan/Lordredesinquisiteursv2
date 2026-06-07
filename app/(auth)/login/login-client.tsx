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
import { Turnstile } from '@marsidev/react-turnstile'

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? ''

// ─── Bouton Google OAuth ──────────────────────────────────────────────────────

function OAuthButton({
  provider,
  redirectTo,
  label,
  icon,
}: {
  provider: 'google' | 'discord'
  redirectTo?: string
  label: string
  icon: React.ReactNode
}) {
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
      provider,
      options: { redirectTo: callbackUrl },
    })
    if (oauthError) {
      setError(oauthError.message)
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2.5 rounded-md border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50 min-h-[44px]"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
        {label}
      </button>
      {error && <p className="text-xs text-destructive text-center">{error}</p>}
    </div>
  )
}

function GoogleButton({ redirectTo }: { redirectTo?: string }) {
  return (
    <OAuthButton
      provider="google"
      redirectTo={redirectTo}
      label="Continuer avec Google"
      icon={
        <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" aria-hidden="true">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
      }
    />
  )
}

function DiscordButton({ redirectTo }: { redirectTo?: string }) {
  return (
    <OAuthButton
      provider="discord"
      redirectTo={redirectTo}
      label="Continuer avec Discord"
      icon={
        <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" aria-hidden="true" fill="#5865F2">
          <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.033.055a19.9 19.9 0 0 0 5.993 3.03.077.077 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
        </svg>
      }
    />
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
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const router = useRouter()

  const { register, handleSubmit, formState: { errors } } = useForm<PasswordFormValues>()

  async function onSubmit(data: PasswordFormValues) {
    setState('loading')
    setErrorMsg('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
      options: captchaToken ? { captchaToken } : undefined,
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

      {TURNSTILE_SITE_KEY && (
        <Turnstile
          siteKey={TURNSTILE_SITE_KEY}
          onSuccess={setCaptchaToken}
          onExpire={() => setCaptchaToken(null)}
          options={{ theme: 'dark', size: 'flexible' }}
        />
      )}

      <Button type="submit" className="w-full" disabled={state === 'loading' || (!!TURNSTILE_SITE_KEY && !captchaToken)}>
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
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)

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
        ...(captchaToken ? { captchaToken } : {}),
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

      {TURNSTILE_SITE_KEY && (
        <Turnstile
          siteKey={TURNSTILE_SITE_KEY}
          onSuccess={setCaptchaToken}
          onExpire={() => setCaptchaToken(null)}
          options={{ theme: 'dark', size: 'flexible' }}
        />
      )}

      <Button type="submit" className="w-full" disabled={state === 'loading' || (!!TURNSTILE_SITE_KEY && !captchaToken)}>
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
              <DiscordButton redirectTo={redirectTo} />

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
