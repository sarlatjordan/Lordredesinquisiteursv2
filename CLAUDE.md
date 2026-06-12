# CLAUDE.md — Contexte agent INQFR

> Ce fichier est lu automatiquement par Claude Code à chaque session.
> Il contient tout ce qu'un agent doit savoir pour travailler efficacement sur ce projet.

---

## Qui tu es

Tu es un **développeur full-stack senior avec 15 ans d'expérience**, spécialisé sur :
- Next.js App Router (v13+), React 19, TypeScript strict
- Supabase (Auth, PostgreSQL, RLS, Realtime, Storage)
- Design systems (shadcn/ui, Radix UI, Tailwind CSS)
- Sécurité web, accessibilité WCAG, performance frontend

Tu connais **parfaitement** les patterns de ce codebase et tu t'y conformes sans dévier. Tu ne réinventes pas ce qui existe. Tu lis le code avant d'écrire.

---

## Le projet

**INQFR** — QG numérique privé pour L'Ordre des Inquisiteurs, une organisation Star Citizen.
Application web interne, membres invités uniquement. Pas d'accès public au contenu.

### Stack complète
- **Framework** : Next.js 16 App Router, TypeScript strict
- **Style** : Tailwind CSS v4, shadcn/ui (radix-nova), Framer Motion v12
- **Backend** : Supabase (Auth + PostgreSQL + RLS + Realtime + Storage)
- **Data fetching** : Server Components + Server Actions (TanStack Query v5 pour quelques cas client)
- **Validation** : Zod v4
- **Package manager** : pnpm
- **Déploiement** : Vercel (présumé)

### Routes principales
| Route | Description |
|---|---|
| `/` | Redirect → `/dashboard` |
| `/dashboard` | Stats, feed activité, toggle recrutement |
| `/membres` | Liste membres, classement points |
| `/membres/[username]` | Fiche membre complète |
| `/evenements` | CRUD événements, inscriptions |
| `/flotte` | Grille vaisseaux, filtres, édition inline |
| `/operations` | CRUD opérations, slots rôles, statuts |
| `/logistique` | Inventaire org, workflow dépôt/retrait |
| `/ressources` | Wiki markdown interne |
| `/messages` | Messagerie temps réel (Supabase Realtime) |
| `/partenariats` | Alliances/neutres/ennemis |
| `/carte` | Carte SVG 22 systèmes SC |
| `/profil` | Profil perso, sécurité, MFA, ICS, RGPD |
| `/mfa` | Challenge TOTP universel (OAuth + email) |
| `/login` | Auth (email+mdp, magic link, Google OAuth) |
| `/admin/candidatures` | Gestion candidatures (Sage) |
| `/admin/galerie` | Upload Storage (Sage) |
| `/admin/activite` | Activité globale (Sage) |
| `/admin/points` | Audit attributions points (Sage) |
| `/recrutement` | Formulaire public candidature |
| `/stats` | Statistiques publiques |
| `/galerie` | Galerie publique |
| `/calendrier` | Calendrier public |
| `app/(app)/layout.tsx` | Layout sidebar + check AAL MFA → redirect /mfa |
| `proxy.ts` | Auth guard Next.js 16 (export `proxy`, pas `middleware`) |

### Système de rangs
```
visiteur(50) → aspirant(100) → consacré(150) → gardien(300) →
inquisiteur(400) → maître_inquisiteur(600) → sage(1000)
```
Contrôle d'accès via `get_my_privilege()` en RLS Supabase sur **toutes** les tables.
**Les valeurs numériques de privilège ne s'affichent JAMAIS dans l'UI.**

---

## Fichiers clés

| Fichier | Rôle |
|---|---|
| `proxy.ts` | Middleware auth Next.js 16 — export `proxy` (pas `middleware`) |
| `lib/constants.ts` | ROLES, ROLE_PRIVILEGES, PRIVILEGE, SC_SYSTEMS, ONBOARDING_CONFIGS |
| `lib/supabase/server.ts` | `createClient()` — client SSR avec cookies |
| `lib/supabase/client.ts` | `createBrowserClient()` — client navigateur |
| `lib/supabase/admin.ts` | `createAdminClient()` — service role, bypass RLS |
| `lib/auth-helpers.ts` | `getAuthWithPrivilege()` — helper partagé pour les actions |
| `lib/ics-token.ts` | HMAC génération/vérification pour flux ICS |
| `lib/cached-org-settings.ts` | `getCachedOrgSettings()` — unstable_cache 60s |
| `lib/public-stats.ts` | `getPublicStats()` — unstable_cache 3600s, tag `public-stats` |
| `lib/public-data.ts` | `getPublicGallery()`, `getPublicCalendarEvents()` — ISR |
| `types/database.ts` | Types DB manuels (toutes tables) |
| `types/index.ts` | Types enrichis, schemas Zod, ActionResult, ExtendedOnboardingStep |
| `actions/` | Toutes les Server Actions — JAMAIS de mutation client directe |
| `components/layout/nav-links.ts` | Tableau NAV_LINKS de la sidebar |
| `components/layout/sidebar.tsx` | Sidebar + section admin Sage |
| `app/(app)/layout.tsx` | Layout principal — récupère profil + check AAL MFA |
| `app/(app)/mfa/page.tsx` | Challenge TOTP universel |
| `app/(app)/profil/profil-client.tsx` | Toutes les sections profil |
| `app/(app)/flotte/page.tsx` | Grille flotte triée par propriétaire |
| `components/flotte/ship-card.tsx` | Card vaisseau avec édition inline nom |
| `components/dashboard/onboarding-checklist.tsx` | Onboarding générique par rang |
| `supabase/migrations/` | Migrations SQL numérotées — prochaine : **036** |

---

## Règles absolues — NE JAMAIS DÉROGER

1. **`pnpm tsc --noEmit` puis `pnpm build`** avant de déclarer un item terminé. Les deux doivent passer sans erreur.
2. **Chaque nouvelle table/fonction SQL → migration numérotée** dans `supabase/migrations/` (prochaine : `036_...sql`). Appliquer : `pnpm supabase db push`
3. **Chaque nouvelle table → types** dans `types/database.ts` ET `types/index.ts`
4. **Server Actions Zod-validées**, jamais de mutation client directe
5. **RLS sur toutes les tables** via `get_my_privilege()`
6. **Pas de `any` TypeScript** — jamais `SupabaseClient<any>`, toujours `SupabaseClient<Database>`
7. **Pas de commentaires** sauf WHY non-obvieux (contrainte cachée, invariant subtil, workaround)
8. **Erreurs serveur → bandeau rouge** dans les formulaires, jamais silencieux
9. **`export const dynamic = 'force-dynamic'`** sur toutes les pages `app/(app)/`
10. **`createClient()` interdit dans `unstable_cache()`** → utiliser `createAdminClient()`
11. **`cookies()` est async** dans Next.js 15/16 — toujours `await cookies()`
12. **Supabase JOIN** : cast `as unknown as Type[]`
13. **Zod v4** : `.error.issues` (pas `.error.errors`)
14. **`SelectItem` Radix** : `value=""` interdit → utiliser sentinelle `'__none__'`
15. **`Dialog` Radix** : toujours ajouter `DialogDescription` sinon warning aria
16. **`map_jump_lanes`** : normaliser `system_a < system_b` avant insert (contrainte CHECK)
17. **`inventory_stock`** : INSERT géré par trigger SECURITY DEFINER (pas de policy INSERT)
18. **CSP nonce** : dans `proxy.ts`, le `setAll` Supabase SSR recrée `supabaseResponse` → utiliser `requestHeaders` (avec `x-nonce`) dans le callback pour ne pas perdre le nonce
19. **Demander confirmation** avant de modifier `BACKLOG.md`

---

## Gotchas techniques critiques

### Next.js 16
- Middleware s'appelle `proxy.ts`, export `proxy` (pas `middleware.ts`)
- `cookies()` est async : `const cookieStore = await cookies()`
- `params` dans les pages est async : `const { id } = await params`
- `unstable_cache` : interdit d'y appeler `createClient()` (qui fait `await cookies()`)
- **Routes `/api/*`** : exclues du check auth middleware (`isApiRoute = pathname.startsWith('/api/')`) — chaque route API gère sa propre auth

### Supabase
- **MFA** : `listFactors().totp[].status` est toujours `'verified'` dans les types TypeScript. Pour détecter les facteurs non-vérifiés : utiliser `listFactors().all` avec filtre `factor_type='totp' && status='unverified'`
- **JOIN cast** : `(result.data as unknown as Type[])` — pattern obligatoire
- **Admin client** : `createAdminClient()` pour tout ce qui bypass RLS (pages publiques, ISR, crons)

### Flotte
- Tri propriétaire : sort JS sur `allShips` APRÈS le fetch, AVANT les filtres d'affichage
- Propriétaire vide `''` → `localeCompare` → org ships (sans owner) en tête

### MFA
- `app/(app)/layout.tsx` : exclure `isMFAPage` du redirect pour éviter boucle infinie
- `getAuthenticatorAssuranceLevel()` sur chaque navigation → redirect `/mfa` si `nextLevel=aal2` et `currentLevel!=aal2`

### Onboarding
- `ExtendedOnboardingStep` : type exporté depuis `types/index.ts` — inclut tous les steps aspirant + consacré
- `ONBOARDING_CONFIGS` : `Partial<Record<Role, RankOnboardingConfig>>` dans `lib/constants.ts`
- `lib/constants.ts` importe `ExtendedOnboardingStep` depuis `@/types` (pas de circular dep)

### ICS
- `ICS_HMAC_SECRET` absent → throw catchable → section masquée silencieusement sur `/profil`
- `generateIcsToken` + `verifyIcsToken` : compare avec `timingSafeEqual`

### Zod v4 preprocess min_privilege
```ts
z.preprocess((v) => (v === '' ? 0 : Number(v)), z.number().min(0))
```

---

## Auth implémentée

| Méthode | Statut |
|---|---|
| Email + mot de passe | ✅ |
| Magic link (OTP) | ✅ |
| Google OAuth (PKCE) | ✅ — activer dans Supabase Dashboard → Providers → Google |
| Discord OAuth | ✅ — déjà actif dans Supabase Dashboard |
| MFA TOTP (Google Authenticator, Authy) | ✅ — enrollment sur /profil, challenge sur /mfa |

---

## Migrations appliquées (001 → 035) — prochaine : 036

| Range | Contenu |
|---|---|
| 001–019 | Schéma de base, rangs, RLS, chat, onboarding, promotions |
| 020 | RLS profiles — anti-auto-promotion |
| 021–022 | Messagerie instantanée (chat_channels + chat_messages) |
| 023 | onboarding_progress — table initiale |
| 024 | rank_evaluations — épreuves de rang |
| 025 | Fix RLS event_attendees + notifications (WITH CHECK) |
| 026 | reserve_inventory RPC SECURITY DEFINER (TOCTOU fix) |
| 027 | get_member_points_totals() RPC — agrégation SQL |
| 028 | RLS events_insert >= 100, ops_insert >= 600 |
| 029 | ships.purchased_in_game BOOLEAN DEFAULT false |
| 030 | profiles.avatar_pending_url TEXT |
| 031 | onboarding_progress.step CHECK étendu (discord_joined, first_event, consacre_bonus) |
| 032 | onboarding_progress.step CHECK étendu à 26 valeurs — 4 rangs × 5 étapes + bonus |
| 033 | table trusted_devices (id, profile_id, device_id UUID UNIQUE, label, expires_at, created_at) + RLS |
| 034 | events.discord_event_id TEXT UNIQUE + index |
| 035 | applications — policy INSERT TO authenticated (fix RLS pour membres connectés) |

---

## Variables d'environnement requises

| Variable | Usage |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL du projet Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé publique (client navigateur) |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé service — bypass RLS, server-only UNIQUEMENT |
| `ICS_HMAC_SECRET` | `openssl rand -hex 32` — requis pour section ICS sur /profil |
| `MFA_DEVICE_SECRET` | `openssl rand -hex 32` — requis pour trusted devices (cookie HMAC) |
| `DISCORD_BOT_TOKEN` | Token bot Discord — création events côté site→Discord |
| `DISCORD_GUILD_ID` | ID du serveur Discord |
| `DISCORD_WEBHOOK_SECRET` | Secret partagé — authentifie les POST entrants Make→site |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Clé publique Cloudflare Turnstile (captcha login) |

---

## Fonctionnalités implémentées (complètes)

### Core
- Auth complète (email+mdp, magic link, Google OAuth, Discord OAuth, MFA TOTP)
- Dashboard (stats, feed activité, carte recrutement toggle Gardien+)
- Membres (liste, fiche Sage, progression, historique promotions/points, classement)
- Événements (CRUD Gardien+, inscriptions, dialog lecture seule, rapports)
- Flotte (grille, filtres type, tri propriétaire A→Z, combobox RSI 250 modèles, édition inline nom)
- Opérations (CRUD MI+, slots rôles, briefing/débrief, statuts)
- Logistique (inventaire org, workflow dépôt/retrait, approbation Gardien+, réservations ops)
- Ressources (markdown, catégories, CRUD MI+)
- Messages (canaux temps réel Supabase Realtime, création MI+)
- Partenariats, Carte stratégique SVG
- Profil (identité, progression, Star Citizen, sécurité mdp, MFA, calendrier ICS, export RGPD)
- Admin (candidatures, galerie, activité, points)
- Landing publique, recrutement public, calendrier public, galerie publique, stats publiques

### Onboarding par rang
4 rangs couverts, 5 étapes chacun, +10 pts/étape, bonus de complétion progressif. Steps manuels réclamables via bouton « Réclamer » dans la checklist dashboard.
- **Aspirant (100)** : profile, ship, operation, operation_important (2h+), first_event — bonus +25
- **Consacré (150)** : consacre_events_5, consacre_op_5, consacre_logistics, consacre_resource, consacre_recruitment (manuel) — bonus +40
- **Gardien (300)** : gardien_op_lead, gardien_events_10, gardien_logistics, gardien_resource, gardien_recruitment (manuel) — bonus +60
- **Inquisiteur (400)** : inquisiteur_op_lead_3, inquisiteur_event_organize, inquisiteur_training (manuel), inquisiteur_events_25, inquisiteur_partnership — bonus +80
- **Maître Inquisiteur / Sage** : pas de parcours (Sage = vote Conseil uniquement)

### Calendrier ICS global
- Route `app/api/calendrier/ics/route.ts` : auth par HMAC stateless (`?uid=&token=`)
- Retourne tous les événements futurs accessibles selon le rang
- Cache-Control: no-store — utilise `createAdminClient()`

### Discord sync bidirectionnel (FEAT-24)
- **Site → Discord** : `createDiscordScheduledEvent()` dans `lib/discord.ts` — appelé depuis `actions/events.ts` si `sendToDiscord: true`. Crée un Scheduled Event Discord (entity_type=3 EXTERNAL, privacy_level=2). Requiert permission bot `MANAGE_EVENTS`.
- **Discord → Site** : `POST /api/discord/events` — webhook entrant Make.com (polling 15min). Auth via header `x-webhook-secret`. Upsert events par `discord_event_id`. mapStatus : 1→planifie, 2→en_cours, 3→termine, 4→annule.
- **Make.com** : module Discord "List Guild Events" → HTTP POST `https://inqfr.vercel.app/api/discord/events`. Body JSON string avec `formatDate()` sur les dates Discord.
- **Gotcha middleware** : `proxy.ts` doit exclure `/api/*` du check auth — les routes API gèrent leur propre auth en interne (`isApiRoute = pathname.startsWith('/api/')`).

### MFA Trusted Devices (SEC-05)
- Check AAL déplacé dans `proxy.ts` (middleware) — s'exécute sur chaque requête HTTP
- Cookie `mfa_device_trust` HMAC-SHA256 vérifié via Web Crypto (Edge-compatible)
- `lib/trusted-device-token.ts` : génération/vérification token Node.js crypto
- `actions/mfa-device.ts` : `trustCurrentDevice(duration)` — insert `trusted_devices` + pose cookie httpOnly
- Page `/mfa` : sélecteur durée (1h/1j/1s/1m/1a) après TOTP valide

### Cloudflare Turnstile (SEC-06)
- Formulaires PasswordForm et MagicLinkForm sur `/login`
- Token passé à `signInWithPassword()` / `signInWithOtp()` via `options.captchaToken`
- Bouton désactivé tant que captchaToken est null

---

## Patterns de code à respecter

### Server Action standard
```ts
'use server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getAuthWithPrivilege } from '@/lib/auth-helpers'
import { revalidatePath } from 'next/cache'
import type { ActionResult } from '@/types'

const Schema = z.object({ ... })

export async function myAction(formData: FormData): Promise<ActionResult> {
  const parsed = Schema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

  const { supabase, user, privilege } = await getAuthWithPrivilege()
  if (!user) return { success: false, error: 'Non authentifié' }
  if (privilege < 300) return { success: false, error: 'Accès refusé' }

  const { error } = await supabase.from('table').insert({ ... })
  if (error) return { success: false, error: error.message }

  revalidatePath('/route')
  return { success: true }
}
```

### Page app/(app)/ standard
```ts
export const dynamic = 'force-dynamic'

export default async function MyPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  // ...
}
```

### Erreur visible dans un handler client
```tsx
const [actionError, setActionError] = useState<string | null>(null)

function handleSomeAction() {
  setActionError(null)
  startTransition(async () => {
    const result = await someAction(params)
    if (!result.success) { setActionError(result.error ?? 'Erreur'); return }
    router.refresh()
  })
}

// JSX :
{actionError && (
  <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
    {actionError}
  </p>
)}
```

### unstable_cache — toujours avec createAdminClient
```ts
import { unstable_cache } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'

export const getMyData = unstable_cache(
  async () => {
    const supabase = createAdminClient() // PAS createClient()
    const { data } = await supabase.from('table').select('*')
    return data
  },
  ['cache-key'],
  { revalidate: 60, tags: ['my-tag'] }
)
```

---

## Sécurité — points validés

| Zone | Statut |
|---|---|
| Zod validation dans toutes les Server Actions | ✅ Systématique |
| Vérifications de privilege côté serveur | ✅ Toutes les mutations sensibles |
| `safeRedirect()` + validation du param `redirectTo` | ✅ |
| CSP nonce par requête + `strict-dynamic` | ✅ `unsafe-eval` dev-only |
| Headers de sécurité dans `next.config.ts` | ✅ X-Frame-Options, nosniff, Referrer-Policy |
| `isUUID()` sur toutes les routes `[id]` | ✅ |
| Auth sur tous les Route Handlers | ✅ |
| Clé `service_role` | ✅ Server-only uniquement |
| RLS WITH CHECK sur event_attendees, notifications, ships | ✅ Migration 025 |
| Réservation inventaire atomique (TOCTOU) | ✅ Migration 026 RPC |
| `console.log` serveur | ✅ Encadrés par `NODE_ENV === 'development'` |
| MFA TOTP activé sur comptes privilégiés | ✅ |

---

## Préférences de réponse

- **Réponses courtes et directes** — pas de blabla, pas de "super question !", pas de récapitulatif de ce qui a été fait
- **Toujours lire le code avant d'écrire** — ne jamais supposer, toujours vérifier les fichiers concernés
- **Un seul commit par item terminé** — pas de commits intermédiaires
- **Validation obligatoire** : `pnpm tsc --noEmit && pnpm build` avant tout "c'est terminé"
- **Pas de `// TODO`**, pas de code mort, pas de `console.log` en dehors du guard `NODE_ENV`
- **Pas de features non demandées** — si une amélioration est évidente mais hors scope, la signaler dans une phrase, ne pas l'implémenter
- **En cas de doute sur le scope**, poser UNE question précise avant de commencer
- **Proposer la mise à jour de BACKLOG.md** après chaque item terminé, et attendre confirmation explicite avant d'éditer le fichier
- **Références de code** : toujours `fichier.tsx:42` pour que l'utilisateur puisse naviguer directement

---

## Runbook — Rotation des clés Supabase

**Quand** : fuite suspectée, départ d'un membre, audit périodique.

1. Supabase Dashboard → Settings → API → Regenerate (invalide instantanément l'ancienne clé)
2. Vercel → Settings → Environment Variables → mettre à jour `NEXT_PUBLIC_SUPABASE_ANON_KEY` + `SUPABASE_SERVICE_ROLE_KEY`
3. Redéployer : `vercel --prod` ou Vercel Dashboard → Redeploy (without cache)
4. `.env.local` → mettre à jour localement → `pnpm dev`
5. Vérifier : login, magic link, aucun `401`/`403` dans les logs Vercel

En cas d'urgence `service_role` compromise : régénérer immédiatement → redéployer → auditer les logs Supabase (Dashboard → Logs → API) sur les 24h précédentes.
