'use client'

import { useEffect, useRef } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'

const sanitizeSchema = { ...defaultSchema, tagNames: [...(defaultSchema.tagNames ?? []), 'u'] }
const rehypePlugins = [rehypeRaw, [rehypeSanitize, sanitizeSchema]] as Parameters<typeof ReactMarkdown>[0]['rehypePlugins']
import type { ChatMessageWithAuthor } from '@/types'

interface ChatWindowProps {
  messages: ChatMessageWithAuthor[]
  currentUserId: string | null
  hasMore: boolean
  loadingMore: boolean
  onLoadMore: () => void
}

export function ChatWindow({
  messages,
  currentUserId,
  hasMore,
  loadingMore,
  onLoadMore,
}: ChatWindowProps) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const prevLengthRef = useRef(messages.length)

  useEffect(() => {
    if (messages.length > prevLengthRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
    prevLengthRef.current = messages.length
  }, [messages.length])

  return (
    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
      {hasMore && (
        <div className="flex justify-center pb-1">
          <Button variant="ghost" size="sm" onClick={onLoadMore} disabled={loadingMore} className="text-xs">
            {loadingMore ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Charger les messages précédents'}
          </Button>
        </div>
      )}

      {messages.length === 0 && (
        <p className="text-center text-xs text-muted-foreground py-10">
          Aucun message pour l&apos;instant. Soyez le premier à écrire.
        </p>
      )}

      {messages.map((msg) => {
        const isMine = msg.author_id === currentUserId
        const name = msg.author.display_name ?? msg.author.username
        const initials = name.slice(0, 2).toUpperCase()

        return (
          <div key={msg.id} className={cn('flex gap-2.5', isMine && 'flex-row-reverse')}>
            <Avatar className="h-7 w-7 shrink-0 mt-0.5">
              <AvatarImage src={msg.author.avatar_url ?? undefined} />
              <AvatarFallback className="text-[10px] bg-muted">{initials}</AvatarFallback>
            </Avatar>

            <div className={cn('max-w-[70%] min-w-0', isMine && 'items-end flex flex-col')}>
              <div className={cn('flex items-baseline gap-2 mb-0.5', isMine && 'flex-row-reverse')}>
                <span className="text-xs font-medium text-foreground truncate">{name}</span>
                <span className="text-[10px] text-muted-foreground shrink-0">
                  {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true, locale: fr })}
                </span>
              </div>
              <div
                className={cn(
                  'text-sm px-3 py-2 rounded-lg break-words',
                  isMine
                    ? 'bg-primary text-primary-foreground rounded-tr-none'
                    : 'bg-muted text-foreground rounded-tl-none'
                )}
              >
                <ReactMarkdown
                  rehypePlugins={rehypePlugins}
                  components={{
                    p: ({ children }) => <span>{children}</span>,
                    strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                    em: ({ children }) => <em className="italic">{children}</em>,
                    u: ({ children }) => <u>{children}</u>,
                  }}
                >
                  {msg.content}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        )
      })}

      <div ref={bottomRef} />
    </div>
  )
}
