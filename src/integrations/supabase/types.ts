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
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          after_snapshot: Json | null
          before_snapshot: Json | null
          created_at: string | null
          entity_id: string
          entity_type: string
          id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          after_snapshot?: Json | null
          before_snapshot?: Json | null
          created_at?: string | null
          entity_id: string
          entity_type: string
          id?: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          after_snapshot?: Json | null
          before_snapshot?: Json | null
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
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
          wants_newsletter: boolean | null
          wants_personalized_offers: boolean | null
          wants_sms: boolean | null
        }
        Insert: {
          contact_id: string
          created_at?: string | null
          customer_id: string
          id?: string
          is_primary?: boolean | null
          relationship_type: Database["public"]["Enums"]["relationship_type"]
          wants_newsletter?: boolean | null
          wants_personalized_offers?: boolean | null
          wants_sms?: boolean | null
        }
        Update: {
          contact_id?: string
          created_at?: string | null
          customer_id?: string
          id?: string
          is_primary?: boolean | null
          relationship_type?: Database["public"]["Enums"]["relationship_type"]
          wants_newsletter?: boolean | null
          wants_personalized_offers?: boolean | null
          wants_sms?: boolean | null
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
          consent_updated_at: string | null
          contact_type: Database["public"]["Enums"]["contact_type"] | null
          created_at: string | null
          email: string
          first_name: string
          id: string
          is_teacher: boolean | null
          last_name: string
          merged_into_id: string | null
          notes: string | null
          phone: string | null
          updated_at: string | null
          voyado_id: string
          wants_newsletter: boolean | null
          wants_personalized_offers: boolean | null
          wants_sms: boolean | null
          web_tracking_consent:
            | Database["public"]["Enums"]["tracking_consent"]
            | null
        }
        Insert: {
          consent_updated_at?: string | null
          contact_type?: Database["public"]["Enums"]["contact_type"] | null
          created_at?: string | null
          email: string
          first_name: string
          id?: string
          is_teacher?: boolean | null
          last_name: string
          merged_into_id?: string | null
          notes?: string | null
          phone?: string | null
          updated_at?: string | null
          voyado_id: string
          wants_newsletter?: boolean | null
          wants_personalized_offers?: boolean | null
          wants_sms?: boolean | null
          web_tracking_consent?:
            | Database["public"]["Enums"]["tracking_consent"]
            | null
        }
        Update: {
          consent_updated_at?: string | null
          contact_type?: Database["public"]["Enums"]["contact_type"] | null
          created_at?: string | null
          email?: string
          first_name?: string
          id?: string
          is_teacher?: boolean | null
          last_name?: string
          merged_into_id?: string | null
          notes?: string | null
          phone?: string | null
          updated_at?: string | null
          voyado_id?: string
          wants_newsletter?: boolean | null
          wants_personalized_offers?: boolean | null
          wants_sms?: boolean | null
          web_tracking_consent?:
            | Database["public"]["Enums"]["tracking_consent"]
            | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_merged_into_id_fkey"
            columns: ["merged_into_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_addresses: {
        Row: {
          address_type: Database["public"]["Enums"]["address_type"]
          city: string
          country: string
          created_at: string | null
          customer_id: string
          id: string
          is_approved_delivery_address: boolean | null
          is_default_for_type: boolean | null
          label: string | null
          name: string | null
          postal_code: string
          region: string | null
          street: string
          updated_at: string | null
        }
        Insert: {
          address_type?: Database["public"]["Enums"]["address_type"]
          city: string
          country?: string
          created_at?: string | null
          customer_id: string
          id?: string
          is_approved_delivery_address?: boolean | null
          is_default_for_type?: boolean | null
          label?: string | null
          name?: string | null
          postal_code: string
          region?: string | null
          street: string
          updated_at?: string | null
        }
        Update: {
          address_type?: Database["public"]["Enums"]["address_type"]
          city?: string
          country?: string
          created_at?: string | null
          customer_id?: string
          id?: string
          is_approved_delivery_address?: boolean | null
          is_default_for_type?: boolean | null
          label?: string | null
          name?: string | null
          postal_code?: string
          region?: string | null
          street?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_addresses_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
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
      email_messages: {
        Row: {
          body: string
          category: Database["public"]["Enums"]["email_category"] | null
          channel: Database["public"]["Enums"]["email_channel"] | null
          contact_id: string
          created_at: string | null
          error_message: string | null
          id: string
          related_basket_id: string | null
          related_order_id: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["email_status"] | null
          subject: string
          template_id: string | null
          to_email: string
          type_key: string | null
          updated_at: string | null
        }
        Insert: {
          body: string
          category?: Database["public"]["Enums"]["email_category"] | null
          channel?: Database["public"]["Enums"]["email_channel"] | null
          contact_id: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          related_basket_id?: string | null
          related_order_id?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["email_status"] | null
          subject: string
          template_id?: string | null
          to_email: string
          type_key?: string | null
          updated_at?: string | null
        }
        Update: {
          body?: string
          category?: Database["public"]["Enums"]["email_category"] | null
          channel?: Database["public"]["Enums"]["email_channel"] | null
          contact_id?: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          related_basket_id?: string | null
          related_order_id?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["email_status"] | null
          subject?: string
          template_id?: string | null
          to_email?: string
          type_key?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_messages_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_messages_related_order_id_fkey"
            columns: ["related_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_messages_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          body_template: string
          category: Database["public"]["Enums"]["email_category"] | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          subject_template: string
          template_key: string
          updated_at: string | null
        }
        Insert: {
          body_template: string
          category?: Database["public"]["Enums"]["email_category"] | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          subject_template: string
          template_key: string
          updated_at?: string | null
        }
        Update: {
          body_template?: string
          category?: Database["public"]["Enums"]["email_category"] | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          subject_template?: string
          template_key?: string
          updated_at?: string | null
        }
        Relationships: []
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
      order_items: {
        Row: {
          category_name: string
          created_at: string | null
          id: string
          line_total: number
          main_category: string
          order_id: string
          product_id: string
          product_name: string
          quantity: number
          unit_price: number
        }
        Insert: {
          category_name: string
          created_at?: string | null
          id?: string
          line_total?: number
          main_category: string
          order_id: string
          product_id: string
          product_name: string
          quantity?: number
          unit_price?: number
        }
        Update: {
          category_name?: string
          created_at?: string | null
          id?: string
          line_total?: number
          main_category?: string
          order_id?: string
          product_id?: string
          product_name?: string
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          account_id: string | null
          buyer_contact_id: string | null
          created_at: string | null
          customer_id: string
          id: string
          order_number: string
          status: string | null
          total_amount: number
        }
        Insert: {
          account_id?: string | null
          buyer_contact_id?: string | null
          created_at?: string | null
          customer_id: string
          id?: string
          order_number: string
          status?: string | null
          total_amount?: number
        }
        Update: {
          account_id?: string | null
          buyer_contact_id?: string | null
          created_at?: string | null
          customer_id?: string
          id?: string
          order_number?: string
          status?: string | null
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_buyer_contact_id_fkey"
            columns: ["buyer_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
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
          must_change_password: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          contact_id?: string | null
          created_at?: string | null
          email: string
          id?: string
          is_active?: boolean | null
          must_change_password?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          contact_id?: string | null
          created_at?: string | null
          email?: string
          id?: string
          is_active?: boolean | null
          must_change_password?: boolean | null
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
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      web_events: {
        Row: {
          category_name: string | null
          event_type: Database["public"]["Enums"]["web_event_type"]
          id: string
          occurred_at: string | null
          product_id: string | null
          product_name: string | null
          session_id: string
          url: string
          visit_index: number | null
        }
        Insert: {
          category_name?: string | null
          event_type: Database["public"]["Enums"]["web_event_type"]
          id?: string
          occurred_at?: string | null
          product_id?: string | null
          product_name?: string | null
          session_id: string
          url: string
          visit_index?: number | null
        }
        Update: {
          category_name?: string | null
          event_type?: Database["public"]["Enums"]["web_event_type"]
          id?: string
          occurred_at?: string | null
          product_id?: string | null
          product_name?: string | null
          session_id?: string
          url?: string
          visit_index?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "web_events_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "web_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      web_sessions: {
        Row: {
          contact_id: string
          ended_at: string | null
          id: string
          ip_hash: string | null
          session_token: string
          started_at: string | null
          user_agent: string | null
        }
        Insert: {
          contact_id: string
          ended_at?: string | null
          id?: string
          ip_hash?: string | null
          session_token: string
          started_at?: string | null
          user_agent?: string | null
        }
        Update: {
          contact_id?: string
          ended_at?: string | null
          id?: string
          ip_hash?: string | null
          session_token?: string
          started_at?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "web_sessions_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      address_type: "BILLING" | "DELIVERY" | "ALTERNATIVE_DELIVERY"
      app_role: "admin" | "moderator" | "user"
      contact_type:
        | "Medlem"
        | "Nyhetsbrev"
        | "Lärare"
        | "Köpare"
        | "Övrig"
        | "Privatperson"
      customer_category:
        | "Privat"
        | "Personal"
        | "Företag"
        | "ÅF"
        | "UF"
        | "Skola"
        | "Omsorg"
        | "Förening"
        | "Kommun och Region"
      customer_type_group: "B2C" | "B2B" | "B2G"
      email_category:
        | "WELCOME"
        | "ORDER_CONFIRMATION"
        | "ORDER_RECEIVED"
        | "ORDER_DELIVERED"
        | "PURCHASE_THANK_YOU"
        | "RECEIPT"
        | "ABANDONED_CART_REMINDER"
        | "NEWSLETTER"
        | "OTHER"
      email_channel: "EMAIL" | "SMS" | "NEWSLETTER" | "SYSTEM"
      email_status: "QUEUED" | "SENT" | "FAILED"
      relationship_type:
        | "TeacherAtSchool"
        | "BuyerAtCompany"
        | "PrimaryContact"
        | "Employee"
        | "Other"
      tracking_consent: "GRANTED" | "DENIED" | "UNKNOWN"
      web_event_type:
        | "PAGE_VIEW"
        | "PRODUCT_VIEW"
        | "CATEGORY_VIEW"
        | "ADD_TO_CART"
        | "CHECKOUT_START"
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
      address_type: ["BILLING", "DELIVERY", "ALTERNATIVE_DELIVERY"],
      app_role: ["admin", "moderator", "user"],
      contact_type: [
        "Medlem",
        "Nyhetsbrev",
        "Lärare",
        "Köpare",
        "Övrig",
        "Privatperson",
      ],
      customer_category: [
        "Privat",
        "Personal",
        "Företag",
        "ÅF",
        "UF",
        "Skola",
        "Omsorg",
        "Förening",
        "Kommun och Region",
      ],
      customer_type_group: ["B2C", "B2B", "B2G"],
      email_category: [
        "WELCOME",
        "ORDER_CONFIRMATION",
        "ORDER_RECEIVED",
        "ORDER_DELIVERED",
        "PURCHASE_THANK_YOU",
        "RECEIPT",
        "ABANDONED_CART_REMINDER",
        "NEWSLETTER",
        "OTHER",
      ],
      email_channel: ["EMAIL", "SMS", "NEWSLETTER", "SYSTEM"],
      email_status: ["QUEUED", "SENT", "FAILED"],
      relationship_type: [
        "TeacherAtSchool",
        "BuyerAtCompany",
        "PrimaryContact",
        "Employee",
        "Other",
      ],
      tracking_consent: ["GRANTED", "DENIED", "UNKNOWN"],
      web_event_type: [
        "PAGE_VIEW",
        "PRODUCT_VIEW",
        "CATEGORY_VIEW",
        "ADD_TO_CART",
        "CHECKOUT_START",
      ],
    },
  },
} as const
