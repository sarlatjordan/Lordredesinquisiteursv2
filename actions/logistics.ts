'use server'

import { revalidatePath } from 'next/cache'
import { getAuthWithPrivilege } from '@/lib/auth-helpers'
import {
  InventoryItemSchema,
  type InventoryItemInput,
  type ActionResult,
  type InventoryItem,
  type InventoryTransaction,
} from '@/types'


export async function createInventoryItem(
  input: InventoryItemInput
): Promise<ActionResult<InventoryItem>> {
  const { supabase, user, privilege } = await getAuthWithPrivilege()
  if (!user) return { success: false, error: 'Non authentifié' }
  if (privilege < 300) return { success: false, error: 'Gardien requis' }

  const parsed = InventoryItemSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Données invalides' }

  const { data, error } = await supabase
    .from('inventory_items')
    .insert({ ...parsed.data, created_by: user.id })
    .select()
    .single()

  if (error) return { success: false, error: error.message }
  revalidatePath('/logistique')
  return { success: true, data: data as InventoryItem }
}

export async function updateInventoryItem(
  id: string,
  input: InventoryItemInput
): Promise<ActionResult<InventoryItem>> {
  const { supabase, user, privilege } = await getAuthWithPrivilege()
  if (!user) return { success: false, error: 'Non authentifié' }
  if (privilege < 300) return { success: false, error: 'Gardien requis' }

  const parsed = InventoryItemSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Données invalides' }

  const { data, error } = await supabase
    .from('inventory_items')
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) return { success: false, error: error.message }
  revalidatePath('/logistique')
  revalidatePath(`/logistique/${id}`)
  return { success: true, data: data as InventoryItem }
}

export async function deleteInventoryItem(id: string): Promise<ActionResult> {
  const { supabase, user, privilege } = await getAuthWithPrivilege()
  if (!user) return { success: false, error: 'Non authentifié' }
  if (privilege < 1000) return { success: false, error: 'Sage requis' }

  const { error } = await supabase.from('inventory_items').delete().eq('id', id)
  if (error) return { success: false, error: error.message }
  revalidatePath('/logistique')
  return { success: true, data: undefined }
}

// Membre soumet une demande de dépôt ou retrait (workflow approbation)
export async function submitTransaction(
  itemId: string,
  type: 'deposit' | 'withdrawal',
  quantity: number,
  notes?: string
): Promise<ActionResult<InventoryTransaction>> {
  const { supabase, user } = await getAuthWithPrivilege()
  if (!user) return { success: false, error: 'Non authentifié' }

  if (!Number.isInteger(quantity) || quantity <= 0) {
    return { success: false, error: 'Quantité invalide' }
  }

  const { data, error } = await supabase
    .from('inventory_transactions')
    .insert({
      item_id: itemId,
      type,
      quantity,
      member_id: user.id,
      notes: notes?.trim() || null,
      status: 'pending',
    })
    .select()
    .single()

  if (error) return { success: false, error: error.message }
  revalidatePath(`/logistique/${itemId}`)
  return { success: true, data: data as InventoryTransaction }
}

// Gardien+ : ajustement direct sans workflow (deposit/withdrawal/reservation/release)
export async function directAdjust(
  itemId: string,
  type: 'deposit' | 'withdrawal' | 'reservation' | 'release',
  quantity: number,
  notes?: string,
  operationId?: string
): Promise<ActionResult> {
  const { supabase, user, privilege } = await getAuthWithPrivilege()
  if (!user) return { success: false, error: 'Non authentifié' }
  if (privilege < 300) return { success: false, error: 'Gardien requis' }

  if (!Number.isInteger(quantity) || quantity <= 0) {
    return { success: false, error: 'Quantité invalide' }
  }

  const { data: stock } = await supabase
    .from('inventory_stock')
    .select('quantity, reserved_quantity')
    .eq('item_id', itemId)
    .single()

  if (!stock) return { success: false, error: 'Item introuvable' }

  const available = stock.quantity - stock.reserved_quantity

  if (type === 'withdrawal' && quantity > available) {
    return { success: false, error: `Stock disponible insuffisant (${available} dispo.)` }
  }
  if (type === 'reservation' && quantity > available) {
    return { success: false, error: `Stock disponible insuffisant pour réserver (${available} dispo.)` }
  }
  if (type === 'release' && quantity > stock.reserved_quantity) {
    return { success: false, error: `Réservation insuffisante (${stock.reserved_quantity} réservés)` }
  }

  // Log de la transaction
  const { error: txError } = await supabase
    .from('inventory_transactions')
    .insert({
      item_id: itemId,
      type,
      quantity,
      member_id: user.id,
      operation_id: operationId ?? null,
      notes: notes?.trim() || null,
      status: 'direct',
    })
  if (txError) return { success: false, error: txError.message }

  // Mise à jour stock
  let newQuantity = stock.quantity
  let newReserved = stock.reserved_quantity
  if (type === 'deposit')     newQuantity += quantity
  if (type === 'withdrawal')  newQuantity -= quantity
  if (type === 'reservation') newReserved += quantity
  if (type === 'release')     newReserved -= quantity

  const { error: stockError } = await supabase
    .from('inventory_stock')
    .update({
      quantity: newQuantity,
      reserved_quantity: newReserved,
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    })
    .eq('item_id', itemId)

  if (stockError) return { success: false, error: stockError.message }

  revalidatePath(`/logistique/${itemId}`)
  revalidatePath('/logistique')
  return { success: true, data: undefined }
}

// Gardien+ : approuver ou refuser une transaction en attente
export async function processTransaction(
  transactionId: string,
  itemId: string,
  approve: boolean
): Promise<ActionResult> {
  const { supabase, user, privilege } = await getAuthWithPrivilege()
  if (!user) return { success: false, error: 'Non authentifié' }
  if (privilege < 300) return { success: false, error: 'Gardien requis' }

  const { data: tx } = await supabase
    .from('inventory_transactions')
    .select('type, quantity, status')
    .eq('id', transactionId)
    .single()

  if (!tx) return { success: false, error: 'Transaction introuvable' }
  if (tx.status !== 'pending') return { success: false, error: 'Transaction déjà traitée' }

  const now = new Date().toISOString()

  if (!approve) {
    const { error } = await supabase
      .from('inventory_transactions')
      .update({ status: 'rejected', approved_by: user.id, approved_at: now })
      .eq('id', transactionId)
    if (error) return { success: false, error: error.message }
    revalidatePath(`/logistique/${itemId}`)
    return { success: true, data: undefined }
  }

  const { data: result, error: rpcErr } = await supabase.rpc('approve_inventory_transaction', {
    p_transaction_id: transactionId,
    p_approved_by:    user.id,
  })
  if (rpcErr) return { success: false, error: rpcErr.message }
  if (!result) return { success: false, error: 'Réponse vide du serveur' }

  const approval = result as { success: boolean; error?: string | null }
  if (!approval.success) return { success: false, error: approval.error ?? 'Erreur inconnue' }

  revalidatePath(`/logistique/${itemId}`)
  revalidatePath('/logistique')
  return { success: true, data: undefined }
}
