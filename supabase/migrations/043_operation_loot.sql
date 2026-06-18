-- FEAT-27 : Système de loot / butin par opération

CREATE TABLE public.operation_loot (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_id  UUID        NOT NULL REFERENCES public.operations(id) ON DELETE CASCADE,
  total_auec    INTEGER     NOT NULL CHECK (total_auec > 0),
  note          TEXT,
  created_by    UUID        NOT NULL REFERENCES public.profiles(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.loot_shares (
  id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  loot_id     UUID    NOT NULL REFERENCES public.operation_loot(id) ON DELETE CASCADE,
  profile_id  UUID    NOT NULL REFERENCES public.profiles(id),
  amount      INTEGER NOT NULL CHECK (amount > 0),
  UNIQUE (loot_id, profile_id)
);

ALTER TABLE public.operation_loot ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loot_shares    ENABLE ROW LEVEL SECURITY;

CREATE POLICY "loot_select"
  ON public.operation_loot FOR SELECT
  TO authenticated USING (get_my_privilege() >= 100);

CREATE POLICY "loot_insert"
  ON public.operation_loot FOR INSERT
  TO authenticated WITH CHECK (get_my_privilege() >= 300);

CREATE POLICY "loot_delete"
  ON public.operation_loot FOR DELETE
  TO authenticated USING (get_my_privilege() >= 300);

CREATE POLICY "shares_select"
  ON public.loot_shares FOR SELECT
  TO authenticated USING (get_my_privilege() >= 100);

CREATE POLICY "shares_insert"
  ON public.loot_shares FOR INSERT
  TO authenticated WITH CHECK (get_my_privilege() >= 300);

CREATE POLICY "shares_delete"
  ON public.loot_shares FOR DELETE
  TO authenticated USING (get_my_privilege() >= 300);
