'use client'

import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Globe, Settings, LogOut } from 'lucide-react'
import { NAV_LINKS } from './nav-links'
import { NotificationsDropdown } from './notifications-dropdown'
import { GlobalSearch } from './global-search'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { createClient } from '@/lib/supabase/client'
import type { Notification, ProfileSummary } from '@/types'

interface TopBarProps {
  unreadCount?: number
  notifications?: Notification[]
  profile?: ProfileSummary | null
}

export function TopBar({ unreadCount = 0, notifications = [], profile }: TopBarProps) {
  const pathname = usePathname()
  const router = useRouter()

  const currentLink = NAV_LINKS.find(
    (l) => pathname === l.href || pathname.startsWith(l.href + '/')
  )
  const pageTitle = currentLink?.label ?? 'INQFR'

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-4 border-b border-border bg-background/90 backdrop-blur-md px-4 lg:px-6">
      <div className="flex-1 min-w-0">
        <h1 className="text-base font-semibold text-foreground truncate">{pageTitle}</h1>
      </div>

      <div className="flex items-center gap-2">
        <GlobalSearch />
        <NotificationsDropdown unreadCount={unreadCount} notifications={notifications} />

        {/* Avatar dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
              <Avatar className="h-8 w-8 border border-border hover:border-primary/50 transition-colors cursor-pointer">
                <AvatarImage src={profile?.avatar_url ?? undefined} alt={profile?.display_name ?? ''} />
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  {profile?.username?.slice(0, 2).toUpperCase() ?? 'IN'}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium truncate text-foreground">
                {profile?.display_name ?? profile?.username ?? 'Inquisiteur'}
              </p>
              <p className="text-xs text-muted-foreground capitalize">{profile?.role ?? 'membre'}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/profil" className="cursor-pointer">
                <Settings className="h-4 w-4 mr-2 text-muted-foreground" />
                Profil
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/" className="cursor-pointer">
                <Globe className="h-4 w-4 mr-2 text-muted-foreground" />
                Site public
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleSignOut}
              className="text-destructive focus:text-destructive cursor-pointer"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Déconnexion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
