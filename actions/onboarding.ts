'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createNotification } from '@/lib/notifications'
import { ONBOARDING_CONFIGS } from '@/lib/constants'
import type { ExtendedOnboardingStep } from '@/types'
import type { Role } from '@/lib/constants'

const OnboardingStepSchema = z.enum([
  'profile', 'ship', 'operation',
  'operation_important', 'first_event', 'bonus',
  'discord_joined', 'consacre_bonus',
  'consacre_events_5', 'consacre_op_5', 'consacre_logistics', 'consacre_resource', 'consacre_recruitment',
  'gardien_op_lead', 'gardien_events_10', 'gardien_logistics', 'gardien_resource', 'gardien_recruitment', 'gardien_bonus',
  'inquisiteur_op_lead_3', 'inquisiteur_event_organize', 'inquisiteur_training', 'inquisiteur_events_25', 'inquisiteur_partnership', 'inquisiteur_bonus',
])

export async function claimOnboardingStep(step: ExtendedOnboardingStep): Promise<void> {
  const parsed = OnboardingStepSchema.safeParse(step)
  if (!parsed.success) return

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile) return

  const config = ONBOARDING_CONFIGS[profile.role as Role]
  if (!config) return

  // Idempotent insert — PK (profile_id, step) garantit un seul claim par étape
  const { data: inserted, error: upsertError } = await supabase
    .from('onboarding_progress')
    .upsert({ profile_id: user.id, step }, { ignoreDuplicates: true })
    .select()

  if (upsertError) return
  if (!inserted || inserted.length === 0) return

  const admin = createAdminClient()

  const stepConfig = config.steps.find(s => s.key === step)
  if (!stepConfig) return

  await admin.from('member_points').insert({
    profile_id:    user.id,
    points:        config.pointsPerStep,
    reason:        'other',
    reason_detail: `Onboarding — ${stepConfig.label}`,
    awarded_by:    user.id,
  })

  await createNotification(supabase, {
    profile_id: user.id,
    type:   'points',
    title:  `+${config.pointsPerStep} points — ${stepConfig.label}`,
    link:   '/profil',
  })

  // Vérifie si toutes les étapes du rang sont complètes
  const stepKeys = config.steps.map(s => s.key)
  const { data: done } = await supabase
    .from('onboarding_progress')
    .select('step')
    .eq('profile_id', user.id)
    .in('step', stepKeys)

  if ((done?.length ?? 0) < stepKeys.length) {
    revalidatePath('/dashboard')
    return
  }

  // Bonus — idempotent via PK
  const { data: bonusInserted, error: bonusError } = await supabase
    .from('onboarding_progress')
    .upsert({ profile_id: user.id, step: config.bonusStep }, { ignoreDuplicates: true })
    .select()

  if (bonusError) {
    revalidatePath('/dashboard')
    return
  }
  if (bonusInserted && bonusInserted.length > 0) {
    await admin.from('member_points').insert({
      profile_id:    user.id,
      points:        config.bonusPoints,
      reason:        'other',
      reason_detail: `Bonus onboarding — Parcours ${profile.role} complété !`,
      awarded_by:    user.id,
    })

    await createNotification(supabase, {
      profile_id: user.id,
      type:   'points',
      title:  `+${config.bonusPoints} points bonus — Parcours initiatique complété !`,
      link:   '/profil',
    })
  }

  revalidatePath('/dashboard')
}
