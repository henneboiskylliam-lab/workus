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

export interface DailyActivityRecord {
  date: string // Format: YYYY-MM-DD
  totalMinutes: number
  activeUsers: number
}

export interface UserActivity {
  userId: string
  weeklyTime: number[] // temps en minutes pour chaque jour de la semaine [lun, mar, mer, jeu, ven, sam, dim]
  totalTime: number
  lastActive: string
  loginCount: number
  dailyTime: Record<string, number> // temps par jour { "2024-12-13": 45 }
}

export interface ActivityTimeStats {
  day: { average: number; previous: number; percentage: string; trend: 'up' | 'down' | 'stable' }
  week: { average: number; previous: number; percentage: string; trend: 'up' | 'down' | 'stable' }
  month: { average: number; previous: number; percentage: string; trend: 'up' | 'down' | 'stable' }
  year: { average: number; previous: number; percentage: string; trend: 'up' | 'down' | 'stable' }
}

interface ActivityContextType {
  activities: ActivityEvent[]
  userActivities: Record<string, UserActivity>
  globalActivityHistory: DailyActivityRecord[]
  addActivity: (event: Omit<ActivityEvent, 'id' | 'createdAt'>) => void
  getActivitiesByUser: (userId: string) => ActivityEvent[]
  getRecentActivities: (limit?: number) => ActivityEvent[]
  getUserActivity: (userId: string) => UserActivity | undefined
  updateUserTime: (userId: string, minutes: number) => void
  initUserActivity: (userId: string) => void
  getActivityTimeStats: () => ActivityTimeStats
  recordGlobalActivity: (totalMinutes: number, activeUsers: number) => void
}

const STORAGE_KEY = 'workus_activities'
const USER_ACTIVITY_KEY = 'workus_user_activities'
const GLOBAL_ACTIVITY_KEY = 'workus_global_activity_history'

// Fonction pour obtenir la date d'aujourd'hui au format YYYY-MM-DD
const getTodayDate = (): string => {
  return new Date().toISOString().split('T')[0]
}

// Fonction pour obtenir une date passée
const getPastDate = (daysAgo: number): string => {
  const date = new Date()
  date.setDate(date.getDate() - daysAgo)
  return date.toISOString().split('T')[0]
}

const ActivityContext = createContext<ActivityContextType | undefined>(undefined)

/**
 * ActivityProvider - Gère l'historique des activités utilisateur
 */
export function ActivityProvider({ children }: { children: ReactNode }) {
  const [activities, setActivities] = useState<ActivityEvent[]>([])
  const [userActivities, setUserActivities] = useState<Record<string, UserActivity>>({})
  const [globalActivityHistory, setGlobalActivityHistory] = useState<DailyActivityRecord[]>([])

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

    const storedGlobalActivity = localStorage.getItem(GLOBAL_ACTIVITY_KEY)
    if (storedGlobalActivity) {
      try {
        setGlobalActivityHistory(JSON.parse(storedGlobalActivity))
      } catch {
        setGlobalActivityHistory([])
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

  useEffect(() => {
    localStorage.setItem(GLOBAL_ACTIVITY_KEY, JSON.stringify(globalActivityHistory))
  }, [globalActivityHistory])

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
          loginCount: 1,
          dailyTime: {}
        }
      }
    })
  }, [])

  // Enregistrer l'activité globale quotidienne
  const recordGlobalActivity = useCallback((totalMinutes: number, activeUsers: number) => {
    const today = getTodayDate()
    
    setGlobalActivityHistory(prev => {
      const existingIndex = prev.findIndex(r => r.date === today)
      let newHistory = [...prev]
      
      if (existingIndex >= 0) {
        newHistory[existingIndex] = {
          date: today,
          totalMinutes,
          activeUsers
        }
      } else {
        newHistory.push({
          date: today,
          totalMinutes,
          activeUsers
        })
      }
      
      // Garder seulement les 365 derniers jours
      if (newHistory.length > 365) {
        newHistory = newHistory.slice(-365)
      }
      
      return newHistory
    })
  }, [])

  // Calculer les statistiques de temps d'activité moyen
  const getActivityTimeStats = useCallback((): ActivityTimeStats => {
    const history = globalActivityHistory
    
    // Fonction helper pour calculer l'évolution
    const calculateEvolution = (current: number, previous: number): { percentage: string; trend: 'up' | 'down' | 'stable' } => {
      if (previous === 0) {
        return { 
          percentage: current > 0 ? '+100%' : '0%', 
          trend: current > 0 ? 'up' : 'stable' 
        }
      }
      const evolution = ((current - previous) / previous) * 100
      return {
        percentage: evolution >= 0 ? `+${evolution.toFixed(1)}%` : `${evolution.toFixed(1)}%`,
        trend: evolution > 0 ? 'up' : evolution < 0 ? 'down' : 'stable'
      }
    }
    
    // Fonction pour calculer la moyenne d'activité sur une période
    const getAverageForPeriod = (startDaysAgo: number, endDaysAgo: number): number => {
      let totalMinutes = 0
      let totalUsers = 0
      let daysWithData = 0
      
      for (let i = endDaysAgo; i <= startDaysAgo; i++) {
        const dateStr = getPastDate(i)
        const record = history.find(r => r.date === dateStr)
        if (record && record.activeUsers > 0) {
          totalMinutes += record.totalMinutes
          totalUsers += record.activeUsers
          daysWithData++
        }
      }
      
      if (totalUsers === 0) return 0
      return Math.round(totalMinutes / totalUsers)
    }
    
    // Aujourd'hui
    const todayRecord = history.find(r => r.date === getTodayDate())
    const todayAverage = todayRecord && todayRecord.activeUsers > 0 
      ? Math.round(todayRecord.totalMinutes / todayRecord.activeUsers) 
      : 0
    
    // Hier
    const yesterdayRecord = history.find(r => r.date === getPastDate(1))
    const yesterdayAverage = yesterdayRecord && yesterdayRecord.activeUsers > 0 
      ? Math.round(yesterdayRecord.totalMinutes / yesterdayRecord.activeUsers) 
      : 0
    
    const dayEvolution = calculateEvolution(todayAverage, yesterdayAverage)
    
    // Cette semaine vs Semaine précédente
    const thisWeekAverage = getAverageForPeriod(6, 0)
    const lastWeekAverage = getAverageForPeriod(13, 7)
    const weekEvolution = calculateEvolution(thisWeekAverage, lastWeekAverage)
    
    // Ce mois vs Mois précédent
    const thisMonthAverage = getAverageForPeriod(29, 0)
    const lastMonthAverage = getAverageForPeriod(59, 30)
    const monthEvolution = calculateEvolution(thisMonthAverage, lastMonthAverage)
    
    // Cette année vs Année précédente
    const thisYearAverage = getAverageForPeriod(364, 0)
    const lastYearAverage = getAverageForPeriod(729, 365)
    const yearEvolution = calculateEvolution(thisYearAverage, lastYearAverage)
    
    return {
      day: { average: todayAverage, previous: yesterdayAverage, ...dayEvolution },
      week: { average: thisWeekAverage, previous: lastWeekAverage, ...weekEvolution },
      month: { average: thisMonthAverage, previous: lastMonthAverage, ...monthEvolution },
      year: { average: thisYearAverage, previous: lastYearAverage, ...yearEvolution }
    }
  }, [globalActivityHistory])

  const value: ActivityContextType = {
    activities,
    userActivities,
    globalActivityHistory,
    addActivity,
    getActivitiesByUser,
    getRecentActivities,
    getUserActivity,
    updateUserTime,
    initUserActivity,
    getActivityTimeStats,
    recordGlobalActivity
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
