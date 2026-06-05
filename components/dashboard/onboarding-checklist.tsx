'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { CheckCircle2, Circle, User, Rocket, Target } from 'lucide-react'
import { claimOnboardingStep } from '@/actions/onboarding'
import type { OnboardingStep } from '@/types'

type Props = {
  completedSteps: OnboardingStep[]
  profileDone: boolean
  shipDone: boolean
  opDone: boolean
}

const STEPS: { key: OnboardingStep; label: string; icon: React.ReactNode; href: string }[] = [
  { key: 'profile',   label: 'Compléter son profil (bio + handle Star Citizen)', icon: <User    className="h-4 w-4" />, href: '/profil'     },
  { key: 'ship',      label: 'Enregistrer son premier vaisseau',                  icon: <Rocket  className="h-4 w-4" />, href: '/flotte'     },
  { key: 'operation', label: "S'inscrire à une opération",                        icon: <Target  className="h-4 w-4" />, href: '/operations' },
]

export function OnboardingChecklist({ completedSteps, profileDone, shipDone, opDone }: Props) {
  const router = useRouter()

  const done: Record<OnboardingStep, boolean> = {
    profile:   profileDone,
    ship:      shipDone,
    operation: opDone,
  }

  const doneCount  = STEPS.filter(s => done[s.key]).length
  const allDone    = doneCount === STEPS.length
  const allClaimed = STEPS.every(s => completedSteps.includes(s.key))

  const hasClaimedRef = useRef(false)

  useEffect(() => {
    if (hasClaimedRef.current) return
    const unclaimed = STEPS.filter(s => done[s.key] && !completedSteps.includes(s.key))
    if (unclaimed.length === 0) return

    hasClaimedRef.current = true
    ;(async () => {
      for (const s of unclaimed) await claimOnboardingStep(s.key)
      router.refresh()
    })()
  }, [done, completedSteps, router])

  // Disparaît uniquement quand toutes les étapes sont faites ET réclamées
  if (allDone && allClaimed) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-xl border border-primary/20 bg-primary/5 p-5 space-y-4"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-foreground text-sm">Parcours initiatique</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Complète ces étapes pour rejoindre pleinement l&apos;Ordre —{' '}
            <span className="text-primary font-medium">+10 pts chacune, +30 bonus à la fin</span>
          </p>
        </div>
        <span className="text-xs font-medium text-muted-foreground tabular-nums shrink-0">
          {doneCount}/{STEPS.length}
        </span>
      </div>

      <ul className="space-y-2.5">
        {STEPS.map((s) => (
          <li key={s.key} className="flex items-center gap-3">
            {done[s.key] ? (
              <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
            ) : (
              <Circle className="h-5 w-5 text-muted-foreground/40 shrink-0" />
            )}
            {done[s.key] ? (
              <span className="text-sm line-through text-muted-foreground">{s.label}</span>
            ) : (
              <a href={s.href} className="text-sm text-foreground hover:text-primary hover:underline transition-colors">
                {s.label}
              </a>
            )}
          </li>
        ))}
      </ul>

      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <motion.div
          className="h-full bg-primary rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${(doneCount / STEPS.length) * 100}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    </motion.div>
  )
}
