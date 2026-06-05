-- ============================================================
-- Migration 010 : Partenariats et alliances
-- ============================================================

CREATE TABLE public.partnerships (
  id             UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
  name           TEXT         NOT NULL,
  type           TEXT         NOT NULL CHECK (type IN ('org', 'player')),
  relationship   TEXT         NOT NULL DEFAULT 'neutral' CHECK (relationship IN ('alliance', 'neutral', 'trading', 'enemy')),
  contact_handle TEXT,
  org_rsi_id     TEXT,
  status         TEXT         NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'negotiating')),
  terms          TEXT,
  notes          TEXT,
  created_by     UUID         REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ  DEFAULT NOW(),
  updated_at     TIMESTAMPTZ  DEFAULT NOW()
);

ALTER TABLE public.partnerships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "partnerships_select" ON public.partnerships
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "partnerships_insert" ON public.partnerships
  FOR INSERT TO authenticated
  WITH CHECK (public.get_my_privilege() >= 300);

CREATE POLICY "partnerships_update" ON public.partnerships
  FOR UPDATE TO authenticated
  USING (public.get_my_privilege() >= 300);

CREATE POLICY "partnerships_delete" ON public.partnerships
  FOR DELETE TO authenticated
  USING (public.get_my_privilege() >= 1000);
