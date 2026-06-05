import type { ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { APP_NAME } from '@/lib/constants'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 relative overflow-hidden">
      {/* Fond décoratif */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 h-[600px] w-[600px] rounded-full bg-primary/3 blur-[120px]" />
        <div className="absolute bottom-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      </div>

      {/* Logo */}
      <Link href="/" className="mb-8 flex flex-col items-center gap-3 group">
        <Image
          src="/logo.png"
          alt={APP_NAME}
          width={72}
          height={72}
          className="rounded-xl sc-glow transition-opacity group-hover:opacity-80"
          priority
        />
      </Link>

      {/* Contenu */}
      <div className="w-full max-w-sm">{children}</div>

      <p className="mt-8 text-xs text-muted-foreground text-center">
        © {new Date().getFullYear()} {APP_NAME} — Star Citizen Org
      </p>
    </div>
  )
}
