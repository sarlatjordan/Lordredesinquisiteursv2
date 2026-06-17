# INQFR — Backlog produit

> Stack : Next.js 16 App Router · TypeScript strict · Supabase (Auth + RLS) · Tailwind v4 · shadcn/ui · pnpm
> Déploiement : Vercel · GitHub : `sarlatjordan/Lordredesinquisiteursv2` · Branche : `main`

---

## Légende

| Priorité | Signification |
|---|---|
| **P0** | Incident / faille / bug actif en production — traiter immédiatement |
| **P1** | Amélioration importante — prochain sprint |
| **P2** | Nice-to-have / scalabilité — backlog long terme |

---

## ⏳ Items actifs

### 🚀 Features planifiées

#### P1 — Prochainement

| ID | Item | Description |
|---|---|---|
| FEAT-31 | Pipeline Kanban candidatures | Vue Kanban (Reçu → En discussion → Accepté/Refusé) pour le Conseil, remplace la liste plate `/admin/candidatures`. |
| FEAT-33 | Recherche globale | Barre de recherche unifiée sur membres, ressources, opérations et événements. |

#### P2 — Planifié

| ID | Item | Description |
|---|---|---|
| FEAT-25 | Planificateur composition de flotte | Avant une op, assigner les vaisseaux de la flotte aux slots de rôle (tank/support/DPS). Vue drag-and-drop sauvegardée sur l'opération. |
| FEAT-26 | Tracker de disponibilité | Chaque membre indique ses créneaux dispo de la semaine. Page opérations affiche combien de membres sont dispo pour un slot donné. |
| FEAT-27 | Système de loot / butin | Distribuer équitablement les gains d'une opération entre participants (points ou crédits internes tracés en DB). |
| FEAT-28 | Journal de guerre | Après une op terminée, créer un "highlight" avec texte + screenshots. Consultable sur la landing publique. |
| FEAT-29 | Badges / achievements | Achievements débloqués automatiquement (1ère op, 5 events, 1er rapport…). Affichés sur la fiche membre. |
| FEAT-30 | Widget "Qui est en vocal" | Appel au bot Discord déjà connecté pour afficher les membres actuellement dans un canal vocal. |
| FEAT-32 | Notifications push web | Alertes navigateur (Web Push API) quand une op commence, un event approche ou un message est reçu. |
| FEAT-34 | Mode "en opération" | Statut activable "Je suis en jeu" visible sur le dashboard avec horodatage. |

---

## ✅ Items terminés

### 🔒 Sécurité & Auth

| ID | Item | Terminé |
|---|---|---|
| SEC-01 | RLS auto-promotion profiles — migration 020 | 2026-06-04 |
| SEC-02 | Comptes de test en prod supprimés + guard anti-prod dans seed | 2026-06-04 |
| SEC-03 | Turnstile formulaire candidature | 2026-06-04 |
| SEC-04 | `console.log` hangar-sync encadrés `NODE_ENV` | 2026-06-04 |
| SEC-A01 | RLS `event_attendees` — UPDATE sans WITH CHECK | 2026-06-04 |
| SEC-A02 | RLS `notifications` — INSERT WITH CHECK(true) | 2026-06-04 |
| SEC-B01 | Route ICS — bypass du `min_privilege` des événements | 2026-06-04 |
| SEC-B02 | RLS `ships` — UPDATE sans WITH CHECK | 2026-06-04 |
| SEC-B03 | RLS `notifications` — UPDATE sans WITH CHECK | 2026-06-04 |
| SEC-B04 | Réservation inventaire non-atomique (TOCTOU) — RPC SECURITY DEFINER | 2026-06-04 |
| SEC-C01 | Route ICS — `isUUID()` absent sur param `id` | 2026-06-04 |
| SEC-C02 | CSP `unsafe-inline` sur `style-src` — risque documenté, compromis Tailwind v4 | 2026-06-04 |
| OPS-01 | MFA TOTP activé sur comptes privilégiés | 2026-06-04 |
| **SEC-05** | **MFA bypass par navigation directe + remember device (migration 033)** | **2026-06-06** |

> **SEC-05** : check AAL déplacé dans `proxy.ts` (middleware, tourne sur chaque requête). Cookie `mfa_device_trust` HMAC-SHA256 vérifié via Web Crypto (Edge). Page `/mfa` : sélecteur de durée 1h/1j/1s/1m/1a après vérification. Table `trusted_devices` + env var `MFA_DEVICE_SECRET` requise.

---

### 🐛 Bugs

| ID | Item | Terminé |
|---|---|---|
| BUG-01 | Page `/flotte` blanche intermittente — `<Suspense>` autour de `RsiBookmarkletImport` | 2026-06-04 |
| BUG-02 | `cached-org-settings.ts` — `cookies()` interdit dans `unstable_cache()` → `createAdminClient()` | 2026-06-04 |

---

### 🚀 Features

| ID | Item | Terminé |
|---|---|---|
| FEAT-01 | Messagerie instantanée — migrations 021–022 | 2026-06-04 |
| FEAT-02 | Centre de notifications | 2026-06-04 |
| FEAT-03 | Onboarding checklist aspirant — migration 023 | 2026-06-04 |
| FEAT-04 | Membres inactifs (Sage) | 2026-06-04 |
| FEAT-05 | Export `.ics` calendrier | 2026-06-04 |
| FEAT-06 | Épreuves de rang (MI+) — migration 024 | 2026-06-04 |
| FEAT-07 | Page profil accessible aux Visiteurs | 2026-06-05 |
| FEAT-08 | Fiche événement cliquable → dialog lecture seule | 2026-06-05 |
| FEAT-09 | Seuil commandement opérations : Gardien → Maître Inquisiteur | 2026-06-05 |
| FEAT-11 | Intégration Google Agenda (flux ICS global, auth HMAC stateless) | 2026-06-06 |
| FEAT-14 | Parcours initiatique 4 rangs × 5 étapes — migrations 031–032 | 2026-06-06 |
| FEAT-17 | Audit des points attribués aux membres (Sage+) | 2026-06-05 |
| FEAT-18 | Fusion flotte org+perso, tri propriétaire, édition nom inline | 2026-06-06 |
| FEAT-21 | Authentification Google OAuth (PKCE) | 2026-06-06 |
| FEAT-22 | MFA TOTP — enrollment `/profil` + challenge universel `/mfa` | 2026-06-06 |
| FEAT-23 | Bouton Discord OAuth sur `/login` | 2026-06-06 |

---

### ⚡ Performance

| ID | Item | Terminé |
|---|---|---|
| PERF-01 | `layout.tsx` — `select('*')` → colonnes explicites | 2026-06-04 |
| PERF-02 | Dashboard — `attendeeCounts` hors `Promise.all` | 2026-06-04 |
| PERF-03 | Dashboard — `org_settings` sans cache → `unstable_cache` 60s | 2026-06-04 |
| PERF-04 | Événements — 2 requêtes `event_attendees` séquentielles → `Promise.all` | 2026-06-04 |
| PERF-05 | Opérations list — `select('*')` sur textes longs | 2026-06-04 |
| PERF-06 | Membres list — `select('*')` → colonnes explicites | 2026-06-04 |
| PERF-07 | Hooks TanStack Query inutilisés supprimés | 2026-06-04 |
| PERF-08 | `/membres/[username]` — waterfall → 3 vagues parallèles | 2026-06-04 |
| PERF-09 | `/operations/[id]` — waterfall → 2 vagues parallèles | 2026-06-04 |
| PERF-10 | `member_points` — full-scan JS → RPC SQL `get_member_points_totals()` | 2026-06-04 |
| PERF-11 | `membre-detail.tsx` — `use client` inutile + `router.refresh()` supprimé | 2026-06-04 |
| PERF-12 | `public-stats.ts` — tags cache manquants | 2026-06-04 |

---

### 🏗 Architecture

| ID | Item | Terminé |
|---|---|---|
| ARCH-01 | Mutation DB dans un Server Component (messages) | 2026-06-04 |
| ARCH-02 | `createAdminClient()` sans cache pages publiques (galerie, calendrier) | 2026-06-04 |
| ARCH-03 | Fichier fantôme `actions/promotion-requests.ts` supprimé | 2026-06-04 |
| ARCH-04 | Erreurs silencieuses dans `releaseAllOpResources` | 2026-06-04 |
| ARCH-05 | Double fetch `generateMetadata` + body page → `React.cache()` | 2026-06-04 |
| ARCH-07 | Requêtes multi-passes `operations/page.tsx` → `Promise.all` | 2026-06-04 |
| ARCH-09 | Props trop granulaires sur `MembreDetail` (13 → 6 props) | 2026-06-04 |
| ARCH-10 | Filtrage flotte côté JS — tri calculé avant filtre | 2026-06-04 |
| ARCH-11 | `Promise.resolve()` superflu dans `calendrier/page.tsx` | 2026-06-04 |
| TECH-01 | Batch N+1 `releaseAllOpResources` | 2026-06-04 |
| TECH-02 | Supprimer `revalidate=60` no-op | 2026-06-04 |
| TECH-03 | Refactorer bookmarklet | 2026-06-04 |
| TECH-05 | CI GitHub Actions — workflow push | 2026-06-04 |
| TECH-06 | Supprimer le bookmarklet RSI | 2026-06-05 |

---

### 📘 TypeScript / Qualité code

| ID | Item | Terminé |
|---|---|---|
| TS-01 | Crash Realtime chat — payload sans relations JOIN | 2026-06-04 |
| TS-02 | Upsert `onboarding_progress` sans vérification `.error` | 2026-06-04 |
| TS-03 | Cast Promise-level sur `rank_evaluations` dans `/profil` | 2026-06-04 |
| TS-04 | `getAuth()` dupliqué ×5 → `lib/auth-helpers.ts` | 2026-06-04 |
| TS-05 | `export const dynamic = 'force-dynamic'` manquant sur 6 pages | 2026-06-04 |
| TS-06 | `OnboardingStep` type dans `actions/` → `types/index.ts` | 2026-06-04 |
| TS-07 | `useEffect` deps vide silencé ESLint dans `onboarding-checklist` | 2026-06-04 |
| TS-08 | `catch(err)` sans `: unknown` (4 occurrences) | 2026-06-04 |
| TS-09 | Type inline `inventory_stock` sans nom → `InventoryStockRow` | 2026-06-04 |

---

### 🎨 UX & Accessibilité

| ID | Item | Terminé |
|---|---|---|
| UX-01 | Redirect post-login | 2026-06-04 |
| UX-02 | Visiteur bloqué sans explication | 2026-06-04 |
| UX-03 | Skeleton loading pages | 2026-06-04 |
| UX-04 | Progression visible profil | 2026-06-04 |
| UX-05 | Page 404 personnalisée | 2026-06-04 |
| UX-06 | Champ "mot de passe actuel" requis pour modifier le mdp | 2026-06-05 |
| UX-07 | Background visuel thème SC (hangar / planète sombre) | 2026-06-05 |
| UX-B01 | Erreurs silencieuses sur 10 handlers fire-and-forget | 2026-06-04 |
| UX-D01 | `loading.tsx` manquants sur 8 pages force-dynamic | 2026-06-04 |
| UX-D02 | Mobile nav surchargée — 10 icônes, zones < 44px WCAG | 2026-06-04 |
| UX-D03 | `title` au lieu de `aria-label` sur 7 boutons icône | 2026-06-04 |
| UX-D04 | Labels Radix Select non associés (`htmlFor` ne fonctionne pas) | 2026-06-04 |
| UX-D05 | Spinner manquant sur le bouton submit de `OpForm` | 2026-06-04 |
| UX-D06 | `isPending` partagé pour Lancer / Terminer / Annuler | 2026-06-04 |
| UX-P01 | Composants HTML natifs au lieu de shadcn (×3) | 2026-06-04 |
| UX-P02 | `aria-expanded` manquant sur le toggle historique logistique | 2026-06-04 |
