'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { ResourceCreateSchema, type ResourceCreateInput, type ActionResult, type OrgResource } from '@/types'
import { getRolePrivilege, PRIVILEGE } from '@/lib/constants'

async function assertAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase: null, userId: null, error: 'Non authentifié' as const }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (getRolePrivilege(profile?.role ?? '') < PRIVILEGE.MANAGE_RESOURCES) {
    return { supabase: null, userId: null, error: 'Droits insuffisants — Maître Inquisiteur requis' as const }
  }

  return { supabase, userId: user.id, error: null }
}

export async function createResource(input: ResourceCreateInput): Promise<ActionResult<OrgResource>> {
  const { supabase, userId, error } = await assertAdmin()
  if (error || !supabase) return { success: false, error: error ?? 'Erreur' }

  const parsed = ResourceCreateSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Données invalides' }
  }

  const { data, error: dbError } = await supabase
    .from('org_resources')
    .insert({ ...parsed.data, author_id: userId })
    .select()
    .single()

  if (dbError) return { success: false, error: dbError.message }

  revalidatePath('/ressources')
  return { success: true, data: data as OrgResource }
}

export async function updateResource(
  id: string,
  input: Partial<ResourceCreateInput>
): Promise<ActionResult<OrgResource>> {
  const { supabase, error } = await assertAdmin()
  if (error || !supabase) return { success: false, error: error ?? 'Erreur' }

  const { data, error: dbError } = await supabase
    .from('org_resources')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (dbError) return { success: false, error: dbError.message }

  revalidatePath('/ressources')
  revalidatePath(`/ressources/${(data as OrgResource).slug}`)
  return { success: true, data: data as OrgResource }
}

export async function deleteResource(id: string): Promise<ActionResult> {
  const { supabase, error } = await assertAdmin()
  if (error || !supabase) return { success: false, error: error ?? 'Erreur' }

  const { error: dbError } = await supabase.from('org_resources').delete().eq('id', id)
  if (dbError) return { success: false, error: dbError.message }

  revalidatePath('/ressources')
  return { success: true, data: undefined }
}
