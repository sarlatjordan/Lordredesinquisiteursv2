# INQFR — Backlog UX & Accessibilité

> Généré suite à l'audit UX/a11y du 2026-06-04.
> Stack : Next.js 16 App Router · TypeScript strict · Tailwind v4 · shadcn/ui · Radix UI

---

## Légende priorités

| Priorité | Signification |
|---|---|
| **Bloquant** | Viole une règle absolue du projet — à traiter immédiatement |
| **Dégradé** | Impact notable sur l'expérience ou l'accessibilité |
| **Polish** | Cohérence et amélioration fine |

---

## Bloquant — Règle absolue : erreurs serveur visibles

### UX-B01 · Erreurs silencieuses sur 10 handlers fire-and-forget

**Règle projet violée :** *"erreurs serveur → bandeau rouge dans les formulaires, jamais silencieux"*

Les Server Actions retournent toutes un `ActionResult` avec `success` et `error`, mais les handlers suivants ignorent le résultat d'erreur — l'utilisateur ne sait pas que son action a échoué.

**Fichiers et fonctions concernés :**

| Fichier | Fonction | Action utilisateur |
|---|---|---|
| `app/(app)/evenements/events-client.tsx:43` | `handleRegister` | S'inscrire à un événement |
| `app/(app)/evenements/events-client.tsx:50` | `handleUnregister` | Se désinscrire d'un événement |
| `app/(app)/operations/[id]/operation-detail.tsx:69` | `handleStatus` | Lancer / Terminer / Annuler une opération |
| `app/(app)/operations/[id]/operation-detail.tsx:62` | `handleDelete` | Supprimer une opération |
| `app/(app)/logistique/[id]/item-detail.tsx:71` | `handleDelete` | Supprimer un item inventaire |
| `components/operations/op-register-dialog.tsx:41` | `handleSubmit` | S'inscrire à une opération |
| `components/operations/op-register-dialog.tsx:53` | `handleUnregister` | Se désinscrire d'une opération |
| `components/operations/op-registrations-panel.tsx:102` | `handleStatus` | Confirmer / Refuser inscription |
| `components/operations/op-role-manager.tsx:26-45` | `handleAddSlot` / `handleRemoveSlot` / `handleAssign` | Gérer les postes |
| `app/(app)/admin/promotions/promotions-client.tsx:137` | `EvalCard.update()` | Démarrer / Réussie / Échouée / Annuler épreuve |
| `components/evenements/event-detail-dialog.tsx:120` | `handleSaveReport` | Sauvegarder rapport événement |

**Pattern à appliquer — action rapide sans formulaire dédié :**
```tsx
const [actionError, setActionError] = useState<string | null>(null)

function handleSomeAction() {
  setActionError(null)
  startTransition(async () => {
    const result = await someAction(...)
    if (!result.success) {
      setActionError(result.error)
      return
    }
    router.refresh()
  })
}

// Dans le JSX, sous le bouton ou en haut de la section :
{actionError && (
  <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
    {actionError}
  </p>
)}
```

**Cas particulier — `handleStatus` (3 boutons Lancer/Terminer/Annuler) :**
Ajouter un `statusError: string | null` affiché sous les boutons de statut dans `operation-detail.tsx`.

**Cas particulier — `op-register-dialog.tsx` :**
Ajouter un `error: string | null` et l'afficher dans le form avant les boutons d'action.

**Cas particulier — `event-detail-dialog.tsx` onglet Rapport :**
Ajouter `reportError: string | null` et l'afficher entre le Textarea et le bouton Enregistrer.

**Estimation :** 2h — modifications purement additives, aucun refactoring.

---

## Dégradé — Impact UX notable

### UX-D01 · Loading pages manquantes sur pages force-dynamic

21 pages ont `export const dynamic = 'force-dynamic'` mais seulement 3 ont un `loading.tsx` (`/operations`, `/membres`, `/logistique`). Sur connexion lente, l'utilisateur voit une page blanche au lieu d'un skeleton.

**Pages prioritaires sans `loading.tsx` :**

| Route | Dossier |
|---|---|
| `/dashboard` | `app/(app)/dashboard/` |
| `/evenements` | `app/(app)/evenements/` |
| `/flotte` | `app/(app)/flotte/` |
| `/partenariats` | `app/(app)/partenariats/` |
| `/messages` | `app/(app)/messages/` |
| `/profil` | `app/(app)/profil/` |
| `/admin/candidatures` | `app/(app)/admin/candidatures/` |
| `/admin/promotions` | `app/(app)/admin/promotions/` |

**Template minimal à adapter par section :**
```tsx
import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="space-y-6 p-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-40 w-full rounded-xl" />
        ))}
      </div>
    </div>
  )
}
```

**Estimation :** 1h — 8 fichiers simples à créer.

---

### UX-D02 · Mobile nav surchargée — 10 icônes sur petit écran

**Fichier :** `components/layout/mobile-nav.tsx`

La `MobileNav` affiche les 10 routes en `justify-around` dans une barre fixe. Sur iPhone SE (375px), chaque item fait ~35px avec un label en `text-[9px]`, sous le minimum WCAG recommandé (44×44px de zone cliquable).

**Problèmes identifiés :**
- 10 icônes dans ~375px → 37.5px par item (zone < 44px WCAG 2.5.5)
- Labels `text-[9px]` : quasiment illisibles
- Routes `/profil`, `/admin/*`, `/admin/promotions` absentes de la nav mobile
- Pas de scroll horizontal — `overflow` hidden

**Solution recommandée :**
Réduire à 5 routes principales + bouton "Plus" ouvrant un Sheet.

```tsx
// Routes principales mobile (5 max)
const MOBILE_PRIMARY: NavLink[] = [
  { href: '/dashboard',  label: 'Accueil',    icon: LayoutDashboard },
  { href: '/messages',   label: 'Messages',   icon: MessagesSquare },
  { href: '/operations', label: 'Opérations', icon: Target },
  { href: '/flotte',     label: 'Flotte',     icon: Rocket },
  { href: '/membres',    label: 'Membres',    icon: Users },
]
// + bouton "Plus" → Sheet avec les 5 autres + Profil
```

**Estimation :** 2h.

---

### UX-D03 · Boutons icône avec `title` au lieu de `aria-label`

`title` est un tooltip desktop uniquement — il n'est pas annoncé par les lecteurs d'écran sur mobile. Il faut `aria-label`.

**Occurrences à corriger :**

| Fichier | Bouton | Action |
|---|---|---|
| `components/operations/op-registrations-panel.tsx:78` | `<Button size="icon" title="Confirmer">` | Remplacer `title` par `aria-label` |
| `components/operations/op-registrations-panel.tsx:89` | `<Button size="icon" title="Refuser">` | Idem |
| `components/operations/op-role-manager.tsx:99` | `<Button size="icon" title="Supprimer le poste">` | Idem |
| `app/(app)/logistique/[id]/item-detail.tsx:339` | `<Button size="sm" title="Approuver">` | Idem |
| `app/(app)/logistique/[id]/item-detail.tsx:349` | `<Button size="sm" title="Refuser">` | Idem |

**Boutons sans aucun label (à corriger aussi) :**

| Fichier | Bouton | Label à ajouter |
|---|---|---|
| `components/operations/op-resources-panel.tsx:114` | `<Button size="icon">` Trash2 ressource | `aria-label="Retirer la ressource"` |
| `components/evenements/event-detail-dialog.tsx:238` | `<Button size="icon">` Trash2 participant | `aria-label="Retirer le participant"` |

**Estimation :** 20min.

---

### UX-D04 · Labels Radix Select/Popover sans association accessible

Dans Radix UI, `<Label htmlFor="x">` + `<SelectTrigger>` ne fonctionne pas : `SelectTrigger` ne forward pas l'`id` au `<button>` natif sous-jacent. Les lecteurs d'écran ne lisent pas le label.

**Solution :** utiliser `aria-labelledby` sur le `SelectTrigger` :
```tsx
<Label id="label-type">Type *</Label>
<Select ...>
  <SelectTrigger aria-labelledby="label-type">
    <SelectValue />
  </SelectTrigger>
</Select>
```

**Occurrences prioritaires :**

| Fichier | Labels concernés |
|---|---|
| `components/operations/op-form.tsx` | "Système *", "Type *", "Niveau de risque", "Statut", "Commandant", "Accès minimum" (6 labels) |
| `components/operations/op-register-dialog.tsx:107` | "Rôle préféré" |
| `components/membres/award-points-dialog.tsx:100` | "Motif *" |
| `components/logistique/transaction-dialog.tsx:73,191,216` | "Type" (×2), "Opération liée" |
| `components/membres/progression-form.tsx:97` | "Niveau d'activité" |

**Estimation :** 1h.

---

### UX-D05 · Spinner manquant sur le bouton submit de `OpForm`

**Fichier :** `components/operations/op-form.tsx:300-304`

Tous les formulaires du projet ont un `<Loader2 className="animate-spin" />` sur le bouton submit quand `isPending`. `OpForm` est la seule exception — pourtant c'est le formulaire le plus long (création/édition d'opération).

**Correction :**
```tsx
// Avant :
<Button type="submit" className="flex-1" disabled={isPending}>
  {isPending ? 'Enregistrement...' : 'Enregistrer'}
</Button>

// Après :
<Button type="submit" className="flex-1" disabled={isPending}>
  {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
  {isPending ? 'Enregistrement...' : 'Enregistrer'}
</Button>
```

**Estimation :** 5min.

---

### UX-D06 · `isPending` partagé pour Lancer / Terminer / Annuler

**Fichier :** `app/(app)/operations/[id]/operation-detail.tsx:109-143`

Les 3 boutons de statut ("Lancer", "Terminer", "Annuler") partagent un seul `isPending`. Quand l'un est cliqué, **les 3 se désactivent** en même temps — l'utilisateur ne sait pas lequel est en cours.

**Correction :**
```tsx
const [loadingStatus, setLoadingStatus] = useState<string | null>(null)
const [statusError, setStatusError] = useState<string | null>(null)

function handleStatus(status: 'active' | 'completed' | 'cancelled') {
  setLoadingStatus(status)
  setStatusError(null)
  startTransition(async () => {
    const result = await updateOperation(op.id, { status })
    setLoadingStatus(null)
    if (!result.success) { setStatusError(result.error); return }
    router.refresh()
  })
}

// Dans JSX :
<Button
  disabled={loadingStatus !== null}
  onClick={() => handleStatus('active')}
>
  {loadingStatus === 'active' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <PlayCircle className="h-3.5 w-3.5" />}
  Lancer
</Button>
```

**Estimation :** 30min.

---

## Polish — Cohérence et finitions

### UX-P01 · Composants natifs au lieu de shadcn

**Occurrences :**

| Fichier | Élément natif | Composant shadcn attendu |
|---|---|---|
| `app/(app)/admin/candidatures/candidatures-client.tsx:213` | `<textarea>` HTML | `<Textarea>` (styling focus ring, resize-none, etc.) |
| `app/(app)/admin/candidatures/candidatures-client.tsx:434` | `<button>` custom comme onglets | `<Tabs>` shadcn |
| `app/(app)/admin/promotions/promotions-client.tsx:84` | `<select>` HTML natif dans `InitiateDialog` | `<Select>` shadcn (justifiable pour FormData, mais incohérent visuellement) |

**Note pour le `<select>` natif dans `InitiateDialog`** : si vous souhaitez garder `FormData`, c'est acceptable — mais si vous migrez vers un state contrôlé, remplacez par `<Select>` shadcn.

**Estimation :** 30min.

---

### UX-P02 · `aria-expanded` manquant sur le toggle historique

**Fichier :** `app/(app)/logistique/[id]/item-detail.tsx:247`

Le bouton qui plie/déplie l'historique des transactions est un `<button>` natif sans `aria-expanded`. Les lecteurs d'écran ne savent pas si le contenu est visible.

**Correction :**
```tsx
<button
  onClick={() => setShowHistory((v) => !v)}
  aria-expanded={showHistory}
  aria-controls="history-list"
  className="flex w-full items-center justify-between gap-2 mb-3 group"
>
  ...
</button>
<div id="history-list">
  {showHistory && ...}
</div>
```

**Estimation :** 5min.

---

### UX-P03 · Routes Profil et Admin absentes de la nav mobile

**Fichier :** `components/layout/mobile-nav.tsx`

Les routes `/profil`, `/admin/candidatures`, `/admin/promotions` sont inaccessibles depuis la navigation mobile. Un Sage ne peut pas gérer les candidatures depuis son téléphone sans taper l'URL manuellement.

À traiter en même temps que UX-D02 (refonte mobile nav).

---

## Synthèse

| # | Item | Sévérité | Effort estimé |
|---|---|---|---|
| UX-B01 | Erreurs silencieuses (10 handlers) | **Bloquant** | ~2h |
| UX-D01 | Loading.tsx manquants (8 pages prio) | Dégradé | ~1h |
| UX-D02 | Mobile nav surchargée (10 icônes) | Dégradé | ~2h |
| UX-D03 | `title` au lieu de `aria-label` (7 boutons) | Dégradé | ~20min |
| UX-D04 | Labels Radix non-associés (10+ cas) | Dégradé | ~1h |
| UX-D05 | Spinner manquant sur OpForm submit | Dégradé | ~5min |
| UX-D06 | `isPending` partagé sur 3 boutons statut | Dégradé | ~30min |
| UX-P01 | Composants natifs au lieu de shadcn (3 cas) | Polish | ~30min |
| UX-P02 | `aria-expanded` manquant sur toggle historique | Polish | ~5min |
| UX-P03 | Profil/Admin absent mobile nav | Polish | (inclus D02) |

**Total effort estimé : ~7h30**
