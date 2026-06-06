CREATE TABLE IF NOT EXISTS trusted_devices (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id  UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  device_id   UUID        NOT NULL UNIQUE,
  label       TEXT,
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE trusted_devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "trusted_devices_select_own" ON trusted_devices
  FOR SELECT USING (profile_id = auth.uid());

CREATE POLICY "trusted_devices_insert_own" ON trusted_devices
  FOR INSERT WITH CHECK (profile_id = auth.uid());

CREATE POLICY "trusted_devices_delete_own" ON trusted_devices
  FOR DELETE USING (profile_id = auth.uid());
