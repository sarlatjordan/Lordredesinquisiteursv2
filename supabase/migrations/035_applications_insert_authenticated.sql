-- ============================================================
-- Migration 035 : applications — policy INSERT pour authenticated
-- ============================================================
-- La policy 005 ne couvre que le rôle anon.
-- Un utilisateur déjà connecté (role authenticated) est bloqué par RLS.
-- Ce patch ajoute la même permission pour authenticated.

CREATE POLICY "applications_insert_authenticated" ON public.applications
  FOR INSERT TO authenticated
  WITH CHECK (true);
