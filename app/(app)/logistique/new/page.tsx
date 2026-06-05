import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getRolePrivilege } from '@/lib/constants'
import { NewItemClient } from './new-item-client'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = { title: 'Nouvel item' }
export const dynamic = 'force-dynamic'

export default async function NewItemPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (getRolePrivilege(me?.role ?? '') < 300) redirect('/logistique')

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <Link
        href="/logistique"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour à l&apos;inventaire
      </Link>

      <div>
        <h2 className="text-2xl font-bold text-foreground">Nouvel item</h2>
        <p className="text-sm text-muted-foreground mt-1">Ajouter un item au catalogue</p>
      </div>

      <div className="rounded-lg border border-border bg-card p-6">
        <NewItemClient />
      </div>
    </div>
  )
}
