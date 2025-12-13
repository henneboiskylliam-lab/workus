/**
 * Exports centralisés pour la bibliothèque
 */

export { supabase, isSupabaseConfigured, checkSupabase } from './supabase'
export type { Database } from './supabase'

export {
  getCurrentUser,
  loadUserData,
  signIn,
  signUp,
  signOut,
  saveUserData,
  onAuthStateChange
} from './supabaseAuth'
export type { AuthResult } from './supabaseAuth'

