-- ============================================================
-- Migration 037 : Fix policies Storage galerie
-- Remplace role = 'sage' par get_my_privilege() >= 1000
-- ============================================================

DROP POLICY IF EXISTS "gallery_storage_insert" ON storage.objects;
DROP POLICY IF EXISTS "gallery_storage_delete" ON storage.objects;

CREATE POLICY "gallery_storage_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'gallery' AND public.get_my_privilege() >= 1000);

CREATE POLICY "gallery_storage_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'gallery' AND public.get_my_privilege() >= 1000);
