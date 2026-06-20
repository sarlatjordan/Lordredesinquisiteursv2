CREATE TABLE public.absences (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id  UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  start_date  DATE        NOT NULL,
  end_date    DATE        NOT NULL,
  reason      TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT absences_dates_check CHECK (end_date >= start_date)
);

CREATE INDEX idx_absences_profile ON public.absences(profile_id);
CREATE INDEX idx_absences_dates   ON public.absences(start_date, end_date);

ALTER TABLE public.absences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "absences_select" ON public.absences
  FOR SELECT USING (profile_id = auth.uid() OR get_my_privilege() >= 1000);

CREATE POLICY "absences_insert" ON public.absences
  FOR INSERT WITH CHECK (profile_id = auth.uid());

CREATE POLICY "absences_delete" ON public.absences
  FOR DELETE USING (profile_id = auth.uid() OR get_my_privilege() >= 1000);
