export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      ai_usage: {
        Row: {
          cost_cents: number
          created_at: string | null
          entity_id: string
          entity_type: string
          id: string
          operation: string
          tokens_used: number
        }
        Insert: {
          cost_cents: number
          created_at?: string | null
          entity_id: string
          entity_type: string
          id?: string
          operation: string
          tokens_used: number
        }
        Update: {
          cost_cents?: number
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          operation?: string
          tokens_used?: number
        }
        Relationships: []
      }
      connector: {
        Row: {
          created_at: string
          enabled: boolean | null
          id: string
          jurisdiction_slug: string
          key: string
          kind: string
          last_run_at: string | null
          last_status: string | null
          notes: string | null
          parser_key: string
          schedule: string | null
          source_id: string | null
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean | null
          id?: string
          jurisdiction_slug: string
          key: string
          kind: string
          last_run_at?: string | null
          last_status?: string | null
          notes?: string | null
          parser_key: string
          schedule?: string | null
          source_id?: string | null
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          enabled?: boolean | null
          id?: string
          jurisdiction_slug?: string
          key?: string
          kind?: string
          last_run_at?: string | null
          last_status?: string | null
          notes?: string | null
          parser_key?: string
          schedule?: string | null
          source_id?: string | null
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "connector_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "source"
            referencedColumns: ["id"]
          },
        ]
      }
      data_status: {
        Row: {
          counts: Json | null
          created_at: string | null
          job_id: string | null
          last_run_at: string | null
          last_success_at: string | null
          scope_key: string
          updated_at: string | null
        }
        Insert: {
          counts?: Json | null
          created_at?: string | null
          job_id?: string | null
          last_run_at?: string | null
          last_success_at?: string | null
          scope_key: string
          updated_at?: string | null
        }
        Update: {
          counts?: Json | null
          created_at?: string | null
          job_id?: string | null
          last_run_at?: string | null
          last_success_at?: string | null
          scope_key?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      digest_subscription: {
        Row: {
          active: boolean | null
          cadence: string
          confirmation_token: string | null
          created_at: string | null
          email: string
          id: string
          last_sent_at: string | null
          locations: Json
          name: string
          topics: string[] | null
          unsubscribe_token: string | null
        }
        Insert: {
          active?: boolean | null
          cadence: string
          confirmation_token?: string | null
          created_at?: string | null
          email: string
          id?: string
          last_sent_at?: string | null
          locations: Json
          name: string
          topics?: string[] | null
          unsubscribe_token?: string | null
        }
        Update: {
          active?: boolean | null
          cadence?: string
          confirmation_token?: string | null
          created_at?: string | null
          email?: string
          id?: string
          last_sent_at?: string | null
          locations?: Json
          name?: string
          topics?: string[] | null
          unsubscribe_token?: string | null
        }
        Relationships: []
      }
      election: {
        Row: {
          content_hash: string | null
          created_at: string | null
          date: string
          id: string
          info_url: string | null
          jurisdiction_id: string | null
          kind: string
          name: string
          registration_deadline: string | null
          results_json: Json | null
          source_id: string | null
          source_url: string | null
          updated_at: string | null
        }
        Insert: {
          content_hash?: string | null
          created_at?: string | null
          date: string
          id?: string
          info_url?: string | null
          jurisdiction_id?: string | null
          kind: string
          name: string
          registration_deadline?: string | null
          results_json?: Json | null
          source_id?: string | null
          source_url?: string | null
          updated_at?: string | null
        }
        Update: {
          content_hash?: string | null
          created_at?: string | null
          date?: string
          id?: string
          info_url?: string | null
          jurisdiction_id?: string | null
          kind?: string
          name?: string
          registration_deadline?: string | null
          results_json?: Json | null
          source_id?: string | null
          source_url?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "election_jurisdiction_id_fkey"
            columns: ["jurisdiction_id"]
            isOneToOne: false
            referencedRelation: "jurisdiction"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "election_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "source"
            referencedColumns: ["id"]
          },
        ]
      }
      guest_jobs: {
        Row: {
          completed_at: string | null
          created_at: string | null
          estimated_duration_ms: number | null
          id: string
          progress_message: string | null
          scope: string
          session_id: string | null
          started_at: string | null
          status: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          estimated_duration_ms?: number | null
          id?: string
          progress_message?: string | null
          scope: string
          session_id?: string | null
          started_at?: string | null
          status?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          estimated_duration_ms?: number | null
          id?: string
          progress_message?: string | null
          scope?: string
          session_id?: string | null
          started_at?: string | null
          status?: string
        }
        Relationships: []
      }
      guest_profile: {
        Row: {
          created_at: string | null
          default_scope: string | null
          expires_at: string | null
          id: string
          last_active_at: string | null
          selected_jurisdiction_id: string | null
          session_id: string
          topics: string[] | null
          user_role: string | null
        }
        Insert: {
          created_at?: string | null
          default_scope?: string | null
          expires_at?: string | null
          id?: string
          last_active_at?: string | null
          selected_jurisdiction_id?: string | null
          session_id: string
          topics?: string[] | null
          user_role?: string | null
        }
        Update: {
          created_at?: string | null
          default_scope?: string | null
          expires_at?: string | null
          id?: string
          last_active_at?: string | null
          selected_jurisdiction_id?: string | null
          session_id?: string
          topics?: string[] | null
          user_role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guest_profile_selected_jurisdiction_id_fkey"
            columns: ["selected_jurisdiction_id"]
            isOneToOne: false
            referencedRelation: "jurisdiction"
            referencedColumns: ["id"]
          },
        ]
      }
      ingest_run: {
        Row: {
          finished_at: string | null
          id: string
          log: string | null
          source_id: string | null
          started_at: string | null
          stats_json: Json | null
          status: string | null
        }
        Insert: {
          finished_at?: string | null
          id?: string
          log?: string | null
          source_id?: string | null
          started_at?: string | null
          stats_json?: Json | null
          status?: string | null
        }
        Update: {
          finished_at?: string | null
          id?: string
          log?: string | null
          source_id?: string | null
          started_at?: string | null
          stats_json?: Json | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ingest_run_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "source"
            referencedColumns: ["id"]
          },
        ]
      }
      item_topic: {
        Row: {
          cache_version: string | null
          confidence: number
          created_at: string | null
          doc_hash: string | null
          id: string
          item_id: string
          item_kind: string | null
          item_type: string
          jurisdiction_id: string | null
          occurred_at: string
          topic: string
        }
        Insert: {
          cache_version?: string | null
          confidence?: number
          created_at?: string | null
          doc_hash?: string | null
          id?: string
          item_id: string
          item_kind?: string | null
          item_type: string
          jurisdiction_id?: string | null
          occurred_at: string
          topic: string
        }
        Update: {
          cache_version?: string | null
          confidence?: number
          created_at?: string | null
          doc_hash?: string | null
          id?: string
          item_id?: string
          item_kind?: string | null
          item_type?: string
          jurisdiction_id?: string | null
          occurred_at?: string
          topic?: string
        }
        Relationships: [
          {
            foreignKeyName: "item_topic_jurisdiction_id_fkey"
            columns: ["jurisdiction_id"]
            isOneToOne: false
            referencedRelation: "jurisdiction"
            referencedColumns: ["id"]
          },
        ]
      }
      jurisdiction: {
        Row: {
          created_at: string | null
          fips: string | null
          geo: Json | null
          id: string
          name: string
          ocd_id: string | null
          parent_jurisdiction_id: string | null
          slug: string
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          fips?: string | null
          geo?: Json | null
          id?: string
          name: string
          ocd_id?: string | null
          parent_jurisdiction_id?: string | null
          slug: string
          type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          fips?: string | null
          geo?: Json | null
          id?: string
          name?: string
          ocd_id?: string | null
          parent_jurisdiction_id?: string | null
          slug?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jurisdiction_parent_jurisdiction_id_fkey"
            columns: ["parent_jurisdiction_id"]
            isOneToOne: false
            referencedRelation: "jurisdiction"
            referencedColumns: ["id"]
          },
        ]
      }
      legislation: {
        Row: {
          ai_summary: string | null
          content_hash: string | null
          created_at: string | null
          districts: string[] | null
          doc_url: string | null
          effective_at: string | null
          embedding: string | null
          external_id: string | null
          full_text: string | null
          id: string
          introduced_at: string | null
          jurisdiction_id: string | null
          occurred_at: string | null
          passed_at: string | null
          pdf_url: string | null
          people: Json | null
          search_vector: unknown | null
          source_id: string | null
          source_url: string | null
          status: string | null
          summary: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          ai_summary?: string | null
          content_hash?: string | null
          created_at?: string | null
          districts?: string[] | null
          doc_url?: string | null
          effective_at?: string | null
          embedding?: string | null
          external_id?: string | null
          full_text?: string | null
          id?: string
          introduced_at?: string | null
          jurisdiction_id?: string | null
          occurred_at?: string | null
          passed_at?: string | null
          pdf_url?: string | null
          people?: Json | null
          search_vector?: unknown | null
          source_id?: string | null
          source_url?: string | null
          status?: string | null
          summary?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          ai_summary?: string | null
          content_hash?: string | null
          created_at?: string | null
          districts?: string[] | null
          doc_url?: string | null
          effective_at?: string | null
          embedding?: string | null
          external_id?: string | null
          full_text?: string | null
          id?: string
          introduced_at?: string | null
          jurisdiction_id?: string | null
          occurred_at?: string | null
          passed_at?: string | null
          pdf_url?: string | null
          people?: Json | null
          search_vector?: unknown | null
          source_id?: string | null
          source_url?: string | null
          status?: string | null
          summary?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "legislation_jurisdiction_id_fkey"
            columns: ["jurisdiction_id"]
            isOneToOne: false
            referencedRelation: "jurisdiction"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "legislation_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "source"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting: {
        Row: {
          agenda_url: string | null
          ai_summary: string | null
          attachments: Json | null
          body_name: string | null
          content_hash: string | null
          created_at: string | null
          embedding: string | null
          ends_at: string | null
          external_id: string | null
          extracted_text: string | null
          id: string
          jurisdiction_id: string | null
          location: string | null
          minutes_url: string | null
          occurred_at: string | null
          search_vector: unknown | null
          source_id: string | null
          source_url: string | null
          starts_at: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          agenda_url?: string | null
          ai_summary?: string | null
          attachments?: Json | null
          body_name?: string | null
          content_hash?: string | null
          created_at?: string | null
          embedding?: string | null
          ends_at?: string | null
          external_id?: string | null
          extracted_text?: string | null
          id?: string
          jurisdiction_id?: string | null
          location?: string | null
          minutes_url?: string | null
          occurred_at?: string | null
          search_vector?: unknown | null
          source_id?: string | null
          source_url?: string | null
          starts_at?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          agenda_url?: string | null
          ai_summary?: string | null
          attachments?: Json | null
          body_name?: string | null
          content_hash?: string | null
          created_at?: string | null
          embedding?: string | null
          ends_at?: string | null
          external_id?: string | null
          extracted_text?: string | null
          id?: string
          jurisdiction_id?: string | null
          location?: string | null
          minutes_url?: string | null
          occurred_at?: string | null
          search_vector?: unknown | null
          source_id?: string | null
          source_url?: string | null
          starts_at?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meeting_jurisdiction_id_fkey"
            columns: ["jurisdiction_id"]
            isOneToOne: false
            referencedRelation: "jurisdiction"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "source"
            referencedColumns: ["id"]
          },
        ]
      }
      plan: {
        Row: {
          created_at: string | null
          features: Json | null
          id: string
          is_active: boolean | null
          max_jurisdictions: number
          max_topics: number | null
          name: string
          price_cents: number
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          max_jurisdictions: number
          max_topics?: number | null
          name: string
          price_cents?: number
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          max_jurisdictions?: number
          max_topics?: number | null
          name?: string
          price_cents?: number
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      profile: {
        Row: {
          created_at: string | null
          default_jurisdiction_id: string | null
          default_scope: string | null
          email: string
          id: string
          is_admin: boolean | null
          name: string | null
          onboarding_completed: boolean | null
          selected_jurisdiction_id: string | null
          updated_at: string | null
          user_role: Database["public"]["Enums"]["user_role"] | null
        }
        Insert: {
          created_at?: string | null
          default_jurisdiction_id?: string | null
          default_scope?: string | null
          email: string
          id: string
          is_admin?: boolean | null
          name?: string | null
          onboarding_completed?: boolean | null
          selected_jurisdiction_id?: string | null
          updated_at?: string | null
          user_role?: Database["public"]["Enums"]["user_role"] | null
        }
        Update: {
          created_at?: string | null
          default_jurisdiction_id?: string | null
          default_scope?: string | null
          email?: string
          id?: string
          is_admin?: boolean | null
          name?: string | null
          onboarding_completed?: boolean | null
          selected_jurisdiction_id?: string | null
          updated_at?: string | null
          user_role?: Database["public"]["Enums"]["user_role"] | null
        }
        Relationships: [
          {
            foreignKeyName: "profile_default_jurisdiction_id_fkey"
            columns: ["default_jurisdiction_id"]
            isOneToOne: false
            referencedRelation: "jurisdiction"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_selected_jurisdiction_id_fkey"
            columns: ["selected_jurisdiction_id"]
            isOneToOne: false
            referencedRelation: "jurisdiction"
            referencedColumns: ["id"]
          },
        ]
      }
      source: {
        Row: {
          connector_id: string | null
          created_at: string | null
          enabled: boolean | null
          id: string
          jurisdiction_id: string | null
          kind: string
          last_run_at: string | null
          last_status: string | null
          updated_at: string | null
          url: string
        }
        Insert: {
          connector_id?: string | null
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          jurisdiction_id?: string | null
          kind: string
          last_run_at?: string | null
          last_status?: string | null
          updated_at?: string | null
          url: string
        }
        Update: {
          connector_id?: string | null
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          jurisdiction_id?: string | null
          kind?: string
          last_run_at?: string | null
          last_status?: string | null
          updated_at?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "source_connector_id_fkey"
            columns: ["connector_id"]
            isOneToOne: false
            referencedRelation: "connector"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "source_jurisdiction_id_fkey"
            columns: ["jurisdiction_id"]
            isOneToOne: false
            referencedRelation: "jurisdiction"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription: {
        Row: {
          cadence: string
          channel: string
          created_at: string | null
          id: string
          last_sent_at: string | null
          query_json: Json
          scope: string | null
          topics: string[] | null
          user_id: string | null
        }
        Insert: {
          cadence?: string
          channel?: string
          created_at?: string | null
          id?: string
          last_sent_at?: string | null
          query_json: Json
          scope?: string | null
          topics?: string[] | null
          user_id?: string | null
        }
        Update: {
          cadence?: string
          channel?: string
          created_at?: string | null
          id?: string
          last_sent_at?: string | null
          query_json?: Json
          scope?: string | null
          topics?: string[] | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscription_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["id"]
          },
        ]
      }
      tag: {
        Row: {
          created_at: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      topic_trend: {
        Row: {
          ai_summary: string | null
          created_at: string | null
          election_count: number | null
          first_seen_at: string | null
          id: string
          item_count: number
          item_ids: string[]
          jurisdiction_id: string | null
          last_seen_at: string | null
          legislation_count: number | null
          meeting_count: number | null
          new_since_prev: number | null
          pct_change: number | null
          period_start: string
          spread_count: number | null
          time_window: string
          topic: string
        }
        Insert: {
          ai_summary?: string | null
          created_at?: string | null
          election_count?: number | null
          first_seen_at?: string | null
          id?: string
          item_count?: number
          item_ids?: string[]
          jurisdiction_id?: string | null
          last_seen_at?: string | null
          legislation_count?: number | null
          meeting_count?: number | null
          new_since_prev?: number | null
          pct_change?: number | null
          period_start: string
          spread_count?: number | null
          time_window: string
          topic: string
        }
        Update: {
          ai_summary?: string | null
          created_at?: string | null
          election_count?: number | null
          first_seen_at?: string | null
          id?: string
          item_count?: number
          item_ids?: string[]
          jurisdiction_id?: string | null
          last_seen_at?: string | null
          legislation_count?: number | null
          meeting_count?: number | null
          new_since_prev?: number | null
          pct_change?: number | null
          period_start?: string
          spread_count?: number | null
          time_window?: string
          topic?: string
        }
        Relationships: [
          {
            foreignKeyName: "topic_trend_jurisdiction_id_fkey"
            columns: ["jurisdiction_id"]
            isOneToOne: false
            referencedRelation: "jurisdiction"
            referencedColumns: ["id"]
          },
        ]
      }
      trend_aggregate: {
        Row: {
          by_kind: Json | null
          count: number
          last_computed_at: string | null
          sample_item_ids: string[] | null
          scope_key: string
          score: number
          time_window: string
          topic: string
        }
        Insert: {
          by_kind?: Json | null
          count?: number
          last_computed_at?: string | null
          sample_item_ids?: string[] | null
          scope_key: string
          score?: number
          time_window: string
          topic: string
        }
        Update: {
          by_kind?: Json | null
          count?: number
          last_computed_at?: string | null
          sample_item_ids?: string[] | null
          scope_key?: string
          score?: number
          time_window?: string
          topic?: string
        }
        Relationships: []
      }
      watchlist: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          is_default: boolean | null
          name: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_default?: boolean | null
          name: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_default?: boolean | null
          name?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "watchlist_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["id"]
          },
        ]
      }
      watchlist_item: {
        Row: {
          created_at: string | null
          display_order: number | null
          entity_id: string
          entity_type: string
          id: string
          notes: string | null
          watchlist_id: string | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          entity_id: string
          entity_type: string
          id?: string
          notes?: string | null
          watchlist_id?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          entity_id?: string
          entity_type?: string
          id?: string
          notes?: string | null
          watchlist_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "watchlist_item_watchlist_id_fkey"
            columns: ["watchlist_id"]
            isOneToOne: false
            referencedRelation: "watchlist"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      cleanup_expired_guest_sessions: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_window_bounds: {
        Args: { window_name: string }
        Returns: {
          end_time: string
          start_time: string
        }[]
      }
      gtrgm_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_options: {
        Args: { "": unknown }
        Returns: undefined
      }
      gtrgm_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_avg: {
        Args: { "": number[] }
        Returns: unknown
      }
      halfvec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_send: {
        Args: { "": unknown }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      hnsw_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnswhandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflathandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      l2_norm: {
        Args: { "": unknown } | { "": unknown }
        Returns: number
      }
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: unknown
      }
      normalize_scope_key: {
        Args: { scope_text: string }
        Returns: string
      }
      semantic_search: {
        Args: {
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          entity_type: string
          id: string
          similarity: number
          summary: string
          title: string
        }[]
      }
      set_limit: {
        Args: { "": number }
        Returns: number
      }
      show_limit: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      show_trgm: {
        Args: { "": string }
        Returns: string[]
      }
      sparsevec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      sparsevec_send: {
        Args: { "": unknown }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      vector_avg: {
        Args: { "": number[] }
        Returns: string
      }
      vector_dims: {
        Args: { "": string } | { "": unknown }
        Returns: number
      }
      vector_norm: {
        Args: { "": string }
        Returns: number
      }
      vector_out: {
        Args: { "": string }
        Returns: unknown
      }
      vector_send: {
        Args: { "": string }
        Returns: string
      }
      vector_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
    }
    Enums: {
      user_role: "activist" | "government" | "nonprofit"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      user_role: ["activist", "government", "nonprofit"],
    },
  },
} as const
