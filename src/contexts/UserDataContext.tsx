import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { useAuth } from './AuthContext'
import { userDataDB, statsDB, activityDB, DBUserData, DBUserStats } from '../lib/dbService'
import { getCurrentISODate, getTodayDateString } from '../db'

/**
 * Types pour les données utilisateur
 * 
 * RÈGLE D'OR: Aucune donnée critique en useState seul
 * Toute modification écrit en base ET met à jour le state
 */

export interface SavedItem {
  id: string
  type: string
  savedAt: string
}

export interface LikedItem {
  id: string
  type: string
  likedAt: string
}

export interface FollowingUser {
  id: string
  username: string
  followedAt: string
}

export interface SkillProgress {
  skillId: string
  skillName: string
  progress: number
  level: number
  hoursWorked: number
  exercisesCompleted: number
  lastWorkedAt: string
}

export interface UserData {
  savedItems: SavedItem[]
  likedItems: LikedItem[]
  following: FollowingUser[]
  followers: FollowingUser[]
  skillProgress: Record<string, SkillProgress>
}

export interface UserStats {
  totalHoursLearned: number
  skillsWorkedOn: number
  exercisesCompleted: number
  currentStreak: number
  longestStreak: number
  achievementsUnlocked: number
  totalPosts: number
  totalComments: number
  totalLikesReceived: number
  totalFollowers: number
  totalFollowing: number
}

interface UserDataContextType {
  data: UserData
  stats: UserStats
  isLoading: boolean
  
  // Saved items
  saveItem: (itemId: string, itemType: string) => Promise<void>
  unsaveItem: (itemId: string) => Promise<void>
  isSaved: (itemId: string) => boolean
  
  // Liked items
  likeItem: (itemId: string, itemType: string) => Promise<void>
  unlikeItem: (itemId: string) => Promise<void>
  isLiked: (itemId: string) => boolean
  
  // Following
  followUser: (userId: string, username: string) => Promise<void>
  unfollowUser: (userId: string) => Promise<void>
  isFollowing: (userId: string) => boolean
  
  // Activity
  addActivityTime: (minutes: number) => Promise<void>
  getWeeklyActivity: () => Promise<{ date: string; minutes: number }[]>
  getTodayActivity: () => number
  
  // Skills
  updateSkillProgress: (skillId: string, skillName: string, updates: Partial<SkillProgress>) => Promise<void>
  
  // Refresh
  refreshData: () => Promise<void>
}

// Valeurs par défaut
const defaultData: UserData = {
  savedItems: [],
  likedItems: [],
  following: [],
  followers: [],
  skillProgress: {}
}

const defaultStats: UserStats = {
  totalHoursLearned: 0,
  skillsWorkedOn: 0,
  exercisesCompleted: 0,
  currentStreak: 0,
  longestStreak: 0,
  achievementsUnlocked: 0,
  totalPosts: 0,
  totalComments: 0,
  totalLikesReceived: 0,
  totalFollowers: 0,
  totalFollowing: 0
}

const defaultContextValue: UserDataContextType = {
  data: defaultData,
  stats: defaultStats,
  isLoading: false,
  saveItem: async () => {},
  unsaveItem: async () => {},
  isSaved: () => false,
  likeItem: async () => {},
  unlikeItem: async () => {},
  isLiked: () => false,
  followUser: async () => {},
  unfollowUser: async () => {},
  isFollowing: () => false,
  addActivityTime: async () => {},
  getWeeklyActivity: async () => [],
  getTodayActivity: () => 0,
  updateSkillProgress: async () => {},
  refreshData: async () => {}
}

const UserDataContext = createContext<UserDataContextType>(defaultContextValue)

interface UserDataProviderProps {
  children: ReactNode
}

/**
 * Convertit les données DB vers le format de l'application
 */
function dbToUserData(dbData: DBUserData | null): UserData {
  if (!dbData) return defaultData
  
  return {
    savedItems: (dbData.saved_items || []).map(i => ({
      id: i.id,
      type: i.type,
      savedAt: i.saved_at
    })),
    likedItems: (dbData.liked_items || []).map(i => ({
      id: i.id,
      type: i.type,
      likedAt: i.liked_at
    })),
    following: (dbData.following || []).map(f => ({
      id: f.id,
      username: f.username,
      followedAt: f.followed_at
    })),
    followers: (dbData.followers || []).map(f => ({
      id: f.id,
      username: f.username,
      followedAt: f.followed_at
    })),
    skillProgress: Object.fromEntries(
      Object.entries(dbData.skill_progress || {}).map(([k, v]) => [k, {
        skillId: v.skill_id,
        skillName: v.skill_name,
        progress: v.progress,
        level: v.level,
        hoursWorked: v.hours_worked,
        exercisesCompleted: v.exercises_completed,
        lastWorkedAt: v.last_worked_at
      }])
    )
  }
}

/**
 * Convertit les stats DB vers le format de l'application
 */
function dbToStats(dbStats: DBUserStats | null): UserStats {
  if (!dbStats) return defaultStats
  
  return {
    totalHoursLearned: dbStats.total_hours_learned,
    skillsWorkedOn: dbStats.skills_worked_on,
    exercisesCompleted: dbStats.exercises_completed,
    currentStreak: dbStats.current_streak,
    longestStreak: dbStats.longest_streak,
    achievementsUnlocked: dbStats.achievements_unlocked,
    totalPosts: dbStats.total_posts,
    totalComments: dbStats.total_comments,
    totalLikesReceived: dbStats.total_likes_received,
    totalFollowers: dbStats.total_followers,
    totalFollowing: dbStats.total_following
  }
}

/**
 * UserDataProvider - Gère les données utilisateur depuis la DB
 */
export function UserDataProvider({ children }: UserDataProviderProps) {
  const { user, isAuthenticated } = useAuth()
  const [data, setData] = useState<UserData>(defaultData)
  const [stats, setStats] = useState<UserStats>(defaultStats)
  const [isLoading, setIsLoading] = useState(false)
  const [todayActivity, setTodayActivity] = useState(0)

  // Charger les données depuis la DB
  useEffect(() => {
    const loadData = async () => {
      if (!isAuthenticated || !user?.id) {
        setData(defaultData)
        setStats(defaultStats)
        return
      }

      setIsLoading(true)
      try {
        // Charger user_data et stats en parallèle
        const [dbUserData, dbStats, todayActivityData] = await Promise.all([
          userDataDB.get(user.id),
          statsDB.get(user.id),
          activityDB.getForDate(user.id, getTodayDateString())
        ])

        setData(dbToUserData(dbUserData))
        setStats(dbToStats(dbStats))
        setTodayActivity(todayActivityData?.minutes_active || 0)
      } catch (error) {
        console.error('Erreur chargement user data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [user?.id, isAuthenticated])

  // Sauvegarder un item
  const saveItem = useCallback(async (itemId: string, itemType: string): Promise<void> => {
    if (!user?.id) return

    try {
      await userDataDB.addSavedItem(user.id, itemId, itemType)
      setData(prev => ({
        ...prev,
        savedItems: [
          ...prev.savedItems,
          { id: itemId, type: itemType, savedAt: getCurrentISODate() }
        ]
      }))
    } catch (error) {
      console.error('Erreur saveItem:', error)
    }
  }, [user?.id])

  // Retirer un item sauvé
  const unsaveItem = useCallback(async (itemId: string): Promise<void> => {
    if (!user?.id) return

    try {
      await userDataDB.removeSavedItem(user.id, itemId)
      setData(prev => ({
        ...prev,
        savedItems: prev.savedItems.filter(i => i.id !== itemId)
      }))
    } catch (error) {
      console.error('Erreur unsaveItem:', error)
    }
  }, [user?.id])

  // Vérifier si un item est sauvé
  const isSaved = useCallback((itemId: string): boolean => {
    return data.savedItems.some(i => i.id === itemId)
  }, [data.savedItems])

  // Liker un item
  const likeItem = useCallback(async (itemId: string, itemType: string): Promise<void> => {
    if (!user?.id) return

    try {
      await userDataDB.addLikedItem(user.id, itemId, itemType)
      setData(prev => ({
        ...prev,
        likedItems: [
          ...prev.likedItems,
          { id: itemId, type: itemType, likedAt: getCurrentISODate() }
        ]
      }))
    } catch (error) {
      console.error('Erreur likeItem:', error)
    }
  }, [user?.id])

  // Unliker un item
  const unlikeItem = useCallback(async (itemId: string): Promise<void> => {
    if (!user?.id) return

    try {
      await userDataDB.removeLikedItem(user.id, itemId)
      setData(prev => ({
        ...prev,
        likedItems: prev.likedItems.filter(i => i.id !== itemId)
      }))
    } catch (error) {
      console.error('Erreur unlikeItem:', error)
    }
  }, [user?.id])

  // Vérifier si un item est liké
  const isLiked = useCallback((itemId: string): boolean => {
    return data.likedItems.some(i => i.id === itemId)
  }, [data.likedItems])

  // Follow un utilisateur
  const followUser = useCallback(async (userId: string, username: string): Promise<void> => {
    if (!user?.id) return

    try {
      await userDataDB.followUser(user.id, userId, username)
      setData(prev => ({
        ...prev,
        following: [
          ...prev.following,
          { id: userId, username, followedAt: getCurrentISODate() }
        ]
      }))
      // Mettre à jour les stats
      await statsDB.increment(user.id, 'total_following')
      setStats(prev => ({ ...prev, totalFollowing: prev.totalFollowing + 1 }))
    } catch (error) {
      console.error('Erreur followUser:', error)
    }
  }, [user?.id])

  // Unfollow un utilisateur
  const unfollowUser = useCallback(async (userId: string): Promise<void> => {
    if (!user?.id) return

    try {
      await userDataDB.unfollowUser(user.id, userId)
      setData(prev => ({
        ...prev,
        following: prev.following.filter(f => f.id !== userId)
      }))
      // Mettre à jour les stats
      await statsDB.increment(user.id, 'total_following', -1)
      setStats(prev => ({ ...prev, totalFollowing: Math.max(0, prev.totalFollowing - 1) }))
    } catch (error) {
      console.error('Erreur unfollowUser:', error)
    }
  }, [user?.id])

  // Vérifier si on suit un utilisateur
  const isFollowing = useCallback((userId: string): boolean => {
    return data.following.some(f => f.id === userId)
  }, [data.following])

  // Ajouter du temps d'activité
  const addActivityTime = useCallback(async (minutes: number): Promise<void> => {
    if (!user?.id) return

    try {
      await activityDB.recordActivity(user.id, minutes)
      setTodayActivity(prev => prev + minutes)
      
      // Mettre à jour les heures totales
      await statsDB.increment(user.id, 'total_hours_learned', minutes / 60)
    } catch (error) {
      console.error('Erreur addActivityTime:', error)
    }
  }, [user?.id])

  // Obtenir l'activité de la semaine
  const getWeeklyActivity = useCallback(async (): Promise<{ date: string; minutes: number }[]> => {
    if (!user?.id) return []

    try {
      const today = new Date()
      const weekAgo = new Date(today)
      weekAgo.setDate(weekAgo.getDate() - 7)
      
      const activities = await activityDB.getRange(
        user.id,
        weekAgo.toISOString().split('T')[0],
        today.toISOString().split('T')[0]
      )
      
      return activities.map(a => ({ date: a.date, minutes: a.minutes_active }))
    } catch (error) {
      console.error('Erreur getWeeklyActivity:', error)
      return []
    }
  }, [user?.id])

  // Obtenir l'activité du jour
  const getTodayActivity = useCallback((): number => {
    return todayActivity
  }, [todayActivity])

  // Mettre à jour le progrès d'une compétence
  const updateSkillProgress = useCallback(async (
    skillId: string, 
    skillName: string, 
    updates: Partial<SkillProgress>
  ): Promise<void> => {
    if (!user?.id) return

    try {
      const currentProgress = data.skillProgress[skillId] || {
        skillId,
        skillName,
        progress: 0,
        level: 1,
        hoursWorked: 0,
        exercisesCompleted: 0,
        lastWorkedAt: getCurrentISODate()
      }

      const newProgress = {
        ...currentProgress,
        ...updates,
        lastWorkedAt: getCurrentISODate()
      }

      // Mettre à jour le state
      setData(prev => ({
        ...prev,
        skillProgress: {
          ...prev.skillProgress,
          [skillId]: newProgress
        }
      }))

      // Sauvegarder en DB
      const currentData = await userDataDB.get(user.id)
      if (currentData) {
        currentData.skill_progress[skillId] = {
          skill_id: newProgress.skillId,
          skill_name: newProgress.skillName,
          progress: newProgress.progress,
          level: newProgress.level,
          hours_worked: newProgress.hoursWorked,
          exercises_completed: newProgress.exercisesCompleted,
          last_worked_at: newProgress.lastWorkedAt
        }
        await userDataDB.save(currentData)
      }

      // Mettre à jour les stats si nécessaire
      if (updates.exercisesCompleted) {
        await statsDB.increment(user.id, 'exercises_completed', updates.exercisesCompleted)
      }
    } catch (error) {
      console.error('Erreur updateSkillProgress:', error)
    }
  }, [user?.id, data.skillProgress])

  // Rafraîchir toutes les données
  const refreshData = useCallback(async (): Promise<void> => {
    if (!user?.id) return

    setIsLoading(true)
    try {
      const [dbUserData, dbStats] = await Promise.all([
        userDataDB.get(user.id),
        statsDB.get(user.id)
      ])

      setData(dbToUserData(dbUserData))
      setStats(dbToStats(dbStats))
    } catch (error) {
      console.error('Erreur refreshData:', error)
    } finally {
      setIsLoading(false)
    }
  }, [user?.id])

  const value: UserDataContextType = {
    data,
    stats,
    isLoading,
    saveItem,
    unsaveItem,
    isSaved,
    likeItem,
    unlikeItem,
    isLiked,
    followUser,
    unfollowUser,
    isFollowing,
    addActivityTime,
    getWeeklyActivity,
    getTodayActivity,
    updateSkillProgress,
    refreshData
  }

  return (
    <UserDataContext.Provider value={value}>
      {children}
    </UserDataContext.Provider>
  )
}

/**
 * Hook pour utiliser les données utilisateur
 */
export function useUserData() {
  const context = useContext(UserDataContext)
  if (!context) {
    return defaultContextValue
  }
  return context
}
