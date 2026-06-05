ALTER TABLE inventory_items DROP CONSTRAINT IF EXISTS inventory_items_unit_check;
ALTER TABLE inventory_items ADD CONSTRAINT inventory_items_unit_check
  CHECK (unit IN ('unit','kg','uec','lot','scu','uscu','mscu'));
