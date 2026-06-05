import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getRolePrivilege } from '@/lib/constants'
import { isUUID } from '@/lib/utils'
import { ItemDetail } from './item-detail'
import { ArrowLeft } from 'lucide-react'
import type {
  InventoryItem,
  InventoryStock,
  InventoryTransaction,
  InventoryTransactionWithProfile,
  Profile,
} from '@/types'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  if (!isUUID(id)) return { title: 'Item' }
  const supabase = await createClient()
  const { data } = await supabase.from('inventory_items').select('name').eq('id', id).single()
  return { title: data?.name ?? 'Item' }
}

export default async function ItemPage({
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
  const privilege  = getRolePrivilege(me?.role ?? '')
  const canManage  = privilege >= 300
  const canDelete  = privilege >= 1000

  const { data: itemRaw } = await supabase
    .from('inventory_items')
    .select('*')
    .eq('id', id)
    .single()
  if (!itemRaw) notFound()

  const { data: stockRaw } = await supabase
    .from('inventory_stock')
    .select('*')
    .eq('item_id', id)
    .single()

  // Transactions (self + Gardien+ via RLS)
  const { data: txRaw } = await supabase
    .from('inventory_transactions')
    .select('*')
    .eq('item_id', id)
    .order('created_at', { ascending: false })

  // Profils liés aux transactions (members + approvers)
  const profileIds = [
    ...new Set([
      ...((txRaw ?? []).map((t) => t.member_id)),
      ...((txRaw ?? []).map((t) => t.approved_by).filter(Boolean) as string[]),
    ]),
  ]

  const { data: profilesRaw } = profileIds.length > 0
    ? await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .in('id', profileIds)
    : { data: [] }

  const profileMap = (profilesRaw ?? []).reduce<
    Record<string, Pick<Profile, 'id' | 'username' | 'display_name' | 'avatar_url'>>
  >((acc, p) => { acc[p.id] = p; return acc }, {})

  const transactions: InventoryTransactionWithProfile[] = (txRaw ?? []).map((t) => ({
    ...(t as InventoryTransaction),
    member:   profileMap[t.member_id] ?? { id: t.member_id, username: '?', display_name: null, avatar_url: null },
    approver: t.approved_by ? (profileMap[t.approved_by] ?? null) : null,
  }))

  // Opérations planifiées / en cours (pour dialog réservation)
  const { data: opsRaw } = canManage
    ? await supabase
        .from('operations')
        .select('id, title')
        .in('status', ['planned', 'active'])
        .order('departure_at')
    : { data: [] }

  const operations = (opsRaw ?? []) as { id: string; title: string }[]

  return (
    <div className="space-y-6">
      <Link
        href="/logistique"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour à l&apos;inventaire
      </Link>

      <ItemDetail
        item={itemRaw as InventoryItem}
        stock={stockRaw as InventoryStock | null}
        transactions={transactions}
        operations={operations}
        currentUserId={user.id}
        canManage={canManage}
        canDelete={canDelete}
      />
    </div>
  )
}
