'use client'

import { useState, useRef, type KeyboardEvent } from 'react'
import { Send, Bold, Italic, Underline } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface MessageInputProps {
  onSend: (content: string) => void
  disabled?: boolean
}

export function MessageInput({ onSend, disabled }: MessageInputProps) {
  const [value, setValue] = useState('')
  const ref = useRef<HTMLTextAreaElement>(null)

  function wrap(before: string, after: string) {
    const ta = ref.current
    if (!ta || disabled) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const selected = value.slice(start, end)
    const next = value.slice(0, start) + before + selected + after + value.slice(end)
    setValue(next)
    requestAnimationFrame(() => {
      ta.focus()
      ta.setSelectionRange(start + before.length, end + before.length)
    })
  }

  function handleSubmit() {
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setValue('')
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="px-4 py-3 border-t border-border space-y-1.5">
      <div className="flex items-center gap-0.5">
        {[
          { icon: Bold, title: 'Gras', before: '**', after: '**' },
          { icon: Italic, title: 'Italique', before: '*', after: '*' },
          { icon: Underline, title: 'Souligné', before: '<u>', after: '</u>' },
        ].map(({ icon: Icon, title, before, after }) => (
          <button
            key={title}
            type="button"
            title={title}
            disabled={disabled}
            onClick={() => wrap(before, after)}
            className="flex items-center justify-center h-6 w-6 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Icon className="h-3 w-3" />
          </button>
        ))}
      </div>
      <div className="flex gap-2 items-end">
        <Textarea
          ref={ref}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Écrivez un message… (Entrée pour envoyer, Maj+Entrée pour un saut de ligne)"
          className="min-h-[40px] max-h-[120px] resize-none text-sm"
          disabled={disabled}
          rows={1}
        />
        <Button
          size="icon"
          onClick={handleSubmit}
          disabled={disabled || !value.trim()}
          className="shrink-0 h-10 w-10"
          aria-label="Envoyer"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
