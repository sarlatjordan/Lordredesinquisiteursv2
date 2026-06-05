import type { Metadata } from 'next'
import { Users, Rocket, Swords, TrendingUp } from 'lucide-react'
import { PublicNav } from '@/components/landing/public-nav'
import { LandingFooter } from '@/components/landing/landing-footer'
import { getPublicStats } from '@/lib/public-stats'
import { approxCount } from '@/lib/utils'

export const revalidate = 3600

export const metadata: Metadata = {
  title: "Statistiques — L'Ordre des Inquisiteurs",
  description:
    "Chiffres clés de l'Ordre des Inquisiteurs : membres, flotte, opérations et présence dans le 'verse.",
}

function StatCard({
  icon,
  value,
  suffix,
  label,
  description,
}: {
  icon: React.ReactNode
  value: number
  suffix: string
  label: string
  description: string
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 border border-primary/20 text-primary shrink-0">
          {icon}
        </div>
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
      </div>
      <p className="text-5xl font-black text-foreground tabular-nums tracking-tight">
        {(value ?? 0).toLocaleString('fr-FR')}{suffix}
      </p>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  )
}

export default async function StatsPage() {
  const stats = await getPublicStats()

  const ships = approxCount(stats.shipCount)
  const opsCompleted = approxCount(stats.opCompletedCount)
  const opsMonth = approxCount(stats.opThisMonthCount)

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PublicNav isLoggedIn={false} />

      <main className="pt-24 pb-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="mb-12 space-y-3">
            <p className="text-xs font-semibold text-primary uppercase tracking-widest">Données publiques</p>
            <h1 className="text-4xl font-black text-foreground">L&apos;Ordre en chiffres</h1>
            <p className="text-muted-foreground max-w-xl">
              Métriques anonymisées de l&apos;Ordre des Inquisiteurs. Mises à jour toutes les heures.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 mb-12">
            <StatCard
              icon={<Users className="h-5 w-5" />}
              value={stats.memberCount}
              suffix=""
              label="Membres actifs"
              description="Inquisiteurs engagés dans le verse, de l'Aspirant au Sage."
            />
            <StatCard
              icon={<Rocket className="h-5 w-5" />}
              value={ships.value}
              suffix={ships.suffix}
              label="Vaisseaux en flotte"
              description="Appareils enregistrés au sein de l'Ordre, tous rôles confondus."
            />
            <StatCard
              icon={<Swords className="h-5 w-5" />}
              value={opsCompleted.value}
              suffix={opsCompleted.suffix}
              label="Opérations terminées"
              description="Missions planifiées et exécutées depuis la création de l'Ordre."
            />
            <StatCard
              icon={<TrendingUp className="h-5 w-5" />}
              value={opsMonth.value}
              suffix={opsMonth.suffix}
              label="Opérations ce mois"
              description="Missions lancées au cours du mois en cours — activité opérationnelle en temps réel."
            />
          </div>

          <div className="rounded-xl border border-primary/20 bg-primary/5 p-8 text-center space-y-4">
            <p className="text-lg font-semibold text-foreground">Rejoindre l&apos;Ordre</p>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              L&apos;Ordre des Inquisiteurs recrute des pilotes, tacticiens et logisticiens engagés.
              Le recrutement est ouvert aux candidats sérieux.
            </p>
            <a
              href="/recrutement"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Déposer une candidature
            </a>
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  )
}
