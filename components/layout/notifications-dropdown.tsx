'use client'

import { useTransition } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Bell } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { markRead, markAllRead } from '@/actions/notifications'
import type { Notification } from '@/types'

interface NotificationsDropdownProps {
  unreadCount: number
  notifications: Notification[]
}

export function NotificationsDropdown({ unreadCount, notifications }: NotificationsDropdownProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleMarkRead(id: string) {
    startTransition(async () => {
      await markRead(id)
      router.refresh()
    })
  }

  function handleMarkAllRead() {
    startTransition(async () => {
      await markAllRead()
      router.refresh()
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-8 w-8 text-muted-foreground hover:text-foreground"
          aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} non lues)` : ''}`}
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge
              className="absolute -top-0.5 -right-0.5 h-4 w-4 p-0 text-[9px] flex items-center justify-center bg-destructive border-0"
              aria-hidden
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80" sideOffset={8}>
        <div className="flex items-center justify-between px-3 py-2">
          <p className="text-sm font-semibold">Notifications</p>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto py-0.5 px-2 text-xs text-muted-foreground"
              onClick={handleMarkAllRead}
              disabled={isPending}
            >
              Tout marquer lu
            </Button>
          )}
        </div>

        <DropdownMenuSeparator className="mb-0" />

        <div className="max-h-[380px] overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="text-center text-xs text-muted-foreground py-8">
              Aucune notification
            </p>
          ) : (
            notifications.map((notif) => (
              <div key={notif.id}>
                <div
                  className={cn(
                    'flex gap-2.5 px-3 py-2.5 hover:bg-accent transition-colors',
                    !notif.is_read && 'bg-primary/5'
                  )}
                >
                  {!notif.is_read && (
                    <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
                  )}
                  <div className={cn('flex-1 min-w-0', notif.is_read && 'pl-4')}>
                    {notif.link ? (
                      <Link href={notif.link} className="block">
                        <p className="text-xs font-medium text-foreground truncate">{notif.title}</p>
                        {notif.message && (
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{notif.message}</p>
                        )}
                      </Link>
                    ) : (
                      <>
                        <p className="text-xs font-medium text-foreground truncate">{notif.title}</p>
                        {notif.message && (
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{notif.message}</p>
                        )}
                      </>
                    )}
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-[10px] text-muted-foreground/70">
                        {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: fr })}
                      </p>
                      {!notif.is_read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto py-0 px-1.5 text-[10px] text-muted-foreground hover:text-foreground"
                          onClick={() => handleMarkRead(notif.id)}
                          disabled={isPending}
                        >
                          Lu
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
                <DropdownMenuSeparator className="my-0" />
              </div>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
