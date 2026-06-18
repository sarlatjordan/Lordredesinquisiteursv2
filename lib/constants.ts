import type { ExtendedOnboardingStep } from '@/types'

export const APP_NAME = "L'Ordre des Inquisiteurs"
export const APP_ABBREVIATION = 'INQFR'
export const APP_TAGLINE = 'Organisation Star Citizen — Alpha Quadrant'

export const ROLES = {
  visiteur:          'Visiteur',
  aspirant:          'Aspirant',
  consacre:          'Consacré',
  gardien:           'Gardien',
  inquisiteur:       'Inquisiteur',
  maitre_inquisiteur: 'Maître Inquisiteur',
  sage:              'Sage',
} as const

export type Role = keyof typeof ROLES

// Niveau de privilège par rang — utilisé pour les contrôles d'accès
export const ROLE_PRIVILEGES: Record<Role, number> = {
  visiteur:           50,
  aspirant:          100,
  consacre:          150,
  gardien:           300,
  inquisiteur:       400,
  maitre_inquisiteur: 600,
  sage:             1000,
}

// Seuils de privilège pour les actions clés
export const PRIVILEGE = {
  CREATE_EVENTS:    100,  // FEAT-09 : Aspirant+ peut créer un événement
  MANAGE_EVENTS:    300,  // Gardien+ peut modifier/supprimer/gérer les participants
  MANAGE_FLEET:     300,
  MANAGE_RESOURCES: 600,
  SYNC_MATRIX:     1000,
  MANAGE_MEMBERS:  1000,
  CREATE_OPS:       600,  // FEAT-12 : MI+ requis pour créer une opération
  MANAGE_OPS:       300,
  // Solde corporatif UEC visible dès Aspirant.
  // Pour restreindre (ex: Gardien+), changer 100 → 300.
  VIEW_GUILD_BANK:  100,
} as const

export function getRolePrivilege(role: string): number {
  return ROLE_PRIVILEGES[role as Role] ?? 0
}

// ─── FEAT-29 : Badges / achievements ─────────────────────────────────────────
export const BADGES = {
  first_op:      { label: 'Première Opération',  description: 'Première inscription à une opération', emoji: '⚔️',  color: 'amber'  },
  ops_5:         { label: 'Vétéran',             description: '5 opérations', emoji: '🎖️',  color: 'amber'  },
  ops_10:        { label: 'Guerrier Aguerri',    description: '10 opérations', emoji: '🏅',  color: 'orange' },
  first_event:   { label: 'Premier Événement',   description: 'Première participation à un événement', emoji: '🎯',  color: 'blue'   },
  events_5:      { label: 'Habitué',             description: '5 événements', emoji: '⭐',  color: 'blue'   },
  first_ship:    { label: 'Pilote',              description: 'Premier vaisseau enregistré', emoji: '🚀',  color: 'cyan'   },
  first_report:  { label: 'Chroniqueur',         description: "Premier rapport d'événement", emoji: '📋',  color: 'green'  },
  first_debrief: { label: 'Stratège',            description: "Premier débrief d'opération", emoji: '🗺️', color: 'purple' },
  loot_received: { label: 'Butinneur',           description: 'Premier partage de butin reçu', emoji: '💰',  color: 'yellow' },
} as const

export type BadgeKey = keyof typeof BADGES

// ─── FEAT-26 : Disponibilité ─────────────────────────────────────────────────
export const AVAILABILITY_DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'] as const
export const AVAILABILITY_SLOTS = ['Matin', 'Après-midi', 'Soir', 'Nuit'] as const

export type RankProgressionEntry = {
  nextRank: Role
  title: string
  description: string
}

export const RANK_PROGRESSION: Partial<Record<Role, RankProgressionEntry>> = {
  visiteur: {
    nextRank: 'aspirant',
    title: "Admission dans l'Ordre",
    description: "Ton dossier de candidature est en cours d'examen par le Haut Conseil. Une fois validé, tu intègreras l'Ordre en tant qu'Aspirant.",
  },
  aspirant: {
    nextRank: 'consacre',
    title: "Épreuve de compétence",
    description: "Tu devras réussir une mission de gameplay simple définie par un Gardien — un test de tes compétences de base dans l'univers Star Citizen.",
  },
  consacre: {
    nextRank: 'gardien',
    title: "Épreuves d'expérience",
    description: "Deux missions de gameplay tirées au hasard t'attendent pour prouver ta maîtrise. Elles évalueront ton expérience acquise et ta capacité à les relever en solo ou en groupe.",
  },
  gardien: {
    nextRank: 'inquisiteur',
    title: "Épreuve de commandement",
    description: "Tu devras organiser un événement privé au sein de l'Ordre sur un thème imposé par le Haut Conseil — démontrant ton leadership et ta maîtrise de l'organisation.",
  },
  inquisiteur: {
    nextRank: 'maitre_inquisiteur',
    title: "Épreuve de maîtrise",
    description: "Sous vote des Sages, tu organiseras un événement public au sein de l'alliance. Tu seras évalué sur ta gestion des membres et d'une flotte, ainsi que sur le respect de prérequis définis.",
  },
  maitre_inquisiteur: {
    nextRank: 'sage',
    title: "Accession au rang de Sage",
    description: "Le passage au rang de Sage se fait uniquement par discussion et vote du Conseil des Sages — et seulement si un Sage en poste ne peut plus assumer ses fonctions et cède sa place.",
  },
}

export const ROLE_COLORS: Record<Role, string> = {
  visiteur:           'text-slate-400 bg-slate-400/10 border-slate-400/20',
  aspirant:           'text-slate-300 bg-slate-300/10 border-slate-300/20',
  consacre:           'text-green-400 bg-green-400/10 border-green-400/30',
  gardien:            'text-cyan-400 bg-cyan-400/10 border-cyan-400/30',
  inquisiteur:        'text-blue-400 bg-blue-400/10 border-blue-400/30',
  maitre_inquisiteur: 'text-purple-400 bg-purple-400/10 border-purple-400/30',
  sage:               'text-amber-400 bg-amber-400/10 border-amber-400/30',
}

export const EVENT_TYPES = {
  operation: 'Opération',
  reunion: 'Réunion',
  formation: 'Formation',
  social: 'Social',
  autre: 'Autre',
} as const

export type EventType = keyof typeof EVENT_TYPES

export const EVENT_TYPE_COLORS: Record<EventType, string> = {
  operation: 'text-red-400 bg-red-400/10 border-red-400/30',
  reunion: 'text-blue-400 bg-blue-400/10 border-blue-400/30',
  formation: 'text-green-400 bg-green-400/10 border-green-400/30',
  social: 'text-purple-400 bg-purple-400/10 border-purple-400/30',
  autre: 'text-slate-400 bg-slate-400/10 border-slate-400/20',
}

export const EVENT_STATUS = {
  planned:   'Planifié',
  active:    'En cours',
  completed: 'Terminé',
  cancelled: 'Annulé',
} as const

export type EventStatus = keyof typeof EVENT_STATUS

export const SHIP_TYPES = {
  combat: 'Combat',
  transport: 'Transport',
  minage: 'Minage',
  exploration: 'Exploration',
  support: 'Support',
  multirole: 'Multirôle',
  autre: 'Autre',
} as const

export type ShipType = keyof typeof SHIP_TYPES

export const SHIP_STATUS = {
  disponible: 'Disponible',
  en_mission: 'En mission',
  maintenance: 'Maintenance',
  indisponible: 'Indisponible',
} as const

export type ShipStatus = keyof typeof SHIP_STATUS

export const SHIP_STATUS_COLORS: Record<ShipStatus, string> = {
  disponible: 'text-green-400 bg-green-400/10 border-green-400/30',
  en_mission: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
  maintenance: 'text-orange-400 bg-orange-400/10 border-orange-400/30',
  indisponible: 'text-red-400 bg-red-400/10 border-red-400/30',
}

export const PARTNERSHIP_TYPES = {
  org:    'Organisation',
  player: 'Joueur',
} as const
export type PartnershipType = keyof typeof PARTNERSHIP_TYPES

export const PARTNERSHIP_RELATIONS = {
  alliance: 'Alliance',
  neutral:  'Neutre',
  trading:  'Commerce',
  enemy:    'Ennemi',
} as const
export type PartnershipRelation = keyof typeof PARTNERSHIP_RELATIONS

export const PARTNERSHIP_RELATION_COLORS: Record<PartnershipRelation, string> = {
  alliance: 'text-green-400 bg-green-400/10 border-green-400/30',
  neutral:  'text-slate-400 bg-slate-400/10 border-slate-400/20',
  trading:  'text-blue-400 bg-blue-400/10 border-blue-400/30',
  enemy:    'text-red-400 bg-red-400/10 border-red-400/30',
}

export const PARTNERSHIP_STATUS = {
  active:      'Actif',
  inactive:    'Inactif',
  negotiating: 'En négociation',
} as const
export type PartnershipStatus = keyof typeof PARTNERSHIP_STATUS

export const PARTNERSHIP_STATUS_COLORS: Record<PartnershipStatus, string> = {
  active:      'text-green-400 bg-green-400/10 border-green-400/30',
  inactive:    'text-slate-400 bg-slate-400/10 border-slate-400/20',
  negotiating: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
}

export const ACTIVITY_LEVELS = {
  casual:  'Casual',
  regular: 'Régulière',
  paused:  'En pause',
} as const
export type ActivityLevel = keyof typeof ACTIVITY_LEVELS

export const ACTIVITY_LEVEL_COLORS: Record<ActivityLevel, string> = {
  casual:  'text-blue-400 bg-blue-400/10 border-blue-400/30',
  regular: 'text-green-400 bg-green-400/10 border-green-400/30',
  paused:  'text-slate-400 bg-slate-400/10 border-slate-400/20',
}

export const POINT_REASONS = {
  op_participated:  'Opération participée',
  event_attended:   'Événement',
  resource_created: 'Ressource créée',
  recruitment:      'Recrutement',
  promotion_bonus:  'Prime de promotion',
  penalty:          'Pénalité',
  other:            'Autre',
} as const
export type PointReason = keyof typeof POINT_REASONS

export const OP_TYPES = {
  combat:       'Combat',
  salvage:      'Salvage',
  mining:       'Minage',
  commerce:     'Commerce / Transport',
  infiltration: 'Infiltration',
  rescue:       'Sauvetage',
} as const
export type OpType = keyof typeof OP_TYPES

export const OP_TYPE_COLORS: Record<OpType, string> = {
  combat:       'text-red-400 bg-red-400/10 border-red-400/30',
  salvage:      'text-orange-400 bg-orange-400/10 border-orange-400/30',
  mining:       'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
  commerce:     'text-green-400 bg-green-400/10 border-green-400/30',
  infiltration: 'text-purple-400 bg-purple-400/10 border-purple-400/30',
  rescue:       'text-cyan-400 bg-cyan-400/10 border-cyan-400/30',
}

export const OP_STATUS = {
  planned:   'Planifiée',
  active:    'En cours',
  completed: 'Terminée',
  cancelled: 'Annulée',
} as const
export type OpStatus = keyof typeof OP_STATUS

export const OP_STATUS_COLORS: Record<OpStatus, string> = {
  planned:   'text-blue-400 bg-blue-400/10 border-blue-400/30',
  active:    'text-green-400 bg-green-400/10 border-green-400/30',
  completed: 'text-muted-foreground bg-muted/50 border-border',
  cancelled: 'text-destructive bg-destructive/10 border-destructive/30',
}

export const OP_RISK = {
  low:      'Faible',
  medium:   'Modéré',
  high:     'Élevé',
  critical: 'Critique',
} as const
export type OpRisk = keyof typeof OP_RISK

export const OP_RISK_COLORS: Record<OpRisk, string> = {
  low:      'text-green-400 bg-green-400/10 border-green-400/30',
  medium:   'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
  high:     'text-orange-400 bg-orange-400/10 border-orange-400/30',
  critical: 'text-red-400 bg-red-400/10 border-red-400/30',
}

export const OP_ROLES = {
  commander:    'Commandant',
  pilot:        'Pilote',
  copilot:      'Co-pilote',
  gunner:       'Artilleur',
  medic:        'Médecin',
  engineer:     'Ingénieur',
  soldier:      'Soldat',
  fighter_pilot:'Pilote chasseur',
} as const
export type OpRole = keyof typeof OP_ROLES

export const OP_ROLE_ICONS: Record<OpRole, string> = {
  commander:    '⭐',
  pilot:        '🚀',
  copilot:      '🛸',
  gunner:       '🎯',
  medic:        '💊',
  engineer:     '🔧',
  soldier:      '⚔️',
  fighter_pilot:'✈️',
}

export const SC_SYSTEMS = [
  'Stanton',
  'Pyro',
  'Nyx',
  'Terra',
  'Magnus',
  'Nexus',
  'Castra',
  'Idris',
  'Virgil',
  'Odin',
  'Ellis',
  'Chronos',
  'Hades',
  'Kiel',
  'Leir',
  'Bremen',
  'Davien',
  'Vega',
  'Nul',
  'Oberon',
  'Ariel',
  'Tamsa',
] as const
export type ScSystem = typeof SC_SYSTEMS[number]

export const MAP_POINT_TYPES = {
  base_inqfr:   'Base INQFR',
  base_alliee:  'Base alliée',
  base_ennemie: 'Base ennemie',
  zone_interet: "Zone d'intérêt",
  point_danger: 'Point de danger',
  ressource:    'Ressource',
} as const
export type MapPointType = keyof typeof MAP_POINT_TYPES

export const MAP_POINT_COLORS: Record<MapPointType, string> = {
  base_inqfr:   '#f59e0b',
  base_alliee:  '#22c55e',
  base_ennemie: '#ef4444',
  zone_interet: '#3b82f6',
  point_danger: '#f97316',
  ressource:    '#06b6d4',
}

export const MAP_POINT_BADGE_COLORS: Record<MapPointType, string> = {
  base_inqfr:   'text-amber-400 bg-amber-400/10 border-amber-400/30',
  base_alliee:  'text-green-400 bg-green-400/10 border-green-400/30',
  base_ennemie: 'text-red-400 bg-red-400/10 border-red-400/30',
  zone_interet: 'text-blue-400 bg-blue-400/10 border-blue-400/30',
  point_danger: 'text-orange-400 bg-orange-400/10 border-orange-400/30',
  ressource:    'text-cyan-400 bg-cyan-400/10 border-cyan-400/30',
}

export const MAP_POINT_STATUS = {
  active:   'Actif',
  inactive: 'Inactif',
  unknown:  'Inconnu',
} as const
export type MapPointStatus = keyof typeof MAP_POINT_STATUS

export const INVENTORY_ITEM_TYPES = {
  loot:      'Loot',
  material:  'Matériau',
  blueprint: 'Blueprint',
  uec:       'UEC',
  component: 'Composant',
} as const
export type InventoryItemType = keyof typeof INVENTORY_ITEM_TYPES

export const INVENTORY_ITEM_TYPE_COLORS: Record<InventoryItemType, string> = {
  loot:      'text-amber-400 bg-amber-400/10 border-amber-400/30',
  material:  'text-orange-400 bg-orange-400/10 border-orange-400/30',
  blueprint: 'text-blue-400 bg-blue-400/10 border-blue-400/30',
  uec:       'text-green-400 bg-green-400/10 border-green-400/30',
  component: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/30',
}

export const INVENTORY_UNITS = {
  unit:  'unité(s)',
  kg:    'kg',
  uec:   'UEC',
  lot:   'lot(s)',
  scu:   'SCU',
  uscu:  'µSCU',
  mscu:  'mSCU',
} as const
export type InventoryUnit = keyof typeof INVENTORY_UNITS

export const INVENTORY_TX_TYPES = {
  deposit:     'Dépôt',
  withdrawal:  'Retrait',
  reservation: 'Réservation',
  release:     'Libération',
} as const
export type InventoryTxType = keyof typeof INVENTORY_TX_TYPES

export const INVENTORY_TX_TYPE_COLORS: Record<InventoryTxType, string> = {
  deposit:     'text-green-400 bg-green-400/10 border-green-400/30',
  withdrawal:  'text-red-400 bg-red-400/10 border-red-400/30',
  reservation: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
  release:     'text-blue-400 bg-blue-400/10 border-blue-400/30',
}

export const INVENTORY_TX_STATUS = {
  pending:  'En attente',
  approved: 'Approuvé',
  rejected: 'Refusé',
  direct:   'Direct',
} as const
export type InventoryTxStatus = keyof typeof INVENTORY_TX_STATUS

export const INVENTORY_TX_STATUS_COLORS: Record<InventoryTxStatus, string> = {
  pending:  'text-amber-400 bg-amber-400/10 border-amber-400/30',
  approved: 'text-green-400 bg-green-400/10 border-green-400/30',
  rejected: 'text-red-400 bg-red-400/10 border-red-400/30',
  direct:   'text-cyan-400 bg-cyan-400/10 border-cyan-400/30',
}

// FEAT-16 : paliers déclenchant la notification "un Sage peut te contacter"
export const POINTS_MILESTONE_THRESHOLDS = [100, 250, 500, 1000] as const

// FEAT-15 : points requis par rang pour accéder à l'épreuve suivante
export const RANK_EVALUATION_THRESHOLDS: Partial<Record<Role, number>> = {
  aspirant:           50,   // → Consacré
  consacre:          150,   // → Gardien
  gardien:           300,   // → Inquisiteur
  inquisiteur:       500,   // → Maître Inquisiteur
}

export const RESOURCE_CATEGORIES = [
  'Général',
  'Tactique',
  'Règlement',
  'Guides',
  'Recrutement',
  'Histoire',
] as const

// ─── Onboarding par rang ──────────────────────────────────────────────────────

export interface OnboardingStepConfig {
  key: ExtendedOnboardingStep
  label: string
  href: string
  manual?: boolean
}

export interface RankOnboardingConfig {
  steps: OnboardingStepConfig[]
  bonusStep: ExtendedOnboardingStep
  pointsPerStep: number
  bonusPoints: number
}

export const ONBOARDING_CONFIGS: Partial<Record<Role, RankOnboardingConfig>> = {
  aspirant: {
    steps: [
      { key: 'profile',             label: 'Compléter son profil (bio + handle Star Citizen)', href: '/profil'     },
      { key: 'ship',                label: 'Enregistrer son premier vaisseau',                  href: '/flotte'     },
      { key: 'operation',           label: "S'inscrire à une opération",                        href: '/operations' },
      { key: 'operation_important', label: 'Participer à une opération importante (2h+)',        href: '/operations' },
      { key: 'first_event',         label: "Participer à un événement de l'Ordre",              href: '/evenements' },
    ],
    bonusStep: 'bonus',
    pointsPerStep: 10,
    bonusPoints: 25,
  },
  consacre: {
    steps: [
      { key: 'consacre_events_5',    label: 'Participer à 5 événements',                        href: '/evenements'          },
      { key: 'consacre_op_5',        label: 'Participer à 5 opérations',                        href: '/operations'          },
      { key: 'consacre_logistics',   label: 'Effectuer une aide logistique',                     href: '/logistique'          },
      { key: 'consacre_resource',    label: 'Publier une ressource dans le wiki',                href: '/ressources'          },
      { key: 'consacre_recruitment', label: "Participer à la validation d'un recrutement",       href: '/admin/candidatures', manual: true },
    ],
    bonusStep: 'consacre_bonus',
    pointsPerStep: 10,
    bonusPoints: 40,
  },
  gardien: {
    steps: [
      { key: 'gardien_op_lead',     label: 'Commander sa première sortie',              href: '/operations'          },
      { key: 'gardien_events_10',   label: 'Participer à 10 événements',                href: '/evenements'          },
      { key: 'gardien_logistics',   label: 'Effectuer une aide logistique',             href: '/logistique'          },
      { key: 'gardien_resource',    label: 'Publier une ressource dans le wiki',        href: '/ressources'          },
      { key: 'gardien_recruitment', label: 'Valider un recrutement',                    href: '/admin/candidatures', manual: true },
    ],
    bonusStep: 'gardien_bonus',
    pointsPerStep: 10,
    bonusPoints: 60,
  },
  inquisiteur: {
    steps: [
      { key: 'inquisiteur_op_lead_3',      label: 'Commander 3 opérations',       href: '/operations'   },
      { key: 'inquisiteur_event_organize', label: 'Organiser un événement',        href: '/evenements'   },
      { key: 'inquisiteur_training',       label: 'Former un nouveau membre',      href: '/membres',      manual: true },
      { key: 'inquisiteur_events_25',      label: 'Participer à 25 événements',    href: '/evenements'   },
      { key: 'inquisiteur_partnership',    label: 'Établir un partenariat',        href: '/partenariats' },
    ],
    bonusStep: 'inquisiteur_bonus',
    pointsPerStep: 10,
    bonusPoints: 80,
  },
}
