import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getRolePrivilege } from '@/lib/constants'
import { isUUID } from '@/lib/utils'
import { EditItemClient } from './edit-item-client'
import { ArrowLeft } from 'lucide-react'
import type { InventoryItem } from '@/types'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  if (!isUUID(id)) return { title: 'Modifier' }
  const supabase = await createClient()
  const { data } = await supabase.from('inventory_items').select('name').eq('id', id).single()
  return { title: `Modifier — ${data?.name ?? 'Item'}` }
}

export default async function EditItemPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  if (!isUUID(id)) notFound()
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (getRolePrivilege(me?.role ?? '') < 300) redirect(`/logistique/${id}`)

  const { data } = await supabase.from('inventory_items').select('*').eq('id', id).single()
  if (!data) notFound()

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <Link
        href={`/logistique/${id}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour à l&apos;item
      </Link>

      <div>
        <h2 className="text-2xl font-bold text-foreground">Modifier l&apos;item</h2>
        <p className="text-sm text-muted-foreground mt-1">{data.name}</p>
      </div>

      <div className="rounded-lg border border-border bg-card p-6">
        <EditItemClient item={data as InventoryItem} />
      </div>
    </div>
  )
}
