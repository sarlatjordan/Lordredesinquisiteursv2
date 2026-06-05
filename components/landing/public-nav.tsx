'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { APP_ABBREVIATION } from '@/lib/constants'
import { Menu, X, LogOut, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface PublicNavProps {
  isLoggedIn: boolean
}

export function PublicNav({ isLoggedIn }: PublicNavProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const { scrollY } = useScroll()
  const bgOpacity = useTransform(scrollY, [0, 80], [0, 1])
  const router = useRouter()

  function handleSignOut() {
    startTransition(async () => {
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push('/login')
      router.refresh()
    })
  }

  return (
    <motion.header
      className="fixed top-0 left-0 right-0 z-50"
    >
      {/* fond flouté apparaît au scroll */}
      <motion.div
        className="absolute inset-0 bg-background/90 backdrop-blur-md border-b border-border"
        style={{ opacity: bgOpacity }}
      />

      <div className="relative flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg overflow-hidden border border-primary/30 group-hover:border-primary/60 transition-colors bg-background">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="INQFR" className="w-full h-full object-contain p-0.5" />
          </div>
          <span className="font-bold text-foreground tracking-wide">{APP_ABBREVIATION}</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
          <Link href="/#about" className="hover:text-foreground transition-colors">L&apos;Ordre</Link>
          <Link href="/#events" className="hover:text-foreground transition-colors">Activités</Link>
          <Link href="/calendrier" className="hover:text-foreground transition-colors">Calendrier</Link>
          <Link href="/galerie" className="hover:text-foreground transition-colors">Galerie</Link>
          <Link href="/stats" className="hover:text-foreground transition-colors">Statistiques</Link>
          <Link href="/#discord" className="hover:text-foreground transition-colors">Discord</Link>
          <Link href="/recrutement" className="hover:text-foreground transition-colors">Recrutement</Link>
        </nav>

        {/* CTAs desktop */}
        <div className="hidden md:flex items-center gap-3">
          {isLoggedIn ? (
            <>
              <Button asChild size="sm">
                <Link href="/dashboard">Accéder au QG</Link>
              </Button>
              <Button variant="ghost" size="sm" onClick={handleSignOut} disabled={isPending} className="gap-1.5 text-muted-foreground">
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
                Déconnexion
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">Se connecter</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/recrutement">Rejoindre l&apos;Ordre</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile burger */}
        <button
          className="md:hidden text-muted-foreground hover:text-foreground"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menu"
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative md:hidden bg-background/95 backdrop-blur-md border-b border-border px-6 pb-5 space-y-4"
        >
          <nav className="flex flex-col gap-3 text-sm text-muted-foreground pt-2">
            <Link href="/#about" onClick={() => setMenuOpen(false)} className="hover:text-foreground">L&apos;Ordre</Link>
            <Link href="/#events" onClick={() => setMenuOpen(false)} className="hover:text-foreground">Activités</Link>
            <Link href="/calendrier" onClick={() => setMenuOpen(false)} className="hover:text-foreground">Calendrier</Link>
            <Link href="/galerie" onClick={() => setMenuOpen(false)} className="hover:text-foreground">Galerie</Link>
            <Link href="/stats" onClick={() => setMenuOpen(false)} className="hover:text-foreground">Statistiques</Link>
            <Link href="/#discord" onClick={() => setMenuOpen(false)} className="hover:text-foreground">Discord</Link>
            <Link href="/recrutement" onClick={() => setMenuOpen(false)} className="hover:text-foreground">Recrutement</Link>
          </nav>
          <div className="flex flex-col gap-2 pt-2 border-t border-border">
            {isLoggedIn ? (
              <>
                <Button asChild size="sm"><Link href="/dashboard">Accéder au QG</Link></Button>
                <Button variant="outline" size="sm" onClick={handleSignOut} disabled={isPending} className="gap-1.5 w-full">
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
                  Déconnexion
                </Button>
              </>
            ) : (
              <>
                <Button asChild variant="outline" size="sm"><Link href="/login">Se connecter</Link></Button>
                <Button asChild size="sm"><Link href="/recrutement">Rejoindre l&apos;Ordre</Link></Button>
              </>
            )}
          </div>
        </motion.div>
      )}
    </motion.header>
  )
}
