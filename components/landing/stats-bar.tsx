'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { Users, Rocket, Swords } from 'lucide-react'
import { approxCount } from '@/lib/utils'

interface StatsBarProps {
  memberCount: number
  shipCount: number
  opCount: number
}

function Counter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [value, setValue] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  useEffect(() => {
    if (!inView) return
    const duration = 1400
    const steps = 50
    const increment = target / steps
    let current = 0
    const timer = setInterval(() => {
      current = Math.min(current + increment, target)
      setValue(Math.round(current))
      if (current >= target) clearInterval(timer)
    }, duration / steps)
    return () => clearInterval(timer)
  }, [inView, target])

  return (
    <span ref={ref}>
      {value}{suffix}
    </span>
  )
}

export function StatsBar({ memberCount, shipCount, opCount }: StatsBarProps) {
  const ships = approxCount(shipCount)
  const ops = approxCount(opCount)

  const stats = [
    { icon: <Users className="h-5 w-5" />, value: memberCount, label: 'Membres actifs', suffix: '' },
    { icon: <Rocket className="h-5 w-5" />, value: ships.value, label: 'Vaisseaux en flotte', suffix: ships.suffix },
    { icon: <Swords className="h-5 w-5" />, value: ops.value, label: 'Opérations menées', suffix: ops.suffix },
  ]

  return (
    <section className="relative border-y border-border bg-card/50">
      <div className="max-w-5xl mx-auto px-6 py-10 grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-0 sm:divide-x divide-border">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ delay: i * 0.1, duration: 0.5 }}
            className="flex flex-col items-center gap-2 px-8"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 border border-primary/20 text-primary">
              {stat.icon}
            </div>
            <p className="text-3xl font-black text-foreground tabular-nums">
              <Counter target={stat.value} suffix={stat.suffix} />
            </p>
            <p className="text-sm text-muted-foreground text-center">{stat.label}</p>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
