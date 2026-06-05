CREATE TABLE public.op_resources (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_id UUID        NOT NULL REFERENCES public.operations(id) ON DELETE CASCADE,
  item_id      UUID        REFERENCES public.inventory_items(id) ON DELETE SET NULL,
  item_name    TEXT        NOT NULL,
  quantity     INTEGER     NOT NULL CHECK (quantity > 0),
  unit         TEXT        NOT NULL DEFAULT 'unit',
  status       TEXT        NOT NULL DEFAULT 'pending_request'
                           CHECK (status IN ('reserved','pending_request','released')),
  transaction_id UUID      REFERENCES public.inventory_transactions(id) ON DELETE SET NULL,
  requested_by UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  notes        TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_op_resources_operation ON public.op_resources (operation_id);
CREATE INDEX idx_op_resources_status    ON public.op_resources (status);

ALTER TABLE public.op_resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "op_resources_select" ON public.op_resources
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "op_resources_insert" ON public.op_resources
  FOR INSERT TO authenticated
  WITH CHECK (public.get_my_privilege() >= 300);

CREATE POLICY "op_resources_update" ON public.op_resources
  FOR UPDATE TO authenticated
  USING (public.get_my_privilege() >= 300);

CREATE POLICY "op_resources_delete" ON public.op_resources
  FOR DELETE TO authenticated
  USING (public.get_my_privilege() >= 300);
