'use client'

import { usePathname } from 'next/navigation'
import { PAGE_BACKGROUNDS } from '@/lib/page-backgrounds'

export function PageBackground() {
  const pathname = usePathname()

  const bgPath = Object.entries(PAGE_BACKGROUNDS)
    .filter(([route]) => pathname === route || pathname.startsWith(route + '/'))
    .sort((a, b) => b[0].length - a[0].length)[0]?.[1]

  if (!bgPath) return null

  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 z-0 pointer-events-none"
      style={{
        backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.82) 100%), url(${bgPath})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    />
  )
}
