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

function base64urlToUint8Array(b64url: string): Uint8Array {
  const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/')
  const padded = b64.padEnd(Math.ceil(b64.length / 4) * 4, '=')
  const binary = atob(padded)
  const arr = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i)
  return arr
}

async function isTrustedDevice(request: NextRequest, userId: string): Promise<boolean> {
  const secret = process.env.MFA_DEVICE_SECRET
  if (!secret) return false

  const rawToken = request.cookies.get('mfa_device_trust')?.value
  if (!rawToken) return false

  const dotIdx = rawToken.lastIndexOf('.')
  if (dotIdx < 1) return false
  const encoded = rawToken.slice(0, dotIdx)
  const sig = rawToken.slice(dotIdx + 1)

  try {
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify'],
    )

    const sigArr  = base64urlToUint8Array(sig)
    const dataArr = new TextEncoder().encode(encoded)
    const valid = await crypto.subtle.verify(
      'HMAC', key,
      sigArr.buffer.slice(sigArr.byteOffset, sigArr.byteOffset + sigArr.byteLength) as ArrayBuffer,
      dataArr.buffer.slice(dataArr.byteOffset, dataArr.byteOffset + dataArr.byteLength) as ArrayBuffer,
    )
    if (!valid) return false

    const decodedArr = base64urlToUint8Array(encoded)
    const payload = JSON.parse(new TextDecoder().decode(
      decodedArr.buffer.slice(decodedArr.byteOffset, decodedArr.byteOffset + decodedArr.byteLength) as ArrayBuffer,
    )) as {
      userId: string
      expiresAt: string
      deviceId: string
    }
    if (payload.userId !== userId) return false
    if (new Date(payload.expiresAt) < new Date()) return false

    return true
  } catch {
    return false
  }
}

export async function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)
  requestHeaders.set('x-pathname', request.nextUrl.pathname)

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
  const isMFAPage = pathname === '/mfa'
  const hasAuthTokens = searchParams.has('code') || searchParams.has('token_hash')

  const publicRoutes = ['/', '/recrutement', '/calendrier', '/galerie', '/stats']
  const isPublicRoute = publicRoutes.includes(pathname)
  const isApiRoute = pathname.startsWith('/api/')

  const csp = buildCSP(nonce)

  if (isCallbackPage || hasAuthTokens) {
    supabaseResponse.headers.set('Content-Security-Policy', csp)
    return supabaseResponse
  }

  if (!user && !isLoginPage && !isPublicRoute && !isApiRoute) {
    const url = request.nextUrl.clone()
    const intended = request.nextUrl.search ? `${pathname}${request.nextUrl.search}` : pathname
    url.pathname = '/login'
    url.search = ''
    url.searchParams.set('redirectTo', intended)
    const res = NextResponse.redirect(url)
    res.headers.set('Content-Security-Policy', csp)
    return res
  }

  if (user && isLoginPage) {
    const url = request.nextUrl.clone()
    url.pathname = safeRedirect(searchParams.get('redirectTo'))
    url.search = ''
    const res = NextResponse.redirect(url)
    res.headers.set('Content-Security-Policy', csp)
    return res
  }

  // Enforce MFA on every protected route — le layout seul n'est pas fiable
  // (les navigations client-side ne re-rendent pas nécessairement le layout)
  if (user && !isLoginPage && !isPublicRoute && !isMFAPage && !isApiRoute) {
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
    if (aal?.nextLevel === 'aal2' && aal?.currentLevel !== 'aal2') {
      const trusted = await isTrustedDevice(request, user.id)
      if (!trusted) {
        const url = request.nextUrl.clone()
        url.pathname = '/mfa'
        url.search = ''
        const res = NextResponse.redirect(url)
        res.headers.set('Content-Security-Policy', csp)
        return res
      }
    }
  }

  supabaseResponse.headers.set('Content-Security-Policy', csp)
  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
