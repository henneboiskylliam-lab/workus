import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { useAuth } from './AuthContext'
import { notificationsDB, DBNotification } from '../lib/dbService'

/**
 * Types pour les notifications
 * 
 * RÈGLE D'OR: Les données sont chargées depuis la DB, pas stockées uniquement en useState
 */

export type NotificationType = 
  | 'like' | 'save' | 'share' | 'repost' | 'follow' 
  | 'message' | 'comment' | 'info' | 'success' 
  | 'warning' | 'error' | 'system' | 'report' | 'mention'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  isRead: boolean
  read?: boolean // Alias pour compatibilité
  createdAt: string
  fromUserId?: string
  fromUserName?: string
  targetId?: string
  targetType?: string
  targetUrl?: string
}

interface NotificationsContextType {
  notifications: Notification[]
  unreadCount: number
  isLoading: boolean
  addNotification: (notification: Omit<Notification, 'id' | 'isRead' | 'createdAt'>) => Promise<Notification | null>
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  deleteNotification: (id: string) => Promise<void>
  clearAllNotifications: () => Promise<void>
  getNotificationsByType: (type: NotificationType) => Notification[]
  refreshNotifications: () => Promise<void>
}

// Valeur par défaut pour éviter les crashes
const defaultContextValue: NotificationsContextType = {
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  addNotification: async () => null,
  markAsRead: async () => {},
  markAllAsRead: async () => {},
  deleteNotification: async () => {},
  clearAllNotifications: async () => {},
  getNotificationsByType: () => [],
  refreshNotifications: async () => {}
}

const NotificationsContext = createContext<NotificationsContextType>(defaultContextValue)

interface NotificationsProviderProps {
  children: ReactNode
}

/**
 * Convertit une notification DB vers le format de l'application
 */
function dbToNotification(dbNotif: DBNotification): Notification {
  return {
    id: dbNotif.id,
    type: dbNotif.type as NotificationType,
    title: dbNotif.title,
    message: dbNotif.message,
    isRead: dbNotif.is_read,
    read: dbNotif.is_read,
    createdAt: dbNotif.created_at,
    fromUserId: dbNotif.from_user_id || undefined,
    targetId: dbNotif.target_id || undefined,
    targetUrl: dbNotif.target_url || undefined
  }
}

/**
 * NotificationsProvider - Gère les notifications depuis la base de données
 * 
 * ✅ APRÈS: Charge depuis DB à chaque mount et user change
 * ✅ Chaque modification écrit en base ET met à jour le state
 */
export function NotificationsProvider({ children }: NotificationsProviderProps) {
  const { user, isAuthenticated } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Charger les notifications depuis la DB quand l'utilisateur change
  useEffect(() => {
    const loadNotifications = async () => {
      if (!isAuthenticated || !user?.id) {
        setNotifications([])
        return
      }

      setIsLoading(true)
      try {
        const dbNotifications = await notificationsDB.getAll(user.id)
        setNotifications(dbNotifications.map(dbToNotification))
      } catch (error) {
        console.error('Erreur chargement notifications:', error)
        setNotifications([])
      } finally {
        setIsLoading(false)
      }
    }

    loadNotifications()
  }, [user?.id, isAuthenticated])

  // Calculer le nombre de non lues
  const unreadCount = notifications.filter(n => !n.isRead).length

  // Ajouter une notification (écrit en DB + met à jour state)
  const addNotification = useCallback(async (
    notification: Omit<Notification, 'id' | 'isRead' | 'createdAt'>
  ): Promise<Notification | null> => {
    if (!user?.id) return null

    try {
      const dbNotif = await notificationsDB.create({
        user_id: user.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        from_user_id: notification.fromUserId || null,
        target_id: notification.targetId || null,
        target_url: notification.targetUrl || null
      })

      if (dbNotif) {
        const newNotif = dbToNotification(dbNotif)
        setNotifications(prev => [newNotif, ...prev])
        return newNotif
      }
    } catch (error) {
      console.error('Erreur création notification:', error)
    }
    return null
  }, [user?.id])

  // Marquer comme lue (écrit en DB + met à jour state)
  const markAsRead = useCallback(async (id: string): Promise<void> => {
    try {
      const success = await notificationsDB.markAsRead(id)
      if (success) {
        setNotifications(prev => 
          prev.map(n => n.id === id ? { ...n, isRead: true, read: true } : n)
        )
      }
    } catch (error) {
      console.error('Erreur markAsRead:', error)
    }
  }, [])

  // Marquer toutes comme lues (écrit en DB + met à jour state)
  const markAllAsRead = useCallback(async (): Promise<void> => {
    if (!user?.id) return

    try {
      const success = await notificationsDB.markAllAsRead(user.id)
      if (success) {
        setNotifications(prev => 
          prev.map(n => ({ ...n, isRead: true, read: true }))
        )
      }
    } catch (error) {
      console.error('Erreur markAllAsRead:', error)
    }
  }, [user?.id])

  // Supprimer une notification (supprime en DB + met à jour state)
  const deleteNotification = useCallback(async (id: string): Promise<void> => {
    try {
      const success = await notificationsDB.delete(id)
      if (success) {
        setNotifications(prev => prev.filter(n => n.id !== id))
      }
    } catch (error) {
      console.error('Erreur deleteNotification:', error)
    }
  }, [])

  // Supprimer toutes les notifications
  const clearAllNotifications = useCallback(async (): Promise<void> => {
    if (!user?.id) return

    try {
      // Supprimer une par une (pas de méthode bulk dans le service)
      for (const notif of notifications) {
        await notificationsDB.delete(notif.id)
      }
      setNotifications([])
    } catch (error) {
      console.error('Erreur clearAllNotifications:', error)
    }
  }, [user?.id, notifications])

  // Filtrer par type
  const getNotificationsByType = useCallback((type: NotificationType): Notification[] => {
    return notifications.filter(n => n.type === type)
  }, [notifications])

  // Rafraîchir depuis la DB
  const refreshNotifications = useCallback(async (): Promise<void> => {
    if (!user?.id) return

    setIsLoading(true)
    try {
      const dbNotifications = await notificationsDB.getAll(user.id)
      setNotifications(dbNotifications.map(dbToNotification))
    } catch (error) {
      console.error('Erreur refresh notifications:', error)
    } finally {
      setIsLoading(false)
    }
  }, [user?.id])

  const value: NotificationsContextType = {
    notifications,
    unreadCount,
    isLoading,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    getNotificationsByType,
    refreshNotifications
  }

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  )
}

/**
 * Hook pour utiliser les notifications
 */
export function useNotifications() {
  const context = useContext(NotificationsContext)
  // Retourner la valeur par défaut si le contexte n'est pas disponible
  if (!context) {
    return defaultContextValue
  }
  return context
}
