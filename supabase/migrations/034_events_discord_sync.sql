ALTER TABLE events ADD COLUMN IF NOT EXISTS discord_event_id TEXT UNIQUE;

CREATE INDEX IF NOT EXISTS events_discord_event_id_idx ON events (discord_event_id) WHERE discord_event_id IS NOT NULL;
