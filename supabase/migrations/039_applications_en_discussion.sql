-- Migration 039 : applications — ajout statut en_discussion pour Kanban

ALTER TABLE public.applications
  DROP CONSTRAINT IF EXISTS applications_status_check;

ALTER TABLE public.applications
  ADD CONSTRAINT applications_status_check
    CHECK (status IN ('pending', 'en_discussion', 'accepted', 'refused'));
