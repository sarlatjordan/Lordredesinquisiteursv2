import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { safeRedirect } from '@/lib/utils'
import type { Database } from '@/types/database'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const code = searchParams.get('code')
  const next = safeRedirect(searchParams.get('next'))

  // La réponse de succès est créée en premier — le client Supabase y écrira
  // directement les cookies de session via setAll, sinon ils seraient perdus
  // (cookies() de next/headers et NextResponse.redirect sont des objets distincts).
  const successResponse = NextResponse.redirect(`${origin}${next}`)

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            successResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Flow OTP / magic link / invite (token_hash)
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as 'email' | 'invite' | 'magiclink' | 'recovery',
    })
    if (!error) return successResponse
  }

  // Flow PKCE (code — OAuth Google/Discord)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return successResponse
  }

  return NextResponse.redirect(`${origin}/login?error=lien_invalide_ou_expire`)
}
