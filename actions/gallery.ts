'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getRolePrivilege } from '@/lib/constants'

const MediaInsertSchema = z.object({
  storage_path: z.string().min(1),
  url: z.string().url(),
  title: z.string().max(200).optional(),
  caption: z.string().max(500).optional(),
})

export type GalleryActionResult =
  | { success: true }
  | { success: false; error: string }

export async function insertMediaRecord(input: {
  storage_path: string
  url: string
  title?: string
  caption?: string
}): Promise<GalleryActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Non authentifié' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || getRolePrivilege(profile.role) < 1000) {
    return { success: false, error: 'Droits insuffisants — Sage requis' }
  }

  const parsed = MediaInsertSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: 'Données invalides' }

  const admin = createAdminClient()
  const { error } = await admin.from('media_gallery').insert({
    ...parsed.data,
    uploaded_by: user.id,
  })

  if (error) return { success: false, error: error.message }

  revalidatePath('/galerie')
  revalidatePath('/admin/galerie')
  return { success: true }
}

export async function updateMediaRecord(
  id: string,
  data: { title?: string; caption?: string },
): Promise<GalleryActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Non authentifié' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || getRolePrivilege(profile.role) < 1000) {
    return { success: false, error: 'Droits insuffisants — Sage requis' }
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from('media_gallery')
    .update({ title: data.title ?? null, caption: data.caption ?? null })
    .eq('id', id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/galerie')
  revalidatePath('/admin/galerie')
  return { success: true }
}

export async function deleteMediaRecord(id: string): Promise<GalleryActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Non authentifié' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || getRolePrivilege(profile.role) < 1000) {
    return { success: false, error: 'Droits insuffisants — Sage requis' }
  }

  const admin = createAdminClient()

  const { data: media } = await admin
    .from('media_gallery')
    .select('storage_path')
    .eq('id', id)
    .single()

  if (media?.storage_path) {
    await admin.storage.from('gallery').remove([media.storage_path])
  }

  const { error } = await admin.from('media_gallery').delete().eq('id', id)
  if (error) return { success: false, error: error.message }

  revalidatePath('/galerie')
  revalidatePath('/admin/galerie')
  return { success: true }
}
