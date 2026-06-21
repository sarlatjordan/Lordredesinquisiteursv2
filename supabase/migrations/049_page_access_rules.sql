CREATE TABLE public.page_access_rules (
  path          TEXT PRIMARY KEY,
  label         TEXT NOT NULL,
  min_privilege INTEGER NOT NULL DEFAULT 100,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.page_access_rules (path, label, min_privilege) VALUES
  ('/profil',       'Mon profil',      50),
  ('/dashboard',    'Tableau de bord', 100),
  ('/messages',     'Messages',        100),
  ('/evenements',   'Événements',      100),
  ('/operations',   'Opérations',      100),
  ('/membres',      'Membres',         100),
  ('/partenariats', 'Partenariats',    100),
  ('/flotte',       'Flotte',          100),
  ('/logistique',   'Logistique',      100),
  ('/carte',        'Carte',           100),
  ('/ressources',   'Ressources',      100);

ALTER TABLE public.page_access_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "page_access_rules_select" ON public.page_access_rules
  FOR SELECT USING (true);

CREATE POLICY "page_access_rules_update" ON public.page_access_rules
  FOR UPDATE USING (get_my_privilege() >= 1000);
