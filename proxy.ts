import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { safeRedirect } from '@/lib/utils'

function buildCSP(nonce: string): string {
  const isDev = process.env.NODE_ENV === 'development'
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ''}`,
    "style-src 'self' 'unsafe-inline'", // nonce non viable : Radix + framer-motion injectent des style="" attrs à l'exécution
    "img-src 'self' data: blob: https://media.robertsspaceindustries.com https://*.supabase.co https://*.supabase.in",
    "font-src 'self' data:",
    "connect-src 'self' https://*.supabase.co https://*.supabase.in wss://*.supabase.co wss://*.supabase.in",
    "frame-src https://challenges.cloudflare.com",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests",
  ].join('; ')
}

export async function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)

  let supabaseResponse = NextResponse.next({ request: { headers: requestHeaders } })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request: { headers: requestHeaders } })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname
  const searchParams = request.nextUrl.searchParams
  const isLoginPage = pathname === '/login'
  const isCallbackPage = pathname === '/auth/callback'
  const hasAuthTokens = searchParams.has('code') || searchParams.has('token_hash')

  // Routes publiques — accessibles sans authentification
  const publicRoutes = ['/', '/recrutement', '/calendrier', '/galerie', '/stats']
  const isPublicRoute = publicRoutes.includes(pathname)

  const csp = buildCSP(nonce)

  if (isCallbackPage || hasAuthTokens) {
    supabaseResponse.headers.set('Content-Security-Policy', csp)
    return supabaseResponse
  }

  // Rediriger vers /login si non authentifié sur une page protégée
  // On mémorise le chemin + éventuels query params pour y revenir après connexion
  if (!user && !isLoginPage && !isPublicRoute) {
    const url = request.nextUrl.clone()
    const intended = request.nextUrl.search ? `${pathname}${request.nextUrl.search}` : pathname
    url.pathname = '/login'
    url.search = ''
    url.searchParams.set('redirectTo', intended)
    const res = NextResponse.redirect(url)
    res.headers.set('Content-Security-Policy', csp)
    return res
  }

  // Rediriger après connexion : vers la page intentée si présente, sinon /dashboard
  if (user && isLoginPage) {
    const url = request.nextUrl.clone()
    url.pathname = safeRedirect(searchParams.get('redirectTo'))
    url.search = ''
    const res = NextResponse.redirect(url)
    res.headers.set('Content-Security-Policy', csp)
    return res
  }

  supabaseResponse.headers.set('Content-Security-Policy', csp)
  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
