'use client'

import { Hash, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { ChatChannel } from '@/types'

interface ChannelListProps {
  channels: ChatChannel[]
  activeChannelId: string | null
  canCreateChannel: boolean
  onSelect: (channelId: string) => void
  onCreateChannel: () => void
}

export function ChannelList({
  channels,
  activeChannelId,
  canCreateChannel,
  onSelect,
  onCreateChannel,
}: ChannelListProps) {
  return (
    <aside className="w-48 shrink-0 border-r border-border bg-muted/20 flex flex-col">
      <div className="flex items-center justify-between px-3 py-3 border-b border-border">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
          Canaux
        </p>
        {canCreateChannel && (
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 text-muted-foreground hover:text-foreground"
            onClick={onCreateChannel}
            aria-label="Créer un canal"
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
      <nav className="flex-1 overflow-y-auto py-1">
        {channels.map((channel) => (
          <button
            key={channel.id}
            onClick={() => onSelect(channel.id)}
            className={cn(
              'w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors text-left',
              activeChannelId === channel.id
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            )}
          >
            <Hash className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{channel.name}</span>
          </button>
        ))}
      </nav>
    </aside>
  )
}
