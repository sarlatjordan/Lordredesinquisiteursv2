import type { Metadata } from 'next'
import { LoginClient } from './login-client'

export const metadata: Metadata = { title: 'Connexion' }

interface LoginPageProps {
  searchParams: Promise<{ redirectTo?: string; error?: string }>
}

// Server Component : lit les query params côté serveur et les
// transmet au composant client. Pas de 'use client' ici —
// useSearchParams() côté client nécessiterait un Suspense boundary.
export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { redirectTo, error } = await searchParams
  return <LoginClient redirectTo={redirectTo} errorParam={error} />
}
