'use client'

import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePathname } from 'next/navigation'
import { NAV_LINKS } from './nav-links'
import { NotificationsDropdown } from './notifications-dropdown'
import type { Notification } from '@/types'

interface TopBarProps {
  unreadCount?: number
  notifications?: Notification[]
}

export function TopBar({ unreadCount = 0, notifications = [] }: TopBarProps) {
  const pathname = usePathname()
  const currentLink = NAV_LINKS.find(
    (l) => pathname === l.href || pathname.startsWith(l.href + '/')
  )
  const pageTitle = currentLink?.label ?? 'INQFR'

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-4 border-b border-border bg-background/90 backdrop-blur-md px-4 lg:px-6">
      <div className="flex-1 min-w-0">
        <h1 className="text-base font-semibold text-foreground truncate">{pageTitle}</h1>
      </div>

      <div className="flex items-center gap-2">
        {/* Recherche — fonctionnalité future */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          aria-label="Rechercher"
        >
          <Search className="h-4 w-4" />
        </Button>

        <NotificationsDropdown unreadCount={unreadCount} notifications={notifications} />
      </div>
    </header>
  )
}
