'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, MessageCircle, Send } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { sendOpChatMessage } from '@/actions/operations'
import { formatDateTime } from '@/lib/utils'
import type { OpChatMessageWithProfile } from '@/types'

interface OpChatProps {
  operationId: string
  initialMessages: OpChatMessageWithProfile[]
  currentUserId: string
}

export function OpChat({ operationId, initialMessages, currentUserId }: OpChatProps) {
  const [messages, setMessages] = useState<OpChatMessageWithProfile[]>(initialMessages)
  const [content, setContent] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const bottomRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    const channel = supabase
      .channel(`op-chat:${operationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'op_chat_messages',
          filter: `operation_id=eq.${operationId}`,
        },
        async (payload) => {
          const { data } = await supabase
            .from('op_chat_messages')
            .select('*, author:profiles(id, username, display_name, avatar_url)')
            .eq('id', (payload.new as { id: string }).id)
            .single()
          if (data) {
            setMessages((prev) => [...prev, data as unknown as OpChatMessageWithProfile])
          }
        }
      )
      .subscribe()

    return () => { void supabase.removeChannel(channel) }
  }, [operationId, supabase])

  function handleSend() {
    const trimmed = content.trim()
    if (!trimmed) return
    setError(null)
    setContent('')
    startTransition(async () => {
      const result = await sendOpChatMessage(operationId, trimmed)
      if (!result.success) {
        setError(result.error ?? 'Erreur')
        setContent(trimmed)
      }
    })
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card flex flex-col" style={{ maxHeight: '480px' }}>
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border shrink-0">
        <MessageCircle className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold text-foreground">Discussion</h3>
        <span className="text-xs text-muted-foreground ml-auto">participants confirmés</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 min-h-0">
        {messages.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6">
            Aucun message. Soyez le premier à lancer la discussion.
          </p>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.profile_id === currentUserId
            return (
              <div key={msg.id} className={`flex gap-2.5 ${isOwn ? 'flex-row-reverse' : ''}`}>
                <Avatar className="h-7 w-7 shrink-0 mt-0.5">
                  <AvatarImage src={msg.author?.avatar_url ?? undefined} />
                  <AvatarFallback className="text-[10px]">
                    {(msg.author?.display_name ?? msg.author?.username ?? '?').slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className={`flex flex-col gap-1 max-w-[75%] ${isOwn ? 'items-end' : ''}`}>
                  <div className="flex items-baseline gap-2">
                    {!isOwn && (
                      <span className="text-xs font-semibold text-foreground">
                        {msg.author?.display_name ?? msg.author?.username ?? 'Inconnu'}
                      </span>
                    )}
                    <span className="text-[10px] text-muted-foreground">
                      {formatDateTime(msg.created_at)}
                    </span>
                  </div>
                  <div className={`rounded-xl px-3 py-2 text-sm leading-relaxed break-words ${
                    isOwn
                      ? 'bg-primary text-primary-foreground rounded-tr-sm'
                      : 'bg-muted/60 text-foreground rounded-tl-sm'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {error && (
        <p className="px-4 py-1 text-xs text-destructive bg-destructive/10">{error}</p>
      )}
      <div className="flex gap-2 px-4 py-3 border-t border-border shrink-0">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message… (Entrée pour envoyer, Maj+Entrée pour sauter une ligne)"
          rows={1}
          className="resize-none min-h-0 text-sm py-2"
          disabled={isPending}
        />
        <Button
          size="icon"
          onClick={handleSend}
          disabled={isPending || !content.trim()}
          className="shrink-0"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  )
}
