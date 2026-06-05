-- ============================================================
-- Migration 011 : Logistique — Inventaire org
-- ============================================================

CREATE TABLE public.inventory_items (
  id          UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
  name        TEXT         NOT NULL,
  type        TEXT         NOT NULL DEFAULT 'loot'
                           CHECK (type IN ('loot','material','blueprint','uec','component')),
  unit        TEXT         NOT NULL DEFAULT 'unit'
                           CHECK (unit IN ('unit','kg','uec','lot')),
  description TEXT,
  created_by  UUID         REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ  DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  DEFAULT NOW()
);

-- Ligne de stock 1:1 avec inventory_items
CREATE TABLE public.inventory_stock (
  item_id           UUID         PRIMARY KEY
                                 REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  quantity          INTEGER      NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  reserved_quantity INTEGER      NOT NULL DEFAULT 0 CHECK (reserved_quantity >= 0),
  updated_at        TIMESTAMPTZ  DEFAULT NOW(),
  updated_by        UUID         REFERENCES public.profiles(id) ON DELETE SET NULL
);

CREATE TABLE public.inventory_transactions (
  id           UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id      UUID         NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  type         TEXT         NOT NULL
               CHECK (type IN ('deposit','withdrawal','reservation','release')),
  quantity     INTEGER      NOT NULL CHECK (quantity > 0),
  member_id    UUID         NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  operation_id UUID         REFERENCES public.operations(id) ON DELETE SET NULL,
  notes        TEXT,
  status       TEXT         NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending','approved','rejected','direct')),
  approved_by  UUID         REFERENCES public.profiles(id) ON DELETE SET NULL,
  approved_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX idx_inv_tx_item_id  ON public.inventory_transactions (item_id);
CREATE INDEX idx_inv_tx_member   ON public.inventory_transactions (member_id);
CREATE INDEX idx_inv_tx_status   ON public.inventory_transactions (status);

-- Trigger : auto-crée la ligne stock à la création d'un item
CREATE OR REPLACE FUNCTION public.handle_inventory_item_insert()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.inventory_stock (item_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_inventory_item_created
  AFTER INSERT ON public.inventory_items
  FOR EACH ROW EXECUTE FUNCTION public.handle_inventory_item_insert();

-- ─── RLS ─────────────────────────────────────────────────────────────────────

ALTER TABLE public.inventory_items        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_stock        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;

-- inventory_items
CREATE POLICY "inv_items_select" ON public.inventory_items
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "inv_items_insert" ON public.inventory_items
  FOR INSERT TO authenticated
  WITH CHECK (public.get_my_privilege() >= 300);

CREATE POLICY "inv_items_update" ON public.inventory_items
  FOR UPDATE TO authenticated
  USING (public.get_my_privilege() >= 300);

CREATE POLICY "inv_items_delete" ON public.inventory_items
  FOR DELETE TO authenticated
  USING (public.get_my_privilege() >= 1000);

-- inventory_stock (INSERT géré par trigger SECURITY DEFINER)
CREATE POLICY "inv_stock_select" ON public.inventory_stock
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "inv_stock_update" ON public.inventory_stock
  FOR UPDATE TO authenticated
  USING (public.get_my_privilege() >= 300);

-- inventory_transactions
CREATE POLICY "inv_tx_select" ON public.inventory_transactions
  FOR SELECT TO authenticated
  USING (member_id = auth.uid() OR public.get_my_privilege() >= 300);

CREATE POLICY "inv_tx_insert" ON public.inventory_transactions
  FOR INSERT TO authenticated
  WITH CHECK (member_id = auth.uid());

CREATE POLICY "inv_tx_update" ON public.inventory_transactions
  FOR UPDATE TO authenticated
  USING (public.get_my_privilege() >= 300);

CREATE POLICY "inv_tx_delete" ON public.inventory_transactions
  FOR DELETE TO authenticated
  USING (public.get_my_privilege() >= 1000);
