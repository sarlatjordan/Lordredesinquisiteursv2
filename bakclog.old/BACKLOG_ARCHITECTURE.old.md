# INQFR — Backlog architecture

> Généré suite à l'audit architecture du 2026-06-04.
> Focus : qualité du code, patterns Next.js 16 App Router, Supabase, évolutivité.
> Chaque item est actionnable par un agent Claude Code sans contexte supplémentaire.
> Stack : Next.js 16 App Router · TypeScript strict · Supabase · Tailwind v4 · pnpm

---

## Légende

| Sévérité | Signification |
|---|---|
| **✗ Antipattern** | Comportement incorrect ou dangereux — à corriger en priorité |
| **⚠ Dette** | Code correct mais fragile ou non scalable — à planifier |
| **🧹 Nettoyage** | Code mort ou superflu — à supprimer |
| **🐛 Bug** | Comportement erroné observé en production/dev — à corriger |

---

## 🐛 Bugs actifs — À corriger

---

### BUG-01 · Page `/flotte` blanche intermittente — `useSearchParams()` sans `<Suspense>`

**Fichiers concernés :** `components/flotte/rsi-bookmarklet-import.tsx` + `app/(app)/flotte/page.tsx`

**Symptôme observé :** La page `/flotte` s'affiche vide. En rafraîchissant 3–4 fois elle réapparaît, puis redisparaît à la prochaine actualisation. Comportement non-déterministe.

**Cause :** `RsiBookmarkletImport` appelle `useSearchParams()` sans être enveloppé dans un `<Suspense>`. En Next.js App Router, un Client Component qui consomme `useSearchParams()` sans Suspense crée une frontière d'hydration ambiguë :
- **SSR** → Next.js rend le composant avec des searchParams vides (pas de query string côté serveur)
- **Hydration client** → React reçoit les vrais searchParams de l'URL
- Le mismatch déclenche une erreur d'hydration silencieuse qui démonte le contenu de la page

Le pattern intermittent (marche parfois, pas toujours) est caractéristique : selon si le cache Next.js sert le HTML pre-rendu ou force un re-render, le comportement change.

**Fix :**

```tsx
// app/(app)/flotte/page.tsx
import { Suspense } from 'react'

// Dans le JSX, remplacer :
<RsiBookmarkletImport />

// Par :
<Suspense fallback={null}>
  <RsiBookmarkletImport />
</Suspense>
```

`fallback={null}` est intentionnel : le composant retourne `null` quand il n'y a pas de param `rsi_import`, donc le fallback invisible est correct.

---

## ✗ Antipatterns — À corriger

---

### ~~ARCH-01 · Mutation DB dans un Server Component (messages)~~ ✅ CORRIGÉ 2026-06-04

**Fichiers modifiés :**
- `actions/chat.ts` → ajout de `markChannelsRead(channelIds: string[])` (bulk, pour le mount initial)
- `components/chat/chat-layout.tsx` → `useEffect` au mount via `useRef` stable, appelle `markChannelsRead`
- `app/(app)/messages/page.tsx` → bloc `upsert` supprimé, le RSC ne fait plus que lire

Note : `markChannelSeen(channelId)` (canal unique) existait déjà, ajouté par l'agent sécu pour le switch de canal. Les deux coexistent sans conflit.

---

### ~~ARCH-02 · `createAdminClient()` sans cache sur les pages publiques~~ ✅ CORRIGÉ 2026-06-04

**Fichiers modifiés :**
- `lib/public-data.ts` → nouveau fichier, `getPublicGallery()` (ISR 30 min, tag `public-gallery`) + `getPublicCalendarEvents(year, monthIndex)` (ISR 15 min, tag `public-calendar`)
- `app/galerie/page.tsx` → `dynamic = 'force-dynamic'` supprimé, `createAdminClient` supprimé, utilise `getPublicGallery()`
- `app/calendrier/page.tsx` → `createAdminClient` supprimé, `Promise.resolve()` superflu supprimé (ARCH-11 traité au passage), utilise `getPublicCalendarEvents(year, monthIndex)`

---

### ~~ARCH-03 · Fichier fantôme — `actions/promotion-requests.ts`~~ ✅ CORRIGÉ 2026-06-04

**Fichier supprimé :** `actions/promotion-requests.ts`

Note de diagnostic : le fichier contenait en réalité du vrai code avec un import invalide (`PromotionRequestSchema` inexistant dans `@/types`), causant un `uncaughtError` Turbopack qui contribuait aux pages blanches. La suppression a résolu ce vecteur de crash.

---

## ⚠ Dettes techniques — À planifier

---

### ~~ARCH-04 · Erreurs silencieuses dans `releaseAllOpResources`~~ ✅ CORRIGÉ 2026-06-04

**Fichier modifié :** `actions/operations.ts`

**Ce qui a été fait :**
- INSERT `inventory_transactions` : retour vérifié, `throw` si erreur
- `Promise.all` des UPDATEs stocks : retour vérifié, `throw` si l'un échoue
- `updateOperation` : `releaseAllOpResources` enveloppé dans `try/catch`, retourne `{ success: false, error }` si l'inventaire ne peut pas être mis à jour — l'opération n'est **pas** marquée terminée si l'inventaire échoue

Compatibilité vérifiée avec les modifications de l'agent sécu sur le même fichier (`try_reserve_inventory` dans `addOperationResource` — fonction distincte, aucun conflit).

---

### ARCH-05 · Double fetch profil dans `generateMetadata` + body de page

**Fichier concerné :** `app/(app)/membres/[username]/page.tsx`

**Problème :** `generateMetadata` et le corps de la page font deux requêtes Supabase séparées sur la même ressource (profil par username). Next.js App Router ne déduplique pas les appels PostgREST.

```ts
// generateMetadata — 1er RTT
await supabase.from('profiles').select('display_name, username').eq('username', username).single()

// Corps de page — 2ème RTT sur le même profil
await supabase.from('profiles').select('*').eq('username', username).single()
```

**Action :**

Créer un fetcher mémoïsé avec `React.cache()` dans le fichier de la page (ou dans un `lib/data/profiles.ts`) :

```ts
import { cache } from 'react'

const getProfileByUsername = cache(async (username: string) => {
  const supabase = await createClient()
  const { data } = await supabase.from('profiles').select('*').eq('username', username).single()
  return data as Profile | null
})

export async function generateMetadata({ params }) {
  const { username } = await params
  const profile = await getProfileByUsername(username)
  return { title: profile?.display_name ?? profile?.username ?? 'Membre' }
}

export default async function MembrePage({ params }) {
  const { username } = await params
  const profile = await getProfileByUsername(username)  // dédupliqué — 0 RTT supplémentaire
  ...
}
```

Vérifier si d'autres pages avec `generateMetadata` ont le même pattern (`logistique/[id]`, `operations/[id]`, `partenariats/[id]`).

---

### ARCH-06 · `member_points` full-scan sans agrégation SQL

**Fichier concerné :** `app/(app)/membres/page.tsx` lignes 34–38

**Problème :** La page charge **toutes** les lignes de `member_points` pour calculer les totaux par membre côté JavaScript :

```ts
const { data: pointsData } = await supabase.from('member_points').select('profile_id, points')
// Agrégation JS sur N lignes
const pointsMap = (pointsData ?? []).reduce<Record<string, number>>(...)
```

À mesure que les points s'accumulent (100 membres × 50 attributions = 5 000 lignes, 1 000 membres × 50 = 50 000 lignes), ce transfert grossit indéfiniment.

**Action :**

Créer une fonction SQL `get_member_points_totals()` via migration (ou une vue) :

```sql
CREATE OR REPLACE FUNCTION get_member_points_totals()
RETURNS TABLE(profile_id UUID, total_points BIGINT)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT profile_id, SUM(points)::BIGINT FROM public.member_points GROUP BY profile_id;
$$;
```

Dans `membres/page.tsx` :
```ts
const { data: pointsData } = await supabase.rpc('get_member_points_totals')
const pointsMap = (pointsData ?? []).reduce<Record<string, number>>(...)
```

1 ligne par membre au lieu de N lignes par membre — indépendant du volume.

---

### ARCH-07 · Requêtes multi-passes dans `operations/page.tsx`

**Fichier concerné :** `app/(app)/operations/page.tsx` lignes 46–65

**Problème :** La page fait 4 requêtes Supabase pour afficher la liste des opérations : ops actives → ops passées → registrations par `.in()` → commandants par `.in()`. Les deux dernières sont séquentiellement dépendantes des premières (besoin des IDs).

**Action :**

Utiliser les jointures Supabase natives pour réduire à 2 requêtes :

```ts
const [{ data: activeRaw }, { data: pastRaw }] = await Promise.all([
  supabase
    .from('operations')
    .select(`
      *,
      commander:profiles!commander_id(id, username, display_name, avatar_url),
      registrations:op_registrations(count)
    `)
    .in('status', ['planned', 'active'])
    .order('departure_at', { ascending: true }),
  supabase
    .from('operations')
    .select(`
      *,
      commander:profiles!commander_id(id, username, display_name, avatar_url),
      registrations:op_registrations(count)
    `)
    .in('status', ['completed', 'cancelled'])
    .order('departure_at', { ascending: false })
    .limit(20),
])
```

Adapter le type `OperationWithDetails` et la fonction `enrich()` en conséquence.

---

### ARCH-08 · Cohérence du helper `getAuth` dans les actions

**Fichiers concernés :** `actions/members.ts`, `actions/chat.ts`, `actions/ships.ts`, `actions/applications.ts`, `actions/notifications.ts`, `actions/rank-evaluations.ts`

**Problème :** 5 fichiers (`logistics.ts`, `operations.ts`, `events.ts`, `map.ts`, `partnerships.ts`) ont factorisé `getAuth()` / `getAuthAndPrivilege()`. Les autres répètent le pattern inline (createClient + getUser + profiles.select('role')) à chaque fonction.

**Action :**

Créer `lib/auth-helpers.ts` (ou exporter depuis `lib/supabase/server.ts`) :

```ts
import { createClient } from '@/lib/supabase/server'
import { getRolePrivilege } from '@/lib/constants'

export async function getAuthContext() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, user: null, privilege: 0 }
  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  return { supabase, user, privilege: getRolePrivilege(me?.role ?? '') }
}
```

Migrer progressivement les actions restantes vers ce helper unifié.

---

### ARCH-09 · Props dense Server→Client sur `MembreDetail`

**Fichier concerné :** `app/(app)/membres/[username]/membre-detail.tsx`

**Problème :** L'interface de `MembreDetail` compte 13 props individuelles. Lisible aujourd'hui, mais fragile à l'ajout de nouvelles données (chaque ajout implique de modifier 3 endroits : interface, appel, destructuration).

**Action (à faire avant d'ajouter de nouvelles données à la fiche) :**

Regrouper les props en objets sémantiques :

```ts
interface MembreDetailProps {
  profile: ProfileWithPoints
  progression: MemberProgression | null
  promotions: (MemberPromotion & { promoter_name?: string })[]
  points: (MemberPoints & { awarder_name?: string })[]
  stats: { eventCount: number; opCount: number; shipCount: number; totalPoints: number }
  permissions: { isSage: boolean; canAwardPoints: boolean; isOwnProfile: boolean; currentUserId: string }
}
```

---

### ARCH-10 · Filtrage flotte côté JavaScript

**Fichier concerné :** `app/(app)/flotte/page.tsx` lignes 49–50

**Problème :** Tous les vaisseaux sont chargés depuis Supabase, puis filtrés par `type` et `status` côté JavaScript. Pour une flotte de 50–100 vaisseaux c'est négligeable ; à 500+ c'est inutilement lourd.

**Action :**

Passer les filtres dans la requête Supabase :

```ts
let shipsQuery = supabase
  .from('ships')
  .select(`*, owner:profiles(username, display_name, avatar_url)`)
  .order('is_org_ship', { ascending: false })
  .order('name', { ascending: true })

if (type) shipsQuery = shipsQuery.eq('ship_type', type as ShipType)
if (status) shipsQuery = shipsQuery.eq('status', status)
```

Attention : les compteurs par type (`typeCount`) doivent toujours être calculés sur la totalité des vaisseaux — faire une requête COUNT séparée sans filtres, ou charger uniquement `(ship_type, status)` pour les compteurs.

---

### ~~ARCH-11 · `Promise.resolve()` superflu dans `calendrier/page.tsx`~~ ✅ CORRIGÉ 2026-06-04

Traité au passage lors de la correction ARCH-02. `calendrier/page.tsx` utilise maintenant `const supabase = await createClient()` (synchrone) sans le `Promise.resolve()` inutile.

---

## 🧹 Nettoyages — Code mort à supprimer

---

### ARCH-12 · Hooks TanStack Query non consommés (×3 fichiers)

**Fichiers concernés :** `hooks/use-members.ts`, `hooks/use-events.ts`, `hooks/use-ships.ts`

**Problème :** Ces trois fichiers définissent des hooks TanStack Query (`useMembers`, `useMember`, `useCurrentUser`, `useUpcomingEvents`, `useCreateEvent`, `useRegisterForEvent`, `useShips`, `useCreateShip`, etc.) qui ne sont **importés nulle part** dans l'application.

Ils représentent l'ancienne architecture « full client fetching » abandonnée au profit des Server Components. Un développeur pourrait les réutiliser par erreur, créant des double fetches incohérents avec le cache RSC.

Seul `hooks/use-ship-models.ts` est légitime (consommé par `components/flotte/ship-model-combobox.tsx`).

**Action :**
1. Supprimer `hooks/use-members.ts`
2. Supprimer `hooks/use-events.ts`
3. Supprimer `hooks/use-ships.ts`
4. Les mutations utiles (ex: `useUpdateProfile`) qui appellent des Server Actions peuvent être remplacées par des appels directs à la Server Action depuis les composants client — pas besoin de TanStack Query pour ça.

---

## Correctifs bonus découverts en session (2026-06-04)

Ces bugs n'étaient pas dans le backlog initial mais ont été trouvés et corrigés lors de l'investigation sur la page flotte.

### ~~BONUS-01 · `getPublicStats()` crash silencieux → page `/stats` blanche~~ ✅ CORRIGÉ 2026-06-04

**Problème :** `unstable_cache` peut retourner `undefined` quand la fonction interne throw (Supabase indisponible, credentials). `app/stats/page.tsx` appelait `stats.memberCount` sans garde → `TypeError: Cannot read properties of undefined (reading 'toLocaleString')` → Fast Refresh → toutes les pages ouvertes blanchées.

**Fix :**
- `lib/public-stats.ts` → try/catch autour des requêtes, retourne `{ memberCount: 0, ... }` en cas d'erreur
- `app/stats/page.tsx` → `(value ?? 0).toLocaleString('fr-FR')` en défense supplémentaire dans `StatCard`

---

## Synthèse

| # | Item | Sévérité | Effort | Statut |
|---|---|---|---|---|
| BUG-01 | Flotte blanche intermittente (`useSearchParams` sans Suspense) | 🐛 Bug | 15 min | **À faire** |
| ~~ARCH-01~~ | ~~Mutation DB dans RSC (messages)~~ | ✗ Antipattern | 1h | ✅ 2026-06-04 |
| ~~ARCH-02~~ | ~~Admin client sans cache pages publiques~~ | ✗ Antipattern | 2h | ✅ 2026-06-04 |
| ~~ARCH-03~~ | ~~Fichier fantôme `promotion-requests.ts`~~ | 🧹 Nettoyage | 5 min | ✅ 2026-06-04 |
| ~~ARCH-04~~ | ~~Erreurs silencieuses `releaseAllOpResources`~~ | ⚠ Dette | 1h | ✅ 2026-06-04 |
| ARCH-05 | Double fetch `generateMetadata` + body | ⚠ Dette | 2h | À faire |
| ARCH-06 | `member_points` full-scan | ⚠ Dette | 2h | À faire |
| ARCH-07 | Requêtes multi-passes opérations | ⚠ Dette | 1h30 | À faire |
| ARCH-08 | `getAuth` incohérent entre actions | ⚠ Dette | 1h | À faire |
| ARCH-09 | Props dense `MembreDetail` | ⚠ Dette | 30 min | À faire |
| ARCH-10 | Filtrage flotte côté JS | ⚠ Dette | 30 min | À faire |
| ~~ARCH-11~~ | ~~`Promise.resolve()` superflu calendrier~~ | ⚠ Dette | 5 min | ✅ 2026-06-04 |
| ARCH-12 | Hooks TanStack morts (×3) | 🧹 Nettoyage | 30 min | À faire |
| ~~BONUS-01~~ | ~~`getPublicStats()` crash → `/stats` blanche~~ | 🐛 Bug | 30 min | ✅ 2026-06-04 |
