'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LogOut, Shield, ChevronDown, ClipboardList, ImageIcon,
  Activity, Zap, BookOpen, TrendingUp, Globe, Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getRolePrivilege } from '@/lib/constants'
import { NAV_STANDALONE, NAV_GROUPS } from './nav-links'
import { APP_ABBREVIATION, APP_NAME } from '@/lib/constants'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import type { ProfileSummary } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const STORAGE_KEY = 'inqfr_sidebar_groups'

interface SidebarProps {
  profile: ProfileSummary | null
  badges?: Partial<Record<string, number>>
}

function NavItem({
  href,
  label,
  icon: Icon,
  badge,
  isActive,
}: {
  href: string
  label: string
  icon: React.ElementType
  badge?: number
  isActive: boolean
}) {
  return (
    <Link href={href}>
      <motion.div
        whileHover={{ x: 2 }}
        transition={{ duration: 0.15 }}
        className={cn(
          'group flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors duration-150',
          isActive
            ? 'bg-primary/10 text-primary border border-primary/20'
            : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
        )}
      >
        <Icon className={cn(
          'h-4 w-4 shrink-0 transition-colors',
          isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-sidebar-accent-foreground'
        )} />
        <span className="truncate">{label}</span>
        {badge && badge > 0 && !isActive ? (
          <span className="ml-auto shrink-0 min-w-[1.1rem] h-[1.1rem] rounded-full bg-destructive text-[9px] text-white flex items-center justify-center px-1">
            {badge > 99 ? '99+' : badge}
          </span>
        ) : isActive ? (
          <motion.div layoutId="sidebar-active-indicator" className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
        ) : null}
      </motion.div>
    </Link>
  )
}

export function Sidebar({ profile, badges = {} }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) setCollapsed(JSON.parse(stored) as Record<string, boolean>)
    } catch {}
    setHydrated(true)
  }, [])

  function toggleGroup(id: string) {
    setCollapsed((prev) => {
      const next = { ...prev, [id]: !prev[id] }
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="hidden lg:flex flex-col w-64 min-h-screen border-r border-sidebar-border bg-sidebar fixed left-0 top-0 bottom-0 z-30">
      {/* Logo */}
      <Link
        href="/"
        className="flex items-center gap-3 px-6 py-5 border-b border-sidebar-border hover:bg-primary/5 transition-colors group"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg overflow-hidden border border-primary/30 group-hover:border-primary/60 transition-colors bg-background">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="INQFR" className="w-full h-full object-contain p-0.5" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-primary truncate">{APP_ABBREVIATION}</p>
          <p className="text-[10px] text-muted-foreground truncate leading-tight">{APP_NAME}</p>
        </div>
      </Link>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {/* Standalone links */}
        {NAV_STANDALONE.map((link) => (
          <NavItem
            key={link.href}
            href={link.href}
            label={link.label}
            icon={link.icon}
            badge={badges[link.href]}
            isActive={pathname === link.href || pathname.startsWith(link.href + '/')}
          />
        ))}

        {/* Grouped links */}
        {hydrated && NAV_GROUPS.map((group) => {
          const isOpen = !collapsed[group.id]
          const hasActive = group.links.some(
            (l) => pathname === l.href || pathname.startsWith(l.href + '/')
          )

          return (
            <div key={group.id} className="pt-2">
              <button
                onClick={() => toggleGroup(group.id)}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-widest transition-colors',
                  hasActive && !isOpen
                    ? 'text-primary'
                    : 'text-muted-foreground/60 hover:text-muted-foreground'
                )}
              >
                <span className="flex-1 text-left">{group.label}</span>
                <ChevronDown className={cn(
                  'h-3 w-3 transition-transform duration-200',
                  isOpen ? 'rotate-0' : '-rotate-90'
                )} />
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <div className="mt-1 space-y-0.5">
                      {group.links.map((link) => (
                        <NavItem
                          key={link.href}
                          href={link.href}
                          label={link.label}
                          icon={link.icon}
                          badge={badges[link.href]}
                          isActive={pathname === link.href || pathname.startsWith(link.href + '/')}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </nav>

      {/* Commandement — MI+ */}
      {getRolePrivilege(profile?.role ?? '') >= 600 && (
        <>
          <Separator className="bg-sidebar-border mx-3" />
          <div className="px-3 py-2">
            <p className="px-3 mb-1 text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-widest">
              Commandement
            </p>
            <NavItem
              href="/admin/promotions"
              label="Promotions"
              icon={TrendingUp}
              isActive={pathname.startsWith('/admin/promotions')}
            />
          </div>
        </>
      )}

      {/* Admin — Sage */}
      {profile?.role === 'sage' && (
        <>
          <Separator className="bg-sidebar-border mx-3" />
          <div className="px-3 py-2">
            <p className="px-3 mb-1 text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-widest">
              Administration
            </p>
            {[
              { href: '/admin/candidatures', label: 'Candidatures', Icon: ClipboardList },
              { href: '/admin/galerie',      label: 'Galerie',       Icon: ImageIcon },
              { href: '/admin/avatars',      label: 'Avatars',       Icon: ImageIcon },
              { href: '/admin/activite',     label: 'Activité',      Icon: Activity },
              { href: '/admin/points',       label: 'Points',        Icon: Zap },
            ].map(({ href, label, Icon }) => (
              <NavItem key={href} href={href} label={label} icon={Icon} isActive={pathname.startsWith(href)} />
            ))}
            <a href="/backlog.html" target="_blank" rel="noopener noreferrer">
              <motion.div
                whileHover={{ x: 2 }}
                transition={{ duration: 0.15 }}
                className="group flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors duration-150 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              >
                <BookOpen className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-sidebar-accent-foreground transition-colors" />
                <span className="truncate">Backlog</span>
              </motion.div>
            </a>
          </div>
        </>
      )}

      <Separator className="bg-sidebar-border" />

      {/* Profil compact */}
      <div className="px-3 py-3">
        <div className="flex items-center gap-3 px-2 py-2 rounded-md">
          <Avatar className="h-7 w-7 border border-border shrink-0">
            <AvatarImage src={profile?.avatar_url ?? undefined} alt={profile?.display_name ?? ''} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs">
              {profile?.username?.slice(0, 2).toUpperCase() ?? 'IN'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate text-foreground">
              {profile?.display_name ?? profile?.username ?? 'Inquisiteur'}
            </p>
            <div className="flex items-center gap-1">
              <Shield className="h-2.5 w-2.5 text-primary" />
              <p className="text-[10px] text-primary capitalize">{profile?.role ?? 'membre'}</p>
            </div>
          </div>
          <div className="flex gap-1">
            <Link
              href="/profil"
              title="Profil"
              className="flex items-center justify-center h-6 w-6 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <Settings className="h-3.5 w-3.5" />
            </Link>
            <button
              onClick={handleSignOut}
              title="Déconnexion"
              className="flex items-center justify-center h-6 w-6 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  )
}
