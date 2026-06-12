'use client'

import { useActionState, useRef, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile'
import { Button } from '@/components/ui/button'
import { submitApplication, type ApplicationFormState } from '@/actions/applications'
import { CheckCircle2, AlertCircle, Loader2, Send } from 'lucide-react'

const HOW_FOUND_OPTIONS = [
  'Un ami / une connaissance',
  'Forum officiel RSI',
  'Discord (serveur Star Citizen)',
  'Réseaux sociaux',
  'Page RSI de l\'organisation',
  'Autre',
]

const initialState: ApplicationFormState = { status: 'idle' }

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p className="mt-1 text-xs text-destructive flex items-center gap-1">
      <AlertCircle className="h-3 w-3 shrink-0" />
      {message}
    </p>
  )
}

function InputField({
  label,
  name,
  type = 'text',
  placeholder,
  required,
  error,
  hint,
}: {
  label: string
  name: string
  type?: string
  placeholder?: string
  required?: boolean
  error?: string
  hint?: string
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-foreground mb-1.5">
        {label}
        {required && <span className="text-primary ml-1">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        className="w-full h-10 rounded-md border border-input bg-input px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
        aria-describedby={error ? `${name}-error` : undefined}
      />
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      <FieldError message={error} />
    </div>
  )
}

export function RecrutementForm() {
  const [state, action, isPending] = useActionState(submitApplication, initialState)
  const formRef = useRef<HTMLFormElement>(null)
  const turnstileRef = useRef<TurnstileInstance>(null)
  const [isVerified, setIsVerified] = useState(false)

  // Après chaque erreur serveur : reset le widget (le token est à usage unique)
  useEffect(() => {
    if (state.status === 'error') {
      turnstileRef.current?.reset()
      setIsVerified(false)
    }
  }, [state])

  if (state.status === 'success') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-2xl border border-green-500/20 bg-green-500/5 p-10 text-center space-y-4"
      >
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10 border border-green-500/30">
            <CheckCircle2 className="h-8 w-8 text-green-400" />
          </div>
        </div>
        <h3 className="text-xl font-bold text-foreground">Candidature envoyée !</h3>
        <p className="text-muted-foreground text-sm max-w-md mx-auto leading-relaxed">
          {state.message}
        </p>
        <div className="pt-2">
          <div className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            Rejoignez le Discord de l&apos;Ordre en attendant la réponse du Haut Conseil
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <form ref={formRef} action={action} className="space-y-5">
      <AnimatePresence>
        {state.status === 'error' && !state.fieldErrors && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{state.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <InputField
        label="Pseudo Star Citizen (handle RSI)"
        name="rsi_handle"
        placeholder="JeanDupont_SC"
        required
        error={state.fieldErrors?.rsi_handle}
        hint="Votre identifiant sur robertsspaceindustries.com"
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <InputField
          label="Adresse email"
          name="email"
          type="email"
          placeholder="jean@exemple.com"
          required
          error={state.fieldErrors?.email}
          hint="Pour créer votre compte si votre candidature est acceptée"
        />
        <InputField
          label="Pseudo Discord"
          name="discord_handle"
          placeholder="jeandupont"
          required
          error={state.fieldErrors?.discord_handle}
          hint="Pour vous contacter via le serveur Discord INQFR"
        />
      </div>

      <InputField
        label="Nom complet"
        name="full_name"
        placeholder="Jean Dupont"
        error={state.fieldErrors?.full_name}
        hint="Optionnel — votre prénom et nom réels"
      />

      <div>
        <label htmlFor="how_found" className="block text-sm font-medium text-foreground mb-1.5">
          Comment avez-vous découvert l&apos;Ordre ? <span className="text-primary">*</span>
        </label>
        <select
          id="how_found"
          name="how_found"
          required
          defaultValue=""
          className="w-full h-10 rounded-md border border-input bg-input px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
        >
          <option value="" disabled className="text-muted-foreground">
            Sélectionnez une option…
          </option>
          {HOW_FOUND_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        <FieldError message={state.fieldErrors?.how_found} />
      </div>

      <div>
        <label htmlFor="motivation" className="block text-sm font-medium text-foreground mb-1.5">
          Message de motivation <span className="text-primary">*</span>
        </label>
        <textarea
          id="motivation"
          name="motivation"
          rows={6}
          required
          placeholder="Présentez-vous, expliquez pourquoi vous souhaitez rejoindre l'Ordre, votre expérience Star Citizen, et ce que vous souhaitez apporter à l'organisation… (min. 50 caractères)"
          className="w-full rounded-md border border-input bg-input px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors resize-none"
          aria-describedby={state.fieldErrors?.motivation ? 'motivation-error' : undefined}
        />
        <FieldError message={state.fieldErrors?.motivation} />
      </div>

      {/* Widget anti-spam Cloudflare Turnstile */}
      <Turnstile
        ref={turnstileRef}
        siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
        onSuccess={() => setIsVerified(true)}
        onExpire={() => setIsVerified(false)}
        onError={() => setIsVerified(false)}
        options={{ theme: 'dark', language: 'fr' }}
      />

      <div className="pt-2">
        <Button
          type="submit"
          size="lg"
          disabled={isPending || !isVerified}
          className="w-full sm:w-auto shadow-[0_0_20px_rgba(245,158,11,0.15)]"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Envoi en cours…
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Soumettre ma candidature
            </>
          )}
        </Button>
        <p className="mt-3 text-xs text-muted-foreground">
          En soumettant, vous acceptez que vos informations soient traitées par le Haut Conseil de l&apos;Ordre.
        </p>
      </div>
    </form>
  )
}
