<!-- bmad:context -->
<!-- Verified 2026-11-02 against 8431e65266fa73d0dda425d7f7abdf32edbb8ec6. Managed by bmad-project-context; edits inside this block are replaced on refresh. Keep anything you want preserved outside the markers. -->

## INQFR

QG numérique privé de L'Ordre des Inquisiteurs (organisation Star Citizen), accès réservé aux membres invités. Next.js 16 App Router + TypeScript strict, Supabase (Auth/PostgreSQL/RLS/Realtime/Storage), Tailwind v4 + shadcn/ui, pnpm. Backlog produit : `BACKLOG.md`. Dette technique : `Backlog_dettes.md` + `audit_dette_technique.html`.

## Policy

- Jamais de push git, de déploiement Vercel, ou de `pnpm supabase db push` sans confirmation explicite de l'utilisateur.
- Jamais modifier `BACKLOG.md` sans confirmation explicite de l'utilisateur.
- Après avoir résolu un item de dette technique, mettre à jour `Backlog_dettes.md` et `audit_dette_technique.html` sans attendre de confirmation.
- RLS obligatoire sur toutes les tables via `get_my_privilege()`. Rangs : visiteur(50)→aspirant(100)→consacré(150)→gardien(300)→inquisiteur(400)→maître_inquisiteur(600)→sage(1000). Les valeurs numériques de privilège ne s'affichent jamais dans l'UI.

## Where things are

- `proxy.ts` — middleware auth Next.js 16, export nommé `proxy` (pas `middleware`) ; exclut `/api/*`, qui gèrent leur propre auth.
- `lib/constants.ts` — ROLES, ROLE_PRIVILEGES, PRIVILEGE, SC_SYSTEMS, ONBOARDING_CONFIGS.
- `lib/supabase/{server,client,admin}.ts` — clients SSR / navigateur / service role.
- `lib/auth-helpers.ts` — `getAuthWithPrivilege()`, helper partagé des Server Actions.
- `lib/cached-org-settings.ts`, `lib/public-stats.ts`, `lib/public-data.ts` — données en `unstable_cache`.
- `lib/ics-token.ts` — génération/vérification HMAC du flux ICS.
- `types/database.ts` + `types/index.ts` — toute nouvelle table va dans les deux.
- `actions/` — toutes les Server Actions.
- `supabase/migrations/` — migrations SQL numérotées séquentiellement, jamais réutiliser un numéro.
- Variables d'environnement : voir `.env.local.example`, ne pas les dupliquer ici.
- Rotation des clés Supabase : procédure dans `docs/runbook-rotation-cles.md`.

## Running and verifying

- `pnpm tsc --noEmit` puis `pnpm build` doivent passer sans erreur avant de déclarer un item terminé — ce sont les deux étapes de `.github/workflows/ci.yml`.
- `cookies()` et `params` sont asynchrones (Next.js 16) — toujours `await`.
- Nouvelle table/fonction SQL → migration numérotée dans `supabase/migrations/` (vérifier le numéro le plus haut existant dans le dossier, ne jamais le deviner) ; appliquer avec `pnpm supabase db push` (confirmation requise, cf Policy).
- Nouvelle table → types dans `types/database.ts` ET `types/index.ts`.

## Conventions that differ from defaults

- Jamais `any` TypeScript — toujours `SupabaseClient<Database>` (deux dérogations connues en dette : `actions/operations.ts`, `lib/notifications.ts` — ne pas les reproduire).
- Server Actions validées par Zod, jamais de mutation client directe.
- Zod v4 : lire les erreurs via `.error.issues` (pas `.error.errors`).
- JOIN Supabase : caster `as unknown as Type[]`.
- `createClient()` interdit dans `unstable_cache()` → `createAdminClient()`.
- `createAdminClient()` réservé à l'ISR, aux crons, aux webhooks et aux pages publiques — jamais pour contourner RLS sur une page protégée ordinaire.
- `export const dynamic = 'force-dynamic'` sur toutes les pages `app/(app)/`.
- Erreur serveur → bandeau rouge visible dans le formulaire, jamais silencieuse.
- `isUUID()` sur tous les paramètres `[id]` des routes dynamiques.
- Pas de commentaires sauf WHY non-obvieux (contrainte cachée, invariant subtil, workaround).
- Requêtes Supabase indépendantes → toujours `Promise.all`, jamais enchaînées séquentiellement.
- Champ Zod numérique issu d'un `<select>`/FormData pouvant être vide → `z.preprocess` pour convertir `''` en `0` avant `.number()`.

## Known pitfalls

- `SelectItem` Radix : `value=""` interdit → sentinelle `'__none__'`.
- `Dialog` Radix : toujours une `DialogDescription`, sinon warning aria.
- `map_jump_lanes` : normaliser `system_a < system_b` avant insert (contrainte CHECK, migrations 013/052).
- `inventory_stock` : INSERT géré par un trigger `SECURITY DEFINER` — pas de policy INSERT à ajouter (migration 026).
- CSP nonce : dans `proxy.ts`, le `setAll` Supabase SSR recrée `supabaseResponse` — utiliser `requestHeaders` (avec `x-nonce`) dans le callback pour ne pas perdre le nonce.
- MFA : `listFactors().totp[].status` est toujours `'verified'` dans les types — pour détecter un facteur non vérifié, filtrer `listFactors().all` sur `factor_type==='totp' && status==='unverified'`.
- `ICS_HMAC_SECRET` absent → la section ICS de `/profil` se masque silencieusement (erreur catchée).
- `app/(app)/layout.tsx` doit exclure `isMFAPage` du redirect AAL, sinon boucle infinie vers `/mfa`.
- `ExtendedOnboardingStep` est exporté depuis `types/index.ts`, importé par `lib/constants.ts` — ne pas le redéfinir localement (dépendance circulaire).
- Flotte : `owner=org` filtre sur `is_org_ship === true`, jamais sur `!owner` (un vaisseau corpo peut avoir un pilote assigné).

<!-- /bmad:context -->
