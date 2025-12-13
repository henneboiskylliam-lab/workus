import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'

/**
 * Types pour les statistiques admin
 */

// Historique quotidien des utilisateurs
export interface DailyUserRecord {
  date: string // Format: YYYY-MM-DD
  totalUsers: number
  newUsers: number
}

export interface AdminStats {
  totalUsers: number
  totalCreators: number
  totalContent: number
  totalReports: number
  newUsersThisWeek: number
  newUsersThisMonth: number
  newUsersThisYear: number
  newUsersToday: number
  contentThisWeek: number
  contentThisMonth: number
  contentThisYear: number
  viewsThisWeek: number
  viewsThisMonth: number
  viewsThisYear: number
  // Historique pour calcul des évolutions
  userHistory: DailyUserRecord[]
  lastRecordedDate: string
}

export interface PeriodStats {
  users: number
  previousUsers: number
  creators: number
  previousCreators: number
  content: number
  previousContent: number
  views: number
  previousViews: number
}

// Évolution des utilisateurs par période
export interface UserEvolution {
  day: { current: number; previous: number; percentage: string; trend: 'up' | 'down' | 'stable' }
  week: { current: number; previous: number; percentage: string; trend: 'up' | 'down' | 'stable' }
  month: { current: number; previous: number; percentage: string; trend: 'up' | 'down' | 'stable' }
  year: { current: number; previous: number; percentage: string; trend: 'up' | 'down' | 'stable' }
}

interface AdminStatsContextType {
  stats: AdminStats
  incrementUsers: () => void
  decrementUsers: () => void
  incrementCreators: () => void
  decrementCreators: () => void
  incrementContent: () => void
  decrementContent: () => void
  incrementReports: () => void
  decrementReports: () => void
  setTotalUsers: (count: number) => void
  setTotalContent: (count: number) => void
  resetWeeklyStats: () => void
  resetMonthlyStats: () => void
  resetYearlyStats: () => void
  getStatsForPeriod: (period: 'week' | 'month' | 'year') => PeriodStats
  getUserEvolution: () => UserEvolution
  recordDailySnapshot: (totalUsers: number) => void
}

const STORAGE_KEY = 'workus_admin_stats'

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

const defaultStats: AdminStats = {
  totalUsers: 0,
  totalCreators: 0,
  totalContent: 0,
  totalReports: 0,
  newUsersThisWeek: 0,
  newUsersThisMonth: 0,
  newUsersThisYear: 0,
  newUsersToday: 0,
  contentThisWeek: 0,
  contentThisMonth: 0,
  contentThisYear: 0,
  viewsThisWeek: 0,
  viewsThisMonth: 0,
  viewsThisYear: 0,
  userHistory: [],
  lastRecordedDate: ''
}

const AdminStatsContext = createContext<AdminStatsContextType | undefined>(undefined)

/**
 * AdminStatsProvider - Gère les statistiques du dashboard admin
 */
export function AdminStatsProvider({ children }: { children: ReactNode }) {
  const [stats, setStats] = useState<AdminStats>(defaultStats)

  // Charger les stats au démarrage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        setStats({ ...defaultStats, ...JSON.parse(stored) })
      } catch {
        setStats(defaultStats)
      }
    }
  }, [])

  // Sauvegarder automatiquement
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats))
  }, [stats])

  const incrementUsers = useCallback(() => {
    setStats(prev => ({
      ...prev,
      totalUsers: prev.totalUsers + 1,
      newUsersThisWeek: prev.newUsersThisWeek + 1,
      newUsersThisMonth: prev.newUsersThisMonth + 1,
      newUsersThisYear: prev.newUsersThisYear + 1
    }))
  }, [])

  const decrementUsers = useCallback(() => {
    setStats(prev => ({
      ...prev,
      totalUsers: Math.max(0, prev.totalUsers - 1)
    }))
  }, [])

  const incrementCreators = useCallback(() => {
    setStats(prev => ({
      ...prev,
      totalCreators: prev.totalCreators + 1
    }))
  }, [])

  const decrementCreators = useCallback(() => {
    setStats(prev => ({
      ...prev,
      totalCreators: Math.max(0, prev.totalCreators - 1)
    }))
  }, [])

  const incrementContent = useCallback(() => {
    setStats(prev => ({
      ...prev,
      totalContent: prev.totalContent + 1,
      contentThisWeek: prev.contentThisWeek + 1,
      contentThisMonth: prev.contentThisMonth + 1,
      contentThisYear: prev.contentThisYear + 1
    }))
  }, [])

  const decrementContent = useCallback(() => {
    setStats(prev => ({
      ...prev,
      totalContent: Math.max(0, prev.totalContent - 1)
    }))
  }, [])

  const incrementReports = useCallback(() => {
    setStats(prev => ({
      ...prev,
      totalReports: prev.totalReports + 1
    }))
  }, [])

  const decrementReports = useCallback(() => {
    setStats(prev => ({
      ...prev,
      totalReports: Math.max(0, prev.totalReports - 1)
    }))
  }, [])

  const setTotalUsers = useCallback((count: number) => {
    setStats(prev => ({
      ...prev,
      totalUsers: count
    }))
  }, [])

  const setTotalContent = useCallback((count: number) => {
    setStats(prev => ({
      ...prev,
      totalContent: count
    }))
  }, [])

  const resetWeeklyStats = useCallback(() => {
    setStats(prev => ({
      ...prev,
      newUsersThisWeek: 0,
      contentThisWeek: 0,
      viewsThisWeek: 0
    }))
  }, [])

  const resetMonthlyStats = useCallback(() => {
    setStats(prev => ({
      ...prev,
      newUsersThisMonth: 0,
      contentThisMonth: 0,
      viewsThisMonth: 0
    }))
  }, [])

  const resetYearlyStats = useCallback(() => {
    setStats(prev => ({
      ...prev,
      newUsersThisYear: 0,
      contentThisYear: 0,
      viewsThisYear: 0
    }))
  }, [])

  // Obtenir les statistiques pour une période donnée
  const getStatsForPeriod = useCallback((period: 'week' | 'month' | 'year'): PeriodStats => {
    switch (period) {
      case 'week':
        return {
          users: stats.newUsersThisWeek,
          previousUsers: Math.max(0, stats.newUsersThisWeek - 1),
          creators: stats.totalCreators,
          previousCreators: Math.max(0, stats.totalCreators - 1),
          content: stats.contentThisWeek,
          previousContent: Math.max(0, stats.contentThisWeek - 1),
          views: stats.viewsThisWeek,
          previousViews: Math.max(0, stats.viewsThisWeek - 10)
        }
      case 'month':
        return {
          users: stats.newUsersThisMonth,
          previousUsers: Math.max(0, stats.newUsersThisMonth - 5),
          creators: stats.totalCreators,
          previousCreators: Math.max(0, stats.totalCreators - 2),
          content: stats.contentThisMonth,
          previousContent: Math.max(0, stats.contentThisMonth - 3),
          views: stats.viewsThisMonth,
          previousViews: Math.max(0, stats.viewsThisMonth - 50)
        }
      case 'year':
        return {
          users: stats.newUsersThisYear,
          previousUsers: Math.max(0, stats.newUsersThisYear - 20),
          creators: stats.totalCreators,
          previousCreators: Math.max(0, stats.totalCreators - 5),
          content: stats.contentThisYear,
          previousContent: Math.max(0, stats.contentThisYear - 10),
          views: stats.viewsThisYear,
          previousViews: Math.max(0, stats.viewsThisYear - 200)
        }
      default:
        return {
          users: 0,
          previousUsers: 0,
          creators: 0,
          previousCreators: 0,
          content: 0,
          previousContent: 0,
          views: 0,
          previousViews: 0
        }
    }
  }, [stats])

  // Enregistrer un snapshot quotidien des utilisateurs
  const recordDailySnapshot = useCallback((totalUsers: number) => {
    const today = getTodayDate()
    
    setStats(prev => {
      // Si on a déjà enregistré aujourd'hui, mettre à jour
      const existingIndex = prev.userHistory.findIndex(r => r.date === today)
      let newHistory = [...prev.userHistory]
      
      if (existingIndex >= 0) {
        // Mettre à jour l'enregistrement existant
        const yesterdayRecord = prev.userHistory.find(r => r.date === getPastDate(1))
        const previousTotal = yesterdayRecord?.totalUsers || 0
        newHistory[existingIndex] = {
          date: today,
          totalUsers: totalUsers,
          newUsers: Math.max(0, totalUsers - previousTotal)
        }
      } else {
        // Ajouter un nouvel enregistrement
        const yesterdayRecord = prev.userHistory.find(r => r.date === getPastDate(1))
        const previousTotal = yesterdayRecord?.totalUsers || prev.totalUsers
        newHistory.push({
          date: today,
          totalUsers: totalUsers,
          newUsers: Math.max(0, totalUsers - previousTotal)
        })
      }
      
      // Garder seulement les 365 derniers jours
      if (newHistory.length > 365) {
        newHistory = newHistory.slice(-365)
      }
      
      return {
        ...prev,
        totalUsers: totalUsers,
        userHistory: newHistory,
        lastRecordedDate: today
      }
    })
  }, [])

  // Calculer l'évolution des utilisateurs par période
  const getUserEvolution = useCallback((): UserEvolution => {
    const history = stats.userHistory
    const today = getTodayDate()
    
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
    
    // Fonction pour obtenir les nouveaux utilisateurs sur une période
    const getNewUsersInRange = (startDaysAgo: number, endDaysAgo: number): number => {
      let total = 0
      for (let i = endDaysAgo; i <= startDaysAgo; i++) {
        const dateStr = getPastDate(i)
        const record = history.find(r => r.date === dateStr)
        if (record) {
          total += record.newUsers
        }
      }
      return total
    }
    
    // Aujourd'hui vs Hier
    const todayRecord = history.find(r => r.date === today)
    const yesterdayRecord = history.find(r => r.date === getPastDate(1))
    const todayNewUsers = todayRecord?.newUsers || stats.newUsersToday
    const yesterdayNewUsers = yesterdayRecord?.newUsers || 0
    const dayEvolution = calculateEvolution(todayNewUsers, yesterdayNewUsers)
    
    // Cette semaine vs Semaine précédente (7 derniers jours vs 7 jours avant)
    const thisWeekUsers = getNewUsersInRange(6, 0) || stats.newUsersThisWeek
    const lastWeekUsers = getNewUsersInRange(13, 7)
    const weekEvolution = calculateEvolution(thisWeekUsers, lastWeekUsers)
    
    // Ce mois vs Mois précédent (30 derniers jours vs 30 jours avant)
    const thisMonthUsers = getNewUsersInRange(29, 0) || stats.newUsersThisMonth
    const lastMonthUsers = getNewUsersInRange(59, 30)
    const monthEvolution = calculateEvolution(thisMonthUsers, lastMonthUsers)
    
    // Cette année vs Année précédente (365 derniers jours vs 365 jours avant)
    const thisYearUsers = getNewUsersInRange(364, 0) || stats.newUsersThisYear
    const lastYearUsers = getNewUsersInRange(729, 365)
    const yearEvolution = calculateEvolution(thisYearUsers, lastYearUsers)
    
    return {
      day: { current: todayNewUsers, previous: yesterdayNewUsers, ...dayEvolution },
      week: { current: thisWeekUsers, previous: lastWeekUsers, ...weekEvolution },
      month: { current: thisMonthUsers, previous: lastMonthUsers, ...monthEvolution },
      year: { current: thisYearUsers, previous: lastYearUsers, ...yearEvolution }
    }
  }, [stats])

  const value: AdminStatsContextType = {
    stats,
    incrementUsers,
    decrementUsers,
    incrementCreators,
    decrementCreators,
    incrementContent,
    decrementContent,
    incrementReports,
    decrementReports,
    setTotalUsers,
    setTotalContent,
    resetWeeklyStats,
    resetMonthlyStats,
    resetYearlyStats,
    getStatsForPeriod,
    getUserEvolution,
    recordDailySnapshot
  }

  return (
    <AdminStatsContext.Provider value={value}>
      {children}
    </AdminStatsContext.Provider>
  )
}

/**
 * Hook pour utiliser le contexte des stats admin
 */
export function useAdminStats() {
  const context = useContext(AdminStatsContext)
  if (context === undefined) {
    throw new Error('useAdminStats must be used within an AdminStatsProvider')
  }
  return context
}
