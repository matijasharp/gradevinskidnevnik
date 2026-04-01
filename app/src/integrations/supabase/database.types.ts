// AUTO-GENERATED — do not edit manually
// Regenerate with: supabase gen types typescript --linked > app/src/integrations/supabase/database.types.ts
// Or via MCP: mcp__supabase__generate_typescript_types

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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      clients: {
        Row: {
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string | null
          id: string
          name: string
          organization_id: string | null
        }
        Insert: {
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string | null
          id?: string
          name: string
          organization_id?: string | null
        }
        Update: {
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string | null
          id?: string
          name?: string
          organization_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      diary_entries: {
        Row: {
          ai_summary: string | null
          client_visible: boolean | null
          created_at: string | null
          created_by: string | null
          created_by_name: string | null
          description: string | null
          entry_date: string
          entry_number: number | null
          hours: number | null
          id: string
          issue_note: string | null
          line_items: Json | null
          materials_used: string | null
          missing_items: string | null
          organization_id: string | null
          pdf_url: string | null
          phase: string | null
          project_id: string | null
          reminder_at: string | null
          reminder_notified: boolean | null
          return_visit_needed: boolean | null
          signature_url: string | null
          signed_by_name: string | null
          signed_by_role: string | null
          status: string | null
          temperature: number | null
          title: string | null
          weather_condition: string | null
          work_date_from: string | null
          work_date_to: string | null
          work_type: string | null
          workers_count: number | null
          zone: string | null
        }
        Insert: {
          ai_summary?: string | null
          client_visible?: boolean | null
          created_at?: string | null
          created_by?: string | null
          created_by_name?: string | null
          description?: string | null
          entry_date: string
          entry_number?: number | null
          hours?: number | null
          id?: string
          issue_note?: string | null
          line_items?: Json | null
          materials_used?: string | null
          missing_items?: string | null
          organization_id?: string | null
          pdf_url?: string | null
          phase?: string | null
          project_id?: string | null
          reminder_at?: string | null
          reminder_notified?: boolean | null
          return_visit_needed?: boolean | null
          signature_url?: string | null
          signed_by_name?: string | null
          signed_by_role?: string | null
          status?: string | null
          temperature?: number | null
          title?: string | null
          weather_condition?: string | null
          work_date_from?: string | null
          work_date_to?: string | null
          work_type?: string | null
          workers_count?: number | null
          zone?: string | null
        }
        Update: {
          ai_summary?: string | null
          client_visible?: boolean | null
          created_at?: string | null
          created_by?: string | null
          created_by_name?: string | null
          description?: string | null
          entry_date?: string
          entry_number?: number | null
          hours?: number | null
          id?: string
          issue_note?: string | null
          line_items?: Json | null
          materials_used?: string | null
          missing_items?: string | null
          organization_id?: string | null
          pdf_url?: string | null
          phase?: string | null
          project_id?: string | null
          reminder_at?: string | null
          reminder_notified?: boolean | null
          return_visit_needed?: boolean | null
          signature_url?: string | null
          signed_by_name?: string | null
          signed_by_role?: string | null
          status?: string | null
          temperature?: number | null
          title?: string | null
          weather_condition?: string | null
          work_date_from?: string | null
          work_date_to?: string | null
          work_type?: string | null
          workers_count?: number | null
          zone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "diary_entries_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diary_entries_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      diary_photos: {
        Row: {
          created_at: string | null
          description: string | null
          entry_id: string | null
          id: string
          organization_id: string | null
          project_id: string | null
          storage_path: string | null
          url: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          entry_id?: string | null
          id?: string
          organization_id?: string | null
          project_id?: string | null
          storage_path?: string | null
          url: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          entry_id?: string | null
          id?: string
          organization_id?: string | null
          project_id?: string | null
          storage_path?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "diary_photos_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "diary_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diary_photos_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diary_photos_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          created_at: string | null
          created_by: string | null
          email: string
          id: string
          name: string | null
          organization_id: string | null
          role: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          email: string
          id?: string
          name?: string | null
          organization_id?: string | null
          role?: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          email?: string
          id?: string
          name?: string | null
          organization_id?: string | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      master_project_issues: {
        Row: {
          created_at: string | null
          description: string | null
          discipline: string | null
          id: string
          master_project_id: string | null
          priority: string
          reported_by: string | null
          status: string
          title: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          discipline?: string | null
          id?: string
          master_project_id?: string | null
          priority?: string
          reported_by?: string | null
          status?: string
          title: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          discipline?: string | null
          id?: string
          master_project_id?: string | null
          priority?: string
          reported_by?: string | null
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "master_project_issues_master_project_id_fkey"
            columns: ["master_project_id"]
            isOneToOne: false
            referencedRelation: "master_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      master_project_organizations: {
        Row: {
          created_at: string | null
          discipline: string
          id: string
          linked_project_id: string | null
          master_project_id: string | null
          organization_id: string | null
          role: string
        }
        Insert: {
          created_at?: string | null
          discipline: string
          id?: string
          linked_project_id?: string | null
          master_project_id?: string | null
          organization_id?: string | null
          role?: string
        }
        Update: {
          created_at?: string | null
          discipline?: string
          id?: string
          linked_project_id?: string | null
          master_project_id?: string | null
          organization_id?: string | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "master_project_organizations_linked_project_id_fkey"
            columns: ["linked_project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "master_project_organizations_master_project_id_fkey"
            columns: ["master_project_id"]
            isOneToOne: false
            referencedRelation: "master_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "master_project_organizations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      master_projects: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          location: string | null
          name: string
          owner_organization_id: string | null
          status: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          location?: string | null
          name: string
          owner_organization_id?: string | null
          status?: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          location?: string | null
          name?: string
          owner_organization_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "master_projects_owner_organization_id_fkey"
            columns: ["owner_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string | null
          id: string
          organization_id: string | null
          role: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          organization_id?: string | null
          role?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          organization_id?: string | null
          role?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          address: string | null
          brand_color: string | null
          city: string | null
          created_at: string | null
          discipline: string
          email: string | null
          id: string
          logo_url: string | null
          name: string
          owner_email: string | null
          owner_user_id: string | null
          phone: string | null
          street: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          brand_color?: string | null
          city?: string | null
          created_at?: string | null
          discipline?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          name: string
          owner_email?: string | null
          owner_user_id?: string | null
          phone?: string | null
          street?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          brand_color?: string | null
          city?: string | null
          created_at?: string | null
          discipline?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          owner_email?: string | null
          owner_user_id?: string | null
          phone?: string | null
          street?: string | null
          website?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          google_tokens: Json | null
          id: string
          invited: boolean | null
          is_super_admin: boolean
          name: string | null
          organization_id: string | null
          role: string | null
          status: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          google_tokens?: Json | null
          id: string
          invited?: boolean | null
          is_super_admin?: boolean
          name?: string | null
          organization_id?: string | null
          role?: string | null
          status?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          google_tokens?: Json | null
          id?: string
          invited?: boolean | null
          is_super_admin?: boolean
          name?: string | null
          organization_id?: string | null
          role?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      project_documents: {
        Row: {
          created_at: string | null
          file_path: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          name: string
          organization_id: string
          project_id: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string | null
          file_path: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          name: string
          organization_id: string
          project_id: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string | null
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          name?: string
          organization_id?: string
          project_id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_documents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      project_invitations: {
        Row: {
          created_at: string | null
          created_by: string | null
          email: string
          id: string
          name: string | null
          project_id: string | null
          role: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          email: string
          id?: string
          name?: string | null
          project_id?: string | null
          role?: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          email?: string
          id?: string
          name?: string | null
          project_id?: string | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_invitations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_members: {
        Row: {
          created_at: string | null
          id: string
          invited_by: string | null
          project_id: string | null
          role: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          invited_by?: string | null
          project_id?: string | null
          role?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          invited_by?: string | null
          project_id?: string | null
          role?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_members_user_id_profiles_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      project_phases: {
        Row: {
          created_at: string | null
          end_date: string | null
          id: string
          name: string
          order_index: number | null
          project_id: string | null
          start_date: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          end_date?: string | null
          id?: string
          name: string
          order_index?: number | null
          project_id?: string | null
          start_date?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          end_date?: string | null
          id?: string
          name?: string
          order_index?: number | null
          project_id?: string | null
          start_date?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_phases_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_tasks: {
        Row: {
          assigned_to: string | null
          created_at: string | null
          created_by: string | null
          done: boolean
          id: string
          project_id: string
          title: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string | null
          created_by?: string | null
          done?: boolean
          id?: string
          project_id: string
          title: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string | null
          created_by?: string | null
          done?: boolean
          id?: string
          project_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          city: string | null
          client_id: string | null
          client_name: string | null
          created_at: string | null
          discipline: string | null
          id: string
          notes: string | null
          object_type: string | null
          organization_id: string | null
          owner_company_id: string | null
          parent_project_id: string | null
          phase: string | null
          project_name: string
          project_type: string | null
          start_date: string | null
          status: string | null
          street: string | null
          visibility: string | null
        }
        Insert: {
          city?: string | null
          client_id?: string | null
          client_name?: string | null
          created_at?: string | null
          discipline?: string | null
          id?: string
          notes?: string | null
          object_type?: string | null
          organization_id?: string | null
          owner_company_id?: string | null
          parent_project_id?: string | null
          phase?: string | null
          project_name: string
          project_type?: string | null
          start_date?: string | null
          status?: string | null
          street?: string | null
          visibility?: string | null
        }
        Update: {
          city?: string | null
          client_id?: string | null
          client_name?: string | null
          created_at?: string | null
          discipline?: string | null
          id?: string
          notes?: string | null
          object_type?: string | null
          organization_id?: string | null
          owner_company_id?: string | null
          parent_project_id?: string | null
          phase?: string | null
          project_name?: string
          project_type?: string | null
          start_date?: string | null
          status?: string | null
          street?: string | null
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_owner_company_id_fkey"
            columns: ["owner_company_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_parent_project_id_fkey"
            columns: ["parent_project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_my_org_project_ids: { Args: never; Returns: string[] }
      get_my_organization_ids: { Args: never; Returns: string[] }
      get_my_owned_org_ids: { Args: never; Returns: string[] }
      get_my_project_ids: { Args: never; Returns: string[] }
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
