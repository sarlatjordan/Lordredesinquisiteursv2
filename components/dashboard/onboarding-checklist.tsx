'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { CheckCircle2, Circle, User, Rocket, Target, MessageSquare, CalendarDays } from 'lucide-react'
import { claimOnboardingStep } from '@/actions/onboarding'
import type { RankOnboardingConfig } from '@/lib/constants'
import type { ExtendedOnboardingStep } from '@/types'

const STEP_ICONS: Partial<Record<ExtendedOnboardingStep, React.ReactNode>> = {
  profile:       <User          className="h-4 w-4" />,
  ship:          <Rocket        className="h-4 w-4" />,
  operation:     <Target        className="h-4 w-4" />,
  discord_joined:<MessageSquare className="h-4 w-4" />,
  first_event:   <CalendarDays  className="h-4 w-4" />,
}

type Props = {
  config: RankOnboardingConfig
  completedSteps: string[]
  stepsDone: Record<string, boolean>
}

export function OnboardingChecklist({ config, completedSteps, stepsDone }: Props) {
  const router = useRouter()

  const doneCount  = config.steps.filter(s => stepsDone[s.key]).length
  const allDone    = doneCount === config.steps.length
  const allClaimed = config.steps.every(s => completedSteps.includes(s.key))

  const hasClaimedRef = useRef(false)

  useEffect(() => {
    if (hasClaimedRef.current) return
    const unclaimed = config.steps.filter(s => stepsDone[s.key] && !completedSteps.includes(s.key))
    if (unclaimed.length === 0) return

    hasClaimedRef.current = true
    ;(async () => {
      for (const s of unclaimed) await claimOnboardingStep(s.key)
      router.refresh()
    })()
  }, [config.steps, stepsDone, completedSteps, router])

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
            Complète ces étapes pour progresser —{' '}
            <span className="text-primary font-medium">
              +{config.pointsPerStep} pts chacune, +{config.bonusPoints} bonus à la fin
            </span>
          </p>
        </div>
        <span className="text-xs font-medium text-muted-foreground tabular-nums shrink-0">
          {doneCount}/{config.steps.length}
        </span>
      </div>

      <ul className="space-y-2.5">
        {config.steps.map((s) => {
          const done = stepsDone[s.key] ?? false
          return (
            <li key={s.key} className="flex items-center gap-3">
              {done ? (
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground/40 shrink-0" />
              )}
              {done ? (
                <span className="text-sm line-through text-muted-foreground">{s.label}</span>
              ) : (
                <a href={s.href} className="text-sm text-foreground hover:text-primary hover:underline transition-colors">
                  {s.label}
                </a>
              )}
            </li>
          )
        })}
      </ul>

      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <motion.div
          className="h-full bg-primary rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${(doneCount / config.steps.length) * 100}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    </motion.div>
  )
}
