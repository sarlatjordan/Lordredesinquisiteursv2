-- ============================================================
-- Migration 028 : Ajustement privilèges création événements / opérations
-- FEAT-09 : Création d'événement ouverte aux Aspirants (>= 100)
-- FEAT-12 : Création d'opération réservée à MI+ (>= 600)
-- ============================================================

-- FEAT-09 : Events — ouvrir INSERT aux Aspirants (100)
DROP POLICY IF EXISTS "events_insert" ON public.events;
CREATE POLICY "events_insert" ON public.events
  FOR INSERT TO authenticated
  WITH CHECK (public.get_my_privilege() >= 100);

-- FEAT-12 : Operations — restreindre INSERT à MI+ (600)
DROP POLICY IF EXISTS "ops_insert" ON public.operations;
CREATE POLICY "ops_insert" ON public.operations
  FOR INSERT TO authenticated
  WITH CHECK (public.get_my_privilege() >= 600);
