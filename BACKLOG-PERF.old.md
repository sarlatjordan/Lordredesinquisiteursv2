# INQFR — Backlog Performance

> Généré suite à l'audit performance du 2026-06-04.
> Chaque item est actionnable par un agent Claude Code sans contexte supplémentaire.
> Stack : Next.js 16 App Router · TypeScript strict · Supabase (Auth + RLS) · pnpm

---

## Légende

| Priorité | Signification |
|---|---|
| **P0** | Dégradation mesurable sur le hot path (chaque requête) |
| **P1** | Gain significatif sur des pages fréquentes |
| **P2** | Gain long terme / scalabilité |

---

## P0 — Hot path (chaque requête authentifiée)

### PERF-01 · Réduire `profiles.select('*')` dans le layout
**Fichier :** `app/(app)/layout.tsx:22`

Le layout s'exécute sur **chaque page authentifiée**. Il fetche toutes les colonnes du profil alors que seules quelques-unes sont utilisées (Sidebar + TopBar).

**Colonnes actuellement utilisées par le layout :**
- `role` — pour `getRolePrivilege()` et `RedactedContent`
- `display_name`, `username`, `avatar_url` — passés à `Sidebar`
- `is_active` — non utilisé explicitement dans le layout, hérité via profile spread

**Action :**
```ts
// Remplacer ligne 21-25 :
const { data } = await supabase
  .from('profiles')
  .select('id, role, display_name, username, avatar_url, is_active, joined_at')
  .eq('id', user.id)
  .single()
```

Vérifier ensuite que `Sidebar` et `TopBar` reçoivent tous les champs dont ils ont besoin via leurs props.

**Effort :** < 10 min · **Impact :** Élevé (réduit le payload réseau sur chaque navigation)

---

## P1 — Pages fréquentes

### PERF-02 · Dashboard : `attendeeCounts` séquentiel hors `Promise.all`
**Fichier :** `app/(app)/dashboard/page.tsx:103-111`

La requête `event_attendees` (comptage des participants) s'exécute **après** le `Promise.all` principal alors qu'elle n'en dépend pas. C'est +1 aller-retour DB (~50ms) systématique.

**Action :** Ajouter dans le `Promise.all` existant (ligne 34) :

```ts
const [
  { count: memberCount },
  { count: activeEventCount },
  { count: shipCount },
  { data: upcomingRaw },
  { data: recentShips },
  { data: orgSettings },
  { data: uecItemsRaw },
  { data: attendeeCounts },  // ← déplacer ici
] = await Promise.all([
  // ...requêtes existantes...
  supabase.from('event_attendees').select('event_id').eq('status', 'confirme'),
])
```

Supprimer ensuite le bloc `await supabase.from('event_attendees')...` aux lignes 103-111.

**Effort :** < 10 min · **Impact :** Moyen (~50ms sur le dashboard)

---

### PERF-03 · Dashboard : `org_settings` sans cache
**Fichiers :** `app/(app)/dashboard/page.tsx:58`, `actions/org-settings.ts:10`

La table `org_settings` (1 ligne, rarement modifiée) est fetchée à chaque chargement du dashboard sans mise en cache.

**Action :**

1. Créer `lib/cached-org-settings.ts` :
```ts
import { unstable_cache } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export const getCachedOrgSettings = unstable_cache(
  async () => {
    const supabase = await createClient()
    const { data } = await supabase
      .from('org_settings')
      .select('recruitment_open')
      .single()
    return data
  },
  ['org-settings'],
  { revalidate: 60, tags: ['org-settings'] }
)
```

2. Dans `dashboard/page.tsx`, remplacer la requête `org_settings` par `await getCachedOrgSettings()`.

3. Dans `actions/org-settings.ts`, appeler `revalidateTag('org-settings')` après chaque mutation `toggleRecruitment`.

**Effort :** 20 min · **Impact :** Moyen (évite 1 roundtrip DB à chaque dashboard load)

---

### PERF-04 · Événements : 2 requêtes séquentielles hors `Promise.all`
**Fichier :** `app/(app)/evenements/page.tsx:72-90`

Après les 3 requêtes d'événements en `Promise.all`, deux requêtes `event_attendees` s'exécutent séquentiellement. Elles ne dépendent d'aucun résultat du `Promise.all` (elles utilisent uniquement `user.id`).

**Action :** Intégrer dans le `Promise.all` ligne 33 :

```ts
const [upcomingRes, terminatedRes, overdueRes, userAttendeesRes, countDataRes] = await Promise.all([
  supabase.from('events').select('*').in('status', ['planifie', 'en_cours']).gte('start_at', now).lte('min_privilege', userPrivilege).order('start_at', { ascending: true }),
  supabase.from('events').select('*').in('status', ['termine', 'annule']).lte('min_privilege', userPrivilege).order('start_at', { ascending: false }).limit(20),
  supabase.from('events').select('*').in('status', ['planifie', 'en_cours']).lt('start_at', now).lte('min_privilege', userPrivilege).order('start_at', { ascending: false }).limit(10),
  user
    ? supabase.from('event_attendees').select('*').eq('profile_id', user.id)
    : Promise.resolve({ data: [] }),
  supabase.from('event_attendees').select('event_id').eq('status', 'confirme'),
])
```

Adapter ensuite `userAttendeesRes.data` et `countDataRes.data` dans le corps de la fonction.

**Effort :** 15 min · **Impact :** Moyen (~100ms sur la page événements)

---

### PERF-05 · Réduire `select('*')` sur les listes d'opérations
**Fichier :** `app/(app)/operations/page.tsx:34,39`

Deux requêtes `operations.select('*')` fetchent toutes les colonnes pour la vue grille (OpCard), incluant `description` et `debrief` (textes longs, non affichés en liste).

**Colonnes requises par `OpCard` à vérifier dans `components/operations/op-card.tsx` :**
`id, title, type, status, risk_level, departure_at, location_system, min_privilege, commander_id, created_by, created_at`

**Action :**
```ts
// Remplacer les deux supabase.from('operations').select('*') :
.select('id, title, type, status, risk_level, departure_at, location_system, min_privilege, commander_id, created_by, created_at')
```

⚠️ Vérifier `op-card.tsx` et `OperationWithDetails` pour s'assurer qu'aucun champ supplémentaire n'est utilisé dans la liste.

**Effort :** 15 min · **Impact :** Moyen (réduit payload sur la page la plus utilisée après dashboard)

---

### PERF-06 · Réduire `select('*')` sur la liste des membres
**Fichier :** `app/(app)/membres/page.tsx:43`

La requête fetche toutes les colonnes de `profiles` pour remplir des `MemberCard`. Les colonnes `bio`, `last_seen_at`, etc. ne sont pas affichées dans la card.

**Action :**
```ts
// Remplacer .select('*') :
let query = supabase
  .from('profiles')
  .select('id, username, display_name, role, avatar_url, star_citizen_handle, joined_at, is_active')
  .eq('is_active', true)
  ...
```

⚠️ Vérifier `components/membres/member-card.tsx` pour confirmer les colonnes utilisées.

**Effort :** 10 min · **Impact :** Moyen (réduit payload proportionnel au nombre de membres)

---

### PERF-07 · Supprimer les hooks TanStack Query inutilisés (dead code)
**Fichiers :** `hooks/use-events.ts`, `hooks/use-members.ts`

Ces hooks font des requêtes Supabase côté client. Aucun composant ne les importe dans l'application (vérifié par grep). Ils créent de la confusion (double système de fetch) et alourdissent les revues de code.

**Action :** Supprimer les deux fichiers.

```bash
# Vérification préalable :
grep -r "use-events\|use-members\|useUpcomingEvents\|useMembers\|useMember\|useCurrentUser" app/ components/
# Si aucun résultat → supprimer
```

**Effort :** 5 min · **Impact :** Clarté codebase

---

## P1 — Refactors waterfall

### PERF-08 · `/membres/[username]` — 9 aller-retours séquentiels → ~4
**Fichier :** `app/(app)/membres/[username]/page.tsx`

La page effectue jusqu'à 9 aller-retours DB en cascade. Après avoir le `profile.id`, tout le reste devrait démarrer en parallèle.

**Waterfall actuel :**
```
auth → me → target_profile → progression → promotions → promoter_profiles → points → awarder_profiles → stats
```

**Action en 2 étapes :**

**Étape A — JOINs Supabase pour éliminer 2 roundtrips :**
```ts
// Ligne 49 : remplacer promotions + fetch promoterProfiles séparé
const { data: promotionsRaw } = await supabase
  .from('member_promotions')
  .select('*, promoter:profiles!promoted_by(id, username, display_name)')
  .eq('profile_id', profile.id)
  .order('promoted_at', { ascending: false })
// → supprimer les lignes 56-63 (promoterIds + promoterProfiles)
// → adapter promoterMap : p.promoter?.display_name ?? p.promoter?.username

// Ligne 72 : remplacer points + fetch awarderProfiles séparé
const { data: pointsRaw } = canSeePoints
  ? await supabase
      .from('member_points')
      .select('*, awarder:profiles!awarded_by(id, username, display_name)')
      .eq('profile_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(20)
  : { data: [] }
// → supprimer les lignes 77-84 (awarderIds + awarderProfiles)
```

**Étape B — Paralléliser après `profile.id` :**
```ts
const profile = profileRaw as Profile
const isOwnProfile = profile.id === user.id
const canSeePoints = isSage || canAwardPoints || isOwnProfile

const [progressionResult, promotionsResult, pointsResult, statsResult] = await Promise.all([
  supabase.from('member_progressions').select('*').eq('profile_id', profile.id).single(),
  supabase.from('member_promotions').select('*, promoter:profiles!promoted_by(id, username, display_name)').eq('profile_id', profile.id).order('promoted_at', { ascending: false }),
  canSeePoints
    ? supabase.from('member_points').select('*, awarder:profiles!awarded_by(id, username, display_name)').eq('profile_id', profile.id).order('created_at', { ascending: false }).limit(20)
    : Promise.resolve({ data: [] }),
  Promise.all([
    supabase.from('event_attendees').select('*', { count: 'exact', head: true }).eq('profile_id', profile.id).eq('status', 'confirme'),
    supabase.from('op_registrations').select('*', { count: 'exact', head: true }).eq('profile_id', profile.id).eq('status', 'confirmed'),
    supabase.from('ships').select('*', { count: 'exact', head: true }).eq('owner_id', profile.id),
  ]),
])
```

**Effort :** 45 min · **Impact :** Élevé (~200ms gagnés par chargement fiche membre)

---

### PERF-09 · `/operations/[id]` — paralléliser les fetches post-`op`
**Fichier :** `app/(app)/operations/[id]/page.tsx:37-127`

Après le fetch de l'opération, 6 requêtes s'enchaînent en cascade.

**Waterfall actuel :**
```
auth → profile → op → commander → slots → assigned_profiles → registrations → reg_profiles → members → resources → inventory
```

**Action — vague 1 en parallèle, vague 2 en parallèle :**
```ts
// Vague 1 (toutes indépendantes, juste besoin de op.id et op.commander_id) :
const [commanderResult, slotsResult, registrationsResult, membersResult, resourcesResult] = await Promise.all([
  op.commander_id
    ? supabase.from('profiles').select('username, display_name, avatar_url').eq('id', op.commander_id).single()
    : Promise.resolve({ data: null }),
  supabase.from('op_role_slots').select('*').eq('operation_id', id).order('role'),
  canManage
    ? supabase.from('op_registrations').select('*').eq('operation_id', id).order('created_at')
    : supabase.from('op_registrations').select('*').eq('operation_id', id).eq('profile_id', user.id),
  canManage
    ? supabase.from('profiles').select('id, username, display_name').order('display_name')
    : Promise.resolve({ data: [] }),
  supabase.from('op_resources').select('*').eq('operation_id', id).order('created_at', { ascending: true }),
])

// Vague 2 (dépend de vague 1) :
const assignedIds = (slotsResult.data ?? []).map((s) => s.assigned_profile_id).filter(Boolean) as string[]
const regProfileIds = [...new Set((registrationsResult.data ?? []).map((r) => r.profile_id))]
const [assignedProfilesResult, regProfilesResult, inventoryResult] = await Promise.all([
  assignedIds.length > 0
    ? supabase.from('profiles').select('id, username, display_name, avatar_url').in('id', assignedIds)
    : Promise.resolve({ data: [] }),
  regProfileIds.length > 0
    ? supabase.from('profiles').select('id, username, display_name, avatar_url').in('id', regProfileIds)
    : Promise.resolve({ data: [] }),
  canManage
    ? Promise.all([
        supabase.from('inventory_items').select('*').order('name'),
        supabase.from('inventory_stock').select('*'),
      ])
    : Promise.resolve([{ data: [] }, { data: [] }]),
])
```

**Effort :** 45 min · **Impact :** Élevé (~300ms gagnés par chargement fiche opération)

---

## P2 — Scalabilité long terme

### PERF-10 · `member_points` — agrégation côté DB (RPC SQL)
**Fichier :** `app/(app)/membres/page.tsx:34`

La page `/membres` fetche **toutes les lignes** de `member_points` pour calculer les totaux en JS. Avec l'historique croissant, cette requête grossit indéfiniment.

**Action :**

1. Créer une migration `025_member_points_total.sql` :
```sql
CREATE OR REPLACE FUNCTION get_member_points_totals()
RETURNS TABLE(profile_id uuid, total_points bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT profile_id, SUM(points)::bigint
  FROM public.member_points
  GROUP BY profile_id;
$$;
```

2. Remplacer dans `membres/page.tsx:34` :
```ts
const { data: pointsData } = await supabase.rpc('get_member_points_totals')
const pointsMap = (pointsData ?? []).reduce<Record<string, number>>((acc, row) => {
  acc[row.profile_id] = row.total_points
  return acc
}, {})
```

**Effort :** 30 min · **Impact :** Élevé à long terme (O(n_membres) vs O(n_points))

---

### PERF-11 · `membre-detail.tsx` — retirer `'use client'` inutile
**Fichier :** `app/(app)/membres/[username]/membre-detail.tsx:1`

Le composant est `'use client'` uniquement pour `useRouter()` → `router.refresh()`. Or les Server Actions `updateMemberProgression` et `awardPoints` appellent déjà `revalidatePath`, rendant le `refresh()` redondant.

**Impact bundle :** Tout le HTML de la fiche membre (stats, progressions, promotions) est rendu côté client + Framer Motion bundlé pour cette page.

**Action :**
1. Supprimer `'use client'` de `membre-detail.tsx`
2. Supprimer `useRouter` et son import
3. Supprimer `const router = useRouter()` et tous les `router.refresh()`
4. Dans `ProgressionForm` et `AwardPointsDialog`, s'assurer que `onSuccess` (si encore nécessaire) appelle directement `startTransition(() => router.refresh())` depuis leur propre context client — ou simplement supprimer le callback `onSuccess` si la revalidation serveur suffit
5. Supprimer `import { useRouter } from 'next/navigation'`

⚠️ Tester que les points et progressions se mettent bien à jour après attribution sans `router.refresh()` explicite.

**Effort :** 60 min · **Impact :** Moyen (améliore le rendu initial, réduit le JS client)

---

### PERF-12 · `public-stats.ts` — ajouter tag de cache pour invalidation on-demand
**Fichier :** `lib/public-stats.ts`

L'`unstable_cache` est correctement configurée (`revalidate: 3600`) mais sans `tags`. Sans tag, impossible d'invalider le cache manuellement quand les stats changent (nouvelle promotion, nouveau vaisseau enregistré).

**Action :**
```ts
// lib/public-stats.ts — déjà bien, juste ajouter des tags :
export const getPublicStats = unstable_cache(
  async () => { /* ... */ },
  ['public-stats'],
  { revalidate: 3600, tags: ['public-stats'] }  // ← ajouter tags
)
```

Ajouter `revalidateTag('public-stats')` dans :
- `actions/members.ts` — après création de compte
- `actions/progression.ts` — après promotion
- `actions/ships.ts` — après ajout/suppression vaisseau

**Effort :** 15 min · **Impact :** Faible/clarté (stats correctes après événements majeurs)

---

## Synthèse exécutive

| # | Item | Priorité | Effort | Impact |
|---|---|---|---|---|
| PERF-01 | `layout.tsx` — select colonnes spécifiques | P0 | < 10 min | ⭐⭐⭐ Élevé (chaque requête) |
| PERF-02 | Dashboard — `attendeeCounts` dans Promise.all | P1 | < 10 min | ⭐⭐ Moyen |
| PERF-03 | Dashboard — cache `org_settings` | P1 | 20 min | ⭐⭐ Moyen |
| PERF-04 | Événements — 2 requêtes séquentielles | P1 | 15 min | ⭐⭐ Moyen |
| PERF-05 | Opérations list — select colonnes spécifiques | P1 | 15 min | ⭐⭐ Moyen |
| PERF-06 | Membres list — select colonnes spécifiques | P1 | 10 min | ⭐⭐ Moyen |
| PERF-07 | Supprimer hooks TanStack inutilisés | P1 | 5 min | ⭐ Clarté |
| PERF-08 | `/membres/[username]` — waterfall → Promise.all + JOINs | P1 | 45 min | ⭐⭐⭐ Élevé |
| PERF-09 | `/operations/[id]` — waterfall → 2 vagues parallèles | P1 | 45 min | ⭐⭐⭐ Élevé |
| PERF-10 | `member_points` → RPC SQL agrégation | P2 | 30 min | ⭐⭐⭐ Élevé (long terme) |
| PERF-11 | `membre-detail.tsx` — retirer `'use client'` | P2 | 60 min | ⭐⭐ Moyen |
| PERF-12 | `public-stats.ts` — tag cache manquant | P2 | 15 min | ⭐ Faible |

**Total wins rapides (PERF-01 à 07 hors PERF-03) :** ~55 min pour ~300ms gagnés sur les pages les plus fréquentées.
