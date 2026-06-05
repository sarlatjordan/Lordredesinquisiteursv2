'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Landmark, ArrowRight } from 'lucide-react'

interface GuildBankCardProps {
  balance: number
  index?: number
}

export function GuildBankCard({ balance, index = 4 }: GuildBankCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.06 }}
    >
      <Link
        href="/logistique"
        className="group relative flex items-center gap-4 rounded-lg border border-primary/20 bg-primary/5 p-4 overflow-hidden transition-colors hover:border-primary/40 hover:bg-primary/8"
      >
        {/* Glow au survol */}
        <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
        </div>

        {/* Icône */}
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
          <Landmark className="h-5 w-5" />
        </div>

        {/* Solde */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Trésorerie de l&apos;Ordre
          </p>
          <p className="text-2xl font-bold text-primary tabular-nums mt-0.5">
            {balance.toLocaleString('fr-FR')}
            <span className="text-sm font-semibold text-primary/70 ml-1.5">UEC</span>
          </p>
        </div>

        {/* Flèche */}
        <ArrowRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary/60 group-hover:translate-x-0.5 transition-all shrink-0" />
      </Link>
    </motion.div>
  )
}
