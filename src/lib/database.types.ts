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
      menu_options: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          poll_id: string
          tags: string[]
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          poll_id: string
          tags?: string[]
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          poll_id?: string
          tags?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "menu_options_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "menu_polls"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_polls: {
        Row: {
          closes_at: string
          course: string
          created_at: string
          event_id: string
          id: string
          max_choices: number
          question: string
          updated_at: string
        }
        Insert: {
          closes_at: string
          course: string
          created_at?: string
          event_id: string
          id?: string
          max_choices?: number
          question: string
          updated_at?: string
        }
        Update: {
          closes_at?: string
          course?: string
          created_at?: string
          event_id?: string
          id?: string
          max_choices?: number
          question?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_polls_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_votes: {
        Row: {
          created_at: string
          guest_id: string
          id: string
          option_id: string
          poll_id: string
        }
        Insert: {
          created_at?: string
          guest_id: string
          id?: string
          option_id: string
          poll_id: string
        }
        Update: {
          created_at?: string
          guest_id?: string
          id?: string
          option_id?: string
          poll_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_votes_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_votes_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "menu_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_votes_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "menu_polls"
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
      get_menu_polls_publicos: {
        Args: { p_event_slug: string }
        Returns: {
          closes_at: string
          course: string
          max_choices: number
          option_desc: string
          option_id: string
          option_name: string
          option_tags: string[]
          poll_id: string
          question: string
          votes: number
        }[]
      }
      get_menu_votes_by_token: {
        Args: { p_token: string }
        Returns: {
          option_id: string
          poll_id: string
        }[]
      }
      is_event_public: { Args: { event: string }; Returns: boolean }
      is_org_member: { Args: { org: string }; Returns: boolean }
      is_org_owner: { Args: { org: string }; Returns: boolean }
      is_platform_admin: { Args: never; Returns: boolean }
      submit_menu_vote: {
        Args: { p_option_ids: string[]; p_poll_id: string; p_token: string }
        Returns: string[]
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
      rsvp_status: ["pendente", "confirmado", "recusado"],
      theme_key: ["oliva", "terracota", "marinho", "dourado"],
      user_role: ["cliente", "organizacao", "admin"],
    },
  },
} as const

