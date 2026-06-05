-- ============================================================
-- Migration 026 : Fonctions RPC atomiques pour l'inventaire
-- SEC-B04 : TOCTOU — réservation et approbation non-atomiques
-- ============================================================

-- Réserve du stock de manière atomique (FOR UPDATE sur inventory_stock).
-- Retourne { reserved: bool, transaction_id: uuid | null }.
-- Appelé par addOperationResource quand un item_id connu est fourni.
CREATE OR REPLACE FUNCTION public.try_reserve_inventory(
  p_item_id      UUID,
  p_quantity     INTEGER,
  p_operation_id UUID,
  p_member_id    UUID,
  p_notes        TEXT DEFAULT 'Réservation opération'
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_available  INTEGER;
  v_reserved   INTEGER;
  v_tx_id      UUID;
BEGIN
  SELECT quantity - reserved_quantity, reserved_quantity
    INTO v_available, v_reserved
    FROM inventory_stock
   WHERE item_id = p_item_id
     FOR UPDATE;

  IF NOT FOUND OR v_available < p_quantity THEN
    RETURN jsonb_build_object('reserved', false, 'transaction_id', null);
  END IF;

  INSERT INTO inventory_transactions (item_id, type, quantity, member_id, operation_id, status, notes)
  VALUES (p_item_id, 'reservation', p_quantity, p_member_id, p_operation_id, 'direct', p_notes)
  RETURNING id INTO v_tx_id;

  UPDATE inventory_stock
     SET reserved_quantity = v_reserved + p_quantity,
         updated_at        = now(),
         updated_by        = p_member_id
   WHERE item_id = p_item_id;

  RETURN jsonb_build_object('reserved', true, 'transaction_id', v_tx_id);
END;
$$;

-- Approuve une transaction pending (deposit ou withdrawal) de manière atomique.
-- Retourne { success: bool, error: text | null }.
-- Appelé par processTransaction quand approve = true.
CREATE OR REPLACE FUNCTION public.approve_inventory_transaction(
  p_transaction_id UUID,
  p_approved_by    UUID
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tx    RECORD;
  v_avail INTEGER;
BEGIN
  SELECT * INTO v_tx
    FROM inventory_transactions
   WHERE id = p_transaction_id
     FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Transaction introuvable');
  END IF;

  IF v_tx.status <> 'pending' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Transaction déjà traitée');
  END IF;

  IF v_tx.type = 'withdrawal' THEN
    SELECT quantity - reserved_quantity INTO v_avail
      FROM inventory_stock
     WHERE item_id = v_tx.item_id
       FOR UPDATE;

    IF v_avail < v_tx.quantity THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', format('Stock disponible insuffisant (%s dispo.)', v_avail)
      );
    END IF;

    UPDATE inventory_stock
       SET quantity   = quantity - v_tx.quantity,
           updated_at = now(),
           updated_by = p_approved_by
     WHERE item_id = v_tx.item_id;

  ELSIF v_tx.type = 'deposit' THEN
    UPDATE inventory_stock
       SET quantity   = quantity + v_tx.quantity,
           updated_at = now(),
           updated_by = p_approved_by
     WHERE item_id = v_tx.item_id;

  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'Type de transaction non géré');
  END IF;

  UPDATE inventory_transactions
     SET status      = 'approved',
         approved_by = p_approved_by,
         approved_at = now()
   WHERE id = p_transaction_id;

  RETURN jsonb_build_object('success', true, 'error', null);
END;
$$;
