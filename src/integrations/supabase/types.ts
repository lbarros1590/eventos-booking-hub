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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      bookings: {
        Row: {
          booking_date: string
          checklist_confirmed: boolean
          cleaning_fee: number
          created_at: string
          custom_checklist_items: Json | null
          deposit_paid: boolean
          discount_applied: number | null
          final_balance_paid: boolean
          id: string
          manual_price_override: number | null
          origin: string | null
          price: number
          status: string
          terms_accepted: boolean
          total_price: number
          updated_at: string
          user_id: string
          waive_cleaning_fee: boolean
        }
        Insert: {
          booking_date: string
          checklist_confirmed?: boolean
          cleaning_fee?: number
          created_at?: string
          custom_checklist_items?: Json | null
          deposit_paid?: boolean
          discount_applied?: number | null
          final_balance_paid?: boolean
          id?: string
          manual_price_override?: number | null
          origin?: string | null
          price: number
          status?: string
          terms_accepted?: boolean
          total_price: number
          updated_at?: string
          user_id: string
          waive_cleaning_fee?: boolean
        }
        Update: {
          booking_date?: string
          checklist_confirmed?: boolean
          cleaning_fee?: number
          created_at?: string
          custom_checklist_items?: Json | null
          deposit_paid?: boolean
          discount_applied?: number | null
          final_balance_paid?: boolean
          id?: string
          manual_price_override?: number | null
          origin?: string | null
          price?: number
          status?: string
          terms_accepted?: boolean
          total_price?: number
          updated_at?: string
          user_id?: string
          waive_cleaning_fee?: boolean
        }
        Relationships: []
      }
      calendar_exceptions: {
        Row: {
          created_at: string
          custom_price: number | null
          exception_date: string
          id: string
          is_blocked: boolean
          note: string | null
        }
        Insert: {
          created_at?: string
          custom_price?: number | null
          exception_date: string
          id?: string
          is_blocked?: boolean
          note?: string | null
        }
        Update: {
          created_at?: string
          custom_price?: number | null
          exception_date?: string
          id?: string
          is_blocked?: boolean
          note?: string | null
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          description: string
          expense_date: string
          id: string
          payment_date: string | null
        }
        Insert: {
          amount: number
          category?: string
          created_at?: string
          description: string
          expense_date?: string
          id?: string
          payment_date?: string | null
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          description?: string
          expense_date?: string
          id?: string
          payment_date?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          birth_date: string | null
          created_at: string
          has_discount: boolean
          id: string
          loyalty_points: number
          name: string
          phone: string | null
          reservation_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          birth_date?: string | null
          created_at?: string
          has_discount?: boolean
          id?: string
          loyalty_points?: number
          name: string
          phone?: string | null
          reservation_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          birth_date?: string | null
          created_at?: string
          has_discount?: boolean
          id?: string
          loyalty_points?: number
          name?: string
          phone?: string | null
          reservation_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      venue_settings: {
        Row: {
          amenities_list: Json | null
          base_price_weekday: number
          base_price_weekend: number
          cleaning_fee: number
          created_at: string
          default_checklist_items: Json | null
          gallery_urls: string[] | null
          global_discount_percent: number
          hero_image_url: string | null
          id: string
          payment_terms_text: string | null
          updated_at: string
        }
        Insert: {
          amenities_list?: Json | null
          base_price_weekday?: number
          base_price_weekend?: number
          cleaning_fee?: number
          created_at?: string
          default_checklist_items?: Json | null
          gallery_urls?: string[] | null
          global_discount_percent?: number
          hero_image_url?: string | null
          id?: string
          payment_terms_text?: string | null
          updated_at?: string
        }
        Update: {
          amenities_list?: Json | null
          base_price_weekday?: number
          base_price_weekend?: number
          cleaning_fee?: number
          created_at?: string
          default_checklist_items?: Json | null
          gallery_urls?: string[] | null
          global_discount_percent?: number
          hero_image_url?: string | null
          id?: string
          payment_terms_text?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
