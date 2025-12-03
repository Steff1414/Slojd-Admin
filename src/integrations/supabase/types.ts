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
      accounts: {
        Row: {
          agreement_id: string | null
          created_at: string | null
          customer_id: string
          id: string
          is_default: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          agreement_id?: string | null
          created_at?: string | null
          customer_id: string
          id?: string
          is_default?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          agreement_id?: string | null
          created_at?: string | null
          customer_id?: string
          id?: string
          is_default?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "accounts_agreement_id_fkey"
            columns: ["agreement_id"]
            isOneToOne: false
            referencedRelation: "agreements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      agreements: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      contact_customer_links: {
        Row: {
          contact_id: string
          created_at: string | null
          customer_id: string
          id: string
          is_primary: boolean | null
          relationship_type: Database["public"]["Enums"]["relationship_type"]
        }
        Insert: {
          contact_id: string
          created_at?: string | null
          customer_id: string
          id?: string
          is_primary?: boolean | null
          relationship_type: Database["public"]["Enums"]["relationship_type"]
        }
        Update: {
          contact_id?: string
          created_at?: string | null
          customer_id?: string
          id?: string
          is_primary?: boolean | null
          relationship_type?: Database["public"]["Enums"]["relationship_type"]
        }
        Relationships: [
          {
            foreignKeyName: "contact_customer_links_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_customer_links_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          contact_type: Database["public"]["Enums"]["contact_type"] | null
          created_at: string | null
          email: string
          first_name: string
          id: string
          is_teacher: boolean | null
          last_name: string
          notes: string | null
          phone: string | null
          updated_at: string | null
          voyado_id: string
        }
        Insert: {
          contact_type?: Database["public"]["Enums"]["contact_type"] | null
          created_at?: string | null
          email: string
          first_name: string
          id?: string
          is_teacher?: boolean | null
          last_name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string | null
          voyado_id: string
        }
        Update: {
          contact_type?: Database["public"]["Enums"]["contact_type"] | null
          created_at?: string | null
          email?: string
          first_name?: string
          id?: string
          is_teacher?: boolean | null
          last_name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string | null
          voyado_id?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          bc_customer_number: string
          created_at: string | null
          customer_category: Database["public"]["Enums"]["customer_category"]
          customer_type_group: Database["public"]["Enums"]["customer_type_group"]
          id: string
          is_active: boolean | null
          name: string
          norce_code: string | null
          payer_customer_id: string | null
          sitoo_customer_number: string | null
          updated_at: string | null
          voyado_id: string | null
        }
        Insert: {
          bc_customer_number: string
          created_at?: string | null
          customer_category: Database["public"]["Enums"]["customer_category"]
          customer_type_group: Database["public"]["Enums"]["customer_type_group"]
          id?: string
          is_active?: boolean | null
          name: string
          norce_code?: string | null
          payer_customer_id?: string | null
          sitoo_customer_number?: string | null
          updated_at?: string | null
          voyado_id?: string | null
        }
        Update: {
          bc_customer_number?: string
          created_at?: string | null
          customer_category?: Database["public"]["Enums"]["customer_category"]
          customer_type_group?: Database["public"]["Enums"]["customer_type_group"]
          id?: string
          is_active?: boolean | null
          name?: string
          norce_code?: string | null
          payer_customer_id?: string | null
          sitoo_customer_number?: string | null
          updated_at?: string | null
          voyado_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_payer_customer_id_fkey"
            columns: ["payer_customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      norce_password_sync_log: {
        Row: {
          id: string
          profile_id: string
          status: string | null
          synced_at: string | null
        }
        Insert: {
          id?: string
          profile_id: string
          status?: string | null
          synced_at?: string | null
        }
        Update: {
          id?: string
          profile_id?: string
          status?: string | null
          synced_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "norce_password_sync_log_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      password_reset_tokens: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          profile_id: string
          token: string
          used: boolean | null
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: string
          profile_id: string
          token: string
          used?: boolean | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          profile_id?: string
          token?: string
          used?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "password_reset_tokens_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          contact_id: string | null
          created_at: string | null
          email: string
          id: string
          is_active: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          contact_id?: string | null
          created_at?: string | null
          email: string
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          contact_id?: string | null
          created_at?: string | null
          email?: string
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_school_assignments: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          role: string | null
          school_customer_id: string
          teacher_contact_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          role?: string | null
          school_customer_id: string
          teacher_contact_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          role?: string | null
          school_customer_id?: string
          teacher_contact_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_school_assignments_school_customer_id_fkey"
            columns: ["school_customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_school_assignments_teacher_contact_id_fkey"
            columns: ["teacher_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      user_accounts: {
        Row: {
          account_id: string
          created_at: string | null
          id: string
          is_active: boolean | null
          is_default_for_user: boolean | null
          profile_id: string
        }
        Insert: {
          account_id: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_default_for_user?: boolean | null
          profile_id: string
        }
        Update: {
          account_id?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_default_for_user?: boolean | null
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_accounts_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_accounts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      contact_type: "Member" | "Newsletter" | "Teacher" | "Buyer" | "Other"
      customer_category:
        | "Privat"
        | "Personal"
        | "Företag"
        | "ÅF"
        | "UF"
        | "Skola"
        | "Omsorg"
        | "Förening"
      customer_type_group: "B2C" | "B2B" | "B2G"
      relationship_type:
        | "TeacherAtSchool"
        | "BuyerAtCompany"
        | "PrimaryContact"
        | "Employee"
        | "Other"
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
      contact_type: ["Member", "Newsletter", "Teacher", "Buyer", "Other"],
      customer_category: [
        "Privat",
        "Personal",
        "Företag",
        "ÅF",
        "UF",
        "Skola",
        "Omsorg",
        "Förening",
      ],
      customer_type_group: ["B2C", "B2B", "B2G"],
      relationship_type: [
        "TeacherAtSchool",
        "BuyerAtCompany",
        "PrimaryContact",
        "Employee",
        "Other",
      ],
    },
  },
} as const
