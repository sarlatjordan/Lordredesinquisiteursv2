// Types manuels — remplacer par: pnpm supabase gen types typescript --local
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

type EmptySchema = { [_ in never]: never }

type TableRelationship = {
  foreignKeyName: string
  columns: string[]
  isOneToOne?: boolean
  referencedRelation: string
  referencedColumns: string[]
}

export interface Database {
  public: {
    Tables: {
      bug_reports: {
        Row: {
          id:          string
          profile_id:  string
          type:        'bug' | 'amelioration'
          title:       string
          description: string
          page_url:    string | null
          severity:    'faible' | 'moyen' | 'eleve' | 'critique'
          status:      'ouvert' | 'en_cours' | 'resolu' | 'ferme'
          admin_note:  string | null
          created_at:  string
          updated_at:  string
        }
        Insert: {
          id?:         string
          profile_id:  string
          type?:       'bug' | 'amelioration'
          title:       string
          description: string
          page_url?:   string | null
          severity?:   'faible' | 'moyen' | 'eleve' | 'critique'
          status?:     'ouvert' | 'en_cours' | 'resolu' | 'ferme'
          admin_note?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          type?:       'bug' | 'amelioration'
          title?:      string
          description?: string
          page_url?:   string | null
          severity?:   'faible' | 'moyen' | 'eleve' | 'critique'
          status?:     'ouvert' | 'en_cours' | 'resolu' | 'ferme'
          admin_note?: string | null
          updated_at?: string
        }
        Relationships: TableRelationship[]
      }
      op_chat_messages: {
        Row: {
          id:           string
          operation_id: string
          profile_id:   string
          content:      string
          created_at:   string
        }
        Insert: {
          id?:          string
          operation_id: string
          profile_id:   string
          content:      string
          created_at?:  string
        }
        Update: {
          content?: string
        }
        Relationships: TableRelationship[]
      }
      page_access_rules: {
        Row: {
          path:          string
          label:         string
          min_privilege: number
          updated_at:    string
        }
        Insert: {
          path:          string
          label:         string
          min_privilege?: number
          updated_at?:   string
        }
        Update: {
          label?:        string
          min_privilege?: number
          updated_at?:   string
        }
        Relationships: TableRelationship[]
      }
      absences: {
        Row: {
          id:         string
          profile_id: string
          start_date: string
          end_date:   string
          reason:     string | null
          created_at: string
        }
        Insert: {
          id?:        string
          profile_id: string
          start_date: string
          end_date:   string
          reason?:    string | null
          created_at?: string
        }
        Update: {
          start_date?: string
          end_date?:   string
          reason?:     string | null
        }
        Relationships: TableRelationship[]
      }
      profiles: {
        Row: {
          id: string
          username: string
          display_name: string | null
          avatar_url: string | null
          avatar_pending_url: string | null
          role: 'visiteur' | 'aspirant' | 'consacre' | 'gardien' | 'inquisiteur' | 'maitre_inquisiteur' | 'sage'
          star_citizen_handle: string | null
          discord_id: string | null
          bio: string | null
          joined_at: string
          last_seen_at: string
          is_active: boolean
          in_game_since: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          display_name?: string | null
          avatar_url?: string | null
          avatar_pending_url?: string | null
          role?: 'visiteur' | 'aspirant' | 'consacre' | 'gardien' | 'inquisiteur' | 'maitre_inquisiteur' | 'sage'
          star_citizen_handle?: string | null
          discord_id?: string | null
          bio?: string | null
          joined_at?: string
          last_seen_at?: string
          is_active?: boolean
          in_game_since?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          display_name?: string | null
          avatar_url?: string | null
          avatar_pending_url?: string | null
          role?: 'visiteur' | 'aspirant' | 'consacre' | 'gardien' | 'inquisiteur' | 'maitre_inquisiteur' | 'sage'
          star_citizen_handle?: string | null
          discord_id?: string | null
          bio?: string | null
          joined_at?: string
          last_seen_at?: string
          is_active?: boolean
          in_game_since?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: TableRelationship[]
      }
      events: {
        Row: {
          id: string
          title: string
          description: string | null
          type: 'operation' | 'reunion' | 'formation' | 'social' | 'sortie' | 'autre'
          status: 'planned' | 'active' | 'completed' | 'cancelled'
          start_at: string
          end_at: string | null
          location: string | null
          max_attendees: number | null
          min_privilege: number
          report: string | null
          discord_event_id: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          type?: 'operation' | 'reunion' | 'formation' | 'social' | 'sortie' | 'autre'
          status?: 'planned' | 'active' | 'completed' | 'cancelled'
          start_at: string
          end_at?: string | null
          location?: string | null
          max_attendees?: number | null
          min_privilege?: number
          report?: string | null
          discord_event_id?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          type?: 'operation' | 'reunion' | 'formation' | 'social' | 'sortie' | 'autre'
          status?: 'planned' | 'active' | 'completed' | 'cancelled'
          start_at?: string
          end_at?: string | null
          location?: string | null
          max_attendees?: number | null
          min_privilege?: number
          report?: string | null
          discord_event_id?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: TableRelationship[]
      }
      event_attendees: {
        Row: {
          id: string
          event_id: string
          profile_id: string
          status: 'confirme' | 'peut_etre' | 'absent'
          registered_at: string
        }
        Insert: {
          id?: string
          event_id: string
          profile_id: string
          status?: 'confirme' | 'peut_etre' | 'absent'
          registered_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          profile_id?: string
          status?: 'confirme' | 'peut_etre' | 'absent'
          registered_at?: string
        }
        Relationships: TableRelationship[]
      }
      ships: {
        Row: {
          id: string
          name: string
          model: string
          manufacturer: string | null
          ship_type: 'combat' | 'transport' | 'minage' | 'exploration' | 'support' | 'multirole' | 'autre'
          status: 'disponible' | 'en_mission' | 'maintenance' | 'indisponible'
          owner_id: string | null
          crew_size: number
          is_org_ship: boolean
          purchased_in_game: boolean
          notes: string | null
          image_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          model: string
          manufacturer?: string | null
          ship_type?: 'combat' | 'transport' | 'minage' | 'exploration' | 'support' | 'multirole' | 'autre'
          status?: 'disponible' | 'en_mission' | 'maintenance' | 'indisponible'
          owner_id?: string | null
          crew_size?: number
          is_org_ship?: boolean
          purchased_in_game?: boolean
          notes?: string | null
          image_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          model?: string
          manufacturer?: string | null
          ship_type?: 'combat' | 'transport' | 'minage' | 'exploration' | 'support' | 'multirole' | 'autre'
          status?: 'disponible' | 'en_mission' | 'maintenance' | 'indisponible'
          owner_id?: string | null
          crew_size?: number
          is_org_ship?: boolean
          purchased_in_game?: boolean
          notes?: string | null
          image_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: TableRelationship[]
      }
      org_resources: {
        Row: {
          id: string
          title: string
          slug: string
          content: string | null
          category: string
          is_published: boolean
          author_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          slug: string
          content?: string | null
          category?: string
          is_published?: boolean
          author_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          slug?: string
          content?: string | null
          category?: string
          is_published?: boolean
          author_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: TableRelationship[]
      }
      ship_models: {
        Row: {
          id: number
          name: string
          manufacturer: string | null
          ship_type: string
          focus: string | null
          min_crew: number
          max_crew: number
          cargo_capacity: number
          production_status: string | null
          rsi_url: string | null
          image_url: string | null
          synced_at: string
        }
        Insert: {
          id: number
          name: string
          manufacturer?: string | null
          ship_type?: string
          focus?: string | null
          min_crew?: number
          max_crew?: number
          cargo_capacity?: number
          production_status?: string | null
          rsi_url?: string | null
          image_url?: string | null
          synced_at?: string
        }
        Update: {
          id?: number
          name?: string
          manufacturer?: string | null
          ship_type?: string
          focus?: string | null
          min_crew?: number
          max_crew?: number
          cargo_capacity?: number
          production_status?: string | null
          rsi_url?: string | null
          image_url?: string | null
          synced_at?: string
        }
        Relationships: TableRelationship[]
      }
      notifications: {
        Row: {
          id: string
          profile_id: string
          type: string
          title: string
          message: string | null
          is_read: boolean
          link: string | null
          created_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          type: string
          title: string
          message?: string | null
          is_read?: boolean
          link?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          type?: string
          title?: string
          message?: string | null
          is_read?: boolean
          link?: string | null
          created_at?: string
        }
        Relationships: TableRelationship[]
      }
      applications: {
        Row: {
          id: string
          rsi_handle: string
          email: string
          discord_handle: string
          full_name: string | null
          motivation: string
          how_found: string
          status: 'pending' | 'en_discussion' | 'accepted' | 'refused'
          submitted_at: string
          reviewed_at: string | null
          reviewed_by: string | null
          admin_notes: string | null
        }
        Insert: {
          id?: string
          rsi_handle: string
          email: string
          discord_handle: string
          full_name?: string | null
          motivation: string
          how_found: string
          status?: 'pending' | 'en_discussion' | 'accepted' | 'refused'
          submitted_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          admin_notes?: string | null
        }
        Update: {
          id?: string
          rsi_handle?: string
          email?: string
          discord_handle?: string
          full_name?: string | null
          motivation?: string
          how_found?: string
          status?: 'pending' | 'en_discussion' | 'accepted' | 'refused'
          submitted_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          admin_notes?: string | null
        }
        Relationships: TableRelationship[]
      }
      partnerships: {
        Row: {
          id: string
          name: string
          type: 'org' | 'player'
          relationship: 'alliance' | 'neutral' | 'trading' | 'enemy'
          contact_handle: string | null
          org_rsi_id: string | null
          status: 'active' | 'inactive' | 'negotiating'
          terms: string | null
          notes: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          type: 'org' | 'player'
          relationship?: 'alliance' | 'neutral' | 'trading' | 'enemy'
          contact_handle?: string | null
          org_rsi_id?: string | null
          status?: 'active' | 'inactive' | 'negotiating'
          terms?: string | null
          notes?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          type?: 'org' | 'player'
          relationship?: 'alliance' | 'neutral' | 'trading' | 'enemy'
          contact_handle?: string | null
          org_rsi_id?: string | null
          status?: 'active' | 'inactive' | 'negotiating'
          terms?: string | null
          notes?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: TableRelationship[]
      }
      member_progressions: {
        Row: {
          profile_id: string
          activity_level: 'casual' | 'regular' | 'paused' | null
          favorite_activity: string | null
          trainings_received: string[]
          notes_sage: string | null
          updated_by: string | null
          updated_at: string
        }
        Insert: {
          profile_id: string
          activity_level?: 'casual' | 'regular' | 'paused' | null
          favorite_activity?: string | null
          trainings_received?: string[]
          notes_sage?: string | null
          updated_by?: string | null
          updated_at?: string
        }
        Update: {
          profile_id?: string
          activity_level?: 'casual' | 'regular' | 'paused' | null
          favorite_activity?: string | null
          trainings_received?: string[]
          notes_sage?: string | null
          updated_by?: string | null
          updated_at?: string
        }
        Relationships: TableRelationship[]
      }
      member_promotions: {
        Row: {
          id: string
          profile_id: string
          from_role: string
          to_role: string
          promoted_by: string | null
          points_at_promotion: number | null
          reason: string | null
          promoted_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          from_role: string
          to_role: string
          promoted_by?: string | null
          points_at_promotion?: number | null
          reason?: string | null
          promoted_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          from_role?: string
          to_role?: string
          promoted_by?: string | null
          points_at_promotion?: number | null
          reason?: string | null
          promoted_at?: string
        }
        Relationships: TableRelationship[]
      }
      member_points: {
        Row: {
          id: string
          profile_id: string
          points: number
          reason: 'op_participated' | 'event_attended' | 'resource_created' | 'recruitment' | 'promotion_bonus' | 'penalty' | 'other'
          reason_detail: string | null
          awarded_by: string
          created_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          points: number
          reason: 'op_participated' | 'event_attended' | 'resource_created' | 'recruitment' | 'promotion_bonus' | 'penalty' | 'other'
          reason_detail?: string | null
          awarded_by: string
          created_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          points?: number
          reason?: 'op_participated' | 'event_attended' | 'resource_created' | 'recruitment' | 'promotion_bonus' | 'penalty' | 'other'
          reason_detail?: string | null
          awarded_by?: string
          created_at?: string
        }
        Relationships: TableRelationship[]
      }
      operations: {
        Row: {
          id: string
          title: string
          system_name: string
          type: 'combat' | 'salvage' | 'mining' | 'commerce' | 'infiltration' | 'rescue'
          status: 'planned' | 'active' | 'completed' | 'cancelled'
          departure_at: string
          estimated_duration_min: number | null
          risk_level: 'low' | 'medium' | 'high' | 'critical'
          commander_id: string | null
          description: string | null
          debrief: string | null
          min_privilege: number
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          system_name: string
          type: 'combat' | 'salvage' | 'mining' | 'commerce' | 'infiltration' | 'rescue'
          status?: 'planned' | 'active' | 'completed' | 'cancelled'
          departure_at: string
          estimated_duration_min?: number | null
          risk_level?: 'low' | 'medium' | 'high' | 'critical'
          commander_id?: string | null
          description?: string | null
          debrief?: string | null
          min_privilege?: number
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          system_name?: string
          type?: 'combat' | 'salvage' | 'mining' | 'commerce' | 'infiltration' | 'rescue'
          status?: 'planned' | 'active' | 'completed' | 'cancelled'
          departure_at?: string
          estimated_duration_min?: number | null
          risk_level?: 'low' | 'medium' | 'high' | 'critical'
          commander_id?: string | null
          description?: string | null
          debrief?: string | null
          min_privilege?: number
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: TableRelationship[]
      }
      push_subscriptions: {
        Row: {
          id: string
          profile_id: string
          endpoint: string
          p256dh: string
          auth: string
          created_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          endpoint: string
          p256dh: string
          auth: string
          created_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          endpoint?: string
          p256dh?: string
          auth?: string
          created_at?: string
        }
        Relationships: TableRelationship[]
      }
      op_role_slots: {
        Row: {
          id: string
          operation_id: string
          role: 'commander' | 'pilot' | 'copilot' | 'gunner' | 'medic' | 'engineer' | 'soldier' | 'fighter_pilot'
          assigned_profile_id: string | null
          ship_id: string | null
          notes: string | null
        }
        Insert: {
          id?: string
          operation_id: string
          role: 'commander' | 'pilot' | 'copilot' | 'gunner' | 'medic' | 'engineer' | 'soldier' | 'fighter_pilot'
          assigned_profile_id?: string | null
          ship_id?: string | null
          notes?: string | null
        }
        Update: {
          id?: string
          operation_id?: string
          role?: 'commander' | 'pilot' | 'copilot' | 'gunner' | 'medic' | 'engineer' | 'soldier' | 'fighter_pilot'
          assigned_profile_id?: string | null
          ship_id?: string | null
          notes?: string | null
        }
        Relationships: TableRelationship[]
      }
      op_resources: {
        Row: {
          id: string
          operation_id: string
          item_id: string | null
          item_name: string
          quantity: number
          unit: string
          status: 'reserved' | 'pending_request' | 'released' | 'utilized'
          transaction_id: string | null
          requested_by: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          operation_id: string
          item_id?: string | null
          item_name: string
          quantity: number
          unit?: string
          status?: 'reserved' | 'pending_request' | 'released' | 'utilized'
          transaction_id?: string | null
          requested_by?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          operation_id?: string
          item_id?: string | null
          item_name?: string
          quantity?: number
          unit?: string
          status?: 'reserved' | 'pending_request' | 'released' | 'utilized'
          transaction_id?: string | null
          requested_by?: string | null
          notes?: string | null
          created_at?: string
        }
        Relationships: TableRelationship[]
      }
      op_registrations: {
        Row: {
          id: string
          operation_id: string
          profile_id: string
          preferred_role: 'commander' | 'pilot' | 'copilot' | 'gunner' | 'medic' | 'engineer' | 'soldier' | 'fighter_pilot' | null
          notes: string | null
          status: 'pending' | 'confirmed' | 'rejected'
          created_at: string
        }
        Insert: {
          id?: string
          operation_id: string
          profile_id: string
          preferred_role?: 'commander' | 'pilot' | 'copilot' | 'gunner' | 'medic' | 'engineer' | 'soldier' | 'fighter_pilot' | null
          notes?: string | null
          status?: 'pending' | 'confirmed' | 'rejected'
          created_at?: string
        }
        Update: {
          id?: string
          operation_id?: string
          profile_id?: string
          preferred_role?: 'commander' | 'pilot' | 'copilot' | 'gunner' | 'medic' | 'engineer' | 'soldier' | 'fighter_pilot' | null
          notes?: string | null
          status?: 'pending' | 'confirmed' | 'rejected'
          created_at?: string
        }
        Relationships: TableRelationship[]
      }
      map_system_positions: {
        Row: {
          system_name: string
          x:           number
          y:           number
          updated_at:  string
        }
        Insert: {
          system_name: string
          x:           number
          y:           number
          updated_at?: string
        }
        Update: {
          x?:          number
          y?:          number
          updated_at?: string
        }
        Relationships: TableRelationship[]
      }
      map_jump_lanes: {
        Row: {
          id: string
          system_a: string
          system_b: string
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          system_a: string
          system_b: string
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          system_a?: string
          system_b?: string
          created_by?: string | null
          created_at?: string
        }
        Relationships: TableRelationship[]
      }
      map_points: {
        Row: {
          id: string
          system_name: string
          name: string
          type: 'base_inqfr' | 'base_alliee' | 'base_ennemie' | 'zone_interet' | 'point_danger' | 'ressource'
          description: string | null
          status: 'active' | 'inactive' | 'unknown'
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          system_name: string
          name: string
          type?: 'base_inqfr' | 'base_alliee' | 'base_ennemie' | 'zone_interet' | 'point_danger' | 'ressource'
          description?: string | null
          status?: 'active' | 'inactive' | 'unknown'
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          system_name?: string
          name?: string
          type?: 'base_inqfr' | 'base_alliee' | 'base_ennemie' | 'zone_interet' | 'point_danger' | 'ressource'
          description?: string | null
          status?: 'active' | 'inactive' | 'unknown'
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: TableRelationship[]
      }
      org_settings: {
        Row: {
          id: boolean
          recruitment_open: boolean
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          id?: boolean
          recruitment_open?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          id?: boolean
          recruitment_open?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: TableRelationship[]
      }
      inventory_items: {
        Row: {
          id: string
          name: string
          type: 'loot' | 'material' | 'blueprint' | 'uec' | 'component'
          unit: 'unit' | 'kg' | 'uec' | 'lot' | 'scu' | 'uscu' | 'mscu'
          description: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          type?: 'loot' | 'material' | 'blueprint' | 'uec' | 'component'
          unit?: 'unit' | 'kg' | 'uec' | 'lot' | 'scu' | 'uscu' | 'mscu'
          description?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          type?: 'loot' | 'material' | 'blueprint' | 'uec' | 'component'
          unit?: 'unit' | 'kg' | 'uec' | 'lot' | 'scu' | 'uscu' | 'mscu'
          description?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: TableRelationship[]
      }
      discord_voice_states: {
        Row: {
          user_id: string
          username: string
          channel_id: string
          channel_name: string
          updated_at: string
        }
        Insert: {
          user_id: string
          username: string
          channel_id: string
          channel_name: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          username?: string
          channel_id?: string
          channel_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      inventory_stock: {
        Row: {
          item_id: string
          quantity: number
          reserved_quantity: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          item_id: string
          quantity?: number
          reserved_quantity?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          item_id?: string
          quantity?: number
          reserved_quantity?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: TableRelationship[]
      }
      inventory_transactions: {
        Row: {
          id: string
          item_id: string
          type: 'deposit' | 'withdrawal' | 'reservation' | 'release'
          quantity: number
          member_id: string
          operation_id: string | null
          notes: string | null
          status: 'pending' | 'approved' | 'rejected' | 'direct'
          approved_by: string | null
          approved_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          item_id: string
          type: 'deposit' | 'withdrawal' | 'reservation' | 'release'
          quantity: number
          member_id: string
          operation_id?: string | null
          notes?: string | null
          status?: 'pending' | 'approved' | 'rejected' | 'direct'
          approved_by?: string | null
          approved_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          item_id?: string
          type?: 'deposit' | 'withdrawal' | 'reservation' | 'release'
          quantity?: number
          member_id?: string
          operation_id?: string | null
          notes?: string | null
          status?: 'pending' | 'approved' | 'rejected' | 'direct'
          approved_by?: string | null
          approved_at?: string | null
          created_at?: string
        }
        Relationships: TableRelationship[]
      }
      media_gallery: {
        Row: {
          id: string
          storage_path: string
          url: string
          title: string | null
          caption: string | null
          uploaded_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          storage_path: string
          url: string
          title?: string | null
          caption?: string | null
          uploaded_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          storage_path?: string
          url?: string
          title?: string | null
          caption?: string | null
          uploaded_by?: string | null
          created_at?: string
        }
        Relationships: TableRelationship[]
      }
      chat_channels: {
        Row: {
          id: string
          name: string
          description: string | null
          is_archived: boolean
          min_privilege: number
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          is_archived?: boolean
          min_privilege?: number
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          is_archived?: boolean
          min_privilege?: number
          created_by?: string | null
          created_at?: string
        }
        Relationships: TableRelationship[]
      }
      chat_messages: {
        Row: {
          id: string
          channel_id: string
          author_id: string
          content: string
          edited_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          channel_id: string
          author_id: string
          content: string
          edited_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          channel_id?: string
          author_id?: string
          content?: string
          edited_at?: string | null
          created_at?: string
        }
        Relationships: TableRelationship[]
      }
      chat_member_seen: {
        Row: {
          profile_id: string
          channel_id: string
          last_seen_at: string
        }
        Insert: {
          profile_id: string
          channel_id: string
          last_seen_at?: string
        }
        Update: {
          profile_id?: string
          channel_id?: string
          last_seen_at?: string
        }
        Relationships: TableRelationship[]
      }
      onboarding_progress: {
        Row: {
          profile_id: string
          step: 'profile' | 'ship' | 'operation' | 'operation_important' | 'first_event' | 'bonus'
            | 'discord_joined' | 'consacre_bonus'
            | 'consacre_events_5' | 'consacre_op_5' | 'consacre_logistics' | 'consacre_resource' | 'consacre_recruitment'
            | 'gardien_op_lead' | 'gardien_events_10' | 'gardien_logistics' | 'gardien_resource' | 'gardien_recruitment' | 'gardien_bonus'
            | 'inquisiteur_op_lead_3' | 'inquisiteur_event_organize' | 'inquisiteur_training' | 'inquisiteur_events_25' | 'inquisiteur_partnership' | 'inquisiteur_bonus'
          completed_at: string
        }
        Insert: {
          profile_id: string
          step: 'profile' | 'ship' | 'operation' | 'operation_important' | 'first_event' | 'bonus'
            | 'discord_joined' | 'consacre_bonus'
            | 'consacre_events_5' | 'consacre_op_5' | 'consacre_logistics' | 'consacre_resource' | 'consacre_recruitment'
            | 'gardien_op_lead' | 'gardien_events_10' | 'gardien_logistics' | 'gardien_resource' | 'gardien_recruitment' | 'gardien_bonus'
            | 'inquisiteur_op_lead_3' | 'inquisiteur_event_organize' | 'inquisiteur_training' | 'inquisiteur_events_25' | 'inquisiteur_partnership' | 'inquisiteur_bonus'
          completed_at?: string
        }
        Update: {
          profile_id?: string
          step?: 'profile' | 'ship' | 'operation' | 'operation_important' | 'first_event' | 'bonus'
            | 'discord_joined' | 'consacre_bonus'
            | 'consacre_events_5' | 'consacre_op_5' | 'consacre_logistics' | 'consacre_resource' | 'consacre_recruitment'
            | 'gardien_op_lead' | 'gardien_events_10' | 'gardien_logistics' | 'gardien_resource' | 'gardien_recruitment' | 'gardien_bonus'
            | 'inquisiteur_op_lead_3' | 'inquisiteur_event_organize' | 'inquisiteur_training' | 'inquisiteur_events_25' | 'inquisiteur_partnership' | 'inquisiteur_bonus'
          completed_at?: string
        }
        Relationships: TableRelationship[]
      }
      rank_evaluations: {
        Row: {
          id: string
          member_id: string
          initiated_by: string
          status: 'pending' | 'in_progress' | 'passed' | 'failed' | 'cancelled'
          instructions: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          member_id: string
          initiated_by: string
          status?: 'pending' | 'in_progress' | 'passed' | 'failed' | 'cancelled'
          instructions?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          member_id?: string
          initiated_by?: string
          status?: 'pending' | 'in_progress' | 'passed' | 'failed' | 'cancelled'
          instructions?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: TableRelationship[]
      }
      trusted_devices: {
        Row: {
          id: string
          profile_id: string
          device_id: string
          label: string | null
          expires_at: string
          created_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          device_id: string
          label?: string | null
          expires_at: string
          created_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          device_id?: string
          label?: string | null
          expires_at?: string
          created_at?: string
        }
        Relationships: TableRelationship[]
      }
      member_availability: {
        Row: {
          profile_id: string
          day_of_week: number
          slot: number
        }
        Insert: {
          profile_id: string
          day_of_week: number
          slot: number
        }
        Update: {
          profile_id?: string
          day_of_week?: number
          slot?: number
        }
        Relationships: TableRelationship[]
      }
      member_badges: {
        Row: {
          id: string
          profile_id: string
          badge_key: string
          earned_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          badge_key: string
          earned_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          badge_key?: string
          earned_at?: string
        }
        Relationships: TableRelationship[]
      }
      war_journal: {
        Row: {
          id: string
          operation_id: string | null
          title: string
          content: string
          author_id: string
          is_published: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          operation_id?: string | null
          title: string
          content?: string
          author_id: string
          is_published?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          operation_id?: string | null
          title?: string
          content?: string
          author_id?: string
          is_published?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: TableRelationship[]
      }
      operation_loot: {
        Row: {
          id: string
          operation_id: string
          total_auec: number
          note: string | null
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          operation_id: string
          total_auec: number
          note?: string | null
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          operation_id?: string
          total_auec?: number
          note?: string | null
          created_by?: string
          created_at?: string
        }
        Relationships: TableRelationship[]
      }
      loot_shares: {
        Row: {
          id: string
          loot_id: string
          profile_id: string
          amount: number
        }
        Insert: {
          id?: string
          loot_id: string
          profile_id: string
          amount: number
        }
        Update: {
          id?: string
          loot_id?: string
          profile_id?: string
          amount?: number
        }
        Relationships: TableRelationship[]
      }
    }
    Views: EmptySchema
    Functions: {
      get_chat_unread_count: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      try_reserve_inventory: {
        Args: {
          p_item_id:      string
          p_quantity:     number
          p_operation_id: string
          p_member_id:    string
          p_notes?:       string
        }
        Returns: Json
      }
      approve_inventory_transaction: {
        Args: {
          p_transaction_id: string
          p_approved_by:    string
        }
        Returns: Json
      }
      get_member_points_totals: {
        Args: Record<PropertyKey, never>
        Returns: Array<{ profile_id: string; total_points: number }>
      }
    }
    Enums: EmptySchema
    CompositeTypes: EmptySchema
  }
}
