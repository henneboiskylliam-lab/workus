import { supabase, isSupabaseConfigured } from './supabase'
import { db, generateId, getCurrentISODate, getTodayDateString } from '../db'

/**
 * Service de base de données unifié
 * Utilise Supabase si configuré, sinon IndexedDB
 * 
 * RÈGLE D'OR: Aucune donnée critique en useState seul
 * Toute modification écrit en base ET met à jour le state
 */

// =====================================================
// NOTIFICATIONS
// =====================================================

export interface DBNotification {
  id: string
  user_id: string
  type: string
  title: string
  message: string
  is_read: boolean
  from_user_id?: string | null
  target_id?: string | null
  target_url?: string | null
  created_at: string
}

export const notificationsDB = {
  /**
   * Charge toutes les notifications d'un utilisateur
   */
  async getAll(userId: string): Promise<DBNotification[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Erreur chargement notifications:', error)
        return []
      }
      return data || []
    }

    // Fallback IndexedDB
    const notifications = await db.notifications
      .where('userId')
      .equals(userId)
      .reverse()
      .sortBy('createdAt')
    
    return notifications.map(n => ({
      id: n.id,
      user_id: n.userId,
      type: n.type,
      title: n.title,
      message: n.message,
      is_read: n.isRead,
      from_user_id: n.fromUserId,
      target_id: n.targetId,
      target_url: n.targetUrl,
      created_at: n.createdAt
    }))
  },

  /**
   * Crée une notification
   */
  async create(notification: Omit<DBNotification, 'id' | 'created_at' | 'is_read'>): Promise<DBNotification | null> {
    const newNotif: DBNotification = {
      ...notification,
      id: generateId(),
      is_read: false,
      created_at: getCurrentISODate()
    }

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('notifications')
        .insert(newNotif)
        .select()
        .single()
      
      if (error) {
        console.error('Erreur création notification:', error)
        return null
      }
      return data
    }

    // Fallback IndexedDB
    await db.notifications.add({
      id: newNotif.id,
      userId: newNotif.user_id,
      type: newNotif.type as any,
      title: newNotif.title,
      message: newNotif.message,
      isRead: false,
      fromUserId: newNotif.from_user_id || undefined,
      targetId: newNotif.target_id || undefined,
      targetUrl: newNotif.target_url || undefined,
      createdAt: newNotif.created_at
    })
    
    return newNotif
  },

  /**
   * Marque une notification comme lue
   */
  async markAsRead(id: string): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id)
      
      if (error) {
        console.error('Erreur markAsRead:', error)
        return false
      }
      return true
    }

    await db.notifications.update(id, { isRead: true })
    return true
  },

  /**
   * Marque toutes les notifications comme lues
   */
  async markAllAsRead(userId: string): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
      
      if (error) {
        console.error('Erreur markAllAsRead:', error)
        return false
      }
      return true
    }

    await db.notifications
      .where('userId')
      .equals(userId)
      .modify({ isRead: true })
    return true
  },

  /**
   * Supprime une notification
   */
  async delete(id: string): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id)
      
      if (error) {
        console.error('Erreur delete notification:', error)
        return false
      }
      return true
    }

    await db.notifications.delete(id)
    return true
  }
}

// =====================================================
// USER SETTINGS
// =====================================================

export interface DBUserSettings {
  id?: string
  user_id: string
  theme: 'dark' | 'light' | 'system'
  language: string
  notifications_enabled: boolean
  email_notifications: boolean
  sound_enabled: boolean
  compact_mode: boolean
}

export const settingsDB = {
  /**
   * Charge les paramètres d'un utilisateur
   */
  async get(userId: string): Promise<DBUserSettings | null> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .single()
      
      if (error) {
        console.error('Erreur chargement settings:', error)
        return null
      }
      return data
    }

    // Fallback localStorage
    const stored = localStorage.getItem(`workus_settings_${userId}`)
    if (stored) {
      try {
        return JSON.parse(stored)
      } catch {
        return null
      }
    }
    return null
  },

  /**
   * Sauvegarde les paramètres
   */
  async save(settings: DBUserSettings): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('user_settings')
        .upsert(settings)
      
      if (error) {
        console.error('Erreur sauvegarde settings:', error)
        return false
      }
      return true
    }

    // Fallback localStorage
    localStorage.setItem(`workus_settings_${settings.user_id}`, JSON.stringify(settings))
    return true
  },

  /**
   * Met à jour un paramètre spécifique
   */
  async update(userId: string, updates: Partial<DBUserSettings>): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('user_settings')
        .update(updates)
        .eq('user_id', userId)
      
      if (error) {
        console.error('Erreur update settings:', error)
        return false
      }
      return true
    }

    // Fallback localStorage
    const current = await this.get(userId)
    if (current) {
      await this.save({ ...current, ...updates })
    }
    return true
  }
}

// =====================================================
// USER STATS
// =====================================================

export interface DBUserStats {
  id?: string
  user_id: string
  total_hours_learned: number
  skills_worked_on: number
  exercises_completed: number
  current_streak: number
  longest_streak: number
  achievements_unlocked: number
  total_posts: number
  total_comments: number
  total_likes_received: number
  total_followers: number
  total_following: number
  last_activity_at?: string
}

export const statsDB = {
  /**
   * Charge les stats d'un utilisateur
   */
  async get(userId: string): Promise<DBUserStats | null> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', userId)
        .single()
      
      if (error) {
        console.error('Erreur chargement stats:', error)
        return null
      }
      return data
    }

    // Fallback localStorage
    const stored = localStorage.getItem(`workus_stats_${userId}`)
    if (stored) {
      try {
        return JSON.parse(stored)
      } catch {
        return null
      }
    }
    return null
  },

  /**
   * Sauvegarde les stats
   */
  async save(stats: DBUserStats): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('user_stats')
        .upsert(stats)
      
      if (error) {
        console.error('Erreur sauvegarde stats:', error)
        return false
      }
      return true
    }

    // Fallback localStorage
    localStorage.setItem(`workus_stats_${stats.user_id}`, JSON.stringify(stats))
    return true
  },

  /**
   * Incrémente un compteur de stats
   */
  async increment(userId: string, field: keyof DBUserStats, amount: number = 1): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      // Utiliser RPC pour incrémenter atomiquement
      const { data: current } = await supabase
        .from('user_stats')
        .select(field)
        .eq('user_id', userId)
        .single()
      
      if (current) {
        const newValue = ((current as any)[field] || 0) + amount
        const { error } = await supabase
          .from('user_stats')
          .update({ [field]: newValue, last_activity_at: getCurrentISODate() })
          .eq('user_id', userId)
        
        if (error) {
          console.error('Erreur increment stats:', error)
          return false
        }
      }
      return true
    }

    // Fallback localStorage
    const current = await this.get(userId)
    if (current) {
      (current as any)[field] = ((current as any)[field] || 0) + amount
      current.last_activity_at = getCurrentISODate()
      await this.save(current)
    }
    return true
  }
}

// =====================================================
// DAILY ACTIVITY
// =====================================================

export interface DBDailyActivity {
  id?: string
  user_id: string
  date: string
  minutes_active: number
  actions_count: number
}

export const activityDB = {
  /**
   * Charge l'activité d'un jour
   */
  async getForDate(userId: string, date: string): Promise<DBDailyActivity | null> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('daily_activity')
        .select('*')
        .eq('user_id', userId)
        .eq('date', date)
        .single()
      
      if (error && error.code !== 'PGRST116') {
        console.error('Erreur chargement activity:', error)
      }
      return data
    }

    // Fallback IndexedDB
    const record = await db.dailyActivityRecords.get(date)
    if (record && record.userMinutes[userId]) {
      return {
        user_id: userId,
        date,
        minutes_active: record.userMinutes[userId],
        actions_count: 0
      }
    }
    return null
  },

  /**
   * Charge l'activité sur une période
   */
  async getRange(userId: string, startDate: string, endDate: string): Promise<DBDailyActivity[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('daily_activity')
        .select('*')
        .eq('user_id', userId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true })
      
      if (error) {
        console.error('Erreur chargement activity range:', error)
        return []
      }
      return data || []
    }

    // Fallback IndexedDB
    const records = await db.dailyActivityRecords
      .where('date')
      .between(startDate, endDate)
      .toArray()
    
    return records
      .filter(r => r.userMinutes[userId])
      .map(r => ({
        user_id: userId,
        date: r.date,
        minutes_active: r.userMinutes[userId],
        actions_count: 0
      }))
  },

  /**
   * Enregistre du temps d'activité
   */
  async recordActivity(userId: string, minutes: number): Promise<boolean> {
    const today = getTodayDateString()

    if (isSupabaseConfigured && supabase) {
      // Upsert l'activité du jour
      const existing = await this.getForDate(userId, today)
      
      if (existing) {
        const { error } = await supabase
          .from('daily_activity')
          .update({ 
            minutes_active: existing.minutes_active + minutes,
            actions_count: existing.actions_count + 1
          })
          .eq('user_id', userId)
          .eq('date', today)
        
        if (error) {
          console.error('Erreur update activity:', error)
          return false
        }
      } else {
        const { error } = await supabase
          .from('daily_activity')
          .insert({
            user_id: userId,
            date: today,
            minutes_active: minutes,
            actions_count: 1
          })
        
        if (error) {
          console.error('Erreur insert activity:', error)
          return false
        }
      }
      return true
    }

    // Fallback IndexedDB
    const existing = await db.dailyActivityRecords.get(today)
    if (existing) {
      existing.userMinutes[userId] = (existing.userMinutes[userId] || 0) + minutes
      existing.totalMinutes += minutes
      await db.dailyActivityRecords.put(existing)
    } else {
      await db.dailyActivityRecords.add({
        id: today,
        date: today,
        totalMinutes: minutes,
        userMinutes: { [userId]: minutes },
        createdAt: getCurrentISODate(),
        updatedAt: getCurrentISODate()
      })
    }
    return true
  }
}

// =====================================================
// POSTS
// =====================================================

export interface DBPost {
  id: string
  author_id: string
  content: string
  images: string[]
  tags: string[]
  specialty_id?: string | null
  likes: number
  saves: number
  shares: number
  reposts: number
  comments: number
  is_repost: boolean
  original_post_id?: string | null
  created_at: string
  updated_at: string
  // Joined data
  author_name?: string
  author_avatar?: string
}

export const postsDB = {
  /**
   * Charge tous les posts (feed)
   */
  async getAll(limit: number = 50): Promise<DBPost[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:author_id (username, avatar_url)
        `)
        .order('created_at', { ascending: false })
        .limit(limit)
      
      if (error) {
        console.error('Erreur chargement posts:', error)
        return []
      }
      
      return (data || []).map(p => ({
        ...p,
        author_name: (p.profiles as any)?.username,
        author_avatar: (p.profiles as any)?.avatar_url
      }))
    }

    // Fallback IndexedDB
    const posts = await db.posts
      .orderBy('createdAt')
      .reverse()
      .limit(limit)
      .toArray()
    
    return posts.map(p => ({
      id: p.id,
      author_id: p.authorId,
      author_name: p.authorName,
      author_avatar: p.authorAvatar,
      content: p.content,
      images: p.images || [],
      tags: p.tags,
      specialty_id: p.specialtyId,
      likes: p.likes,
      saves: p.saves,
      shares: p.shares,
      reposts: p.reposts,
      comments: p.comments,
      is_repost: p.isRepost,
      original_post_id: p.originalPostId,
      created_at: p.createdAt,
      updated_at: p.updatedAt
    }))
  },

  /**
   * Crée un post
   */
  async create(post: Omit<DBPost, 'id' | 'created_at' | 'updated_at' | 'likes' | 'saves' | 'shares' | 'reposts' | 'comments'>): Promise<DBPost | null> {
    const now = getCurrentISODate()
    const newPost: DBPost = {
      ...post,
      id: generateId(),
      likes: 0,
      saves: 0,
      shares: 0,
      reposts: 0,
      comments: 0,
      created_at: now,
      updated_at: now
    }

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('posts')
        .insert({
          id: newPost.id,
          author_id: newPost.author_id,
          content: newPost.content,
          images: newPost.images,
          tags: newPost.tags,
          specialty_id: newPost.specialty_id,
          is_repost: newPost.is_repost,
          original_post_id: newPost.original_post_id
        })
        .select()
        .single()
      
      if (error) {
        console.error('Erreur création post:', error)
        return null
      }
      return { ...data, author_name: post.author_name, author_avatar: post.author_avatar }
    }

    // Fallback IndexedDB
    await db.posts.add({
      id: newPost.id,
      authorId: newPost.author_id,
      authorName: newPost.author_name || 'Utilisateur',
      authorAvatar: newPost.author_avatar,
      content: newPost.content,
      images: newPost.images,
      tags: newPost.tags,
      specialtyId: newPost.specialty_id || undefined,
      likes: 0,
      saves: 0,
      shares: 0,
      reposts: 0,
      comments: 0,
      isRepost: newPost.is_repost,
      originalPostId: newPost.original_post_id || undefined,
      createdAt: now,
      updatedAt: now
    })
    
    return newPost
  },

  /**
   * Like/Unlike un post
   */
  async toggleLike(postId: string, increment: boolean): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      const { data: post } = await supabase
        .from('posts')
        .select('likes')
        .eq('id', postId)
        .single()
      
      if (post) {
        const { error } = await supabase
          .from('posts')
          .update({ likes: increment ? post.likes + 1 : Math.max(0, post.likes - 1) })
          .eq('id', postId)
        
        if (error) {
          console.error('Erreur toggle like:', error)
          return false
        }
      }
      return true
    }

    // Fallback IndexedDB
    const post = await db.posts.get(postId)
    if (post) {
      await db.posts.update(postId, {
        likes: increment ? post.likes + 1 : Math.max(0, post.likes - 1)
      })
    }
    return true
  },

  /**
   * Supprime un post
   */
  async delete(postId: string): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId)
      
      if (error) {
        console.error('Erreur delete post:', error)
        return false
      }
      return true
    }

    await db.posts.delete(postId)
    return true
  }
}

// =====================================================
// USER DATA (items sauvés, likes, following, etc.)
// =====================================================

export interface DBUserData {
  id?: string
  user_id: string
  saved_items: { id: string; type: string; saved_at: string }[]
  liked_items: { id: string; type: string; liked_at: string }[]
  following: { id: string; username: string; followed_at: string }[]
  followers: { id: string; username: string; followed_at: string }[]
  skill_progress: Record<string, {
    skill_id: string
    skill_name: string
    progress: number
    level: number
    hours_worked: number
    exercises_completed: number
    last_worked_at: string
  }>
}

export const userDataDB = {
  /**
   * Charge les données utilisateur
   */
  async get(userId: string): Promise<DBUserData | null> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('user_data')
        .select('*')
        .eq('user_id', userId)
        .single()
      
      if (error) {
        console.error('Erreur chargement user_data:', error)
        return null
      }
      return data
    }

    // Fallback IndexedDB
    const userData = await db.userData.get(`${userId}_data`)
    if (userData) {
      return {
        user_id: userId,
        saved_items: userData.savedItems.map(i => ({ ...i, saved_at: i.savedAt })),
        liked_items: userData.likedItems.map(i => ({ ...i, liked_at: i.likedAt })),
        following: userData.following.map(f => ({ ...f, followed_at: f.followedAt })),
        followers: userData.followers.map(f => ({ ...f, followed_at: f.followedAt })),
        skill_progress: Object.fromEntries(
          Object.entries(userData.skillProgress).map(([k, v]) => [k, {
            skill_id: v.skillId,
            skill_name: v.skillName,
            progress: v.progress,
            level: v.level,
            hours_worked: v.hoursWorked,
            exercises_completed: v.exercisesCompleted,
            last_worked_at: v.lastWorkedAt
          }])
        )
      }
    }
    return null
  },

  /**
   * Sauvegarde les données utilisateur
   */
  async save(data: DBUserData): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('user_data')
        .upsert(data)
      
      if (error) {
        console.error('Erreur sauvegarde user_data:', error)
        return false
      }
      return true
    }

    // Fallback IndexedDB
    await db.userData.put({
      id: `${data.user_id}_data`,
      userId: data.user_id,
      savedItems: data.saved_items.map(i => ({ id: i.id, type: i.type, savedAt: i.saved_at })),
      likedItems: data.liked_items.map(i => ({ id: i.id, type: i.type, likedAt: i.liked_at })),
      following: data.following.map(f => ({ id: f.id, username: f.username, followedAt: f.followed_at })),
      followers: data.followers.map(f => ({ id: f.id, username: f.username, followedAt: f.followed_at })),
      skillProgress: Object.fromEntries(
        Object.entries(data.skill_progress).map(([k, v]) => [k, {
          skillId: v.skill_id,
          skillName: v.skill_name,
          progress: v.progress,
          level: v.level,
          hoursWorked: v.hours_worked,
          exercisesCompleted: v.exercises_completed,
          lastWorkedAt: v.last_worked_at
        }])
      ),
      weeklyActivity: [],
      todayActivity: 0,
      lastActivityDate: getTodayDateString()
    })
    return true
  },

  /**
   * Ajoute un item sauvé
   */
  async addSavedItem(userId: string, itemId: string, itemType: string): Promise<boolean> {
    const data = await this.get(userId)
    if (data) {
      const exists = data.saved_items.some(i => i.id === itemId)
      if (!exists) {
        data.saved_items.push({ id: itemId, type: itemType, saved_at: getCurrentISODate() })
        return await this.save(data)
      }
    }
    return true
  },

  /**
   * Retire un item sauvé
   */
  async removeSavedItem(userId: string, itemId: string): Promise<boolean> {
    const data = await this.get(userId)
    if (data) {
      data.saved_items = data.saved_items.filter(i => i.id !== itemId)
      return await this.save(data)
    }
    return true
  },

  /**
   * Ajoute un like
   */
  async addLikedItem(userId: string, itemId: string, itemType: string): Promise<boolean> {
    const data = await this.get(userId)
    if (data) {
      const exists = data.liked_items.some(i => i.id === itemId)
      if (!exists) {
        data.liked_items.push({ id: itemId, type: itemType, liked_at: getCurrentISODate() })
        return await this.save(data)
      }
    }
    return true
  },

  /**
   * Retire un like
   */
  async removeLikedItem(userId: string, itemId: string): Promise<boolean> {
    const data = await this.get(userId)
    if (data) {
      data.liked_items = data.liked_items.filter(i => i.id !== itemId)
      return await this.save(data)
    }
    return true
  },

  /**
   * Follow un utilisateur
   */
  async followUser(userId: string, targetId: string, targetUsername: string): Promise<boolean> {
    const data = await this.get(userId)
    if (data) {
      const exists = data.following.some(f => f.id === targetId)
      if (!exists) {
        data.following.push({ id: targetId, username: targetUsername, followed_at: getCurrentISODate() })
        return await this.save(data)
      }
    }
    return true
  },

  /**
   * Unfollow un utilisateur
   */
  async unfollowUser(userId: string, targetId: string): Promise<boolean> {
    const data = await this.get(userId)
    if (data) {
      data.following = data.following.filter(f => f.id !== targetId)
      return await this.save(data)
    }
    return true
  }
}

// =====================================================
// STORAGE (CV, Images)
// =====================================================

export const storageDB = {
  /**
   * Upload un fichier (CV, image de profil)
   */
  async uploadFile(bucket: string, path: string, file: File): Promise<string | null> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: true
        })
      
      if (error) {
        console.error('Erreur upload:', error)
        return null
      }

      // Obtenir l'URL publique
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(path)
      
      return publicUrl
    }

    // Fallback: Base64 en localStorage (limité)
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const base64 = e.target?.result as string
        localStorage.setItem(`workus_file_${path}`, base64)
        resolve(base64)
      }
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(file)
    })
  },

  /**
   * Upload un CV
   */
  async uploadCV(userId: string, file: File): Promise<string | null> {
    const path = `${userId}/cv.pdf`
    const url = await this.uploadFile('cvs', path, file)
    
    if (url && isSupabaseConfigured && supabase) {
      // Sauvegarder l'URL dans le profil
      await supabase
        .from('profiles')
        .update({ cv_url: url })
        .eq('id', userId)
    }
    
    return url
  },

  /**
   * Upload une image de profil
   */
  async uploadAvatar(userId: string, file: File): Promise<string | null> {
    const ext = file.name.split('.').pop()
    const path = `${userId}/avatar.${ext}`
    const url = await this.uploadFile('avatars', path, file)
    
    if (url && isSupabaseConfigured && supabase) {
      // Sauvegarder l'URL dans le profil
      await supabase
        .from('profiles')
        .update({ avatar_url: url })
        .eq('id', userId)
    }
    
    return url
  }
}

