-- ============================================================
-- Migration 029 : Achat en jeu sur les ships (FEAT-19)
-- Préparation SC 1.0 — indique si un vaisseau a été acheté en
-- jeu (UEC) plutôt que via le store RSI (Pledge Store).
-- ============================================================

ALTER TABLE public.ships
  ADD COLUMN IF NOT EXISTS purchased_in_game BOOLEAN NOT NULL DEFAULT false;
