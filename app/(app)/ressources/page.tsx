import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { BookOpen, ChevronRight, FileText, Plus } from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import type { OrgResource } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getRolePrivilege, PRIVILEGE } from '@/lib/constants'

export const metadata: Metadata = { title: 'Ressources' }
export const dynamic = 'force-dynamic'

interface RessourcesPageProps {
  searchParams: Promise<{ category?: string }>
}

export default async function RessourcesPage({ searchParams }: RessourcesPageProps) {
  const { category } = await searchParams
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  let isAdmin = false
  if (user) {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    isAdmin = getRolePrivilege(profile?.role ?? '') >= PRIVILEGE.MANAGE_RESOURCES
  }

  let query = supabase
    .from('org_resources')
    .select('*')
    .order('category', { ascending: true })
    .order('title', { ascending: true })

  if (!isAdmin) query = query.eq('is_published', true)
  if (category) query = query.eq('category', category)

  const { data: resources } = await query
  const typedResources = (resources as OrgResource[]) ?? []

  // Grouper par catégorie
  const byCategory = typedResources.reduce<Record<string, OrgResource[]>>((acc, r) => {
    if (!acc[r.category]) acc[r.category] = []
    acc[r.category].push(r)
    return acc
  }, {})

  const categories = Object.keys(byCategory)

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Ressources</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Wiki interne — guides, règlements et documentation
          </p>
        </div>
        {isAdmin && (
          <Button asChild size="sm" className="gap-1.5">
            <Link href="/ressources/new">
              <Plus className="h-4 w-4" />
              Nouvelle ressource
            </Link>
          </Button>
        )}
      </div>

      {/* Filtres catégories */}
      {categories.length > 1 && (
        <div className="flex flex-wrap gap-2">
          <a
            href="/ressources"
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              !category ? 'bg-primary/10 text-primary border-primary/30' : 'bg-card text-muted-foreground border-border hover:border-primary/20'
            }`}
          >
            Toutes
          </a>
          {categories.map((cat) => (
            <a
              key={cat}
              href={category === cat ? '/ressources' : `/ressources?category=${encodeURIComponent(cat)}`}
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                category === cat ? 'bg-primary/10 text-primary border-primary/30' : 'bg-card text-muted-foreground border-border hover:border-primary/20'
              }`}
            >
              {cat} ({byCategory[cat].length})
            </a>
          ))}
        </div>
      )}

      {typedResources.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <BookOpen className="h-10 w-10 text-muted-foreground/40" />
          <p className="text-muted-foreground">Aucune ressource disponible.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(byCategory).map(([cat, items]) => (
            <div key={cat}>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                <BookOpen className="h-3.5 w-3.5" />
                {cat}
              </h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((resource) => (
                  <Link
                    key={resource.id}
                    href={`/ressources/${resource.slug}`}
                    className="group flex items-start gap-3 rounded-lg border border-border bg-card p-4 hover:border-primary/20 hover:bg-accent/30 transition-all"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 border border-primary/20 shrink-0">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">
                          {resource.title}
                        </p>
                        {!resource.is_published && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-amber-400 border-amber-400/30 bg-amber-400/10 shrink-0">
                            Brouillon
                          </Badge>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Mis à jour {formatDate(resource.updated_at)}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
