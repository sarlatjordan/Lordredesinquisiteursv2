'use server'

import { z } from 'zod'
import { revalidateTag } from 'next/cache'
import { getAuthWithPrivilege } from '@/lib/auth-helpers'
import type { ActionResult } from '@/types'

const Schema = z.object({
  path:          z.string().min(1),
  min_privilege: z.number().int().min(0),
})

export async function updatePageAccessRule(
  path: string,
  min_privilege: number,
): Promise<ActionResult> {
  const parsed = Schema.safeParse({ path, min_privilege })
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

  const { supabase, user, privilege } = await getAuthWithPrivilege()
  if (!user) return { success: false, error: 'Non authentifié' }
  if (privilege < 1000) return { success: false, error: 'Sage requis' }

  const { error } = await supabase
    .from('page_access_rules')
    .update({ min_privilege: parsed.data.min_privilege, updated_at: new Date().toISOString() })
    .eq('path', parsed.data.path)

  if (error) return { success: false, error: error.message }

  revalidateTag('page-access-rules', { expire: 0 })
  return { success: true, data: undefined as void }
}
