-- ============================================================
-- Migration 030 : Workflow validation photo de profil (FEAT-20)
-- Les membres soumettent une URL de photo en attente de validation.
-- Un Sage approuve (copie vers avatar_url) ou refuse (clear).
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_pending_url TEXT;
