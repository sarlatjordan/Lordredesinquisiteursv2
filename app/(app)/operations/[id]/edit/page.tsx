import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getRolePrivilege } from '@/lib/constants'
import { isUUID } from '@/lib/utils'
import { EditOpClient } from './edit-op-client'
import { ArrowLeft } from 'lucide-react'
import type { OperationCreateInput } from '@/types'

export const metadata: Metadata = { title: 'Modifier l\'opération' }
export const dynamic = 'force-dynamic'

export default async function EditOperationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!isUUID(id)) notFound()
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (getRolePrivilege(profile?.role ?? '') < 600) redirect(`/operations/${id}`)

  const { data: op } = await supabase.from('operations').select('*').eq('id', id).single()
  if (!op) notFound()

  const { data: slots } = await supabase.from('op_role_slots').select('role').eq('operation_id', id)
  const roleSlots = (slots ?? []).map((s) => s.role) as OperationCreateInput['role_slots']

  const { data: members } = await supabase
    .from('profiles')
    .select('id, username, display_name')
    .order('display_name', { ascending: true })

  const initialData: Partial<OperationCreateInput> = {
    title:                  op.title,
    system_name:            op.system_name,
    type:                   op.type as OperationCreateInput['type'],
    status:                 op.status as OperationCreateInput['status'],
    departure_at:           op.departure_at.slice(0, 16),
    estimated_duration_min: op.estimated_duration_min ?? undefined,
    risk_level:             op.risk_level as OperationCreateInput['risk_level'],
    commander_id:           op.commander_id ?? undefined,
    description:            op.description ?? undefined,
    min_privilege:          op.min_privilege,
    role_slots:             roleSlots,
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link
        href={`/operations/${id}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour à l&apos;opération
      </Link>

      <div>
        <h2 className="text-2xl font-bold text-foreground">Modifier l&apos;opération</h2>
        <p className="text-sm text-muted-foreground mt-1">{op.title}</p>
      </div>

      <div className="rounded-lg border border-border bg-card p-6">
        <EditOpClient operationId={id} initialData={initialData} members={members ?? []} />
      </div>
    </div>
  )
}
