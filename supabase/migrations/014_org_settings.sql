-- Table paramètres organisation (ligne unique)
CREATE TABLE org_settings (
  id          boolean   PRIMARY KEY DEFAULT true CHECK (id),
  recruitment_open boolean   NOT NULL DEFAULT true,
  updated_at  timestamptz NOT NULL DEFAULT now(),
  updated_by  uuid REFERENCES profiles(id) ON DELETE SET NULL
);

INSERT INTO org_settings (id, recruitment_open) VALUES (true, true);

ALTER TABLE org_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_settings_select" ON org_settings
  FOR SELECT USING (true);

CREATE POLICY "org_settings_update" ON org_settings
  FOR UPDATE USING     (get_my_privilege() >= 300)
  WITH CHECK           (get_my_privilege() >= 300);
