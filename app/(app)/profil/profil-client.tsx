'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  User, Shield, Rocket, Lock, CheckCircle, AlertCircle,
  Loader2, Eye, EyeOff, ExternalLink, Bookmark, ChevronRight,
  Eye as EyeIcon, Scroll, Download,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { updateProfile } from '@/actions/members'
import { createClient } from '@/lib/supabase/client'
import { ROLES, ROLE_COLORS, type Role } from '@/lib/constants'
import { getInitials, formatDate } from '@/lib/utils'
import type { Profile } from '@/types'

interface ProfilClientProps {
  profile: Profile | null
  email: string
  activeEvaluation: {
    id: string
    status: 'pending' | 'in_progress'
    instructions: string | null
    created_at: string
  } | null
}

type SaveStatus = 'idle' | 'saving' | 'success' | 'error'

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ icon, title, children }: {
  icon: React.ReactNode
  title: string
  children: React.ReactNode
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg border border-border bg-card p-6 space-y-5"
    >
      <div className="flex items-center gap-2">
        <div className="text-primary">{icon}</div>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      <Separator className="bg-border" />
      {children}
    </motion.div>
  )
}

// ─── Feedback inline ──────────────────────────────────────────────────────────

function Feedback({ status, error }: { status: SaveStatus; error?: string }) {
  if (status === 'idle') return null
  if (status === 'saving') return (
    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Enregistrement…
    </p>
  )
  if (status === 'success') return (
    <p className="flex items-center gap-1.5 text-xs text-green-400">
      <CheckCircle className="h-3.5 w-3.5" /> Sauvegardé
    </p>
  )
  return (
    <p className="flex items-center gap-1.5 text-xs text-destructive">
      <AlertCircle className="h-3.5 w-3.5" /> {error ?? 'Erreur'}
    </p>
  )
}

// ─── Section identité ─────────────────────────────────────────────────────────

function SectionIdentite({ profile, onSaved }: { profile: Profile | null; onSaved: () => void }) {
  const [status, setStatus] = useState<SaveStatus>('idle')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  const { register, handleSubmit } = useForm({
    defaultValues: {
      display_name: profile?.display_name ?? '',
      bio: profile?.bio ?? '',
    },
  })

  function onSubmit(data: { display_name: string; bio: string }) {
    setStatus('saving')
    startTransition(async () => {
      const res = await updateProfile({
        display_name: data.display_name || undefined,
        bio: data.bio || undefined,
      })
      if (res.success) { setStatus('success'); onSaved() }
      else { setStatus('error'); setError(res.error) }
    })
  }

  return (
    <Section icon={<User className="h-4 w-4" />} title="Identité">
      {/* Avatar + infos readonly */}
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16 border-2 border-border">
          <AvatarImage src={profile?.avatar_url ?? undefined} />
          <AvatarFallback className="bg-primary/10 text-primary text-lg font-bold">
            {getInitials(profile?.display_name ?? profile?.username ?? 'IN')}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-semibold text-foreground">{profile?.display_name ?? profile?.username}</p>
          <p className="text-sm text-muted-foreground">@{profile?.username}</p>
          <Badge
            variant="outline"
            className={`mt-1 text-[10px] px-1.5 capitalize ${ROLE_COLORS[profile?.role ?? 'visiteur']}`}
          >
            <Shield className="h-2.5 w-2.5 mr-1" />
            {ROLES[profile?.role ?? 'visiteur']}
          </Badge>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="display_name">Nom affiché</Label>
          <Input id="display_name" placeholder="Grand Inquisiteur" {...register('display_name')} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="username">Nom d&apos;utilisateur</Label>
          <Input id="username" value={profile?.username ?? ''} disabled className="opacity-50" />
          <p className="text-[11px] text-muted-foreground">Non modifiable</p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="bio">Bio</Label>
          <Textarea id="bio" placeholder="Quelques mots sur toi…" rows={3} {...register('bio')} />
        </div>

        <div className="flex items-center gap-3">
          <Button type="submit" size="sm" disabled={isPending}>Sauvegarder</Button>
          <Feedback status={status} error={error} />
        </div>
      </form>
    </Section>
  )
}

// ─── Section Star Citizen ─────────────────────────────────────────────────────

function SectionStarCitizen({ profile, onSaved }: { profile: Profile | null; onSaved: () => void }) {
  const [status, setStatus] = useState<SaveStatus>('idle')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  const { register, handleSubmit, watch } = useForm({
    defaultValues: { star_citizen_handle: profile?.star_citizen_handle ?? '' },
  })

  const handle = watch('star_citizen_handle')

  function onSubmit(data: { star_citizen_handle: string }) {
    setStatus('saving')
    startTransition(async () => {
      const res = await updateProfile({ star_citizen_handle: data.star_citizen_handle || undefined })
      if (res.success) { setStatus('success'); onSaved() }
      else { setStatus('error'); setError(res.error) }
    })
  }

  return (
    <Section icon={<Rocket className="h-4 w-4" />} title="Star Citizen">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="sc_handle">Handle RSI</Label>
          <div className="flex gap-2">
            <Input
              id="sc_handle"
              placeholder="TonHandleRSI"
              {...register('star_citizen_handle')}
            />
            {handle && (
              <a
                href={`https://robertsspaceindustries.com/citizens/${handle}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button type="button" variant="outline" size="icon" className="shrink-0">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </a>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Utilisé pour la synchronisation automatique de ton hangar RSI.
            Assure-toi que ton hangar est en <span className="text-green-400">Public</span> sur le site RSI.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button type="submit" size="sm" disabled={isPending}>Sauvegarder</Button>
          <Feedback status={status} error={error} />
        </div>
      </form>

      {/* Bookmarklet RSI */}
      <BookmarkletSection />
    </Section>
  )
}

// ─── Bookmarklet RSI ──────────────────────────────────────────────────────────

function BookmarkletSection() {
  const [bookmarkletHref, setBookmarkletHref] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const bookmarkletRef = useRef<HTMLAnchorElement>(null)

  // Contourne la validation javascript: de React en passant par le DOM directement
  useEffect(() => {
    if (bookmarkletRef.current && bookmarkletHref) {
      bookmarkletRef.current.setAttribute('href', bookmarkletHref)
    }
  }, [bookmarkletHref])

  async function loadBookmarklet() {
    setLoading(true)
    try {
      const res = await fetch('/api/hangar-bookmarklet')
      const data = await res.json()
      setBookmarkletHref(data.bookmarklet ?? '')
    } finally { setLoading(false) }
  }

  return (
    <div className="rounded-lg border border-dashed border-border p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Bookmark className="h-4 w-4 text-primary" />
        <p className="text-sm font-medium text-foreground">Bookmarklet RSI</p>
      </div>
      <p className="text-xs text-muted-foreground">
        Importe tes vaisseaux directement depuis la page RSI <code className="bg-muted px-1 rounded">My Hangar → My Gear</code>, sans avoir à entrer ton mot de passe RSI.
      </p>
      {!bookmarkletHref ? (
        <Button size="sm" variant="outline" onClick={loadBookmarklet} disabled={loading} className="gap-1.5">
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Bookmark className="h-3.5 w-3.5" />}
          Générer le bookmarklet
        </Button>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            1. Glisse ce bouton dans ta barre de favoris :<br />
            2. Va sur <strong>robertsspaceindustries.com/en/account/pledges</strong><br />
            3. Clique sur le favori → confirme l&apos;import
          </p>
          <a
            ref={bookmarkletRef}
            className="inline-flex items-center gap-1.5 rounded px-3 py-1.5 border border-primary/30 bg-primary/10 text-primary text-xs font-medium cursor-grab hover:bg-primary/20 transition-colors"
            style={{ textDecoration: 'none' }}
          >
            🚀 INQFR — Import RSI
          </a>
        </div>
      )}
    </div>
  )
}

// ─── Section progression ──────────────────────────────────────────────────────

const EVAL_STATUS_LABELS: Record<'pending' | 'in_progress', string> = {
  pending:     'Épreuve assignée',
  in_progress: 'Épreuve en cours',
}

function SectionProgression({
  profile,
  activeEvaluation,
}: {
  profile: Profile | null
  activeEvaluation: {
    id: string
    status: 'pending' | 'in_progress'
    instructions: string | null
    created_at: string
  } | null
}) {
  const role = profile?.role as Role | undefined
  if (!role || role === 'visiteur') return null

  const isSage = role === 'sage'

  return (
    <Section icon={<ChevronRight className="h-4 w-4" />} title="Progression de rang">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground shrink-0">Rang actuel</span>
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold capitalize ${ROLE_COLORS[role]}`}>
            <Shield className="h-3 w-3" />
            {ROLES[role]}
          </span>
        </div>

        {isSage ? (
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 space-y-1">
            <p className="text-sm font-semibold text-amber-400">Rang suprême atteint</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Tu as atteint le rang suprême de l&apos;Ordre. Le Conseil des Sages guide l&apos;organisation dans ses décisions les plus importantes.
            </p>
          </div>
        ) : activeEvaluation ? (
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Scroll className="h-4 w-4 text-primary shrink-0" />
              <p className="text-sm font-semibold text-foreground">
                {EVAL_STATUS_LABELS[activeEvaluation.status]}
              </p>
              <span className="text-xs text-muted-foreground">
                depuis le {formatDate(activeEvaluation.created_at)}
              </span>
            </div>
            {activeEvaluation.instructions && (
              <div className="rounded-md border border-border bg-background/50 px-3 py-2.5">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                  Ce que l&apos;on attend de toi
                </p>
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                  {activeEvaluation.instructions}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-muted/20 p-4">
            <div className="flex items-start gap-2">
              <EyeIcon className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                Le Conseil porte un regard attentif à ton activité. Lorsqu&apos;il jugera que tu mérites de participer aux épreuves de réévaluation de rang, tu en seras informé et la progression de ton épreuve s&apos;affichera ici.
              </p>
            </div>
          </div>
        )}
      </div>
    </Section>
  )
}

// ─── Section données personnelles (RGPD) ─────────────────────────────────────

function SectionDonnees() {
  return (
    <Section icon={<Download className="h-4 w-4" />} title="Mes données">
      <p className="text-sm text-muted-foreground leading-relaxed">
        Téléchargez une copie de vos données personnelles : profil, vaisseaux, inscriptions aux opérations et événements, historique de points.
      </p>
      <a href="/api/profil/export" download="mes-donnees-inqfr.json">
        <Button variant="outline" size="sm" className="gap-2">
          <Download className="h-4 w-4" />
          Télécharger mes données (JSON)
        </Button>
      </a>
    </Section>
  )
}

// ─── Section sécurité (mot de passe) ─────────────────────────────────────────

interface PasswordFormValues {
  new_password: string
  confirm_password: string
}

function SectionSecurite({ email }: { email: string }) {
  const [status, setStatus] = useState<SaveStatus>('idle')
  const [error, setError] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isPending, startTransition] = useTransition()

  const { register, handleSubmit, reset, formState: { errors }, setError: setFormError } = useForm<PasswordFormValues>()

  function onSubmit(data: PasswordFormValues) {
    if (data.new_password !== data.confirm_password) {
      setFormError('confirm_password', { message: 'Les mots de passe ne correspondent pas' })
      return
    }
    if (data.new_password.length < 8) {
      setFormError('new_password', { message: 'Minimum 8 caractères' })
      return
    }

    setStatus('saving')
    startTransition(async () => {
      const supabase = createClient()
      const { error: err } = await supabase.auth.updateUser({ password: data.new_password })
      if (err) {
        setStatus('error')
        setError(err.message)
      } else {
        setStatus('success')
        reset()
      }
    })
  }

  return (
    <Section icon={<Lock className="h-4 w-4" />} title="Sécurité">
      <div className="space-y-1.5">
        <Label>Email</Label>
        <Input value={email} disabled className="opacity-50" />
        <p className="text-[11px] text-muted-foreground">Non modifiable</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="new_password">Nouveau mot de passe</Label>
          <div className="relative">
            <Input
              id="new_password"
              type={showNew ? 'text' : 'password'}
              placeholder="••••••••"
              autoComplete="new-password"
              className="pr-9"
              {...register('new_password', { required: 'Requis', minLength: { value: 8, message: 'Minimum 8 caractères' } })}
            />
            <button type="button" onClick={() => setShowNew(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.new_password && <p className="text-xs text-destructive">{errors.new_password.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirm_password">Confirmer le mot de passe</Label>
          <div className="relative">
            <Input
              id="confirm_password"
              type={showConfirm ? 'text' : 'password'}
              placeholder="••••••••"
              autoComplete="new-password"
              className="pr-9"
              {...register('confirm_password', { required: 'Requis' })}
            />
            <button type="button" onClick={() => setShowConfirm(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.confirm_password && <p className="text-xs text-destructive">{errors.confirm_password.message}</p>}
        </div>

        <div className="flex items-center gap-3">
          <Button type="submit" size="sm" disabled={isPending}>Changer le mot de passe</Button>
          <Feedback status={status} error={error} />
        </div>
      </form>
    </Section>
  )
}

// ─── Page principale ──────────────────────────────────────────────────────────

export function ProfilClient({ profile, email, activeEvaluation }: ProfilClientProps) {
  const router = useRouter()

  function handleSaved() {
    router.refresh()
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Mon profil</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Gérez vos informations personnelles et vos paramètres de sécurité.
        </p>
      </div>

      <SectionIdentite profile={profile} onSaved={handleSaved} />
      <SectionProgression profile={profile} activeEvaluation={activeEvaluation} />
      <SectionStarCitizen profile={profile} onSaved={handleSaved} />
      <SectionSecurite email={email} />
      <SectionDonnees />
    </div>
  )
}
