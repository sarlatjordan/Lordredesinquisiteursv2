'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  TrendingUp, Clock, Play, CheckCircle, XCircle,
  Loader2, Plus, AlertCircle, Scroll, ChevronUp, ChevronDown, History,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { initiateEvaluation, updateEvaluationStatus } from '@/actions/rank-evaluations'
import { ROLES, ROLE_COLORS, ROLE_PRIVILEGES, type Role } from '@/lib/constants'
import { formatDate } from '@/lib/utils'
import type { RankEvaluationWithProfiles, PromotionHistoryItem, Profile } from '@/types'

interface Props {
  evaluations: RankEvaluationWithProfiles[]
  members: Pick<Profile, 'id' | 'username' | 'display_name' | 'role'>[]
  history: PromotionHistoryItem[]
}

const STATUS_LABELS: Record<string, string> = {
  pending:     'Assignée',
  in_progress: 'En cours',
}

const STATUS_COLORS: Record<string, string> = {
  pending:     'text-amber-400 border-amber-400/30 bg-amber-400/10',
  in_progress: 'text-cyan-400 border-cyan-400/30 bg-cyan-400/10',
}

// ─── Dialog initier une épreuve ───────────────────────────────────────────────

function InitiateDialog({
  members,
}: {
  members: Pick<Profile, 'id' | 'username' | 'display_name' | 'role'>[]
}) {
  const [open, setOpen] = useState(false)
  const [memberId, setMemberId] = useState('')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const router = useRouter()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!memberId) { setError('Sélectionner un membre.'); return }
    setError('')
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await initiateEvaluation(fd)
      if (res.success) {
        setMemberId('')
        setOpen(false)
        router.refresh()
      } else {
        setError(res.error)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) setMemberId(''); setOpen(v) }}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          Lancer une épreuve
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Lancer une épreuve de rang</DialogTitle>
          <DialogDescription>
            Le membre sera notifié et pourra consulter les instructions depuis son profil.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="member_id_trigger">Membre</Label>
            <Select value={memberId} onValueChange={setMemberId}>
              <SelectTrigger id="member_id_trigger">
                <SelectValue placeholder="Sélectionner un membre…" />
              </SelectTrigger>
              <SelectContent>
                {members.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.display_name ?? m.username} — {ROLES[m.role as Role] ?? m.role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <input type="hidden" name="member_id" value={memberId} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="instructions">Instructions de l&apos;épreuve</Label>
            <Textarea
              id="instructions"
              name="instructions"
              placeholder="Décris ce que le membre doit accomplir pour valider cette épreuve…"
              rows={5}
              maxLength={2000}
              required
            />
            <p className="text-[11px] text-muted-foreground">Ces instructions seront visibles par le membre.</p>
          </div>

          {error && (
            <p className="flex items-center gap-1.5 text-xs text-destructive">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              {error}
            </p>
          )}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Annuler</Button>
            <Button type="submit" disabled={isPending} className="gap-1.5">
              {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Lancer l&apos;épreuve
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Card évaluation active ───────────────────────────────────────────────────

function EvalCard({ ev }: { ev: RankEvaluationWithProfiles }) {
  const [isPending, startTransition] = useTransition()
  const [updateError, setUpdateError] = useState<string | null>(null)
  const router = useRouter()

  function update(status: 'in_progress' | 'passed' | 'failed' | 'cancelled') {
    setUpdateError(null)
    startTransition(async () => {
      const result = await updateEvaluationStatus(ev.id, status)
      if (!result.success) { setUpdateError(result.error); return }
      router.refresh()
    })
  }

  return (
    <li className="p-4 space-y-3">
      <div className="flex items-start gap-3">
        <Avatar className="h-10 w-10 border border-border shrink-0">
          <AvatarImage src={ev.member.avatar_url ?? undefined} />
          <AvatarFallback className="bg-primary/10 text-primary text-xs">
            {ev.member.username.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-foreground">
              {ev.member.display_name ?? ev.member.username}
            </p>
            <Badge
              variant="outline"
              className={`text-[10px] px-1.5 capitalize ${ROLE_COLORS[ev.member.role as Role] ?? ''}`}
            >
              {ROLES[ev.member.role as Role] ?? ev.member.role}
            </Badge>
            <Badge
              variant="outline"
              className={`text-[10px] px-1.5 ${STATUS_COLORS[ev.status] ?? ''}`}
            >
              {STATUS_LABELS[ev.status] ?? ev.status}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
            <Clock className="h-3 w-3" />
            {formatDistanceToNow(new Date(ev.created_at), { locale: fr, addSuffix: true })}
            {' · '}initiée par {ev.initiator.display_name ?? ev.initiator.username}
          </p>
        </div>
      </div>

      {ev.instructions && (
        <div className="rounded-md border border-border bg-muted/20 px-3 py-2.5 flex gap-2">
          <Scroll className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
            {ev.instructions}
          </p>
        </div>
      )}

      {updateError && (
        <div className="rounded-md bg-destructive/10 border border-destructive/30 px-3 py-2">
          <p className="text-xs text-destructive">{updateError}</p>
        </div>
      )}
      <div className="flex items-center gap-2 flex-wrap">
        {ev.status === 'pending' && (
          <Button
            size="sm" variant="outline"
            className="gap-1.5 text-cyan-400 border-cyan-400/30 hover:bg-cyan-400/10"
            onClick={() => update('in_progress')}
            disabled={isPending}
          >
            {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
            Démarrer
          </Button>
        )}
        <Button
          size="sm" variant="outline"
          className="gap-1.5 text-green-400 border-green-400/30 hover:bg-green-400/10"
          onClick={() => update('passed')}
          disabled={isPending}
        >
          {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
          Réussie
        </Button>
        <Button
          size="sm" variant="outline"
          className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10"
          onClick={() => update('failed')}
          disabled={isPending}
        >
          {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
          Échouée
        </Button>
        <Button
          size="sm" variant="ghost"
          className="gap-1.5 text-muted-foreground hover:text-foreground"
          onClick={() => update('cancelled')}
          disabled={isPending}
        >
          Annuler
        </Button>
      </div>
    </li>
  )
}

// ─── Ligne historique promotion ───────────────────────────────────────────────

function HistoryItem({ item }: { item: PromotionHistoryItem }) {
  const fromRole = item.from_role as Role
  const toRole   = item.to_role as Role
  const isUp     = (ROLE_PRIVILEGES[toRole] ?? 0) > (ROLE_PRIVILEGES[fromRole] ?? 0)

  return (
    <li className="flex items-start gap-3 px-4 py-3">
      <Avatar className="h-9 w-9 border border-border shrink-0 mt-0.5">
        <AvatarImage src={item.member.avatar_url ?? undefined} />
        <AvatarFallback className="bg-primary/10 text-primary text-xs">
          {item.member.username.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-foreground">
            {item.member.display_name ?? item.member.username}
          </span>
          {isUp
            ? <ChevronUp className="h-3.5 w-3.5 text-green-400 shrink-0" />
            : <ChevronDown className="h-3.5 w-3.5 text-destructive shrink-0" />
          }
          <div className="flex items-center gap-1">
            <Badge variant="outline" className={`text-[10px] px-1 py-0 ${ROLE_COLORS[fromRole] ?? ''}`}>
              {ROLES[fromRole] ?? fromRole}
            </Badge>
            <span className="text-[10px] text-muted-foreground">→</span>
            <Badge variant="outline" className={`text-[10px] px-1 py-0 ${ROLE_COLORS[toRole] ?? ''}`}>
              {ROLES[toRole] ?? toRole}
            </Badge>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          {formatDate(item.promoted_at)}
          {item.promoter ? ` · par ${item.promoter.display_name ?? item.promoter.username}` : ''}
          {item.points_at_promotion != null ? ` · ${item.points_at_promotion} pts` : ''}
        </p>
        {item.reason && (
          <p className="text-xs text-muted-foreground/70 mt-0.5 line-clamp-1 italic">{item.reason}</p>
        )}
      </div>
    </li>
  )
}

// ─── Page principale ──────────────────────────────────────────────────────────

export function PromotionsClient({ evaluations, members, history }: Props) {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 border border-primary/30 shrink-0">
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">Épreuves de rang</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {evaluations.length} épreuve{evaluations.length !== 1 ? 's' : ''} active{evaluations.length !== 1 ? 's' : ''}
              {' · '}{history.length} promotion{history.length !== 1 ? 's' : ''} au total
            </p>
          </div>
        </div>
        <InitiateDialog members={members} />
      </div>

      <Tabs defaultValue="actives">
        <TabsList className="h-auto bg-transparent p-0 gap-2">
          <TabsTrigger
            value="actives"
            className="group flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors
              data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:border-primary/30
              data-[state=inactive]:bg-card data-[state=inactive]:text-muted-foreground data-[state=inactive]:border-border
              data-[state=inactive]:hover:border-primary/20 data-[state=inactive]:hover:text-foreground"
          >
            <TrendingUp className="h-3.5 w-3.5" />
            Épreuves actives
            <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full text-xs font-bold
              group-data-[state=active]:bg-primary/20 group-data-[state=active]:text-primary
              group-data-[state=inactive]:bg-muted group-data-[state=inactive]:text-muted-foreground">
              {evaluations.length}
            </span>
          </TabsTrigger>

          <TabsTrigger
            value="historique"
            className="group flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors
              data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:border-primary/30
              data-[state=inactive]:bg-card data-[state=inactive]:text-muted-foreground data-[state=inactive]:border-border
              data-[state=inactive]:hover:border-primary/20 data-[state=inactive]:hover:text-foreground"
          >
            <History className="h-3.5 w-3.5" />
            Historique
            <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full text-xs font-bold
              group-data-[state=active]:bg-primary/20 group-data-[state=active]:text-primary
              group-data-[state=inactive]:bg-muted group-data-[state=inactive]:text-muted-foreground">
              {history.length}
            </span>
          </TabsTrigger>
        </TabsList>

        {/* Épreuves actives */}
        <TabsContent value="actives" className="mt-6">
          {evaluations.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <TrendingUp className="h-10 w-10 text-muted-foreground/40" />
              <p className="text-muted-foreground">Aucune épreuve de rang en cours.</p>
            </div>
          ) : (
            <div className="rounded-xl border border-border overflow-hidden">
              <ul className="divide-y divide-border">
                {evaluations.map((ev) => (
                  <EvalCard key={ev.id} ev={ev} />
                ))}
              </ul>
            </div>
          )}
        </TabsContent>

        {/* Historique des promotions */}
        <TabsContent value="historique" className="mt-6">
          {history.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <History className="h-10 w-10 text-muted-foreground/40" />
              <p className="text-muted-foreground">Aucune promotion enregistrée.</p>
            </div>
          ) : (
            <div className="rounded-xl border border-border overflow-hidden">
              <ul className="divide-y divide-border">
                {history.map((item) => (
                  <HistoryItem key={item.id} item={item} />
                ))}
              </ul>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
