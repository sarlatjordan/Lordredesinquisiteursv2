'use client'

import { motion } from 'framer-motion'
import { ShieldOff, MessageSquare } from 'lucide-react'

const REDACTED_LINES = [
  { w: 'w-4/5',  opacity: 1 },
  { w: 'w-3/5',  opacity: 0.7 },
  { w: 'w-full', opacity: 1 },
  { w: 'w-2/3',  opacity: 0.6 },
  { w: 'w-5/6',  opacity: 0.9 },
  { w: 'w-1/2',  opacity: 0.7 },
  { w: 'w-full', opacity: 1 },
  { w: 'w-3/4',  opacity: 0.8 },
]

function RedactedBar({ w, opacity, delay }: { w: string; opacity: number; delay: number }) {
  return (
    <motion.div
      className={`h-3 rounded-sm bg-foreground/80 ${w}`}
      style={{ opacity }}
      animate={{ opacity: [opacity, opacity * 0.4, opacity] }}
      transition={{ duration: 3.5, delay, repeat: Infinity, ease: 'easeInOut' }}
    />
  )
}

export function RedactedContent() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center min-h-[60vh] py-12 px-4"
    >
      <div className="w-full max-w-lg space-y-8">
        {/* Header classifié */}
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-destructive/30 bg-destructive/10">
            <ShieldOff className="h-8 w-8 text-destructive" />
          </div>
          <div>
            <p className="text-[11px] font-bold tracking-[0.4em] text-destructive/70 uppercase mb-1">
              Niveau d&apos;habilitation insuffisant
            </p>
            <h2 className="text-2xl font-black text-foreground tracking-tight">
              Contenu classifié
            </h2>
          </div>
        </div>

        {/* Faux document redacted */}
        <div className="rounded-xl border border-border bg-card/50 p-6 space-y-6 relative overflow-hidden">
          {/* Tampon CLASSIFIÉ */}
          <div className="absolute top-4 right-4 rotate-[-15deg]">
            <div className="border-2 border-destructive/40 rounded px-2 py-0.5">
              <p className="text-[10px] font-black tracking-[0.3em] text-destructive/50 uppercase">
                Classifié
              </p>
            </div>
          </div>

          {/* Lignes redacted bloc 1 */}
          <div className="space-y-2.5">
            {REDACTED_LINES.slice(0, 4).map((line, i) => (
              <RedactedBar key={i} w={line.w} opacity={line.opacity} delay={i * 0.3} />
            ))}
          </div>

          {/* Séparateur */}
          <div className="h-px bg-border" />

          {/* Lignes redacted bloc 2 */}
          <div className="space-y-2.5">
            {REDACTED_LINES.slice(4).map((line, i) => (
              <RedactedBar key={i} w={line.w} opacity={line.opacity} delay={1.5 + i * 0.3} />
            ))}
          </div>
        </div>

        {/* Message */}
        <div className="rounded-xl border border-border bg-card/50 p-5 space-y-4 text-center">
          <div className="space-y-1.5">
            <p className="text-sm font-medium text-foreground">
              Votre compte est en cours d&apos;activation par le Haut Conseil.
            </p>
            <p className="text-xs text-muted-foreground">
              Votre rang actuel — <span className="text-foreground font-medium">Visiteur</span> — ne donne pas encore accès au Quartier Général.
              Un Sage doit valider votre profil avant que vous puissiez rejoindre les rangs de l&apos;Ordre.
            </p>
          </div>

          {process.env.NEXT_PUBLIC_DISCORD_INVITE_URL && (
            <a
              href={process.env.NEXT_PUBLIC_DISCORD_INVITE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#5865F2]/10 border border-[#5865F2]/30 text-[#5865F2] text-sm font-medium hover:bg-[#5865F2]/20 transition-colors"
            >
              <MessageSquare className="h-4 w-4" />
              Rejoindre le serveur Discord
            </a>
          )}
        </div>
      </div>
    </motion.div>
  )
}
