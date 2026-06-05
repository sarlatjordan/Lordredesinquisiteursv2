-- ============================================================
-- Migration 009 : Progression membre + historique des promotions
-- ============================================================

-- Fiche de progression (1:1 avec profiles, gérée par les Sages)
CREATE TABLE public.member_progressions (
  profile_id         UUID         PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  activity_level     TEXT         CHECK (activity_level IN ('casual', 'regular', 'paused')),
  favorite_activity  TEXT,
  trainings_received TEXT[]       DEFAULT '{}',
  notes_sage         TEXT,
  updated_by         UUID         REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_at         TIMESTAMPTZ  DEFAULT NOW()
);

-- Historique des promotions (inséré automatiquement lors d'un changement de rang)
CREATE TABLE public.member_promotions (
  id                   UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id           UUID         NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  from_role            TEXT         NOT NULL,
  to_role              TEXT         NOT NULL,
  promoted_by          UUID         REFERENCES public.profiles(id) ON DELETE SET NULL,
  points_at_promotion  INTEGER,
  reason               TEXT,
  promoted_at          TIMESTAMPTZ  DEFAULT NOW()
);

ALTER TABLE public.member_progressions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_promotions   ENABLE ROW LEVEL SECURITY;

-- member_progressions
CREATE POLICY "progression_select" ON public.member_progressions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "progression_upsert" ON public.member_progressions
  FOR INSERT TO authenticated
  WITH CHECK (public.get_my_privilege() >= 1000);

CREATE POLICY "progression_update" ON public.member_progressions
  FOR UPDATE TO authenticated
  USING (public.get_my_privilege() >= 1000);

CREATE POLICY "progression_delete" ON public.member_progressions
  FOR DELETE TO authenticated
  USING (public.get_my_privilege() >= 1000);

-- member_promotions
CREATE POLICY "promotions_select" ON public.member_promotions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "promotions_insert" ON public.member_promotions
  FOR INSERT TO authenticated
  WITH CHECK (public.get_my_privilege() >= 1000);

CREATE POLICY "promotions_delete" ON public.member_promotions
  FOR DELETE TO authenticated
  USING (public.get_my_privilege() >= 1000);
