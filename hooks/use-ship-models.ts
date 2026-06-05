import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { ShipModel } from '@/types'

export function useShipModels() {
  return useQuery({
    queryKey: ['ship-models'],
    queryFn: async (): Promise<ShipModel[]> => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('ship_models')
        .select('id, name, manufacturer, ship_type, focus, min_crew, max_crew, cargo_capacity, production_status, rsi_url, image_url, synced_at')
        .order('name')
      if (error) throw new Error(error.message)
      return (data ?? []) as ShipModel[]
    },
    staleTime: 1000 * 60 * 60, // 1h — les modèles changent rarement
    gcTime: 1000 * 60 * 60 * 24,
  })
}
