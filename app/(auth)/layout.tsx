import type { ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { APP_NAME } from '@/lib/constants'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 relative overflow-hidden">

      {/* Champ d'étoiles */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: [
            'radial-gradient(1px 1px at 8% 18%, rgba(255,255,255,.55) 0,transparent 100%)',
            'radial-gradient(1px 1px at 19% 7%, rgba(255,255,255,.4) 0,transparent 100%)',
            'radial-gradient(1.5px 1.5px at 31% 28%, rgba(255,255,255,.65) 0,transparent 100%)',
            'radial-gradient(1px 1px at 42% 5%, rgba(255,255,255,.35) 0,transparent 100%)',
            'radial-gradient(1px 1px at 54% 19%, rgba(255,255,255,.5) 0,transparent 100%)',
            'radial-gradient(1.5px 1.5px at 67% 9%, rgba(255,255,255,.6) 0,transparent 100%)',
            'radial-gradient(1px 1px at 78% 24%, rgba(255,255,255,.4) 0,transparent 100%)',
            'radial-gradient(1px 1px at 88% 14%, rgba(255,255,255,.5) 0,transparent 100%)',
            'radial-gradient(1px 1px at 5% 38%, rgba(255,255,255,.3) 0,transparent 100%)',
            'radial-gradient(1px 1px at 25% 44%, rgba(255,255,255,.45) 0,transparent 100%)',
            'radial-gradient(1px 1px at 60% 35%, rgba(255,255,255,.35) 0,transparent 100%)',
            'radial-gradient(1.5px 1.5px at 92% 40%, rgba(255,255,255,.55) 0,transparent 100%)',
            'radial-gradient(1px 1px at 15% 60%, rgba(255,255,255,.4) 0,transparent 100%)',
            'radial-gradient(1px 1px at 47% 55%, rgba(255,255,255,.3) 0,transparent 100%)',
            'radial-gradient(1px 1px at 72% 48%, rgba(255,255,255,.5) 0,transparent 100%)',
            'radial-gradient(1px 1px at 84% 62%, rgba(255,255,255,.35) 0,transparent 100%)',
            'radial-gradient(1px 1px at 3% 72%, rgba(255,255,255,.4) 0,transparent 100%)',
            'radial-gradient(1px 1px at 38% 76%, rgba(255,255,255,.25) 0,transparent 100%)',
            'radial-gradient(1px 1px at 95% 78%, rgba(255,255,255,.45) 0,transparent 100%)',
            'radial-gradient(1.5px 1.5px at 55% 82%, rgba(255,255,255,.5) 0,transparent 100%)',
            'radial-gradient(1px 1px at 12% 88%, rgba(255,255,255,.3) 0,transparent 100%)',
            'radial-gradient(1px 1px at 73% 91%, rgba(255,255,255,.4) 0,transparent 100%)',
          ].join(','),
        }}
      />

      {/* Planète / nébuleuse — coin supérieur droit */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -right-24 h-[480px] w-[480px] rounded-full"
        style={{
          background:
            'radial-gradient(circle at 40% 40%, rgba(99,102,241,0.18) 0%, rgba(49,46,129,0.10) 40%, rgba(15,15,26,0.04) 65%, transparent 80%)',
          filter: 'blur(3px)',
        }}
      />

      {/* Nébuleuse indigo — centre */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/4 left-1/2 -translate-x-1/2 h-[600px] w-[600px] rounded-full blur-[120px]"
        style={{ background: 'rgba(99,102,241,0.07)' }}
      />

      {/* Sol de hangar quadrillé */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-0 right-0 h-48"
        style={{
          backgroundImage:
            'linear-gradient(rgba(129,140,248,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(129,140,248,0.07) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          maskImage: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)',
        }}
      />

      {/* Ligne horizon */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-48 left-0 h-px w-full bg-gradient-to-r from-transparent via-primary/25 to-transparent"
      />

      {/* Logo */}
      <Link href="/" className="mb-8 flex flex-col items-center gap-3 group relative z-10">
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
      <div className="w-full max-w-sm relative z-10">{children}</div>

      <p className="mt-8 text-xs text-muted-foreground text-center relative z-10">
        © {new Date().getFullYear()} {APP_NAME} — Star Citizen Org
      </p>
    </div>
  )
}
