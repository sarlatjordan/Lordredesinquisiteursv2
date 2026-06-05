-- ============================================================
-- Migration 004 : Mise à jour RLS + colonne min_privilege events
-- ============================================================

-- 1. Colonne min_privilege sur events (0 = visible par tous)
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS
  min_privilege INTEGER NOT NULL DEFAULT 0;

-- 2. Recréation des policies events avec les nouveaux rangs
DROP POLICY IF EXISTS "events_insert" ON public.events;
DROP POLICY IF EXISTS "events_update" ON public.events;
DROP POLICY IF EXISTS "events_delete" ON public.events;

-- Gardien+ (300) peut créer
CREATE POLICY "events_insert" ON public.events
  FOR INSERT TO authenticated
  WITH CHECK (public.get_my_privilege() >= 300);

-- Créateur OU Gardien+ peut modifier
CREATE POLICY "events_update" ON public.events
  FOR UPDATE TO authenticated
  USING (created_by = auth.uid() OR public.get_my_privilege() >= 300);

-- Sage (1000) peut supprimer
CREATE POLICY "events_delete" ON public.events
  FOR DELETE TO authenticated
  USING (public.get_my_privilege() >= 1000);

-- 3. Recréation des policies ships
DROP POLICY IF EXISTS "ships_insert" ON public.ships;
DROP POLICY IF EXISTS "ships_update" ON public.ships;
DROP POLICY IF EXISTS "ships_delete" ON public.ships;

CREATE POLICY "ships_insert" ON public.ships
  FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid() OR public.get_my_privilege() >= 300);

CREATE POLICY "ships_update" ON public.ships
  FOR UPDATE TO authenticated
  USING (owner_id = auth.uid() OR public.get_my_privilege() >= 300);

CREATE POLICY "ships_delete" ON public.ships
  FOR DELETE TO authenticated
  USING (owner_id = auth.uid() OR public.get_my_privilege() >= 1000);

-- 4. Recréation des policies org_resources
DROP POLICY IF EXISTS "resources_select" ON public.org_resources;
DROP POLICY IF EXISTS "resources_insert" ON public.org_resources;
DROP POLICY IF EXISTS "resources_update" ON public.org_resources;

CREATE POLICY "resources_select" ON public.org_resources
  FOR SELECT TO authenticated
  USING (is_published = true OR author_id = auth.uid() OR public.get_my_privilege() >= 600);

CREATE POLICY "resources_insert" ON public.org_resources
  FOR INSERT TO authenticated
  WITH CHECK (public.get_my_privilege() >= 600);

CREATE POLICY "resources_update" ON public.org_resources
  FOR UPDATE TO authenticated
  USING (author_id = auth.uid() OR public.get_my_privilege() >= 600);
