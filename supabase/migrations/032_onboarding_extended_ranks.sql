-- Migration 032 : parcours initiatique étendu aux rangs Gardien et Inquisiteur
-- Aspirant  : ajout operation_important + first_event (5 étapes, bonus 25 pts)
-- Consacré  : 5 nouvelles étapes, bonus 40 pts
-- Gardien   : 5 nouvelles étapes, bonus 60 pts
-- Inquisiteur : 5 nouvelles étapes, bonus 80 pts
-- Anciens steps conservés dans la contrainte pour compatibilité des données existantes

ALTER TABLE public.onboarding_progress
  DROP CONSTRAINT IF EXISTS onboarding_progress_step_check;

ALTER TABLE public.onboarding_progress
  ADD CONSTRAINT onboarding_progress_step_check
  CHECK (step IN (
    -- Aspirant
    'profile', 'ship', 'operation', 'operation_important', 'first_event', 'bonus',
    -- Consacré (discord_joined conservé pour compat. données existantes)
    'discord_joined', 'consacre_bonus',
    'consacre_events_5', 'consacre_op_5', 'consacre_logistics', 'consacre_resource', 'consacre_recruitment',
    -- Gardien
    'gardien_op_lead', 'gardien_events_10', 'gardien_logistics', 'gardien_resource', 'gardien_recruitment', 'gardien_bonus',
    -- Inquisiteur
    'inquisiteur_op_lead_3', 'inquisiteur_event_organize', 'inquisiteur_training', 'inquisiteur_events_25', 'inquisiteur_partnership', 'inquisiteur_bonus'
  ));
