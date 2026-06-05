import Link from 'next/link'
import { ShieldOff } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center space-y-8 max-w-md">
        <div className="flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-destructive/30 bg-destructive/10">
            <ShieldOff className="h-10 w-10 text-destructive" />
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-[11px] font-bold tracking-[0.4em] text-destructive/70 uppercase">
            Dossier introuvable
          </p>
          <h1 className="text-6xl font-black text-foreground tabular-nums">404</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Ce secteur de l&apos;espace n&apos;existe pas dans nos archives.
            La coordonnée que vous cherchez a peut-être été effacée ou n&apos;a jamais existé.
          </p>
        </div>

        <Button asChild>
          <Link href="/dashboard">Retour au QG</Link>
        </Button>
      </div>
    </div>
  )
}
