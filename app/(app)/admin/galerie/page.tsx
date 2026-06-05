import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getRolePrivilege } from '@/lib/constants'
import { AdminGalerieClient } from './admin-galerie-client'
import type { MediaGallery } from '@/types'
import { ImageIcon } from 'lucide-react'

export const metadata: Metadata = { title: 'Galerie — Admin' }
export const dynamic = 'force-dynamic'

export default async function AdminGaleriePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || getRolePrivilege(profile.role) < 1000) redirect('/dashboard')

  const admin = createAdminClient()
  const { data } = await admin
    .from('media_gallery')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 border border-primary/30 shrink-0">
          <ImageIcon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">Galerie</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Upload et gestion des visuels publics de l&apos;Ordre.
          </p>
        </div>
      </div>

      <AdminGalerieClient initialMedia={(data as MediaGallery[]) ?? []} />
    </div>
  )
}
