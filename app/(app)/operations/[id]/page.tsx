import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getRolePrivilege } from '@/lib/constants'
import { isUUID } from '@/lib/utils'
import { OperationDetail } from './operation-detail'
import { ArrowLeft } from 'lucide-react'
import { getOperationLoot } from '@/actions/loot'
import type {
  OperationWithDetails, OpRoleSlotWithProfile,
  OpRegistrationWithProfile, Profile, Ship,
  InventoryItem, InventoryStock, InventoryItemWithStock, OpResource,
  OperationLootWithShares,
} from '@/types'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  if (!isUUID(id)) return { title: 'Opération' }
  const supabase = await createClient()
  const { data } = await supabase.from('operations').select('title').eq('id', id).single()
  return { title: data?.title ?? 'Opération' }
}

export default async function OperationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!isUUID(id)) notFound()
  const supabase = await createClient()

  // Vague 1 : auth + op en parallèle (op ne dépend que de id)
  const [{ data: { user } }, { data: opRaw }] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from('operations')
      .select('*, commander:profiles!commander_id(username, display_name, avatar_url)')
      .eq('id', id)
      .single(),
  ])
  if (!user) redirect('/login')
  if (!opRaw) notFound()

  // Vague 2 : me (dépend de user.id)
  const { data: profileMe } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const userPrivilege = getRolePrivilege(profileMe?.role ?? '')
  const canManage = userPrivilege >= 600
  if (userPrivilege < opRaw.min_privilege) redirect('/operations')

  const op = opRaw as unknown as typeof opRaw & {
    commander: Pick<Profile, 'username' | 'display_name' | 'avatar_url'> | null
  }

  // Vague 3 : tout en parallèle — JOINs éliminent les in-queries sur profiles
  const empty = <T,>() => Promise.resolve({ data: [] as T[], error: null })

  const [
    { data: slotsRaw },
    { data: registrationsRaw },
    { data: members },
    { data: resourcesRaw },
    { data: itemsRaw },
    { data: stocksRaw },
    { data: shipsRaw },
  ] = await Promise.all([
    supabase
      .from('op_role_slots')
      .select('*, assigned_profile:profiles!assigned_profile_id(id, username, display_name, avatar_url)')
      .eq('operation_id', id)
      .order('role'),
    canManage
      ? supabase
          .from('op_registrations')
          .select('*, profile:profiles!profile_id(id, username, display_name, avatar_url)')
          .eq('operation_id', id)
          .order('created_at')
      : supabase
          .from('op_registrations')
          .select('*, profile:profiles!profile_id(id, username, display_name, avatar_url)')
          .eq('operation_id', id)
          .eq('profile_id', user.id),
    canManage
      ? supabase.from('profiles').select('id, username, display_name').order('display_name')
      : empty<{ id: string; username: string; display_name: string | null }>(),
    supabase
      .from('op_resources')
      .select('*')
      .eq('operation_id', id)
      .order('created_at', { ascending: true }),
    canManage
      ? supabase.from('inventory_items').select('*').order('name')
      : empty<InventoryItem>(),
    canManage
      ? supabase.from('inventory_stock').select('*')
      : empty<InventoryStock>(),
    supabase
      .from('ships')
      .select('id, name, model, ship_type, is_org_ship, status')
      .order('name'),
  ])

  type SlotRow = {
    id: string; operation_id: string; ship_id: string | null; notes: string | null
    role: OpRoleSlotWithProfile['role']
    assigned_profile_id: string | null
    assigned_profile: Pick<Profile, 'id' | 'username' | 'display_name' | 'avatar_url'> | null
  }
  const slots: OpRoleSlotWithProfile[] = ((slotsRaw as unknown as SlotRow[]) ?? []).map((s) => ({
    ...s,
    assigned_profile: s.assigned_profile ?? null,
  }))

  type RegRow = {
    id: string; operation_id: string; profile_id: string; notes: string | null; created_at: string
    status: OpRegistrationWithProfile['status']
    preferred_role: OpRegistrationWithProfile['preferred_role']
    profile: Pick<Profile, 'id' | 'username' | 'display_name' | 'avatar_url'>
  }
  const registrations: OpRegistrationWithProfile[] = ((registrationsRaw as unknown as RegRow[]) ?? []).map((r) => ({
    ...r,
    profile: r.profile,
  }))

  const myRegistration = registrations.find((r) => r.profile_id === user.id) ?? null

  const loots = await getOperationLoot(id)

  const stockMap = (stocksRaw ?? []).reduce<Record<string, InventoryStock>>((acc, s) => {
    acc[s.item_id] = s as InventoryStock
    return acc
  }, {})
  const inventoryItems: InventoryItemWithStock[] = (itemsRaw ?? []).map((item) => ({
    ...(item as InventoryItem),
    stock: stockMap[item.id] ?? null,
  }))

  const operation: OperationWithDetails = {
    ...opRaw,
    type: opRaw.type as OperationWithDetails['type'],
    status: opRaw.status as OperationWithDetails['status'],
    risk_level: opRaw.risk_level as OperationWithDetails['risk_level'],
    commander: op.commander,
    role_slots: slots,
    registrations,
    registration_count: registrations.length,
    my_registration: myRegistration,
    resources: (resourcesRaw ?? []) as OpResource[],
  }

  return (
    <div className="space-y-6">
      <Link
        href="/operations"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour aux opérations
      </Link>

      <OperationDetail
        operation={operation}
        currentUserId={user.id}
        canManage={canManage}
        members={members ?? []}
        inventoryItems={inventoryItems}
        loots={loots as unknown as OperationLootWithShares[]}
        ships={(shipsRaw as unknown as Pick<Ship, 'id' | 'name' | 'model' | 'ship_type' | 'is_org_ship' | 'status'>[]) ?? []}
      />
    </div>
  )
}
