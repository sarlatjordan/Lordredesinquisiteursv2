'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { NAV_LINKS } from './nav-links'
import { MoreHorizontal, User } from 'lucide-react'

const PRIMARY_HREFS = ['/dashboard', '/messages', '/membres', '/evenements', '/operations']

const EXTRA_LINKS = [{ href: '/profil', label: 'Profil', icon: User }]

export function MobileNav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const primary = NAV_LINKS.filter((l) => PRIMARY_HREFS.includes(l.href))
  const secondary = [
    ...NAV_LINKS.filter((l) => !PRIMARY_HREFS.includes(l.href)),
    ...EXTRA_LINKS,
  ]

  const hasSecondaryActive = secondary.some(
    (l) => pathname === l.href || pathname.startsWith(l.href + '/')
  )

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-30 border-t border-sidebar-border bg-sidebar/95 backdrop-blur-md"
      aria-label="Navigation mobile"
    >
      <div className="flex h-16 items-center justify-around px-1">
        {primary.map((link) => {
          const isActive = pathname === link.href || pathname.startsWith(link.href + '/')
          const Icon = link.icon
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'flex flex-col items-center justify-center gap-1 rounded-lg',
                'min-h-[44px] min-w-[44px] flex-1 px-1 py-2 transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="text-[9px] font-medium leading-none truncate max-w-[52px] text-center">
                {link.label}
              </span>
            </Link>
          )
        })}

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button
              aria-label="Plus de pages"
              className={cn(
                'flex flex-col items-center justify-center gap-1 rounded-lg',
                'min-h-[44px] min-w-[44px] flex-1 px-1 py-2 transition-colors',
                open || hasSecondaryActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <MoreHorizontal className="h-5 w-5 shrink-0" />
              <span className="text-[9px] font-medium leading-none">Plus</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-2xl pb-8">
            <SheetHeader className="pb-4 text-left">
              <SheetTitle className="text-sm font-semibold">Navigation</SheetTitle>
              <SheetDescription className="sr-only">Pages supplémentaires</SheetDescription>
            </SheetHeader>
            <div className="grid grid-cols-3 gap-3">
              {secondary.map((link) => {
                const isActive = pathname === link.href || pathname.startsWith(link.href + '/')
                const Icon = link.icon
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    aria-current={isActive ? 'page' : undefined}
                    className={cn(
                      'flex flex-col items-center justify-center gap-2 rounded-xl border p-4 min-h-[80px] transition-colors',
                      isActive
                        ? 'text-primary border-primary/30 bg-primary/5'
                        : 'text-muted-foreground border-border hover:text-foreground hover:bg-accent'
                    )}
                  >
                    <Icon className="h-6 w-6" />
                    <span className="text-[11px] font-medium text-center leading-tight">{link.label}</span>
                  </Link>
                )
              })}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  )
}
