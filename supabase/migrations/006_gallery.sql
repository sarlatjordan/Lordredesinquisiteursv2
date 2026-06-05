-- ============================================================
-- Migration 006 : Galerie média
-- ============================================================

-- Bucket de stockage public
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'gallery',
  'gallery',
  true,
  15728640, -- 15 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Policy storage : lecture publique
CREATE POLICY "gallery_storage_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'gallery');

-- Policy storage : upload réservé aux Sages
CREATE POLICY "gallery_storage_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'gallery' AND
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'sage'
  );

-- Policy storage : suppression réservée aux Sages
CREATE POLICY "gallery_storage_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'gallery' AND
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'sage'
  );

-- Table des médias
CREATE TABLE public.media_gallery (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  storage_path TEXT NOT NULL,
  url          TEXT NOT NULL,
  title        TEXT,
  caption      TEXT,
  uploaded_by  UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_gallery_created ON public.media_gallery(created_at DESC);

ALTER TABLE public.media_gallery ENABLE ROW LEVEL SECURITY;

-- Lecture publique (anon + authentifié)
CREATE POLICY "gallery_select_anon" ON public.media_gallery
  FOR SELECT TO anon USING (true);

CREATE POLICY "gallery_select_auth" ON public.media_gallery
  FOR SELECT TO authenticated USING (true);

-- Insertion Sages
CREATE POLICY "gallery_insert_sage" ON public.media_gallery
  FOR INSERT TO authenticated
  WITH CHECK (public.get_my_privilege() >= 1000);

-- Suppression Sages
CREATE POLICY "gallery_delete_sage" ON public.media_gallery
  FOR DELETE TO authenticated
  USING (public.get_my_privilege() >= 1000);
