'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { ExternalLink, Users } from 'lucide-react'

const GUILD_ID = process.env.NEXT_PUBLIC_DISCORD_GUILD_ID
const INVITE_URL = process.env.NEXT_PUBLIC_DISCORD_INVITE_URL ?? '#'

function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.03.056a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  )
}

export function DiscordSection() {
  return (
    <section id="discord" className="py-24 px-6 bg-card/20">
      <div className="max-w-5xl mx-auto">
        <div className="rounded-2xl border border-[#5865F2]/20 bg-[#5865F2]/5 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_30%_50%,rgba(88,101,242,0.08),transparent_70%)] pointer-events-none" />

          <div className="relative flex flex-col lg:flex-row gap-0">
            {/* Texte gauche */}
            <motion.div
              initial={{ opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6 }}
              className="flex-1 p-8 sm:p-12 space-y-6"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#5865F2]/20 border border-[#5865F2]/30">
                  <DiscordIcon className="h-7 w-7 text-[#5865F2]" />
                </div>
                <div>
                  <p className="text-xs font-semibold tracking-[0.25em] text-[#5865F2]/80 uppercase">
                    Communauté
                  </p>
                  <h2 className="text-2xl font-black text-foreground">
                    Notre Discord
                  </h2>
                </div>
              </div>

              <p className="text-muted-foreground leading-relaxed max-w-lg">
                Toute la vie de l&apos;Ordre se passe sur Discord — coordination des opérations,
                briefings tactiques, sessions de jeu spontanées et discussions entre membres.
                C&apos;est l&apos;outil central de l&apos;organisation.
              </p>

              <ul className="space-y-2 text-sm text-muted-foreground">
                {[
                  'Canaux de coordination par gameplay (combat, minage, transport…)',
                  'Briefings avant chaque opération',
                  'Bots d\'information sur Star Citizen',
                  'Ambiance détendue — on est là pour s\'amuser',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#5865F2] shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>

              <div className="flex flex-wrap gap-3 pt-2">
                <Button
                  asChild
                  size="lg"
                  className="bg-[#5865F2] hover:bg-[#4752C4] text-white shadow-[0_0_24px_rgba(88,101,242,0.25)]"
                >
                  <a href={INVITE_URL} target="_blank" rel="noopener noreferrer">
                    <DiscordIcon className="h-5 w-5 mr-2" />
                    Rejoindre le Discord
                    <ExternalLink className="h-3.5 w-3.5 ml-2 opacity-70" />
                  </a>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <a
                    href="https://robertsspaceindustries.com/en/orgs/INQFR"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Page RSI
                  </a>
                </Button>
              </div>

              <p className="text-xs text-muted-foreground/60 flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" />
                Un microphone est requis pour participer aux opérations
              </p>
            </motion.div>

            {/* Widget Discord (si guild ID configuré) */}
            {GUILD_ID && (
              <motion.div
                initial={{ opacity: 0, x: 16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ delay: 0.15, duration: 0.6 }}
                className="lg:w-[360px] shrink-0 border-t lg:border-t-0 lg:border-l border-[#5865F2]/20"
              >
                <iframe
                  src={`https://discord.com/widget?id=${GUILD_ID}&theme=dark`}
                  width="100%"
                  height="100%"
                  style={{ minHeight: '340px', border: 'none' }}
                  sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"
                  title="Widget Discord INQFR"
                />
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
