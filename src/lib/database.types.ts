// Gerado por `npm run db:types` a partir do schema do banco.
// Não edite à mão: qualquer alteração é sobrescrita na próxima geração.
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      bar_items: {
        Row: {
          description: string | null
          event_id: string
          id: string
          name: string
          position: number
        }
        Insert: {
          description?: string | null
          event_id: string
          id?: string
          name: string
          position: number
        }
        Update: {
          description?: string | null
          event_id?: string
          id?: string
          name?: string
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: "bar_items_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      email_messages: {
        Row: {
          attempts: number
          created_at: string
          data: Json
          event_id: string
          id: string
          last_error: string | null
          next_attempt_at: string
          provider_message_id: string | null
          recipient_email: string
          status: Database["public"]["Enums"]["email_status"]
          template: Database["public"]["Enums"]["email_template"]
          updated_at: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          data?: Json
          event_id: string
          id?: string
          last_error?: string | null
          next_attempt_at?: string
          provider_message_id?: string | null
          recipient_email: string
          status?: Database["public"]["Enums"]["email_status"]
          template: Database["public"]["Enums"]["email_template"]
          updated_at?: string
        }
        Update: {
          attempts?: number
          created_at?: string
          data?: Json
          event_id?: string
          id?: string
          last_error?: string | null
          next_attempt_at?: string
          provider_message_id?: string | null
          recipient_email?: string
          status?: Database["public"]["Enums"]["email_status"]
          template?: Database["public"]["Enums"]["email_template"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_messages_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      email_suppressions: {
        Row: {
          created_at: string
          email: string
          event_id: string
          id: string
          reason: Database["public"]["Enums"]["email_suppression_reason"]
        }
        Insert: {
          created_at?: string
          email: string
          event_id: string
          id?: string
          reason: Database["public"]["Enums"]["email_suppression_reason"]
        }
        Update: {
          created_at?: string
          email?: string
          event_id?: string
          id?: string
          reason?: Database["public"]["Enums"]["email_suppression_reason"]
        }
        Relationships: [
          {
            foreignKeyName: "email_suppressions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_modules: {
        Row: {
          event_id: string
          module: Database["public"]["Enums"]["module_id"]
        }
        Insert: {
          event_id: string
          module: Database["public"]["Enums"]["module_id"]
        }
        Update: {
          event_id?: string
          module?: Database["public"]["Enums"]["module_id"]
        }
        Relationships: [
          {
            foreignKeyName: "event_modules_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          address: string | null
          bar_service: string | null
          bar_signature_desc: string | null
          bar_signature_name: string | null
          city: string | null
          cover_path: string | null
          created_at: string
          event_at: string
          eyebrow: string | null
          host_profile_id: string
          hosts: string | null
          id: string
          kind: Database["public"]["Enums"]["event_kind"]
          moderation_policy: Database["public"]["Enums"]["moderation_policy"]
          postal_code: string | null
          rsvp_deadline: string | null
          secret_santa_budget: string | null
          secret_santa_draw_date: string | null
          secret_santa_exchange_date: string | null
          secret_santa_rules: string | null
          self_signup_token: string | null
          slug: string
          status: Database["public"]["Enums"]["event_status"]
          theme_key: Database["public"]["Enums"]["theme_key"]
          title: string
          updated_at: string
          venue: string | null
          welcome: string | null
        }
        Insert: {
          address?: string | null
          bar_service?: string | null
          bar_signature_desc?: string | null
          bar_signature_name?: string | null
          city?: string | null
          cover_path?: string | null
          created_at?: string
          event_at: string
          eyebrow?: string | null
          host_profile_id: string
          hosts?: string | null
          id?: string
          kind: Database["public"]["Enums"]["event_kind"]
          moderation_policy?: Database["public"]["Enums"]["moderation_policy"]
          postal_code?: string | null
          rsvp_deadline?: string | null
          secret_santa_budget?: string | null
          secret_santa_draw_date?: string | null
          secret_santa_exchange_date?: string | null
          secret_santa_rules?: string | null
          self_signup_token?: string | null
          slug: string
          status?: Database["public"]["Enums"]["event_status"]
          theme_key?: Database["public"]["Enums"]["theme_key"]
          title: string
          updated_at?: string
          venue?: string | null
          welcome?: string | null
        }
        Update: {
          address?: string | null
          bar_service?: string | null
          bar_signature_desc?: string | null
          bar_signature_name?: string | null
          city?: string | null
          cover_path?: string | null
          created_at?: string
          event_at?: string
          eyebrow?: string | null
          host_profile_id?: string
          hosts?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["event_kind"]
          moderation_policy?: Database["public"]["Enums"]["moderation_policy"]
          postal_code?: string | null
          rsvp_deadline?: string | null
          secret_santa_budget?: string | null
          secret_santa_draw_date?: string | null
          secret_santa_exchange_date?: string | null
          secret_santa_rules?: string | null
          self_signup_token?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["event_status"]
          theme_key?: Database["public"]["Enums"]["theme_key"]
          title?: string
          updated_at?: string
          venue?: string | null
          welcome?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_host_profile_id_fkey"
            columns: ["host_profile_id"]
            isOneToOne: false
            referencedRelation: "client_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_host_profile_id_fkey"
            columns: ["host_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      gift_reservations: {
        Row: {
          buyer_email: string | null
          buyer_name: string
          created_at: string
          event_id: string
          expires_at: string
          gift_id: string
          guest_id: string | null
          id: string
          status: Database["public"]["Enums"]["reservation_status"]
        }
        Insert: {
          buyer_email?: string | null
          buyer_name: string
          created_at?: string
          event_id: string
          expires_at: string
          gift_id: string
          guest_id?: string | null
          id?: string
          status?: Database["public"]["Enums"]["reservation_status"]
        }
        Update: {
          buyer_email?: string | null
          buyer_name?: string
          created_at?: string
          event_id?: string
          expires_at?: string
          gift_id?: string
          guest_id?: string | null
          id?: string
          status?: Database["public"]["Enums"]["reservation_status"]
        }
        Relationships: [
          {
            foreignKeyName: "gift_reservations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gift_reservations_gift_id_fkey"
            columns: ["gift_id"]
            isOneToOne: false
            referencedRelation: "gifts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gift_reservations_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
        ]
      }
      gifts: {
        Row: {
          category: string
          created_at: string
          event_id: string
          id: string
          name: string
          note: string | null
          price_cents: number
          quota_raised_cents: number
          quota_reserved_cents: number
          quota_target_cents: number | null
          status: Database["public"]["Enums"]["gift_status"]
          store: string | null
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          event_id: string
          id?: string
          name: string
          note?: string | null
          price_cents: number
          quota_raised_cents?: number
          quota_reserved_cents?: number
          quota_target_cents?: number | null
          status?: Database["public"]["Enums"]["gift_status"]
          store?: string | null
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          event_id?: string
          id?: string
          name?: string
          note?: string | null
          price_cents?: number
          quota_raised_cents?: number
          quota_reserved_cents?: number
          quota_target_cents?: number | null
          status?: Database["public"]["Enums"]["gift_status"]
          store?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gifts_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      guest_invites: {
        Row: {
          created_at: string
          guest_id: string
          id: string
          token: string
        }
        Insert: {
          created_at?: string
          guest_id: string
          id?: string
          token?: string
        }
        Update: {
          created_at?: string
          guest_id?: string
          id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "guest_invites_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: true
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
        ]
      }
      guests: {
        Row: {
          companions: number
          created_at: string
          dietary: string | null
          email: string | null
          event_id: string
          group_name: string | null
          id: string
          invited_at: string
          kids: number
          name: string
          phone: string | null
          responded_at: string | null
          status: Database["public"]["Enums"]["rsvp_status"]
          unlisted: boolean
          updated_at: string
        }
        Insert: {
          companions?: number
          created_at?: string
          dietary?: string | null
          email?: string | null
          event_id: string
          group_name?: string | null
          id?: string
          invited_at?: string
          kids?: number
          name: string
          phone?: string | null
          responded_at?: string | null
          status?: Database["public"]["Enums"]["rsvp_status"]
          unlisted?: boolean
          updated_at?: string
        }
        Update: {
          companions?: number
          created_at?: string
          dietary?: string | null
          email?: string | null
          event_id?: string
          group_name?: string | null
          id?: string
          invited_at?: string
          kids?: number
          name?: string
          phone?: string | null
          responded_at?: string | null
          status?: Database["public"]["Enums"]["rsvp_status"]
          unlisted?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "guests_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_items: {
        Row: {
          course: string
          description: string | null
          event_id: string
          id: string
          name: string
          position: number
        }
        Insert: {
          course: string
          description?: string | null
          event_id: string
          id?: string
          name: string
          position: number
        }
        Update: {
          course?: string
          description?: string | null
          event_id?: string
          id?: string
          name?: string
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      mural_messages: {
        Row: {
          author: string
          created_at: string
          event_id: string
          guest_id: string | null
          id: string
          likes_count: number
          message: string
          photo_path: string | null
          status: Database["public"]["Enums"]["mural_status"]
          visitor_id: string
        }
        Insert: {
          author: string
          created_at?: string
          event_id: string
          guest_id?: string | null
          id?: string
          likes_count?: number
          message: string
          photo_path?: string | null
          status?: Database["public"]["Enums"]["mural_status"]
          visitor_id: string
        }
        Update: {
          author?: string
          created_at?: string
          event_id?: string
          guest_id?: string | null
          id?: string
          likes_count?: number
          message?: string
          photo_path?: string | null
          status?: Database["public"]["Enums"]["mural_status"]
          visitor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mural_messages_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mural_messages_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_events: {
        Row: {
          event_type: string
          id: string
          payload: Json
          payment_id: string | null
          processed_at: string | null
          provider: string
          provider_event_id: string | null
          received_at: string
          signature_valid: boolean
        }
        Insert: {
          event_type: string
          id?: string
          payload: Json
          payment_id?: string | null
          processed_at?: string | null
          provider: string
          provider_event_id?: string | null
          received_at?: string
          signature_valid: boolean
        }
        Update: {
          event_type?: string
          id?: string
          payload?: Json
          payment_id?: string | null
          processed_at?: string | null
          provider?: string
          provider_event_id?: string | null
          received_at?: string
          signature_valid?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "payment_events_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_cents: number
          buyer_email: string | null
          buyer_name: string
          confirmed_at: string | null
          created_at: string
          currency: string
          event_id: string
          gift_id: string
          id: string
          provider: string
          provider_payment_id: string | null
          refunded_at: string | null
          reservation_id: string | null
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string
        }
        Insert: {
          amount_cents: number
          buyer_email?: string | null
          buyer_name: string
          confirmed_at?: string | null
          created_at?: string
          currency?: string
          event_id: string
          gift_id: string
          id?: string
          provider?: string
          provider_payment_id?: string | null
          refunded_at?: string | null
          reservation_id?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          buyer_email?: string | null
          buyer_name?: string
          confirmed_at?: string | null
          created_at?: string
          currency?: string
          event_id?: string
          gift_id?: string
          id?: string
          provider?: string
          provider_payment_id?: string | null
          refunded_at?: string | null
          reservation_id?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_gift_id_fkey"
            columns: ["gift_id"]
            isOneToOne: false
            referencedRelation: "gifts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "gift_reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      photos: {
        Row: {
          author: string
          caption: string | null
          created_at: string
          event_id: string
          guest_id: string | null
          id: string
          likes_count: number
          status: Database["public"]["Enums"]["photo_status"]
          storage_path: string
          visitor_id: string
        }
        Insert: {
          author: string
          caption?: string | null
          created_at?: string
          event_id: string
          guest_id?: string | null
          id?: string
          likes_count?: number
          status?: Database["public"]["Enums"]["photo_status"]
          storage_path: string
          visitor_id: string
        }
        Update: {
          author?: string
          caption?: string | null
          created_at?: string
          event_id?: string
          guest_id?: string | null
          id?: string
          likes_count?: number
          status?: Database["public"]["Enums"]["photo_status"]
          storage_path?: string
          visitor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "photos_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "photos_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string
          id: string
          provisioned: boolean
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email: string
          id: string
          provisioned?: boolean
          role?: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string
          id?: string
          provisioned?: boolean
          role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: []
      }
      reactions: {
        Row: {
          created_at: string
          event_id: string
          id: string
          target_id: string
          target_type: Database["public"]["Enums"]["reaction_target"]
          visitor_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          target_id: string
          target_type: Database["public"]["Enums"]["reaction_target"]
          visitor_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          target_id?: string
          target_type?: Database["public"]["Enums"]["reaction_target"]
          visitor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reactions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      rsvp_responses: {
        Row: {
          companions: number
          dietary: string | null
          event_id: string
          guest_id: string
          id: string
          kids: number
          responded_at: string
          status: Database["public"]["Enums"]["rsvp_status"]
        }
        Insert: {
          companions?: number
          dietary?: string | null
          event_id: string
          guest_id: string
          id?: string
          kids?: number
          responded_at?: string
          status: Database["public"]["Enums"]["rsvp_status"]
        }
        Update: {
          companions?: number
          dietary?: string | null
          event_id?: string
          guest_id?: string
          id?: string
          kids?: number
          responded_at?: string
          status?: Database["public"]["Enums"]["rsvp_status"]
        }
        Relationships: [
          {
            foreignKeyName: "rsvp_responses_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rsvp_responses_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_items: {
        Row: {
          description: string | null
          event_id: string
          id: string
          position: number
          time: string
          title: string
        }
        Insert: {
          description?: string | null
          event_id: string
          id?: string
          position: number
          time: string
          title: string
        }
        Update: {
          description?: string | null
          event_id?: string
          id?: string
          position?: number
          time?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_items_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      secret_santa_assignments: {
        Row: {
          draw_id: string
          giver_participant_id: string
          id: string
          receiver_participant_id: string
        }
        Insert: {
          draw_id: string
          giver_participant_id: string
          id?: string
          receiver_participant_id: string
        }
        Update: {
          draw_id?: string
          giver_participant_id?: string
          id?: string
          receiver_participant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "secret_santa_assignments_draw_id_fkey"
            columns: ["draw_id"]
            isOneToOne: false
            referencedRelation: "secret_santa_draws"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "secret_santa_assignments_giver_participant_id_fkey"
            columns: ["giver_participant_id"]
            isOneToOne: false
            referencedRelation: "secret_santa_participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "secret_santa_assignments_receiver_participant_id_fkey"
            columns: ["receiver_participant_id"]
            isOneToOne: false
            referencedRelation: "secret_santa_participants"
            referencedColumns: ["id"]
          },
        ]
      }
      secret_santa_draws: {
        Row: {
          event_id: string
          executed_at: string
          executed_by: string | null
          id: string
        }
        Insert: {
          event_id: string
          executed_at?: string
          executed_by?: string | null
          id?: string
        }
        Update: {
          event_id?: string
          executed_at?: string
          executed_by?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "secret_santa_draws_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      secret_santa_exclusions: {
        Row: {
          created_at: string
          event_id: string
          id: string
          participant_a_id: string
          participant_b_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          participant_a_id: string
          participant_b_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          participant_a_id?: string
          participant_b_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "secret_santa_exclusions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "secret_santa_exclusions_participant_a_id_fkey"
            columns: ["participant_a_id"]
            isOneToOne: false
            referencedRelation: "secret_santa_participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "secret_santa_exclusions_participant_b_id_fkey"
            columns: ["participant_b_id"]
            isOneToOne: false
            referencedRelation: "secret_santa_participants"
            referencedColumns: ["id"]
          },
        ]
      }
      secret_santa_participants: {
        Row: {
          created_at: string
          display_name: string
          event_id: string
          guest_id: string
          id: string
          joined_at: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name: string
          event_id: string
          guest_id: string
          id?: string
          joined_at?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string
          event_id?: string
          guest_id?: string
          id?: string
          joined_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "secret_santa_participants_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "secret_santa_participants_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
        ]
      }
      secret_santa_reveals: {
        Row: {
          assignment_id: string
          revealed_at: string
        }
        Insert: {
          assignment_id: string
          revealed_at?: string
        }
        Update: {
          assignment_id?: string
          revealed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "secret_santa_reveals_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: true
            referencedRelation: "secret_santa_assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      secret_santa_wishlists: {
        Row: {
          items: string[]
          participant_id: string
          updated_at: string
        }
        Insert: {
          items?: string[]
          participant_id: string
          updated_at?: string
        }
        Update: {
          items?: string[]
          participant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "secret_santa_wishlists_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: true
            referencedRelation: "secret_santa_participants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      client_accounts: {
        Row: {
          created_at: string | null
          display_name: string | null
          email: string | null
          event_count: number | null
          id: string | null
          last_sign_in_at: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      _require_published_module: {
        Args: {
          p_event_slug: string
          p_module: Database["public"]["Enums"]["module_id"]
        }
        Returns: {
          address: string | null
          bar_service: string | null
          bar_signature_desc: string | null
          bar_signature_name: string | null
          city: string | null
          cover_path: string | null
          created_at: string
          event_at: string
          eyebrow: string | null
          host_profile_id: string
          hosts: string | null
          id: string
          kind: Database["public"]["Enums"]["event_kind"]
          moderation_policy: Database["public"]["Enums"]["moderation_policy"]
          postal_code: string | null
          rsvp_deadline: string | null
          secret_santa_budget: string | null
          secret_santa_draw_date: string | null
          secret_santa_exchange_date: string | null
          secret_santa_rules: string | null
          self_signup_token: string | null
          slug: string
          status: Database["public"]["Enums"]["event_status"]
          theme_key: Database["public"]["Enums"]["theme_key"]
          title: string
          updated_at: string
          venue: string | null
          welcome: string | null
        }
        SetofOptions: {
          from: "*"
          to: "events"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      _resolve_media_author: {
        Args: { p_author: string; p_event_id: string; p_guest_token: string }
        Returns: {
          author: string
          guest_id: string
        }[]
      }
      _secret_santa_try: {
        Args: {
          p_exclusion_pairs: string[]
          p_givers: string[]
          p_idx: number
          p_pool: string[]
        }
        Returns: string[]
      }
      add_secret_santa_exclusion: {
        Args: {
          p_event_id: string
          p_participant_a: string
          p_participant_b: string
        }
        Returns: {
          created_at: string
          event_id: string
          id: string
          participant_a_id: string
          participant_b_id: string
        }
        SetofOptions: {
          from: "*"
          to: "secret_santa_exclusions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      assert_can_submit_mural_photo: {
        Args: { p_event_slug: string; p_visitor_id: string }
        Returns: string
      }
      assert_can_submit_photo: {
        Args: { p_event_slug: string; p_visitor_id: string }
        Returns: string
      }
      attach_checkout_session: {
        Args: {
          p_payment_id: string
          p_provider: string
          p_provider_payment_id: string
        }
        Returns: {
          amount_cents: number
          buyer_email: string | null
          buyer_name: string
          confirmed_at: string | null
          created_at: string
          currency: string
          event_id: string
          gift_id: string
          id: string
          provider: string
          provider_payment_id: string | null
          refunded_at: string | null
          reservation_id: string | null
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "payments"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      can_manage_event: { Args: { event: string }; Returns: boolean }
      claim_pending_email_messages: {
        Args: { p_limit: number }
        Returns: {
          attempts: number
          created_at: string
          data: Json
          event_id: string
          id: string
          last_error: string | null
          next_attempt_at: string
          provider_message_id: string | null
          recipient_email: string
          status: Database["public"]["Enums"]["email_status"]
          template: Database["public"]["Enums"]["email_template"]
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "email_messages"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_guest_by_invite_token: {
        Args: { p_token: string }
        Returns: {
          companions: number
          dietary: string
          event_id: string
          guest_id: string
          kids: number
          name: string
          status: Database["public"]["Enums"]["rsvp_status"]
        }[]
      }
      get_my_secret_santa: {
        Args: { p_token: string }
        Returns: {
          drawn: boolean
          receiver_name: string
          receiver_wishlist: string[]
          revealed_at: string
        }[]
      }
      get_my_secret_santa_participation: {
        Args: { p_token: string }
        Returns: {
          display_name: string
          joined_at: string
          participant_id: string
          wishlist: string[]
        }[]
      }
      get_payment_status: {
        Args: { p_payment_id: string }
        Returns: {
          amount_cents: number
          currency: string
          gift_id: string
          gift_name: string
          gift_status: Database["public"]["Enums"]["gift_status"]
          payment_id: string
          status: Database["public"]["Enums"]["payment_status"]
        }[]
      }
      get_secret_santa_status: {
        Args: { p_event_id: string }
        Returns: {
          drawn_at: string
          participant_count: number
        }[]
      }
      is_event_public: { Args: { event: string }; Returns: boolean }
      is_platform_admin: { Args: never; Returns: boolean }
      join_secret_santa: {
        Args: { p_display_name: string; p_token: string }
        Returns: {
          created_at: string
          display_name: string
          event_id: string
          guest_id: string
          id: string
          joined_at: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "secret_santa_participants"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      list_client_accounts: {
        Args: never
        Returns: {
          created_at: string | null
          display_name: string | null
          email: string | null
          event_count: number | null
          id: string | null
          last_sign_in_at: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "client_accounts"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      process_payment_event: {
        Args: {
          p_amount_cents: number
          p_event_type: string
          p_payment_id: string
          p_provider_payment_id: string
        }
        Returns: {
          applied: boolean
          payment_id: string
          reason: string
        }[]
      }
      react_to_item: {
        Args: {
          p_target_id: string
          p_target_type: Database["public"]["Enums"]["reaction_target"]
          p_visitor_id: string
        }
        Returns: number
      }
      redo_secret_santa_draw: {
        Args: { p_event_id: string }
        Returns: {
          event_id: string
          executed_at: string
          executed_by: string | null
          id: string
        }
        SetofOptions: {
          from: "*"
          to: "secret_santa_draws"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      remove_secret_santa_exclusion: {
        Args: { p_exclusion_id: string }
        Returns: undefined
      }
      run_secret_santa_draw: {
        Args: { p_event_id: string }
        Returns: {
          event_id: string
          executed_at: string
          executed_by: string | null
          id: string
        }
        SetofOptions: {
          from: "*"
          to: "secret_santa_draws"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      start_gift_checkout: {
        Args: {
          p_amount_cents: number
          p_buyer_email: string
          p_buyer_name: string
          p_event_slug: string
          p_gift_id: string
        }
        Returns: {
          amount_cents: number
          currency: string
          gift_id: string
          payment_id: string
          reservation_expires_at: string
          status: Database["public"]["Enums"]["payment_status"]
        }[]
      }
      submit_mural_message: {
        Args: {
          p_author: string
          p_event_slug: string
          p_guest_token?: string
          p_message: string
          p_photo_path?: string
          p_visitor_id: string
        }
        Returns: {
          author: string
          created_at: string
          event_id: string
          guest_id: string | null
          id: string
          likes_count: number
          message: string
          photo_path: string | null
          status: Database["public"]["Enums"]["mural_status"]
          visitor_id: string
        }
        SetofOptions: {
          from: "*"
          to: "mural_messages"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      submit_photo: {
        Args: {
          p_author: string
          p_caption: string
          p_event_slug: string
          p_guest_token?: string
          p_storage_path: string
          p_visitor_id: string
        }
        Returns: {
          author: string
          caption: string | null
          created_at: string
          event_id: string
          guest_id: string | null
          id: string
          likes_count: number
          status: Database["public"]["Enums"]["photo_status"]
          storage_path: string
          visitor_id: string
        }
        SetofOptions: {
          from: "*"
          to: "photos"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      submit_rsvp: {
        Args: {
          p_companions: number
          p_dietary: string
          p_kids: number
          p_status: Database["public"]["Enums"]["rsvp_status"]
          p_token: string
        }
        Returns: {
          companions: number
          created_at: string
          dietary: string | null
          email: string | null
          event_id: string
          group_name: string | null
          id: string
          invited_at: string
          kids: number
          name: string
          phone: string | null
          responded_at: string | null
          status: Database["public"]["Enums"]["rsvp_status"]
          unlisted: boolean
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "guests"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      submit_self_signup_rsvp: {
        Args: {
          p_companions: number
          p_dietary: string
          p_event_slug: string
          p_kids: number
          p_name: string
          p_signup_token: string
          p_status: Database["public"]["Enums"]["rsvp_status"]
        }
        Returns: {
          companions: number
          created_at: string
          dietary: string | null
          email: string | null
          event_id: string
          group_name: string | null
          id: string
          invited_at: string
          kids: number
          name: string
          phone: string | null
          responded_at: string | null
          status: Database["public"]["Enums"]["rsvp_status"]
          unlisted: boolean
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "guests"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      unsubscribe_email: {
        Args: { p_email: string; p_event_id: string }
        Returns: undefined
      }
      update_secret_santa_wishlist: {
        Args: { p_token: string; p_wishlist: string[] }
        Returns: {
          items: string[]
          participant_id: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "secret_santa_wishlists"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      email_status: "pendente" | "enviando" | "entregue" | "falha"
      email_suppression_reason: "retorno_permanente" | "descadastro"
      email_template:
        | "convite"
        | "lembrete_rsvp"
        | "confirmacao_rsvp"
        | "recibo_presente"
        | "revelacao_amigo_secreto"
        | "acesso_painel"
      event_kind:
        | "casamento"
        | "debutante"
        | "infantil"
        | "corporativo"
        | "formatura"
        | "aniversario"
        | "confraternizacao"
        | "outros"
      event_status: "rascunho" | "publicado" | "encerrado"
      gift_status: "disponivel" | "reservado" | "comprado"
      moderation_policy: "previa" | "imediata"
      module_id:
        | "rsvp"
        | "cronograma"
        | "local"
        | "presentes"
        | "galeria"
        | "mural"
        | "cardapio"
        | "amigo-secreto"
        | "bar"
      mural_status: "pendente" | "aprovada" | "oculta"
      payment_status: "pendente" | "pago" | "falho" | "reembolsado"
      photo_status: "pendente" | "aprovada" | "oculta"
      reaction_target: "foto" | "recado"
      reservation_status: "ativa" | "expirada" | "concluida" | "cancelada"
      rsvp_status: "pendente" | "confirmado" | "recusado"
      theme_key: "oliva" | "terracota" | "marinho" | "dourado"
      user_role: "cliente" | "admin"
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
      email_status: ["pendente", "enviando", "entregue", "falha"],
      email_suppression_reason: ["retorno_permanente", "descadastro"],
      email_template: [
        "convite",
        "lembrete_rsvp",
        "confirmacao_rsvp",
        "recibo_presente",
        "revelacao_amigo_secreto",
        "acesso_painel",
      ],
      event_kind: [
        "casamento",
        "debutante",
        "infantil",
        "corporativo",
        "formatura",
        "aniversario",
        "confraternizacao",
        "outros",
      ],
      event_status: ["rascunho", "publicado", "encerrado"],
      gift_status: ["disponivel", "reservado", "comprado"],
      moderation_policy: ["previa", "imediata"],
      module_id: [
        "rsvp",
        "cronograma",
        "local",
        "presentes",
        "galeria",
        "mural",
        "cardapio",
        "amigo-secreto",
        "bar",
      ],
      mural_status: ["pendente", "aprovada", "oculta"],
      payment_status: ["pendente", "pago", "falho", "reembolsado"],
      photo_status: ["pendente", "aprovada", "oculta"],
      reaction_target: ["foto", "recado"],
      reservation_status: ["ativa", "expirada", "concluida", "cancelada"],
      rsvp_status: ["pendente", "confirmado", "recusado"],
      theme_key: ["oliva", "terracota", "marinho", "dourado"],
      user_role: ["cliente", "admin"],
    },
  },
} as const

