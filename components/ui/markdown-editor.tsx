'use client'

import { useRef } from 'react'
import { Bold, Italic, Underline, Heading1, Heading2 } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

interface MarkdownEditorProps {
  id?: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  rows?: number
  disabled?: boolean
  className?: string
}

export function MarkdownEditor({
  id,
  value,
  onChange,
  placeholder = 'Contenu… (markdown supporté)',
  rows = 4,
  disabled = false,
  className,
}: MarkdownEditorProps) {
  const ref = useRef<HTMLTextAreaElement>(null)

  function wrap(before: string, after: string) {
    const ta = ref.current
    if (!ta || disabled) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const selected = value.slice(start, end)
    const next = value.slice(0, start) + before + selected + after + value.slice(end)
    onChange(next)
    requestAnimationFrame(() => {
      ta.focus()
      ta.setSelectionRange(start + before.length, end + before.length)
    })
  }

  function insertHeading(level: number) {
    const ta = ref.current
    if (!ta || disabled) return
    const start = ta.selectionStart
    const lineStart = value.lastIndexOf('\n', start - 1) + 1
    const prefix = '#'.repeat(level) + ' '
    onChange(value.slice(0, lineStart) + prefix + value.slice(lineStart))
    requestAnimationFrame(() => {
      ta.focus()
      ta.setSelectionRange(start + prefix.length, start + prefix.length)
    })
  }

  return (
    <div className={cn('space-y-0', className)}>
      <div className="flex items-center gap-0.5 px-2 py-1 rounded-t-md border border-b-0 border-input bg-muted/40">
        <ToolBtn onClick={() => insertHeading(1)} title="Titre H1" disabled={disabled}>
          <Heading1 className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => insertHeading(2)} title="Sous-titre H2" disabled={disabled}>
          <Heading2 className="h-3.5 w-3.5" />
        </ToolBtn>
        <div className="w-px h-4 bg-border mx-1" />
        <ToolBtn onClick={() => wrap('**', '**')} title="Gras" disabled={disabled}>
          <Bold className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => wrap('*', '*')} title="Italique" disabled={disabled}>
          <Italic className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => wrap('<u>', '</u>')} title="Souligné" disabled={disabled}>
          <Underline className="h-3.5 w-3.5" />
        </ToolBtn>
      </div>
      <Textarea
        ref={ref}
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        className="rounded-t-none font-mono text-sm resize-none"
      />
    </div>
  )
}

function ToolBtn({
  onClick,
  title,
  disabled,
  children,
}: {
  onClick: () => void
  title: string
  disabled?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className="flex items-center justify-center h-7 w-7 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
    >
      {children}
    </button>
  )
}
