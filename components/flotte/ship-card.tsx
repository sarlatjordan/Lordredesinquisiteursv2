'use client'

import { useState, useTransition, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Rocket, Users, Shield, Trash2, Loader2, ShoppingBag, Pencil, Check, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { SHIP_TYPES, SHIP_STATUS, SHIP_STATUS_COLORS, type ShipType, type ShipStatus } from '@/lib/constants'
import { getInitials } from '@/lib/utils'
import { deleteShip, updateShipName } from '@/actions/ships'
import { useRouter } from 'next/navigation'
import { MarkdownContent } from '@/components/ui/markdown-content'
import type { ShipWithOwner } from '@/types'

interface ShipCardProps {
  ship: ShipWithOwner
  index?: number
  currentUserId?: string
  isAdmin?: boolean
  imageUrl?: string | null
}

export function ShipCard({ ship, index = 0, currentUserId, isAdmin, imageUrl }: ShipCardProps) {
  const [confirm, setConfirm] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [deleted, setDeleted] = useState(false)

  const [editing, setEditing] = useState(false)
  const [nameInput, setNameInput] = useState(ship.name)
  const [nameError, setNameError] = useState('')
  const [isSavingName, startNameTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)

  const router = useRouter()

  const canDelete = isAdmin || ship.owner_id === currentUserId
  const canEdit   = isAdmin || ship.owner_id === currentUserId

  function handleDelete() {
    startTransition(async () => {
      const res = await deleteShip(ship.id)
      if (res.success) {
        setDeleted(true)
        router.refresh()
      }
    })
  }

  function startEdit() {
    setNameInput(ship.name)
    setNameError('')
    setEditing(true)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  function cancelEdit() {
    setEditing(false)
    setNameInput(ship.name)
    setNameError('')
  }

  function saveName() {
    const trimmed = nameInput.trim()
    if (trimmed.length < 2) { setNameError('Minimum 2 caractères'); return }
    if (trimmed.length > 100) { setNameError('Maximum 100 caractères'); return }
    startNameTransition(async () => {
      const res = await updateShipName(ship.id, trimmed)
      if (res.success) {
        setEditing(false)
        router.refresh()
      } else {
        setNameError(res.error)
      }
    })
  }

  if (deleted) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.04 }}
      className="group rounded-lg border border-border bg-card hover:border-primary/20 transition-colors overflow-hidden"
    >
      {/* Bannière image */}
      {imageUrl ? (
        <div className="relative h-36">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={ship.model}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-card/90 via-card/30 to-transparent" />
          {ship.is_org_ship && (
            <div className="absolute top-2 right-2">
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-primary border-primary/30 bg-primary/10 backdrop-blur-sm">
                <Shield className="h-2.5 w-2.5 mr-0.5" />
                Org
              </Badge>
            </div>
          )}
        </div>
      ) : null}

      {/* Contenu */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          {!imageUrl && (
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 border border-primary/20 shrink-0">
              <Rocket className="h-6 w-6 text-primary" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2 flex-wrap">
              {editing ? (
                <div className="flex items-center gap-1 flex-1">
                  <input
                    ref={inputRef}
                    type="text"
                    value={nameInput}
                    onChange={e => { setNameInput(e.target.value); setNameError('') }}
                    onKeyDown={e => {
                      if (e.key === 'Enter') saveName()
                      if (e.key === 'Escape') cancelEdit()
                    }}
                    maxLength={100}
                    className="flex-1 min-w-0 text-sm font-semibold bg-muted/50 border border-primary/30 rounded px-2 py-0.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                  />
                  <button
                    onClick={saveName}
                    disabled={isSavingName}
                    aria-label="Confirmer le nom"
                    className="text-primary hover:text-primary/80 p-0.5 rounded"
                  >
                    {isSavingName ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  </button>
                  <button
                    onClick={cancelEdit}
                    disabled={isSavingName}
                    aria-label="Annuler"
                    className="text-muted-foreground hover:text-foreground p-0.5 rounded"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate flex-1">
                    {ship.name}
                  </p>
                  {canEdit && !confirm && (
                    <button
                      onClick={startEdit}
                      aria-label="Modifier le nom du vaisseau"
                      className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 text-muted-foreground hover:text-foreground p-0.5 rounded"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  )}
                </>
              )}

              {ship.is_org_ship && !imageUrl && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-primary border-primary/30 bg-primary/10 shrink-0">
                  <Shield className="h-2.5 w-2.5 mr-0.5" />
                  Org
                </Badge>
              )}
              {canDelete && !confirm && !editing && (
                <button
                  onClick={() => setConfirm(true)}
                  aria-label="Supprimer ce vaisseau"
                  className="opacity-0 group-hover:opacity-100 transition-opacity ml-auto shrink-0 text-muted-foreground hover:text-destructive p-0.5 rounded"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {nameError && (
              <p className="text-[11px] text-destructive mt-0.5">{nameError}</p>
            )}

            <p className="text-xs text-muted-foreground mt-0.5">
              {ship.model}
              {ship.manufacturer ? ` — ${ship.manufacturer}` : ''}
            </p>

            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <Badge
                variant="outline"
                className={`text-[10px] px-1.5 py-0 ${SHIP_STATUS_COLORS[ship.status as ShipStatus]}`}
              >
                {SHIP_STATUS[ship.status as ShipStatus]}
              </Badge>
              <span className="text-xs text-muted-foreground capitalize">
                {SHIP_TYPES[ship.ship_type as ShipType]}
              </span>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Users className="h-3 w-3" />
                {ship.crew_size}
              </span>
              {ship.purchased_in_game && (
                <Badge
                  variant="outline"
                  className="text-[10px] px-1.5 py-0 text-green-400 border-green-400/30 bg-green-400/10 flex items-center gap-0.5"
                  title="Acheté en jeu avec des UEC"
                >
                  <ShoppingBag className="h-2.5 w-2.5" />
                  Achat IG
                </Badge>
              )}
            </div>
          </div>
        </div>

        {ship.owner && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
            <Avatar className="h-5 w-5 border border-border">
              <AvatarImage src={ship.owner.avatar_url ?? undefined} />
              <AvatarFallback className="text-[9px] bg-primary/10 text-primary">
                {getInitials(ship.owner.display_name ?? ship.owner.username)}
              </AvatarFallback>
            </Avatar>
            <p className="text-xs text-muted-foreground">
              {ship.owner.display_name ?? ship.owner.username}
            </p>
          </div>
        )}

        {ship.notes && (
          <div className="text-xs text-muted-foreground mt-2 pt-2 border-t border-border line-clamp-2">
            <MarkdownContent inline>{ship.notes}</MarkdownContent>
          </div>
        )}

        <AnimatePresence>
          {confirm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 pt-3 border-t border-destructive/20 flex items-center justify-between gap-2"
            >
              <p className="text-xs text-muted-foreground">Supprimer <span className="text-foreground font-medium">{ship.name}</span> ?</p>
              <div className="flex gap-1.5 shrink-0">
                <button
                  onClick={() => setConfirm(false)}
                  disabled={isPending}
                  className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isPending}
                  className="flex items-center gap-1 text-xs text-white bg-destructive hover:bg-destructive/90 px-2 py-1 rounded transition-colors"
                >
                  {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                  Supprimer
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
