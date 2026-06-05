-- Messagerie instantanée interne INQFR
-- Canaux de texte (style Discord simplifié) avec RLS basée sur get_my_privilege()

CREATE TABLE public.chat_channels (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL UNIQUE,
  description   TEXT,
  is_archived   BOOLEAN NOT NULL DEFAULT false,
  min_privilege INTEGER NOT NULL DEFAULT 100,
  created_by    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.chat_messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES public.chat_channels(id) ON DELETE CASCADE,
  author_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content    TEXT NOT NULL CHECK (char_length(content) >= 1 AND char_length(content) <= 2000),
  edited_at  TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Suivi de la dernière lecture par utilisateur/canal pour le badge non-lu
CREATE TABLE public.chat_member_seen (
  profile_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  channel_id   UUID NOT NULL REFERENCES public.chat_channels(id) ON DELETE CASCADE,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (profile_id, channel_id)
);

CREATE INDEX idx_chat_messages_channel ON public.chat_messages(channel_id, created_at DESC);

ALTER TABLE public.chat_channels    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_member_seen ENABLE ROW LEVEL SECURITY;

-- Canaux : lecture (privilege >= min_privilege du canal)
CREATE POLICY "channels_select" ON public.chat_channels
  FOR SELECT TO authenticated
  USING (get_my_privilege() >= min_privilege AND NOT is_archived);

-- Canaux : création (Maître Inquisiteur+)
CREATE POLICY "channels_insert" ON public.chat_channels
  FOR INSERT TO authenticated
  WITH CHECK (get_my_privilege() >= 600);

-- Canaux : mise à jour/archivage (Maître Inquisiteur+)
CREATE POLICY "channels_update" ON public.chat_channels
  FOR UPDATE TO authenticated
  USING (get_my_privilege() >= 600);

-- Messages : lecture (membres ayant accès au canal)
CREATE POLICY "messages_select" ON public.chat_messages
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_channels c
      WHERE c.id = channel_id
        AND get_my_privilege() >= c.min_privilege
        AND NOT c.is_archived
    )
  );

-- Messages : envoi (auteur = utilisateur courant + canal accessible)
CREATE POLICY "messages_insert" ON public.chat_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    author_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.chat_channels c
      WHERE c.id = channel_id
        AND get_my_privilege() >= c.min_privilege
        AND NOT c.is_archived
    )
  );

-- Messages : suppression (auteur ou Sage)
CREATE POLICY "messages_delete" ON public.chat_messages
  FOR DELETE TO authenticated
  USING (author_id = auth.uid() OR get_my_privilege() >= 1000);

-- Suivi de lecture : propres enregistrements uniquement
CREATE POLICY "seen_select" ON public.chat_member_seen
  FOR SELECT TO authenticated
  USING (profile_id = auth.uid());

CREATE POLICY "seen_insert" ON public.chat_member_seen
  FOR INSERT TO authenticated
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "seen_update" ON public.chat_member_seen
  FOR UPDATE TO authenticated
  USING (profile_id = auth.uid());

-- Realtime postgres_changes pour les nouveaux messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;

-- Canaux par défaut
INSERT INTO public.chat_channels (name, description, min_privilege) VALUES
  ('général',      'Canal principal de l''Ordre',   100),
  ('opérations',   'Coordination des opérations',   150),
  ('logistique',   'Gestion des ressources',        150),
  ('commandement', 'Canal officiers (Gardien+)',    300);
