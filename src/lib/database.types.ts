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
          city: string | null
          created_at: string
          event_at: string
          eyebrow: string | null
          guest_list_open: boolean
          host_profile_id: string
          hosts: string | null
          id: string
          kind: Database["public"]["Enums"]["event_kind"]
          organization_id: string | null
          rsvp_deadline: string | null
          slug: string
          status: Database["public"]["Enums"]["event_status"]
          theme_key: Database["public"]["Enums"]["theme_key"]
          title: string
          updated_at: string
          venue: string | null
          welcome: string | null
        }
        Insert: {
          city?: string | null
          created_at?: string
          event_at: string
          eyebrow?: string | null
          guest_list_open?: boolean
          host_profile_id: string
          hosts?: string | null
          id?: string
          kind: Database["public"]["Enums"]["event_kind"]
          organization_id?: string | null
          rsvp_deadline?: string | null
          slug: string
          status?: Database["public"]["Enums"]["event_status"]
          theme_key?: Database["public"]["Enums"]["theme_key"]
          title: string
          updated_at?: string
          venue?: string | null
          welcome?: string | null
        }
        Update: {
          city?: string | null
          created_at?: string
          event_at?: string
          eyebrow?: string | null
          guest_list_open?: boolean
          host_profile_id?: string
          hosts?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["event_kind"]
          organization_id?: string | null
          rsvp_deadline?: string | null
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
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
      organization_members: {
        Row: {
          created_at: string
          organization_id: string
          profile_id: string
          role: Database["public"]["Enums"]["org_member_role"]
        }
        Insert: {
          created_at?: string
          organization_id: string
          profile_id: string
          role?: Database["public"]["Enums"]["org_member_role"]
        }
        Update: {
          created_at?: string
          organization_id?: string
          profile_id?: string
          role?: Database["public"]["Enums"]["org_member_role"]
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          city: string | null
          contact: string | null
          created_at: string
          id: string
          name: string
          plan: Database["public"]["Enums"]["org_plan"]
          since: string
        }
        Insert: {
          city?: string | null
          contact?: string | null
          created_at?: string
          id?: string
          name: string
          plan?: Database["public"]["Enums"]["org_plan"]
          since?: string
        }
        Update: {
          city?: string | null
          contact?: string | null
          created_at?: string
          id?: string
          name?: string
          plan?: Database["public"]["Enums"]["org_plan"]
          since?: string
        }
        Relationships: []
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
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email: string
          id: string
          role?: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: []
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
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
      is_event_public: { Args: { event: string }; Returns: boolean }
      is_org_member: { Args: { org: string }; Returns: boolean }
      is_org_owner: { Args: { org: string }; Returns: boolean }
      is_platform_admin: { Args: never; Returns: boolean }
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
      submit_open_rsvp: {
        Args: {
          p_companions: number
          p_dietary: string
          p_event_slug: string
          p_kids: number
          p_name: string
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
    }
    Enums: {
      event_kind:
        | "casamento"
        | "debutante"
        | "infantil"
        | "corporativo"
        | "formatura"
      event_status: "rascunho" | "publicado" | "encerrado"
      gift_status: "disponivel" | "reservado" | "comprado"
      module_id:
        | "rsvp"
        | "cronograma"
        | "local"
        | "presentes"
        | "galeria"
        | "mural"
        | "cardapio"
        | "amigo-secreto"
      org_member_role: "proprietario" | "colaborador"
      org_plan: "parceiro" | "premium" | "enterprise"
      payment_status: "pendente" | "pago" | "falho" | "reembolsado"
      reservation_status: "ativa" | "expirada" | "concluida" | "cancelada"
      rsvp_status: "pendente" | "confirmado" | "recusado"
      theme_key: "oliva" | "terracota" | "marinho" | "dourado"
      user_role: "cliente" | "organizacao" | "admin"
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
      event_kind: [
        "casamento",
        "debutante",
        "infantil",
        "corporativo",
        "formatura",
      ],
      event_status: ["rascunho", "publicado", "encerrado"],
      gift_status: ["disponivel", "reservado", "comprado"],
      module_id: [
        "rsvp",
        "cronograma",
        "local",
        "presentes",
        "galeria",
        "mural",
        "cardapio",
        "amigo-secreto",
      ],
      org_member_role: ["proprietario", "colaborador"],
      org_plan: ["parceiro", "premium", "enterprise"],
      payment_status: ["pendente", "pago", "falho", "reembolsado"],
      reservation_status: ["ativa", "expirada", "concluida", "cancelada"],
      rsvp_status: ["pendente", "confirmado", "recusado"],
      theme_key: ["oliva", "terracota", "marinho", "dourado"],
      user_role: ["cliente", "organizacao", "admin"],
    },
  },
} as const

