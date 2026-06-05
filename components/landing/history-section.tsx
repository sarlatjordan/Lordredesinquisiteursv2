'use client'

import { motion } from 'framer-motion'
import { Flame, Eye, Skull, RefreshCw } from 'lucide-react'

const chapters = [
  {
    icon: <Flame className="h-5 w-5" />,
    era: 'XXVIIIe siècle',
    title: 'Lumière naissante dans le chaos stellaire',
    content:
      "Dans un univers où l'UEE affronte pirates, bandits et Vanduuls, un groupe de vétérans fonde un ordre pour protéger les civils et restaurer l'ordre. Sous le commandement d'Aric Sloan, les Inquisiteurs démantèlent le cartel des Black Walkers et deviennent des symboles de justice à travers la galaxie.",
    color: 'text-amber-400',
    border: 'border-amber-400/20',
    bg: 'bg-amber-400/5',
  },
  {
    icon: <Eye className="h-5 w-5" />,
    era: '2900',
    title: 'Réveil dans une ère d\'ombre',
    content:
      "Face aux nouvelles menaces Vanduuls, Banu et Xi'An, le Haut Conseil lance une purification de l'Ordre — éliminant les membres corrompus. Les Inquisiteurs se lancent dans une quête périlleuse à travers des systèmes inexplorés à la poursuite d'une technologie alien capable de plier la réalité.",
    color: 'text-cyan-400',
    border: 'border-cyan-400/20',
    bg: 'bg-cyan-400/5',
  },
  {
    icon: <Skull className="h-5 w-5" />,
    era: '2945',
    title: 'Les Cendres de l\'Ordre',
    content:
      "La bataille de VEGA II dévaste l'Ordre. Aux côtés des forces de l'UEE, les Inquisiteurs se sacrifient vague après vague pour évacuer les civils face aux Vanduuls. Leurs vaisseaux deviennent des épaves en flammes. Le Haut Conseil disparaît presque entièrement — l'Ordre n'est plus qu'une légende.",
    color: 'text-red-400',
    border: 'border-red-400/20',
    bg: 'bg-red-400/5',
  },
  {
    icon: <RefreshCw className="h-5 w-5" />,
    era: 'Après VEGA II',
    title: 'Le Renouveau : L\'Ordre Ressuscité',
    content:
      "Des vétérans et des sympathisants reforment l'Ordre, fusionnant les traditions ancestrales et les tactiques modernes. Plus discrets mais plus redoutables, les Inquisiteurs renaissent pour défendre les civils en territoire hostile et traquer les menaces à la paix de l'UEE.",
    color: 'text-green-400',
    border: 'border-green-400/20',
    bg: 'bg-green-400/5',
  },
]

export function HistorySection() {
  return (
    <section id="histoire" className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p className="text-xs font-semibold tracking-[0.25em] text-primary/70 uppercase mb-3">
            Histoire
          </p>
          <h2 className="text-3xl sm:text-4xl font-black text-foreground">
            Chroniques de l&apos;Ordre
          </h2>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
            De sa fondation dans les ténèbres de la galaxie jusqu&apos;à son renouveau après VEGA II —
            l&apos;histoire des Inquisiteurs est écrite dans le sang et la lumière.
          </p>
        </motion.div>

        {/* Timeline */}
        <div className="relative">
          {/* Ligne verticale */}
          <div className="absolute left-6 sm:left-1/2 top-0 bottom-0 w-px bg-border -translate-x-1/2 hidden sm:block" />

          <div className="space-y-10">
            {chapters.map((chapter, i) => (
              <motion.div
                key={chapter.title}
                initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ delay: 0.1, duration: 0.55 }}
                className={`relative sm:grid sm:grid-cols-2 sm:gap-10 ${i % 2 === 0 ? '' : 'sm:[&>div:first-child]:order-2'}`}
              >
                {/* Dot sur la timeline */}
                <div className={`absolute left-1/2 top-6 -translate-x-1/2 hidden sm:flex items-center justify-center w-5 h-5 rounded-full border-2 border-background z-10 ${chapter.bg} ${chapter.border} border`}>
                  <div className={`w-2 h-2 rounded-full ${chapter.color.replace('text-', 'bg-')}`} />
                </div>

                {/* Carte */}
                <div className={`${i % 2 === 0 ? 'sm:text-right sm:pr-10' : 'sm:col-start-2 sm:pl-10'}`}>
                  <div className={`rounded-xl border ${chapter.border} ${chapter.bg} p-5 sm:p-6 space-y-3`}>
                    <div className={`flex items-center gap-2 ${i % 2 === 0 ? 'sm:justify-end' : ''}`}>
                      <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-background/50 border ${chapter.border} ${chapter.color}`}>
                        {chapter.icon}
                      </div>
                      <span className={`text-xs font-mono tracking-widest ${chapter.color} uppercase`}>
                        {chapter.era}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-foreground">{chapter.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{chapter.content}</p>
                  </div>
                </div>

                {/* Espace vide de l'autre côté */}
                <div />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
