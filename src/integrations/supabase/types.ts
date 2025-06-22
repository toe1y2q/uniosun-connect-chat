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
      chat_messages: {
        Row: {
          created_at: string | null
          flagged_reason: string | null
          id: string
          is_flagged: boolean | null
          message: string
          sender_id: string
          session_id: string
        }
        Insert: {
          created_at?: string | null
          flagged_reason?: string | null
          id?: string
          is_flagged?: boolean | null
          message: string
          sender_id: string
          session_id: string
        }
        Update: {
          created_at?: string | null
          flagged_reason?: string | null
          id?: string
          is_flagged?: boolean | null
          message?: string
          sender_id?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          full_name: string | null
          id: number
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          full_name?: string | null
          id?: never
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          full_name?: string | null
          id?: never
          user_id?: string | null
        }
        Relationships: []
      }
      questions: {
        Row: {
          correct_answer: number
          created_at: string | null
          department_id: string
          id: string
          options: Json
          question: string
        }
        Insert: {
          correct_answer: number
          created_at?: string | null
          department_id: string
          id?: string
          options: Json
          question: string
        }
        Update: {
          correct_answer?: number
          created_at?: string | null
          department_id?: string
          id?: string
          options?: Json
          question?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_attempts: {
        Row: {
          created_at: string | null
          department_id: string | null
          id: string
          next_attempt_at: string | null
          passed: boolean | null
          score: number
          total_questions: number
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          department_id?: string | null
          id?: string
          next_attempt_at?: string | null
          passed?: boolean | null
          score: number
          total_questions: number
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          department_id?: string | null
          id?: string
          next_attempt_at?: string | null
          passed?: boolean | null
          score?: number
          total_questions?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          created_at: string | null
          flagged_by: string
          id: string
          message_id: string
          reason: string
          status: string | null
        }
        Insert: {
          created_at?: string | null
          flagged_by: string
          id?: string
          message_id: string
          reason: string
          status?: string | null
        }
        Update: {
          created_at?: string | null
          flagged_by?: string
          id?: string
          message_id?: string
          reason?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_flagged_by_fkey"
            columns: ["flagged_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string | null
          id: string
          rating: number | null
          reviewer_id: string
          session_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          id?: string
          rating?: number | null
          reviewer_id: string
          session_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          id?: string
          rating?: number | null
          reviewer_id?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          amount: number
          client_id: string
          created_at: string | null
          duration: number
          flutterwave_reference: string | null
          id: string
          payment_status: string | null
          paystack_reference: string | null
          scheduled_at: string
          status: Database["public"]["Enums"]["session_status"] | null
          student_id: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          client_id: string
          created_at?: string | null
          duration: number
          flutterwave_reference?: string | null
          id?: string
          payment_status?: string | null
          paystack_reference?: string | null
          scheduled_at: string
          status?: Database["public"]["Enums"]["session_status"] | null
          student_id: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          client_id?: string
          created_at?: string | null
          duration?: number
          flutterwave_reference?: string | null
          id?: string
          payment_status?: string | null
          paystack_reference?: string | null
          scheduled_at?: string
          status?: Database["public"]["Enums"]["session_status"] | null
          student_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sessions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          created_at: string | null
          description: string | null
          id: string
          reference: string | null
          session_id: string | null
          status: Database["public"]["Enums"]["transaction_status"] | null
          type: Database["public"]["Enums"]["transaction_type"]
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          description?: string | null
          id?: string
          reference?: string | null
          session_id?: string | null
          status?: Database["public"]["Enums"]["transaction_status"] | null
          type: Database["public"]["Enums"]["transaction_type"]
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string | null
          id?: string
          reference?: string | null
          session_id?: string | null
          status?: Database["public"]["Enums"]["transaction_status"] | null
          type?: Database["public"]["Enums"]["transaction_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          account_name: string | null
          account_number: string | null
          badge: boolean | null
          bank_code: string | null
          bank_name: string | null
          created_at: string | null
          department_id: string | null
          email: string
          flutterwave_subaccount_id: string | null
          id: string
          is_verified: boolean | null
          jamb_reg: string | null
          name: string
          profile_image: string | null
          quiz_score: number | null
          role: Database["public"]["Enums"]["user_role"]
          status: Database["public"]["Enums"]["user_status"] | null
          updated_at: string | null
          wallet_balance: number | null
        }
        Insert: {
          account_name?: string | null
          account_number?: string | null
          badge?: boolean | null
          bank_code?: string | null
          bank_name?: string | null
          created_at?: string | null
          department_id?: string | null
          email: string
          flutterwave_subaccount_id?: string | null
          id?: string
          is_verified?: boolean | null
          jamb_reg?: string | null
          name: string
          profile_image?: string | null
          quiz_score?: number | null
          role?: Database["public"]["Enums"]["user_role"]
          status?: Database["public"]["Enums"]["user_status"] | null
          updated_at?: string | null
          wallet_balance?: number | null
        }
        Update: {
          account_name?: string | null
          account_number?: string | null
          badge?: boolean | null
          bank_code?: string | null
          bank_name?: string | null
          created_at?: string | null
          department_id?: string | null
          email?: string
          flutterwave_subaccount_id?: string | null
          id?: string
          is_verified?: boolean | null
          jamb_reg?: string | null
          name?: string
          profile_image?: string | null
          quiz_score?: number | null
          role?: Database["public"]["Enums"]["user_role"]
          status?: Database["public"]["Enums"]["user_status"] | null
          updated_at?: string | null
          wallet_balance?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "users_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      wallets: {
        Row: {
          balance: number | null
          created_at: string | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          balance?: number | null
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          balance?: number | null
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      withdrawals: {
        Row: {
          account_name: string
          account_number: string
          amount: number
          bank_code: string
          created_at: string | null
          flutterwave_reference: string | null
          id: string
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          account_name: string
          account_number: string
          amount: number
          bank_code: string
          created_at?: string | null
          flutterwave_reference?: string | null
          id?: string
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          account_name?: string
          account_number?: string
          amount?: number
          bank_code?: string
          created_at?: string | null
          flutterwave_reference?: string | null
          id?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "withdrawals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
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
      session_status: "pending" | "confirmed" | "completed" | "cancelled"
      transaction_status: "pending" | "completed" | "failed"
      transaction_type: "payment" | "withdrawal" | "earning"
      user_role: "student" | "aspirant" | "admin"
      user_status: "active" | "pending" | "blocked" | "banned"
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
      session_status: ["pending", "confirmed", "completed", "cancelled"],
      transaction_status: ["pending", "completed", "failed"],
      transaction_type: ["payment", "withdrawal", "earning"],
      user_role: ["student", "aspirant", "admin"],
      user_status: ["active", "pending", "blocked", "banned"],
    },
  },
} as const
