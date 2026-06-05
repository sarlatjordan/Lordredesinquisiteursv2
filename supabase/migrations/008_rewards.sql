-- ============================================================
-- Migration 008 : Système de récompenses — Points d'implication
-- ============================================================

CREATE TABLE public.member_points (
  id            UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id    UUID         NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  points        INTEGER      NOT NULL,
  reason        TEXT         NOT NULL CHECK (reason IN (
    'op_participated','event_attended','resource_created',
    'recruitment','promotion_bonus','penalty','other'
  )),
  reason_detail TEXT,
  awarded_by    UUID         NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at    TIMESTAMPTZ  DEFAULT NOW()
);

ALTER TABLE public.member_points ENABLE ROW LEVEL SECURITY;

-- Membre voit ses propres points ; Gardien+ voit tous
CREATE POLICY "points_select" ON public.member_points
  FOR SELECT TO authenticated
  USING (profile_id = auth.uid() OR public.get_my_privilege() >= 300);

-- Gardien+ peut attribuer
CREATE POLICY "points_insert" ON public.member_points
  FOR INSERT TO authenticated
  WITH CHECK (public.get_my_privilege() >= 300);

-- Sage peut supprimer (correction)
CREATE POLICY "points_delete" ON public.member_points
  FOR DELETE TO authenticated
  USING (public.get_my_privilege() >= 1000);
