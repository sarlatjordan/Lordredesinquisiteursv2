-- ============================================================
-- Migration 013 : Zones de saut éditables en base
-- ============================================================

CREATE TABLE public.map_jump_lanes (
  id         UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
  system_a   TEXT         NOT NULL,
  system_b   TEXT         NOT NULL,
  created_by UUID         REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ  DEFAULT NOW(),
  CONSTRAINT unique_lane  UNIQUE (system_a, system_b),
  CONSTRAINT lane_order   CHECK  (system_a < system_b)
);

CREATE INDEX idx_jump_lanes_a ON public.map_jump_lanes (system_a);
CREATE INDEX idx_jump_lanes_b ON public.map_jump_lanes (system_b);

-- ─── RLS ─────────────────────────────────────────────────────────────────────

ALTER TABLE public.map_jump_lanes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "jump_lanes_select" ON public.map_jump_lanes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "jump_lanes_insert" ON public.map_jump_lanes
  FOR INSERT TO authenticated
  WITH CHECK (public.get_my_privilege() >= 1000);

CREATE POLICY "jump_lanes_delete" ON public.map_jump_lanes
  FOR DELETE TO authenticated
  USING (public.get_my_privilege() >= 1000);

-- ─── Seed : lanes par défaut (system_a < system_b) ───────────────────────────

INSERT INTO public.map_jump_lanes (system_a, system_b) VALUES
  ('Ariel',   'Idris'),
  ('Bremen',  'Ellis'),
  ('Bremen',  'Kiel'),
  ('Bremen',  'Vega'),
  ('Castra',  'Chronos'),
  ('Castra',  'Idris'),
  ('Castra',  'Stanton'),
  ('Chronos', 'Nexus'),
  ('Chronos', 'Oberon'),
  ('Davien',  'Leir'),
  ('Davien',  'Magnus'),
  ('Davien',  'Vega'),
  ('Ellis',   'Magnus'),
  ('Ellis',   'Terra'),
  ('Hades',   'Nul'),
  ('Hades',   'Tamsa'),
  ('Hades',   'Virgil'),
  ('Idris',   'Virgil'),
  ('Kiel',    'Odin'),
  ('Leir',    'Nul'),
  ('Leir',    'Pyro'),
  ('Magnus',  'Stanton'),
  ('Magnus',  'Terra'),
  ('Nexus',   'Nyx'),
  ('Nexus',   'Terra'),
  ('Nul',     'Pyro'),
  ('Nyx',     'Stanton'),
  ('Pyro',    'Stanton'),
  ('Tamsa',   'Virgil');
