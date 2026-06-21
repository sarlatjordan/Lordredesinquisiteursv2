'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { getAuthWithPrivilege } from '@/lib/auth-helpers'
import { createAdminClient } from '@/lib/supabase/admin'
import type { ActionResult } from '@/types'

const SubmitSchema = z.object({
  title:       z.string().min(3).max(150),
  description: z.string().min(10).max(4000),
  page_url:    z.string().max(500).optional(),
  severity:    z.enum(['faible', 'moyen', 'eleve', 'critique']),
})

export async function submitBugReport(formData: FormData): Promise<ActionResult> {
  const parsed = SubmitSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

  const { supabase, user, privilege } = await getAuthWithPrivilege()
  if (!user) return { success: false, error: 'Non authentifié' }
  if (privilege < 100) return { success: false, error: 'Accès refusé' }

  const { error } = await supabase.from('bug_reports').insert({
    profile_id:  user.id,
    title:       parsed.data.title,
    description: parsed.data.description,
    page_url:    parsed.data.page_url || null,
    severity:    parsed.data.severity,
  })

  if (error) return { success: false, error: error.message }

  revalidatePath('/rapport-bug')
  return { success: true, data: undefined as void }
}

const UpdateSchema = z.object({
  status:     z.enum(['ouvert', 'en_cours', 'resolu', 'ferme']),
  admin_note: z.string().max(1000).optional(),
})

export async function updateBugReport(
  id: string,
  data: { status: string; admin_note?: string },
): Promise<ActionResult> {
  const parsed = UpdateSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

  const { user, privilege } = await getAuthWithPrivilege()
  if (!user) return { success: false, error: 'Non authentifié' }
  if (privilege < 600) return { success: false, error: 'MI requis' }

  const admin = createAdminClient()
  const { error } = await admin
    .from('bug_reports')
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/rapport-bug')
  revalidatePath('/admin/bugs')
  return { success: true, data: undefined as void }
}
