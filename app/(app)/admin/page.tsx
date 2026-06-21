import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getRolePrivilege } from '@/lib/constants'
import {
  Users, ImageIcon, Activity, Zap, BookOpen, TrendingUp, ExternalLink, ShieldCheck, Bug,
} from 'lucide-react'

export const metadata: Metadata = { title: 'Administration' }
export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const privilege = getRolePrivilege(me?.role ?? '')
  if (privilege < 600) redirect('/dashboard')

  const isSage = privilege >= 1000

  const cards = [
    {
      href:      '/admin/gestion-membres',
      label:     'Gestion Membres',
      desc:      isSage ? 'Candidatures et épreuves de rang' : 'Épreuves de rang',
      icon:      Users,
      color:     'text-cyan-400',
      border:    'border-cyan-400/20 hover:border-cyan-400/50',
      bg:        'bg-cyan-400/5',
      available: true,
    },
    {
      href:      '/admin/galerie',
      label:     'Galerie',
      desc:      'Upload et gestion des médias',
      icon:      ImageIcon,
      color:     'text-violet-400',
      border:    'border-violet-400/20 hover:border-violet-400/50',
      bg:        'bg-violet-400/5',
      available: isSage,
    },
    {
      href:      '/admin/avatars',
      label:     'Avatars',
      desc:      'Validation des avatars en attente',
      icon:      Users,
      color:     'text-pink-400',
      border:    'border-pink-400/20 hover:border-pink-400/50',
      bg:        'bg-pink-400/5',
      available: isSage,
    },
    {
      href:      '/admin/activite',
      label:     'Activité',
      desc:      'Journal d\'activité global de l\'Ordre',
      icon:      Activity,
      color:     'text-green-400',
      border:    'border-green-400/20 hover:border-green-400/50',
      bg:        'bg-green-400/5',
      available: isSage,
    },
    {
      href:      '/admin/points',
      label:     'Points',
      desc:      'Audit des attributions de points',
      icon:      Zap,
      color:     'text-yellow-400',
      border:    'border-yellow-400/20 hover:border-yellow-400/50',
      bg:        'bg-yellow-400/5',
      available: isSage,
    },
    {
      href:      '/admin/journal',
      label:     'Journal de guerre',
      desc:      'Historique des opérations et batailles',
      icon:      BookOpen,
      color:     'text-orange-400',
      border:    'border-orange-400/20 hover:border-orange-400/50',
      bg:        'bg-orange-400/5',
      available: isSage,
    },
    {
      href:      '/admin/acces',
      label:     'Gestion des accès',
      desc:      'Contrôler l\'accès aux sections par rang',
      icon:      ShieldCheck,
      color:     'text-emerald-400',
      border:    'border-emerald-400/20 hover:border-emerald-400/50',
      bg:        'bg-emerald-400/5',
      available: isSage,
    },
    {
      href:      '/admin/bugs',
      label:     'Rapports de bug',
      desc:      'Bugs signalés par les membres',
      icon:      Bug,
      color:     'text-red-400',
      border:    'border-red-400/20 hover:border-red-400/50',
      bg:        'bg-red-400/5',
      available: true,
    },
  ].filter((c) => c.available)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Administration</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Panneau de contrôle de l&apos;Ordre des Inquisiteurs
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <Link
              key={card.href}
              href={card.href}
              className={`rounded-xl border ${card.border} ${card.bg} p-5 space-y-3 transition-colors group`}
            >
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-card border ${card.border}`}>
                <Icon className={`h-5 w-5 ${card.color}`} />
              </div>
              <div>
                <p className="font-semibold text-foreground group-hover:text-foreground">{card.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{card.desc}</p>
              </div>
            </Link>
          )
        })}

        {/* Backlog externe */}
        <a
          href="/backlog.html"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-xl border border-border hover:border-border/80 bg-muted/20 p-5 space-y-3 transition-colors group"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-card border border-border">
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex items-start justify-between">
            <div>
              <p className="font-semibold text-foreground">Backlog</p>
              <p className="text-xs text-muted-foreground mt-0.5">Roadmap et tâches en cours</p>
            </div>
            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground mt-1 shrink-0" />
          </div>
        </a>
      </div>
    </div>
  )
}
