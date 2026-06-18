-- FEAT-29 : Badges / achievements membres

CREATE TABLE public.member_badges (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id  UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  badge_key   TEXT        NOT NULL,
  earned_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (profile_id, badge_key)
);

ALTER TABLE public.member_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "badges_select"
  ON public.member_badges FOR SELECT
  TO authenticated USING (get_my_privilege() >= 50);

CREATE POLICY "badges_insert"
  ON public.member_badges FOR INSERT
  TO authenticated WITH CHECK (true);
