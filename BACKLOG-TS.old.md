# INQFR — Backlog TypeScript / Qualité code

> Généré suite à l'audit TypeScript strict du 2026-06-04.
> Chaque item est actionnable par un agent Claude Code sans contexte supplémentaire.
> Stack : Next.js 16 App Router · TypeScript strict · Supabase · Zod v4 · pnpm

---

## Légende priorités

| Priorité | Signification |
|---|---|
| **P0** | Bug potentiel en production — à corriger immédiatement |
| **P1** | Dette technique importante — prochain sprint |
| **P2** | Nettoyage / cohérence — backlog long terme |

---

## P0 — Bugs potentiels

### TS-01 · Payload Realtime chat casté sans les relations JOIN

**Fichier :** `components/chat/chat-layout.tsx:102`

```ts
setMessages((prev) => [...prev, data as unknown as ChatMessageWithAuthor])
```

`data` est le `payload.new` du channel Realtime Supabase — un `Record<string, unknown>` plat, sans les relations JOIN (`author.username`, `author.display_name`, `author.avatar_url`). Le cast masque silencieusement l'absence de `author`. Si `ChatWindow` accède à `msg.author.username`, c'est un crash runtime à la réception du premier message temps réel.

**Action :**
Au lieu d'ajouter le payload brut à l'état, déclencher un refetch de la liste complète :
```ts
// Dans le callback postgres_changes :
if (intentRef.current === activeChannelId) {
  queryClient.invalidateQueries({ queryKey: ['chat', activeChannelId] })
  // ou : router.refresh() si les messages viennent d'une Server Action
}
```
Si un refetch est trop coûteux, enrichir le payload via une requête Supabase `.select('*, author:profiles(username,display_name,avatar_url)')` ciblant `payload.new.id`.

---

### TS-02 · Upsert `onboarding_progress` sans vérification d'erreur

**Fichier :** `actions/onboarding.ts`

Le retour `.error` de l'upsert n'est pas destructuré. Une erreur RLS, contrainte DB ou timeout est ingérée silencieusement — la fonction retourne `undefined` et le client ne voit aucun feedback d'échec.

**Action :** Ajouter le check standard :
```ts
const { data: inserted, error } = await supabase
  .from('onboarding_progress')
  .upsert(...)
  .select()
if (error) return { success: false, error: error.message }
if (!inserted || inserted.length === 0) return { success: false, error: 'Aucune ligne insérée' }
```

---

### TS-03 · Cast Promise-level sur la requête `rank_evaluations` dans le profil

**Fichier :** `app/(app)/profil/page.tsx:21`

```ts
.maybeSingle() as unknown as Promise<{
  data: { id: string; status: 'pending' | 'in_progress'; ... } | null
  error: unknown
}>
```

Le cast est appliqué sur le builder Supabase (un `PromiseLike`), pas sur le résultat `await`é. Ça fonctionne aujourd'hui car Supabase renvoie `{data, error}`, mais le type `status` dans `Database` est `string` (tous les statuts possibles) d'où la contorsion — si la table évolue, TypeScript ne protège plus rien.

**Action :** Utiliser `.select()` avec les colonnes exactes et narrower via un type guard après `await` :
```ts
const { data: evalRow } = await supabase
  .from('rank_evaluations')
  .select('id, status, instructions, created_at')
  .eq('member_id', user.id)
  .in('status', ['pending', 'in_progress'])
  .maybeSingle()

type ActiveEval = { id: string; status: 'pending' | 'in_progress'; instructions: string | null; created_at: string }
const activeEval = evalRow as ActiveEval | null
```

---

## P1 — Dette technique

### TS-04 · `getAuth()` dupliqué dans 5 fichiers actions

**Fichiers concernés :**
- `actions/events.ts:17`
- `actions/logistics.ts:14`
- `actions/map.ts:8`
- `actions/partnerships.ts` (début du fichier)
- `actions/operations.ts:20` (variante `getAuthAndPrivilege`)

Cinq définitions quasi-identiques de la même fonction (~8 lignes × 5 = 40 lignes dupliquées). Tout changement dans la logique d'auth doit être répercuté manuellement dans chaque fichier.

**Action :** Créer `lib/auth-helpers.ts` :
```ts
import { createClient } from '@/lib/supabase/server'
import { getRolePrivilege } from '@/lib/constants'

export async function getAuthWithPrivilege() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, user: null, privilege: 0 }
  const { data: me } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  return { supabase, user, privilege: getRolePrivilege(me?.role ?? '') }
}
```
Remplacer les 5 définitions locales par un import de ce helper.

---

### TS-05 · 6 pages `app/(app)/` sans `export const dynamic = 'force-dynamic'`

**Fichiers concernés :**
- `app/(app)/ressources/[slug]/page.tsx`
- `app/(app)/operations/new/page.tsx`
- `app/(app)/operations/[id]/edit/page.tsx`
- `app/(app)/partenariats/new/page.tsx`
- `app/(app)/partenariats/[id]/edit/page.tsx`
- `app/(app)/logistique/new/page.tsx`

Toutes utilisent `createClient()` (appel `cookies()` async) — Next.js les détecte comme dynamiques automatiquement, donc pas de bug runtime. Mais c'est une violation de la règle absolue projet et laisse une ambiguïté sur l'intent de cache.

**Action :** Ajouter `export const dynamic = 'force-dynamic'` en première ligne de chacun de ces 6 fichiers.

---

### TS-06 · `OnboardingStep` type défini dans `actions/` au lieu de `types/`

**Fichier concerné :** `actions/onboarding.ts` (définition) → `app/(app)/dashboard/page.tsx` (import depuis actions)

Les types applicatifs ne doivent pas vivre dans `actions/`. `dashboard/page.tsx` importe `OnboardingStep` depuis une action, ce qui crée un couplage actions → pages dans le mauvais sens.

**Action :**
1. Déplacer le type `OnboardingStep` dans `types/index.ts`
2. Dans `actions/onboarding.ts`, remplacer la définition par `import type { OnboardingStep } from '@/types'`
3. Mettre à jour l'import dans `dashboard/page.tsx`

---

### TS-07 · `useEffect` avec deps vide silencé par ESLint dans `onboarding-checklist`

**Fichier :** `components/dashboard/onboarding-checklist.tsx:47`

```ts
useEffect(() => {
  // utilise `done` (calculé depuis props) et `completedSteps` (prop)
  claim()
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [])
```

Le commentaire ESLint masque une vraie question de design. L'intent est run-once au mount (le `router.refresh()` en fin d'effect reconstruit le composant). En React 19 Strict Mode, les effects sont exécutés deux fois en dev — la double exécution de `claimOnboardingStep` est protégée par l'`upsert` idempotent en DB, mais ça mérite d'être explicite.

**Action :** Remplacer le disable par un `useRef` de garde :
```ts
const claimed = useRef(false)
useEffect(() => {
  if (claimed.current) return
  claimed.current = true
  // ... claim logic
}, [])
```
Et ajouter un commentaire WHY : `// Run-once : router.refresh() reconstruit le composant avec données fraîches`.

---

## P2 — Style / Cohérence

### TS-08 · `catch(err)` sans `: unknown` (4 occurrences)

**Fichiers :**
- `actions/hangar-sync.ts:125`, `:322`, `:449`
- `actions/ship-matrix.ts:81`

Les 4 utilisent `err instanceof Error ? err.message : String(err)` (pattern correct), mais sans annotation `: unknown`, TypeScript n'empêche pas une future modification qui accéderait à `err.message` directement sans guard.

**Action :** Remplacer `catch (err)` par `catch (err: unknown)` dans ces 4 endroits.

---

### TS-09 · Type inline `{ inventory_stock: StockRow | StockRow[] | null }` sans nom

**Fichier :** `app/(app)/dashboard/page.tsx:73`

```ts
const raw = (item as unknown as { inventory_stock: StockRow | StockRow[] | null }).inventory_stock
```

Ce type inline n'est pas réutilisable et alourdit la lecture.

**Action :** Ajouter dans `types/index.ts` :
```ts
export type InventoryItemWithStock = InventoryItem & {
  inventory_stock: Database['public']['Tables']['inventory_stock']['Row'] | Database['public']['Tables']['inventory_stock']['Row'][] | null
}
```
Et remplacer le cast inline par `as unknown as InventoryItemWithStock`.

---

## Synthèse exécutive

| # | Item | Priorité | Effort | Fichier(s) |
|---|---|---|---|---|
| TS-01 | Crash Realtime chat — payload sans relations JOIN | P0 | 1h | `components/chat/chat-layout.tsx` |
| TS-02 | Upsert onboarding sans check `.error` | P0 | 15 min | `actions/onboarding.ts` |
| TS-03 | Cast Promise-level rank_evaluations | P0 | 30 min | `app/(app)/profil/page.tsx` |
| TS-04 | `getAuth()` dupliqué × 5 | P1 | 1h | `lib/auth-helpers.ts` + 5 actions |
| TS-05 | `force-dynamic` manquant × 6 pages | P1 | 10 min | 6 fichiers page.tsx |
| TS-06 | `OnboardingStep` dans actions/ au lieu de types/ | P1 | 15 min | `types/index.ts` + `actions/onboarding.ts` |
| TS-07 | `useEffect` deps vide silencé ESLint | P1 | 20 min | `components/dashboard/onboarding-checklist.tsx` |
| TS-08 | `catch(err)` sans `: unknown` × 4 | P2 | 10 min | `hangar-sync.ts`, `ship-matrix.ts` |
| TS-09 | Type inline `inventory_stock` sans nom | P2 | 15 min | `app/(app)/dashboard/page.tsx` |
