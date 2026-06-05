-- ============================================================
-- Migration 012 : Carte stratégique — Points d'intérêt
-- ============================================================

CREATE TABLE public.map_points (
  id          UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
  system_name TEXT         NOT NULL,
  name        TEXT         NOT NULL,
  type        TEXT         NOT NULL DEFAULT 'zone_interet'
              CHECK (type IN (
                'base_inqfr','base_alliee','base_ennemie',
                'zone_interet','point_danger','ressource'
              )),
  description TEXT,
  status      TEXT         NOT NULL DEFAULT 'active'
              CHECK (status IN ('active','inactive','unknown')),
  created_by  UUID         REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ  DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX idx_map_points_system ON public.map_points (system_name);
CREATE INDEX idx_map_points_type   ON public.map_points (type);

-- ─── RLS ─────────────────────────────────────────────────────────────────────

ALTER TABLE public.map_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "map_points_select" ON public.map_points
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "map_points_insert" ON public.map_points
  FOR INSERT TO authenticated
  WITH CHECK (public.get_my_privilege() >= 300);

CREATE POLICY "map_points_update" ON public.map_points
  FOR UPDATE TO authenticated
  USING (public.get_my_privilege() >= 300);

CREATE POLICY "map_points_delete" ON public.map_points
  FOR DELETE TO authenticated
  USING (public.get_my_privilege() >= 1000);
