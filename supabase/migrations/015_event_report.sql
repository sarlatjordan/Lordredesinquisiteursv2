-- Colonne rapport sur les événements
ALTER TABLE events ADD COLUMN report text;

-- Gardien+ peut gérer les participants pour n'importe quel membre
DROP POLICY IF EXISTS "attendees_insert" ON public.event_attendees;
DROP POLICY IF EXISTS "attendees_update" ON public.event_attendees;
DROP POLICY IF EXISTS "attendees_delete" ON public.event_attendees;

CREATE POLICY "attendees_insert" ON public.event_attendees
  FOR INSERT TO authenticated
  WITH CHECK (profile_id = auth.uid() OR get_my_privilege() >= 300);

CREATE POLICY "attendees_update" ON public.event_attendees
  FOR UPDATE TO authenticated
  USING (profile_id = auth.uid() OR get_my_privilege() >= 300);

CREATE POLICY "attendees_delete" ON public.event_attendees
  FOR DELETE TO authenticated
  USING (profile_id = auth.uid() OR get_my_privilege() >= 300);
