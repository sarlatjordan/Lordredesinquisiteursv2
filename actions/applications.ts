'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { ApplicationCreateSchema } from '@/types'
import { getRolePrivilege } from '@/lib/constants'

// ─── Vérification Cloudflare Turnstile ───────────────────────────────────────

async function verifyTurnstile(token: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) return false

  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret, response: token }),
    })
    const data = await res.json() as { success: boolean }
    return data.success === true
  } catch {
    return false
  }
}

// ─── Types de retour ──────────────────────────────────────────────────────────

export type ApplicationFormState = {
  status: 'idle' | 'success' | 'error'
  message?: string
  fieldErrors?: Partial<Record<string, string>>
}

export type AcceptResult =
  | { success: true; magicLink: string }
  | { success: false; error: string }

export type SimpleResult =
  | { success: true }
  | { success: false; error: string }

// ─── Soumission publique (anon) ───────────────────────────────────────────────

export async function submitApplication(
  prevState: ApplicationFormState,
  formData: FormData,
): Promise<ApplicationFormState> {
  // Vérification anti-spam Turnstile — première barrière avant tout traitement
  const turnstileToken = formData.get('cf-turnstile-response')
  if (!turnstileToken || typeof turnstileToken !== 'string') {
    return { status: 'error', message: 'Vérification de sécurité manquante. Rechargez la page.' }
  }
  const turnstileOk = await verifyTurnstile(turnstileToken)
  if (!turnstileOk) {
    return { status: 'error', message: 'Vérification de sécurité échouée. Réessayez.' }
  }

  const raw = {
    rsi_handle:     formData.get('rsi_handle'),
    email:          formData.get('email'),
    discord_handle: formData.get('discord_handle'),
    motivation:     formData.get('motivation'),
    how_found:      formData.get('how_found'),
  }

  const parsed = ApplicationCreateSchema.safeParse(raw)
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const path = issue.path[0]?.toString()
      if (path) fieldErrors[path] = issue.message
    }
    return { status: 'error', message: 'Formulaire invalide.', fieldErrors }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('applications').insert(parsed.data)

  if (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[submitApplication] Supabase error:', error.code, error.message, error.details)
    }
    if (error.code === '23505') {
      if (error.message.includes('rsi_handle') || error.details?.includes('rsi_handle')) {
        return { status: 'error', message: 'Ce pseudo RSI a déjà une candidature en cours.' }
      }
      if (error.message.includes('email') || error.details?.includes('email')) {
        return { status: 'error', message: 'Cette adresse email a déjà une candidature en cours.' }
      }
    }
    return { status: 'error', message: 'Erreur lors de la soumission. Réessayez dans quelques instants.' }
  }

  return {
    status: 'success',
    message: 'Candidature envoyée avec succès ! Le Haut Conseil examinera votre dossier et vous contactera via Discord.',
  }
}

// ─── Accepter une candidature (Sage requis) ───────────────────────────────────

export async function acceptApplication(id: string): Promise<AcceptResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Non authentifié' }

  const { data: myProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!myProfile || getRolePrivilege(myProfile.role) < 1000) {
    return { success: false, error: 'Droits insuffisants — Sage requis' }
  }

  const admin = createAdminClient()

  const { data: application, error: fetchErr } = await admin
    .from('applications')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchErr || !application) return { success: false, error: 'Candidature introuvable' }
  if (application.status === 'accepted' || application.status === 'refused') {
    return { success: false, error: 'Candidature déjà traitée' }
  }

  // Créer l'utilisateur auth + générer un magic link de première connexion
  // redirectTo pointe vers /register pour que le nouveau membre complète son profil
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
    ?? (process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : 'http://localhost:3000')

  const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
    type: 'invite',
    email: application.email,
    options: {
      data: { username: application.rsi_handle },
      redirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent('/register')}`,
    },
  })

  if (linkErr || !linkData) {
    return { success: false, error: linkErr?.message ?? 'Impossible de générer le lien de connexion' }
  }

  const newUserId = linkData.user.id
  const magicLink = linkData.properties.action_link

  // Le trigger handle_new_user a créé le profil avec role='visiteur'
  // On le met à jour vers aspirant + handle RSI
  await admin
    .from('profiles')
    .update({
      role: 'aspirant',
      star_citizen_handle: application.rsi_handle,
    })
    .eq('id', newUserId)

  const { error: updateErr } = await admin
    .from('applications')
    .update({
      status: 'accepted',
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
    })
    .eq('id', id)

  if (updateErr) return { success: false, error: updateErr.message }

  revalidatePath('/admin/candidatures')
  revalidatePath('/membres')

  return { success: true, magicLink }
}

// ─── Passer en discussion (Sage requis) ──────────────────────────────────────

export async function moveToDiscussion(id: string): Promise<SimpleResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Non authentifié' }

  const { data: myProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!myProfile || getRolePrivilege(myProfile.role) < 1000) {
    return { success: false, error: 'Droits insuffisants — Sage requis' }
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from('applications')
    .update({ status: 'en_discussion' })
    .eq('id', id)
    .eq('status', 'pending')

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/candidatures')
  return { success: true }
}

// ─── Regénérer un lien de connexion (Sage requis) ────────────────────────────

export async function regenerateMagicLink(id: string): Promise<AcceptResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Non authentifié' }

  const { data: myProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!myProfile || getRolePrivilege(myProfile.role) < 1000) {
    return { success: false, error: 'Droits insuffisants — Sage requis' }
  }

  const admin = createAdminClient()

  const { data: application, error: fetchErr } = await admin
    .from('applications')
    .select('email, rsi_handle, status')
    .eq('id', id)
    .single()

  if (fetchErr || !application) return { success: false, error: 'Candidature introuvable' }
  if (application.status !== 'accepted') return { success: false, error: 'Candidature non acceptée' }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
    ?? (process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : 'http://localhost:3000')

  const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email: application.email,
    options: {
      redirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent('/register')}`,
    },
  })

  if (linkErr || !linkData) {
    return { success: false, error: linkErr?.message ?? 'Impossible de générer le lien' }
  }

  return { success: true, magicLink: linkData.properties.action_link }
}

// ─── Refuser une candidature (Sage requis) ────────────────────────────────────

export async function rejectApplication(
  id: string,
  notes?: string,
): Promise<SimpleResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Non authentifié' }

  const { data: myProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!myProfile || getRolePrivilege(myProfile.role) < 1000) {
    return { success: false, error: 'Droits insuffisants — Sage requis' }
  }

  const admin = createAdminClient()

  const { error } = await admin
    .from('applications')
    .update({
      status: 'refused',
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
      admin_notes: notes ?? null,
    })
    .eq('id', id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/candidatures')
  return { success: true }
}
