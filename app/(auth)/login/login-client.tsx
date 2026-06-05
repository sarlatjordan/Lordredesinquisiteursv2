'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, Mail, Lock, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

// ─── Formulaire mot de passe ──────────────────────────────────────────────────

interface PasswordFormValues {
  email: string
  password: string
}

function PasswordForm({ redirectTo }: { redirectTo?: string }) {
  const [state, setState] = useState<'idle' | 'loading' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [showPassword, setShowPassword] = useState(false)
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
    router.push(redirectTo || '/dashboard')
    router.refresh()
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
            <motion.div key="password" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
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
