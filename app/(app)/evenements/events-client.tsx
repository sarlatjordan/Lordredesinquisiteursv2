'use client'

import { useState, useTransition } from 'react'
import { motion } from 'framer-motion'
import { Plus, CalendarDays } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { EventCard } from '@/components/evenements/event-card'
import { EventForm } from '@/components/evenements/event-form'
import { EventDetailDialog } from '@/components/evenements/event-detail-dialog'
import { EventViewDialog } from '@/components/evenements/event-view-dialog'
import { createEvent, registerForEvent, unregisterFromEvent } from '@/actions/events'
import type { EventWithDetails } from '@/types'
import { useRouter } from 'next/navigation'

interface EventsClientProps {
  upcomingEvents: EventWithDetails[]
  pastEvents: EventWithDetails[]
  currentUserId?: string
  canCreate?: boolean
  canManage?: boolean
  canDiscordSync?: boolean
  canCreateOp?: boolean
}

export function EventsClient({ upcomingEvents, pastEvents, currentUserId, canCreate = false, canManage = false, canDiscordSync = false, canCreateOp = false }: EventsClientProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [managedEvent, setManagedEvent] = useState<EventWithDetails | null>(null)
  const [viewedEvent, setViewedEvent] = useState<EventWithDetails | null>(null)
  const [createError, setCreateError] = useState<string | null>(null)
  const [registerError, setRegisterError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleCreateEvent(data: import('@/components/evenements/event-form').EventFormData) {
    setCreateError(null)
    const { sendToDiscord, createOperation, ...eventInput } = data
    startTransition(async () => {
      const result = await createEvent(eventInput, { sendToDiscord, createOperation })
      if (result.success) {
        setIsCreateOpen(false)
        router.refresh()
      } else {
        setCreateError(result.error)
      }
    })
  }

  function handleRegister(eventId: string, status: 'confirme' | 'peut_etre') {
    setRegisterError(null)
    startTransition(async () => {
      const result = await registerForEvent(eventId, status)
      if (!result.success) { setRegisterError(result.error); return }
      router.refresh()
    })
  }

  function handleUnregister(eventId: string) {
    setRegisterError(null)
    startTransition(async () => {
      const result = await unregisterFromEvent(eventId)
      if (!result.success) { setRegisterError(result.error); return }
      router.refresh()
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Événements</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {upcomingEvents.length} événement{upcomingEvents.length > 1 ? 's' : ''} à venir
          </p>
        </div>

        {canCreate && (
          <Dialog open={isCreateOpen} onOpenChange={(v) => { setIsCreateOpen(v); if (!v) setCreateError(null) }}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5">
                <Plus className="h-4 w-4" />
                Nouvel événement
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Créer un événement</DialogTitle>
                <DialogDescription>Planifiez une opération, réunion ou activité pour l&apos;Ordre.</DialogDescription>
              </DialogHeader>
              <EventForm
                onSubmit={handleCreateEvent}
                isPending={isPending}
                onCancel={() => setIsCreateOpen(false)}
                serverError={createError}
                canDiscordSync={canDiscordSync}
                canCreateOp={canCreateOp}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {registerError && (
        <div className="rounded-md bg-destructive/10 border border-destructive/30 px-3 py-2">
          <p className="text-xs text-destructive">{registerError}</p>
        </div>
      )}

      <Tabs defaultValue="upcoming">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="upcoming">
            À venir ({upcomingEvents.length})
          </TabsTrigger>
          <TabsTrigger value="past">
            Passés ({pastEvents.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-4">
          {upcomingEvents.length === 0 ? (
            <EmptyState message="Aucun événement planifié" />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {upcomingEvents.map((event, i) => (
                <EventCard
                  key={event.id}
                  event={event}
                  currentUserId={currentUserId}
                  isOrganizer={canManage}
                  onRegister={handleRegister}
                  onUnregister={handleUnregister}
                  onManage={canManage ? setManagedEvent : undefined}
                  onView={setViewedEvent}
                  index={i}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="past" className="mt-4">
          {pastEvents.length === 0 ? (
            <EmptyState message="Aucun événement passé" />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {pastEvents.map((event, i) => (
                <EventCard
                  key={event.id}
                  event={event}
                  currentUserId={currentUserId}
                  isOrganizer={canManage}
                  onManage={canManage ? setManagedEvent : undefined}
                  onView={setViewedEvent}
                  index={i}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <EventDetailDialog
        event={managedEvent}
        open={managedEvent !== null}
        onClose={() => setManagedEvent(null)}
      />
      <EventViewDialog
        event={viewedEvent}
        open={viewedEvent !== null}
        onClose={() => setViewedEvent(null)}
      />
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center gap-3 py-16 text-center"
    >
      <CalendarDays className="h-10 w-10 text-muted-foreground/40" />
      <p className="text-muted-foreground">{message}</p>
    </motion.div>
  )
}
