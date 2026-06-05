import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ResourceViewer } from '@/components/ressources/resource-viewer'
import type { OrgResource } from '@/types'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'
import { getRolePrivilege, PRIVILEGE } from '@/lib/constants'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('org_resources')
    .select('title')
    .eq('slug', slug)
    .single()
  return { title: data?.title ?? 'Ressource' }
}

export default async function ResourcePage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()

  const [{ data: resource }, { data: { user } }] = await Promise.all([
    supabase.from('org_resources').select('*').eq('slug', slug).single(),
    supabase.auth.getUser(),
  ])

  if (!resource) notFound()

  let isAdmin = false
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    isAdmin = getRolePrivilege(profile?.role ?? '') >= PRIVILEGE.MANAGE_RESOURCES
  }

  if (!resource.is_published && !isAdmin) notFound()

  return (
    <div className="space-y-4 max-w-4xl">
      <Link
        href="/ressources"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        Retour aux ressources
      </Link>

      <ResourceViewer resource={resource as OrgResource} isAdmin={isAdmin} />
    </div>
  )
}
