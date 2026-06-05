import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyIcsToken } from '@/lib/ics-token'
import { isUUID } from '@/lib/utils'
import { getRolePrivilege } from '@/lib/constants'

function toICSDate(iso: string): string {
  return new Date(iso).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
}

function escapeICS(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
    .replace(/\n/g, '\\n')
}

// RFC 5545 — fold lines at 75 octets
function foldLine(line: string): string {
  if (line.length <= 75) return line
  const chunks: string[] = []
  let remaining = line
  let first = true
  while (remaining.length > 0) {
    const limit = first ? 75 : 74
    chunks.push((first ? '' : ' ') + remaining.slice(0, limit))
    remaining = remaining.slice(limit)
    first = false
  }
  return chunks.join('\r\n')
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const uid   = searchParams.get('uid')
  const token = searchParams.get('token')

  if (!uid || !token) {
    return new NextResponse('uid et token requis', { status: 400 })
  }

  if (!isUUID(uid)) {
    return new NextResponse('uid invalide', { status: 400 })
  }

  // Validation HMAC — timing-safe
  if (!verifyIcsToken(uid, token)) {
    return new NextResponse('Token invalide', { status: 401 })
  }

  const supabase = createAdminClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', uid)
    .single()

  if (!profile) return new NextResponse('Membre introuvable', { status: 404 })

  const userPrivilege = getRolePrivilege(profile.role)

  // Tous les événements futurs accessibles selon le rang du membre
  const { data: events } = await supabase
    .from('events')
    .select('*')
    .in('status', ['planifie', 'en_cours'])
    .gte('start_at', new Date().toISOString())
    .lte('min_privilege', userPrivilege)
    .order('start_at', { ascending: true })
    .limit(200)

  const now = toICSDate(new Date().toISOString())

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//INQFR//Ordre des Inquisiteurs//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    foldLine('X-WR-CALNAME:INQFR — Événements'),
    'X-WR-TIMEZONE:UTC',
    'REFRESH-INTERVAL;VALUE=DURATION:PT1H',
    `X-PUBLISHED-TTL:PT1H`,
  ]

  for (const event of events ?? []) {
    const dtStart = toICSDate(event.start_at)
    const dtEnd = event.end_at
      ? toICSDate(event.end_at)
      : toICSDate(new Date(new Date(event.start_at).getTime() + 60 * 60 * 1000).toISOString())

    lines.push('BEGIN:VEVENT')
    lines.push(`UID:inqfr-event-${event.id}@inqfr`)
    lines.push(`DTSTAMP:${now}`)
    lines.push(`DTSTART:${dtStart}`)
    lines.push(`DTEND:${dtEnd}`)
    lines.push(foldLine(`SUMMARY:${escapeICS(event.title)}`))
    if (event.description) lines.push(foldLine(`DESCRIPTION:${escapeICS(event.description)}`))
    if (event.location) lines.push(foldLine(`LOCATION:${escapeICS(event.location)}`))
    lines.push('END:VEVENT')
  }

  lines.push('END:VCALENDAR')

  return new NextResponse(lines.join('\r\n'), {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'attachment; filename="inqfr-evenements.ics"',
      'Cache-Control': 'no-store',
    },
  })
}
