# Prompt — Agent INQFR · Items 5, 7, 8

## Qui tu es

Tu es un développeur full-stack senior spécialisé Next.js App Router + Supabase.
Tu travailles sur le projet INQFR — un QG numérique privé pour une organisation Star Citizen.
Tu connais parfaitement les patterns de ce codebase et tu t'y conformes sans dévier.

---

## Le projet en bref

Application web interne, membres invités uniquement.
**Stack :** Next.js 16 App Router · TypeScript strict · Tailwind v4 · shadcn/ui · Supabase (Auth + DB + RLS + Realtime) · Framer Motion v12 · pnpm

**Rangs et privilèges (dans `lib/constants.ts`) :**
```
visiteur(50) → aspirant(100) → consacré(150) → gardien(300) →
inquisiteur(400) → maître_inquisiteur(600) → sage(1000)
```
Contrôle d'accès via `get_my_privilege()` en RLS Supabase. Les valeurs numériques ne s'affichent JAMAIS dans l'UI.

**Règles absolues :**
- `pnpm tsc --noEmit` puis `pnpm build` avant de déclarer un item terminé
- Chaque nouvelle table → migration numérotée dans `supabase/migrations/` (prochaine : `021_...sql`)
- Chaque nouvelle table → types dans `types/database.ts` ET `types/index.ts`
- Server Actions avec validation Zod, jamais de mutation client directe
- RLS sur toutes les tables via `get_my_privilege()`
- Zéro `any` TypeScript · Pas de commentaires sauf WHY non-obvieux
- Erreurs serveur → bandeau rouge dans les formulaires, jamais silencieux
- `export const dynamic = 'force-dynamic'` sur toutes les pages `app/(app)/`

**Migrations déjà appliquées :** 001 → 020. La prochaine est la **021**.
Pour appliquer une migration : `pnpm supabase db push`

**Fichiers clés à connaître :**
- `proxy.ts` — middleware auth Next.js 16 (export `proxy`, pas `middleware`)
- `lib/constants.ts` — ROLES, ROLE_PRIVILEGES, PRIVILEGE, constantes globales
- `lib/supabase/server.ts` / `client.ts` / `admin.ts` — clients Supabase
- `types/database.ts` + `types/index.ts` — tous les types du projet
- `actions/` — toutes les Server Actions existantes
- `components/layout/nav-links.ts` — tableau `NAV_LINKS` de la sidebar
- `components/layout/top-bar.tsx` — barre supérieure (cloche notifs déjà présente, non fonctionnelle)
- `app/(app)/layout.tsx` — layout principal, récupère déjà `unreadCount` notifications
- `BACKLOG.md` — backlog produit complet, à mettre à jour après chaque item

---

## Item 5 — SEC-04 · Supprimer les console.log serveur (20 min)

**Fichier :** `actions/hangar-sync.ts`

Ces `console.log` côté serveur apparaissent en clair dans les logs Vercel.
Lignes concernées : 303, 371, 374, 381, 386, 387, 389, 394, 399, 403, 412, 425.

**Action :**
Envelopper chaque `console.log` dans :
```ts
if (process.env.NODE_ENV === 'development') {
  console.log(...)
}
```
Les `console.error` sur des vraies erreurs peuvent rester tels quels.

**Validation :** `pnpm tsc --noEmit && pnpm build`
**BACKLOG.md :** Marquer item #5 `~~Supprimer console.log serveur hangar-sync~~ ✅` dans la table synthèse.

---

## Item 8 — FEAT-02 · Centre de notifications dropdown (4h)

### Contexte existant

La table `notifications` existe depuis la migration 001 :
```sql
id UUID, profile_id UUID, type TEXT, title TEXT,
message TEXT, is_read BOOLEAN DEFAULT false,
link TEXT,  -- chemin relatif ex: '/membres/jordan'
created_at TIMESTAMPTZ
```
Policy INSERT : ouverte à tous les membres authentifiés (`WITH CHECK (true)`).

Dans `app/(app)/layout.tsx` (lignes 28-35), le `unreadCount` est déjà récupéré
et passé à `<TopBar unreadCount={unreadCount} />`.

Dans `components/layout/top-bar.tsx`, le bouton cloche existe avec badge,
mais il est non-fonctionnel (simple `<Button>` sans action).

### Ce qu'il faut créer

**1. `actions/notifications.ts`** (Server Actions)
```ts
getNotifications()    → Notification[] (15 dernières, ORDER BY created_at DESC)
markRead(id: string)  → ActionResult
markAllRead()         → ActionResult
```

**2. `components/layout/notifications-dropdown.tsx`** (Client Component)
- `Popover` shadcn/ui qui s'ouvre au clic sur la cloche
- Liste les 15 dernières notifications : titre, message, date relative (`formatRelativeTime` de `lib/utils.ts`), indicateur non-lu
- Non lues : fond `bg-primary/5` pour les distinguer
- Clic sur une notification → `markRead(id)` + navigation vers `notification.link` si présent
- Bouton "Tout marquer comme lu" en haut du dropdown
- Chargement lazy : appel `getNotifications()` uniquement au premier ouverture

**3. Modifier `components/layout/top-bar.tsx`**
Remplacer le `<Button>` cloche non-fonctionnel par `<NotificationsDropdown unreadCount={unreadCount} />`.

**4. Écrire des notifications depuis les actions existantes**

Dans `actions/points.ts`, après un INSERT réussi dans `member_points` :
```ts
// Récupérer le username du profil cible pour le lien
const { data: target } = await supabase
  .from('profiles').select('username').eq('id', parsed.data.profile_id).single()

await supabase.from('notifications').insert({
  profile_id: parsed.data.profile_id,
  type: 'points',
  title: `+${parsed.data.points} point${parsed.data.points > 1 ? 's' : ''} attribués`,
  message: parsed.data.reason,
  link: target?.username ? `/membres/${target.username}` : null,
})
```

Dans `actions/progression.ts`, après upsert réussi :
```ts
await supabase.from('notifications').insert({
  profile_id: profile_id,
  type: 'progression',
  title: 'Votre progression a été mise à jour',
  message: `Mis à jour par le Haut Conseil`,
  link: target?.username ? `/membres/${target.username}` : null,
})
```

Dans `actions/logistics.ts`, après approbation d'une demande de retrait :
notifier le membre dont la demande a été approuvée.

**Règle :** Ne pas bloquer l'action principale si l'INSERT notification échoue.
Pas de `if (error) return ...` — juste fire-and-forget.

**Validation :** `pnpm tsc --noEmit && pnpm build`
**BACKLOG.md :** Marquer item #8 `✅` dans la table synthèse.

---

## Item 7 — FEAT-01 · Messagerie instantanée interne (1 jour)

### Objectif
Canaux texte temps réel intégrés dans le QG (style Discord simplifié).
Membres authentifiés uniquement. Temps réel via Supabase Realtime.

### Migration 021 — `supabase/migrations/021_chat.sql`

```sql
-- ============================================================
-- Migration 021 : Messagerie instantanée interne
-- ============================================================

CREATE TABLE public.chat_channels (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL UNIQUE CHECK (char_length(name) >= 1 AND char_length(name) <= 50),
  description   TEXT,
  is_archived   BOOLEAN NOT NULL DEFAULT false,
  min_privilege INTEGER NOT NULL DEFAULT 100,
  created_by    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.chat_messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES public.chat_channels(id) ON DELETE CASCADE,
  author_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content    TEXT NOT NULL CHECK (char_length(content) >= 1 AND char_length(content) <= 2000),
  edited_at  TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_chat_messages_channel ON public.chat_messages(channel_id, created_at DESC);

ALTER TABLE public.chat_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "channels_select" ON public.chat_channels
  FOR SELECT TO authenticated
  USING (get_my_privilege() >= min_privilege AND NOT is_archived);

CREATE POLICY "channels_insert" ON public.chat_channels
  FOR INSERT TO authenticated
  WITH CHECK (get_my_privilege() >= 600);

CREATE POLICY "channels_update" ON public.chat_channels
  FOR UPDATE TO authenticated
  USING (get_my_privilege() >= 600);

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

CREATE POLICY "messages_delete" ON public.chat_messages
  FOR DELETE TO authenticated
  USING (author_id = auth.uid() OR get_my_privilege() >= 1000);

INSERT INTO public.chat_channels (name, description, min_privilege) VALUES
  ('général',      'Canal principal de l''Ordre',  100),
  ('opérations',   'Coordination des opérations',  150),
  ('logistique',   'Gestion des ressources',        150),
  ('commandement', 'Canal officiers (Gardien+)',   300);
```

Appliquer : `pnpm supabase db push`

### Types

`types/database.ts` : ajouter `ChatChannel` et `ChatMessage` (colonnes exactes du schéma).
`types/index.ts` : ajouter `ChatMessageWithAuthor` (message + profil auteur jointé avec `username`, `display_name`, `avatar_url`).

### Server Actions — `actions/chat.ts`

```ts
'use server'

sendMessage(channelId: string, content: string): Promise<ActionResult>
// - Auth requise
// - Vérifier que le canal existe et est accessible (get_my_privilege >= min_privilege)
// - Zod : content string trim, min 1, max 2000
// - INSERT chat_messages (author_id = user.id)
// - revalidatePath('/messages') optionnel

createChannel(name: string, description: string, minPrivilege: number): Promise<ActionResult>
// - Maître Inquisiteur+ (privilege >= 600)
// - Zod : name trim 1-50 chars, minPrivilege dans les valeurs valides

archiveChannel(channelId: string): Promise<ActionResult>
// - Maître Inquisiteur+ (privilege >= 600)
// - UPDATE is_archived = true

deleteMessage(messageId: string): Promise<ActionResult>
// - Auteur du message OU Sage (privilege >= 1000)
// - Vérifier ownership avant DELETE
```

### Architecture des composants

**`app/(app)/messages/page.tsx`** — Server Component
- Récupère user + privilege
- Récupère `chat_channels` accessibles (filtre RLS)
- Si aucun canal accessible → message d'information
- Rend `<MessagesClient channels={...} currentUserId={...} privilege={...} />`

**`app/(app)/messages/messages-client.tsx`** — Client Component
- Layout 2 colonnes sur desktop : sidebar canaux (240px) + zone messages (flex-1)
- Sur mobile : liste des canaux d'abord, tap pour ouvrir un canal (bouton retour)
- État : `selectedChannelId` (init : premier canal de la liste)

**`components/messages/channel-list.tsx`** — Client Component
- Liste les canaux avec nom + description courte
- Highlight canal sélectionné
- Bouton "+" visible si privilege >= 600 → ouvre un dialog de création

**`components/messages/chat-window.tsx`** — Client Component
- Au mount : charge les 50 derniers messages via Supabase client (ORDER BY created_at DESC, LIMIT 50, puis reverse pour affichage)
- Scroll automatique vers le bas à chaque nouveau message
- **Temps réel :**
```ts
useEffect(() => {
  const channel = supabase
    .channel(`chat:${channelId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'chat_messages',
      filter: `channel_id=eq.${channelId}`,
    }, (payload) => {
      // Ajouter le nouveau message à la liste locale
      // Récupérer le profil auteur séparément si pas en cache
    })
    .subscribe()
  return () => { supabase.removeChannel(channel) }
}, [channelId])
```
- Chaque message : avatar (initiales si pas d'URL), display_name, heure relative, contenu
- Bouton supprimer sur ses propres messages (ou tous si Sage) — discret, visible au hover

**`components/messages/message-input.tsx`** — Client Component
- `<textarea>` : Enter = envoyer, Shift+Enter = saut de ligne
- `useTransition` + `sendMessage(channelId, content)`
- Reset du champ après envoi réussi
- Disabled + spinner pendant l'envoi
- Compteur de caractères si > 1800 chars

### Sidebar nav

Dans `components/layout/nav-links.ts`, importer `MessageSquare` de lucide-react
et ajouter l'entrée **entre Dashboard et Membres** :
```ts
{ href: '/messages', label: 'Messages', icon: MessageSquare },
```

### Validation finale
```bash
pnpm tsc --noEmit
pnpm build
```
Les deux doivent passer sans erreur.

**BACKLOG.md :** Marquer item #7 `✅` dans la table synthèse.

---

## Ordre d'exécution recommandé

1. **Item 5** — 20 min, aucun risque, bon échauffement
2. **Item 8** — 4h, aucune migration, travail sur fichiers existants
3. **Item 7** — 1 jour, migration + nouvelle section complète

À chaque item terminé : `pnpm tsc --noEmit && pnpm build` + mise à jour `BACKLOG.md`.
