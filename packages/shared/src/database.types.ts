export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string
          name: string
          slug: string
          domain: string | null
          description: string | null
          website_url: string | null
          is_verified: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          domain?: string | null
          description?: string | null
          website_url?: string | null
          is_verified?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          domain?: string | null
          description?: string | null
          website_url?: string | null
          is_verified?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      logos: {
        Row: {
          id: string
          company_id: string
          format: string
          variant: string
          variant_type: string
          color_mode: string
          storage_path: string
          width: number | null
          height: number | null
          file_size: number | null
          created_at: string
        }
        Insert: {
          id?: string
          company_id: string
          format: string
          variant?: string
          variant_type?: string
          color_mode?: string
          storage_path: string
          width?: number | null
          height?: number | null
          file_size?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          format?: string
          variant?: string
          variant_type?: string
          color_mode?: string
          storage_path?: string
          width?: number | null
          height?: number | null
          file_size?: number | null
          created_at?: string
        }
      }
      brand_kits: {
        Row: {
          id: string
          company_id: string
          primary_color: string | null
          secondary_colors: Json | null
          fonts: Json | null
          guidelines_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          company_id: string
          primary_color?: string | null
          secondary_colors?: Json | null
          fonts?: Json | null
          guidelines_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          primary_color?: string | null
          secondary_colors?: Json | null
          fonts?: Json | null
          guidelines_url?: string | null
          created_at?: string
        }
      }
      submissions: {
        Row: {
          id: string
          user_id: string
          company_name: string
          company_domain: string | null
          status: string
          admin_notes: string | null
          reviewed_by: string | null
          reviewed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          company_name: string
          company_domain?: string | null
          status?: string
          admin_notes?: string | null
          reviewed_by?: string | null
          reviewed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          company_name?: string
          company_domain?: string | null
          status?: string
          admin_notes?: string | null
          reviewed_by?: string | null
          reviewed_at?: string | null
          created_at?: string
        }
      }
      submission_files: {
        Row: {
          id: string
          submission_id: string
          storage_path: string
          format: string | null
          variant: string | null
          variant_type: string
          color_mode: string
          created_at: string
        }
        Insert: {
          id?: string
          submission_id: string
          storage_path: string
          format?: string | null
          variant?: string | null
          variant_type?: string
          color_mode?: string
          created_at?: string
        }
        Update: {
          id?: string
          submission_id?: string
          storage_path?: string
          format?: string | null
          variant?: string | null
          variant_type?: string
          color_mode?: string
          created_at?: string
        }
      }
      api_keys: {
        Row: {
          id: string
          user_id: string
          key_hash: string
          key_prefix: string | null
          name: string | null
          is_active: boolean
          request_count: number
          last_used_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          key_hash: string
          key_prefix?: string | null
          name?: string | null
          is_active?: boolean
          request_count?: number
          last_used_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          key_hash?: string
          key_prefix?: string | null
          name?: string | null
          is_active?: boolean
          request_count?: number
          last_used_at?: string | null
          created_at?: string
        }
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
  }
}
