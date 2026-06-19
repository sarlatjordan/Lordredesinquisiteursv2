-- Migration 045 : Web Push subscriptions (FEAT-32)
CREATE TABLE public.push_subscriptions (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id  UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  endpoint    TEXT        NOT NULL UNIQUE,
  p256dh      TEXT        NOT NULL,
  auth        TEXT        NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "push_own" ON public.push_subscriptions
  FOR ALL TO authenticated
  USING  (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());
