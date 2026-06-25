'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Trash2, Plus, FileText, Users, Pencil, CalendarPlus, ExternalLink } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { MarkdownEditor } from '@/components/ui/markdown-editor'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { EventForm, type EventFormData } from './event-form'
import {
  updateEvent,
  getEventAttendees,
  getOrgMembers,
  addAttendeeByOrganizer,
  removeAttendeeByOrganizer,
  saveEventReport,
} from '@/actions/events'
import { ROLES, ROLE_PRIVILEGES, type Role } from '@/lib/constants'
import type { EventWithDetails, AttendeeWithProfile, Profile } from '@/types'
import { buildGoogleCalendarUrl } from '@/lib/utils'

interface EventDetailDialogProps {
  event: EventWithDetails | null
  open: boolean
  onClose: () => void
}

function toDatetimeLocal(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  const offset = d.getTimezoneOffset()
  return new Date(d.getTime() - offset * 60000).toISOString().slice(0, 16)
}

export function EventDetailDialog({ event, open, onClose }: EventDetailDialogProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [attendees, setAttendees] = useState<AttendeeWithProfile[]>([])
  const [members, setMembers] = useState<Pick<Profile, 'id' | 'username' | 'display_name' | 'role'>[]>([])
  const [loadingData, setLoadingData] = useState(false)
  const [selectedMemberId, setSelectedMemberId] = useState('')
  const [addStatus, setAddStatus] = useState<'confirme' | 'peut_etre'>('confirme')
  const [report, setReport] = useState('')
  const [editError, setEditError] = useState<string | null>(null)
  const [participantError, setParticipantError] = useState<string | null>(null)
  const [reportSaved, setReportSaved] = useState(false)
  const [reportError, setReportError] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !event) return
    setReport(event.report ?? '')
    setEditError(null)
    setParticipantError(null)
    setReportSaved(false)
    setReportError(null)
    setSelectedMemberId('')

    setLoadingData(true)
    Promise.all([getEventAttendees(event.id), getOrgMembers()]).then(
      ([attendeesRes, membersRes]) => {
        if (attendeesRes.success) setAttendees(attendeesRes.data)
        if (membersRes.success) setMembers(membersRes.data)
        setLoadingData(false)
      }
    )
  }, [open, event])

  if (!event) return null

  const availableMembers = members.filter(
    (m) => !attendees.some((a) => a.profile_id === m.id)
  )

  function handleEdit(data: EventFormData) {
    setEditError(null)
    startTransition(async () => {
      const result = await updateEvent(event!.id, {
        ...data,
        status: data.status ?? event!.status as 'planned' | 'active' | 'completed' | 'cancelled',
      })
      if (result.success) {
        router.refresh()
        onClose()
      } else {
        setEditError(result.error)
      }
    })
  }

  function handleAddAttendee() {
    if (!selectedMemberId) return
    setParticipantError(null)
    startTransition(async () => {
      const result = await addAttendeeByOrganizer(event!.id, selectedMemberId, addStatus)
      if (result.success) {
        const [attendeesRes] = await Promise.all([getEventAttendees(event!.id)])
        if (attendeesRes.success) setAttendees(attendeesRes.data)
        setSelectedMemberId('')
        router.refresh()
      } else {
        setParticipantError(result.error)
      }
    })
  }

  function handleRemoveAttendee(profileId: string) {
    setParticipantError(null)
    startTransition(async () => {
      const result = await removeAttendeeByOrganizer(event!.id, profileId)
      if (result.success) {
        setAttendees((prev) => prev.filter((a) => a.profile_id !== profileId))
        router.refresh()
      } else {
        setParticipantError(result.error)
      }
    })
  }

  function handleSaveReport() {
    setReportSaved(false)
    setReportError(null)
    startTransition(async () => {
      const result = await saveEventReport(event!.id, report)
      if (result.success) {
        setReportSaved(true)
        router.refresh()
      } else {
        setReportError(result.error)
      }
    })
  }

  const statusLabels: Record<string, string> = {
    confirme: 'Confirmé',
    peut_etre: 'Peut-être',
    absent: 'Absent',
  }
  const statusColors: Record<string, string> = {
    confirme: 'text-green-400 bg-green-400/10 border-green-400/30',
    peut_etre: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
    absent: 'text-muted-foreground bg-muted/50 border-border',
  }

  const roleLabels: Record<string, string> = {}
  ;(Object.entries(ROLE_PRIVILEGES) as [Role, number][]).forEach(([role]) => {
    roleLabels[role] = ROLES[role]
  })

  const editDefaultValues = {
    title: event.title,
    description: event.description ?? '',
    type: event.type as 'operation' | 'reunion' | 'formation' | 'social' | 'sortie' | 'autre',
    status: event.status as 'planned' | 'active' | 'completed' | 'cancelled',
    start_at: toDatetimeLocal(event.start_at),
    end_at: toDatetimeLocal(event.end_at),
    location: event.location ?? '',
    max_attendees: event.max_attendees ? String(event.max_attendees) : '',
    min_privilege: String(event.min_privilege ?? 0),
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="pr-6">{event.title}</DialogTitle>
          <DialogDescription>Gestion de l&apos;événement — édition, participants et rapport</DialogDescription>
        </DialogHeader>

        {event.status !== 'cancelled' && event.status !== 'completed' && (
          <div className="flex flex-wrap gap-2 -mt-1">
            <a
              href={buildGoogleCalendarUrl(event)}
              target="_blank"
              rel="noopener noreferrer"
              className="self-start inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary border border-border rounded-md px-2.5 py-1.5 transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Ajouter à Google Agenda
            </a>
            <a
              href={`/api/evenements/${event.id}/ics`}
              download
              className="self-start inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-border rounded-md px-2.5 py-1.5 transition-colors"
            >
              <CalendarPlus className="h-3.5 w-3.5" />
              Télécharger .ics
            </a>
          </div>
        )}

        <Tabs defaultValue="edit" className="mt-2">
          <TabsList className="bg-muted/50 w-full">
            <TabsTrigger value="edit" className="flex-1 gap-1.5">
              <Pencil className="h-3.5 w-3.5" />
              Éditer
            </TabsTrigger>
            <TabsTrigger value="participants" className="flex-1 gap-1.5">
              <Users className="h-3.5 w-3.5" />
              Participants ({attendees.length})
            </TabsTrigger>
            <TabsTrigger value="report" className="flex-1 gap-1.5">
              <FileText className="h-3.5 w-3.5" />
              Rapport
            </TabsTrigger>
          </TabsList>

          {/* ─── Onglet Éditer ─── */}
          <TabsContent value="edit" className="mt-4">
            <EventForm
              onSubmit={handleEdit}
              isPending={isPending}
              onCancel={onClose}
              defaultValues={editDefaultValues}
              submitLabel="Enregistrer les modifications"
              showStatus
              serverError={editError}
            />
          </TabsContent>

          {/* ─── Onglet Participants ─── */}
          <TabsContent value="participants" className="mt-4 space-y-4">
            {loadingData ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                {attendees.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">Aucun participant inscrit</p>
                ) : (
                  <ul className="space-y-2">
                    {attendees.map((a) => (
                      <li key={a.id} className="flex items-center justify-between gap-2 rounded-md border border-border bg-card/50 px-3 py-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-sm font-medium text-foreground truncate">
                            {a.profile.display_name ?? a.profile.username}
                          </span>
                          <span className="text-xs text-muted-foreground hidden sm:inline">
                            @{a.profile.username}
                          </span>
                          {a.profile.role && (
                            <span className="text-xs text-muted-foreground hidden md:inline">
                              — {roleLabels[a.profile.role] ?? a.profile.role}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${statusColors[a.status]}`}>
                            {statusLabels[a.status] ?? a.status}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            aria-label="Retirer le participant"
                            disabled={isPending}
                            onClick={() => handleRemoveAttendee(a.profile_id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="border-t border-border pt-4 space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Ajouter un participant
                  </p>
                  <div className="flex gap-2">
                    <div className="flex-1 min-w-0">
                      <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
                        <SelectTrigger>
                          <SelectValue placeholder={availableMembers.length === 0 ? 'Tous les membres sont inscrits' : 'Choisir un membre…'} />
                        </SelectTrigger>
                        <SelectContent>
                          {availableMembers.map((m) => (
                            <SelectItem key={m.id} value={m.id}>
                              {m.display_name ?? m.username}
                              {m.display_name && <span className="text-muted-foreground ml-1 text-xs">@{m.username}</span>}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Select value={addStatus} onValueChange={(v) => setAddStatus(v as 'confirme' | 'peut_etre')}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="confirme">Confirmé</SelectItem>
                        <SelectItem value="peut_etre">Peut-être</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      className="gap-1.5 shrink-0"
                      disabled={!selectedMemberId || isPending}
                      onClick={handleAddAttendee}
                    >
                      {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                      Ajouter
                    </Button>
                  </div>
                  {participantError && (
                    <div className="rounded-md bg-destructive/10 border border-destructive/30 px-3 py-2">
                      <p className="text-xs text-destructive">{participantError}</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </TabsContent>

          {/* ─── Onglet Rapport ─── */}
          <TabsContent value="report" className="mt-4 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="report">Rapport d&apos;événement</Label>
              <MarkdownEditor
                id="report"
                value={report}
                onChange={(v) => { setReport(v); setReportSaved(false) }}
                placeholder="Résumé de l'événement, notes de l'organisateur, résultats…"
                rows={10}
              />
            </div>
            {reportError && (
              <div className="rounded-md bg-destructive/10 border border-destructive/30 px-3 py-2">
                <p className="text-xs text-destructive">{reportError}</p>
              </div>
            )}
            <div className="flex items-center justify-between">
              {reportSaved ? (
                <p className="text-xs text-green-400">Rapport enregistré</p>
              ) : (
                <span />
              )}
              <Button
                onClick={handleSaveReport}
                disabled={isPending}
                size="sm"
              >
                {isPending && <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />}
                Enregistrer le rapport
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
