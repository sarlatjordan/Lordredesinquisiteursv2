# Backlog — Dette technique INQFR

> Audit du 2026-06-15 — 21 problèmes recensés, aucun critique ni élevé.
> Résolu au 2026-06-15 : TS-01, TS-02, SA-01, SA-02 (commit d9c6c21)
> Résolu au 2026-06-15 : PERF-01, PAT-01 (commit 70f4f47)
> Résolu au 2026-06-15 : PAT-02, PAT-03, QUAL-01, TS-03, TS-04, SA-03, SA-04, SA-05, SA-06, PERF-02, PERF-03, RLS-01, RLS-02 (commit caee7a4)

## Résumé

| Catégorie | Moyen | Faible | Total | Résolu |
|---|:---:|:---:|:---:|:---:|
| TypeScript (TS) | 2 | 2 | **4** | 4 |
| Server Actions (SA) | 2 | 4 | **6** | 6 |
| Sécurité RLS (RLS) | 0 | 2 | **2** | 2 |
| Performance (PERF) | 1 | 3 | **4** | 4 |
| Cohérence patterns (PAT) | 1 | 2 | **3** | 3 |
| Code mort / qualité (QUAL) | 0 | 1 | **1** | 1 |
| **Total** | **6** | **14** | **21** | **21** |

**Dette résiduelle : 0 item.**

---

## TypeScript

### ~~[TS-01 · MOYEN] `app/(app)/layout.tsx:41`~~ ✅ résolu — d9c6c21
~~**Problème :** `data as unknown as Profile | null` — SELECT de 5 colonnes casté vers `Profile` complet.~~
`ProfileSummary = Pick<Profile, 'id'|'role'|'display_name'|'username'|'avatar_url'>` défini dans `types/index.ts`.

### ~~[TS-02 · MOYEN] `components/chat/chat-layout.tsx:110`~~ ✅ résolu — d9c6c21
~~**Problème :** `data as unknown as ChatMessageWithAuthor` sans guard sur `author`.~~
Guard `data?.author` ajouté avant le cast.

### ~~[TS-03 · FAIBLE] `actions/hangar-sync.ts:419`~~ ✅ résolu — caee7a4
~~**Problème :** `{ _html: text } as unknown as RsiHangarResponse['data']` — objet non-conforme casté vers le type de réponse structurée.~~
Cast supprimé — l'index signature `[key: string]: unknown` de `RsiHangarResponse['data']` couvre directement `{ _html: text }`.

### ~~[TS-04 · FAIBLE] `components/ui/calendar.tsx:91`~~ ✅ résolu — caee7a4
~~**Problème :** Seul `as any` du codebase.~~
Remplacé par `as Record<string, string>`.

---

## Server Actions

### ~~[SA-01 · MOYEN] `actions/notifications.ts` — `markRead`~~ ✅ résolu — d9c6c21
~~**Problème :** `notificationId` non validé comme UUID.~~
`z.string().uuid().safeParse()` ajouté, `parsed.data` utilisé dans la requête.

### ~~[SA-02 · MOYEN] `actions/onboarding.ts` — `claimOnboardingStep`~~ ✅ résolu — d9c6c21
~~**Problème :** `step` reçu sans validation Zod.~~
`OnboardingStepSchema = z.enum([...])` valide le step avant tout accès DB.

### ~~[SA-03 · FAIBLE] `actions/org-settings.ts` — `setRecruitmentOpen`~~ ✅ résolu — caee7a4
~~**Problème :** `open: boolean` passé sans `.safeParse`.~~
`z.boolean().safeParse(open)` ajouté.

### ~~[SA-04 · FAIBLE] `actions/ships.ts` — `updateShipStatus`, `deleteShip`~~ ✅ résolu — caee7a4
~~**Problème :** `status` (union de strings) et `shipId` (UUID) sans validation Zod.~~
`z.string().uuid()` sur `shipId`, `z.enum([...])` sur `status`.

### ~~[SA-05 · FAIBLE] `actions/members.ts` — `updateMemberRole`~~ ✅ résolu — caee7a4
~~**Problème :** `role` validé par TypeScript uniquement, `memberId` pas validé comme UUID.~~
`z.string().uuid()` sur `memberId`, `z.enum([...ROLES])` sur `role`.

### ~~[SA-06 · FAIBLE] `actions/notifications.ts` — `createAdminClient` dans `markRead`~~ ✅ résolu — caee7a4
~~**Problème :** Admin client bypass RLS pour des mutations user-scoped.~~
Utilise maintenant `createClient()` + filtre `.eq('profile_id', user.id)`.

---

## Sécurité RLS

### ~~[RLS-01 · FAIBLE] `supabase/migrations/006_gallery.sql:22-33`~~ ✅ résolu — caee7a4
~~**Problème :** Policies Storage comparent `role = 'sage'` au lieu de `get_my_privilege() >= 1000`.~~
Migration 037 — policies recrées avec `public.get_my_privilege() >= 1000`.

### ~~[RLS-02 · FAIBLE] `supabase/migrations/001_initial.sql` — Policies legacy `admin`/`officer`~~ ✅ résolu — caee7a4
~~**Problème :** Policies `events_update`, `events_delete`, `ships_delete`, `resources_*` référencent des rôles inexistants.~~
Vérification grep : toutes ces policies sont déjà droppées par les migrations 003 et 004. Aucune policy obsolète en production.

---

## Performance

### ~~[PERF-01 · MOYEN] `app/(app)/membres/page.tsx:22-34`~~ ✅ résolu — 70f4f47
~~**Problème :** 3 requêtes Supabase séquentielles après `getUser()`.~~
`Promise.all([profiles+role, rpc points, membres query])` — query membres construite avant le `Promise.all`.

### ~~[PERF-02 · FAIBLE] `app/(app)/admin/activite/page.tsx`, `admin/avatars/page.tsx`, `admin/points/page.tsx`~~ ✅ résolu — caee7a4
~~**Problème :** Pattern `getUser()` → `profiles.select('role')` séquentiel dans ces 3 pages admin.~~
`Promise.all([profileResult, dataResult])` dans les 3 pages.

### ~~[PERF-03 · FAIBLE] `app/(app)/evenements/page.tsx:14-29`~~ ✅ résolu — caee7a4
~~**Problème :** `getUser()` + `profiles.select('role')` séquentiels avant le `Promise.all` des requêtes événements.~~
Deux phases : phase 1 `Promise.all([profile, attendees, count])`, phase 2 `Promise.all([upcoming, terminated, overdue])` après résolution du privilege.

---

## Cohérence patterns

### ~~[PAT-01 · MOYEN] `actions/applications.ts:83` — `console.error` sans guard `NODE_ENV`~~ ✅ résolu — 70f4f47
~~**Problème :** `console.error` expose des détails d'erreur DB en production.~~
Encadré par `if (process.env.NODE_ENV === 'development')`.

### ~~[PAT-02 · FAIBLE] `app/(app)/mfa/page.tsx` — `export const dynamic` manquant~~ ✅ résolu — caee7a4
~~**Problème :** Seule page `app/(app)/` sans `export const dynamic = 'force-dynamic'`.~~
`export const dynamic = 'force-dynamic'` ajouté.

### ~~[PAT-03 · FAIBLE] `actions/members.ts` — `updateMemberRole` séquentialité interne~~ ✅ résolu — caee7a4
~~**Problème :** `profiles.select(target)` et `member_points.select` séquentiels dans la même action.~~
`Promise.all([update profiles, select points])` parallélisé.

---

## Code mort / qualité

### ~~[QUAL-01 · FAIBLE] `actions/hangar-sync.ts:443` — Message d'erreur trompeur~~ ✅ résolu — caee7a4
~~**Problème :** `'Aucun vaisseau trouvé. Log console pour debug structure.'` fait référence à des logs absents en production.~~
Message corrigé : `'Aucun vaisseau trouvé dans la réponse RSI.'`
