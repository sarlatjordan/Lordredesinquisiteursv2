# INQFR — Backlog produit

> Généré suite à l'audit multi-expert du 2026-06-02.
> Chaque item est actionnable par un agent Claude Code sans contexte supplémentaire.
> Stack : Next.js 16 App Router · TypeScript strict · Supabase (Auth + RLS) · Tailwind v4 · shadcn/ui · pnpm

---

## Légende priorités

| Priorité | Signification |
|---|---|
| **P0** | Incident en production ou faille sécurité — à traiter immédiatement |
| **P1** | Amélioration importante — prochain sprint |
| **P2** | Nice-to-have — backlog long terme |

---

## P0 — Corrections critiques (sécurité / stabilité)

### ~~SEC-01 · Élévation de privilège via self-update RLS~~ ✅ CORRIGÉ 2026-06-03
**Fichier concerné :** `supabase/migrations/001_initial.sql` (policy `profiles_update`)

La policy actuelle permet à tout utilisateur authentifié de faire `UPDATE profiles SET role='sage'` sur sa propre ligne depuis le client navigateur. Aucune clause `WITH CHECK` ne restreint la modification du champ `role`.

**Action :** Créer une migration `020_fix_profiles_rls.sql` qui remplace la policy :
```sql
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
CREATE POLICY "profiles_update" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT role FROM public.profiles WHERE id = auth.uid())
  );
```
Ce `WITH CHECK` rend le champ `role` immuable par l'utilisateur lui-même. Les Sages continuent de modifier via `profiles_admin` (privilege >= 1000).

---

### SEC-02 · Comptes de test potentiellement présents en production ⚠️
**Fichier concerné :** `scripts/seed-test-users.ts`

Le script crée 7 comptes (dont `test.sage@inqfr.test`) avec le mot de passe public `TestINQFR2024!`. Si exécuté sur la base de production, un compte Sage avec credentials connus existe.

**Action :**
1. Dans Supabase Dashboard → Authentication → Users, chercher les emails `test.*@inqfr.test` et les supprimer si présents.
2. Ajouter un guard au début du script pour qu'il refuse de s'exécuter si `NEXT_PUBLIC_SUPABASE_URL` contient l'URL de production.

---

### ~~SEC-03 · Rate limiting absent sur le formulaire de candidature public~~ ✅ CORRIGÉ 2026-06-03
**Fichier concerné :** `app/recrutement/recrutement-form.tsx` + `actions/applications.ts`

La Server Action `submitApplication` est appelable par n'importe quel visiteur anonyme sans limite de fréquence. La contrainte UNIQUE sur email/rsi_handle ne protège pas contre des centaines de soumissions avec des variantes.

**Action :** Intégrer Cloudflare Turnstile (gratuit) sur le formulaire :
- Installer `@marsidev/react-turnstile`
- Ajouter le widget dans `recrutement-form.tsx`
- Valider le token côté serveur dans `submitApplication` via l'API Turnstile avant l'INSERT
- Clé sitekey dans `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, secret dans `TURNSTILE_SECRET_KEY`

---

### ~~SEC-04 · Supprimer les console.log de production dans hangar-sync~~ ✅ CORRIGÉ 2026-06-04
**Fichier concerné :** `actions/hangar-sync.ts` lignes 303, 371, 374, 381, 386, 387, 389, 394, 399, 403, 412, 425

Ces logs côté serveur apparaissent en clair dans Vercel Logs, incluant des snippets HTML RSI et des codes de session.

**Action :** Envelopper tous les `console.log` existants dans `if (process.env.NODE_ENV === 'development')` ou les supprimer entièrement (les cas d'erreur sont déjà remontés via les return `{ success: false }`).

---

## P0 — Corrections UX bloquantes

### ~~UX-01 · Redirect post-login vers l'URL intentée~~ ✅ CORRIGÉ 2026-06-03
**Fichier concerné :** `proxy.ts` + `app/(auth)/login/page.tsx`

Actuellement : un membre qui tente d'accéder à `/operations/abc123` est redirigé vers `/login` puis vers `/dashboard` — il perd le contexte.

**Action :**
1. Dans `proxy.ts`, lors de la redirection vers `/login`, ajouter `url.searchParams.set('redirectTo', pathname)`.
2. Dans `LoginPage` (`app/(auth)/login/page.tsx`), lire le param `redirectTo` via `useSearchParams()`.
3. Après `supabase.auth.signInWithPassword` succès, faire `router.push(redirectTo || '/dashboard')`.
4. Même logique pour le magic link (`auth/callback/route.ts`).

---

### ~~UX-02 · Visiteur bloqué sans explication ni chemin de sortie~~ ✅ CORRIGÉ 2026-06-03
**Fichier concerné :** `components/layout/redacted-content.tsx`

La page "Contenu classifié" pour les visiteurs (privilege ≤ 50) ne donne aucune instruction sur comment progresser ni comment contacter un Sage.

**Action :** Enrichir `RedactedContent` avec :
- Un message contextuel : "Votre compte est en cours d'activation par le Haut Conseil."
- Un lien Discord (à configurer via variable d'env `NEXT_PUBLIC_DISCORD_INVITE_URL`).
- L'email/handle du Sage référent si disponible en `org_settings`.

---

## P0 — Sécurité opérationnelle

### OPS-01 · Activer le 2FA TOTP sur les comptes privilégiés
**Pas de code requis.** Dans Supabase Dashboard → Authentication → Providers → MFA, activer TOTP. Communiquer aux Sages et Maîtres Inquisiteurs l'obligation d'activer la 2FA sur leur compte.

---

## P1 — Nouvelles features

---

### ~~FEAT-01 · Messagerie instantanée interne~~ ✅ CORRIGÉ 2026-06-03
**Périmètre :** QG privé, membres authentifiés uniquement, temps réel via Supabase Realtime.

**Description :** Un système de canaux texte (style Discord simplifié) permettant aux membres de communiquer depuis l'app INQFR sans quitter le QG. Canaux par défaut : `#général`, `#opérations`, `#logistique`. Les Maîtres Inquisiteurs+ peuvent créer/archiver des canaux.

**Schema DB (migration 020 ou 021) :**
```sql
CREATE TABLE public.chat_channels (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,
  description TEXT,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  min_privilege INTEGER NOT NULL DEFAULT 100,
  created_by  UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.chat_messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id  UUID NOT NULL REFERENCES public.chat_channels(id) ON DELETE CASCADE,
  author_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content     TEXT NOT NULL CHECK (char_length(content) >= 1 AND char_length(content) <= 2000),
  edited_at   TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_chat_messages_channel ON public.chat_messages(channel_id, created_at DESC);

ALTER TABLE public.chat_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- SELECT : membres ayant le privilege requis du canal
CREATE POLICY "channels_select" ON public.chat_channels
  FOR SELECT TO authenticated
  USING (get_my_privilege() >= min_privilege AND NOT is_archived);

-- INSERT canal : Maître Inquisiteur+
CREATE POLICY "channels_insert" ON public.chat_channels
  FOR INSERT TO authenticated
  WITH CHECK (get_my_privilege() >= 600);

-- UPDATE canal : Maître Inquisiteur+
CREATE POLICY "channels_update" ON public.chat_channels
  FOR UPDATE TO authenticated
  USING (get_my_privilege() >= 600);

-- SELECT messages : membres ayant accès au canal
CREATE POLICY "messages_select" ON public.chat_messages
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_channels c
      WHERE c.id = channel_id
      AND get_my_privilege() >= c.min_privilege
      AND NOT c.is_archived
    )
  );

-- INSERT message : auteur = user courant + canal accessible
CREATE POLICY "messages_insert" ON public.chat_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    author_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.chat_channels c
      WHERE c.id = channel_id
      AND get_my_privilege() >= c.min_privilege
      AND NOT c.is_archived
    )
  );

-- DELETE message : auteur ou Sage
CREATE POLICY "messages_delete" ON public.chat_messages
  FOR DELETE TO authenticated
  USING (author_id = auth.uid() OR get_my_privilege() >= 1000);
```

**Architecture Next.js :**
- Route : `app/(app)/messages/page.tsx` — layout 2 colonnes (liste canaux + fenêtre messages)
- Composant client `chat-window.tsx` : utilise `supabase.channel('chat:channelId').on('postgres_changes', ...)` pour le temps réel
- Server Action `actions/chat.ts` : `sendMessage(channelId, content)` — validation Zod (content non vide, max 2000 chars), vérification privilege canal, INSERT dans `chat_messages`
- Server Action `createChannel(name, description, minPrivilege)` — Maître Inquisiteur+
- Pagination : charger les 50 derniers messages au mount, scroll-to-bottom automatique, bouton "charger plus"
- Sidebar nav : ajouter "Messages" entre Dashboard et Membres, avec badge unread count (compter les messages depuis `last_seen_at` de l'utilisateur)

**Canaux à seeder :**
```sql
INSERT INTO public.chat_channels (name, description, min_privilege) VALUES
  ('général',      'Canal principal de l''Ordre',   100),
  ('opérations',   'Coordination des opérations',   150),
  ('logistique',   'Gestion des ressources',        150),
  ('commandement', 'Canal officiers (Gardien+)',    300);
```

**Estimation :** 1 journée de dev.

---

### ~~FEAT-02 · Centre de notifications (dropdown TopBar)~~ ✅ CORRIGÉ 2026-06-03
**Fichier concerné :** `components/layout/top-bar.tsx` + table `notifications` (migration 001)

La table `notifications` existe et le `unreadCount` est déjà récupéré dans le layout. Il manque l'UI et les écritures en DB.

**Action :**
- Créer `components/layout/notifications-dropdown.tsx` : liste les 15 dernières notifications avec titre, message, lien, date relative, badge "non lu"
- Ajouter un bouton cloche dans la TopBar avec le badge `unreadCount`
- Créer `actions/notifications.ts` : `markAllRead()`, `markRead(id)`
- Écrire dans `notifications` depuis les Server Actions existantes : attribution de points (`actions/points.ts`), promotion (`actions/progression.ts`), invitation à une opération, approbation logistique

---

### ~~FEAT-03 · Onboarding checklist pour les nouveaux Aspirants~~ ✅ CORRIGÉ 2026-06-03
**Fichier concerné :** `app/(app)/dashboard/page.tsx` + nouveau composant

Afficher une card "Premiers pas" sur le dashboard pour les membres avec privilege 100 (Aspirant) et `last_seen_at` < 7 jours depuis `joined_at`.

**Action :**
- Composant `OnboardingChecklist` avec 3 étapes :
  1. ✅ Compléter son profil (vérifier `bio` et `star_citizen_handle` non null)
  2. ✅ Ajouter son premier vaisseau (count ships WHERE owner_id = user.id)
  3. ✅ S'inscrire à une opération (count op_registrations WHERE profile_id = user.id)
- La card disparaît quand les 3 étapes sont complètes ou quand le membre a été Aspirant depuis > 14 jours

---

### ~~FEAT-04 · Rapport hebdomadaire d'activité (vue Sage)~~ ✅ CORRIGÉ 2026-06-03
**Section :** `/admin` ou `/membres`

Afficher dans la section Admin une carte "Membres inactifs" : liste des profils avec `last_seen_at` > 30 jours, triés par ancienneté d'inactivité.

**Action :** Ajouter une section dans `app/(app)/admin/candidatures/page.tsx` ou créer `app/(app)/admin/activite/page.tsx` — requête Supabase filtrée sur `last_seen_at < now() - interval '30 days'`, restriction Sage (privilege >= 1000).

---

### ~~FEAT-05 · Export calendrier (.ics) pour les événements~~ ✅ CORRIGÉ 2026-06-03
**Fichier concerné :** `app/(app)/evenements/` + nouvelle Route Handler

Permettre l'export d'un événement en fichier `.ics` compatible Google Calendar / Apple Calendar.

**Action :** Créer `app/api/evenements/[id]/ics/route.ts` — récupère l'événement (auth requise), génère un fichier ICS valide (format RFC 5545), retourne avec `Content-Type: text/calendar`. Ajouter un bouton "Ajouter au calendrier" sur les fiches événement.

---

## P1 — Corrections techniques

### ~~TECH-01 · Batcher releaseAllOpResources (N+1 queries)~~ ✅ CORRIGÉ 2026-06-03
**Fichier concerné :** `actions/operations.ts:91-167`

La boucle `for...of` sur les ressources réservées génère 3 requêtes Supabase séquentielles par ressource.

**Action :** Refactorer pour :
1. Un seul `SELECT` des stocks avec `.in('item_id', itemIds)`
2. Un seul `INSERT` des transactions avec `.insert(transactionsArray)`
3. Un seul `UPDATE` des stocks via `rpc('bulk_update_stock', { updates })` ou en utilisant une SQL native

---

### ~~TECH-02 · Supprimer les revalidate = 60 no-op~~ ✅ CORRIGÉ 2026-06-03
**Fichiers concernés :** `app/(app)/dashboard/page.tsx:12`, `app/(app)/flotte/page.tsx:13`

Ces directives sont ignorées par Next.js car les pages accèdent à `cookies()` via `createClient()`, les rendant dynamiques. Elles créent une fausse expectation sur le comportement de cache.

**Action :** Supprimer `export const revalidate = 60` de ces deux fichiers. Pour de vraies données mises en cache, utiliser `unstable_cache()` sur les parties qui ne dépendent pas de l'utilisateur (ex : liste des modèles de vaisseaux RSI).

---

### ~~TECH-03 · Refactorer le bookmarklet pour éviter dangerouslySetInnerHTML~~ ✅ CORRIGÉ 2026-06-03
**Fichier concerné :** `components/flotte/hangar-sync-dialog.tsx:118`

**Action :** Au lieu de construire une string HTML et l'injecter, la route `/api/hangar-bookmarklet` doit retourner uniquement le `href` (la string `javascript:...`). Le composant React construit alors le `<a>` directement :
```tsx
<a href={bookmarkletHref} onClick={...} style={...}>⭐ Sync INQFR</a>
```

---

### TECH-04 · Redirect post-login vers l'URL intentée (voir UX-01)

---

### TECH-05 · CI minimal GitHub Actions
**Action :** Créer `.github/workflows/ci.yml` :
```yaml
name: CI
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - run: pnpm install --frozen-lockfile
      - run: pnpm tsc --noEmit
      - run: pnpm build
```

---

### TECH-06 · Guard anti-production dans seed-test-users (voir SEC-02)

---

## P1 — UX / Design

### ~~UX-03 · Skeleton loading sur les pages force-dynamic~~ ✅ CORRIGÉ 2026-06-03
**Action :** Créer `loading.tsx` dans les dossiers `app/(app)/operations/`, `app/(app)/membres/`, `app/(app)/logistique/` avec des composants skeleton (shadcn `Skeleton`) correspondant à la structure de la page.

---

### ~~UX-04 · Progression visible dans le profil~~ ✅ CORRIGÉ 2026-06-03
**Fichier concerné :** `app/(app)/profil/profil-client.tsx`

Ajouter une section "Votre rang actuel" expliquant les critères narratifs pour progresser au rang suivant (texte statique par rang, géré dans `lib/constants.ts`).

---

### ~~UX-05 · Page 404 personnalisée~~ ✅ CORRIGÉ 2026-06-03
**Action :** Créer `app/not-found.tsx` avec le thème INQFR, un message thématique et un lien retour vers le dashboard.

---

## P2 — Nice-to-have

### ~~P2-01 · Stats publiques sur la landing page~~ ✅ CORRIGÉ 2026-06-04
Afficher sur `app/page.tsx` des compteurs dynamiques (membres actifs, opérations ce mois, vaisseaux flotte) via ISR (`revalidate = 3600`), sans données sensibles.

---

### ~~P2-02 · Content Security Policy (CSP) headers~~ ✅ CORRIGÉ 2026-06-03
CSP nonce par requête dans `proxy.ts` (`script-src 'nonce-...' 'strict-dynamic'`), nonce propagé sur `<html>` dans le root layout. Headers statiques (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`) dans `next.config.ts`.

---

### ~~P2-03 · Validation UUID dans les routes dynamiques~~ ✅ CORRIGÉ 2026-06-03
`isUUID()` ajouté dans `lib/utils.ts`. Guard `if (!isUUID(id)) notFound()` appliqué sur les 6 routes `[id]` (operations, logistique, partenariats — page + edit), y compris dans `generateMetadata`.

---

### ~~P2-04 · Rotation documentée des clés Supabase~~ ✅ CORRIGÉ 2026-06-04
Créer `docs/runbook-rotation-cles.md` décrivant les étapes pour faire tourner `SUPABASE_SERVICE_ROLE_KEY` et `NEXT_PUBLIC_SUPABASE_ANON_KEY` en production sans downtime.

---

### ~~P2-05 · Export données membres (RGPD léger)~~ ✅ CORRIGÉ 2026-06-04
Permettre à un membre de télécharger ses données (profil, vaisseaux, inscriptions) en JSON depuis `/profil`. Utile aussi si l'org se développe vers des joueurs européens.

---

### ~~P2-06 · Page publique /stats~~ ✅ CORRIGÉ 2026-06-04
Page publique sans auth affichant des métriques anonymisées de l'org (nb membres, opérations terminées, vaisseaux) pour appuyer le recrutement.

---

### ~~P2-07 · Transitions de pages Framer Motion~~ ✅ CORRIGÉ 2026-06-04
Ajouter un `PageTransition` wrapper dans `app/(app)/layout.tsx` pour des transitions fluides entre sections (fade + slight translate).

---

### ~~FEAT-06 · Épreuves de rang~~ ✅ CORRIGÉ 2026-06-03
Système d'épreuves de rang initié par le Conseil (Maître Inquisiteur+, privilege ≥ 600).

- **Migration 024** — table `rank_evaluations` (member_id, initiated_by, status, instructions), index unique partiel sur épreuves actives, RLS : SELECT (membre = propre épreuve / MI+), INSERT + UPDATE (MI+).
- **`/profil`** — section Progression : message passif "Le Conseil observe…" si aucune épreuve ; sinon affichage statut + instructions "Ce que l'on attend de toi".
- **`/admin/promotions`** (MI+ uniquement) — liste des épreuves actives (pending/in_progress), bouton "Lancer une épreuve" (Dialog : sélecteur membre + instructions), actions Démarrer / Réussie / Échouée / Annuler.
- **Notification** au membre lors du lancement de l'épreuve.
- **Sidebar** — section "Commandement" visible MI+ avec lien Épreuves.

---

## Synthèse exécutive

| # | Item | Priorité | Effort | Responsable |
|---|---|---|---|---|
| 1 | ~~Corriger RLS profiles_update (auto-promotion)~~ ✅ | P0 | 30 min | Dev |
| 2 | Vérifier/supprimer comptes de test prod | P0 | 15 min | Ops |
| 3 | ~~Rate limiting formulaire candidature (Turnstile)~~ ✅ | P0 | 2h | Dev |
| 4 | ~~Redirect post-login vers URL intentée~~ ✅ | P0 | 1h | Dev |
| 5 | ~~Supprimer console.log serveur hangar-sync~~ ✅ | P0 | 20 min | Dev |
| 6 | Activer 2FA TOTP Supabase (Sage+) | P0 | 0 code | Ops |
| 7 | ~~**Messagerie instantanée** (canaux + temps réel)~~ ✅ | P1 | 1 jour | Dev |
| 8 | ~~Centre notifications (dropdown + écritures DB)~~ ✅ | P1 | 4h | Dev |
| — | ~~Fix badge chat N+1 + clearing~~ ✅ | correctif | — | Dev |
| 9 | ~~Batcher releaseAllOpResources~~ ✅ | P1 | 2h | Dev |
| 10 | CI GitHub Actions minimal | P1 | 1h | Ops/Dev |
| 11 | ~~Onboarding checklist aspirant~~ ✅ | P1 | 3h | Dev |
| 12 | ~~Skeleton loading pages force-dynamic~~ ✅ | P1 | 2h | Dev |
| 13 | ~~Supprimer revalidate=60 no-op~~ ✅ | P1 | 20 min | Dev |
| — | ~~Refactorer bookmarklet (dangerouslySetInnerHTML)~~ ✅ | P1 | 1h | Dev |
| — | ~~Progression visible dans le profil~~ ✅ | P1 | 2h | Dev |
| 14 | ~~Export .ics calendrier événements~~ ✅ | P1 | 2h | Dev |
| 15 | ~~Rapport membres inactifs (Sage)~~ ✅ | P1 | 2h | Dev |
| 16 | ~~Stats publiques landing page~~ ✅ | P2 | 3h | Dev |
| 17 | ~~CSP headers (nonce + headers statiques)~~ ✅ | P2 | 1h | Dev |
| 18 | ~~Validation UUID routes dynamiques~~ ✅ | P2 | 1h | Dev |
| 19 | ~~Page 404 personnalisée~~ ✅ | P2 | 30 min | Dev |
| 20 | ~~Export données membres (RGPD)~~ ✅ | P2 | 4h | Dev |
| — | ~~Épreuves de rang (Council-initiated, MI+)~~ ✅ | feature | 3h | Dev |
