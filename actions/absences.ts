'use server'

import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAuthWithPrivilege } from '@/lib/auth-helpers'
import { createNotification } from '@/lib/notifications'
import { AbsenceCreateSchema } from '@/types'
import { revalidatePath } from 'next/cache'
import type { ActionResult } from '@/types'

export async function createAbsence(formData: FormData): Promise<ActionResult> {
  const { supabase, user } = await getAuthWithPrivilege()
  if (!user) return { success: false, error: 'Non authentifié' }

  const parsed = AbsenceCreateSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

  if (parsed.data.end_date < parsed.data.start_date)
    return { success: false, error: 'La date de fin doit être après la date de début' }

  const { error } = await supabase.from('absences').insert({
    profile_id: user.id,
    start_date: parsed.data.start_date,
    end_date:   parsed.data.end_date,
    reason:     parsed.data.reason || null,
  })
  if (error) return { success: false, error: error.message }

  const admin = createAdminClient()
  const { data: me } = await admin.from('profiles').select('display_name, username').eq('id', user.id).single()
  const memberName = me?.display_name ?? me?.username ?? 'Un membre'

  const { data: sages } = await admin.from('profiles').select('id').eq('role', 'sage').eq('is_active', true)
  if (sages && sages.length > 0) {
    const dateRange = `${parsed.data.start_date} → ${parsed.data.end_date}`
    await Promise.all(
      sages.map((sage) =>
        createNotification(admin, {
          profile_id: sage.id,
          type:       'absence',
          title:      `Absence — ${memberName}`,
          message:    parsed.data.reason ? `${dateRange} — ${parsed.data.reason}` : dateRange,
          link:       '/admin/gestion-membres',
        })
      )
    )
  }

  revalidatePath('/profil')
  return { success: true, data: undefined }
}

export async function deleteAbsence(absenceId: string): Promise<ActionResult> {
  const { supabase, user } = await getAuthWithPrivilege()
  if (!user) return { success: false, error: 'Non authentifié' }

  const parsed = z.string().uuid().safeParse(absenceId)
  if (!parsed.success) return { success: false, error: 'ID invalide' }

  const { error } = await supabase.from('absences').delete().eq('id', parsed.data)
  if (error) return { success: false, error: error.message }

  revalidatePath('/profil')
  revalidatePath('/admin/gestion-membres')
  return { success: true, data: undefined }
}
