CREATE TABLE public.op_chat_messages (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_id UUID        NOT NULL REFERENCES public.operations(id) ON DELETE CASCADE,
  profile_id   UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content      TEXT        NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX op_chat_messages_op_idx ON public.op_chat_messages (operation_id, created_at);

ALTER TABLE public.op_chat_messages ENABLE ROW LEVEL SECURITY;

-- Accès : participant confirmé OU commandant OU MI+
CREATE OR REPLACE FUNCTION public.is_op_participant(op_id UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT
    get_my_privilege() >= 600
    OR EXISTS (
      SELECT 1 FROM public.operations
      WHERE id = op_id AND commander_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.op_registrations
      WHERE operation_id = op_id
        AND profile_id = auth.uid()
        AND status = 'confirmed'
    )
$$;

CREATE POLICY "op_chat_select" ON public.op_chat_messages
  FOR SELECT USING (is_op_participant(operation_id));

CREATE POLICY "op_chat_insert" ON public.op_chat_messages
  FOR INSERT WITH CHECK (
    profile_id = auth.uid() AND is_op_participant(operation_id)
  );

CREATE POLICY "op_chat_delete" ON public.op_chat_messages
  FOR DELETE USING (
    profile_id = auth.uid() OR get_my_privilege() >= 1000
  );
