-- ============================================================
-- Script RGPD — Export complet des données d'un membre
-- Supabase Dashboard → SQL Editor → coller et remplacer TARGET_USERNAME
-- ============================================================

-- Remplacez TARGET_USERNAME par le username du membre (ex: 'sarlat.jordan')
-- Toutes les requêtes utilisent ce CTE comme point d'entrée.

WITH target AS (
  SELECT p.id, p.username, au.email
  FROM public.profiles p
  JOIN auth.users au ON au.id = p.id
  WHERE p.username = 'TARGET_USERNAME'
)

-- ── 1. Compte & profil ────────────────────────────────────────────────────────
SELECT
  '1_compte_profil' AS section,
  au.email,
  au.email_confirmed_at,
  au.created_at        AS compte_cree_le,
  au.last_sign_in_at   AS derniere_connexion,
  p.username,
  p.display_name,
  p.bio,
  p.role,
  p.star_citizen_handle,
  p.discord_id,
  p.joined_at,
  p.is_active
FROM public.profiles p
JOIN auth.users au ON au.id = p.id
WHERE p.id = (SELECT id FROM target);

-- ── 2. Comptes OAuth liés ─────────────────────────────────────────────────────
SELECT
  '2_comptes_oauth'               AS section,
  provider,
  identity_data->>'email'         AS provider_email,
  COALESCE(
    identity_data->>'name',
    identity_data->>'full_name'
  )                               AS provider_name,
  created_at                      AS lie_le
FROM auth.identities
WHERE user_id = (SELECT id FROM target);

-- ── 3. Vaisseaux ─────────────────────────────────────────────────────────────
SELECT
  '3_vaisseaux' AS section,
  name, model, manufacturer, ship_type, status,
  crew_size, is_org_ship, purchased_in_game, notes, created_at
FROM public.ships
WHERE owner_id = (SELECT id FROM target)
ORDER BY created_at;

-- ── 4. Inscriptions aux opérations ───────────────────────────────────────────
SELECT
  '4_operations'           AS section,
  o.title                  AS operation,
  o.status                 AS statut_operation,
  o.departure_at           AS depart,
  r.preferred_role,
  r.notes,
  r.status                 AS statut_inscription,
  r.created_at             AS inscrit_le
FROM public.op_registrations r
JOIN public.operations o ON o.id = r.operation_id
WHERE r.profile_id = (SELECT id FROM target)
ORDER BY r.created_at DESC;

-- ── 5. Présences aux événements ───────────────────────────────────────────────
SELECT
  '5_evenements'    AS section,
  e.title           AS evenement,
  e.type,
  e.start_at        AS debut,
  ea.status,
  ea.registered_at  AS inscrit_le
FROM public.event_attendees ea
JOIN public.events e ON e.id = ea.event_id
WHERE ea.profile_id = (SELECT id FROM target)
ORDER BY ea.registered_at DESC;

-- ── 6. Historique des points ──────────────────────────────────────────────────
SELECT
  '6_points'                         AS section,
  mp.points,
  mp.reason,
  mp.reason_detail,
  p2.display_name                    AS attribue_par,
  mp.created_at
FROM public.member_points mp
LEFT JOIN public.profiles p2 ON p2.id = mp.awarded_by
WHERE mp.profile_id = (SELECT id FROM target)
ORDER BY mp.created_at DESC;

-- ── 7. Historique des promotions ─────────────────────────────────────────────
SELECT
  '7_promotions'           AS section,
  mp.from_role,
  mp.to_role,
  mp.note,
  p2.display_name          AS promu_par,
  mp.promoted_at
FROM public.member_promotions mp
LEFT JOIN public.profiles p2 ON p2.id = mp.promoted_by
WHERE mp.profile_id = (SELECT id FROM target)
ORDER BY mp.promoted_at DESC;

-- ── 8. Messages envoyés ───────────────────────────────────────────────────────
SELECT
  '8_messages'      AS section,
  cc.name           AS canal,
  cm.content,
  cm.created_at,
  cm.edited_at
FROM public.chat_messages cm
JOIN public.chat_channels cc ON cc.id = cm.channel_id
WHERE cm.author_id = (SELECT id FROM target)
ORDER BY cm.created_at DESC;

-- ── 9. Transactions logistique ────────────────────────────────────────────────
SELECT
  '9_logistique'       AS section,
  ii.name              AS item,
  it.quantity,
  it.type,
  it.notes,
  it.status,
  it.created_at
FROM public.inventory_transactions it
JOIN public.inventory_items ii ON ii.id = it.item_id
WHERE it.requested_by = (SELECT id FROM target)
ORDER BY it.created_at DESC;
