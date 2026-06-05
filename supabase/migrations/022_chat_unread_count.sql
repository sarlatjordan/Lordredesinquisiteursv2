-- Compte les messages non lus dans tous les canaux accessibles pour l'utilisateur courant.
-- Remplace les N requêtes COUNT parallèles dans le layout par une seule requête SQL.
CREATE OR REPLACE FUNCTION public.get_chat_unread_count()
RETURNS bigint
LANGUAGE sql
STABLE
AS $$
  SELECT COUNT(*)
  FROM public.chat_messages cm
  JOIN public.chat_channels cc ON cc.id = cm.channel_id
  WHERE get_my_privilege() >= cc.min_privilege
    AND NOT cc.is_archived
    AND cm.created_at > COALESCE(
      (
        SELECT last_seen_at
        FROM public.chat_member_seen
        WHERE profile_id = auth.uid()
          AND channel_id = cm.channel_id
      ),
      '1970-01-01T00:00:00+00'::timestamptz
    );
$$;
