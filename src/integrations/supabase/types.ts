export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      apartment_evaluations: {
        Row: {
          address: string | null
          annual_report_url: string | null
          apartment_url: string | null
          balcony: number | null
          balcony_comment: string | null
          bathroom: number | null
          bathroom_comment: string | null
          bedrooms: number | null
          bedrooms_comment: string | null
          cashflow_per_sqm: number | null
          comments: string | null
          created_at: string
          debt_per_sqm: number | null
          fee_per_sqm: number | null
          final_price: number | null
          förvaring: number | null
          förvaring_comment: string | null
          id: string
          is_draft: boolean | null
          kitchen: number | null
          kitchen_comment: string | null
          ljusinsläpp: number | null
          ljusinsläpp_comment: string | null
          major_maintenance_done: boolean | null
          monthly_fee: number | null
          owns_land: boolean | null
          planlösning: number | null
          planlösning_comment: string | null
          price: number | null
          rooms: string | null
          size: number | null
          source_id: string | null
          surfaces: number | null
          surfaces_comment: string | null
          underhållsplan: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          annual_report_url?: string | null
          apartment_url?: string | null
          balcony?: number | null
          balcony_comment?: string | null
          bathroom?: number | null
          bathroom_comment?: string | null
          bedrooms?: number | null
          bedrooms_comment?: string | null
          cashflow_per_sqm?: number | null
          comments?: string | null
          created_at?: string
          debt_per_sqm?: number | null
          fee_per_sqm?: number | null
          final_price?: number | null
          förvaring?: number | null
          förvaring_comment?: string | null
          id?: string
          is_draft?: boolean | null
          kitchen?: number | null
          kitchen_comment?: string | null
          ljusinsläpp?: number | null
          ljusinsläpp_comment?: string | null
          major_maintenance_done?: boolean | null
          monthly_fee?: number | null
          owns_land?: boolean | null
          planlösning?: number | null
          planlösning_comment?: string | null
          price?: number | null
          rooms?: string | null
          size?: number | null
          source_id?: string | null
          surfaces?: number | null
          surfaces_comment?: string | null
          underhållsplan?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          annual_report_url?: string | null
          apartment_url?: string | null
          balcony?: number | null
          balcony_comment?: string | null
          bathroom?: number | null
          bathroom_comment?: string | null
          bedrooms?: number | null
          bedrooms_comment?: string | null
          cashflow_per_sqm?: number | null
          comments?: string | null
          created_at?: string
          debt_per_sqm?: number | null
          fee_per_sqm?: number | null
          final_price?: number | null
          förvaring?: number | null
          förvaring_comment?: string | null
          id?: string
          is_draft?: boolean | null
          kitchen?: number | null
          kitchen_comment?: string | null
          ljusinsläpp?: number | null
          ljusinsläpp_comment?: string | null
          major_maintenance_done?: boolean | null
          monthly_fee?: number | null
          owns_land?: boolean | null
          planlösning?: number | null
          planlösning_comment?: string | null
          price?: number | null
          rooms?: string | null
          size?: number | null
          source_id?: string | null
          surfaces?: number | null
          surfaces_comment?: string | null
          underhållsplan?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          buyer_type: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          notes: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          buyer_type?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          buyer_type?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      saved_comparisons: {
        Row: {
          created_at: string
          id: string
          name: string
          selected_evaluations: string[]
          selected_fields: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          selected_evaluations: string[]
          selected_fields: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          selected_evaluations?: string[]
          selected_fields?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
