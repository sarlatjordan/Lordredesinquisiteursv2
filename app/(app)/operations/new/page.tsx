import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getRolePrivilege, PRIVILEGE } from '@/lib/constants'
import { NewOpClient } from './new-op-client'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = { title: 'Nouvelle opération' }
export const dynamic = 'force-dynamic'

export default async function NewOperationPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (getRolePrivilege(profile?.role ?? '') < PRIVILEGE.CREATE_OPS) redirect('/operations')

  const { data: members } = await supabase
    .from('profiles')
    .select('id, username, display_name')
    .gte('id', '') // tous les profils
    .order('display_name', { ascending: true })

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/operations"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux opérations
        </Link>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-foreground">Nouvelle opération</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Planifiez une mission pour l&apos;Ordre.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card p-6">
        <NewOpClient members={members ?? []} />
      </div>
    </div>
  )
}
