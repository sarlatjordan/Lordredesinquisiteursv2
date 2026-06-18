-- FEAT-28 : Journal de guerre

CREATE TABLE public.war_journal (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_id  UUID        REFERENCES public.operations(id) ON DELETE SET NULL,
  title         TEXT        NOT NULL,
  content       TEXT        NOT NULL DEFAULT '',
  author_id     UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_published  BOOLEAN     NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.war_journal ENABLE ROW LEVEL SECURITY;

CREATE POLICY "journal_select"
  ON public.war_journal FOR SELECT
  USING (is_published = true OR (auth.uid() IS NOT NULL AND get_my_privilege() >= 600));

CREATE POLICY "journal_insert"
  ON public.war_journal FOR INSERT
  TO authenticated WITH CHECK (get_my_privilege() >= 600);

CREATE POLICY "journal_update"
  ON public.war_journal FOR UPDATE
  TO authenticated
  USING (get_my_privilege() >= 600)
  WITH CHECK (get_my_privilege() >= 600);

CREATE POLICY "journal_delete"
  ON public.war_journal FOR DELETE
  TO authenticated USING (get_my_privilege() >= 600);
