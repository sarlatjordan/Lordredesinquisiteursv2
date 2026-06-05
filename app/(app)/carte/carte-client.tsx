'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { Plus, Trash2, MapPin, Filter, X, Edit2, Aperture, ArrowLeftRight } from 'lucide-react'
import {
  MAP_POINT_TYPES, MAP_POINT_COLORS, MAP_POINT_BADGE_COLORS,
  MAP_POINT_STATUS, SC_SYSTEMS,
  type MapPointType, type MapPointStatus,
} from '@/lib/constants'
import { createMapPoint, updateMapPoint, deleteMapPoint, createJumpLane, deleteJumpLane } from '@/actions/map'
import type { MapPoint, MapJumpLane, MapPointInput } from '@/types'

// ─── Positions des systèmes sur la carte ─────────────────────────────────────

const SYSTEM_POSITIONS: Record<string, { x: number; y: number }> = {
  Terra:    { x: 355, y: 170 },
  Magnus:   { x: 440, y: 235 },
  Ellis:    { x: 275, y: 238 },
  Nexus:    { x: 525, y: 182 },
  Nyx:      { x: 568, y: 255 },
  Stanton:  { x: 478, y: 308 },
  Castra:   { x: 582, y: 318 },
  Bremen:   { x: 238, y: 308 },
  Davien:   { x: 335, y: 355 },
  Kiel:     { x: 168, y: 240 },
  Odin:     { x: 102, y: 168 },
  Vega:     { x: 192, y: 398 },
  Leir:     { x: 362, y: 455 },
  Pyro:     { x: 488, y: 418 },
  Chronos:  { x: 668, y: 232 },
  Idris:    { x: 755, y: 298 },
  Oberon:   { x: 842, y: 172 },
  Ariel:    { x: 858, y: 358 },
  Virgil:   { x: 748, y: 408 },
  Tamsa:    { x: 762, y: 508 },
  Hades:    { x: 632, y: 492 },
  Nul:      { x: 508, y: 538 },
}

// ─── Composant principal ─────────────────────────────────────────────────────

interface CarteClientProps {
  points:    MapPoint[]
  jumpLanes: MapJumpLane[]
  canManage: boolean
  canDelete: boolean
}

export function CarteClient({ points, jumpLanes, canManage, canDelete }: CarteClientProps) {
  const [selectedSystem, setSelectedSystem] = useState<string | null>(null)
  const [hoveredSystem,  setHoveredSystem]  = useState<string | null>(null)
  const [typeFilter,     setTypeFilter]     = useState<MapPointType | null>(null)
  const [addOpen,        setAddOpen]        = useState(false)
  const [presetSystem,   setPresetSystem]   = useState('')

  const visiblePoints = points.filter((p) => {
    if (selectedSystem && p.system_name !== selectedSystem) return false
    if (typeFilter && p.type !== typeFilter) return false
    return true
  })

  const pointsBySystem = points.reduce<Record<string, MapPoint[]>>((acc, p) => {
    acc[p.system_name] = acc[p.system_name] ?? []
    acc[p.system_name].push(p)
    return acc
  }, {})

  function handleSystemClick(name: string) {
    setSelectedSystem((prev) => (prev === name ? null : name))
  }

  function openAddForSystem(name: string) {
    setPresetSystem(name)
    setAddOpen(true)
  }

  const offMapSystems = [...new Set(points.map((p) => p.system_name))].filter((s) => !SYSTEM_POSITIONS[s])

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Carte stratégique</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {points.length} point{points.length > 1 ? 's' : ''} · {jumpLanes.length} zone{jumpLanes.length > 1 ? 's' : ''} de saut
            </p>
          </div>
          <div className="flex gap-2">
            {canDelete && (
              <JumpLaneEditorDialog jumpLanes={jumpLanes} />
            )}
            {canManage && (
              <AddOrEditPointDialog
                open={addOpen}
                onOpenChange={setAddOpen}
                presetSystem={presetSystem}
                onPresetReset={() => setPresetSystem('')}
              >
                <Button size="sm" className="gap-1.5">
                  <Plus className="h-4 w-4" />
                  Ajouter un point
                </Button>
              </AddOrEditPointDialog>
            )}
          </div>
        </div>

        {/* Layout */}
        <div className="flex flex-col lg:flex-row gap-4">

          {/* Carte SVG */}
          <div className="flex-1 min-w-0">
            <div className="rounded-xl border border-border overflow-hidden bg-[#07111f]">
              <div className="w-full" style={{ aspectRatio: '1000/580' }}>
                <svg
                  viewBox="0 0 1000 580"
                  className="w-full h-full"
                  style={{ fontFamily: 'ui-monospace, monospace' }}
                >
                  <defs>
                    <pattern id="grid" width="80" height="80" patternUnits="userSpaceOnUse">
                      <path d="M 80 0 L 0 0 0 80" fill="none" stroke="#0d2340" strokeWidth="0.5" />
                    </pattern>
                  </defs>
                  <rect width="1000" height="580" fill="#07111f" />
                  <rect width="1000" height="580" fill="url(#grid)" />

                  {STARS.map((s, i) => (
                    <circle key={i} cx={s[0]} cy={s[1]} r={s[2]} fill="white" opacity={s[3]} />
                  ))}

                  {selectedSystem && (
                    <text x="500" y="24" textAnchor="middle" fill="#6366f1" fontSize="13" fontWeight="bold" opacity="0.9">
                      {selectedSystem} — {pointsBySystem[selectedSystem]?.length ?? 0} point{(pointsBySystem[selectedSystem]?.length ?? 0) > 1 ? 's' : ''}
                    </text>
                  )}

                  {/* Jump lanes depuis la DB */}
                  {jumpLanes.map((lane) => {
                    const posA = SYSTEM_POSITIONS[lane.system_a]
                    const posB = SYSTEM_POSITIONS[lane.system_b]
                    if (!posA || !posB) return null
                    const isHighlighted = selectedSystem === lane.system_a || selectedSystem === lane.system_b
                    return (
                      <line
                        key={lane.id}
                        x1={posA.x} y1={posA.y} x2={posB.x} y2={posB.y}
                        stroke={isHighlighted ? '#4f6dff' : '#1a3050'}
                        strokeWidth={isHighlighted ? 1.5 : 0.8}
                        strokeDasharray={isHighlighted ? '4 3' : '3 4'}
                        opacity={isHighlighted ? 0.7 : 0.5}
                      />
                    )
                  })}

                  {/* Systèmes */}
                  {Object.entries(SYSTEM_POSITIONS).map(([name, pos]) => {
                    const sysPoints   = pointsBySystem[name] ?? []
                    const isSelected  = selectedSystem === name
                    const isHovered   = hoveredSystem === name
                    const hasPoints   = sysPoints.length > 0
                    const uniqueTypes = [...new Set(sysPoints.map((p) => p.type as MapPointType))]

                    return (
                      <g
                        key={name}
                        onClick={() => handleSystemClick(name)}
                        onMouseEnter={() => setHoveredSystem(name)}
                        onMouseLeave={() => setHoveredSystem(null)}
                        style={{ cursor: 'pointer' }}
                      >
                        {(isSelected || isHovered) && (
                          <circle cx={pos.x} cy={pos.y} r={26}
                            fill="#4f6dff" opacity={isSelected ? 0.18 : 0.09} />
                        )}
                        <circle cx={pos.x} cy={pos.y} r={15}
                          fill={hasPoints ? '#0e2040' : '#080f1c'}
                          stroke={isSelected ? '#6366f1' : isHovered ? '#3b4e8a' : '#1a3050'}
                          strokeWidth={isSelected ? 2 : 1.5}
                        />
                        {uniqueTypes.slice(0, 6).map((type, i) => {
                          const angle = (i * (360 / Math.max(uniqueTypes.length, 1)) - 90) * (Math.PI / 180)
                          return (
                            <circle key={type}
                              cx={pos.x + Math.cos(angle) * 20}
                              cy={pos.y + Math.sin(angle) * 20}
                              r={3.5} fill={MAP_POINT_COLORS[type]} opacity={0.9}
                            />
                          )
                        })}
                        {sysPoints.length > 0 && (
                          <text x={pos.x} y={pos.y + 4} textAnchor="middle"
                            fill={isSelected ? '#818cf8' : '#4a6fa8'} fontSize="9" fontWeight="bold">
                            {sysPoints.length}
                          </text>
                        )}
                        <text x={pos.x} y={pos.y + 28} textAnchor="middle"
                          fill={isSelected ? '#e2e8f0' : isHovered ? '#94a3b8' : '#4a6073'}
                          fontSize="10" fontWeight={isSelected ? 'bold' : 'normal'}>
                          {name}
                        </text>
                        {canManage && isHovered && (
                          <g onClick={(e) => { e.stopPropagation(); openAddForSystem(name) }}>
                            <circle cx={pos.x + 14} cy={pos.y - 14} r={8} fill="#6366f1" opacity="0.9" />
                            <text x={pos.x + 14} y={pos.y - 10} textAnchor="middle"
                              fill="white" fontSize="13" fontWeight="bold">+</text>
                          </g>
                        )}
                      </g>
                    )
                  })}

                  {/* Légende */}
                  <g transform="translate(12, 540)">
                    {(Object.entries(MAP_POINT_TYPES) as [MapPointType, string][]).map(([type, label], i) => (
                      <g key={type} transform={`translate(${i * 155}, 0)`}>
                        <circle cx={6} cy={5} r={5} fill={MAP_POINT_COLORS[type]} opacity={0.9} />
                        <text x={14} y={9} fill="#4a6073" fontSize="9">{label}</text>
                      </g>
                    ))}
                  </g>
                </svg>
              </div>
            </div>

            {offMapSystems.length > 0 && (
              <div className="mt-3 rounded-lg border border-border bg-card/50 p-3">
                <p className="text-xs text-muted-foreground mb-2 font-medium">Systèmes non cartographiés</p>
                <div className="flex flex-wrap gap-2">
                  {offMapSystems.map((s) => (
                    <button key={s}
                      onClick={() => setSelectedSystem((prev) => (prev === s ? null : s))}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border transition-colors ${
                        selectedSystem === s
                          ? 'bg-primary/10 text-primary border-primary/30'
                          : 'bg-card text-muted-foreground border-border hover:border-primary/20'
                      }`}
                    >
                      <MapPin className="h-2.5 w-2.5" />
                      {s}
                      <span className="text-muted-foreground/60">({pointsBySystem[s]?.length ?? 0})</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:w-80 shrink-0 space-y-3">
            <div className="rounded-lg border border-border bg-card p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Filter className="h-3.5 w-3.5" />Filtres
                </div>
                {(selectedSystem || typeFilter) && (
                  <button onClick={() => { setSelectedSystem(null); setTypeFilter(null) }}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                    <X className="h-3 w-3" />Réinitialiser
                  </button>
                )}
              </div>
              {selectedSystem && (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">Système :</span>
                  <button onClick={() => setSelectedSystem(null)}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary border border-primary/30">
                    {selectedSystem}<X className="h-2.5 w-2.5" />
                  </button>
                </div>
              )}
              <div className="flex flex-wrap gap-1.5">
                {(Object.keys(MAP_POINT_TYPES) as MapPointType[]).map((t) => {
                  const count = points.filter((p) =>
                    p.type === t && (!selectedSystem || p.system_name === selectedSystem)
                  ).length
                  if (!count) return null
                  return (
                    <button key={t}
                      onClick={() => setTypeFilter((prev) => (prev === t ? null : t))}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] border transition-colors ${
                        typeFilter === t ? MAP_POINT_BADGE_COLORS[t] : 'bg-card text-muted-foreground border-border hover:border-primary/20'
                      }`}
                    >
                      <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: MAP_POINT_COLORS[t] }} />
                      {MAP_POINT_TYPES[t]}
                      <span className="opacity-60">({count})</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card overflow-hidden">
              <div className="px-3 py-2 border-b border-border">
                <p className="text-xs font-medium text-muted-foreground">
                  {visiblePoints.length} point{visiblePoints.length > 1 ? 's' : ''}
                  {selectedSystem ? ` — ${selectedSystem}` : ''}
                </p>
              </div>
              <div className="max-h-[500px] overflow-y-auto divide-y divide-border">
                {visiblePoints.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-8 text-center">
                    <MapPin className="h-6 w-6 text-muted-foreground/30" />
                    <p className="text-xs text-muted-foreground">Aucun point.</p>
                    {canManage && (
                      <button onClick={() => { setPresetSystem(selectedSystem ?? ''); setAddOpen(true) }}
                        className="text-xs text-primary hover:underline">Ajouter le premier</button>
                    )}
                  </div>
                ) : (
                  visiblePoints.map((p) => (
                    <PointRow
                      key={p.id}
                      point={p}
                      canManage={canManage}
                      canDelete={canDelete}
                      onSystemClick={(s) => setSelectedSystem((prev) => (prev === s ? null : s))}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}

// ─── Ligne point ──────────────────────────────────────────────────────────────

function PointRow({
  point, canManage, canDelete, onSystemClick,
}: {
  point: MapPoint
  canManage: boolean
  canDelete: boolean
  onSystemClick: (s: string) => void
}) {
  const router = useRouter()
  const [isPending, start] = useTransition()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const type   = point.type   as MapPointType
  const status = point.status as MapPointStatus

  function handleDelete() {
    start(async () => {
      await deleteMapPoint(point.id)
      router.refresh()
    })
  }

  return (
    <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="px-3 py-2.5 group hover:bg-accent/50 transition-colors">
      <div className="flex items-start gap-2">
        <span className="mt-1 inline-block w-2 h-2 rounded-full shrink-0"
          style={{ background: MAP_POINT_COLORS[type] }} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-sm font-medium text-foreground truncate">{point.name}</span>
            <Badge variant="outline" className={`text-[9px] px-1 py-0 shrink-0 ${MAP_POINT_BADGE_COLORS[type]}`}>
              {MAP_POINT_TYPES[type]}
            </Badge>
            {status !== 'active' && (
              <Badge variant="outline" className="text-[9px] px-1 py-0 text-muted-foreground shrink-0">
                {MAP_POINT_STATUS[status]}
              </Badge>
            )}
          </div>
          <button onClick={() => onSystemClick(point.system_name)}
            className="text-[10px] text-muted-foreground/60 hover:text-primary transition-colors">
            {point.system_name}
          </button>
          {point.description && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{point.description}</p>
          )}
        </div>

        {/* Actions — visibles au hover */}
        <div className="shrink-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {canManage && (
            <AddOrEditPointDialog
              open={editOpen}
              onOpenChange={setEditOpen}
              existingPoint={point}
            >
              <button className="p-1 rounded hover:bg-primary/10 transition-colors" title="Modifier">
                <Edit2 className="h-3 w-3 text-muted-foreground hover:text-primary" />
              </button>
            </AddOrEditPointDialog>
          )}
          {canDelete && (
            confirmDelete ? (
              <div className="flex gap-1 items-center">
                <button onClick={handleDelete} disabled={isPending}
                  className="text-[10px] text-destructive hover:underline">Suppr.</button>
                <button onClick={() => setConfirmDelete(false)}
                  className="text-[10px] text-muted-foreground hover:underline">Ann.</button>
              </div>
            ) : (
              <button onClick={() => setConfirmDelete(true)} className="p-1 rounded hover:bg-destructive/10 transition-colors">
                <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
              </button>
            )
          )}
        </div>
      </div>
    </motion.div>
  )
}

// ─── Dialog ajout / édition point ────────────────────────────────────────────

function AddOrEditPointDialog({
  open, onOpenChange, presetSystem, onPresetReset, existingPoint, children,
}: {
  open?: boolean
  onOpenChange?: (v: boolean) => void
  presetSystem?: string
  onPresetReset?: () => void
  existingPoint?: MapPoint
  children: React.ReactNode
}) {
  const router = useRouter()
  const isEdit = !!existingPoint

  const [internalOpen, setInternalOpen] = useState(false)
  const controlled = open !== undefined
  const isOpen     = controlled ? open : internalOpen

  function handleOpenChange(v: boolean) {
    if (controlled) onOpenChange?.(v)
    else setInternalOpen(v)
    if (!v) { onPresetReset?.(); reset() }
  }

  const [systemName,  setSystemName]  = useState(existingPoint?.system_name ?? '')
  const [name,        setName]        = useState(existingPoint?.name ?? '')
  const [type,        setType]        = useState<MapPointType>((existingPoint?.type as MapPointType) ?? 'zone_interet')
  const [description, setDescription] = useState(existingPoint?.description ?? '')
  const [status,      setStatus]      = useState<'active' | 'inactive' | 'unknown'>(
    (existingPoint?.status as 'active' | 'inactive' | 'unknown') ?? 'active'
  )
  const [error,    setError]    = useState<string | null>(null)
  const [isPending, start]      = useTransition()

  function handleOpenSync(v: boolean) {
    if (v && !isEdit) setSystemName(presetSystem ?? '')
    handleOpenChange(v)
  }

  function reset() {
    if (!isEdit) {
      setSystemName('')
      setName('')
      setType('zone_interet')
      setDescription('')
      setStatus('active')
    }
    setError(null)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const input: MapPointInput = { system_name: systemName, name, type, description, status }
    start(async () => {
      const result = isEdit
        ? await updateMapPoint(existingPoint!.id, input)
        : await createMapPoint(input)
      if (!result.success) { setError(result.error); return }
      if (!isEdit) reset()
      handleOpenChange(false)
      router.refresh()
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenSync}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Modifier le point' : "Nouveau point d'intérêt"}</DialogTitle>
          <DialogDescription>
            {isEdit ? `Édition de « ${existingPoint!.name} »` : 'Ajouter un point sur la carte stratégique'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="mp-system">Système *</Label>
            <Input id="mp-system" value={systemName} onChange={(e) => setSystemName(e.target.value)}
              list="sc-systems-datalist" placeholder="Ex: Stanton, Pyro…" required autoComplete="off" />
            <datalist id="sc-systems-datalist">
              {SC_SYSTEMS.map((s) => <option key={s} value={s} />)}
            </datalist>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="mp-name">Nom *</Label>
            <Input id="mp-name" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Station INQFR, Zone de minage…" required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Type *</Label>
              <Select value={type} onValueChange={(v) => setType(v as MapPointType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.entries(MAP_POINT_TYPES) as [MapPointType, string][]).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Statut</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as 'active' | 'inactive' | 'unknown')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Actif</SelectItem>
                  <SelectItem value="inactive">Inactif</SelectItem>
                  <SelectItem value="unknown">Inconnu</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="mp-desc">Description</Label>
            <Textarea id="mp-desc" value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="Contexte, coordonnées en jeu, notes tactiques…"
              rows={3} className="resize-none" />
          </div>

          {error && (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={isPending}>
              Annuler
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (isEdit ? 'Enregistrement…' : 'Ajout…') : (isEdit ? 'Enregistrer' : 'Ajouter')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Éditeur de zones de saut (Sage) ─────────────────────────────────────────

function JumpLaneEditorDialog({ jumpLanes }: { jumpLanes: MapJumpLane[] }) {
  const router = useRouter()
  const [open,      setOpen]     = useState(false)
  const [systemA,   setSystemA]  = useState('')
  const [systemB,   setSystemB]  = useState('')
  const [addError,  setAddError] = useState<string | null>(null)
  const [isPending, start]       = useTransition()

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setAddError(null)
    start(async () => {
      const result = await createJumpLane(systemA, systemB)
      if (!result.success) { setAddError(result.error); return }
      setSystemA('')
      setSystemB('')
      router.refresh()
    })
  }

  function handleDelete(id: string) {
    start(async () => {
      await deleteJumpLane(id)
      router.refresh()
    })
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="gap-1.5 text-cyan-400 border-cyan-400/30 hover:bg-cyan-400/10">
                <Aperture className="h-4 w-4" />
                Zones de saut
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Aperture className="h-5 w-5 text-cyan-400" />
                  Zones de saut
                </DialogTitle>
                <DialogDescription>
                  Gérer les couloirs de navigation entre systèmes
                </DialogDescription>
              </DialogHeader>

              {/* Formulaire ajout */}
              <form onSubmit={handleAdd} className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs">Système A</Label>
                    <Input value={systemA} onChange={(e) => setSystemA(e.target.value)}
                      list="jl-systems-a" placeholder="Ex: Stanton" autoComplete="off" required />
                    <datalist id="jl-systems-a">
                      {SC_SYSTEMS.map((s) => <option key={s} value={s} />)}
                    </datalist>
                  </div>
                  <ArrowLeftRight className="h-4 w-4 text-cyan-400 shrink-0 mt-5" />
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs">Système B</Label>
                    <Input value={systemB} onChange={(e) => setSystemB(e.target.value)}
                      list="jl-systems-b" placeholder="Ex: Pyro" autoComplete="off" required />
                    <datalist id="jl-systems-b">
                      {SC_SYSTEMS.map((s) => <option key={s} value={s} />)}
                    </datalist>
                  </div>
                  <Button type="submit" size="sm" className="mt-5 shrink-0" disabled={isPending}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {addError && (
                  <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {addError}
                  </p>
                )}
              </form>

              {/* Liste des lanes */}
              <div className="rounded-lg border border-border overflow-hidden">
                <div className="px-3 py-2 border-b border-border bg-muted/20">
                  <p className="text-xs font-medium text-muted-foreground">
                    {jumpLanes.length} connexion{jumpLanes.length > 1 ? 's' : ''}
                  </p>
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-border">
                  {jumpLanes.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-6">
                      Aucune zone de saut définie.
                    </p>
                  ) : (
                    jumpLanes.map((lane) => (
                      <div key={lane.id} className="flex items-center gap-2 px-3 py-2 group hover:bg-accent/50">
                        <span className="text-[10px] font-mono text-cyan-400/80 w-2 h-2 rounded-full bg-cyan-400/30 flex-none" />
                        <span className="flex-1 text-sm font-mono text-foreground">
                          {lane.system_a}
                          <span className="text-muted-foreground mx-1.5">↔</span>
                          {lane.system_b}
                        </span>
                        <button
                          onClick={() => handleDelete(lane.id)}
                          disabled={isPending}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-destructive/10"
                        >
                          <X className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Fermer</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom">Éditer les zones de saut</TooltipContent>
    </Tooltip>
  )
}

// ─── Étoiles de fond ─────────────────────────────────────────────────────────

const STARS: [number, number, number, number][] = [
  [45,32,1,.6],[128,87,.8,.4],[234,45,1.2,.7],[312,123,.8,.5],[89,210,1,.6],
  [456,67,.8,.4],[567,134,1,.5],[678,89,.8,.7],[789,201,1.2,.4],[890,56,.8,.6],
  [123,345,1,.5],[234,456,.8,.4],[345,23,1,.6],[456,234,.8,.5],[567,345,1.2,.4],
  [678,456,.8,.6],[789,312,1,.5],[890,423,.8,.4],[23,456,1,.7],[156,512,.8,.5],
  [267,389,1,.4],[378,512,.8,.6],[489,178,.8,.5],[600,512,1,.4],[711,145,.8,.6],
  [822,512,1.2,.5],[933,289,.8,.4],[67,134,1,.5],[178,267,.8,.6],[289,178,1,.4],
  [400,512,.8,.5],[511,445,.8,.7],[622,178,1,.4],[733,512,.8,.5],[844,345,1.2,.4],
  [955,178,.8,.6],[34,389,1,.5],[145,178,.8,.4],[978,512,1,.6],[512,289,.6,.3],
  [256,512,.6,.3],[768,78,.6,.3],
]
