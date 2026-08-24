'use client'

import { useState, useEffect, useTransition, useRef } from 'react'
import { MessageSquare, Send, Trash2, Loader2 } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { formatRelativeTime } from '@/lib/utils'
import { addComment, deleteComment, fetchComments } from '@/actions/comments'
import type { CommentWithAuthor } from '@/types'

interface CommentsSectionProps {
  entityType: 'operation' | 'event'
  entityId: string
  currentUserId: string
}

function authorInitials(c: CommentWithAuthor): string {
  const name = c.author.display_name ?? c.author.username ?? ''
  return name.slice(0, 2).toUpperCase()
}

export function CommentsSection({ entityType, entityId, currentUserId }: CommentsSectionProps) {
  const [comments, setComments] = useState<CommentWithAuthor[]>([])
  const [loading, setLoading] = useState(true)
  const [content, setContent] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setLoading(true)
    fetchComments(entityType, entityId).then((res) => {
      if (res.success) setComments(res.data)
      setLoading(false)
    })
  }, [entityType, entityId])

  function handleSubmit() {
    const trimmed = content.trim()
    if (!trimmed) return
    setError(null)
    startTransition(async () => {
      const res = await addComment(entityType, entityId, trimmed)
      if (!res.success) { setError(res.error ?? 'Erreur'); return }
      if (res.data) setComments((prev) => [...prev, res.data!])
      setContent('')
      textareaRef.current?.focus()
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const res = await deleteComment(id)
      if (!res.success) { setError(res.error ?? 'Erreur'); return }
      setComments((prev) => prev.filter((c) => c.id !== id))
    })
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <MessageSquare className="h-4 w-4 text-primary/70" />
        Commentaires
        {!loading && (
          <span className="text-xs font-normal text-muted-foreground">
            ({comments.length})
          </span>
        )}
      </h3>

      {/* Liste */}
      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      ) : comments.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          Aucun commentaire — sois le premier.
        </p>
      ) : (
        <ul className="space-y-3">
          {comments.map((c) => (
            <li key={c.id} className="flex gap-3 group">
              <Avatar className="h-7 w-7 shrink-0 mt-0.5">
                <AvatarImage src={c.author.avatar_url ?? undefined} />
                <AvatarFallback className="text-[10px]">{authorInitials(c)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-sm font-medium text-foreground">
                    {c.author.display_name ?? c.author.username}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {formatRelativeTime(c.created_at)}
                  </span>
                </div>
                <p className="text-sm text-foreground/80 mt-0.5 whitespace-pre-wrap break-words">
                  {c.content}
                </p>
              </div>
              {c.author_id === currentUserId && (
                <button
                  onClick={() => handleDelete(c.id)}
                  disabled={isPending}
                  aria-label="Supprimer ce commentaire"
                  className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive disabled:opacity-30"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Formulaire */}
      <div className="space-y-2 pt-1">
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ajouter un commentaire… (Ctrl+Entrée pour envoyer)"
          rows={2}
          maxLength={2000}
          className="resize-none text-sm"
        />
        {error && (
          <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground">
            {content.length > 0 ? `${content.length}/2000` : ''}
          </span>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!content.trim() || isPending}
            className="gap-1.5"
          >
            {isPending
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : <Send className="h-3.5 w-3.5" />}
            Envoyer
          </Button>
        </div>
      </div>
    </div>
  )
}
