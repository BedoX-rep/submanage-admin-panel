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
      clients: {
        Row: {
          created_at: string
          id: string
          name: string
          phone: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          phone: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          phone?: string
          user_id?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          created_at: string
          id: string
          name: string
          position: number
          price: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          position?: number
          price: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          position?: number
          price?: number
          user_id?: string
        }
        Relationships: []
      }
      receipt_items: {
        Row: {
          created_at: string
          custom_item_name: string | null
          id: string
          price: number
          product_id: string | null
          quantity: number
          receipt_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          custom_item_name?: string | null
          id?: string
          price: number
          product_id?: string | null
          quantity: number
          receipt_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          custom_item_name?: string | null
          id?: string
          price?: number
          product_id?: string | null
          quantity?: number
          receipt_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "receipt_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receipt_items_receipt_id_fkey"
            columns: ["receipt_id"]
            isOneToOne: false
            referencedRelation: "receipts"
            referencedColumns: ["id"]
          },
        ]
      }
      receipts: {
        Row: {
          advance_payment: number | null
          balance: number
          client_id: string
          created_at: string
          delivery_status: string
          discount_amount: number | null
          discount_percentage: number | null
          id: string
          left_eye_axe: number | null
          left_eye_cyl: number | null
          left_eye_sph: number | null
          montage_status: string
          right_eye_axe: number | null
          right_eye_cyl: number | null
          right_eye_sph: number | null
          subtotal: number
          tax: number
          total: number
          user_id: string
        }
        Insert: {
          advance_payment?: number | null
          balance?: number
          client_id: string
          created_at?: string
          delivery_status?: string
          discount_amount?: number | null
          discount_percentage?: number | null
          id?: string
          left_eye_axe?: number | null
          left_eye_cyl?: number | null
          left_eye_sph?: number | null
          montage_status?: string
          right_eye_axe?: number | null
          right_eye_cyl?: number | null
          right_eye_sph?: number | null
          subtotal?: number
          tax?: number
          total?: number
          user_id: string
        }
        Update: {
          advance_payment?: number | null
          balance?: number
          client_id?: string
          created_at?: string
          delivery_status?: string
          discount_amount?: number | null
          discount_percentage?: number | null
          id?: string
          left_eye_axe?: number | null
          left_eye_cyl?: number | null
          left_eye_sph?: number | null
          montage_status?: string
          right_eye_axe?: number | null
          right_eye_cyl?: number | null
          right_eye_sph?: number | null
          subtotal?: number
          tax?: number
          total?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "receipts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          created_at: string | null
          display_name: string
          email: string
          end_date: string | null
          id: string
          is_recurring: boolean | null
          start_date: string | null
          subscription_status: Database["public"]["Enums"]["subscription_status"]
          subscription_type:
            | Database["public"]["Enums"]["subscription_type"]
            | null
          trial_used: boolean | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          display_name?: string
          email?: string
          end_date?: string | null
          id?: string
          is_recurring?: boolean | null
          start_date?: string | null
          subscription_status?: Database["public"]["Enums"]["subscription_status"]
          subscription_type?:
            | Database["public"]["Enums"]["subscription_type"]
            | null
          trial_used?: boolean | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          display_name?: string
          email?: string
          end_date?: string | null
          id?: string
          is_recurring?: boolean | null
          start_date?: string | null
          subscription_status?: Database["public"]["Enums"]["subscription_status"]
          subscription_type?:
            | Database["public"]["Enums"]["subscription_type"]
            | null
          trial_used?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      get_user_admin_status: {
        Args: { user_id: string }
        Returns: boolean
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      renew_recurring_subscriptions: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      update_positions: {
        Args: { moved_id: string; new_pos: number }
        Returns: undefined
      }
    }
    Enums: {
      subscription_status:
        | "Active"
        | "Suspended"
        | "Cancelled"
        | "inActive"
        | "Expired"
      subscription_type: "Trial" | "Monthly" | "Quarterly" | "Lifetime"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      subscription_status: [
        "Active",
        "Suspended",
        "Cancelled",
        "inActive",
        "Expired",
      ],
      subscription_type: ["Trial", "Monthly", "Quarterly", "Lifetime"],
    },
  },
} as const
