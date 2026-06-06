'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { ActionResult } from '@/types'

export async function requestDataExport(): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Non authentifié' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, username')
    .eq('id', user.id)
    .single()

  const admin = createAdminClient()

  const { data: sages } = await admin
    .from('profiles')
    .select('id')
    .eq('role', 'sage')

  if (!sages?.length) {
    return { success: false, error: 'Aucun administrateur disponible. Contactez le Conseil directement.' }
  }

  const displayName = profile?.display_name ?? profile?.username ?? user.email ?? 'Membre'

  const { error } = await admin.from('notifications').insert(
    sages.map((sage) => ({
      profile_id: sage.id,
      type: 'rgpd_request',
      title: 'Demande d\'export de données (RGPD)',
      message: `${displayName} (@${profile?.username}) demande une copie de ses données personnelles.`,
      link: `/membres/${profile?.username}`,
    }))
  )

  if (error) return { success: false, error: error.message }

  return { success: true, data: undefined }
}
