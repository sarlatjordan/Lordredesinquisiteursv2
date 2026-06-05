'use server'

import { revalidatePath } from 'next/cache'
import { getAuthWithPrivilege } from '@/lib/auth-helpers'
import { PartnershipSchema, type PartnershipInput, type ActionResult, type Partnership } from '@/types'


export async function createPartnership(input: PartnershipInput): Promise<ActionResult<Partnership>> {
  const { supabase, user, privilege } = await getAuthWithPrivilege()
  if (!user) return { success: false, error: 'Non authentifié' }
  if (privilege < 300) return { success: false, error: 'Gardien requis' }

  const parsed = PartnershipSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Données invalides' }

  const { data, error } = await supabase
    .from('partnerships')
    .insert({ ...parsed.data, created_by: user.id })
    .select()
    .single()

  if (error) return { success: false, error: error.message }

  revalidatePath('/partenariats')
  return { success: true, data: data as Partnership }
}

export async function updatePartnership(id: string, input: PartnershipInput): Promise<ActionResult<Partnership>> {
  const { supabase, user, privilege } = await getAuthWithPrivilege()
  if (!user) return { success: false, error: 'Non authentifié' }
  if (privilege < 300) return { success: false, error: 'Gardien requis' }

  const parsed = PartnershipSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Données invalides' }

  const { data, error } = await supabase
    .from('partnerships')
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) return { success: false, error: error.message }

  revalidatePath('/partenariats')
  revalidatePath(`/partenariats/${id}`)
  return { success: true, data: data as Partnership }
}

export async function deletePartnership(id: string): Promise<ActionResult> {
  const { supabase, user, privilege } = await getAuthWithPrivilege()
  if (!user) return { success: false, error: 'Non authentifié' }
  if (privilege < 1000) return { success: false, error: 'Sage requis' }

  const { error } = await supabase.from('partnerships').delete().eq('id', id)
  if (error) return { success: false, error: error.message }

  revalidatePath('/partenariats')
  return { success: true, data: undefined }
}
