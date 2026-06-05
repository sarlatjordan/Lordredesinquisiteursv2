-- ============================================================
-- INQFR — Table ship_models (référence matrice RSI)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.ship_models (
  id                INTEGER PRIMARY KEY,  -- ID RSI natif
  name              TEXT NOT NULL,
  manufacturer      TEXT,
  ship_type         TEXT NOT NULL DEFAULT 'autre',
  focus             TEXT,
  min_crew          INTEGER NOT NULL DEFAULT 1,
  max_crew          INTEGER NOT NULL DEFAULT 1,
  cargo_capacity    INTEGER NOT NULL DEFAULT 0,
  production_status TEXT,
  rsi_url           TEXT,
  image_url         TEXT,
  synced_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour la recherche par nom
CREATE INDEX IF NOT EXISTS ship_models_name_idx ON public.ship_models USING gin(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS ship_models_manufacturer_idx ON public.ship_models (manufacturer);

ALTER TABLE public.ship_models ENABLE ROW LEVEL SECURITY;

-- Lecture publique pour tous les membres authentifiés (autocomplete)
CREATE POLICY "ship_models_select_authenticated"
  ON public.ship_models FOR SELECT
  TO authenticated
  USING (true);

-- INSERT/UPDATE uniquement via service_role (sync admin)
-- Pas de policy explicite = seul service_role peut écrire (bypass RLS)
