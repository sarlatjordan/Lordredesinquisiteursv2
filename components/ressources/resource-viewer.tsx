'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { motion } from 'framer-motion'
import { Edit, Save, X, Trash2, Eye, EyeOff, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { formatDate } from '@/lib/utils'
import { updateResource, deleteResource } from '@/actions/resources'
import type { OrgResource } from '@/types'

const MDEditor = dynamic(() => import('@uiw/react-md-editor'), {
  ssr: false,
  loading: () => <div className="h-64 animate-pulse rounded bg-muted" />,
})

interface Props {
  resource: OrgResource
  isAdmin: boolean
}

export function ResourceViewer({ resource, isAdmin }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isEditing, setIsEditing] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [title, setTitle] = useState(resource.title)
  const [content, setContent] = useState(resource.content ?? '')
  const [category, setCategory] = useState(resource.category)
  const [isPublished, setIsPublished] = useState(resource.is_published)

  function cancelEdit() {
    setTitle(resource.title)
    setContent(resource.content ?? '')
    setCategory(resource.category)
    setIsPublished(resource.is_published)
    setError(null)
    setIsEditing(false)
  }

  function handleSave() {
    setError(null)
    startTransition(async () => {
      const result = await updateResource(resource.id, { title, content, category, is_published: isPublished })
      if (result.success) {
        setIsEditing(false)
        router.refresh()
      } else {
        setError(result.error)
      }
    })
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteResource(resource.id)
      if (result.success) {
        router.push('/ressources')
      }
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5"
    >
      {/* Header */}
      <div className="space-y-3">
        {isEditing ? (
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-xl font-bold h-auto py-2"
            placeholder="Titre de la ressource"
          />
        ) : (
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        )}

        <div className="flex items-center gap-3 flex-wrap">
          {isEditing ? (
            <Input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-40 h-7 text-xs"
              placeholder="Catégorie"
            />
          ) : (
            <Badge variant="outline" className="text-xs text-primary border-primary/30 bg-primary/10">
              {category}
            </Badge>
          )}

          {!isPublished && (
            <Badge variant="outline" className="text-xs text-amber-400 border-amber-400/30 bg-amber-400/10">
              Brouillon
            </Badge>
          )}

          <span className="text-xs text-muted-foreground">
            Mis à jour {formatDate(resource.updated_at)}
          </span>
        </div>
      </div>

      {/* Toolbar admin */}
      {isAdmin && (
        <div className="flex items-center gap-2 flex-wrap">
          {isEditing ? (
            <>
              <Button size="sm" onClick={handleSave} disabled={isPending} className="gap-1.5">
                {isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Save className="h-3.5 w-3.5" />
                )}
                Enregistrer
              </Button>
              <Button size="sm" variant="outline" onClick={cancelEdit} disabled={isPending} className="gap-1.5">
                <X className="h-3.5 w-3.5" />
                Annuler
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsPublished((v) => !v)}
                className="gap-1.5 text-muted-foreground"
              >
                {isPublished
                  ? <Eye className="h-3.5 w-3.5" />
                  : <EyeOff className="h-3.5 w-3.5" />}
                {isPublished ? 'Publié' : 'Brouillon'}
              </Button>
              {error && <p className="text-xs text-destructive">{error}</p>}
            </>
          ) : (
            <>
              <Button size="sm" variant="outline" onClick={() => setIsEditing(true)} className="gap-1.5">
                <Edit className="h-3.5 w-3.5" />
                Modifier
              </Button>

              {showDeleteConfirm ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-destructive">Supprimer définitivement ?</span>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={isPending}
                  >
                    {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Confirmer'}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowDeleteConfirm(false)}>
                    Annuler
                  </Button>
                </div>
              ) : (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="gap-1.5 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Supprimer
                </Button>
              )}
            </>
          )}
        </div>
      )}

      {/* Content */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        {isEditing ? (
          <div data-color-mode="dark">
            <MDEditor
              value={content}
              onChange={(v) => setContent(v ?? '')}
              height={520}
            />
          </div>
        ) : content ? (
          <div className="p-6 prose prose-invert prose-sm max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <p className="text-sm text-muted-foreground">Aucun contenu.</p>
            {isAdmin && (
              <Button size="sm" variant="outline" onClick={() => setIsEditing(true)} className="gap-1.5 mt-1">
                <Edit className="h-3.5 w-3.5" />
                Ajouter du contenu
              </Button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}
