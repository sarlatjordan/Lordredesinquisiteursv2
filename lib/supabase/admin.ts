import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

// Client avec service_role — bypass RLS complet
// À utiliser UNIQUEMENT côté serveur (Server Actions, Route Handlers)
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}
