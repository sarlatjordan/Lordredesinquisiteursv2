'use server'

import { createClient } from '@/lib/supabase/server'

export type SearchResult = {
  id: string
  type: 'membre' | 'ressource' | 'operation' | 'evenement'
  title: string
  subtitle: string
  href: string
}

export async function searchGlobal(query: string): Promise<SearchResult[]> {
  if (query.trim().length < 2) return []

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const q = `%${query.trim()}%`

  const [membres, ressources, operations, evenements] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, username, display_name, role')
      .or(`username.ilike.${q},display_name.ilike.${q}`)
      .limit(5),

    supabase
      .from('org_resources')
      .select('id, title, slug, category')
      .eq('is_published', true)
      .ilike('title', q)
      .limit(5),

    supabase
      .from('operations')
      .select('id, title, type, status')
      .ilike('title', q)
      .limit(5),

    supabase
      .from('events')
      .select('id, title, type, status')
      .ilike('title', q)
      .limit(5),
  ])

  const results: SearchResult[] = []

  for (const m of membres.data ?? []) {
    results.push({
      id: m.id,
      type: 'membre',
      title: m.display_name ?? m.username,
      subtitle: m.role,
      href: `/membres/${m.username}`,
    })
  }

  for (const r of ressources.data ?? []) {
    results.push({
      id: r.id,
      type: 'ressource',
      title: r.title,
      subtitle: r.category ?? 'Ressource',
      href: `/ressources/${r.slug}`,
    })
  }

  for (const o of operations.data ?? []) {
    results.push({
      id: o.id,
      type: 'operation',
      title: o.title,
      subtitle: `${o.type} · ${o.status}`,
      href: `/operations/${o.id}`,
    })
  }

  for (const e of evenements.data ?? []) {
    results.push({
      id: e.id,
      type: 'evenement',
      title: e.title,
      subtitle: `${e.type} · ${e.status}`,
      href: `/evenements`,
    })
  }

  return results
}
