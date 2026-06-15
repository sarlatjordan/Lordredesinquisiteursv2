# Backlog — Dette technique INQFR

> Audit du 2026-06-15 — 21 problèmes recensés, aucun critique ni élevé.

## Résumé

| Catégorie | Moyen | Faible | Total |
|---|:---:|:---:|:---:|
| TypeScript (TS) | 2 | 2 | **4** |
| Server Actions (SA) | 2 | 4 | **6** |
| Sécurité RLS (RLS) | 0 | 2 | **2** |
| Performance (PERF) | 1 | 3 | **4** |
| Cohérence patterns (PAT) | 1 | 2 | **3** |
| Code mort / qualité (QUAL) | 0 | 1 | **1** |
| **Total** | **6** | **14** | **21** |

---

## TypeScript

### [TS-01 · MOYEN] `app/(app)/layout.tsx:41`
**Problème :** `data as unknown as Profile | null` — SELECT de 5 colonnes casté vers `Profile` complet. Les champs absents seront `undefined` à l'exécution mais déclarés présents.
**Fix :** Définir un type `ProfileSummary` pour les 5 colonnes sélectionnées, ou étendre le SELECT.

### [TS-02 · MOYEN] `components/chat/chat-layout.tsx:110`
**Problème :** `data as unknown as ChatMessageWithAuthor` dans un listener Realtime. Le payload brut n'a pas la même structure qu'un JOIN — le champ `author` est absent.
**Fix :** Reconstruire `ChatMessageWithAuthor` depuis le payload brut ou refetch le message après réception.

### [TS-03 · FAIBLE] `actions/hangar-sync.ts:419`
**Problème :** `{ _html: text } as unknown as RsiHangarResponse['data']` — objet non-conforme casté vers le type de réponse structurée. Hack de debug.
**Fix :** Créer un type discriminé `HangarRawHtml` séparé de `RsiHangarResponse['data']`.

### [TS-04 · FAIBLE] `components/ui/calendar.tsx:91`
**Problème :** Seul `as any` du codebase.
**Fix :** Typer correctement avec `Record<string, string>` ou le type shadcn approprié.

---

## Server Actions

### [SA-01 · MOYEN] `actions/notifications.ts` — `markRead`, `markAllRead`
**Problème :** Mutations sans validation Zod. `notificationId` n'est pas validé comme UUID.
**Fix :** `z.string().uuid().safeParse(notificationId)` avant la mutation.

### [SA-02 · MOYEN] `actions/onboarding.ts` — `claimOnboardingStep`
**Problème :** `step: ExtendedOnboardingStep` reçu sans validation Zod. Un step arbitraire peut être inséré en DB si le type est contourné côté appelant.
**Fix :** `z.enum([...VALID_STEPS]).safeParse(step)` en début de fonction.

### [SA-03 · FAIBLE] `actions/org-settings.ts` — `setRecruitmentOpen`
**Problème :** `open: boolean` passé sans `.safeParse`.
**Fix :** `z.boolean().safeParse(open)`.

### [SA-04 · FAIBLE] `actions/ships.ts` — `updateShipStatus`, `deleteShip`
**Problème :** `status` (union de strings) et `shipId` (UUID) sans validation Zod.
**Fix :** `z.string().uuid()` sur `shipId`, `z.enum([...])` sur `status`.

### [SA-05 · FAIBLE] `actions/members.ts` — `updateMemberRole`
**Problème :** `role` validé par TypeScript uniquement, `memberId` pas validé comme UUID.
**Fix :** `z.string().uuid()` sur `memberId`, `z.enum([...ROLES])` sur `role`.

### [SA-06 · FAIBLE] `actions/notifications.ts` — `createAdminClient` dans `markRead`
**Problème :** Admin client bypass RLS pour des mutations user-scoped couvertes par la policy `notifs_update`.
**Fix :** Utiliser `supabase` (client utilisateur) à la place.

---

## Sécurité RLS

### [RLS-01 · FAIBLE] `supabase/migrations/006_gallery.sql:22-33`
**Problème :** Policies Storage comparent `role = 'sage'` directement au lieu de `get_my_privilege() >= 1000`. Incohérent avec le reste du projet, cassera si la hiérarchie de rangs évolue.
**Fix :** Migration 037 — remplacer par `get_my_privilege() >= 1000`.

### [RLS-02 · FAIBLE] `supabase/migrations/001_initial.sql` — Policies legacy `admin`/`officer`
**Problème :** Policies `events_update`, `events_delete`, `ships_delete`, `resources_*` référencent des rôles inexistants. Inopérantes mais source de confusion à la lecture.
**Fix :** Migration qui drop les policies obsolètes et recrée avec `get_my_privilege()`.

---

## Performance

### [PERF-01 · MOYEN] `app/(app)/membres/page.tsx:22-34`
**Problème :** 3 requêtes Supabase séquentielles après `getUser()` — `profiles.select('role')`, `rpc('get_member_points_totals')`, query membres complète.
**Fix :** Paralléliser les 3 dans un `Promise.all` après `getUser`.

### [PERF-02 · FAIBLE] `app/(app)/admin/activite/page.tsx`, `admin/avatars/page.tsx`, `admin/points/page.tsx`
**Problème :** Pattern `getUser()` → `profiles.select('role')` séquentiel dans ces 3 pages admin.
**Fix :** Paralléliser avec le pattern de `membres/[username]/page.tsx`.

### [PERF-03 · FAIBLE] `app/(app)/evenements/page.tsx:14-29`
**Problème :** `getUser()` + `profiles.select('role')` séquentiels avant le `Promise.all` des 5 requêtes.
**Fix :** Inclure `profiles.select('role')` dans le `Promise.all`.

---

## Cohérence patterns

### [PAT-01 · MOYEN] `actions/applications.ts:83` — `console.error` sans guard `NODE_ENV`
**Problème :** `console.error('[submitApplication] Supabase error:', ...)` expose des détails d'erreur DB dans les logs Vercel en production.
**Fix :** Supprimer ou encadrer par `if (process.env.NODE_ENV === 'development')`.

### [PAT-02 · FAIBLE] `app/(app)/mfa/page.tsx` — `export const dynamic` manquant
**Problème :** Seule page `app/(app)/` sans `export const dynamic = 'force-dynamic'` (les 29 autres l'ont).
**Fix :** Ajouter `export const dynamic = 'force-dynamic'`.

### [PAT-03 · FAIBLE] `actions/members.ts` — `updateMemberRole` séquentialité interne
**Problème :** `profiles.select(target)` et `member_points.select` séquentiels dans la même action.
**Fix :** `Promise.all([...])`.

---

## Code mort / qualité

### [QUAL-01 · FAIBLE] `actions/hangar-sync.ts:443` — Message d'erreur trompeur
**Problème :** `'Aucun vaisseau trouvé. Log console pour debug structure.'` fait référence à des logs console absents en production (gardés par `NODE_ENV`).
**Fix :** `'Aucun vaisseau trouvé dans la réponse RSI.'`
