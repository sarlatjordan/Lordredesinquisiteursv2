'use client'

import { motion } from 'framer-motion'
import { FileText, Shield, Star } from 'lucide-react'

const STEPS = [
  {
    icon: FileText,
    number: '01',
    title: 'Soumission',
    description:
      'Remplissez le formulaire de candidature avec votre handle RSI, votre pseudo Discord et un message de motivation sincère.',
  },
  {
    icon: Shield,
    number: '02',
    title: 'Évaluation',
    description:
      'Le Haut Conseil examine votre dossier. Un entretien vocal sur Discord peut être organisé pour mieux vous connaître.',
  },
  {
    icon: Star,
    number: '03',
    title: 'Intégration',
    description:
      'Si votre candidature est acceptée, vous recevez un lien de connexion et accédez à l\'application interne avec le rang Aspirant.',
  },
]

export function ProcessSteps() {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {STEPS.map((step, i) => {
        const Icon = step.icon
        return (
          <motion.div
            key={step.number}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ delay: i * 0.1, duration: 0.5 }}
            className="relative rounded-xl border border-border bg-card p-6 overflow-hidden"
          >
            <div className="absolute top-3 right-4 text-4xl font-black text-muted-foreground/10 select-none">
              {step.number}
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 border border-primary/30 mb-4">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-bold text-foreground mb-2">{step.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
          </motion.div>
        )
      })}
    </div>
  )
}
