'use client'

import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import { RedactedContent } from './redacted-content'
import type { PageAccessRule } from '@/types'

function getMinPrivilege(rules: PageAccessRule[], pathname: string): number {
  const sorted = [...rules].sort((a, b) => b.path.length - a.path.length)
  const match = sorted.find(r => pathname === r.path || pathname.startsWith(r.path + '/'))
  return match?.min_privilege ?? 100
}

interface AccessGateProps {
  privilege: number
  rules: PageAccessRule[]
  children: ReactNode
}

export function AccessGate({ privilege, rules, children }: AccessGateProps) {
  const pathname = usePathname()
  if (privilege < getMinPrivilege(rules, pathname)) return <RedactedContent />
  return <>{children}</>
}
