-- Agrégation des points par membre côté SQL (O(n_membres) vs O(n_points) en JS)
CREATE OR REPLACE FUNCTION get_member_points_totals()
RETURNS TABLE(profile_id UUID, total_points BIGINT)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT profile_id, SUM(points)::BIGINT AS total_points
  FROM member_points
  GROUP BY profile_id
$$;
