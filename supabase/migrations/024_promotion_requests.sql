-- Épreuves de rang : initiées par Maître Inquisiteur+ (privilege >= 600)
-- Le membre voit les instructions une fois l'épreuve assignée
CREATE TABLE public.rank_evaluations (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  initiated_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status       TEXT NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending', 'in_progress', 'passed', 'failed', 'cancelled')),
  instructions TEXT CHECK (char_length(instructions) <= 2000),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Un seul épreuve active par membre à la fois
CREATE UNIQUE INDEX uq_rank_evaluations_active
  ON public.rank_evaluations(member_id)
  WHERE status IN ('pending', 'in_progress');

ALTER TABLE public.rank_evaluations ENABLE ROW LEVEL SECURITY;

-- Membre voit sa propre épreuve (pour lire les instructions) ; MI+ voit tout
CREATE POLICY "rank_evaluations_select" ON public.rank_evaluations
  FOR SELECT TO authenticated
  USING (member_id = auth.uid() OR get_my_privilege() >= 600);

-- MI+ peut initier une épreuve
CREATE POLICY "rank_evaluations_insert" ON public.rank_evaluations
  FOR INSERT TO authenticated
  WITH CHECK (get_my_privilege() >= 600);

-- MI+ peut mettre à jour le statut
CREATE POLICY "rank_evaluations_update" ON public.rank_evaluations
  FOR UPDATE TO authenticated
  USING (get_my_privilege() >= 600)
  WITH CHECK (get_my_privilege() >= 600);
