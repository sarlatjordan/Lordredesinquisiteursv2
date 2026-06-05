import Link from 'next/link'
import { Shield } from 'lucide-react'
import { APP_ABBREVIATION, APP_TAGLINE } from '@/lib/constants'

export function LandingFooter() {
  return (
    <footer className="border-t border-border bg-card/30 px-6 py-10">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 border border-primary/30">
            <Shield className="h-3.5 w-3.5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">{APP_ABBREVIATION}</p>
            <p className="text-[10px] text-muted-foreground/60">{APP_TAGLINE}</p>
          </div>
        </div>

        <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <Link href="/#about" className="hover:text-foreground transition-colors">L&apos;Ordre</Link>
          <Link href="/#events" className="hover:text-foreground transition-colors">Activités</Link>
          <Link href="/calendrier" className="hover:text-foreground transition-colors">Calendrier</Link>
          <Link href="/galerie" className="hover:text-foreground transition-colors">Galerie</Link>
          <Link href="/#discord" className="hover:text-foreground transition-colors">Discord</Link>
          <Link href="/recrutement" className="hover:text-foreground transition-colors">Recrutement</Link>
          <Link href="/login" className="hover:text-foreground transition-colors">Connexion</Link>
          <a
            href="https://robertsspaceindustries.com/orgs/INQFR"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors"
          >
            RSI
          </a>
        </nav>

        <p className="text-xs text-muted-foreground/40 text-center sm:text-right">
          © {new Date().getFullYear()} L&apos;Ordre des Inquisiteurs
          <br />
          <span className="text-[10px]">Star Citizen est une marque de Cloud Imperium Games</span>
        </p>
      </div>
    </footer>
  )
}
