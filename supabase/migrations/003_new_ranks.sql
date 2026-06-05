-- ============================================================
-- Migration 003 : Nouveau système de rangs INQFR
-- Remplace admin/officer/membre par les 7 rangs de l'Ordre
-- ============================================================

-- 1. Suppression de l'ancienne contrainte CHECK
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- 2. Migration des données existantes (avant d'ajouter la nouvelle contrainte)
UPDATE public.profiles SET role = 'sage'     WHERE role = 'admin';
UPDATE public.profiles SET role = 'gardien'  WHERE role = 'officer';
UPDATE public.profiles SET role = 'aspirant' WHERE role = 'membre';

-- 3. Ajout de la nouvelle contrainte (toutes les lignes sont déjà conformes)
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('visiteur', 'aspirant', 'consacre', 'gardien', 'inquisiteur', 'maitre_inquisiteur', 'sage'));

-- 4. Nouveau défaut
ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'visiteur';

-- 5. Fonction RLS : retourne le rang du user courant (inchangée, adapte automatiquement)
CREATE OR REPLACE FUNCTION public.get_my_role()
  RETURNS TEXT LANGUAGE SQL SECURITY DEFINER STABLE
  SET search_path = public AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
  $$;

-- 6. Fonction RLS : retourne le niveau de privilège du user courant
CREATE OR REPLACE FUNCTION public.get_my_privilege()
  RETURNS INTEGER LANGUAGE SQL SECURITY DEFINER STABLE
  SET search_path = public AS $$
    SELECT CASE role
      WHEN 'visiteur'          THEN 50
      WHEN 'aspirant'          THEN 100
      WHEN 'consacre'          THEN 150
      WHEN 'gardien'           THEN 300
      WHEN 'inquisiteur'       THEN 400
      WHEN 'maitre_inquisiteur' THEN 600
      WHEN 'sage'              THEN 1000
      ELSE 0
    END
    FROM public.profiles WHERE id = auth.uid();
  $$;

-- 7. Mise à jour de la politique admin profiles (était 'admin', devient sage = 1000)
DROP POLICY IF EXISTS "profiles_admin" ON public.profiles;
CREATE POLICY "profiles_admin" ON public.profiles
  FOR ALL TO authenticated
  USING (public.get_my_privilege() >= 1000);
