-- ============================================================
-- Migration 020 : Correction élévation de privilège (SEC-01)
-- Empêche tout utilisateur de modifier son propre champ `role`
-- via la policy profiles_update (self-update sans WITH CHECK).
-- Les Sages (privilege >= 1000) peuvent toujours modifier le
-- rôle de n'importe qui via profiles_admin (FOR ALL).
-- Le client admin (service_role) bypass RLS — pas impacté.
-- ============================================================

DROP POLICY IF EXISTS "profiles_update" ON public.profiles;

CREATE POLICY "profiles_update" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid())
  );
