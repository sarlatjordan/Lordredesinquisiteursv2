'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createNotification } from '@/lib/notifications'
import type { OnboardingStep } from '@/types'

const STEP_LABELS: Record<OnboardingStep, string> = {
  profile:   'Profil complété',
  ship:      'Premier vaisseau enregistré',
  operation: 'Première inscription à une opération',
}

export async function claimOnboardingStep(step: OnboardingStep): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  // Idempotent insert — PK (profile_id, step) garantit un seul claim par étape
  const { data: inserted, error: upsertError } = await supabase
    .from('onboarding_progress')
    .upsert({ profile_id: user.id, step }, { ignoreDuplicates: true })
    .select()

  if (upsertError) return
  if (!inserted || inserted.length === 0) return

  const admin = createAdminClient()

  await admin.from('member_points').insert({
    profile_id:    user.id,
    points:        10,
    reason:        'other',
    reason_detail: `Onboarding — ${STEP_LABELS[step]}`,
    awarded_by:    user.id,
  })

  await createNotification(supabase, {
    profile_id: user.id,
    type:   'points',
    title:  `+10 points — ${STEP_LABELS[step]}`,
    link:   '/profil',
  })

  // Vérifie si les 3 étapes principales sont toutes complètes
  const { data: done } = await supabase
    .from('onboarding_progress')
    .select('step')
    .eq('profile_id', user.id)
    .in('step', ['profile', 'ship', 'operation'])

  if ((done?.length ?? 0) < 3) {
    revalidatePath('/dashboard')
    return
  }

  // Bonus +30 — idempotent via PK
  const { data: bonusInserted, error: bonusError } = await supabase
    .from('onboarding_progress')
    .upsert({ profile_id: user.id, step: 'bonus' }, { ignoreDuplicates: true })
    .select()

  if (bonusError) {
    revalidatePath('/dashboard')
    return
  }
  if (bonusInserted && bonusInserted.length > 0) {
    await admin.from('member_points').insert({
      profile_id:    user.id,
      points:        30,
      reason:        'other',
      reason_detail: 'Bonus onboarding — Parcours initiatique complété !',
      awarded_by:    user.id,
    })

    await createNotification(supabase, {
      profile_id: user.id,
      type:   'points',
      title:  '+30 points bonus — Parcours initiatique complété !',
      link:   '/profil',
    })
  }

  revalidatePath('/dashboard')
}
