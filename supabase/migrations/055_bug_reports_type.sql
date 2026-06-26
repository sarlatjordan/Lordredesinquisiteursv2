ALTER TABLE public.bug_reports
  ADD COLUMN type TEXT NOT NULL DEFAULT 'bug'
    CHECK (type IN ('bug', 'amelioration'));
