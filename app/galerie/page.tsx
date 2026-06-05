import type { Metadata } from 'next'
import { PublicNav } from '@/components/landing/public-nav'
import { LandingFooter } from '@/components/landing/landing-footer'
import { createClient } from '@/lib/supabase/server'
import { getPublicGallery } from '@/lib/public-data'
import { GalleryClient } from './gallery-client'
import { ImageIcon } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Galerie',
  description: 'Screenshots et moments marquants de L\'Ordre des Inquisiteurs dans Star Citizen.',
}

export default async function GaleriePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const media = await getPublicGallery()

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PublicNav isLoggedIn={!!user} />

      <main className="pt-24 pb-16 px-6 max-w-6xl mx-auto">
        <div className="pt-4 mb-10">
          <p className="text-xs font-semibold tracking-[0.25em] text-primary/70 uppercase mb-2">
            Visuel
          </p>
          <h1 className="text-3xl sm:text-4xl font-black text-foreground">
            Galerie de l&apos;Ordre
          </h1>
          <p className="mt-2 text-muted-foreground text-sm">
            Screenshots et moments marquants de nos opérations dans l&apos;univers de Star Citizen.
          </p>
        </div>

        {media.length === 0 ? (
          <div className="py-24 flex flex-col items-center gap-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
              <ImageIcon className="h-8 w-8 text-primary/50" />
            </div>
            <p className="text-muted-foreground">La galerie est encore vide — les premiers visuels arrivent bientôt.</p>
          </div>
        ) : (
          <GalleryClient media={media} />
        )}
      </main>

      <LandingFooter />
    </div>
  )
}
