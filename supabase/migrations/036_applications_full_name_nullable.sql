-- ============================================================
-- Migration 036 : applications.full_name → nullable
-- ============================================================
-- La colonne a été ajoutée manuellement en prod sans migration.
-- Le formulaire ne collecte pas ce champ → NOT NULL bloquait tous les inserts.

ALTER TABLE public.applications ALTER COLUMN full_name DROP NOT NULL;
