-- Bucket public pour les photos de profil (pending + approuvées)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  2097152, -- 2 Mo max
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

-- Tout utilisateur connecté peut uploader dans pending/
create policy "avatars_insert_authenticated"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'avatars');

-- Upsert (remplacement de son propre avatar en attente)
create policy "avatars_update_authenticated"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'avatars');

-- Lecture publique (URLs accessibles sans auth)
create policy "avatars_select_public"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- Suppression par l'utilisateur ou le service role (approbation)
create policy "avatars_delete_authenticated"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'avatars');
