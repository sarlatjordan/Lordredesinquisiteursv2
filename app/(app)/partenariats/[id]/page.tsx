import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getRolePrivilege } from '@/lib/constants'
import { isUUID } from '@/lib/utils'
import { PartnershipDetail } from './partnership-detail'
import { ArrowLeft } from 'lucide-react'
import type { Partnership } from '@/types'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  if (!isUUID(id)) return { title: 'Partenariat' }
  const supabase = await createClient()
  const { data } = await supabase.from('partnerships').select('name').eq('id', id).single()
  return { title: data?.name ?? 'Partenariat' }
}

export default async function PartnershipPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!isUUID(id)) notFound()
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const canManage = getRolePrivilege(me?.role ?? '') >= 300
  const canDelete = getRolePrivilege(me?.role ?? '') >= 1000

  const { data } = await supabase.from('partnerships').select('*').eq('id', id).single()
  if (!data) notFound()

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link href="/partenariats" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Retour aux partenariats
      </Link>
      <PartnershipDetail partnership={data as Partnership} canManage={canManage} canDelete={canDelete} />
    </div>
  )
}
