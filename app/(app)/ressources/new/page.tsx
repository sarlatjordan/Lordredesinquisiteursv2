import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getRolePrivilege, PRIVILEGE } from '@/lib/constants'
import { ResourceCreateForm } from '@/components/ressources/resource-create-form'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Nouvelle ressource' }
export const dynamic = 'force-dynamic'

export default async function NewResourcePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (getRolePrivilege(profile?.role ?? '') < PRIVILEGE.MANAGE_RESOURCES) redirect('/ressources')

  const { data: existing } = await supabase.from('org_resources').select('category')
  const existingCategories = [...new Set((existing ?? []).map((r) => r.category))].sort()

  return (
    <div className="space-y-5 max-w-4xl">
      <Link
        href="/ressources"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        Retour aux ressources
      </Link>

      <div>
        <h2 className="text-2xl font-bold text-foreground">Nouvelle ressource</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Crée un guide, un règlement ou tout document utile à l&apos;organisation.
        </p>
      </div>

      <ResourceCreateForm existingCategories={existingCategories} />
    </div>
  )
}
