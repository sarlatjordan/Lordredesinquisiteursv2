'use client'

import { useState, useTransition } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ShipForm } from './ship-form'
import { createShip } from '@/actions/ships'
import { useRouter } from 'next/navigation'
import type { ShipCreateInput } from '@/types'

export function AddShipButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  async function handleCreate(data: ShipCreateInput) {
    startTransition(async () => {
      const result = await createShip(data)
      if (result.success) {
        setIsOpen(false)
        router.refresh()
      }
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" />
          Ajouter un vaisseau
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Ajouter un vaisseau</DialogTitle>
          <DialogDescription>Enregistrez un vaisseau dans la flotte de l&apos;Ordre.</DialogDescription>
        </DialogHeader>
        <ShipForm
          onSubmit={handleCreate}
          isPending={isPending}
          onCancel={() => setIsOpen(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
