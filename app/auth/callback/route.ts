import { createClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'
import { safeRedirect } from '@/lib/utils'

// Route appelée par Supabase apres clic sur le magic link.
// Le param `next` est ajouté par MagicLinkForm pour rediriger
// vers la page intentée plutôt que le dashboard.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const code = searchParams.get('code')
  const next = safeRedirect(searchParams.get('next'))

  const supabase = await createClient()

  // Flow OTP / magic link (token_hash)
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as 'email' | 'magiclink' | 'recovery',
    })
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Flow PKCE (code)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Echec — rediriger avec message d erreur
  return NextResponse.redirect(`${origin}/login?error=lien_invalide_ou_expire`)
}
