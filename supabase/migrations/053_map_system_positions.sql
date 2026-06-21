-- ============================================================
-- Migration 053 : Positions des systèmes stellaires sur la carte
-- Permet aux Sages de repositionner les systèmes via l'UI
-- et d'en ajouter de nouveaux sans toucher au code.
-- ============================================================

CREATE TABLE public.map_system_positions (
  system_name TEXT PRIMARY KEY,
  x           FLOAT NOT NULL,
  y           FLOAT NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.map_system_positions ENABLE ROW LEVEL SECURITY;

-- Lecture : tous les membres authentifiés
CREATE POLICY "map_system_positions_read" ON public.map_system_positions
  FOR SELECT TO authenticated USING (true);

-- Écriture : Sage uniquement (1000)
CREATE POLICY "map_system_positions_write" ON public.map_system_positions
  FOR ALL TO authenticated
  USING (get_my_privilege() >= 1000)
  WITH CHECK (get_my_privilege() >= 1000);

-- Seed : positions initiales des 37 systèmes
INSERT INTO public.map_system_positions (system_name, x, y) VALUES
  ('Terra',    355, 170),
  ('Magnus',   440, 235),
  ('Ellis',    275, 238),
  ('Nexus',    525, 182),
  ('Nyx',      568, 255),
  ('Stanton',  478, 308),
  ('Castra',   582, 318),
  ('Bremen',   238, 308),
  ('Davien',   335, 355),
  ('Kiel',     168, 240),
  ('Odin',     102, 168),
  ('Vega',     192, 398),
  ('Leir',     362, 455),
  ('Pyro',     488, 418),
  ('Chronos',  668, 232),
  ('Idris',    755, 298),
  ('Oberon',   842, 172),
  ('Ariel',    858, 358),
  ('Virgil',   748, 408),
  ('Tamsa',    762, 508),
  ('Hades',    632, 492),
  ('Nul',      508, 538),
  ('Kellog',   360,  72),
  ('Baker',     78, 112),
  ('Tanga',    170, 242),
  ('Hadrian',  258, 196),
  ('Kilian',   308, 297),
  ('Min',      402, 212),
  ('Cano',     365, 408),
  ('Tiber',    810, 287),
  ('Caliban',  672, 382),
  ('Ferron',   690, 332),
  ('Garron',   700, 395),
  ('Cathcart', 545, 448),
  ('Sol',      460, 468),
  ('Croshaw',  505, 500),
  ('Banshee',  598, 512)
ON CONFLICT (system_name) DO NOTHING;
