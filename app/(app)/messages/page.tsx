import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getRolePrivilege } from '@/lib/constants'
import { ChatLayout } from '@/components/chat/chat-layout'
import type { ChatChannel, ChatMessageWithAuthor } from '@/types'

export const metadata: Metadata = { title: 'Messages' }
export const dynamic = 'force-dynamic'

export default async function MessagesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: me } = user
    ? await supabase.from('profiles').select('role').eq('id', user.id).single()
    : { data: null }
  const userPrivilege = getRolePrivilege(me?.role ?? '')

  const { data: channelsRaw } = await supabase
    .from('chat_channels')
    .select('*')
    .order('created_at', { ascending: true })

  const channels = (channelsRaw ?? []) as ChatChannel[]
  const firstChannel = channels[0] ?? null

  let initialMessages: ChatMessageWithAuthor[] = []
  if (user && firstChannel) {
    const { data } = await supabase
      .from('chat_messages')
      .select('*, author:profiles(id, username, display_name, avatar_url)')
      .eq('channel_id', firstChannel.id)
      .order('created_at', { ascending: false })
      .limit(50)

    initialMessages = ((data ?? []).reverse()) as unknown as ChatMessageWithAuthor[]
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Messages</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Communications internes de l&apos;Ordre
        </p>
      </div>

      <ChatLayout
        channels={channels}
        initialChannelId={firstChannel?.id ?? null}
        initialMessages={initialMessages}
        currentUserId={user?.id ?? null}
        userPrivilege={userPrivilege}
      />
    </div>
  )
}
