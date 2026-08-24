-- FEAT-36 : Commentaires contextuels sur ops et événements
CREATE TABLE public.comments (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT        NOT NULL CHECK (entity_type IN ('operation', 'event')),
  entity_id   UUID        NOT NULL,
  author_id   UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content     TEXT        NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX comments_entity_idx ON public.comments (entity_type, entity_id, created_at);

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Lecture : membres authentifiés (visiteur+)
CREATE POLICY "comments_select" ON public.comments
  FOR SELECT TO authenticated
  USING (get_my_privilege() >= 50);

-- Insertion : membres authentifiés, uniquement leurs propres commentaires
CREATE POLICY "comments_insert" ON public.comments
  FOR INSERT TO authenticated
  WITH CHECK (author_id = auth.uid() AND get_my_privilege() >= 50);

-- Suppression : auteur uniquement ou Sage+
CREATE POLICY "comments_delete" ON public.comments
  FOR DELETE TO authenticated
  USING (author_id = auth.uid() OR get_my_privilege() >= 1000);
