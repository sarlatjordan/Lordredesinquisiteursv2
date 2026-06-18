-- FEAT-26 : Tracker de disponibilité hebdomadaire
-- day_of_week : 0=Lundi … 6=Dimanche
-- slot : 0=Matin (8h-12h) / 1=Après-midi (12h-18h) / 2=Soir (18h-23h) / 3=Nuit (23h-4h)

CREATE TABLE public.member_availability (
  profile_id   UUID     NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  day_of_week  SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  slot         SMALLINT NOT NULL CHECK (slot BETWEEN 0 AND 3),
  PRIMARY KEY (profile_id, day_of_week, slot)
);

ALTER TABLE public.member_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "availability_select"
  ON public.member_availability FOR SELECT
  TO authenticated USING (get_my_privilege() >= 50);

CREATE POLICY "availability_insert"
  ON public.member_availability FOR INSERT
  TO authenticated WITH CHECK (profile_id = auth.uid());

CREATE POLICY "availability_delete"
  ON public.member_availability FOR DELETE
  TO authenticated USING (profile_id = auth.uid());
