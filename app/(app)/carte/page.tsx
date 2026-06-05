import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getRolePrivilege } from '@/lib/constants'
import { CarteClient } from './carte-client'
import type { MapPoint, MapJumpLane } from '@/types'

export const metadata: Metadata = { title: 'Carte stratégique' }
export const dynamic = 'force-dynamic'

export default async function CartePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const privilege = getRolePrivilege(me?.role ?? '')
  const canManage = privilege >= 300
  const canDelete = privilege >= 1000

  const [{ data: points }, { data: lanes }] = await Promise.all([
    supabase.from('map_points').select('*').order('system_name').order('type'),
    supabase.from('map_jump_lanes').select('*').order('system_a'),
  ])

  return (
    <CarteClient
      points={(points ?? []) as MapPoint[]}
      jumpLanes={(lanes ?? []) as MapJumpLane[]}
      canManage={canManage}
      canDelete={canDelete}
    />
  )
}
