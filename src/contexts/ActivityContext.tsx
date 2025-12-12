import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'

/**
 * Types pour l'activité utilisateur
 */
export interface ActivityEvent {
  id: string
  userId: string
  userName: string
  type: 'level_up' | 'discussion_started' | 'discussion_created' | 'content_created' | 'role_promoted' | 'formation_purchased' | 'message_sent' | 'post_created' | 'login' | 'profile_updated' | 'user_followed' | 'report_submitted'
  message: string
  description?: string
  targetId?: string
  targetName?: string
  metadata?: Record<string, any>
  createdAt: string
}

export interface UserActivity {
  userId: string
  weeklyTime: number[] // temps en minutes pour chaque jour de la semaine [lun, mar, mer, jeu, ven, sam, dim]
  totalTime: number
  lastActive: string
  loginCount: number
}

interface ActivityContextType {
  activities: ActivityEvent[]
  userActivities: Record<string, UserActivity>
  addActivity: (event: Omit<ActivityEvent, 'id' | 'createdAt'>) => void
  getActivitiesByUser: (userId: string) => ActivityEvent[]
  getRecentActivities: (limit?: number) => ActivityEvent[]
  getUserActivity: (userId: string) => UserActivity | undefined
  updateUserTime: (userId: string, minutes: number) => void
  initUserActivity: (userId: string) => void
}

const STORAGE_KEY = 'workus_activities'
const USER_ACTIVITY_KEY = 'workus_user_activities'

const ActivityContext = createContext<ActivityContextType | undefined>(undefined)

/**
 * ActivityProvider - Gère l'historique des activités utilisateur
 */
export function ActivityProvider({ children }: { children: ReactNode }) {
  const [activities, setActivities] = useState<ActivityEvent[]>([])
  const [userActivities, setUserActivities] = useState<Record<string, UserActivity>>({})

  // Charger les données au démarrage
  useEffect(() => {
    const storedActivities = localStorage.getItem(STORAGE_KEY)
    if (storedActivities) {
      try {
        setActivities(JSON.parse(storedActivities))
      } catch {
        setActivities([])
      }
    }

    const storedUserActivities = localStorage.getItem(USER_ACTIVITY_KEY)
    if (storedUserActivities) {
      try {
        setUserActivities(JSON.parse(storedUserActivities))
      } catch {
        setUserActivities({})
      }
    }
  }, [])

  // Sauvegarder automatiquement
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(activities))
  }, [activities])

  useEffect(() => {
    localStorage.setItem(USER_ACTIVITY_KEY, JSON.stringify(userActivities))
  }, [userActivities])

  // Ajouter une activité
  const addActivity = useCallback((event: Omit<ActivityEvent, 'id' | 'createdAt'>) => {
    const newEvent: ActivityEvent = {
      ...event,
      id: `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString()
    }
    setActivities(prev => [newEvent, ...prev])
  }, [])

  // Obtenir les activités d'un utilisateur
  const getActivitiesByUser = useCallback((userId: string) => {
    return activities.filter(a => a.userId === userId)
  }, [activities])

  // Obtenir les activités récentes
  const getRecentActivities = useCallback((limit: number = 10) => {
    return activities.slice(0, limit)
  }, [activities])

  // Obtenir l'activité d'un utilisateur
  const getUserActivity = useCallback((userId: string) => {
    return userActivities[userId]
  }, [userActivities])

  // Mettre à jour le temps d'un utilisateur
  const updateUserTime = useCallback((userId: string, minutes: number) => {
    setUserActivities(prev => {
      const current = prev[userId] || {
        userId,
        weeklyTime: [0, 0, 0, 0, 0, 0, 0],
        totalTime: 0,
        lastActive: new Date().toISOString(),
        loginCount: 0
      }
      
      const dayOfWeek = new Date().getDay()
      const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1 // Lundi = 0
      const newWeeklyTime = [...current.weeklyTime]
      newWeeklyTime[adjustedDay] += minutes
      
      return {
        ...prev,
        [userId]: {
          ...current,
          weeklyTime: newWeeklyTime,
          totalTime: current.totalTime + minutes,
          lastActive: new Date().toISOString()
        }
      }
    })
  }, [])

  // Initialiser l'activité d'un nouvel utilisateur
  const initUserActivity = useCallback((userId: string) => {
    setUserActivities(prev => {
      if (prev[userId]) {
        return {
          ...prev,
          [userId]: {
            ...prev[userId],
            loginCount: prev[userId].loginCount + 1,
            lastActive: new Date().toISOString()
          }
        }
      }
      
      return {
        ...prev,
        [userId]: {
          userId,
          weeklyTime: [0, 0, 0, 0, 0, 0, 0],
          totalTime: 0,
          lastActive: new Date().toISOString(),
          loginCount: 1
        }
      }
    })
  }, [])

  const value: ActivityContextType = {
    activities,
    userActivities,
    addActivity,
    getActivitiesByUser,
    getRecentActivities,
    getUserActivity,
    updateUserTime,
    initUserActivity
  }

  return (
    <ActivityContext.Provider value={value}>
      {children}
    </ActivityContext.Provider>
  )
}

/**
 * Hook pour utiliser le contexte d'activité
 */
export function useActivity() {
  const context = useContext(ActivityContext)
  if (context === undefined) {
    throw new Error('useActivity must be used within an ActivityProvider')
  }
  return context
}
