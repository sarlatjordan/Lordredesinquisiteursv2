'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react'
import type { MediaGallery } from '@/types'

interface GalleryClientProps {
  media: MediaGallery[]
}

// ─── Lightbox plein écran ─────────────────────────────────────────────────────

function Lightbox({
  media,
  index,
  onClose,
  onNavigate,
}: {
  media: MediaGallery[]
  index: number
  onClose: () => void
  onNavigate: (delta: number) => void
}) {
  const item    = media[index]
  const hasPrev = index > 0
  const hasNext = index < media.length - 1

  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape')      onClose()
      if (e.key === 'ArrowLeft'  && hasPrev) onNavigate(-1)
      if (e.key === 'ArrowRight' && hasNext) onNavigate(1)
    },
    [onClose, onNavigate, hasPrev, hasNext],
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [handleKey])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/97 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Compteur */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 text-xs text-muted-foreground bg-card/80 border border-border px-3 py-1 rounded-full">
        {index + 1} / {media.length}
      </div>

      {/* Fermer */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
        aria-label="Fermer (Échap)"
      >
        <X className="h-4 w-4" />
      </button>

      {/* Flèche gauche */}
      {hasPrev && (
        <button
          onClick={(e) => { e.stopPropagation(); onNavigate(-1) }}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-card/90 border border-border text-foreground hover:bg-primary/10 hover:border-primary/30 hover:text-primary transition-colors"
          aria-label="Image précédente"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      )}

      {/* Flèche droite */}
      {hasNext && (
        <button
          onClick={(e) => { e.stopPropagation(); onNavigate(1) }}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-card/90 border border-border text-foreground hover:bg-primary/10 hover:border-primary/30 hover:text-primary transition-colors"
          aria-label="Image suivante"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      )}

      {/* Image + légende */}
      <motion.div
        key={item.id}
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.2 }}
        className="flex flex-col items-center gap-4 px-16 max-w-6xl w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.url}
          alt={item.title ?? 'Galerie INQFR'}
          className="max-h-[80vh] max-w-full object-contain rounded-lg shadow-2xl"
          draggable={false}
        />

        {(item.title || item.caption) && (
          <div className="text-center space-y-1">
            {item.title && (
              <p className="text-sm font-semibold text-foreground">{item.title}</p>
            )}
            {item.caption && (
              <p className="text-xs text-muted-foreground">{item.caption}</p>
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

// ─── Galerie publique ─────────────────────────────────────────────────────────

export function GalleryClient({ media }: GalleryClientProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  function navigate(delta: number) {
    setLightboxIndex((prev) => {
      if (prev === null) return null
      const next = prev + delta
      if (next < 0 || next >= media.length) return prev
      return next
    })
  }

  return (
    <>
      {/* Masonry CSS columns */}
      <div className="gap-3" style={{ columns: 'var(--gcols, 2) 180px' }}>
        <style>{`
          @media (min-width: 640px)  { :root { --gcols: 3; } }
          @media (min-width: 1024px) { :root { --gcols: 4; } }
        `}</style>

        {media.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: Math.min(i * 0.04, 0.4), duration: 0.4 }}
            className="mb-3 break-inside-avoid"
            style={{ breakInside: 'avoid' }}
          >
            <button
              onClick={() => setLightboxIndex(i)}
              className="group relative w-full rounded-lg overflow-hidden border border-border bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={`Agrandir — ${item.title ?? 'image'}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.url}
                alt={item.title ?? 'Galerie INQFR'}
                className="w-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />

              <div className="absolute inset-0 bg-background/0 group-hover:bg-background/40 transition-colors duration-200 flex items-center justify-center">
                <ZoomIn className="h-7 w-7 text-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-200 drop-shadow-lg" />
              </div>

              {(item.title || item.caption) && (
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-background/90 to-transparent px-3 py-2 translate-y-full group-hover:translate-y-0 transition-transform duration-200">
                  {item.title && (
                    <p className="text-xs font-semibold text-foreground truncate">{item.title}</p>
                  )}
                  {item.caption && (
                    <p className="text-[10px] text-muted-foreground truncate">{item.caption}</p>
                  )}
                </div>
              )}
            </button>
          </motion.div>
        ))}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxIndex !== null && (
          <Lightbox
            key="lightbox"
            media={media}
            index={lightboxIndex}
            onClose={() => setLightboxIndex(null)}
            onNavigate={navigate}
          />
        )}
      </AnimatePresence>
    </>
  )
}
