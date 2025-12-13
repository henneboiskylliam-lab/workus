import { supabase, isSupabaseConfigured, checkSupabase } from './supabase'
import { db, userService, generateId, getCurrentISODate } from '../db'
import type { AuthUser, UserRole } from '../types'
import type { User, Session, AuthError } from '@supabase/supabase-js'

/**
 * Service d'authentification Supabase
 * Gère l'authentification et la synchronisation des données utilisateur
 */

export interface AuthResult {
  success: boolean
  user?: AuthUser
  error?: string
}

/**
 * Convertit un utilisateur Supabase en AuthUser
 */
function supabaseUserToAuthUser(user: User, profile?: any): AuthUser {
  return {
    id: user.id,
    email: user.email || '',
    username: profile?.username || user.email?.split('@')[0] || 'user',
    role: (profile?.role || 'user') as UserRole,
    isActive: profile?.is_active ?? true,
    isVerified: user.email_confirmed_at ? true : false,
    createdAt: user.created_at,
    lastLoginAt: new Date().toISOString(),
    avatar: profile?.avatar_url,
    bio: profile?.bio
  }
}

/**
 * Récupère le rôle d'un utilisateur depuis localStorage
 * Priorité : workus_registered_users > workus_public_users > rôle par défaut
 */
function getRoleFromStorage(userId: string, email: string, defaultRole: UserRole): UserRole {
  try {
    // 1. Chercher dans workus_registered_users
    const registeredUsers = localStorage.getItem('workus_registered_users')
    if (registeredUsers) {
      const users = JSON.parse(registeredUsers)
      const found = users.find((u: any) => u.id === userId || u.email === email)
      if (found?.role) {
        return found.role as UserRole
      }
    }
    
    // 2. Chercher dans workus_public_users
    const publicUsers = localStorage.getItem('workus_public_users')
    if (publicUsers) {
      const users = JSON.parse(publicUsers)
      const found = users.find((u: any) => u.id === userId)
      if (found?.role) {
        return found.role as UserRole
      }
    }
  } catch {
    // Ignorer
  }
  
  return defaultRole
}

/**
 * Synchronise un utilisateur avec la liste publique
 * Cette liste permet aux autres utilisateurs de voir les profils
 */
function syncUserToPublicList(authUser: AuthUser): void {
  try {
    const publicUsersKey = 'workus_public_users'
    const existingData = localStorage.getItem(publicUsersKey)
    let users: any[] = []
    
    if (existingData) {
      users = JSON.parse(existingData)
    }
    
    // Chercher si l'utilisateur existe déjà
    const existingIndex = users.findIndex((u: any) => u.id === authUser.id)
    
    const publicUserData = {
      id: authUser.id,
      username: authUser.username,
      role: authUser.role,
      avatar: authUser.avatar,
      bio: authUser.bio,
      joinedAt: authUser.createdAt
    }
    
    if (existingIndex >= 0) {
      // Mettre à jour
      users[existingIndex] = { ...users[existingIndex], ...publicUserData }
    } else {
      // Ajouter
      users.push(publicUserData)
    }
    
    localStorage.setItem(publicUsersKey, JSON.stringify(users))
  } catch (error) {
    console.error('Erreur sync public user:', error)
  }
}

/**
 * Récupère l'utilisateur actuellement connecté
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  if (!checkSupabase() || !supabase) {
    // Mode local - récupérer depuis localStorage
    const stored = localStorage.getItem('workus_user')
    if (stored) {
      try {
        return JSON.parse(stored)
      } catch {
        return null
      }
    }
    return null
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return null
    }

    // Récupérer le profil depuis Supabase
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    return supabaseUserToAuthUser(user, profile)
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur:', error)
    return null
  }
}

/**
 * Récupère toutes les données liées à l'utilisateur
 */
export async function loadUserData(userId: string): Promise<{
  profile: any
  userData: any
  notifications: any[]
  posts: any[]
  activities: any[]
}> {
  const result = {
    profile: null,
    userData: null,
    notifications: [] as any[],
    posts: [] as any[],
    activities: [] as any[]
  }

  if (!checkSupabase() || !supabase) {
    // Mode local - charger depuis IndexedDB
    try {
      const user = await db.users.get(userId)
      const userData = await db.userData.get(`${userId}_data`)
      const notifications = await db.notifications.where('userId').equals(userId).toArray()
      const posts = await db.posts.where('authorId').equals(userId).toArray()
      const activities = await db.activityEvents.where('userId').equals(userId).toArray()

      return {
        profile: user,
        userData: userData,
        notifications,
        posts,
        activities
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données locales:', error)
      return result
    }
  }

  try {
    // Charger toutes les données en parallèle depuis Supabase
    const [profileRes, userDataRes, notificationsRes, postsRes, activitiesRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase.from('user_data').select('*').eq('user_id', userId).single(),
      supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      supabase.from('posts').select('*').eq('author_id', userId).order('created_at', { ascending: false }),
      supabase.from('activity_logs').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(100)
    ])

    result.profile = profileRes.data
    result.userData = userDataRes.data
    result.notifications = notificationsRes.data || []
    result.posts = postsRes.data || []
    result.activities = activitiesRes.data || []

    // Synchroniser avec IndexedDB pour le mode hors-ligne
    await syncToLocalDB(userId, result)

  } catch (error) {
    console.error('Erreur lors du chargement des données Supabase:', error)
  }

  return result
}

/**
 * Synchronise les données Supabase vers IndexedDB
 */
async function syncToLocalDB(userId: string, data: any) {
  try {
    // Synchroniser le profil
    if (data.profile) {
      const existingUser = await db.users.get(userId)
      if (existingUser) {
        await db.users.update(userId, {
          username: data.profile.username,
          email: data.profile.email,
          role: data.profile.role,
          avatar: data.profile.avatar_url,
          bio: data.profile.bio,
          isActive: data.profile.is_active,
          isVerified: data.profile.is_verified
        })
      } else {
        await db.users.add({
          id: userId,
          username: data.profile.username,
          email: data.profile.email,
          role: data.profile.role,
          avatar: data.profile.avatar_url,
          bio: data.profile.bio,
          isActive: data.profile.is_active,
          isVerified: data.profile.is_verified,
          joinedAt: data.profile.created_at,
          lastLoginAt: getCurrentISODate(),
          skills: [],
          followers: 0,
          following: 0,
          savedContent: []
        })
      }
    }

    // Synchroniser les données utilisateur
    if (data.userData) {
      await db.userData.put({
        id: `${userId}_data`,
        userId,
        savedItems: data.userData.saved_items || [],
        likedItems: data.userData.liked_items || [],
        following: data.userData.following || [],
        followers: data.userData.followers || [],
        skillProgress: data.userData.skill_progress || {},
        weeklyActivity: data.userData.weekly_activity || [],
        todayActivity: data.userData.today_activity || 0,
        lastActivityDate: data.userData.last_activity_date || getCurrentISODate()
      })
    }

    console.log('Données synchronisées avec IndexedDB')
  } catch (error) {
    console.error('Erreur lors de la synchronisation locale:', error)
  }
}

/**
 * Connexion avec email et mot de passe
 */
export async function signIn(email: string, password: string): Promise<AuthResult> {
  if (!checkSupabase() || !supabase) {
    // Mode local - utiliser IndexedDB
    try {
      const user = await userService.authenticate(email, password)
      if (user) {
        // Récupérer le rôle depuis localStorage (priorité aux modifications admin)
        const finalRole = getRoleFromStorage(user.id, user.email, user.role as UserRole)
        
        const authUser: AuthUser = {
          id: user.id,
          email: user.email,
          username: user.username,
          role: finalRole, // Utiliser le rôle de localStorage si modifié
          isActive: user.isActive,
          isVerified: user.isVerified,
          createdAt: user.joinedAt,
          lastLoginAt: new Date().toISOString(),
          avatar: user.avatar || undefined,
          bio: user.bio
        }
        localStorage.setItem('workus_user', JSON.stringify(authUser))
        // Synchroniser avec la liste publique
        syncUserToPublicList(authUser)
        return { success: true, user: authUser }
      }
      return { success: false, error: 'Email ou mot de passe incorrect' }
    } catch (error) {
      return { success: false, error: 'Erreur de connexion' }
    }
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      return { success: false, error: error.message }
    }

    if (data.user) {
      // Charger le profil
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single()

      const authUser = supabaseUserToAuthUser(data.user, profile)
      
      // Charger toutes les données utilisateur
      await loadUserData(data.user.id)
      
      // Stocker en local pour persistence
      localStorage.setItem('workus_user', JSON.stringify(authUser))
      // Synchroniser avec la liste publique
      syncUserToPublicList(authUser)
      
      return { success: true, user: authUser }
    }

    return { success: false, error: 'Connexion échouée' }
  } catch (error) {
    console.error('Erreur de connexion:', error)
    return { success: false, error: 'Erreur de connexion' }
  }
}

/**
 * Inscription avec email et mot de passe
 */
export async function signUp(username: string, email: string, password: string): Promise<AuthResult> {
  if (!checkSupabase() || !supabase) {
    // Mode local - utiliser IndexedDB
    try {
      const existingEmail = await userService.getByEmail(email)
      if (existingEmail) {
        return { success: false, error: 'Cet email est déjà utilisé' }
      }

      const existingUsername = await userService.getByUsername(username)
      if (existingUsername) {
        return { success: false, error: 'Ce nom d\'utilisateur est déjà pris' }
      }

      const newUser = await userService.create({
        email,
        username,
        password,
        role: 'user',
        isActive: true,
        isVerified: false,
        avatar: null,
        bio: '',
        skills: []
      })

      const authUser: AuthUser = {
        id: newUser.id,
        email: newUser.email,
        username: newUser.username,
        role: newUser.role as UserRole,
        isActive: newUser.isActive,
        isVerified: newUser.isVerified,
        createdAt: newUser.joinedAt,
        lastLoginAt: new Date().toISOString()
      }

      localStorage.setItem('workus_user', JSON.stringify(authUser))
      // Synchroniser avec la liste publique
      syncUserToPublicList(authUser)
      return { success: true, user: authUser }
    } catch (error) {
      return { success: false, error: 'Erreur lors de l\'inscription' }
    }
  }

  try {
    // Vérifier si le username existe déjà
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', username)
      .single()

    if (existingProfile) {
      return { success: false, error: 'Ce nom d\'utilisateur est déjà pris' }
    }

    // Créer le compte
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username
        }
      }
    })

    if (error) {
      return { success: false, error: error.message }
    }

    if (data.user) {
      // Créer le profil
      await supabase.from('profiles').insert({
        id: data.user.id,
        username,
        email,
        role: 'user',
        is_active: true,
        is_verified: false
      })

      // Créer les données utilisateur initiales
      await supabase.from('user_data').insert({
        user_id: data.user.id,
        saved_items: [],
        liked_items: [],
        following: [],
        followers: [],
        skill_progress: {},
        weekly_activity: [0, 0, 0, 0, 0, 0, 0],
        today_activity: 0,
        last_activity_date: new Date().toISOString().split('T')[0]
      })

      const authUser = supabaseUserToAuthUser(data.user, { username, role: 'user' })
      
      // Synchroniser avec IndexedDB
      await loadUserData(data.user.id)
      
      localStorage.setItem('workus_user', JSON.stringify(authUser))
      // Synchroniser avec la liste publique
      syncUserToPublicList(authUser)
      
      return { success: true, user: authUser }
    }

    return { success: false, error: 'Inscription échouée' }
  } catch (error) {
    console.error('Erreur d\'inscription:', error)
    return { success: false, error: 'Erreur lors de l\'inscription' }
  }
}

/**
 * Déconnexion
 */
export async function signOut(): Promise<void> {
  localStorage.removeItem('workus_user')
  
  if (checkSupabase() && supabase) {
    await supabase.auth.signOut()
  }
}

/**
 * Sauvegarde les données utilisateur vers Supabase
 */
export async function saveUserData(userId: string, data: {
  savedItems?: any[]
  likedItems?: any[]
  following?: any[]
  followers?: any[]
  skillProgress?: Record<string, any>
  weeklyActivity?: number[]
  todayActivity?: number
  lastActivityDate?: string
}): Promise<boolean> {
  // Toujours sauvegarder en local d'abord
  try {
    const existing = await db.userData.get(`${userId}_data`)
    if (existing) {
      await db.userData.update(`${userId}_data`, {
        ...data,
        savedItems: data.savedItems || existing.savedItems,
        likedItems: data.likedItems || existing.likedItems,
        following: data.following || existing.following,
        followers: data.followers || existing.followers,
        skillProgress: data.skillProgress || existing.skillProgress,
        weeklyActivity: data.weeklyActivity || existing.weeklyActivity,
        todayActivity: data.todayActivity ?? existing.todayActivity,
        lastActivityDate: data.lastActivityDate || existing.lastActivityDate
      })
    } else {
      await db.userData.add({
        id: `${userId}_data`,
        userId,
        savedItems: data.savedItems || [],
        likedItems: data.likedItems || [],
        following: data.following || [],
        followers: data.followers || [],
        skillProgress: data.skillProgress || {},
        weeklyActivity: data.weeklyActivity || [0, 0, 0, 0, 0, 0, 0],
        todayActivity: data.todayActivity || 0,
        lastActivityDate: data.lastActivityDate || getCurrentISODate()
      })
    }
  } catch (error) {
    console.error('Erreur lors de la sauvegarde locale:', error)
  }

  // Sauvegarder sur Supabase si configuré
  if (checkSupabase() && supabase) {
    try {
      const updateData: any = {}
      if (data.savedItems !== undefined) updateData.saved_items = data.savedItems
      if (data.likedItems !== undefined) updateData.liked_items = data.likedItems
      if (data.following !== undefined) updateData.following = data.following
      if (data.followers !== undefined) updateData.followers = data.followers
      if (data.skillProgress !== undefined) updateData.skill_progress = data.skillProgress
      if (data.weeklyActivity !== undefined) updateData.weekly_activity = data.weeklyActivity
      if (data.todayActivity !== undefined) updateData.today_activity = data.todayActivity
      if (data.lastActivityDate !== undefined) updateData.last_activity_date = data.lastActivityDate
      updateData.updated_at = new Date().toISOString()

      const { error } = await supabase
        .from('user_data')
        .update(updateData)
        .eq('user_id', userId)

      if (error) {
        console.error('Erreur Supabase:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Erreur lors de la sauvegarde Supabase:', error)
      return false
    }
  }

  return true
}

/**
 * Écoute les changements d'état d'authentification
 */
export function onAuthStateChange(callback: (user: AuthUser | null) => void): () => void {
  if (!checkSupabase() || !supabase) {
    // Mode local - pas de listener
    return () => {}
  }

  const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session?.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      const authUser = supabaseUserToAuthUser(session.user, profile)
      
      // Charger toutes les données
      await loadUserData(session.user.id)
      
      localStorage.setItem('workus_user', JSON.stringify(authUser))
      // Synchroniser avec la liste publique
      syncUserToPublicList(authUser)
      callback(authUser)
    } else if (event === 'SIGNED_OUT') {
      localStorage.removeItem('workus_user')
      callback(null)
    }
  })

  return () => subscription.unsubscribe()
}

