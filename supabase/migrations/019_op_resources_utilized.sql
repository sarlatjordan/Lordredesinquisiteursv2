ALTER TABLE op_resources DROP CONSTRAINT IF EXISTS op_resources_status_check;
ALTER TABLE op_resources ADD CONSTRAINT op_resources_status_check
  CHECK (status IN ('reserved','pending_request','released','utilized'));
