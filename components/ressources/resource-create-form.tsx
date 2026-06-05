'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Save, Loader2, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { createResource } from '@/actions/resources'

const MDEditor = dynamic(() => import('@uiw/react-md-editor'), {
  ssr: false,
  loading: () => <div className="h-96 animate-pulse rounded-lg bg-muted" />,
})

function toSlug(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 100)
}

interface Props {
  existingCategories: string[]
}

export function ResourceCreateForm({ existingCategories }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [slugManual, setSlugManual] = useState(false)
  const [category, setCategory] = useState('')
  const [content, setContent] = useState('')
  const [isPublished, setIsPublished] = useState(false)

  function handleTitleChange(v: string) {
    setTitle(v)
    if (!slugManual) setSlug(toSlug(v))
  }

  function handleSlugChange(v: string) {
    setSlugManual(true)
    setSlug(v.toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-'))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!title.trim() || title.length < 3) { setError('Titre requis (min. 3 caractères)'); return }
    if (!slug || slug.length < 3) { setError('Slug requis (min. 3 caractères)'); return }
    if (!category.trim()) { setError('Catégorie requise'); return }

    startTransition(async () => {
      const result = await createResource({ title: title.trim(), slug, category: category.trim(), content: content || undefined, is_published: isPublished })
      if (result.success) {
        router.push(`/ressources/${result.data.slug}`)
      } else {
        setError(result.error)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Titre + Slug */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="title">Titre *</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Guide de combat spatial"
            disabled={isPending}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="slug">
            Slug *
            {!slugManual && <span className="ml-2 text-[10px] text-muted-foreground font-normal">auto-généré</span>}
          </Label>
          <Input
            id="slug"
            value={slug}
            onChange={(e) => handleSlugChange(e.target.value)}
            placeholder="guide-de-combat-spatial"
            disabled={isPending}
            className="font-mono text-sm"
          />
          {slug && (
            <p className="text-[11px] text-muted-foreground">/ressources/<span className="text-foreground">{slug}</span></p>
          )}
        </div>
      </div>

      {/* Catégorie */}
      <div className="space-y-1.5">
        <Label htmlFor="category">Catégorie *</Label>
        <Input
          id="category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="Guides, Règlement, Tactiques…"
          list="categories-list"
          disabled={isPending}
        />
        <datalist id="categories-list">
          {existingCategories.map((cat) => (
            <option key={cat} value={cat} />
          ))}
        </datalist>
      </div>

      {/* Contenu Markdown */}
      <div className="space-y-1.5">
        <Label>Contenu</Label>
        <div data-color-mode="dark" className="rounded-lg overflow-hidden border border-border">
          <MDEditor
            value={content}
            onChange={(v) => setContent(v ?? '')}
            height={480}
          />
        </div>
      </div>

      {/* Publié */}
      <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3">
        <Switch
          id="is_published"
          checked={isPublished}
          onCheckedChange={setIsPublished}
          disabled={isPending}
        />
        <div>
          <Label htmlFor="is_published" className="cursor-pointer flex items-center gap-1.5">
            {isPublished ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            {isPublished ? 'Publié — visible par tous les membres' : 'Brouillon — visible par les admins uniquement'}
          </Label>
        </div>
      </div>

      {/* Erreur */}
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={() => router.back()} disabled={isPending}>
          Annuler
        </Button>
        <Button type="submit" disabled={isPending} className="gap-1.5">
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {isPublished ? 'Publier' : 'Enregistrer le brouillon'}
        </Button>
      </div>
    </form>
  )
}
