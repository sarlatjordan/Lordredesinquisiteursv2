'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { ChevronDown, Shield } from 'lucide-react'

interface HeroProps {
  isLoggedIn: boolean
}

export function Hero({ isLoggedIn }: HeroProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animFrame: number

    const resize = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const stars = Array.from({ length: 220 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.4 + 0.2,
      alpha: Math.random() * 0.7 + 0.15,
      speed: Math.random() * 0.25 + 0.05,
      twinkleOffset: Math.random() * Math.PI * 2,
    }))

    let t = 0
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      t += 0.012
      for (const s of stars) {
        const a = s.alpha * (0.6 + 0.4 * Math.sin(t * s.speed + s.twinkleOffset))
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,255,255,${a})`
        ctx.fill()
      }
      animFrame = requestAnimationFrame(draw)
    }
    draw()

    return () => {
      cancelAnimationFrame(animFrame)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(245,158,11,0.08),transparent_70%)]" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="mb-8"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 border border-primary/30 shadow-[0_0_40px_rgba(245,158,11,0.15)]">
            <Shield className="h-10 w-10 text-primary" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.7 }}
        >
          <p className="text-xs font-semibold tracking-[0.3em] text-primary/70 uppercase mb-3">
            Organisation Star Citizen — UEE
          </p>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-foreground tracking-tight leading-none">
            L&apos;Ordre des
            <br />
            <span className="text-primary">Inquisiteurs</span>
          </h1>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.7 }}
          className="mt-6 text-lg text-muted-foreground max-w-2xl"
        >
          Fondé pour maintenir la paix dans la galaxie. Sécurité, justice et honneur
          au service des civils de l&apos;UEE — depuis les cendres de la bataille de VEGA II.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="mt-10 flex flex-wrap gap-4 justify-center"
        >
          {isLoggedIn ? (
            <Button asChild size="lg" className="px-8 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
              <Link href="/dashboard">Accéder au QG</Link>
            </Button>
          ) : (
            <>
              <Button asChild size="lg" className="px-8 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                <Link href="/recrutement">Rejoindre l&apos;Ordre</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="px-8">
                <Link href="/login">Se connecter</Link>
              </Button>
            </>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="mt-8 flex items-center gap-4 text-xs text-muted-foreground/50 tracking-widest uppercase"
        >
          <span>INQFR</span>
          <span className="w-px h-3 bg-muted-foreground/30" />
          <span>Foi · Roleplay · Social</span>
          <span className="w-px h-3 bg-muted-foreground/30" />
          <span>35 membres</span>
        </motion.div>
      </div>

      <motion.a
        href="#histoire"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-muted-foreground/40 hover:text-muted-foreground transition-colors"
        aria-label="Défiler"
      >
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
        >
          <ChevronDown className="h-6 w-6" />
        </motion.div>
      </motion.a>
    </section>
  )
}
