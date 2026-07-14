'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { updateProfile } from '@/actions/members'

interface FormValues {
  display_name: string
  password: string
  confirm_password: string
}

interface RegisterClientProps {
  email: string
  defaultDisplayName: string
}

export function RegisterClient({ email, defaultDisplayName }: RegisterClientProps) {
  const [error, setError]             = useState('')
  const [isPending, startTransition]  = useTransition()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm]   = useState(false)
  const router = useRouter()

  const { register, handleSubmit, watch, formState: { errors }, setError: setFormError } = useForm<FormValues>({
    defaultValues: { display_name: defaultDisplayName, password: '', confirm_password: '' },
  })

  const password = watch('password')

  function onSubmit(data: FormValues) {
    if (data.password && data.password !== data.confirm_password) {
      setFormError('confirm_password', { message: 'Les mots de passe ne correspondent pas' })
      return
    }

    setError('')
    startTransition(async () => {
      const res = await updateProfile({ display_name: data.display_name || undefined })
      if (!res.success) { setError(res.error ?? 'Erreur lors de la mise à jour du profil'); return }

      if (data.password) {
        const supabase = createClient()
        const { error: pwErr } = await supabase.auth.updateUser({ password: data.password })
        if (pwErr) { setError(pwErr.message); return }
      }

      router.push('/dashboard')
    })
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <Card className="p-6 border-border bg-card sc-glow">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-foreground">Finaliser mon accès</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Ton compte a été créé par un Sage. Choisis un nom affiché et, si tu le souhaites, un mot de passe.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input value={email} disabled className="opacity-50" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="display_name">Nom affiché *</Label>
            <Input
              id="display_name"
              placeholder="Grand Inquisiteur"
              {...register('display_name', {
                required: 'Requis',
                minLength: { value: 2, message: 'Minimum 2 caractères' },
              })}
            />
            {errors.display_name && (
              <p className="text-xs text-destructive">{errors.display_name.message}</p>
            )}
          </div>

          <div className="relative py-1">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-card px-3 text-muted-foreground">Mot de passe (optionnel)</span>
            </div>
          </div>

          <p className="text-[11px] text-muted-foreground">
            Optionnel — vous pouvez vous connecter par lien email. Recommandé pour une connexion plus rapide.
          </p>

          <div className="space-y-1.5">
            <Label htmlFor="password">Mot de passe</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                autoComplete="new-password"
                className="pr-9"
                {...register('password', {
                  minLength: password ? { value: 8, message: 'Minimum 8 caractères' } : undefined,
                })}
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
          </div>

          {password && (
            <div className="space-y-1.5">
              <Label htmlFor="confirm_password">Confirmer le mot de passe</Label>
              <div className="relative">
                <Input
                  id="confirm_password"
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="pr-9"
                  {...register('confirm_password')}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(v => !v)}
                  aria-label={showConfirm ? 'Masquer la confirmation' : 'Afficher la confirmation'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirm_password && (
                <p className="text-xs text-destructive">{errors.confirm_password.message}</p>
              )}
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 rounded-md bg-destructive/10 border border-destructive/30 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending
              ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Enregistrement…</>
              : 'Accéder au QG'}
          </Button>
        </form>

        <div className="mt-4 text-center">
          <a href="/dashboard" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            Passer pour l&apos;instant →
          </a>
        </div>
      </Card>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        Accès réservé aux membres de l&apos;Ordre des Inquisiteurs.
      </p>
    </motion.div>
  )
}
