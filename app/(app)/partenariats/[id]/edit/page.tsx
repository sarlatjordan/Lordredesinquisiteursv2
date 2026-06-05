import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getRolePrivilege } from '@/lib/constants'
import { isUUID } from '@/lib/utils'
import { EditPartnershipClient } from './edit-partnership-client'
import { ArrowLeft } from 'lucide-react'
import type { PartnershipInput } from '@/types'

export const metadata: Metadata = { title: 'Modifier le partenariat' }
export const dynamic = 'force-dynamic'

export default async function EditPartnershipPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!isUUID(id)) notFound()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (getRolePrivilege(me?.role ?? '') < 300) redirect(`/partenariats/${id}`)

  const { data } = await supabase.from('partnerships').select('*').eq('id', id).single()
  if (!data) notFound()

  const initialData: PartnershipInput = {
    name:           data.name,
    type:           data.type           as PartnershipInput['type'],
    relationship:   data.relationship   as PartnershipInput['relationship'],
    contact_handle: data.contact_handle ?? undefined,
    org_rsi_id:     data.org_rsi_id     ?? undefined,
    status:         data.status         as PartnershipInput['status'],
    terms:          data.terms          ?? undefined,
    notes:          data.notes          ?? undefined,
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link href={`/partenariats/${id}`} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Retour au partenariat
      </Link>
      <div>
        <h2 className="text-2xl font-bold">Modifier le partenariat</h2>
        <p className="text-sm text-muted-foreground mt-1">{data.name}</p>
      </div>
      <div className="rounded-lg border border-border bg-card p-6">
        <EditPartnershipClient partnershipId={id} initialData={initialData} />
      </div>
    </div>
  )
}
