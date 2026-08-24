-- Backlog produit géré depuis l'app (remplace public/backlog.html en localStorage)
CREATE TABLE public.backlog_items (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  code         TEXT        NOT NULL UNIQUE,
  icon         TEXT        NOT NULL DEFAULT '📌',
  title        TEXT        NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
  description  TEXT        NOT NULL DEFAULT '',
  priority     TEXT        NOT NULL CHECK (priority IN ('P0', 'P1', 'P2')),
  status       TEXT        NOT NULL CHECK (status IN ('planned', 'in_progress', 'done')) DEFAULT 'planned',
  created_by   UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX backlog_items_status_idx ON public.backlog_items (status, priority);

ALTER TABLE public.backlog_items ENABLE ROW LEVEL SECURITY;

-- Lecture : Inquisiteur+ (400)
CREATE POLICY "backlog_items_select" ON public.backlog_items
  FOR SELECT TO authenticated
  USING (get_my_privilege() >= 400);

-- Écriture : Maître Inquisiteur+ (600), aligné sur le gate du panneau /admin
CREATE POLICY "backlog_items_insert" ON public.backlog_items
  FOR INSERT TO authenticated
  WITH CHECK (get_my_privilege() >= 600);

CREATE POLICY "backlog_items_update" ON public.backlog_items
  FOR UPDATE TO authenticated
  USING (get_my_privilege() >= 600)
  WITH CHECK (get_my_privilege() >= 600);

CREATE POLICY "backlog_items_delete" ON public.backlog_items
  FOR DELETE TO authenticated
  USING (get_my_privilege() >= 600);

-- Reprise des items planifiés existants (ex public/backlog.html)
INSERT INTO public.backlog_items (code, icon, title, description, priority, status, created_at) VALUES
  ('FEAT-36', '💬', 'Commentaires sur ops & événements', 'Fil de discussion minimal par item. Fil contextuel dans les pages opération et événement, avec suppression Sage.', 'P1', 'done', '2026-08-24T00:00:00Z'),
  ('FEAT-37', '🗳️', 'Sondages / votes', 'Question + options + deadline + rang minimum pour voter. Couvre les promotions par vote Sage et les décisions d''org actuellement gérées sur Discord.', 'P1', 'planned', '2026-08-24T00:00:01Z'),
  ('FEAT-38', '🎮', 'Vue "cockpit" chef d''op live', 'Page compacte pendant une op : slots confirmés, membres en jeu (in_game_since), briefing affiché. Piloter une op sans quitter INQFR.', 'P1', 'planned', '2026-08-24T00:00:02Z'),
  ('FEAT-39', '📱', 'PWA installable + notifications granulaires', 'Manifeste + icône pour installation bureau/mobile. Filtrage des push par type (op urgente, événement, message direct) pour éviter la désactivation en masse.', 'P2', 'planned', '2026-08-24T00:00:03Z'),
  ('FEAT-52', '🗺️', 'Inventaire Blueprints', 'Scanner les BP RSI (bookmarklet ou import JSON) — grille filtrable par type/tier/fabricant, marquage « en prod » pour suivre la fabrication en cours.', 'P1', 'planned', '2026-08-24T00:00:04Z'),
  ('BUG-18', '🐛', 'Images markdown non visibles dans les ressources', 'img-src CSP élargi à https: — en cours de validation client.', 'P1', 'in_progress', '2026-08-24T00:00:05Z')
ON CONFLICT (code) DO NOTHING;
