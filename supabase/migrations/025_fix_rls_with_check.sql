-- ============================================================
-- Migration 025 : Durcissement RLS — WITH CHECK manquants
-- SEC-A01 : event_attendees UPDATE sans WITH CHECK
-- SEC-A02 : notifications INSERT WITH CHECK (true) trop permissif
-- SEC-B02 : ships UPDATE sans WITH CHECK
-- SEC-B03 : notifications UPDATE sans WITH CHECK
-- ============================================================

-- SEC-A01 · event_attendees : ajout WITH CHECK identique à USING
-- Sans ce check, un membre peut changer profile_id sur sa propre ligne
-- et forger la présence d'un autre membre à un événement.
DROP POLICY IF EXISTS "attendees_update" ON public.event_attendees;
CREATE POLICY "attendees_update" ON public.event_attendees
  FOR UPDATE TO authenticated
  USING  (profile_id = auth.uid() OR get_my_privilege() >= 300)
  WITH CHECK (profile_id = auth.uid() OR get_my_privilege() >= 300);

-- SEC-A02 · notifications INSERT : restreindre au self ou Gardien+
-- Cas légitimes conservés :
--   - profile_id = auth.uid() : onboarding Aspirant (crée sa propre notif)
--   - get_my_privilege() >= 300 : Gardien+ qui notifie un autre membre (points, promotions)
--   - admin client (service_role) : épreuves de rang — bypass RLS implicite
DROP POLICY IF EXISTS "notifs_insert" ON public.notifications;
CREATE POLICY "notifs_insert" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (
    profile_id = auth.uid()
    OR get_my_privilege() >= 300
  );

-- SEC-B02 · ships UPDATE : ajout WITH CHECK (bloque changement owner_id)
-- Sans ce check, un propriétaire peut transférer son vaisseau vers n'importe quel autre membre.
DROP POLICY IF EXISTS "ships_update" ON public.ships;
CREATE POLICY "ships_update" ON public.ships
  FOR UPDATE TO authenticated
  USING  (owner_id = auth.uid() OR get_my_privilege() >= 300)
  WITH CHECK (owner_id = auth.uid() OR get_my_privilege() >= 300);

-- SEC-B03 · notifications UPDATE : ajout WITH CHECK (bloque changement profile_id)
-- Sans ce check, un utilisateur peut déplacer une notification vers la boîte d'un autre membre.
DROP POLICY IF EXISTS "notifs_update" ON public.notifications;
CREATE POLICY "notifs_update" ON public.notifications
  FOR UPDATE TO authenticated
  USING  (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());
