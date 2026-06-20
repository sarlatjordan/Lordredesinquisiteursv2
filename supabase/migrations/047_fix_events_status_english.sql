-- Fix events.status: aligner la DB sur les valeurs TS (French → English)
-- La CHECK constraint avait été mise à jour manuellement mais le DEFAULT est resté 'planifie'

ALTER TABLE events DROP CONSTRAINT IF EXISTS events_status_check;

UPDATE events SET status = CASE
  WHEN status = 'planifie'  THEN 'planned'
  WHEN status = 'en_cours'  THEN 'active'
  WHEN status = 'termine'   THEN 'completed'
  WHEN status = 'annule'    THEN 'cancelled'
  ELSE status
END
WHERE status IN ('planifie', 'en_cours', 'termine', 'annule');

ALTER TABLE events ALTER COLUMN status SET DEFAULT 'planned';

ALTER TABLE events ADD CONSTRAINT events_status_check
  CHECK (status IN ('planned', 'active', 'completed', 'cancelled'));
