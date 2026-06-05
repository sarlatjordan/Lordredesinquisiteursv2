import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
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

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  if (!isUUID(id)) return new NextResponse('Not found', { status: 404 })

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .single()

  if (!event) return new NextResponse('Not found', { status: 404 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (getRolePrivilege(profile?.role ?? 'visiteur') < (event.min_privilege ?? 0))
    return new NextResponse('Forbidden', { status: 403 })

  const dtStart = toICSDate(event.start_at)
  const dtEnd = event.end_at
    ? toICSDate(event.end_at)
    : toICSDate(new Date(new Date(event.start_at).getTime() + 60 * 60 * 1000).toISOString())

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//INQFR//Ordre des Inquisiteurs//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:inqfr-event-${event.id}@inqfr`,
    `DTSTAMP:${toICSDate(new Date().toISOString())}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    foldLine(`SUMMARY:${escapeICS(event.title)}`),
  ]

  if (event.description) lines.push(foldLine(`DESCRIPTION:${escapeICS(event.description)}`))
  if (event.location)    lines.push(foldLine(`LOCATION:${escapeICS(event.location)}`))

  lines.push('END:VEVENT', 'END:VCALENDAR')

  const filename = `${event.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.ics`

  return new NextResponse(lines.join('\r\n'), {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
