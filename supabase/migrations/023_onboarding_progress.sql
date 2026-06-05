CREATE TABLE public.onboarding_progress (
  profile_id   UUID    NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  step         TEXT    NOT NULL CHECK (step IN ('profile', 'ship', 'operation', 'bonus')),
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (profile_id, step)
);

ALTER TABLE public.onboarding_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "onboarding_select_own" ON public.onboarding_progress
  FOR SELECT TO authenticated
  USING (profile_id = auth.uid());

CREATE POLICY "onboarding_insert_own" ON public.onboarding_progress
  FOR INSERT TO authenticated
  WITH CHECK (profile_id = auth.uid());
