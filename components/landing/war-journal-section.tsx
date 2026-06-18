'use client'

import { motion } from 'framer-motion'
import { BookOpen, CalendarDays, User } from 'lucide-react'
import { MarkdownContent } from '@/components/ui/markdown-content'
import type { WarJournalWithAuthor } from '@/types'
import { formatDate } from '@/lib/utils'

interface WarJournalSectionProps {
  entries: WarJournalWithAuthor[]
}

export function WarJournalSection({ entries }: WarJournalSectionProps) {
  if (entries.length === 0) return null

  return (
    <section id="journal" className="py-24 px-4">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/5 text-xs text-primary font-medium mb-4">
            <BookOpen className="h-3.5 w-3.5" />
            Journal de guerre
          </div>
          <h2 className="text-3xl font-bold text-foreground">Chroniques de l&apos;Ordre</h2>
          <p className="text-muted-foreground mt-2 max-w-lg mx-auto">
            Les récits des opérations menées par les Inquisiteurs.
          </p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {entries.map((entry, i) => (
            <motion.article
              key={entry.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="rounded-xl border border-border bg-card/60 backdrop-blur-sm p-5 space-y-3 hover:border-primary/30 transition-colors"
            >
              <h3 className="font-semibold text-foreground leading-snug">{entry.title}</h3>

              <div className="text-sm text-muted-foreground line-clamp-4 prose-sm">
                <MarkdownContent>{entry.content}</MarkdownContent>
              </div>

              <div className="pt-2 border-t border-border flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {entry.author?.display_name ?? entry.author?.username}
                </span>
                <span className="flex items-center gap-1">
                  <CalendarDays className="h-3 w-3" />
                  {formatDate(entry.created_at)}
                </span>
                {entry.operation && (
                  <span className="text-primary/70">Op : {entry.operation.title}</span>
                )}
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  )
}
