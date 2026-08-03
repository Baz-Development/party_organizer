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
          host_profile_id: string
          hosts: string | null
          id: string
          kind: Database["public"]["Enums"]["event_kind"]
          organization_id: string | null
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
          host_profile_id: string
          hosts?: string | null
          id?: string
          kind: Database["public"]["Enums"]["event_kind"]
          organization_id?: string | null
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
          host_profile_id?: string
          hosts?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["event_kind"]
          organization_id?: string | null
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
      is_event_public: { Args: { event: string }; Returns: boolean }
      is_org_member: { Args: { org: string }; Returns: boolean }
      is_org_owner: { Args: { org: string }; Returns: boolean }
      is_platform_admin: { Args: never; Returns: boolean }
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
      theme_key: ["oliva", "terracota", "marinho", "dourado"],
      user_role: ["cliente", "organizacao", "admin"],
    },
  },
} as const

