import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'

/**
 * Types pour les statistiques admin
 */
export interface AdminStats {
  totalUsers: number
  totalCreators: number
  totalContent: number
  totalReports: number
  newUsersThisWeek: number
  newUsersThisMonth: number
  newUsersThisYear: number
  contentThisWeek: number
  contentThisMonth: number
  contentThisYear: number
  viewsThisWeek: number
  viewsThisMonth: number
  viewsThisYear: number
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
}

const STORAGE_KEY = 'workus_admin_stats'

const defaultStats: AdminStats = {
  totalUsers: 0,
  totalCreators: 0,
  totalContent: 0,
  totalReports: 0,
  newUsersThisWeek: 0,
  newUsersThisMonth: 0,
  newUsersThisYear: 0,
  contentThisWeek: 0,
  contentThisMonth: 0,
  contentThisYear: 0,
  viewsThisWeek: 0,
  viewsThisMonth: 0,
  viewsThisYear: 0
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
    getStatsForPeriod
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
