'use client'

import React, { useState, useEffect, useTransition, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Users, BookOpen, Target, CalendarDays, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command'
import { searchGlobal, type SearchResult } from '@/actions/search'

const TYPE_CONFIG: Record<SearchResult['type'], { label: string; Icon: React.ElementType }> = {
  membre:    { label: 'Membres',    Icon: Users },
  ressource: { label: 'Ressources', Icon: BookOpen },
  operation: { label: 'Opérations', Icon: Target },
  evenement: { label: 'Événements', Icon: CalendarDays },
}

const TYPES: SearchResult['type'][] = ['membre', 'ressource', 'operation', 'evenement']

export function GlobalSearch() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((v) => !v)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const runSearch = useCallback((q: string) => {
    if (q.trim().length < 2) {
      setResults([])
      return
    }
    startTransition(async () => {
      const data = await searchGlobal(q)
      setResults(data)
    })
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => runSearch(query), 300)
    return () => clearTimeout(timer)
  }, [query, runSearch])

  function handleSelect(href: string) {
    setOpen(false)
    setQuery('')
    setResults([])
    router.push(href)
  }

  function handleOpenChange(v: boolean) {
    setOpen(v)
    if (!v) {
      setQuery('')
      setResults([])
    }
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:text-foreground"
        aria-label="Rechercher (Ctrl+K)"
        onClick={() => setOpen(true)}
      >
        <Search className="h-4 w-4" />
      </Button>

      <CommandDialog
        open={open}
        onOpenChange={handleOpenChange}
        title="Recherche globale"
        description="Rechercher des membres, ressources, opérations ou événements"
      >
        <CommandInput
          placeholder="Rechercher… (min. 2 caractères)"
          value={query}
          onValueChange={setQuery}
        />

        <CommandList>
          {isPending && (
            <div className="flex items-center justify-center py-6 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              <span className="text-sm">Recherche en cours…</span>
            </div>
          )}

          {!isPending && query.trim().length >= 2 && results.length === 0 && (
            <CommandEmpty>Aucun résultat pour « {query} »</CommandEmpty>
          )}

          {!isPending && query.trim().length < 2 && (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Tapez au moins 2 caractères pour rechercher
            </div>
          )}

          {!isPending && TYPES.map((type) => {
            const items = results.filter((r) => r.type === type)
            if (items.length === 0) return null
            const { label, Icon } = TYPE_CONFIG[type]
            return (
              <CommandGroup key={type} heading={label}>
                {items.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={`${type}-${item.id}-${item.title}`}
                    onSelect={() => handleSelect(item.href)}
                    className="cursor-pointer"
                  >
                    <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="font-medium truncate block">{item.title}</span>
                      <span className="text-xs text-muted-foreground capitalize">{item.subtitle}</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )
          })}
        </CommandList>

        <div className="border-t border-border px-3 py-2 flex items-center gap-3 text-xs text-muted-foreground">
          <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono">↑↓</kbd>
          <span>naviguer</span>
          <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono">↵</kbd>
          <span>ouvrir</span>
          <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono">Esc</kbd>
          <span>fermer</span>
          <span className="ml-auto">
            <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono">Ctrl K</kbd>
          </span>
        </div>
      </CommandDialog>
    </>
  )
}
