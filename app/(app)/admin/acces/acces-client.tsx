'use client'

import { useState, useTransition } from 'react'
import { Check, Loader2 } from 'lucide-react'
import { updatePageAccessRule } from '@/actions/page-access'
import type { PageAccessRule } from '@/types'

const RANKS: { label: string; short: string; privilege: number; color: string }[] = [
  { label: 'Visiteur',          short: 'V',  privilege: 50,   color: 'bg-zinc-700 text-zinc-300' },
  { label: 'Aspirant',          short: 'A',  privilege: 100,  color: 'bg-sky-900/60 text-sky-300' },
  { label: 'Consacré',          short: 'C',  privilege: 150,  color: 'bg-indigo-900/60 text-indigo-300' },
  { label: 'Gardien',           short: 'G',  privilege: 300,  color: 'bg-violet-900/60 text-violet-300' },
  { label: 'Inquisiteur',       short: 'I',  privilege: 400,  color: 'bg-fuchsia-900/60 text-fuchsia-300' },
  { label: 'Maître Inquisiteur',short: 'MI', privilege: 600,  color: 'bg-rose-900/60 text-rose-300' },
  { label: 'Sage',              short: 'S',  privilege: 1000, color: 'bg-amber-900/60 text-amber-300' },
]

function RankCell({
  rank,
  isActive,
  isMin,
  saving,
  onClick,
}: {
  rank: (typeof RANKS)[number]
  isActive: boolean
  isMin: boolean
  saving: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={saving}
      title={`Accès minimum : ${rank.label}`}
      className={`
        relative h-8 w-full rounded transition-all text-xs font-semibold
        ${isActive
          ? isMin
            ? `${rank.color} ring-2 ring-white/30`
            : `${rank.color} opacity-60`
          : 'bg-muted/30 text-muted-foreground/40 hover:bg-muted/60'
        }
        ${saving ? 'cursor-wait' : 'cursor-pointer'}
      `}
    >
      {isMin && saving
        ? <Loader2 className="h-3 w-3 animate-spin mx-auto" />
        : isMin
          ? <Check className="h-3 w-3 mx-auto" />
          : rank.short
      }
    </button>
  )
}

function PageRow({ rule }: { rule: PageAccessRule }) {
  const [minPrivilege, setMinPrivilege] = useState(rule.min_privilege)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleClick(privilege: number) {
    if (privilege === minPrivilege) return
    setError(null)
    const prev = minPrivilege
    setMinPrivilege(privilege)
    startTransition(async () => {
      const result = await updatePageAccessRule(rule.path, privilege)
      if (!result.success) {
        setMinPrivilege(prev)
        setError(result.error ?? 'Erreur')
      }
    })
  }

  return (
    <tr className="border-b border-border/50 hover:bg-muted/20 transition-colors">
      <td className="py-3 pl-4 pr-6 min-w-[180px]">
        <p className="text-sm font-medium text-foreground">{rule.label}</p>
        <p className="text-xs text-muted-foreground font-mono">{rule.path}</p>
        {error && (
          <p className="text-xs text-destructive mt-1">{error}</p>
        )}
      </td>
      {RANKS.map((rank) => {
        const isActive = rank.privilege >= minPrivilege
        const isMin = rank.privilege === minPrivilege
        return (
          <td key={rank.privilege} className="py-3 px-1.5 w-[80px]">
            <RankCell
              rank={rank}
              isActive={isActive}
              isMin={isMin}
              saving={isPending}
              onClick={() => handleClick(rank.privilege)}
            />
          </td>
        )
      })}
    </tr>
  )
}

export function AccesClient({ rules }: { rules: PageAccessRule[] }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Gestion des accès</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Rang minimum requis pour accéder à chaque section. Cliquer sur un rang le définit comme seuil — tous les rangs supérieurs ont automatiquement accès.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="py-3 pl-4 pr-6 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Page
              </th>
              {RANKS.map((rank) => (
                <th
                  key={rank.privilege}
                  className="py-3 px-1.5 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider w-[80px]"
                  title={rank.label}
                >
                  {rank.short}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rules.map((rule) => (
              <PageRow key={rule.path} rule={rule} />
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-200/80">
        <strong className="text-amber-300">Note :</strong> les pages d&apos;administration
        (<code className="text-xs">/admin/*</code>) ont leur propre contrôle d&apos;accès
        indépendant et n&apos;apparaissent pas ici.
      </div>
    </div>
  )
}
