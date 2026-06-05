-- ============================================================
-- Migration 007 : Planification tactique — Opérations
-- ============================================================

CREATE TABLE public.operations (
  id                     UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
  title                  TEXT         NOT NULL,
  system_name            TEXT         NOT NULL,
  type                   TEXT         NOT NULL CHECK (type IN ('combat','salvage','mining','commerce','infiltration','rescue')),
  status                 TEXT         NOT NULL DEFAULT 'planned' CHECK (status IN ('planned','active','completed','cancelled')),
  departure_at           TIMESTAMPTZ  NOT NULL,
  estimated_duration_min INTEGER,
  risk_level             TEXT         NOT NULL DEFAULT 'medium' CHECK (risk_level IN ('low','medium','high','critical')),
  commander_id           UUID         REFERENCES public.profiles(id) ON DELETE SET NULL,
  description            TEXT,
  min_privilege          INTEGER      NOT NULL DEFAULT 100,
  created_by             UUID         REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at             TIMESTAMPTZ  DEFAULT NOW(),
  updated_at             TIMESTAMPTZ  DEFAULT NOW()
);

-- Slots de rôles — une ligne par poste requis (plusieurs lignes pour le même rôle = plusieurs postes)
CREATE TABLE public.op_role_slots (
  id                   UUID  DEFAULT gen_random_uuid() PRIMARY KEY,
  operation_id         UUID  NOT NULL REFERENCES public.operations(id) ON DELETE CASCADE,
  role                 TEXT  NOT NULL CHECK (role IN ('commander','pilot','copilot','gunner','medic','engineer','soldier','fighter_pilot')),
  assigned_profile_id  UUID  REFERENCES public.profiles(id) ON DELETE SET NULL,
  ship_id              UUID  REFERENCES public.ships(id) ON DELETE SET NULL,
  notes                TEXT
);

-- Inscriptions libres des membres (préférence + notes, validées par le commandant)
CREATE TABLE public.op_registrations (
  id             UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
  operation_id   UUID         NOT NULL REFERENCES public.operations(id) ON DELETE CASCADE,
  profile_id     UUID         NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  preferred_role TEXT         CHECK (preferred_role IN ('commander','pilot','copilot','gunner','medic','engineer','soldier','fighter_pilot')),
  notes          TEXT,
  status         TEXT         NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','rejected')),
  created_at     TIMESTAMPTZ  DEFAULT NOW(),
  UNIQUE(operation_id, profile_id)
);

-- ─── RLS ─────────────────────────────────────────────────────────────────────

ALTER TABLE public.operations      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.op_role_slots   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.op_registrations ENABLE ROW LEVEL SECURITY;

-- Operations
CREATE POLICY "ops_select" ON public.operations
  FOR SELECT TO authenticated
  USING (public.get_my_privilege() >= min_privilege);

CREATE POLICY "ops_insert" ON public.operations
  FOR INSERT TO authenticated
  WITH CHECK (public.get_my_privilege() >= 300);

CREATE POLICY "ops_update" ON public.operations
  FOR UPDATE TO authenticated
  USING (created_by = auth.uid() OR public.get_my_privilege() >= 300);

CREATE POLICY "ops_delete" ON public.operations
  FOR DELETE TO authenticated
  USING (public.get_my_privilege() >= 1000);

-- Op role slots
CREATE POLICY "op_slots_select" ON public.op_role_slots
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.operations o
      WHERE o.id = operation_id AND public.get_my_privilege() >= o.min_privilege
    )
  );

CREATE POLICY "op_slots_insert" ON public.op_role_slots
  FOR INSERT TO authenticated
  WITH CHECK (public.get_my_privilege() >= 300);

CREATE POLICY "op_slots_update" ON public.op_role_slots
  FOR UPDATE TO authenticated
  USING (public.get_my_privilege() >= 300);

CREATE POLICY "op_slots_delete" ON public.op_role_slots
  FOR DELETE TO authenticated
  USING (public.get_my_privilege() >= 300);

-- Op registrations
CREATE POLICY "op_reg_select" ON public.op_registrations
  FOR SELECT TO authenticated
  USING (profile_id = auth.uid() OR public.get_my_privilege() >= 300);

CREATE POLICY "op_reg_insert" ON public.op_registrations
  FOR INSERT TO authenticated
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "op_reg_update" ON public.op_registrations
  FOR UPDATE TO authenticated
  USING (public.get_my_privilege() >= 300);

CREATE POLICY "op_reg_delete" ON public.op_registrations
  FOR DELETE TO authenticated
  USING (profile_id = auth.uid() OR public.get_my_privilege() >= 300);
