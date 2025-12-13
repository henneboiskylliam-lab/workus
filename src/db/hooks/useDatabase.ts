import { useState, useEffect, useCallback } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, initializeDatabase, DBUser, DBCategory, DBSpecialty, DBNotification } from '../database'
import { userService, categoryService, postService, notificationService, statsService } from '../services'

/**
 * Hook pour initialiser la base de données
 */
export function useDatabaseInit() {
  const [isInitialized, setIsInitialized] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const init = async () => {
      try {
        await initializeDatabase()
        setIsInitialized(true)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to initialize database'))
      } finally {
        setIsLoading(false)
      }
    }
    init()
  }, [])

  return { isInitialized, isLoading, error }
}

/**
 * Hook pour les utilisateurs avec mise à jour en temps réel
 */
export function useUsers() {
  const users = useLiveQuery(() => db.users.toArray()) ?? []
  const count = useLiveQuery(() => db.users.count()) ?? 0

  return {
    users,
    count,
    getById: userService.getById,
    getByEmail: userService.getByEmail,
    create: userService.create,
    update: userService.update,
    delete: userService.delete,
    authenticate: userService.authenticate,
    search: userService.search
  }
}

/**
 * Hook pour un utilisateur spécifique
 */
export function useUser(userId: string | undefined) {
  const user = useLiveQuery(
    () => userId ? db.users.get(userId) : undefined,
    [userId]
  )

  return { user }
}

/**
 * Hook pour les catégories avec mise à jour en temps réel
 */
export function useCategories() {
  const categories = useLiveQuery(() => db.categories.orderBy('name').toArray()) ?? []
  const count = useLiveQuery(() => db.categories.count()) ?? 0

  return {
    categories,
    count,
    getById: categoryService.getCategoryById,
    getBySlug: categoryService.getCategoryBySlug,
    create: categoryService.createCategory,
    update: categoryService.updateCategory,
    delete: categoryService.deleteCategory
  }
}

/**
 * Hook pour les spécialités avec mise à jour en temps réel
 */
export function useSpecialties(categoryId?: string) {
  const specialties = useLiveQuery(
    () => categoryId 
      ? db.specialties.where('categoryId').equals(categoryId).toArray()
      : db.specialties.orderBy('name').toArray(),
    [categoryId]
  ) ?? []
  
  const count = useLiveQuery(() => db.specialties.count()) ?? 0

  return {
    specialties,
    count,
    getById: categoryService.getSpecialtyById,
    getBySlug: categoryService.getSpecialtyBySlug,
    create: categoryService.createSpecialty,
    update: categoryService.updateSpecialty,
    delete: categoryService.deleteSpecialty,
    search: categoryService.searchSpecialties
  }
}

/**
 * Hook pour une spécialité spécifique
 */
export function useSpecialty(slugOrId: string | undefined) {
  const specialty = useLiveQuery(
    async () => {
      if (!slugOrId) return undefined
      // Essayer d'abord par ID, puis par slug
      let result = await db.specialties.get(slugOrId)
      if (!result) {
        result = await db.specialties.where('slug').equals(slugOrId).first()
      }
      return result
    },
    [slugOrId]
  )

  // Récupérer la catégorie parente
  const category = useLiveQuery(
    () => specialty?.categoryId ? db.categories.get(specialty.categoryId) : undefined,
    [specialty?.categoryId]
  )

  return { specialty, category }
}

/**
 * Hook pour les posts avec mise à jour en temps réel
 */
export function usePosts(authorId?: string, specialtyId?: string) {
  const posts = useLiveQuery(
    async () => {
      let query = db.posts.orderBy('createdAt').reverse()
      let results = await query.toArray()
      
      if (authorId) {
        results = results.filter(p => p.authorId === authorId)
      }
      if (specialtyId) {
        results = results.filter(p => p.specialtyId === specialtyId)
      }
      
      return results
    },
    [authorId, specialtyId]
  ) ?? []

  return {
    posts,
    getById: postService.getPostById,
    create: postService.createPost,
    update: postService.updatePost,
    delete: postService.deletePost,
    toggleLike: postService.toggleLike,
    toggleSave: postService.toggleSave,
    search: postService.searchPosts
  }
}

/**
 * Hook pour les notifications avec mise à jour en temps réel
 */
export function useNotificationsDB(userId: string | undefined) {
  const notifications = useLiveQuery(
    () => userId 
      ? db.notifications.where('userId').equals(userId).reverse().sortBy('createdAt')
      : [],
    [userId]
  ) ?? []

  const unreadCount = useLiveQuery(
    () => userId 
      ? db.notifications.where('[userId+isRead]').equals([userId, 0]).count()
      : 0,
    [userId]
  ) ?? 0

  const markAsRead = useCallback(async (id: string) => {
    await notificationService.markAsRead(id)
  }, [])

  const markAllAsRead = useCallback(async () => {
    if (userId) {
      await notificationService.markAllAsRead(userId)
    }
  }, [userId])

  const deleteNotification = useCallback(async (id: string) => {
    await notificationService.delete(id)
  }, [])

  const addNotification = useCallback(async (data: Omit<DBNotification, 'id' | 'createdAt' | 'isRead'>) => {
    return await notificationService.create(data)
  }, [])

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    addNotification
  }
}

/**
 * Hook pour les statistiques admin avec mise à jour en temps réel
 */
export function useAdminStats() {
  const stats = useLiveQuery(() => db.adminStats.get('current'))
  
  const [evolution, setEvolution] = useState<Awaited<ReturnType<typeof statsService.getUserEvolution>> | null>(null)

  useEffect(() => {
    statsService.getUserEvolution().then(setEvolution)
  }, [stats])

  const recordDailySnapshot = useCallback(async (count: number) => {
    await statsService.recordDailyUserSnapshot(count)
  }, [])

  const updateStats = useCallback(async (updates: Parameters<typeof statsService.updateStats>[0]) => {
    await statsService.updateStats(updates)
  }, [])

  return {
    stats,
    evolution,
    recordDailySnapshot,
    updateStats,
    logActivity: statsService.logActivity,
    getRecentActivities: statsService.getRecentActivities,
    getAllRecentActivities: statsService.getAllRecentActivities,
    recordDailyActivity: statsService.recordDailyActivity,
    getActivityTimeStats: statsService.getActivityTimeStats
  }
}

/**
 * Hook pour l'activité quotidienne
 */
export function useDailyActivity() {
  const todayRecord = useLiveQuery(
    () => {
      const today = new Date().toISOString().split('T')[0]
      return db.dailyActivityRecords.get(today)
    }
  )

  return {
    todayRecord,
    recordActivity: statsService.recordDailyActivity,
    getStats: statsService.getActivityTimeStats
  }
}

