'use client'

import ReactMarkdown from 'react-markdown'
import { cn } from '@/lib/utils'

interface MarkdownContentProps {
  children: string
  className?: string
  inline?: boolean
}

export function MarkdownContent({ children, className, inline = false }: MarkdownContentProps) {
  if (inline) {
    return (
      <ReactMarkdown
        components={{
          p: ({ children }) => <span className={className}>{children}</span>,
          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
          u: ({ children }) => <u>{children}</u>,
          h1: ({ children }) => <span className="font-bold">{children}</span>,
          h2: ({ children }) => <span className="font-semibold">{children}</span>,
        }}
      >
        {children}
      </ReactMarkdown>
    )
  }

  return (
    <ReactMarkdown
      components={{
        p: ({ children }) => <p className={cn('mb-2 last:mb-0', className)}>{children}</p>,
        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
        em: ({ children }) => <em className="italic">{children}</em>,
        u: ({ children }) => <u>{children}</u>,
        h1: ({ children }) => <h1 className="text-base font-bold mb-1">{children}</h1>,
        h2: ({ children }) => <h2 className="text-sm font-semibold mb-1">{children}</h2>,
      }}
    >
      {children}
    </ReactMarkdown>
  )
}
