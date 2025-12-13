import { db, DBAdminStats, DBActivityEvent, DBDailyActivityRecord, generateId, getCurrentISODate, getTodayDateString } from '../database'

/**
 * Service de gestion des statistiques et activités
 */
export const statsService = {
  // ========== STATS ADMIN ==========

  /**
   * Récupère les statistiques actuelles
   */
  async getCurrentStats(): Promise<DBAdminStats | undefined> {
    return await db.adminStats.get('current')
  },

  /**
   * Met à jour les statistiques
   */
  async updateStats(updates: Partial<DBAdminStats>): Promise<void> {
    const existing = await db.adminStats.get('current')
    if (existing) {
      await db.adminStats.update('current', { ...updates, updatedAt: getCurrentISODate() })
    } else {
      await db.adminStats.add({
        id: 'current',
        totalUsers: 0,
        activeUsers: 0,
        totalPosts: 0,
        totalDiscussions: 0,
        totalReports: 0,
        pendingReports: 0,
        totalContent: 0,
        dailyUserSnapshots: [],
        ...updates,
        updatedAt: getCurrentISODate()
      })
    }
  },

  /**
   * Enregistre un snapshot quotidien des utilisateurs
   */
  async recordDailyUserSnapshot(count: number): Promise<void> {
    const stats = await db.adminStats.get('current')
    const today = getTodayDateString()
    
    if (stats) {
      const snapshots = [...stats.dailyUserSnapshots]
      const existingIndex = snapshots.findIndex(s => s.date === today)
      
      if (existingIndex >= 0) {
        snapshots[existingIndex].count = count
      } else {
        snapshots.push({ date: today, count })
        // Garder seulement les 365 derniers jours
        while (snapshots.length > 365) {
          snapshots.shift()
        }
      }
      
      await db.adminStats.update('current', { 
        dailyUserSnapshots: snapshots,
        totalUsers: count,
        updatedAt: getCurrentISODate()
      })
    }
  },

  /**
   * Calcule l'évolution des utilisateurs
   */
  async getUserEvolution(): Promise<{
    daily: { current: number; previous: number; percentage: number; trend: 'up' | 'down' | 'stable' }
    weekly: { current: number; previous: number; percentage: number; trend: 'up' | 'down' | 'stable' }
    monthly: { current: number; previous: number; percentage: number; trend: 'up' | 'down' | 'stable' }
    yearly: { current: number; previous: number; percentage: number; trend: 'up' | 'down' | 'stable' }
  }> {
    const stats = await db.adminStats.get('current')
    const snapshots = stats?.dailyUserSnapshots || []
    
    const today = new Date()
    const getSnapshotForDate = (date: Date): number => {
      const dateStr = date.toISOString().split('T')[0]
      return snapshots.find(s => s.date === dateStr)?.count || 0
    }
    
    const calculateEvolution = (current: number, previous: number) => {
      if (previous === 0) return { current, previous, percentage: current > 0 ? 100 : 0, trend: 'stable' as const }
      const percentage = ((current - previous) / previous) * 100
      const trend = percentage > 0 ? 'up' as const : percentage < 0 ? 'down' as const : 'stable' as const
      return { current, previous, percentage: Math.round(percentage * 10) / 10, trend }
    }
    
    const currentCount = stats?.totalUsers || 0
    
    // Journalier
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const dailyPrevious = getSnapshotForDate(yesterday)
    
    // Hebdomadaire
    const lastWeek = new Date(today)
    lastWeek.setDate(lastWeek.getDate() - 7)
    const weeklyPrevious = getSnapshotForDate(lastWeek)
    
    // Mensuel
    const lastMonth = new Date(today)
    lastMonth.setMonth(lastMonth.getMonth() - 1)
    const monthlyPrevious = getSnapshotForDate(lastMonth)
    
    // Annuel
    const lastYear = new Date(today)
    lastYear.setFullYear(lastYear.getFullYear() - 1)
    const yearlyPrevious = getSnapshotForDate(lastYear)
    
    return {
      daily: calculateEvolution(currentCount, dailyPrevious),
      weekly: calculateEvolution(currentCount, weeklyPrevious),
      monthly: calculateEvolution(currentCount, monthlyPrevious),
      yearly: calculateEvolution(currentCount, yearlyPrevious)
    }
  },

  // ========== ACTIVITÉ ==========

  /**
   * Enregistre un événement d'activité
   */
  async logActivity(data: Omit<DBActivityEvent, 'id' | 'createdAt'>): Promise<DBActivityEvent> {
    const event: DBActivityEvent = {
      ...data,
      id: generateId(),
      createdAt: getCurrentISODate()
    }
    await db.activityEvents.add(event)
    return event
  },

  /**
   * Récupère les activités récentes d'un utilisateur
   */
  async getRecentActivities(userId: string, limit = 50): Promise<DBActivityEvent[]> {
    return await db.activityEvents
      .where('userId')
      .equals(userId)
      .reverse()
      .limit(limit)
      .sortBy('createdAt')
  },

  /**
   * Récupère toutes les activités récentes (pour admin)
   */
  async getAllRecentActivities(limit = 100): Promise<DBActivityEvent[]> {
    return await db.activityEvents
      .orderBy('createdAt')
      .reverse()
      .limit(limit)
      .toArray()
  },

  // ========== TEMPS D'ACTIVITÉ ==========

  /**
   * Enregistre le temps d'activité quotidien
   */
  async recordDailyActivity(userId: string, minutes: number): Promise<void> {
    const today = getTodayDateString()
    const existing = await db.dailyActivityRecords.get(today)
    
    if (existing) {
      const userMinutes = { ...existing.userMinutes }
      userMinutes[userId] = (userMinutes[userId] || 0) + minutes
      
      await db.dailyActivityRecords.update(today, {
        totalMinutes: existing.totalMinutes + minutes,
        userMinutes,
        updatedAt: getCurrentISODate()
      })
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
  },

  /**
   * Récupère les statistiques de temps d'activité
   */
  async getActivityTimeStats(period: 'day' | 'week' | 'month' | 'year'): Promise<{
    averageMinutes: number
    totalMinutes: number
    data: { date: string; minutes: number }[]
    evolution: { percentage: number; trend: 'up' | 'down' | 'stable' }
  }> {
    const records = await db.dailyActivityRecords.orderBy('date').reverse().toArray()
    
    const today = new Date()
    let daysToInclude = 1
    let previousDays = 1
    
    switch (period) {
      case 'day': daysToInclude = 1; previousDays = 1; break
      case 'week': daysToInclude = 7; previousDays = 7; break
      case 'month': daysToInclude = 30; previousDays = 30; break
      case 'year': daysToInclude = 365; previousDays = 365; break
    }
    
    const cutoffDate = new Date(today)
    cutoffDate.setDate(cutoffDate.getDate() - daysToInclude)
    
    const previousCutoff = new Date(cutoffDate)
    previousCutoff.setDate(previousCutoff.getDate() - previousDays)
    
    const currentRecords = records.filter(r => r.date >= cutoffDate.toISOString().split('T')[0])
    const previousRecords = records.filter(r => 
      r.date >= previousCutoff.toISOString().split('T')[0] && 
      r.date < cutoffDate.toISOString().split('T')[0]
    )
    
    const currentTotal = currentRecords.reduce((sum, r) => sum + r.totalMinutes, 0)
    const previousTotal = previousRecords.reduce((sum, r) => sum + r.totalMinutes, 0)
    
    const percentage = previousTotal === 0 
      ? (currentTotal > 0 ? 100 : 0)
      : Math.round(((currentTotal - previousTotal) / previousTotal) * 100 * 10) / 10
    
    const trend = percentage > 0 ? 'up' as const : percentage < 0 ? 'down' as const : 'stable' as const
    
    return {
      averageMinutes: currentRecords.length > 0 ? Math.round(currentTotal / currentRecords.length) : 0,
      totalMinutes: currentTotal,
      data: currentRecords.map(r => ({ date: r.date, minutes: r.totalMinutes })),
      evolution: { percentage, trend }
    }
  }
}

