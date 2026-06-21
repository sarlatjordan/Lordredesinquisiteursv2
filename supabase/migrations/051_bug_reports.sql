CREATE TABLE public.bug_reports (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id  UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title       TEXT        NOT NULL CHECK (char_length(title) BETWEEN 3 AND 150),
  description TEXT        NOT NULL CHECK (char_length(description) BETWEEN 10 AND 4000),
  page_url    TEXT,
  severity    TEXT        NOT NULL DEFAULT 'moyen'
                          CHECK (severity IN ('faible', 'moyen', 'eleve', 'critique')),
  status      TEXT        NOT NULL DEFAULT 'ouvert'
                          CHECK (status IN ('ouvert', 'en_cours', 'resolu', 'ferme')),
  admin_note  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX bug_reports_profile_idx ON public.bug_reports (profile_id);
CREATE INDEX bug_reports_status_idx  ON public.bug_reports (status, created_at DESC);

ALTER TABLE public.bug_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bug_reports_select_own" ON public.bug_reports
  FOR SELECT USING (profile_id = auth.uid() OR get_my_privilege() >= 600);

CREATE POLICY "bug_reports_insert" ON public.bug_reports
  FOR INSERT WITH CHECK (profile_id = auth.uid() AND get_my_privilege() >= 100);

CREATE POLICY "bug_reports_update_admin" ON public.bug_reports
  FOR UPDATE USING (get_my_privilege() >= 600);
