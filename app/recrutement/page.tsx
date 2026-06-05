import type { Metadata } from 'next'
import { PublicNav } from '@/components/landing/public-nav'
import { LandingFooter } from '@/components/landing/landing-footer'
import { RecrutementForm } from './recrutement-form'
import { RanksGrid } from './ranks-grid'
import { ProcessSteps } from './process-steps'
import { getOrgSettings } from '@/actions/org-settings'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Recrutement',
  description:
    "Rejoignez L'Ordre des Inquisiteurs — organisation Star Citizen d'élite. Soumettez votre candidature et participez à nos opérations dans l'Alpha Quadrant.",
}

export default async function RecrutementPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const settings = await getOrgSettings()
  const recruitmentOpen = settings?.recruitment_open ?? true

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PublicNav isLoggedIn={!!user} />

      <main className="pt-24">
        {/* Hero */}
        <section className="relative px-6 py-16 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,rgba(245,158,11,0.07),transparent_70%)]" />
          <div className="relative max-w-3xl mx-auto text-center space-y-4">
            <p className={`text-xs font-semibold tracking-[0.3em] uppercase ${recruitmentOpen ? 'text-green-400' : 'text-destructive'}`}>
              {recruitmentOpen ? 'Recrutement ouvert' : 'Recrutement fermé'}
            </p>
            <h1 className="text-4xl sm:text-5xl font-black text-foreground leading-tight">
              Rejoindre l&apos;Ordre des<br />
              <span className="text-primary">Inquisiteurs</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Une organisation exclusive, soudée, axée sur la maîtrise de tous les gameplays.
              On ne cherche pas des experts — on cherche des personnes prêtes à progresser ensemble.
            </p>
          </div>
        </section>

        {/* Processus d'intégration */}
        <section className="px-6 py-12 max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold tracking-[0.25em] text-primary/70 uppercase mb-3">
              Comment ça marche
            </p>
            <h2 className="text-2xl sm:text-3xl font-black text-foreground">
              Le processus d&apos;intégration
            </h2>
          </div>
          <ProcessSteps />
        </section>

        {/* Les rangs */}
        <section className="px-6 py-12 bg-card/30 border-y border-border">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-10">
              <p className="text-xs font-semibold tracking-[0.25em] text-primary/70 uppercase mb-3">
                Structure de l&apos;Ordre
              </p>
              <h2 className="text-2xl sm:text-3xl font-black text-foreground">
                Les rangs de l&apos;Ordre
              </h2>
              <p className="mt-3 text-muted-foreground max-w-lg mx-auto text-sm">
                Chaque rang se mérite par l&apos;action et l&apos;implication. Les candidats acceptés
                commencent au rang <strong className="text-foreground">Aspirant</strong>.
              </p>
            </div>
            <RanksGrid />
          </div>
        </section>

        {/* Formulaire de candidature */}
        <section id="formulaire" className="px-6 py-16 max-w-3xl mx-auto">
          <div className="mb-10">
            <p className="text-xs font-semibold tracking-[0.25em] text-primary/70 uppercase mb-3">
              Candidature
            </p>
            <h2 className="text-2xl sm:text-3xl font-black text-foreground">
              Votre dossier de candidature
            </h2>
            {recruitmentOpen ? (
              <p className="mt-3 text-muted-foreground text-sm leading-relaxed">
                Remplissez le formulaire ci-dessous. Le Haut Conseil examine chaque candidature
                et vous contactera sur Discord sous 7 jours.
              </p>
            ) : (
              <p className="mt-3 text-muted-foreground text-sm leading-relaxed">
                Le recrutement est temporairement suspendu. Revenez plus tard ou contactez-nous
                directement sur Discord.
              </p>
            )}
          </div>

          {recruitmentOpen ? (
            <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
              <RecrutementForm />
            </div>
          ) : (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 sm:p-8 text-center">
              <p className="text-destructive font-semibold text-sm">Recrutement fermé</p>
              <p className="text-muted-foreground text-sm mt-2">
                L&apos;Ordre n&apos;accepte pas de nouvelles candidatures pour le moment.
              </p>
            </div>
          )}
        </section>
      </main>

      <LandingFooter />
    </div>
  )
}
