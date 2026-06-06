'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  CheckCircle2, Circle, User, Rocket, Target, CalendarDays, MessageSquare,
  Shield, Package, BookOpen, Users, Award, Star,
} from 'lucide-react'
import { claimOnboardingStep } from '@/actions/onboarding'
import type { RankOnboardingConfig } from '@/lib/constants'
import type { ExtendedOnboardingStep } from '@/types'

const STEP_ICONS: Partial<Record<ExtendedOnboardingStep, React.ReactNode>> = {
  profile:                    <User          className="h-4 w-4" />,
  ship:                       <Rocket        className="h-4 w-4" />,
  operation:                  <Target        className="h-4 w-4" />,
  operation_important:        <Shield        className="h-4 w-4" />,
  first_event:                <CalendarDays  className="h-4 w-4" />,
  discord_joined:             <MessageSquare className="h-4 w-4" />,
  consacre_events_5:          <CalendarDays  className="h-4 w-4" />,
  consacre_op_5:              <Target        className="h-4 w-4" />,
  consacre_logistics:         <Package       className="h-4 w-4" />,
  consacre_resource:          <BookOpen      className="h-4 w-4" />,
  consacre_recruitment:       <Users         className="h-4 w-4" />,
  gardien_op_lead:            <Star          className="h-4 w-4" />,
  gardien_events_10:          <CalendarDays  className="h-4 w-4" />,
  gardien_logistics:          <Package       className="h-4 w-4" />,
  gardien_resource:           <BookOpen      className="h-4 w-4" />,
  gardien_recruitment:        <Users         className="h-4 w-4" />,
  inquisiteur_op_lead_3:      <Star          className="h-4 w-4" />,
  inquisiteur_event_organize: <CalendarDays  className="h-4 w-4" />,
  inquisiteur_training:       <Users         className="h-4 w-4" />,
  inquisiteur_events_25:      <CalendarDays  className="h-4 w-4" />,
  inquisiteur_partnership:    <Award         className="h-4 w-4" />,
}

type Props = {
  config: RankOnboardingConfig
  completedSteps: string[]
  stepsDone: Record<string, boolean>
}

export function OnboardingChecklist({ config, completedSteps, stepsDone }: Props) {
  const router = useRouter()
  const [claimingStep, setClaimingStep] = useState<ExtendedOnboardingStep | null>(null)

  const doneCount  = config.steps.filter(s => stepsDone[s.key]).length
  const allDone    = doneCount === config.steps.length
  const allClaimed = config.steps.every(s => completedSteps.includes(s.key))

  const hasClaimedRef = useRef(false)

  useEffect(() => {
    if (hasClaimedRef.current) return
    const unclaimed = config.steps.filter(s => !s.manual && stepsDone[s.key] && !completedSteps.includes(s.key))
    if (unclaimed.length === 0) return

    hasClaimedRef.current = true
    ;(async () => {
      for (const s of unclaimed) await claimOnboardingStep(s.key)
      router.refresh()
    })()
  }, [config.steps, stepsDone, completedSteps, router])

  if (allDone && allClaimed) return null

  async function handleManualClaim(stepKey: ExtendedOnboardingStep) {
    setClaimingStep(stepKey)
    await claimOnboardingStep(stepKey)
    router.refresh()
    setClaimingStep(null)
  }

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
          const icon = STEP_ICONS[s.key]
          return (
            <li key={s.key} className="flex items-center gap-3">
              {done ? (
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground/40 shrink-0" />
              )}
              {icon && (
                <span className={done ? 'text-muted-foreground/40' : 'text-muted-foreground'}>
                  {icon}
                </span>
              )}
              {done ? (
                <span className="text-sm line-through text-muted-foreground flex-1">{s.label}</span>
              ) : s.manual ? (
                <span className="flex-1 flex items-center gap-2">
                  <span className="text-sm text-foreground">{s.label}</span>
                  <button
                    onClick={() => handleManualClaim(s.key)}
                    disabled={claimingStep === s.key}
                    className="text-xs text-primary border border-primary/30 rounded px-2 py-0.5 hover:bg-primary/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                  >
                    {claimingStep === s.key ? '…' : 'Réclamer'}
                  </button>
                </span>
              ) : (
                <a href={s.href} className="text-sm text-foreground hover:text-primary hover:underline transition-colors flex-1">
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
