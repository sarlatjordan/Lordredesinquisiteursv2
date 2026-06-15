import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getRolePrivilege } from '@/lib/constants'
import { AvatarsClient } from './avatars-client'
import { ImageIcon } from 'lucide-react'
import type { ProfileWithPendingAvatar } from '@/types'

export const metadata: Metadata = { title: 'Avatars — Validation' }
export const dynamic = 'force-dynamic'

export default async function AdminAvatarsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [profileResult, pendingResult] = await Promise.all([
    supabase.from('profiles').select('role').eq('id', user.id).single(),
    supabase.from('profiles').select('id, username, display_name, avatar_url, avatar_pending_url').not('avatar_pending_url', 'is', null).order('username', { ascending: true }),
  ])

  if (!profileResult.data || getRolePrivilege(profileResult.data.role) < 1000) {
    redirect('/dashboard')
  }

  const profiles = (pendingResult.data ?? []) as ProfileWithPendingAvatar[]

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 border border-primary/30 shrink-0">
          <ImageIcon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">Avatars — Validation</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {profiles.length} photo{profiles.length > 1 ? 's' : ''} en attente de validation
          </p>
        </div>
      </div>

      <AvatarsClient profiles={profiles} />
    </div>
  )
}
