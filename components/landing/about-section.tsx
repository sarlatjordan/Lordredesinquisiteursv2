'use client'

import { motion } from 'framer-motion'
import { Shield, Pickaxe, Skull } from 'lucide-react'

const sectors = [
  {
    icon: <Shield className="h-6 w-6" />,
    badge: 'Primaire',
    title: 'Sécurité',
    description:
      'Protection des civils, opérations anti-terroristes et combat contre les Vanduuls. Le cœur de la mission des Inquisiteurs — maintenir la paix dans les zones hostiles de l\'UEE.',
    color: 'text-amber-400',
    bg: 'bg-amber-400/10 border-amber-400/20',
    badgeClass: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
  },
  {
    icon: <Pickaxe className="h-6 w-6" />,
    badge: 'Secondaire',
    title: 'Économie & Logistique',
    description:
      'Minage, recyclage, transport, construction et logistique. Ces activités financent la construction du temple de l\'Ordre, l\'achat de nouveaux vaisseaux et l\'établissement d\'avant-postes.',
    color: 'text-cyan-400',
    bg: 'bg-cyan-400/10 border-cyan-400/20',
    badgeClass: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/30',
  },
  {
    icon: <Skull className="h-6 w-6" />,
    badge: 'Tertiaire',
    title: 'Activités Spéciales',
    description:
      'Missions d\'infiltration, contrebande et opérations sous couverture. L\'Ordre maintient une branche discrète pour des missions nécessitant une approche... moins orthodoxe.',
    color: 'text-purple-400',
    bg: 'bg-purple-400/10 border-purple-400/20',
    badgeClass: 'text-purple-400 bg-purple-400/10 border-purple-400/30',
  },
]

export function AboutSection() {
  return (
    <section id="about" className="py-24 px-6 bg-card/20">
      <div className="max-w-5xl mx-auto">
        {/* En-tête */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p className="text-xs font-semibold tracking-[0.25em] text-primary/70 uppercase mb-3">
            Manifeste
          </p>
          <h2 className="text-3xl sm:text-4xl font-black text-foreground">
            Notre mission
          </h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            L&apos;Ordre a été fondé dans le seul but de maintenir la paix dans la galaxie.
            Chaque membre développe ses compétences à travers l&apos;industrie, la sécurité
            et l&apos;infiltration — dans une atmosphère détendue et fraternelle.
          </p>
        </motion.div>

        {/* Secteurs */}
        <div className="grid gap-6 sm:grid-cols-3">
          {sectors.map((sector, i) => (
            <motion.div
              key={sector.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ delay: i * 0.12, duration: 0.55 }}
              className="rounded-xl border border-border bg-card p-6 space-y-4 hover:border-primary/20 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl border ${sector.bg} ${sector.color}`}>
                  {sector.icon}
                </div>
                <span className={`text-[10px] font-semibold tracking-widest uppercase px-2 py-1 rounded-full border ${sector.badgeClass}`}>
                  {sector.badge}
                </span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">{sector.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {sector.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Objectifs */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="mt-12 rounded-xl border border-border bg-card p-6 sm:p-8"
        >
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-5">
            Objectifs de l&apos;Ordre
          </h3>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { label: 'Maintenir la paix', desc: 'Combattre terroristes et Vanduuls pour protéger les civils de l\'UEE.' },
              { label: 'Établir des alliances', desc: 'Tisser des partenariats avec des organisations de confiance partageant nos valeurs.' },
              { label: 'Construire le Temple', desc: 'Établir un QG permanent — ravitaillement, repos et sanctuaire pour tous les membres.' },
            ].map((obj, i) => (
              <div key={obj.label} className="flex gap-3">
                <div className="mt-1 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-foreground">{obj.label}</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{obj.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Citation */}
        <motion.blockquote
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ delay: 0.3, duration: 0.7 }}
          className="mt-16 text-center"
        >
          <p className="text-xl sm:text-2xl font-medium text-foreground/80 italic leading-relaxed max-w-3xl mx-auto">
            &ldquo;Fondé dans le seul but de maintenir la paix dans la galaxie.&rdquo;
          </p>
          <footer className="mt-3 text-sm text-muted-foreground/60 tracking-widest uppercase">
            — Manifeste de l&apos;Ordre des Inquisiteurs
          </footer>
        </motion.blockquote>
      </div>
    </section>
  )
}
