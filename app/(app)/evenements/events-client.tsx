'use client'

import { useState, useTransition } from 'react'
import { motion } from 'framer-motion'
import { Plus, CalendarDays, LayoutGrid, Rows3, Target, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { EventCard } from '@/components/evenements/event-card'
import { EventForm } from '@/components/evenements/event-form'
import { EventDetailDialog } from '@/components/evenements/event-detail-dialog'
import { EventViewDialog } from '@/components/evenements/event-view-dialog'
import { CalendarMonthView } from '@/components/evenements/calendar-month-view'
import { CalendarWeekView } from '@/components/evenements/calendar-week-view'
import { createEvent, registerForEvent, unregisterFromEvent } from '@/actions/events'
import { AvailabilityTips } from '@/components/ui/availability-tips'
import type { EventWithDetails } from '@/types'
import { useRouter } from 'next/navigation'

type ViewMode = 'mois' | 'semaine' | 'liste'

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
  const [viewMode, setViewMode] = useState<ViewMode>('mois')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [managedEvent, setManagedEvent] = useState<EventWithDetails | null>(null)
  const [viewedEvent, setViewedEvent] = useState<EventWithDetails | null>(null)
  const [createError, setCreateError] = useState<string | null>(null)
  const [registerError, setRegisterError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const allEvents = [...upcomingEvents, ...pastEvents].sort(
    (a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime()
  )

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
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-2xl font-bold text-foreground">Événements</h2>
            <Link
              href="/operations"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-primary/30 bg-primary/5 text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
            >
              <Target className="h-3 w-3" />
              Opérations
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {upcomingEvents.length} à venir · {allEvents.length} total
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center rounded-md border border-border bg-card/60 p-0.5 gap-0.5">
            <button
              onClick={() => setViewMode('mois')}
              title="Vue mensuelle"
              className={[
                'flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-colors',
                viewMode === 'mois'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent',
              ].join(' ')}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Mois
            </button>
            <button
              onClick={() => setViewMode('semaine')}
              title="Vue hebdomadaire"
              className={[
                'flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-colors',
                viewMode === 'semaine'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent',
              ].join(' ')}
            >
              <Rows3 className="h-3.5 w-3.5" />
              Semaine
            </button>
            <button
              onClick={() => setViewMode('liste')}
              title="Vue liste"
              className={[
                'flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-colors',
                viewMode === 'liste'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent',
              ].join(' ')}
            >
              <CalendarDays className="h-3.5 w-3.5" />
              Liste
            </button>
          </div>

          {canCreate && (
            <AvailabilityTips open={isCreateOpen} />
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
      </div>

      {registerError && (
        <div className="rounded-md bg-destructive/10 border border-destructive/30 px-3 py-2">
          <p className="text-xs text-destructive">{registerError}</p>
        </div>
      )}

      {/* Views */}
      {viewMode === 'mois' && (
        <CalendarMonthView
          events={allEvents}
          canManage={canManage}
          onViewEvent={setViewedEvent}
          onManageEvent={setManagedEvent}
        />
      )}

      {viewMode === 'semaine' && (
        <CalendarWeekView
          events={allEvents}
          canManage={canManage}
          onViewEvent={setViewedEvent}
          onManageEvent={setManagedEvent}
        />
      )}

      {viewMode === 'liste' && (
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
      )}

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
