'use client'

import { motion } from 'framer-motion'
import { ROLES, ROLE_COLORS, type Role } from '@/lib/constants'

const RANK_DESCRIPTIONS: Record<Role, string> = {
  visiteur:           'Accès limité à l\'application — non jouable',
  aspirant:           'Nouveaux membres découvrant le jeu et la communauté',
  consacre:           'Post-apprentissage, en route vers le rang Gardien',
  gardien:            'Pratique confirmée de tous les gameplays',
  inquisiteur:        'Choisit sa voie : civile, militaire ou spéciale',
  maitre_inquisiteur: 'Dirige des missions et forme les Aspirants',
  sage:               'Fondateurs, membres du Haut Conseil',
}

const PLAYABLE_ROLES: Role[] = [
  'aspirant',
  'consacre',
  'gardien',
  'inquisiteur',
  'maitre_inquisiteur',
  'sage',
]

export function RanksGrid() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {PLAYABLE_ROLES.map((role, i) => {
        const colorClass = ROLE_COLORS[role]
        const isEntry = role === 'aspirant'

        return (
          <motion.div
            key={role}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-30px' }}
            transition={{ delay: i * 0.07, duration: 0.45 }}
            className={`relative rounded-xl border p-4 transition-colors ${
              isEntry ? 'border-primary/30 bg-primary/5' : 'border-border bg-card'
            }`}
          >
            {isEntry && (
              <span className="absolute top-3 right-3 text-[10px] font-bold uppercase tracking-widest text-primary bg-primary/10 border border-primary/30 px-2 py-0.5 rounded-full">
                Entrée
              </span>
            )}
            <div className="flex items-center gap-3 mb-2">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${colorClass}`}>
                {ROLES[role]}
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {RANK_DESCRIPTIONS[role]}
            </p>
          </motion.div>
        )
      })}
    </div>
  )
}
