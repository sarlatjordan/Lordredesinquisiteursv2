'use client'

import { motion } from 'framer-motion'
import { type ReactNode } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface StatsCardProps {
  title: string
  value: string | number
  icon: ReactNode
  description?: string
  trend?: { value: number; label: string }
  variant?: 'default' | 'cyan' | 'amber' | 'green' | 'red'
  index?: number
  href?: string
}

const variantStyles = {
  default: { icon: 'text-muted-foreground bg-muted',         value: 'text-foreground' },
  cyan:    { icon: 'text-primary bg-primary/10',              value: 'text-primary' },
  amber:   { icon: 'text-amber-400 bg-amber-400/10',          value: 'text-amber-400' },
  green:   { icon: 'text-green-400 bg-green-400/10',          value: 'text-green-400' },
  red:     { icon: 'text-destructive bg-destructive/10',      value: 'text-destructive' },
} as const

export function StatsCard({
  title,
  value,
  icon,
  description,
  trend,
  variant = 'default',
  index = 0,
  href,
}: StatsCardProps) {
  const styles = variantStyles[variant]

  const inner = (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.06 }}
      className={cn(
        'relative rounded-lg border border-border bg-card p-5 overflow-hidden group transition-colors',
        href ? 'hover:border-primary/30 hover:bg-card/80' : 'hover:border-primary/20',
      )}
    >
      {/* Glow subtil au survol */}
      <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      </div>

      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider truncate">
            {title}
          </p>
          <p className={cn('text-2xl font-bold mt-1 tabular-nums', styles.value)}>
            {value}
          </p>
          {description && (
            <p className="text-xs text-muted-foreground mt-1 truncate">
              {href ? <span className="group-hover:text-primary/70 transition-colors">{description}</span> : description}
            </p>
          )}
          {trend && (
            <p className={cn('text-xs mt-2 font-medium', trend.value >= 0 ? 'text-green-400' : 'text-destructive')}>
              {trend.value >= 0 ? '+' : ''}{trend.value} {trend.label}
            </p>
          )}
        </div>
        <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg shrink-0', styles.icon)}>
          {icon}
        </div>
      </div>
    </motion.div>
  )

  if (href) {
    return <Link href={href} className="block">{inner}</Link>
  }

  return inner
}
