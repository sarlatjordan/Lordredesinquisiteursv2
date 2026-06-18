'use server'

import { revalidatePath } from 'next/cache'
import { getAuthWithPrivilege } from '@/lib/auth-helpers'
import { PRIVILEGE } from '@/lib/constants'
import { checkAndAwardOpBadges, awardBadge } from '@/lib/award-badge'
import {
  OperationCreateSchema,
  OpRegisterSchema,
  type OperationCreateInput,
  type OpRegisterInput,
  type ActionResult,
  type Operation,
  type OpRoleSlot,
  type OpResource,
  type OpResourceWithOp,
} from '@/types'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'


export async function createOperation(input: OperationCreateInput): Promise<ActionResult<Operation>> {
  const { supabase, user, privilege } = await getAuthWithPrivilege()
  if (!user) return { success: false, error: 'Non authentifié' }
  if (privilege < PRIVILEGE.CREATE_OPS) return { success: false, error: 'Privilege insuffisant (Maître Inquisiteur requis)' }

  const parsed = OperationCreateSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Données invalides' }
  }

  const { role_slots, ...opData } = parsed.data

  const { data: op, error } = await supabase
    .from('operations')
    .insert({ ...opData, created_by: user.id })
    .select()
    .single()

  if (error) return { success: false, error: error.message }

  if (role_slots.length > 0) {
    const slots = role_slots.map((role) => ({ operation_id: op.id, role }))
    const { error: slotsError } = await supabase.from('op_role_slots').insert(slots)
    if (slotsError) return { success: false, error: slotsError.message }
  }

  revalidatePath('/operations')
  return { success: true, data: op as Operation }
}

export async function updateOperation(
  id: string,
  input: Partial<OperationCreateInput>
): Promise<ActionResult<Operation>> {
  const { supabase, user, privilege } = await getAuthWithPrivilege()
  if (!user) return { success: false, error: 'Non authentifié' }
  if (privilege < 300) return { success: false, error: 'Privilege insuffisant' }

  const { role_slots: _slots, ...opData } = input

  if (opData.status && ['completed', 'cancelled'].includes(opData.status)) {
    try {
      await releaseAllOpResources(id, user.id, supabase, opData.status as 'completed' | 'cancelled')
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Erreur mise à jour inventaire' }
    }
  }

  const { data, error } = await supabase
    .from('operations')
    .update({ ...opData, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) return { success: false, error: error.message }

  revalidatePath('/operations')
  revalidatePath(`/operations/${id}`)
  revalidatePath('/logistique')
  return { success: true, data: data as Operation }
}

async function releaseAllOpResources(
  operationId: string,
  userId: string,
  supabase: SupabaseClient<Database>,
  opStatus: 'completed' | 'cancelled' = 'cancelled'
): Promise<void> {
  const { data: reserved } = await supabase
    .from('op_resources')
    .select('id, item_id, quantity, item_name')
    .eq('operation_id', operationId)
    .eq('status', 'reserved')

  if (!reserved?.length) return

  const isCompleted = opStatus === 'completed'
  const withItem = reserved.filter((r): r is typeof r & { item_id: string } => r.item_id !== null)
  if (!withItem.length) return

  const itemIds = [...new Set(withItem.map((r) => r.item_id))]
  const now = new Date().toISOString()

  // 1. Un seul SELECT pour tous les stocks concernés
  const { data: stocks } = await supabase
    .from('inventory_stock')
    .select('item_id, quantity, reserved_quantity')
    .in('item_id', itemIds)

  const stockMap = new Map((stocks ?? []).map((s) => [s.item_id, s]))

  const validItems = withItem.filter((r) => stockMap.has(r.item_id))
  if (!validItems.length) return

  // 2. Un seul INSERT pour toutes les transactions
  const { error: txError } = await supabase.from('inventory_transactions').insert(
    validItems.map((res) => ({
      item_id: res.item_id,
      type: isCompleted ? ('withdrawal' as const) : ('release' as const),
      quantity: res.quantity,
      member_id: userId,
      operation_id: operationId,
      status: 'direct' as const,
      notes: isCompleted
        ? `Consommé — opération terminée (${res.item_name})`
        : `Libération — opération annulée (${res.item_name})`,
    }))
  )
  if (txError) throw new Error(`Échec transactions inventaire : ${txError.message}`)

  // 3. UPDATEs des stocks en parallèle (valeurs différentes par ligne — pas batchable via l'API REST)
  const stockResults = await Promise.all(
    validItems.map((res) => {
      const stock = stockMap.get(res.item_id)!
      if (isCompleted) {
        return supabase
          .from('inventory_stock')
          .update({
            quantity: Math.max(0, stock.quantity - res.quantity),
            reserved_quantity: Math.max(0, stock.reserved_quantity - res.quantity),
            updated_at: now,
            updated_by: userId,
          })
          .eq('item_id', res.item_id)
      }
      return supabase
        .from('inventory_stock')
        .update({
          reserved_quantity: Math.max(0, stock.reserved_quantity - res.quantity),
          updated_at: now,
          updated_by: userId,
        })
        .eq('item_id', res.item_id)
    })
  )
  const failedStock = stockResults.find((r) => r.error)
  if (failedStock?.error) throw new Error(`Échec mise à jour stock : ${failedStock.error.message}`)

  // 4. Mise à jour du statut des op_resources (déjà batchée)
  const newStatus = isCompleted ? 'utilized' : 'released'
  await supabase
    .from('op_resources')
    .update({ status: newStatus })
    .eq('operation_id', operationId)
    .eq('status', 'reserved')
}

export async function deleteOperation(id: string): Promise<ActionResult> {
  const { supabase, user, privilege } = await getAuthWithPrivilege()
  if (!user) return { success: false, error: 'Non authentifié' }
  if (privilege < 1000) return { success: false, error: 'Sage requis' }

  const { error } = await supabase.from('operations').delete().eq('id', id)
  if (error) return { success: false, error: error.message }

  revalidatePath('/operations')
  return { success: true, data: undefined }
}

// ─── Role slots ───────────────────────────────────────────────────────────────

export async function addRoleSlot(
  operationId: string,
  role: OpRoleSlot['role']
): Promise<ActionResult> {
  const { supabase, user, privilege } = await getAuthWithPrivilege()
  if (!user) return { success: false, error: 'Non authentifié' }
  if (privilege < 300) return { success: false, error: 'Privilege insuffisant' }

  const { error } = await supabase.from('op_role_slots').insert({ operation_id: operationId, role })
  if (error) return { success: false, error: error.message }

  revalidatePath(`/operations/${operationId}`)
  return { success: true, data: undefined }
}

export async function removeRoleSlot(slotId: string, operationId: string): Promise<ActionResult> {
  const { supabase, user, privilege } = await getAuthWithPrivilege()
  if (!user) return { success: false, error: 'Non authentifié' }
  if (privilege < 300) return { success: false, error: 'Privilege insuffisant' }

  const { error } = await supabase.from('op_role_slots').delete().eq('id', slotId)
  if (error) return { success: false, error: error.message }

  revalidatePath(`/operations/${operationId}`)
  return { success: true, data: undefined }
}

export async function assignSlot(
  slotId: string,
  profileId: string | null,
  operationId: string
): Promise<ActionResult> {
  const { supabase, user, privilege } = await getAuthWithPrivilege()
  if (!user) return { success: false, error: 'Non authentifié' }
  if (privilege < 300) return { success: false, error: 'Privilege insuffisant' }

  const { error } = await supabase
    .from('op_role_slots')
    .update({ assigned_profile_id: profileId })
    .eq('id', slotId)

  if (error) return { success: false, error: error.message }

  revalidatePath(`/operations/${operationId}`)
  return { success: true, data: undefined }
}

// ─── Inscriptions ─────────────────────────────────────────────────────────────

export async function registerForOperation(
  operationId: string,
  input: OpRegisterInput
): Promise<ActionResult> {
  const parsed = OpRegisterSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Données invalides' }
  }

  const { supabase, user } = await getAuthWithPrivilege()
  if (!user) return { success: false, error: 'Non authentifié' }

  const { error } = await supabase.from('op_registrations').upsert({
    operation_id: operationId,
    profile_id: user.id,
    preferred_role: parsed.data.preferred_role ?? null,
    notes: parsed.data.notes ?? null,
    status: 'pending',
  }, { onConflict: 'operation_id,profile_id' })

  if (error) return { success: false, error: error.message }

  void checkAndAwardOpBadges(user.id)
  revalidatePath(`/operations/${operationId}`)
  return { success: true, data: undefined }
}

export async function unregisterFromOperation(operationId: string): Promise<ActionResult> {
  const { supabase, user } = await getAuthWithPrivilege()
  if (!user) return { success: false, error: 'Non authentifié' }

  const { error } = await supabase
    .from('op_registrations')
    .delete()
    .eq('operation_id', operationId)
    .eq('profile_id', user.id)

  if (error) return { success: false, error: error.message }

  revalidatePath(`/operations/${operationId}`)
  return { success: true, data: undefined }
}

// ─── Ressources opération ────────────────────────────────────────────────────

export async function addOperationResource(
  operationId: string,
  input: {
    item_id?: string | null
    item_name: string
    quantity: number
    unit: string
    notes?: string
  }
): Promise<ActionResult<OpResource>> {
  const { supabase, user, privilege } = await getAuthWithPrivilege()
  if (!user) return { success: false, error: 'Non authentifié' }
  if (privilege < 300) return { success: false, error: 'Privilege insuffisant (Gardien requis)' }
  if (!input.item_name.trim()) return { success: false, error: 'Nom de ressource requis' }
  if (!Number.isInteger(input.quantity) || input.quantity <= 0) return { success: false, error: 'Quantité invalide' }

  let status: 'reserved' | 'pending_request' = 'pending_request'
  let transactionId: string | null = null

  if (input.item_id) {
    const { data: result, error: rpcErr } = await supabase.rpc('try_reserve_inventory', {
      p_item_id:      input.item_id,
      p_quantity:     input.quantity,
      p_operation_id: operationId,
      p_member_id:    user.id,
    })
    if (rpcErr) return { success: false, error: rpcErr.message }

    const reservation = result as { reserved: boolean; transaction_id: string | null }
    if (reservation.reserved) {
      transactionId = reservation.transaction_id
      status = 'reserved'
    }
  }

  const { data, error } = await supabase
    .from('op_resources')
    .insert({
      operation_id: operationId,
      item_id: input.item_id ?? null,
      item_name: input.item_name.trim(),
      quantity: input.quantity,
      unit: input.unit,
      status,
      transaction_id: transactionId,
      requested_by: user.id,
      notes: input.notes?.trim() || null,
    })
    .select()
    .single()

  if (error) return { success: false, error: error.message }

  revalidatePath(`/operations/${operationId}`)
  revalidatePath('/logistique')
  return { success: true, data: data as OpResource }
}

export async function removeOperationResource(
  resourceId: string,
  operationId: string
): Promise<ActionResult> {
  const { supabase, user, privilege } = await getAuthWithPrivilege()
  if (!user) return { success: false, error: 'Non authentifié' }
  if (privilege < 300) return { success: false, error: 'Privilege insuffisant (Gardien requis)' }

  const { data: res } = await supabase
    .from('op_resources')
    .select('*')
    .eq('id', resourceId)
    .single()

  if (!res) return { success: false, error: 'Ressource introuvable' }

  if (res.status === 'reserved' && res.item_id) {
    const { data: stock } = await supabase
      .from('inventory_stock')
      .select('reserved_quantity')
      .eq('item_id', res.item_id)
      .single()

    if (stock) {
      await supabase.from('inventory_transactions').insert({
        item_id: res.item_id,
        type: 'release',
        quantity: res.quantity,
        member_id: user.id,
        operation_id: operationId,
        status: 'direct',
        notes: 'Libération — ressource retirée de l\'opération',
      })

      await supabase
        .from('inventory_stock')
        .update({
          reserved_quantity: Math.max(0, stock.reserved_quantity - res.quantity),
          updated_at: new Date().toISOString(),
          updated_by: user.id,
        })
        .eq('item_id', res.item_id)
    }
  }

  const { error } = await supabase.from('op_resources').delete().eq('id', resourceId)
  if (error) return { success: false, error: error.message }

  revalidatePath(`/operations/${operationId}`)
  revalidatePath('/logistique')
  return { success: true, data: undefined }
}

export async function fulfillPendingResource(resourceId: string): Promise<ActionResult> {
  const { supabase, user, privilege } = await getAuthWithPrivilege()
  if (!user) return { success: false, error: 'Non authentifié' }
  if (privilege < 300) return { success: false, error: 'Privilege insuffisant (Gardien requis)' }

  const { data: res } = await supabase
    .from('op_resources')
    .select('*')
    .eq('id', resourceId)
    .single()

  if (!res) return { success: false, error: 'Demande introuvable' }
  if (res.status !== 'pending_request') return { success: false, error: 'Cette demande n\'est plus en attente' }

  if (res.item_id) {
    const { data: stock } = await supabase
      .from('inventory_stock')
      .select('quantity, reserved_quantity')
      .eq('item_id', res.item_id)
      .single()

    if (!stock) return { success: false, error: 'Stock introuvable' }

    const available = stock.quantity - stock.reserved_quantity
    if (available < res.quantity) {
      return { success: false, error: `Stock insuffisant — ${available} disponible(s), ${res.quantity} demandé(s)` }
    }

    const { data: tx, error: txErr } = await supabase
      .from('inventory_transactions')
      .insert({
        item_id: res.item_id,
        type: 'reservation',
        quantity: res.quantity,
        member_id: user.id,
        operation_id: res.operation_id,
        status: 'direct',
        notes: `Approbation demande ressource — ${res.item_name}`,
      })
      .select('id')
      .single()

    if (txErr) return { success: false, error: txErr.message }

    await supabase
      .from('inventory_stock')
      .update({
        reserved_quantity: stock.reserved_quantity + res.quantity,
        updated_at: new Date().toISOString(),
        updated_by: user.id,
      })
      .eq('item_id', res.item_id)

    await supabase
      .from('op_resources')
      .update({ status: 'reserved', transaction_id: tx.id })
      .eq('id', resourceId)
  } else {
    // Demande libre (sans item inventaire) : marquée comme traitée manuellement
    await supabase
      .from('op_resources')
      .update({ status: 'reserved' })
      .eq('id', resourceId)
  }

  revalidatePath('/logistique')
  revalidatePath(`/operations/${res.operation_id}`)
  return { success: true, data: undefined }
}

export async function rejectPendingResource(resourceId: string): Promise<ActionResult> {
  const { supabase, user, privilege } = await getAuthWithPrivilege()
  if (!user) return { success: false, error: 'Non authentifié' }
  if (privilege < 300) return { success: false, error: 'Privilege insuffisant (Gardien requis)' }

  const { data: res } = await supabase
    .from('op_resources')
    .select('operation_id')
    .eq('id', resourceId)
    .single()

  if (!res) return { success: false, error: 'Demande introuvable' }

  const { error } = await supabase
    .from('op_resources')
    .delete()
    .eq('id', resourceId)

  if (error) return { success: false, error: error.message }

  revalidatePath('/logistique')
  revalidatePath(`/operations/${res.operation_id}`)
  return { success: true, data: undefined }
}

export async function getPendingOpResources(): Promise<ActionResult<OpResourceWithOp[]>> {
  const { supabase, user } = await getAuthWithPrivilege()
  if (!user) return { success: false, error: 'Non authentifié' }

  const { data, error } = await supabase
    .from('op_resources')
    .select('*, operation:operations(id,title,status), item:inventory_items(name,type)')
    .eq('status', 'pending_request')
    .order('created_at', { ascending: false })

  if (error) return { success: false, error: error.message }
  return { success: true, data: data as unknown as OpResourceWithOp[] }
}

export async function saveOperationDebrief(id: string, debrief: string): Promise<ActionResult> {
  const { supabase, user, privilege } = await getAuthWithPrivilege()
  if (!user) return { success: false, error: 'Non authentifié' }
  if (privilege < 300) return { success: false, error: 'Privilege insuffisant (Gardien requis)' }

  const { error } = await supabase
    .from('operations')
    .update({ debrief: debrief.trim() || null })
    .eq('id', id)

  if (error) return { success: false, error: error.message }

  if (debrief.trim()) void awardBadge(user.id, 'first_debrief')
  revalidatePath(`/operations/${id}`)
  revalidatePath('/operations')
  return { success: true, data: undefined }
}

export async function updateRegistrationStatus(
  registrationId: string,
  status: 'confirmed' | 'rejected',
  operationId: string
): Promise<ActionResult> {
  const { supabase, user, privilege } = await getAuthWithPrivilege()
  if (!user) return { success: false, error: 'Non authentifié' }
  if (privilege < 300) return { success: false, error: 'Privilege insuffisant' }

  const { error } = await supabase
    .from('op_registrations')
    .update({ status })
    .eq('id', registrationId)

  if (error) return { success: false, error: error.message }

  revalidatePath(`/operations/${operationId}`)
  return { success: true, data: undefined }
}
