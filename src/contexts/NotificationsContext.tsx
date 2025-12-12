import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'

/**
 * Types pour les notifications
 */
export interface Notification {
  id: string
  userId?: string
  type: 'info' | 'success' | 'warning' | 'error' | 'message' | 'follow' | 'like' | 'comment' | 'system' | 'report' | 'share' | 'save' | 'mention'
  title: string
  message: string
  read: boolean
  link?: string
  fromUserId?: string
  fromUserName?: string
  targetId?: string
  targetType?: 'post' | 'comment' | 'user' | 'report' | 'discussion' | 'profile'
  targetUrl?: string
  createdAt: string
}

interface NotificationsContextType {
  notifications: Notification[]
  unreadCount: number
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => void
  markAsRead: (id: string) => void
  markAllAsRead: (userId?: string) => void
  deleteNotification: (id: string) => void
  clearAll: (userId?: string) => void
  clearAllNotifications: () => void
  getUnreadCount: (userId?: string) => number
  getUserNotifications: (userId?: string) => Notification[]
}

const STORAGE_KEY = 'workus_notifications'

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined)

/**
 * NotificationsProvider - Gère les notifications utilisateur
 */
export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])

  // Charger les notifications au démarrage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        setNotifications(JSON.parse(stored))
      } catch {
        setNotifications([])
      }
    }
  }, [])

  // Sauvegarder automatiquement
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications))
  }, [notifications])

  // Calcul du nombre de notifications non lues
  const unreadCount = notifications.filter(n => !n.read).length

  // Ajouter une notification
  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      read: false,
      createdAt: new Date().toISOString()
    }
    setNotifications(prev => [newNotification, ...prev])
  }, [])

  // Marquer comme lu
  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, read: true } : n
    ))
  }, [])

  // Marquer toutes comme lues
  const markAllAsRead = useCallback((userId?: string) => {
    setNotifications(prev => prev.map(n => 
      (!userId || n.userId === userId) ? { ...n, read: true } : n
    ))
  }, [])

  // Supprimer une notification
  const deleteNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  // Effacer toutes les notifications d'un utilisateur
  const clearAll = useCallback((userId?: string) => {
    if (userId) {
      setNotifications(prev => prev.filter(n => n.userId !== userId))
    } else {
      setNotifications([])
    }
  }, [])

  // Alias pour clearAll sans paramètre
  const clearAllNotifications = useCallback(() => {
    setNotifications([])
  }, [])

  // Obtenir le nombre de non lues
  const getUnreadCount = useCallback((userId?: string) => {
    if (userId) {
      return notifications.filter(n => n.userId === userId && !n.read).length
    }
    return notifications.filter(n => !n.read).length
  }, [notifications])

  // Obtenir les notifications d'un utilisateur
  const getUserNotifications = useCallback((userId?: string) => {
    if (userId) {
      return notifications.filter(n => n.userId === userId)
    }
    return notifications
  }, [notifications])

  const value: NotificationsContextType = {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    clearAllNotifications,
    getUnreadCount,
    getUserNotifications
  }

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  )
}

/**
 * Hook pour utiliser le contexte des notifications
 */
export function useNotifications() {
  const context = useContext(NotificationsContext)
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationsProvider')
  }
  return context
}
