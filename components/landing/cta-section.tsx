'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Shield, ChevronRight } from 'lucide-react'

const requirements = [
  'Rejoindre exclusivement l\'Ordre (organisation exclusive)',
  'Avoir un microphone — la participation vocale sur Discord est obligatoire',
  'Vouloir maîtriser les différents gameplays du jeu',
  'Respecter la charte et les décisions du Haut Conseil',
  'Faire passer la vraie vie avant le jeu',
]

const ranks = [
  { name: 'Aspirant', desc: 'Nouveaux membres découvrant le jeu' },
  { name: 'Consacré', desc: 'Post-apprentissage, en route vers Gardien' },
  { name: 'Gardien', desc: 'Pratique de tous les gameplays par l\'expérience' },
  { name: 'Inquisiteur', desc: 'Choisit sa voie : civile, militaire ou spéciale' },
  { name: 'Maître Inquisiteur', desc: 'Dirige des missions et forme les apprentis' },
  { name: 'Sage', desc: 'Fondateurs, représentants du Haut Conseil' },
]

export function CtaSection() {
  return (
    <section id="recrutement" className="py-24 px-6">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Rangs de l'Ordre */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <p className="text-xs font-semibold tracking-[0.25em] text-primary/70 uppercase mb-3">
            Structure
          </p>
          <h2 className="text-3xl sm:text-4xl font-black text-foreground">
            Les rangs de l&apos;Ordre
          </h2>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
            Chaque rang se mérite par l&apos;action et l&apos;implication. Le Haut Conseil
            organise les évaluations et valide les avancements.
          </p>
        </motion.div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ranks.map((rank, i) => (
            <motion.div
              key={rank.name}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-30px' }}
              transition={{ delay: i * 0.07, duration: 0.45 }}
              className="flex items-start gap-3 rounded-lg border border-border bg-card p-4"
            >
              <div
                className="mt-0.5 w-2 h-2 rounded-full shrink-0 bg-primary"
                style={{ opacity: 0.3 + (i / ranks.length) * 0.7 }}
              />
              <div>
                <p className="text-sm font-semibold text-foreground">{rank.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{rank.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA bloc */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="relative rounded-2xl border border-primary/20 bg-card overflow-hidden"
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(245,158,11,0.06),transparent_70%)]" />
          <div className="relative p-10 sm:p-12">
            <div className="sm:flex items-start gap-10">
              <div className="flex-1 space-y-4">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 border border-primary/30">
                  <Shield className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-semibold tracking-[0.25em] text-primary/70 uppercase mb-2">
                    Recrutement ouvert
                  </p>
                  <h3 className="text-2xl font-black text-foreground">
                    Rejoignez l&apos;Ordre des Inquisiteurs
                  </h3>
                  <p className="mt-3 text-muted-foreground text-sm leading-relaxed max-w-lg">
                    L&apos;Ordre recrute des pilotes motivés, prêts à s&apos;investir dans une
                    communauté soudée. On ne cherche pas des experts — on cherche des personnes
                    qui veulent progresser ensemble, explorer l&apos;univers et défendre la paix.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3 pt-2">
                  <Button asChild size="lg" className="shadow-[0_0_24px_rgba(245,158,11,0.2)]">
                    <Link href="/recrutement">Soumettre ma candidature</Link>
                  </Button>
                  <Button asChild variant="outline" size="lg">
                    <a
                      href="https://robertsspaceindustries.com/en/orgs/INQFR"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Page RSI de l&apos;Org
                    </a>
                  </Button>
                </div>
              </div>

              {/* Prérequis */}
              <div className="mt-8 sm:mt-0 sm:w-72 shrink-0">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">
                  Conditions d&apos;entrée
                </p>
                <ul className="space-y-2.5">
                  {requirements.map((req, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <ChevronRight className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      {req}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
