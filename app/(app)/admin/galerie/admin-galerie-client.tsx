'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { insertMediaRecord, updateMediaRecord, deleteMediaRecord } from '@/actions/gallery'
import { createClient } from '@/lib/supabase/client'
import type { MediaGallery } from '@/types'
import {
  Upload, Trash2, Loader2, CheckCircle2, AlertCircle,
  ImageIcon, X, Pencil,
} from 'lucide-react'

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const ACCEPTED_ATTR  = ACCEPTED_TYPES.join(',')
const MAX_MB         = 15

interface AdminGalerieClientProps {
  initialMedia: MediaGallery[]
}

// ─── Dialog édition ───────────────────────────────────────────────────────────

function EditDialog({
  item,
  onClose,
  onSaved,
}: {
  item: MediaGallery
  onClose: () => void
  onSaved: (updated: MediaGallery) => void
}) {
  const [title,   setTitle]   = useState(item.title   ?? '')
  const [caption, setCaption] = useState(item.caption ?? '')
  const [isPending, start]    = useTransition()
  const [error, setError]     = useState<string | null>(null)

  function handleSave() {
    start(async () => {
      const result = await updateMediaRecord(item.id, {
        title:   title.trim()   || undefined,
        caption: caption.trim() || undefined,
      })
      if (!result.success) { setError(result.error); return }
      onSaved({ ...item, title: title.trim() || null, caption: caption.trim() || null })
      onClose()
    })
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Modifier le visuel</DialogTitle>
          <DialogDescription>Titre et légende affichés dans la galerie publique.</DialogDescription>
        </DialogHeader>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={item.url} alt="" className="w-full max-h-32 object-cover rounded-lg border border-border" />

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wide">
              Titre
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              placeholder="Opération Blackout — Microtech"
              className="w-full h-9 rounded-md border border-input bg-input px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wide">
              Légende
            </label>
            <input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              maxLength={500}
              placeholder="Escadron de 6 vaisseaux au-dessus de Crusader"
              className="w-full h-9 rounded-md border border-input bg-input px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          {error && (
            <p className="text-sm text-destructive flex items-center gap-1.5">
              <AlertCircle className="h-4 w-4 shrink-0" />{error}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Sauvegarde…</> : 'Enregistrer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Composant principal ──────────────────────────────────────────────────────

export function AdminGalerieClient({ initialMedia }: AdminGalerieClientProps) {
  const router  = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  // fichier sélectionné (click OU drag & drop)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview,  setPreview]  = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const [title,    setTitle]    = useState('')
  const [caption,  setCaption]  = useState('')
  const [error,    setError]    = useState<string | null>(null)
  const [success,  setSuccess]  = useState(false)
  const [uploading, startUpload] = useTransition()

  const [media,    setMedia]    = useState<MediaGallery[]>(initialMedia)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [editing,  setEditing]  = useState<MediaGallery | null>(null)

  // ─── Helpers fichier ──────────────────────────────────────────────────────

  function processFile(file: File) {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('Type non supporté — JPG, PNG, WebP ou GIF uniquement.')
      return
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`Fichier trop volumineux (max ${MAX_MB} Mo)`)
      return
    }
    setError(null)
    setSuccess(false)
    setSelectedFile(file)

    const reader = new FileReader()
    reader.onload = (ev) => setPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  // ─── Drag & Drop ─────────────────────────────────────────────────────────

  function onDragOver(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    setDragging(true)
  }

  function onDragLeave(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    setDragging(false)
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) processFile(file)
  }

  // ─── Reset formulaire ─────────────────────────────────────────────────────

  function resetForm() {
    setSelectedFile(null)
    setPreview(null)
    setTitle('')
    setCaption('')
    setError(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  // ─── Upload ───────────────────────────────────────────────────────────────

  function handleUpload() {
    if (!selectedFile) { setError('Sélectionnez une image.'); return }
    setError(null)
    setSuccess(false)

    startUpload(async () => {
      const supabase = createClient()
      const ext  = selectedFile.name.split('.').pop() ?? 'jpg'
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

      const { error: uploadErr } = await supabase.storage
        .from('gallery')
        .upload(path, selectedFile, { cacheControl: '31536000' })

      if (uploadErr) { setError(uploadErr.message); return }

      const { data: { publicUrl } } = supabase.storage.from('gallery').getPublicUrl(path)

      const result = await insertMediaRecord({
        storage_path: path,
        url:     publicUrl,
        title:   title.trim()   || undefined,
        caption: caption.trim() || undefined,
      })

      if (!result.success) {
        await supabase.storage.from('gallery').remove([path])
        setError(result.error)
        return
      }

      setSuccess(true)
      resetForm()
      router.refresh()
    })
  }

  // ─── Suppression ──────────────────────────────────────────────────────────

  async function handleDelete(item: MediaGallery) {
    if (!confirm(`Supprimer "${item.title ?? 'ce visuel'}" ?`)) return
    setDeleting(item.id)
    const result = await deleteMediaRecord(item.id)
    if (result.success) {
      setMedia((prev) => prev.filter((m) => m.id !== item.id))
    } else {
      setError(result.error)
    }
    setDeleting(null)
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8">
      {/* Formulaire upload */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-5">
        <h3 className="font-semibold text-foreground">Ajouter un visuel</h3>

        <input
          ref={fileRef}
          type="file"
          accept={ACCEPTED_ATTR}
          onChange={onInputChange}
          className="hidden"
          id="gallery-file"
        />

        {preview ? (
          <div className="relative inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Prévisualisation"
              className="max-h-48 rounded-lg border border-border object-contain"
            />
            <button
              onClick={resetForm}
              className="absolute -top-2 -right-2 h-6 w-6 flex items-center justify-center rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
              aria-label="Retirer l'image"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <label
            htmlFor="gallery-file"
            onDragOver={onDragOver}
            onDragEnter={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            className={[
              'flex flex-col items-center justify-center gap-3 h-40 rounded-xl border-2 border-dashed cursor-pointer transition-colors',
              dragging
                ? 'border-primary bg-primary/10 scale-[1.01]'
                : 'border-border bg-muted/20 hover:border-primary/40 hover:bg-primary/5',
            ].join(' ')}
          >
            <motion.div animate={{ scale: dragging ? 1.15 : 1 }} transition={{ duration: 0.15 }}>
              <ImageIcon className={`h-8 w-8 ${dragging ? 'text-primary' : 'text-muted-foreground/50'}`} />
            </motion.div>
            <div className="text-center pointer-events-none">
              <p className="text-sm text-muted-foreground">
                {dragging ? 'Relâchez pour ajouter' : 'Cliquez ou glissez-déposez une image'}
              </p>
              <p className="text-xs text-muted-foreground/60 mt-0.5">
                JPG, PNG, WebP, GIF — max {MAX_MB} Mo
              </p>
            </div>
          </label>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="img-title" className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">
              Titre (optionnel)
            </label>
            <input
              id="img-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              placeholder="Opération Blackout — Microtech"
              className="w-full h-9 rounded-md border border-input bg-input px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label htmlFor="img-caption" className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">
              Légende (optionnel)
            </label>
            <input
              id="img-caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              maxLength={500}
              placeholder="Escadron de 6 vaisseaux au-dessus de Crusader"
              className="w-full h-9 rounded-md border border-input bg-input px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div key="err" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
            >
              <AlertCircle className="h-4 w-4 shrink-0" />{error}
            </motion.div>
          )}
          {success && (
            <motion.div key="ok" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-2.5 text-sm text-green-400"
            >
              <CheckCircle2 className="h-4 w-4 shrink-0" />Image ajoutée à la galerie.
            </motion.div>
          )}
        </AnimatePresence>

        <Button onClick={handleUpload} disabled={uploading || !selectedFile}>
          {uploading
            ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Upload en cours…</>
            : <><Upload className="h-4 w-4 mr-2" />Publier dans la galerie</>
          }
        </Button>
      </div>

      {/* Grille des médias */}
      {media.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
            {media.length} visuel{media.length > 1 ? 's' : ''} publiés
          </h3>
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
            <AnimatePresence>
              {media.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="group relative rounded-lg overflow-hidden border border-border bg-card aspect-square"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.url}
                    alt={item.title ?? 'Galerie'}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />

                  {/* Overlay actions */}
                  <div className="absolute inset-0 bg-background/0 group-hover:bg-background/70 transition-colors duration-200 flex items-center justify-center gap-2">
                    <button
                      onClick={() => setEditing(item)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity flex h-9 w-9 items-center justify-center rounded-full bg-card border border-border text-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/30"
                      aria-label="Modifier"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(item)}
                      disabled={deleting === item.id}
                      className="opacity-0 group-hover:opacity-100 transition-opacity flex h-9 w-9 items-center justify-center rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
                      aria-label="Supprimer"
                    >
                      {deleting === item.id
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <Trash2 className="h-4 w-4" />
                      }
                    </button>
                  </div>

                  {item.title && (
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-background/90 to-transparent px-2 py-1.5 pointer-events-none">
                      <p className="text-[10px] font-medium text-foreground truncate">{item.title}</p>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Dialog édition */}
      {editing && (
        <EditDialog
          item={editing}
          onClose={() => setEditing(null)}
          onSaved={(updated) => {
            setMedia((prev) => prev.map((m) => m.id === updated.id ? updated : m))
            setEditing(null)
          }}
        />
      )}
    </div>
  )
}
