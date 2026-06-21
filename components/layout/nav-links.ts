import {
  LayoutDashboard,
  Users,
  CalendarDays,
  Rocket,
  BookOpen,
  Target,
  Handshake,
  Package,
  Map,
  MessagesSquare,
  Bug,
  FileText,
  type LucideIcon,
} from 'lucide-react'

export interface NavLink {
  href: string
  label: string
  icon: LucideIcon
  external?: boolean
}

export interface NavGroup {
  id: string
  label: string
  links: NavLink[]
}

export const NAV_STANDALONE: NavLink[] = [
  { href: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { href: '/messages',  label: 'Messages',         icon: MessagesSquare },
]

export const NAV_GROUPS: NavGroup[] = [
  {
    id: 'combat',
    label: 'Combat & Missions',
    links: [
      { href: '/evenements',  label: 'Événements',  icon: CalendarDays },
      { href: '/operations',  label: 'Opérations',  icon: Target },
    ],
  },
  {
    id: 'org',
    label: 'Org',
    links: [
      { href: '/membres',      label: 'Membres',      icon: Users },
      { href: '/partenariats', label: 'Partenariats', icon: Handshake },
    ],
  },
  {
    id: 'ressources',
    label: 'Ressources internes',
    links: [
      { href: '/flotte',     label: 'Flotte',     icon: Rocket },
      { href: '/logistique', label: 'Logistique', icon: Package },
      { href: '/carte',      label: 'Carte',      icon: Map },
    ],
  },
  {
    id: 'references',
    label: 'Références',
    links: [
      { href: '/ressources',       label: 'Wiki',            icon: BookOpen },
      { href: '/rapport-bug',      label: 'Rapport de bug',  icon: Bug },
      { href: '/guide-joueur.html', label: 'Guide du membre', icon: FileText, external: true },
    ],
  },
]

// Flat list pour la top-bar (titre de page) et la mobile nav
export const NAV_LINKS: NavLink[] = [
  ...NAV_STANDALONE,
  ...NAV_GROUPS.flatMap((g) => g.links),
]
