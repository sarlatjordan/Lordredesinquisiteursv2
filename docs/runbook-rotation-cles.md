# Runbook — Rotation des clés Supabase

Procédure à suivre pour remplacer `SUPABASE_SERVICE_ROLE_KEY` et/ou `NEXT_PUBLIC_SUPABASE_ANON_KEY` en production sans downtime.

**Quand l'appliquer :** fuite suspectée, départ d'un membre de l'équipe, audit de sécurité périodique.

---

## Clés concernées

| Variable | Localisation | Rôle |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Vercel env · `.env.local` | Clé publique — JWT utilisé par le client navigateur |
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel env · `.env.local` | Clé service — bypass RLS, utilisée uniquement côté serveur |

---

## Étapes

### 1. Générer les nouvelles clés (Supabase Dashboard)

1. Ouvrir [app.supabase.com](https://app.supabase.com) → projet INQFR
2. **Settings → API**
3. Section **Project API keys** → cliquer **Reveal** sur `service_role`
4. Cliquer **Regenerate** (une seule fois — l'ancienne clé est immédiatement invalidée)
5. Copier les deux nouvelles valeurs : `anon` et `service_role`

> ⚠️ La régénération invalide instantanément l'ancienne clé. Les requêtes en cours utilisant l'ancienne clé échoueront jusqu'au redéploiement. Prévoir une fenêtre de maintenance < 2 min.

---

### 2. Mettre à jour les variables d'environnement Vercel

1. Ouvrir [vercel.com](https://vercel.com) → projet INQFR → **Settings → Environment Variables**
2. Éditer `NEXT_PUBLIC_SUPABASE_ANON_KEY` → coller la nouvelle valeur `anon`
3. Éditer `SUPABASE_SERVICE_ROLE_KEY` → coller la nouvelle valeur `service_role`
4. Sauvegarder (les deux variables doivent être présentes dans les environnements **Production**, **Preview**, **Development**)

---

### 3. Redéployer

```bash
# Option A — via Vercel Dashboard
# Deployments → dernier déploiement → Redeploy (without cache)

# Option B — via CLI
vercel --prod
```

Le nouveau déploiement embarque les nouvelles clés. Les sessions utilisateurs existantes (JWT Supabase Auth) restent valides — elles ne dépendent pas de ces clés.

---

### 4. Mettre à jour l'environnement local

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_ANON_KEY=<nouvelle_valeur_anon>
SUPABASE_SERVICE_ROLE_KEY=<nouvelle_valeur_service_role>
```

Redémarrer le serveur dev : `pnpm dev`

---

### 5. Vérification post-rotation

- [ ] Login fonctionne (test en navigation privée)
- [ ] Sync hangar RSI (bookmarklet) fonctionne
- [ ] Magic link candidature fonctionne (test depuis `/recrutement`)
- [ ] Aucune erreur `401` / `403` dans les logs Vercel

---

## En cas d'urgence (clé service_role compromise)

La clé `service_role` permet de bypasser toutes les RLS. En cas de compromission confirmée :

1. Régénérer immédiatement (étape 1 ci-dessus)
2. Redéployer en priorité (étape 3)
3. Auditer les logs Supabase (Dashboard → Logs → API) pour détecter des accès anormaux dans les 24h précédentes
4. Si des données ont été altérées, restaurer depuis un backup (Dashboard → Database → Backups)
