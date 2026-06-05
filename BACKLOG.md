# INQFR — Backlog produit (fusionné)

> Généré suite aux audits multi-agents du 2026-06-04.
> Fusionne : backlog original P0→P2 + audits Sécurité, Performance, Architecture, TypeScript, UX.
> Stack : Next.js 16 App Router · TypeScript strict · Supabase (Auth + RLS) · Tailwind v4 · shadcn/ui · pnpm

---

## Légende priorités

| Priorité | Signification |
|---|---|
| **P0** | Incident / faille / bug actif en production — traiter immédiatement |
| **P1** | Amélioration importante — prochain sprint |
| **P2** | Nice-to-have / scalabilité — backlog long terme |

---

## 🐛 Bugs actifs — P0

### ~~BUG-01 · Page `/flotte` blanche intermittente~~ ✅ CORRIGÉ 2026-06-04
`<Suspense fallback={null}>` ajouté autour de `<RsiBookmarkletImport />` dans `app/(app)/flotte/page.tsx`.

### ~~BUG-02 · `cached-org-settings.ts` — `cookies()` interdit dans `unstable_cache()`~~ ✅ CORRIGÉ 2026-06-04
`createClient()` appelle `await cookies()`, interdit dans un scope `unstable_cache()` depuis Next.js 15+. Fix : `createAdminClient()` (pas de cookies, `org_settings` est SELECT anon).

---

## 🔒 Sécurité — P0 (findings audit 2026-06-04)

### ~~SEC-A01 · RLS `event_attendees` — UPDATE sans WITH CHECK~~ ✅ CORRIGÉ 2026-06-04
Falsification de présence à un événement via l'API REST. Fix : migration `025` avec `WITH CHECK (profile_id = auth.uid() OR get_my_privilege() >= 300)`.

### ~~SEC-A02 · RLS `notifications` — INSERT WITH CHECK(true)~~ ✅ CORRIGÉ 2026-06-04
N'importe quel membre pouvait spammer les notifications d'un autre. Fix : migration `025`, INSERT limité à `get_my_privilege() >= 300`.

### ~~SEC-B01 · Route ICS — bypass du `min_privilege` des événements~~ ✅ CORRIGÉ 2026-06-04
Un Aspirant pouvait exporter le `.ics` d'un événement MI+. Fix : vérification privilege après fetch.

### ~~SEC-B02 · RLS `ships` — UPDATE sans WITH CHECK~~ ✅ CORRIGÉ 2026-06-04
Transfert forcé de vaisseau entre membres. Fix : `WITH CHECK (owner_id = auth.uid() OR get_my_privilege() >= 300)`.

### ~~SEC-B03 · RLS `notifications` — UPDATE sans WITH CHECK~~ ✅ CORRIGÉ 2026-06-04
Déplacement de notification vers la boîte d'un autre membre.

### ~~SEC-B04 · Réservation d'inventaire non-atomique (TOCTOU)~~ ✅ CORRIGÉ 2026-06-04
Sur-réservation possible sous concurrence. Fix : RPC `SECURITY DEFINER` avec `SELECT ... FOR UPDATE`.

### ~~SEC-C01 · Route ICS — `isUUID()` absent sur le param `id`~~ ✅ CORRIGÉ 2026-06-04

### ~~SEC-C02 · CSP `unsafe-inline` sur `style-src`~~ ✅ RISQUE DOCUMENTÉ 2026-06-04
Compromis pragmatique avec Tailwind v4 — acceptable si nonce scripts reste strict.

### ~~SEC-02 · Vérifier/supprimer comptes de test en prod~~ ✅ CORRIGÉ 2026-06-04
Comptes `test.*@inqfr.test` vérifiés et supprimés. Guard anti-prod ajouté dans `scripts/seed-test-users.ts`.

### ~~OPS-01 · Activer 2FA TOTP sur les comptes privilégiés~~ ✅ CORRIGÉ 2026-06-04
MFA TOTP activé sur Supabase Dashboard. Communicé aux Sages+.

---

## ⚡ Performance — P0/P1/P2

### ~~PERF-01 · `layout.tsx` — `select('*')` sur chaque requête authentifiée~~ ✅ CORRIGÉ 2026-06-04
`select('id, role, display_name, username, avatar_url')` dans `app/(app)/layout.tsx`.

---

### ~~PERF-02 · Dashboard — `attendeeCounts` hors `Promise.all`~~ ✅ CORRIGÉ 2026-06-04
Intégré dans le `Promise.all` principal de `dashboard/page.tsx`.

---

### ~~PERF-03 · Dashboard — `org_settings` sans cache~~ ✅ CORRIGÉ 2026-06-04
`lib/cached-org-settings.ts` créé (`unstable_cache` 60s, tag `org-settings`). `revalidateTag` ajouté dans `actions/org-settings.ts`.

---

### ~~PERF-04 · Événements — 2 requêtes `event_attendees` séquentielles~~ ✅ CORRIGÉ 2026-06-04
`userAttendees` et `countData` intégrés dans le `Promise.all` de `evenements/page.tsx`.

---

### ~~PERF-05 · Opérations list — `select('*')` sur textes longs~~ ✅ CORRIGÉ 2026-06-04
Colonnes explicites (sans `debrief`) dans `operations/page.tsx`.

---

### ~~PERF-06 · Membres list — `select('*')`~~ ✅ CORRIGÉ 2026-06-04
`select('id, username, display_name, role, avatar_url, star_citizen_handle, joined_at, is_active, bio')` dans `membres/page.tsx`.

---

### ~~PERF-07 · Supprimer hooks TanStack Query inutilisés~~ ✅ CORRIGÉ 2026-06-04
`hooks/use-members.ts`, `use-events.ts`, `use-ships.ts` supprimés.

---

### ~~PERF-08 · `/membres/[username]` — 9 aller-retours séquentiels → ~4~~ ✅ CORRIGÉ 2026-06-04
3 vagues : `getUser()` + `profile` en parallèle → `me` → `Promise.all` progression / promotions(JOIN promoter) / points(JOIN awarder) / 3 stats. Élimine 2 in-queries séparées.

---

### ~~PERF-09 · `/operations/[id]` — waterfall → 2 vagues parallèles~~ ✅ CORRIGÉ 2026-06-04
3 vagues : `getUser()` + `op(JOIN commander)` en parallèle → `me` → `Promise.all` slots(JOIN profiles) / registrations(JOIN profiles) / membres / resources / inventory. Élimine commander fetch + 2 in-queries.

---

### ~~PERF-10 · `member_points` — full-scan côté JS → RPC SQL~~ ✅ CORRIGÉ 2026-06-04
Migration 027 — `get_member_points_totals()` SECURITY DEFINER. `membres/page.tsx` appelle `supabase.rpc()` au lieu de `.select('profile_id, points')`. O(n_membres) confirmé. Type ajouté dans `database.ts`.

---

### ~~PERF-11 · `membre-detail.tsx` — `'use client'` inutile~~ ✅ CORRIGÉ 2026-06-04
`useRouter` + `router.refresh()` supprimés (redondants avec `revalidatePath`). `'use client'` conservé pour framer-motion (légitime).

---

### ~~PERF-12 · `public-stats.ts` — tags cache manquants~~ ✅ CORRIGÉ 2026-06-04
`tags: ['public-stats']` ajouté. `revalidateTag('public-stats', { expire: 0 })` dans `members.ts` (×2), `progression.ts`, `ships.ts` (×2).

---

## 🏗 Architecture — P0/P1/P2

### ~~ARCH-05 · Double fetch profil `generateMetadata` + body page~~ ✅ CORRIGÉ 2026-06-04
`getProfileByUsername()` mémoïsé avec `React.cache()` dans `membres/[username]/page.tsx`. Le second appel (page body) résout instantanément depuis le cache React — zéro RTT supplémentaire.

---

### ~~ARCH-07 · Requêtes multi-passes `operations/page.tsx`~~ ✅ CORRIGÉ 2026-06-04
`countData` + `commanderProfiles` maintenant dans un `Promise.all` après les 2 requêtes ops. 4 requêtes séquentielles → 2 vagues parallèles.

---

### ~~ARCH-09 · Props trop granulaires sur `MembreDetail` (13 props)~~ ✅ CORRIGÉ 2026-06-04
13 props → 6 : `{ profile, progression, promotions, points, stats, permissions }`. `totalPoints` absorbé dans `profile.total_points`. `currentUserId` supprimé (inutilisé dans le corps).

---

### ~~ARCH-10 · Filtrage flotte côté JS~~ ✅ CORRIGÉ 2026-06-04
`typeCount`, `orgShips`, `available` calculés sur `allShips` avant filtre — les boutons de type ne disparaissaient plus quand un filtre était actif. Filtre JS conservé pour l'affichage (évite une seconde requête).

---

### ~~ARCH-01 · Mutation DB dans un Server Component (messages)~~ ✅ CORRIGÉ 2026-06-04
### ~~ARCH-02 · `createAdminClient()` sans cache pages publiques (galerie, calendrier)~~ ✅ CORRIGÉ 2026-06-04
### ~~ARCH-03 · Fichier fantôme `actions/promotion-requests.ts`~~ ✅ CORRIGÉ 2026-06-04
### ~~ARCH-04 · Erreurs silencieuses dans `releaseAllOpResources`~~ ✅ CORRIGÉ 2026-06-04
### ~~ARCH-11 · `Promise.resolve()` superflu dans `calendrier/page.tsx`~~ ✅ CORRIGÉ 2026-06-04
### ~~BONUS-01 · `getPublicStats()` crash silencieux → `/stats` blanche~~ ✅ CORRIGÉ 2026-06-04

---

## 📘 TypeScript / Qualité code — P0/P1/P2

### ~~TS-01 · Crash Realtime chat — payload sans relations JOIN~~ ✅ CORRIGÉ (déjà en place)
`chat-layout.tsx` fait un fetch DB avec JOIN author via `payload.new.id` — code déjà correct à l'audit.

---

### ~~TS-02 · Upsert `onboarding_progress` sans vérification `.error`~~ ✅ CORRIGÉ 2026-06-04
`error: upsertError` et `error: bonusError` ajoutés dans `actions/onboarding.ts` → early return sur erreur DB.

---

### ~~TS-03 · Cast Promise-level sur `rank_evaluations` dans `/profil`~~ ✅ CORRIGÉ 2026-06-04
Cast déplacé post-await : `evalResult.data as ActiveEval | null` dans `app/(app)/profil/page.tsx`.

---

### ~~TS-04 · `getAuth()` dupliqué dans 5 fichiers actions~~ ✅ CORRIGÉ 2026-06-04
`lib/auth-helpers.ts` créé avec `getAuthWithPrivilege()`. Migré dans `events.ts`, `logistics.ts`, `map.ts`, `partnerships.ts`, `operations.ts`. Imports `createClient` + `getRolePrivilege` inutilisés nettoyés.

---

### ~~TS-05 · `export const dynamic = 'force-dynamic'` manquant sur 6 pages~~ ✅ CORRIGÉ 2026-06-04
Ajouté sur les 6 pages : `ressources/[slug]`, `operations/new`, `operations/[id]/edit`, `partenariats/new`, `partenariats/[id]/edit`, `logistique/new`.

---

### ~~TS-06 · `OnboardingStep` type défini dans `actions/` au lieu de `types/`~~ ✅ CORRIGÉ 2026-06-04
Déplacé dans `types/index.ts`. Import mis à jour dans `actions/onboarding.ts`, `dashboard/page.tsx`, `onboarding-checklist.tsx`.

---

### ~~TS-07 · `useEffect` deps vide silencé ESLint dans `onboarding-checklist`~~ ✅ CORRIGÉ 2026-06-04
`useRef(false)` guard ajouté, deps explicites `[done, completedSteps, router]`, `// eslint-disable-next-line` supprimé.

---

### ~~TS-08 · `catch(err)` sans `: unknown` (4 occurrences)~~ ✅ CORRIGÉ 2026-06-04
`catch (err: unknown)` sur `hangar-sync.ts` (×3, `replace_all`) et `ship-matrix.ts` (×1).

---

### ~~TS-09 · Type inline `inventory_stock` sans nom~~ ✅ CORRIGÉ 2026-06-04
`InventoryStockRow` exporté depuis `types/index.ts`. Type inline `StockRow` supprimé de `dashboard/page.tsx`.

---

## 🎨 UX & Accessibilité — P0/P1/P2

### ~~UX-B01 · Erreurs silencieuses sur 10 handlers fire-and-forget~~ ✅ CORRIGÉ 2026-06-04
10 handlers dans 8 fichiers — `useState` error + bandeau rouge `bg-destructive/10`. Fichiers : `events-client.tsx`, `operation-detail.tsx`, `item-detail.tsx`, `op-register-dialog.tsx`, `op-registrations-panel.tsx`, `op-role-manager.tsx`, `promotions-client.tsx`, `event-detail-dialog.tsx`.

---

### ~~UX-D01 · `loading.tsx` manquants sur 8 pages force-dynamic~~ ✅ CORRIGÉ 2026-06-04
Créés : `dashboard`, `evenements`, `flotte`, `partenariats`, `messages`, `profil`, `admin/candidatures`, `admin/promotions`. Skeletons Shadcn adaptés à chaque layout.

---

### ~~UX-D02 · Mobile nav surchargée — 10 icônes, zones < 44px WCAG~~ ✅ CORRIGÉ 2026-06-04
5 routes primaires (dashboard, messages, membres, événements, opérations) avec `min-h-[44px]` WCAG 2.5.5. Bouton "Plus" → Sheet avec les 5 routes secondaires + `/profil`. `SheetDescription` sr-only pour ARIA.

---

### ~~UX-D03 · `title` au lieu de `aria-label` sur 7 boutons icône~~ ✅ CORRIGÉ 2026-06-04
`title` → `aria-label` sur `op-registrations-panel` (×2), `op-role-manager`, `item-detail` (×2). `aria-label` ajouté sur `op-resources-panel` et `event-detail-dialog` (boutons sans label).

---

### ~~UX-D04 · Labels Radix Select non associés (`htmlFor` ne fonctionne pas)~~ ✅ CORRIGÉ 2026-06-04
`id` ajouté sur tous les `<Label>` + `aria-labelledby` correspondant sur chaque `<SelectTrigger>`. Corrigé dans `op-form.tsx` (×4), `op-register-dialog.tsx`, `award-points-dialog.tsx`, `transaction-dialog.tsx` (×3), `progression-form.tsx`.

---

### ~~UX-D05 · Spinner manquant sur le bouton submit de `OpForm`~~ ✅ CORRIGÉ 2026-06-04
`<Loader2 className="animate-spin" />` ajouté sur le bouton submit de `op-form.tsx`.

---

### ~~UX-D06 · `isPending` partagé pour Lancer / Terminer / Annuler~~ ✅ CORRIGÉ 2026-06-04
`loadingStatus: string | null` ajouté. Chaque bouton affiche `<Loader2 animate-spin />` uniquement quand il est l'action en cours.

---

### ~~UX-P01 · Composants HTML natifs au lieu de shadcn~~ ✅ CORRIGÉ 2026-06-04
`<textarea>` → `<Textarea>` (RefuseDialog) · `<button>` onglets → `<Tabs>`/`<TabsTrigger>` (candidatures, ARIA + navigation clavier) · `<select>` → `<Select>` shadcn + validation explicite `memberId` (promotions).

---

### ~~UX-P02 · `aria-expanded` manquant sur le toggle historique logistique~~ ✅ CORRIGÉ 2026-06-04
`aria-expanded={showHistory}` ajouté sur le bouton toggle dans `item-detail.tsx`.

---

## Backlog original (archive)

> Items du backlog initial P0→P2, tous traités.

| # | Item | Priorité | Statut |
|---|---|---|---|
| SEC-01 | RLS auto-promotion profiles | P0 | ✅ Migration 020 |
| SEC-02 | Comptes de test prod | P0 | ✅ |
| SEC-03 | Turnstile formulaire candidature | P0 | ✅ |
| SEC-04 | console.log hangar-sync | P0 | ✅ |
| UX-01 | Redirect post-login | P0 | ✅ |
| UX-02 | Visiteur bloqué sans explication | P0 | ✅ |
| OPS-01 | 2FA TOTP Supabase | P0 | ✅ |
| FEAT-01 | Messagerie instantanée | P1 | ✅ Migration 021-022 |
| FEAT-02 | Centre de notifications | P1 | ✅ |
| FEAT-03 | Onboarding checklist aspirant | P1 | ✅ Migration 023 |
| FEAT-04 | Membres inactifs (Sage) | P1 | ✅ |
| FEAT-05 | Export .ics calendrier | P1 | ✅ |
| FEAT-06 | Épreuves de rang (MI+) | P1 | ✅ Migration 024 |
| TECH-01 | Batch N+1 releaseAllOpResources | P1 | ✅ |
| TECH-02 | Supprimer revalidate=60 no-op | P1 | ✅ |
| TECH-03 | Refactorer bookmarklet | P1 | ✅ |
| TECH-05 | CI GitHub Actions | P1 | ✅ Push GitHub + workflow |
| UX-03 | Skeleton loading pages | P1 | ✅ |
| UX-04 | Progression visible profil | P1 | ✅ |
| UX-05 | Page 404 personnalisée | P1 | ✅ |
| P2-01 | Stats publiques landing page | P2 | ✅ |
| P2-02 | CSP headers (nonce + statiques) | P2 | ✅ |
| P2-03 | Validation UUID routes dynamiques | P2 | ✅ |
| P2-04 | Runbook rotation clés Supabase | P2 | ✅ |
| P2-05 | Export données membres (RGPD) | P2 | ✅ |
| P2-06 | Page publique /stats | P2 | ✅ |
| P2-07 | Transitions Framer Motion | P2 | ✅ |

---

## Synthèse exécutive — Nouveaux items audit

| ID | Item | Domaine | Priorité | Effort |
|---|---|---|---|---|
| ~~BUG-01~~ | ~~Flotte blanche — `useSearchParams` sans Suspense~~ | Arch | ~~**P0**~~ | ✅ 2026-06-04 |
| ~~BUG-02~~ | ~~`cached-org-settings` — `cookies()` dans `unstable_cache()`~~ | Arch | ~~**P0**~~ | ✅ 2026-06-04 |
| ~~UX-B01~~ | ~~Erreurs silencieuses 10 handlers~~ | UX | ~~**P0**~~ | ✅ 2026-06-04 |
| ~~TS-01~~ | ~~Crash Realtime chat payload sans JOIN~~ | TS | ~~**P0**~~ | ✅ déjà en place |
| ~~TS-02~~ | ~~Upsert onboarding sans `.error` check~~ | TS | ~~**P0**~~ | ✅ 2026-06-04 |
| ~~TS-03~~ | ~~Cast Promise-level rank_evaluations~~ | TS | ~~**P0**~~ | ✅ 2026-06-04 |
| ~~PERF-01~~ | ~~layout.tsx — select colonnes spécifiques~~ | Perf | ~~**P0**~~ | ✅ 2026-06-04 |
| ~~PERF-02~~ | ~~Dashboard — attendeeCounts dans Promise.all~~ | Perf | ~~P1~~ | ✅ 2026-06-04 |
| ~~PERF-03~~ | ~~Dashboard — cache org_settings~~ | Perf | ~~P1~~ | ✅ 2026-06-04 |
| ~~PERF-04~~ | ~~Événements — 2 requêtes séquentielles~~ | Perf | ~~P1~~ | ✅ 2026-06-04 |
| ~~PERF-05~~ | ~~Opérations list — select colonnes~~ | Perf | ~~P1~~ | ✅ 2026-06-04 |
| ~~PERF-06~~ | ~~Membres list — select colonnes~~ | Perf | ~~P1~~ | ✅ 2026-06-04 |
| ~~PERF-07~~ | ~~Supprimer hooks TanStack morts~~ | Perf | ~~P1~~ | ✅ 2026-06-04 |
| ~~PERF-12~~ | ~~public-stats.ts — tags cache~~ | Perf | ~~P2~~ | ✅ 2026-06-04 |
| ~~TS-05~~ | ~~force-dynamic manquant ×6 pages~~ | TS | ~~P1~~ | ✅ 2026-06-04 |
| ~~TS-06~~ | ~~OnboardingStep type dans actions/~~ | TS | ~~P1~~ | ✅ 2026-06-04 |
| ~~TS-08~~ | ~~catch(err) sans : unknown ×4~~ | TS | ~~P2~~ | ✅ 2026-06-04 |
| ~~TS-09~~ | ~~Type inline inventory_stock~~ | TS | ~~P2~~ | ✅ 2026-06-04 |
| ~~UX-D05~~ | ~~Spinner manquant OpForm~~ | UX | ~~P1~~ | ✅ 2026-06-04 |
| ~~UX-P02~~ | ~~aria-expanded manquant toggle historique~~ | UX | ~~P2~~ | ✅ 2026-06-04 |
| ~~PERF-08~~ | ~~membres/[username] — waterfall → Promise.all~~ | Perf | ~~P1~~ | ✅ 2026-06-04 |
| ~~PERF-09~~ | ~~operations/[id] — waterfall → 2 vagues~~ | Perf | ~~P1~~ | ✅ 2026-06-04 |
| ~~TS-04~~ | ~~getAuth() dupliqué ×5 → lib/auth-helpers.ts~~ | TS | ~~P1~~ | ✅ 2026-06-04 |
| ~~TS-07~~ | ~~useEffect deps vide silencé ESLint~~ | TS | ~~P1~~ | ✅ 2026-06-04 |
| ~~UX-D03~~ | ~~title → aria-label 7 boutons~~ | UX | ~~P1~~ | ✅ 2026-06-04 |
| ~~UX-D06~~ | ~~isPending partagé 3 boutons statut~~ | UX | ~~P1~~ | ✅ 2026-06-04 |
| ~~UX-D01~~ | ~~loading.tsx manquants 8 pages~~ | UX | ~~P1~~ | ✅ 2026-06-04 |
| ~~UX-D02~~ | ~~Mobile nav surchargée (10 icônes)~~ | UX | ~~P1~~ | ✅ 2026-06-04 |
| ~~UX-D04~~ | ~~Labels Radix non-associés (10+ cas)~~ | UX | ~~P1~~ | ✅ 2026-06-04 |
| ~~ARCH-05~~ | ~~Double fetch generateMetadata + body~~ | Arch | ~~P1~~ | ✅ 2026-06-04 |
| ~~ARCH-07~~ | ~~Requêtes multi-passes operations/page~~ | Arch | ~~P1~~ | ✅ 2026-06-04 |
| ~~PERF-10~~ | ~~member_points → RPC SQL agrégation~~ | Perf | ~~P2~~ | ✅ 2026-06-04 |
| ~~PERF-11~~ | ~~membre-detail.tsx — use client inutile~~ | Perf | ~~P2~~ | ✅ 2026-06-04 |
| ~~ARCH-09~~ | ~~Props dense MembreDetail (13 props)~~ | Arch | ~~P2~~ | ✅ 2026-06-04 |
| ~~ARCH-10~~ | ~~Filtrage flotte côté JS~~ | Arch | ~~P2~~ | ✅ 2026-06-04 |
| ~~UX-P01~~ | ~~Composants natifs au lieu de shadcn ×3~~ | UX | ~~P2~~ | ✅ 2026-06-04 |

**Total P0 nouveaux :** 7 items (dont BUG-02) — **7 corrigés ✅**
**Total P1 nouveaux :** 20 items · ~13h — **21 corrigés (+UX-D01, UX-D02, UX-D04, ARCH-05, ARCH-07) — TOUS FERMÉS ✅**
**Total P2 nouveaux :** 9 items · ~3h30 — **9 corrigés — TOUS FERMÉS ✅**

---

## 🎨 Nouvelles features UX — Sprint 2026-06-05

| ID | Item | Domaine | Priorité | Statut |
|---|---|---|---|---|
| ~~FEAT-08~~ | ~~Fiche événement cliquable → dialog lecture seule~~ | UX | P1 | ✅ 2026-06-05 |
| ~~UX-06~~ | ~~Champ "mot de passe actuel" requis pour modifier le mdp~~ | UX | P1 | ✅ 2026-06-05 |
| UX-07 | Background visuel thème SC (hangar / planète sombre) | UX | P2 | 📋 à faire |

### ~~FEAT-08 · Fiche événement cliquable → dialog lecture seule~~ ✅ TERMINÉ 2026-06-05
`EventViewDialog` créé — dialog lecture seule accessible à tous les membres. Cards cliquables avec `stopPropagation` sur les boutons d'action.

### ~~UX-06 · Champ "mot de passe actuel" requis~~ ✅ TERMINÉ 2026-06-05
Vérification `signInWithPassword` avant `updateUser`. Champ `autoComplete="current-password"`, erreur inline, zones tactiles ≥ 44px.