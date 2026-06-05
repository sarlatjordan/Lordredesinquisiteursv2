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
  type LucideIcon,
} from 'lucide-react'

export interface NavLink {
  href: string
  label: string
  icon: LucideIcon
  badge?: number
}

export const NAV_LINKS: NavLink[] = [
  { href: '/dashboard',    label: 'Tableau de bord', icon: LayoutDashboard },
  { href: '/messages',     label: 'Messages',         icon: MessagesSquare },
  { href: '/membres',      label: 'Membres',          icon: Users },
  { href: '/evenements',   label: 'Événements',       icon: CalendarDays },
  { href: '/operations',   label: 'Opérations',       icon: Target },
  { href: '/logistique',   label: 'Logistique',        icon: Package },
  { href: '/partenariats', label: 'Partenariats',      icon: Handshake },
  { href: '/carte',        label: 'Carte',             icon: Map },
  { href: '/flotte',       label: 'Flotte',           icon: Rocket },
  { href: '/ressources',   label: 'Ressources',       icon: BookOpen },
]
