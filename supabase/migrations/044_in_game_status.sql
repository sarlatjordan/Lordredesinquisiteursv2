-- Migration 044 : Mode "en opération" (FEAT-34)
-- Ajoute in_game_since sur profiles — null = hors jeu, timestamp = en jeu depuis X
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS in_game_since TIMESTAMPTZ NULL;
