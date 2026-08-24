import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getRolePrivilege, SC_SYSTEMS } from '@/lib/constants'
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

  const [{ data: points }, { data: lanes }, { data: sysPos }] = await Promise.all([
    supabase.from('map_points').select('*').order('system_name').order('type'),
    supabase.from('map_jump_lanes').select('*').order('system_a'),
    supabase.from('map_system_positions').select('system_name, x, y'),
  ])

  // Filtre 1.0 : seuls les 5 systèmes confirmés au lancement sont affichés.
  // Les données des autres systèmes restent en base (non supprimées) au cas
  // où la roadmap CIG les ajouterait plus tard.
  const isSystem10 = (name: string) => (SC_SYSTEMS as readonly string[]).includes(name)

  const systemPositions: Record<string, { x: number; y: number }> = {}
  for (const row of sysPos ?? []) {
    if (isSystem10(row.system_name)) systemPositions[row.system_name] = { x: row.x, y: row.y }
  }

  const filteredPoints = (points ?? []).filter((p) => isSystem10(p.system_name))
  const filteredLanes = (lanes ?? []).filter((l) => isSystem10(l.system_a) && isSystem10(l.system_b))

  return (
    <CarteClient
      points={filteredPoints as MapPoint[]}
      jumpLanes={filteredLanes as MapJumpLane[]}
      systemPositions={systemPositions}
      canManage={canManage}
      canDelete={canDelete}
    />
  )
}
