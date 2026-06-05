-- Migration 031 : étapes onboarding supplémentaires pour le rang Consacré
-- Aspirant : profile, ship, operation, bonus (inchangé)
-- Consacré  : discord_joined, first_event, consacre_bonus (nouveaux)

ALTER TABLE public.onboarding_progress
  DROP CONSTRAINT IF EXISTS onboarding_progress_step_check;

ALTER TABLE public.onboarding_progress
  ADD CONSTRAINT onboarding_progress_step_check
  CHECK (step IN (
    'profile', 'ship', 'operation', 'bonus',
    'discord_joined', 'first_event', 'consacre_bonus'
  ));
