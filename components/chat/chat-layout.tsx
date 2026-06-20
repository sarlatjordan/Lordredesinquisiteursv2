'use client'

import { useState, useEffect, useRef, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ChannelList } from './channel-list'
import { ChatWindow } from './chat-window'
import { MessageInput } from './message-input'
import {
  sendMessage,
  getChannelMessages,
  loadMoreMessages,
  markChannelSeen,
  createChannel,
} from '@/actions/chat'
import type { ChatChannel, ChatMessageWithAuthor } from '@/types'

interface ChatLayoutProps {
  channels: ChatChannel[]
  initialChannelId: string | null
  initialMessages: ChatMessageWithAuthor[]
  currentUserId: string | null
  userPrivilege: number
}

export function ChatLayout({
  channels: initialChannels,
  initialChannelId,
  initialMessages,
  currentUserId,
  userPrivilege,
}: ChatLayoutProps) {
  const [channels, setChannels] = useState(initialChannels)
  const [activeChannelId, setActiveChannelId] = useState(initialChannelId)
  const [messages, setMessages] = useState<ChatMessageWithAuthor[]>(initialMessages)
  const [hasMore, setHasMore] = useState(initialMessages.length === 50)
  const [loadingMore, setLoadingMore] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newChannelName, setNewChannelName] = useState('')
  const [newChannelDesc, setNewChannelDesc] = useState('')
  const [newChannelPrivilege, setNewChannelPrivilege] = useState<number>(100)
  const [createError, setCreateError] = useState<string | null>(null)
  const [isCreating, startCreateTransition] = useTransition()

  // Tracks the "intended" channel to discard stale async results when switching fast
  const intentRef = useRef(initialChannelId)
  const realtimeRef = useRef<ReturnType<ReturnType<typeof createClient>['channel']> | null>(null)
  // Marque uniquement le canal initialement affiché comme lu au montage
  useEffect(() => {
    if (!currentUserId || !initialChannelId) return
    markChannelSeen(initialChannelId)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const activeChannel = channels.find((c) => c.id === activeChannelId) ?? null
  const canCreateChannel = userPrivilege >= 600

  async function switchChannel(channelId: string) {
    if (channelId === intentRef.current) return
    intentRef.current = channelId

    setActiveChannelId(channelId)
    setMessages([])
    setHasMore(false)
    setSendError(null)

    const [msgResult] = await Promise.all([
      getChannelMessages(channelId),
      markChannelSeen(channelId),
    ])

    if (intentRef.current !== channelId) return
    if (msgResult.success) {
      setMessages(msgResult.data)
      setHasMore(msgResult.data.length === 50)
    }
  }

  // Realtime subscription — resubscribe whenever the active channel changes
  useEffect(() => {
    if (!activeChannelId) return

    const supabase = createClient()
    const channel = supabase
      .channel(`chat:${activeChannelId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `channel_id=eq.${activeChannelId}`,
        },
        async (payload) => {
          const { data } = await supabase
            .from('chat_messages')
            .select('*, author:profiles(id, username, display_name, avatar_url, role)')
            .eq('id', (payload.new as { id: string }).id)
            .single()

          if (data?.author && intentRef.current === activeChannelId) {
            setMessages((prev) => [...prev, data as unknown as ChatMessageWithAuthor])
          }
        }
      )
      .subscribe()

    realtimeRef.current = channel
    return () => { channel.unsubscribe() }
  }, [activeChannelId])

  function handleSend(content: string) {
    setSendError(null)
    startTransition(async () => {
      const result = await sendMessage({ channelId: activeChannelId!, content })
      if (!result.success) setSendError(result.error)
    })
  }

  async function handleLoadMore() {
    if (!activeChannelId || messages.length === 0) return
    setLoadingMore(true)
    const result = await loadMoreMessages(activeChannelId, messages[0].created_at)
    setLoadingMore(false)
    if (result.success) {
      setMessages((prev) => [...result.data, ...prev])
      setHasMore(result.data.length === 50)
    }
  }

  function handleCreateChannel() {
    setCreateError(null)
    startCreateTransition(async () => {
      const result = await createChannel({ name: newChannelName, description: newChannelDesc || undefined, min_privilege: newChannelPrivilege })
      if (!result.success) {
        setCreateError(result.error)
        return
      }
      setShowCreateDialog(false)
      setNewChannelName('')
      setNewChannelDesc('')
      setNewChannelPrivilege(100)
      // The new channel will appear on next server render — user can refresh or we refetch
      window.location.reload()
    })
  }

  return (
    <>
      <div className="flex h-[calc(100vh-3.5rem-3rem)] rounded-lg border border-border overflow-hidden">
        <ChannelList
          channels={channels}
          activeChannelId={activeChannelId}
          canCreateChannel={canCreateChannel}
          onSelect={switchChannel}
          onCreateChannel={() => setShowCreateDialog(true)}
        />

        <div className="flex flex-col flex-1 min-w-0">
          {activeChannel ? (
            <>
              {/* En-tête canal */}
              <div className="px-4 py-2.5 border-b border-border bg-muted/20 flex items-center gap-2 shrink-0">
                <span className="text-sm font-semibold text-foreground">#{activeChannel.name}</span>
                {activeChannel.description && (
                  <span className="text-xs text-muted-foreground truncate hidden sm:block">
                    — {activeChannel.description}
                  </span>
                )}
              </div>

              <ChatWindow
                messages={messages}
                currentUserId={currentUserId}
                hasMore={hasMore}
                loadingMore={loadingMore}
                onLoadMore={handleLoadMore}
              />

              {sendError && (
                <p className={cn('px-4 py-1 text-xs text-destructive bg-destructive/10 border-t border-destructive/20')}>
                  {sendError}
                </p>
              )}

              <MessageInput onSend={handleSend} disabled={isPending || !activeChannelId} />
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center text-muted-foreground text-sm">
              Sélectionnez un canal pour commencer
            </div>
          )}
        </div>
      </div>

      {/* Dialog création de canal */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Nouveau canal</DialogTitle>
            <DialogDescription>Créez un canal de discussion avec une visibilité par rang.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="channel-name">Nom du canal</Label>
              <Input
                id="channel-name"
                placeholder="ex: stratégie"
                value={newChannelName}
                onChange={(e) => setNewChannelName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="channel-desc">Description (optionnelle)</Label>
              <Input
                id="channel-desc"
                placeholder="À quoi sert ce canal ?"
                value={newChannelDesc}
                onChange={(e) => setNewChannelDesc(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="channel-privilege" id="channel-privilege-label">Visible par</Label>
              <Select
                value={String(newChannelPrivilege)}
                onValueChange={(v) => setNewChannelPrivilege(Number(v))}
              >
                <SelectTrigger id="channel-privilege" aria-labelledby="channel-privilege-label">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="100">Aspirant+ (tous les membres)</SelectItem>
                  <SelectItem value="150">Consacré+</SelectItem>
                  <SelectItem value="300">Gardien+</SelectItem>
                  <SelectItem value="400">Inquisiteur+</SelectItem>
                  <SelectItem value="600">Maître Inquisiteur+</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {createError && (
              <p className="text-xs text-destructive bg-destructive/10 px-3 py-2 rounded-md border border-destructive/20">
                {createError}
              </p>
            )}
            <Button
              onClick={handleCreateChannel}
              disabled={isCreating || !newChannelName.trim()}
              className="w-full"
            >
              {isCreating ? 'Création…' : 'Créer le canal'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
