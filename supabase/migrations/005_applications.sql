-- ============================================================
-- Migration 005 : Table candidatures (applications)
-- ============================================================

CREATE TABLE public.applications (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rsi_handle     TEXT NOT NULL CHECK (char_length(rsi_handle) >= 2),
  email          TEXT NOT NULL,
  discord_handle TEXT NOT NULL CHECK (char_length(discord_handle) >= 2),
  motivation     TEXT NOT NULL CHECK (char_length(motivation) >= 50),
  how_found      TEXT NOT NULL CHECK (char_length(how_found) >= 1),
  status         TEXT NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending', 'accepted', 'refused')),
  submitted_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at    TIMESTAMPTZ,
  reviewed_by    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  admin_notes    TEXT,
  CONSTRAINT applications_rsi_handle_unique UNIQUE (rsi_handle),
  CONSTRAINT applications_email_unique      UNIQUE (email)
);

CREATE INDEX idx_applications_status ON public.applications(status, submitted_at DESC);

ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- Tout le monde (y compris les visiteurs non connectés) peut soumettre
CREATE POLICY "applications_insert_anon" ON public.applications
  FOR INSERT TO anon
  WITH CHECK (true);

-- Les membres connectés ne voient rien par défaut
-- Les Sages (privilege >= 1000) voient tout
CREATE POLICY "applications_select_sage" ON public.applications
  FOR SELECT TO authenticated
  USING (public.get_my_privilege() >= 1000);

-- Sages peuvent mettre à jour le statut
CREATE POLICY "applications_update_sage" ON public.applications
  FOR UPDATE TO authenticated
  USING (public.get_my_privilege() >= 1000);

-- Sages peuvent supprimer (réinitialiser une candidature refusée)
CREATE POLICY "applications_delete_sage" ON public.applications
  FOR DELETE TO authenticated
  USING (public.get_my_privilege() >= 1000);
