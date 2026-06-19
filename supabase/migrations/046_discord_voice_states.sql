CREATE TABLE public.discord_voice_states (
  user_id     TEXT PRIMARY KEY,
  username    TEXT NOT NULL,
  channel_id  TEXT NOT NULL,
  channel_name TEXT NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.discord_voice_states ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lecture membres authentifiés" ON public.discord_voice_states
  FOR SELECT TO authenticated USING (true);
