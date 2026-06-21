import type { ReactNode } from 'react'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/sidebar'
import { MobileNav } from '@/components/layout/mobile-nav'
import { TopBar } from '@/components/layout/top-bar'
import { RedactedContent } from '@/components/layout/redacted-content'
import { PageTransition } from '@/components/layout/page-transition'
import { PageBackground } from '@/components/layout/page-background'
import { createClient } from '@/lib/supabase/server'
import { getRolePrivilege } from '@/lib/constants'
import type { Notification, ProfileSummary } from '@/types'

export default async function AppLayout({ children }: { children: ReactNode }) {
  const headersList = await headers()
  const pathname = headersList.get('x-pathname') ?? ''
  const isMembreProfile = /^\/membres\/[^/]+$/.test(pathname)
  const isMFAPage = pathname === '/mfa'
  const isProfilPage = pathname === '/profil'

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Vérifie si une élévation MFA (AAL2) est requise
  // On laisse passer /mfa pour éviter la boucle de redirection
  if (user && !isMFAPage) {
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
    if (aal?.nextLevel === 'aal2' && aal?.currentLevel !== 'aal2') {
      redirect('/mfa')
    }
  }

  let profile: ProfileSummary | null = null
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('id, role, display_name, username, avatar_url')
      .eq('id', user.id)
      .single()
    profile = data as unknown as ProfileSummary | null
  }

  // Notifications non lues + liste des 15 dernières
  let unreadCount = 0
  let notifications: Notification[] = []
  if (user) {
    const [{ count }, { data: notifData }] = await Promise.all([
      supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('profile_id', user.id)
        .eq('is_read', false),
      supabase
        .from('notifications')
        .select('*')
        .eq('profile_id', user.id)
        .order('created_at', { ascending: false })
        .limit(15),
    ])
    unreadCount = count ?? 0
    notifications = (notifData ?? []) as Notification[]
  }

  // Badge chat non-lu — une seule requête SQL via RPC (voir migration 022)
  let chatUnreadCount = 0
  if (user) {
    const { data } = await supabase.rpc('get_chat_unread_count')
    chatUnreadCount = Number(data ?? 0)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar desktop */}
      <Sidebar profile={profile} badges={{ '/messages': chatUnreadCount }} />

      {/* Contenu principal */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        <TopBar unreadCount={unreadCount} notifications={notifications} profile={profile} />
        <main className="flex-1 relative">
          <PageBackground />
          <div className="relative z-10 p-4 lg:p-6 pb-20 lg:pb-6">
            {getRolePrivilege(profile?.role ?? '') <= 50 && !isMembreProfile && !isProfilPage
              ? <RedactedContent />
              : <PageTransition>{children}</PageTransition>}
          </div>
        </main>
      </div>

      {/* Navigation mobile en bas */}
      <MobileNav />
    </div>
  )
}
