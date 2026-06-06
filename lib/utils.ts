import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date))
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export function formatRelativeTime(date: string | Date): string {
  const now = new Date()
  const target = new Date(date)
  const diff = target.getTime() - now.getTime()
  const absDiff = Math.abs(diff)

  const minutes = Math.floor(absDiff / 60_000)
  const hours = Math.floor(absDiff / 3_600_000)
  const days = Math.floor(absDiff / 86_400_000)

  if (absDiff < 60_000) return "à l'instant"
  if (minutes < 60) return diff > 0 ? `dans ${minutes}min` : `il y a ${minutes}min`
  if (hours < 24) return diff > 0 ? `dans ${hours}h` : `il y a ${hours}h`
  return diff > 0 ? `dans ${days}j` : `il y a ${days}j`
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? '')
    .join('')
}

export function isUUID(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

// Arrondit vers le bas pour masquer le chiffre exact dans l'UI publique.
// < 10 → exact · 10–99 → palier de 10 · ≥ 100 → palier de 25
export function approxCount(n: number): { value: number; suffix: string } {
  if (n < 10) return { value: n, suffix: '' }
  if (n < 100) return { value: Math.floor(n / 10) * 10, suffix: '+' }
  return { value: Math.floor(n / 25) * 25, suffix: '+' }
}

// Valide qu'un redirect destination est un chemin relatif interne.
// Rejette tout ce qui commence par '//' ou qui n'est pas '/' (URLs externes).
// Empêche les attaques open redirect : /login?redirectTo=https://evil.com
export function buildGoogleCalendarUrl(event: {
  title: string
  start_at: string
  end_at: string | null
  description?: string | null
  location?: string | null
}): string {
  function toGDate(iso: string) {
    return new Date(iso).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  }
  const start = toGDate(event.start_at)
  const end = event.end_at
    ? toGDate(event.end_at)
    : toGDate(new Date(new Date(event.start_at).getTime() + 3_600_000).toISOString())
  const params = new URLSearchParams({ action: 'TEMPLATE', text: event.title, dates: `${start}/${end}` })
  if (event.description) params.set('details', event.description)
  if (event.location) params.set('location', event.location)
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

export function safeRedirect(to: string | null | undefined, fallback = '/dashboard'): string {
  if (!to || typeof to !== 'string') return fallback
  if (!to.startsWith('/') || to.startsWith('//')) return fallback
  return to
}
