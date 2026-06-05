-- ============================================================
-- INQFR Schema Initial
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE public.profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username        TEXT UNIQUE NOT NULL,
  display_name    TEXT,
  avatar_url      TEXT,
  role            TEXT NOT NULL DEFAULT 'membre' CHECK (role IN ('admin', 'officer', 'membre')),
  star_citizen_handle TEXT,
  discord_id      TEXT,
  bio             TEXT,
  joined_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT NOT NULL,
  description     TEXT,
  type            TEXT NOT NULL DEFAULT 'operation' CHECK (type IN ('operation', 'reunion', 'formation', 'social', 'autre')),
  status          TEXT NOT NULL DEFAULT 'planifie' CHECK (status IN ('planifie', 'en_cours', 'termine', 'annule')),
  start_at        TIMESTAMPTZ NOT NULL,
  end_at          TIMESTAMPTZ,
  location        TEXT,
  max_attendees   INTEGER CHECK (max_attendees > 0),
  created_by      UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.event_attendees (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id    UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  profile_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status      TEXT NOT NULL DEFAULT 'confirme' CHECK (status IN ('confirme', 'peut_etre', 'absent')),
  registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(event_id, profile_id)
);

CREATE TABLE public.ships (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  model         TEXT NOT NULL,
  manufacturer  TEXT,
  ship_type     TEXT NOT NULL DEFAULT 'multirole' CHECK (ship_type IN ('combat', 'transport', 'minage', 'exploration', 'support', 'multirole', 'autre')),
  status        TEXT NOT NULL DEFAULT 'disponible' CHECK (status IN ('disponible', 'en_mission', 'maintenance', 'indisponible')),
  owner_id      UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  crew_size     INTEGER NOT NULL DEFAULT 1 CHECK (crew_size >= 1),
  is_org_ship   BOOLEAN NOT NULL DEFAULT FALSE,
  notes         TEXT,
  image_url     TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.org_resources (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  slug        TEXT UNIQUE NOT NULL,
  content     TEXT,
  category    TEXT NOT NULL DEFAULT 'General',
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  author_id   UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,
  title       TEXT NOT NULL,
  message     TEXT,
  is_read     BOOLEAN NOT NULL DEFAULT FALSE,
  link        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_events_start_at      ON public.events(start_at);
CREATE INDEX idx_events_status        ON public.events(status);
CREATE INDEX idx_attendees_event      ON public.event_attendees(event_id);
CREATE INDEX idx_attendees_profile    ON public.event_attendees(profile_id);
CREATE INDEX idx_ships_owner          ON public.ships(owner_id);
CREATE INDEX idx_notifs_profile       ON public.notifications(profile_id, is_read);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_profiles_upd  BEFORE UPDATE ON public.profiles       FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trg_events_upd    BEFORE UPDATE ON public.events          FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trg_ships_upd     BEFORE UPDATE ON public.ships           FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trg_resources_upd BEFORE UPDATE ON public.org_resources   FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Trigger creation profil a inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  ) ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Row Level Security
ALTER TABLE public.profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ships           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_resources   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications   ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_admin"  ON public.profiles FOR ALL    TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- Events policies
CREATE POLICY "events_select" ON public.events FOR SELECT TO authenticated USING (true);
CREATE POLICY "events_insert" ON public.events FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'officer')));
CREATE POLICY "events_update" ON public.events FOR UPDATE TO authenticated USING (created_by = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'officer')));
CREATE POLICY "events_delete" ON public.events FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- Event attendees policies
CREATE POLICY "attendees_select" ON public.event_attendees FOR SELECT TO authenticated USING (true);
CREATE POLICY "attendees_insert" ON public.event_attendees FOR INSERT TO authenticated WITH CHECK (profile_id = auth.uid());
CREATE POLICY "attendees_update" ON public.event_attendees FOR UPDATE TO authenticated USING (profile_id = auth.uid());
CREATE POLICY "attendees_delete" ON public.event_attendees FOR DELETE TO authenticated USING (profile_id = auth.uid());

-- Ships policies
CREATE POLICY "ships_select" ON public.ships FOR SELECT TO authenticated USING (true);
CREATE POLICY "ships_insert" ON public.ships FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'officer')));
CREATE POLICY "ships_update" ON public.ships FOR UPDATE TO authenticated USING (owner_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'officer')));
CREATE POLICY "ships_delete" ON public.ships FOR DELETE TO authenticated USING (owner_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- Org resources policies
CREATE POLICY "resources_select" ON public.org_resources FOR SELECT TO authenticated USING (is_published = true OR author_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'officer')));
CREATE POLICY "resources_insert" ON public.org_resources FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'officer')));
CREATE POLICY "resources_update" ON public.org_resources FOR UPDATE TO authenticated USING (author_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'officer')));

-- Notifications policies
CREATE POLICY "notifs_select" ON public.notifications FOR SELECT TO authenticated USING (profile_id = auth.uid());
CREATE POLICY "notifs_update" ON public.notifications FOR UPDATE TO authenticated USING (profile_id = auth.uid());
CREATE POLICY "notifs_insert" ON public.notifications FOR INSERT TO authenticated WITH CHECK (true);
