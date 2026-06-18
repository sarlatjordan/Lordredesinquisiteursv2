'use client'

import { useState, useTransition } from 'react'
import { Plus, Pencil, Trash2, Eye, EyeOff, Loader2, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { MarkdownEditor } from '@/components/ui/markdown-editor'
import { MarkdownContent } from '@/components/ui/markdown-content'
import { createJournalEntry, updateJournalEntry, deleteJournalEntry } from '@/actions/war-journal'
import type { WarJournalWithAuthor } from '@/types'
import { formatDate } from '@/lib/utils'

interface JournalClientProps {
  entries: WarJournalWithAuthor[]
}

const EMPTY = { title: '', content: '', operation_id: '', is_published: false }

export function JournalClient({ entries: initial }: JournalClientProps) {
  const [entries, setEntries] = useState(initial)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<WarJournalWithAuthor | null>(null)
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function openCreate() {
    setEditing(null)
    setForm(EMPTY)
    setError(null)
    setOpen(true)
  }

  function openEdit(entry: WarJournalWithAuthor) {
    setEditing(entry)
    setForm({
      title: entry.title,
      content: entry.content,
      operation_id: entry.operation_id ?? '',
      is_published: entry.is_published,
    })
    setError(null)
    setOpen(true)
  }

  function handleSubmit() {
    setError(null)
    startTransition(async () => {
      const input = { ...form, operation_id: form.operation_id || undefined }
      const result = editing
        ? await updateJournalEntry(editing.id, input)
        : await createJournalEntry(input)

      if (!result.success) { setError(result.error); return }
      setOpen(false)
      window.location.reload()
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteJournalEntry(id)
      setEntries((prev) => prev.filter((e) => e.id !== id))
    })
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BookOpen className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Journal de guerre</h1>
            <p className="text-sm text-muted-foreground">Chroniques des opérations de l&apos;Ordre</p>
          </div>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" /> Nouvelle entrée
        </Button>
      </div>

      <div className="space-y-4">
        {entries.length === 0 && (
          <p className="text-muted-foreground text-sm">Aucune entrée pour le moment.</p>
        )}
        {entries.map((entry) => (
          <div key={entry.id} className="rounded-xl border border-border bg-card p-5 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-semibold truncate">{entry.title}</h2>
                  <Badge variant={entry.is_published ? 'default' : 'secondary'}>
                    {entry.is_published ? 'Publié' : 'Brouillon'}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Par {entry.author?.display_name ?? entry.author?.username} · {formatDate(entry.created_at)}
                  {entry.operation && <span> · Op : {entry.operation.title}</span>}
                </p>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(entry)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(entry.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            <div className="text-sm text-muted-foreground line-clamp-3">
              <MarkdownContent>{entry.content}</MarkdownContent>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? 'Modifier' : 'Nouvelle'} entrée</DialogTitle>
            <DialogDescription>Rédigez une chronique de guerre pour l&apos;Ordre.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="j-title">Titre *</Label>
              <Input id="j-title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Opération Aube Noire — Chronique" />
            </div>

            <div className="space-y-1.5">
              <Label>Contenu *</Label>
              <MarkdownEditor value={form.content} onChange={(v) => setForm((f) => ({ ...f, content: v }))} rows={10} placeholder="Racontez le déroulement de l'opération…" />
            </div>

            <div className="flex items-center gap-3">
              <Switch
                id="j-published"
                checked={form.is_published}
                onCheckedChange={(v) => setForm((f) => ({ ...f, is_published: v }))}
              />
              <Label htmlFor="j-published" className="cursor-pointer">
                {form.is_published ? <><Eye className="inline h-3.5 w-3.5 mr-1" />Publié (visible sur la landing)</> : <><EyeOff className="inline h-3.5 w-3.5 mr-1" />Brouillon</>}
              </Label>
            </div>

            {error && (
              <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
            )}

            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => setOpen(false)}>Annuler</Button>
              <Button onClick={handleSubmit} disabled={isPending}>
                {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editing ? 'Enregistrer' : 'Créer'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
