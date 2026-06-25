-- Migration 054 : Ajout du type 'sortie' aux événements
ALTER TABLE public.events
  DROP CONSTRAINT IF EXISTS events_type_check;

ALTER TABLE public.events
  ADD CONSTRAINT events_type_check
  CHECK (type IN ('operation', 'reunion', 'formation', 'social', 'autre', 'sortie'));
