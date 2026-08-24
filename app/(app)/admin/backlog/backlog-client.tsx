'use client'

import { useMemo, useState, useTransition } from 'react'
import { Plus, Pencil, Trash2, Check, RotateCcw, Loader2, ListTodo } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  createBacklogItem,
  updateBacklogItem,
  setBacklogItemStatus,
  deleteBacklogItem,
} from '@/actions/backlog'
import type { BacklogItem, BacklogItemInput } from '@/types'

interface BacklogClientProps {
  items: BacklogItem[]
  canEdit: boolean
}

type Priority = 'P0' | 'P1' | 'P2'
type Status = 'planned' | 'in_progress' | 'done'

const EMPTY: BacklogItemInput = { code: '', icon: '📌', title: '', description: '', priority: 'P1', status: 'planned' }

const PRIO_LABEL: Record<Priority, string> = { P0: '🔴 P0 — Incident', P1: '🟡 P1 — Sprint', P2: '⚪ P2 — Long terme' }
const PRIO_BORDER: Record<Priority, string> = { P0: 'border-l-red-500', P1: 'border-l-amber-500', P2: 'border-l-slate-500' }

function nextCode(items: BacklogItem[]) {
  const nums = items.filter((i) => i.code.startsWith('FEAT-')).map((i) => parseInt(i.code.split('-')[1] ?? '0', 10) || 0)
  const max = nums.length ? Math.max(...nums) : 52
  return `FEAT-${String(max + 1).padStart(2, '0')}`
}

export function BacklogClient({ items: initial, canEdit }: BacklogClientProps) {
  const [items, setItems] = useState(initial)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<BacklogItem | null>(null)
  const [form, setForm] = useState<BacklogItemInput>(EMPTY)
  const [error, setError] = useState<string | null>(null)
  const [prioFilter, setPrioFilter] = useState<Priority | 'all'>('all')
  const [isPending, startTransition] = useTransition()

  const planned = useMemo(
    () => items.filter((i) => i.status !== 'done' && (prioFilter === 'all' || i.priority === prioFilter))
      .sort((a, b) => (a.status === b.status ? 0 : a.status === 'in_progress' ? -1 : 1)),
    [items, prioFilter],
  )
  const done = useMemo(() => items.filter((i) => i.status === 'done'), [items])

  const p0Count = items.filter((i) => i.priority === 'P0' && i.status !== 'done').length
  const p1Count = items.filter((i) => i.priority === 'P1' && i.status !== 'done').length

  function openCreate() {
    setEditing(null)
    setForm({ ...EMPTY, code: nextCode(items) })
    setError(null)
    setOpen(true)
  }

  function openEdit(item: BacklogItem) {
    setEditing(item)
    setForm({
      code: item.code,
      icon: item.icon,
      title: item.title,
      description: item.description,
      priority: item.priority as Priority,
      status: item.status as Status,
    })
    setError(null)
    setOpen(true)
  }

  function handleSubmit() {
    setError(null)
    startTransition(async () => {
      const result = editing
        ? await updateBacklogItem(editing.id, form)
        : await createBacklogItem(form)

      if (!result.success) { setError(result.error); return }
      setOpen(false)
      window.location.reload()
    })
  }

  function handleStatus(item: BacklogItem, status: Status) {
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, status } : i)))
    startTransition(async () => {
      await setBacklogItemStatus(item.id, status)
    })
  }

  function handleDelete(id: string) {
    if (!confirm('Supprimer cet item ?')) return
    startTransition(async () => {
      await deleteBacklogItem(id)
      setItems((prev) => prev.filter((i) => i.id !== id))
    })
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <ListTodo className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Backlog</h1>
            <p className="text-sm text-muted-foreground">Roadmap et suivi des items de l&apos;Ordre</p>
          </div>
        </div>
        {canEdit && (
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" /> Nouvel item
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant="secondary">✓ {done.length} terminés</Badge>
        {p0Count > 0 && <Badge variant="destructive">⚠ {p0Count} P0</Badge>}
        <Badge variant="outline">↑ {p1Count} P1</Badge>
        <div className="ml-auto flex gap-1.5">
          {(['all', 'P0', 'P1', 'P2'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPrioFilter(p)}
              className={`text-xs font-medium px-2.5 py-1 rounded-full border transition-colors ${
                prioFilter === p
                  ? 'bg-primary/10 text-primary border-primary/40'
                  : 'text-muted-foreground border-border hover:text-foreground'
              }`}
            >
              {p === 'all' ? 'Tous' : PRIO_LABEL[p]}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {planned.length === 0 && (
          <p className="text-sm text-muted-foreground">Aucun item ne correspond au filtre.</p>
        )}
        {planned.map((item) => (
          <div
            key={item.id}
            className={`rounded-xl border border-border bg-card p-4 flex items-start gap-3 border-l-4 ${PRIO_BORDER[item.priority as Priority]}`}
          >
            <div className="text-lg mt-0.5 shrink-0">{item.icon}</div>
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-medium text-sm">{item.title}</h3>
                {item.status === 'in_progress' && (
                  <Badge variant="outline" className="text-violet-400 border-violet-400/30">En cours</Badge>
                )}
              </div>
              {item.description && (
                <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
              )}
              <p className="text-[11px] font-mono text-muted-foreground/70">{item.code} · {item.priority}</p>
            </div>
            {canEdit && (
              <div className="flex gap-1 shrink-0">
                <Button
                  size="icon" variant="ghost" className="h-7 w-7"
                  title={item.status === 'in_progress' ? 'Marquer terminé' : 'Démarrer'}
                  onClick={() => handleStatus(item, item.status === 'in_progress' ? 'done' : 'in_progress')}
                  disabled={isPending}
                >
                  <Check className="h-3.5 w-3.5" />
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(item)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={() => handleDelete(item.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>

      {done.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground pt-2 border-t border-border">
            Terminé ({done.length})
          </h2>
          <div className="space-y-1.5">
            {done.map((item) => (
              <div key={item.id} className="rounded-lg border border-border bg-card/50 px-3 py-2 flex items-center gap-2.5 opacity-60 hover:opacity-90 transition-opacity">
                <span className="text-sm">{item.icon}</span>
                <span className="text-xs line-through flex-1 truncate">{item.title}</span>
                <span className="text-[10px] font-mono text-muted-foreground/60">{item.code}</span>
                {canEdit && (
                  <>
                    <Button
                      size="icon" variant="ghost" className="h-6 w-6" title="Remettre en planifié"
                      onClick={() => handleStatus(item, 'planned')}
                    >
                      <RotateCcw className="h-3 w-3" />
                    </Button>
                    <Button
                      size="icon" variant="ghost" className="h-6 w-6 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Modifier' : 'Nouvel'} item</DialogTitle>
            <DialogDescription>Ajoutez ou modifiez un item du backlog produit.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="bl-title">Titre *</Label>
              <Input id="bl-title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Description courte de l'item" />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="bl-code">Code</Label>
                <Input id="bl-code" value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} placeholder="FEAT-XX" className="font-mono text-xs" />
              </div>
              <div className="space-y-1.5">
                <Label>Priorité</Label>
                <Select value={form.priority} onValueChange={(v) => setForm((f) => ({ ...f, priority: v as Priority }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="P0">🔴 P0</SelectItem>
                    <SelectItem value="P1">🟡 P1</SelectItem>
                    <SelectItem value="P2">⚪ P2</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Statut</Label>
                <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v as Status }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planned">Planifié</SelectItem>
                    <SelectItem value="in_progress">En cours</SelectItem>
                    <SelectItem value="done">Terminé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="bl-icon">Icône (emoji)</Label>
              <Input id="bl-icon" value={form.icon} onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))} maxLength={4} className="w-20" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="bl-desc">Description</Label>
              <Textarea id="bl-desc" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={4} placeholder="Contexte, contraintes, références…" />
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
