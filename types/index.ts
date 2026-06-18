import { z } from 'zod'
import type { Database } from './database'

// ─── Types DB de base ─────────────────────────────────────────────────────────
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Event = Database['public']['Tables']['events']['Row']
export type EventAttendee = Database['public']['Tables']['event_attendees']['Row']
export type Ship = Database['public']['Tables']['ships']['Row']
export type OrgResource = Database['public']['Tables']['org_resources']['Row']
export type Notification = Database['public']['Tables']['notifications']['Row']
export type ShipModel = Database['public']['Tables']['ship_models']['Row']
export type Application = Database['public']['Tables']['applications']['Row']
export type MediaGallery = Database['public']['Tables']['media_gallery']['Row']
export type Partnership      = Database['public']['Tables']['partnerships']['Row']
export type MemberProgression = Database['public']['Tables']['member_progressions']['Row']
export type MemberPromotion  = Database['public']['Tables']['member_promotions']['Row']
export type MemberPoints     = Database['public']['Tables']['member_points']['Row']
export type MapPoint             = Database['public']['Tables']['map_points']['Row']
export type MapJumpLane          = Database['public']['Tables']['map_jump_lanes']['Row']
export type OrgSettings          = Database['public']['Tables']['org_settings']['Row']
export type InventoryItem        = Database['public']['Tables']['inventory_items']['Row']
export type InventoryStock       = Database['public']['Tables']['inventory_stock']['Row']
export type InventoryTransaction = Database['public']['Tables']['inventory_transactions']['Row']
export type Operation = Database['public']['Tables']['operations']['Row']
export type OpRoleSlot = Database['public']['Tables']['op_role_slots']['Row']
export type OpRegistration = Database['public']['Tables']['op_registrations']['Row']
export type OpResource = Database['public']['Tables']['op_resources']['Row']
export type ChatChannel = Database['public']['Tables']['chat_channels']['Row']
export type ChatMessage = Database['public']['Tables']['chat_messages']['Row']
export type ChatMemberSeen = Database['public']['Tables']['chat_member_seen']['Row']
export type RankEvaluation = Database['public']['Tables']['rank_evaluations']['Row']
export type MemberAvailability = Database['public']['Tables']['member_availability']['Row']
export type MemberBadge        = Database['public']['Tables']['member_badges']['Row']
export type WarJournal         = Database['public']['Tables']['war_journal']['Row']
export type OperationLoot      = Database['public']['Tables']['operation_loot']['Row']
export type LootShare          = Database['public']['Tables']['loot_shares']['Row']

// ─── Types enrichis (avec jointures) ─────────────────────────────────────────
export type ProfileSummary = Pick<Profile, 'id' | 'role' | 'display_name' | 'username' | 'avatar_url'>

export type ProfileWithStats = Profile & {
  ship_count?: number
  event_count?: number
}

export type EventWithDetails = Event & {
  attendees?: EventAttendee[]
  attendee_count?: number
  creator?: Pick<Profile, 'username' | 'display_name' | 'avatar_url'>
}

export type AttendeeWithProfile = EventAttendee & {
  profile: Pick<Profile, 'id' | 'username' | 'display_name' | 'role'>
}

export type ShipWithOwner = Ship & {
  owner?: Pick<Profile, 'username' | 'display_name' | 'avatar_url'> | null
}

export type OpRoleSlotWithProfile = OpRoleSlot & {
  assigned_profile?: Pick<Profile, 'username' | 'display_name' | 'avatar_url'> | null
}

export type OpRegistrationWithProfile = OpRegistration & {
  profile?: Pick<Profile, 'username' | 'display_name' | 'avatar_url'>
}

export type OpResourceWithOp = OpResource & {
  operation?: Pick<Operation, 'id' | 'title' | 'status'>
  item?: Pick<InventoryItem, 'name' | 'type'> | null
}

export type OperationWithDetails = Operation & {
  commander?: Pick<Profile, 'username' | 'display_name' | 'avatar_url'> | null
  role_slots?: OpRoleSlotWithProfile[]
  registrations?: OpRegistrationWithProfile[]
  registration_count?: number
  my_registration?: OpRegistration | null
  resources?: OpResource[]
}

// ─── Schémas Zod ─────────────────────────────────────────────────────────────
export const LoginSchema = z.object({
  email: z.string().email('Email invalide'),
})
export type LoginInput = z.infer<typeof LoginSchema>

export const ProfileUpdateSchema = z.object({
  display_name: z.string().min(2, 'Minimum 2 caractères').max(50).optional(),
  bio: z.string().max(500, 'Maximum 500 caractères').optional(),
  star_citizen_handle: z.string().max(50).optional(),
})
export type ProfileUpdateInput = z.infer<typeof ProfileUpdateSchema>

export const EventCreateSchema = z.object({
  title: z.string().min(3, 'Titre requis (min. 3 car.)').max(100),
  description: z.string().max(2000).optional(),
  type: z.enum(['operation', 'reunion', 'formation', 'social', 'autre']),
  start_at: z.string().min(1, 'Date de début requise'),
  end_at: z.string().optional(),
  location: z.string().max(200).optional(),
  max_attendees: z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? undefined : Number(v)),
    z.number().int().positive().optional()
  ),
  min_privilege: z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? 0 : Number(v)),
    z.number().int().min(0).default(0)
  ),
})
export type EventCreateInput = z.infer<typeof EventCreateSchema>

export const EventUpdateSchema = EventCreateSchema.extend({
  status: z.enum(['planned', 'active', 'completed', 'cancelled']).optional(),
})
export type EventUpdateInput = z.infer<typeof EventUpdateSchema>

export const ShipCreateSchema = z.object({
  name: z.string().min(2, 'Nom requis').max(100),
  model: z.string().min(2, 'Modèle requis').max(100),
  manufacturer: z.string().max(100).optional(),
  ship_type: z.enum(['combat', 'transport', 'minage', 'exploration', 'support', 'multirole', 'autre']),
  crew_size: z.preprocess((v) => Number(v), z.number().int().min(1).max(100)),
  is_org_ship: z.boolean().default(false),
  purchased_in_game: z.boolean().default(false),
  notes: z.string().max(500).optional(),
})
export type ShipCreateInput = z.infer<typeof ShipCreateSchema>

export const ResourceCreateSchema = z.object({
  title: z.string().min(3, 'Titre requis').max(200),
  slug: z
    .string()
    .min(3)
    .max(200)
    .regex(/^[a-z0-9-]+$/, 'Slug invalide (minuscules, chiffres, tirets)'),
  content: z.string().optional(),
  category: z.string().min(1, 'Catégorie requise').max(50),
  is_published: z.boolean().default(false),
})
export type ResourceCreateInput = z.infer<typeof ResourceCreateSchema>

export const ApplicationCreateSchema = z.object({
  rsi_handle: z.string().min(2, 'Handle RSI requis').max(50),
  email: z.string().email('Adresse email invalide'),
  discord_handle: z.string().min(2, 'Handle Discord requis').max(100),
  full_name: z.string().max(100).optional().or(z.literal('')).transform((v) => v || null),
  motivation: z.string().min(50, 'Message trop court — minimum 50 caractères').max(2000),
  how_found: z.string().min(1, 'Ce champ est requis').max(100),
})
export type ApplicationCreateInput = z.infer<typeof ApplicationCreateSchema>

export const PartnershipSchema = z.object({
  name:           z.string().min(2, 'Nom requis').max(100),
  type:           z.enum(['org', 'player']),
  relationship:   z.enum(['alliance', 'neutral', 'trading', 'enemy']).default('neutral'),
  contact_handle: z.string().max(100).optional().or(z.literal('')).transform((v) => v || undefined),
  org_rsi_id:     z.string().max(50).optional().or(z.literal('')).transform((v) => v || undefined),
  status:         z.enum(['active', 'inactive', 'negotiating']).default('active'),
  terms:          z.string().max(5000).optional().or(z.literal('')).transform((v) => v || undefined),
  notes:          z.string().max(2000).optional().or(z.literal('')).transform((v) => v || undefined),
})
export type PartnershipInput = z.infer<typeof PartnershipSchema>

export const ProgressionUpsertSchema = z.object({
  profile_id:        z.string().uuid(),
  activity_level:    z.enum(['casual', 'regular', 'paused']).optional().or(z.literal('')).transform((v) => v || undefined),
  favorite_activity: z.string().max(200).optional(),
  trainings_received: z.array(z.string().max(100)).default([]),
  notes_sage:        z.string().max(2000).optional(),
})
export type ProgressionUpsertInput = z.infer<typeof ProgressionUpsertSchema>

export const AwardPointsSchema = z.object({
  profile_id: z.string().uuid(),
  points: z.preprocess(
    (v) => (v === '' ? 0 : Number(v)),
    z.number().int().refine((n) => n !== 0, 'La valeur ne peut pas être 0')
  ),
  reason: z.enum(['op_participated', 'event_attended', 'resource_created', 'recruitment', 'promotion_bonus', 'penalty', 'other']),
  reason_detail: z.string().max(300).optional(),
})
export type AwardPointsInput = z.infer<typeof AwardPointsSchema>

export type ProfileWithPoints = Profile & { total_points: number }

export type InventoryItemWithStock = InventoryItem & {
  stock: InventoryStock | null
}

export type InventoryStockRow = { quantity: number; reserved_quantity: number }

export type InventoryTransactionWithProfile = InventoryTransaction & {
  member: Pick<Profile, 'id' | 'username' | 'display_name' | 'avatar_url'>
  approver: Pick<Profile, 'username' | 'display_name'> | null
}

export const OperationCreateSchema = z.object({
  title: z.string().min(3, 'Titre requis (min. 3 car.)').max(100),
  system_name: z.string().min(1, 'Système requis').max(100),
  type: z.enum(['combat', 'salvage', 'mining', 'commerce', 'infiltration', 'rescue']),
  status: z.enum(['planned', 'active', 'completed', 'cancelled']).default('planned'),
  departure_at: z.string().min(1, 'Date de départ requise'),
  estimated_duration_min: z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? undefined : Number(v)),
    z.number().int().positive().optional()
  ),
  risk_level: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  commander_id: z.string().uuid().optional().or(z.literal('')).transform((v) => v || undefined),
  description: z.string().max(5000).optional(),
  min_privilege: z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? 100 : Number(v)),
    z.number().int().min(0).default(100)
  ),
  role_slots: z.array(
    z.enum(['commander', 'pilot', 'copilot', 'gunner', 'medic', 'engineer', 'soldier', 'fighter_pilot'])
  ).default([]),
})
export type OperationCreateInput = z.infer<typeof OperationCreateSchema>

export const OpRegisterSchema = z.object({
  preferred_role: z.enum(['commander', 'pilot', 'copilot', 'gunner', 'medic', 'engineer', 'soldier', 'fighter_pilot'])
    .optional()
    .or(z.literal('')).transform((v) => v || undefined),
  notes: z.string().max(500).optional(),
})
export type OpRegisterInput = z.infer<typeof OpRegisterSchema>

// ─── Réponses d actions serveur ──────────────────────────────────────────────
export const MapPointSchema = z.object({
  system_name: z.string().min(1, 'Système requis').max(100),
  name:        z.string().min(2, 'Nom requis (min. 2 car.)').max(100),
  type:        z.enum(['base_inqfr','base_alliee','base_ennemie','zone_interet','point_danger','ressource']),
  description: z.string().max(2000).optional().or(z.literal('')).transform((v) => v || undefined),
  status:      z.enum(['active', 'inactive', 'unknown']).default('active'),
})
export type MapPointInput = z.infer<typeof MapPointSchema>

export const InventoryItemSchema = z.object({
  name:        z.string().min(2, 'Nom requis (min. 2 car.)').max(100),
  type:        z.enum(['loot', 'material', 'blueprint', 'uec', 'component']),
  unit:        z.enum(['unit', 'kg', 'uec', 'lot', 'scu', 'uscu', 'mscu']),
  description: z.string().max(2000).optional().or(z.literal('')).transform((v) => v || undefined),
})
export type InventoryItemInput = z.infer<typeof InventoryItemSchema>

export type ChatMessageWithAuthor = ChatMessage & {
  author: Pick<Profile, 'id' | 'username' | 'display_name' | 'avatar_url'>
}

export const SendMessageSchema = z.object({
  channelId: z.string().uuid(),
  content: z.string().min(1, 'Message vide').max(2000, 'Maximum 2000 caractères'),
})
export type SendMessageInput = z.infer<typeof SendMessageSchema>

export const CreateChannelSchema = z.object({
  name: z.string().min(2, 'Nom requis (min. 2 car.)').max(50),
  description: z.string().max(200).optional(),
  min_privilege: z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? 100 : Number(v)),
    z.number().int().min(0).default(100)
  ),
})
export type CreateChannelInput = z.infer<typeof CreateChannelSchema>

export type RankEvaluationWithProfiles = RankEvaluation & {
  member: Pick<Profile, 'id' | 'username' | 'display_name' | 'avatar_url' | 'role'>
  initiator: Pick<Profile, 'id' | 'username' | 'display_name'>
}

export type PromotionHistoryItem = MemberPromotion & {
  member: Pick<Profile, 'id' | 'username' | 'display_name' | 'avatar_url' | 'role'>
  promoter: Pick<Profile, 'id' | 'username' | 'display_name'> | null
}

export const InitiateEvaluationSchema = z.object({
  member_id:    z.string().uuid('Membre invalide'),
  instructions: z.string().min(10, 'Instructions requises (min. 10 car.)').max(2000),
})
export type InitiateEvaluationInput = z.infer<typeof InitiateEvaluationSchema>

export type OnboardingStep = 'profile' | 'ship' | 'operation'
export type ExtendedOnboardingStep =
  | OnboardingStep
  | 'operation_important' | 'first_event' | 'bonus'
  | 'discord_joined' | 'consacre_bonus'
  | 'consacre_events_5' | 'consacre_op_5' | 'consacre_logistics' | 'consacre_resource' | 'consacre_recruitment'
  | 'gardien_op_lead' | 'gardien_events_10' | 'gardien_logistics' | 'gardien_resource' | 'gardien_recruitment' | 'gardien_bonus'
  | 'inquisiteur_op_lead_3' | 'inquisiteur_event_organize' | 'inquisiteur_training' | 'inquisiteur_events_25' | 'inquisiteur_partnership' | 'inquisiteur_bonus'

// FEAT-20 : soumission photo de profil en attente de validation
export const AvatarSubmitSchema = z.object({
  url: z.string().url('URL invalide').max(500, 'URL trop longue'),
})
export type AvatarSubmitInput = z.infer<typeof AvatarSubmitSchema>

export type ProfileWithPendingAvatar = Pick<Profile, 'id' | 'username' | 'display_name' | 'avatar_url' | 'avatar_pending_url'>

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }

// ─── FEAT-26 : Disponibilité ──────────────────────────────────────────────────
export const AvailabilitySlot = { day: 0, slot: 0 }
export type AvailabilityGrid = Record<number, number[]> // day_of_week → slot[]

// ─── FEAT-28 : Journal de guerre ─────────────────────────────────────────────
export const WarJournalSchema = z.object({
  title:        z.string().min(3, 'Titre requis (min. 3 car.)').max(150),
  content:      z.string().min(10, 'Contenu requis (min. 10 car.)').max(10000),
  operation_id: z.string().uuid().optional().or(z.literal('')).transform((v) => v || undefined),
  is_published: z.boolean().default(false),
})
export type WarJournalInput = z.infer<typeof WarJournalSchema>

export type WarJournalWithAuthor = WarJournal & {
  author: Pick<Profile, 'username' | 'display_name' | 'avatar_url'>
  operation?: Pick<Operation, 'id' | 'title'> | null
}

// ─── FEAT-27 : Loot ──────────────────────────────────────────────────────────
export const LootSchema = z.object({
  total_auec: z.preprocess(
    (v) => (v === '' ? 0 : Number(v)),
    z.number().int().positive('Montant requis')
  ),
  note: z.string().max(500).optional(),
  participant_ids: z.array(z.string().uuid()).min(1, 'Au moins un participant requis'),
})
export type LootInput = z.infer<typeof LootSchema>

export type LootShareWithProfile = LootShare & {
  profile: Pick<Profile, 'id' | 'username' | 'display_name' | 'avatar_url'>
}
export type OperationLootWithShares = OperationLoot & {
  shares: LootShareWithProfile[]
}
