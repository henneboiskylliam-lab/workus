import { createClient } from '@supabase/supabase-js'

/**
 * Configuration Supabase
 * 
 * Pour configurer votre projet Supabase :
 * 1. Créez un projet sur https://supabase.com
 * 2. Copiez l'URL et la clé anon depuis Project Settings > API
 * 3. Créez un fichier .env à la racine avec :
 *    VITE_SUPABASE_URL=votre_url
 *    VITE_SUPABASE_ANON_KEY=votre_clé_anon
 */

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Vérifier si Supabase est configuré
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey)

// Créer le client Supabase (ou un mock si non configuré)
export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    })
  : null

// Types pour la base de données Supabase
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          email: string
          role: 'user' | 'creator' | 'moderator' | 'admin'
          avatar_url: string | null
          bio: string | null
          is_active: boolean
          is_verified: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          email: string
          role?: 'user' | 'creator' | 'moderator' | 'admin'
          avatar_url?: string | null
          bio?: string | null
          is_active?: boolean
          is_verified?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          username?: string
          email?: string
          role?: 'user' | 'creator' | 'moderator' | 'admin'
          avatar_url?: string | null
          bio?: string | null
          is_active?: boolean
          is_verified?: boolean
          updated_at?: string
        }
      }
      user_data: {
        Row: {
          id: string
          user_id: string
          saved_items: any[]
          liked_items: any[]
          following: any[]
          followers: any[]
          skill_progress: Record<string, any>
          weekly_activity: number[]
          today_activity: number
          last_activity_date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          saved_items?: any[]
          liked_items?: any[]
          following?: any[]
          followers?: any[]
          skill_progress?: Record<string, any>
          weekly_activity?: number[]
          today_activity?: number
          last_activity_date?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          saved_items?: any[]
          liked_items?: any[]
          following?: any[]
          followers?: any[]
          skill_progress?: Record<string, any>
          weekly_activity?: number[]
          today_activity?: number
          last_activity_date?: string
          updated_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string
          message: string
          is_read: boolean
          from_user_id: string | null
          target_id: string | null
          target_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          title: string
          message: string
          is_read?: boolean
          from_user_id?: string | null
          target_id?: string | null
          target_url?: string | null
          created_at?: string
        }
        Update: {
          is_read?: boolean
        }
      }
      posts: {
        Row: {
          id: string
          author_id: string
          content: string
          images: string[]
          tags: string[]
          specialty_id: string | null
          likes: number
          saves: number
          shares: number
          reposts: number
          comments: number
          is_repost: boolean
          original_post_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          author_id: string
          content: string
          images?: string[]
          tags?: string[]
          specialty_id?: string | null
          likes?: number
          saves?: number
          shares?: number
          reposts?: number
          comments?: number
          is_repost?: boolean
          original_post_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          content?: string
          images?: string[]
          tags?: string[]
          likes?: number
          saves?: number
          shares?: number
          reposts?: number
          comments?: number
          updated_at?: string
        }
      }
      activity_logs: {
        Row: {
          id: string
          user_id: string
          type: string
          target_id: string | null
          target_name: string | null
          message: string | null
          metadata: Record<string, any> | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          target_id?: string | null
          target_name?: string | null
          message?: string | null
          metadata?: Record<string, any> | null
          created_at?: string
        }
        Update: never
      }
    }
  }
}

// Flag pour éviter de spammer la console
let hasLoggedSupabaseWarning = false

/**
 * Helper pour vérifier si Supabase est disponible
 * Affiche un warning une seule fois si non configuré
 */
export function checkSupabase() {
  if (!isSupabaseConfigured) {
    if (!hasLoggedSupabaseWarning) {
      console.info('Supabase non configuré. Utilisation du mode local (IndexedDB).')
      hasLoggedSupabaseWarning = true
    }
    return false
  }
  return true
}

// Log initial au chargement du module (une seule fois)
if (!isSupabaseConfigured && !hasLoggedSupabaseWarning) {
  console.info('💾 Mode local activé (IndexedDB) - Supabase non configuré')
  hasLoggedSupabaseWarning = true
}

