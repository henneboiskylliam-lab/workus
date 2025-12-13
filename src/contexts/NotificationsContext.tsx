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

// Valeur par défaut complète pour éviter les crashes
const defaultContextValue: NotificationsContextType = {
  notifications: [],
  unreadCount: 0,
  addNotification: () => {
    console.warn('useNotifications: addNotification called outside of NotificationsProvider')
  },
  markAsRead: () => {
    console.warn('useNotifications: markAsRead called outside of NotificationsProvider')
  },
  markAllAsRead: () => {
    console.warn('useNotifications: markAllAsRead called outside of NotificationsProvider')
  },
  deleteNotification: () => {
    console.warn('useNotifications: deleteNotification called outside of NotificationsProvider')
  },
  clearAll: () => {
    console.warn('useNotifications: clearAll called outside of NotificationsProvider')
  },
  clearAllNotifications: () => {
    console.warn('useNotifications: clearAllNotifications called outside of NotificationsProvider')
  },
  getUnreadCount: () => 0,
  getUserNotifications: () => []
}

// Créer le contexte avec une valeur par défaut non-undefined
const NotificationsContext = createContext<NotificationsContextType>(defaultContextValue)

/**
 * Charge les notifications depuis le localStorage de manière sécurisée
 */
function loadNotificationsFromStorage(): Notification[] {
  if (typeof window === 'undefined') {
    return []
  }
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      // Vérifier que c'est bien un tableau
      if (Array.isArray(parsed)) {
        return parsed
      }
    }
  } catch {
    // Ignorer les erreurs de parsing
  }
  
  return []
}

/**
 * Sauvegarde les notifications de manière sécurisée
 */
function saveNotificationsToStorage(notifications: Notification[]): void {
  if (typeof window === 'undefined') {
    return
  }
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications))
  } catch {
    // Ignorer les erreurs (localStorage plein, désactivé, etc.)
  }
}

/**
 * NotificationsProvider - Gère les notifications utilisateur
 */
export function NotificationsProvider({ children }: { children: ReactNode }) {
  // Initialiser avec un tableau vide explicite
  const [notifications, setNotifications] = useState<Notification[]>([])

  // Charger les notifications au démarrage (côté client uniquement)
  useEffect(() => {
    const loaded = loadNotificationsFromStorage()
    setNotifications(loaded)
  }, [])

  // Sauvegarder automatiquement
  useEffect(() => {
    saveNotificationsToStorage(notifications)
  }, [notifications])

  // Calcul sécurisé du nombre de notifications non lues
  const safeNotifications = Array.isArray(notifications) ? notifications : []
  const unreadCount = safeNotifications.filter(n => n && !n.read).length

  // Ajouter une notification
  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      read: false,
      createdAt: new Date().toISOString()
    }
    setNotifications(prev => {
      const safePrev = Array.isArray(prev) ? prev : []
      return [newNotification, ...safePrev]
    })
  }, [])

  // Marquer comme lu
  const markAsRead = useCallback((id: string) => {
    if (!id) return
    setNotifications(prev => {
      const safePrev = Array.isArray(prev) ? prev : []
      return safePrev.map(n => 
        n && n.id === id ? { ...n, read: true } : n
      )
    })
  }, [])

  // Marquer toutes comme lues
  const markAllAsRead = useCallback((userId?: string) => {
    setNotifications(prev => {
      const safePrev = Array.isArray(prev) ? prev : []
      return safePrev.map(n => 
        n && (!userId || n.userId === userId) ? { ...n, read: true } : n
      )
    })
  }, [])

  // Supprimer une notification
  const deleteNotification = useCallback((id: string) => {
    if (!id) return
    setNotifications(prev => {
      const safePrev = Array.isArray(prev) ? prev : []
      return safePrev.filter(n => n && n.id !== id)
    })
  }, [])

  // Effacer toutes les notifications d'un utilisateur
  const clearAll = useCallback((userId?: string) => {
    if (userId) {
      setNotifications(prev => {
        const safePrev = Array.isArray(prev) ? prev : []
        return safePrev.filter(n => n && n.userId !== userId)
      })
    } else {
      setNotifications([])
    }
  }, [])

  // Alias pour clearAll sans paramètre
  const clearAllNotifications = useCallback(() => {
    setNotifications([])
  }, [])

  // Obtenir le nombre de non lues (sécurisé)
  const getUnreadCount = useCallback((userId?: string): number => {
    const safeNotifs = Array.isArray(notifications) ? notifications : []
    if (userId) {
      return safeNotifs.filter(n => n && n.userId === userId && !n.read).length
    }
    return safeNotifs.filter(n => n && !n.read).length
  }, [notifications])

  // Obtenir les notifications d'un utilisateur (sécurisé)
  const getUserNotifications = useCallback((userId?: string): Notification[] => {
    const safeNotifs = Array.isArray(notifications) ? notifications : []
    if (userId) {
      return safeNotifs.filter(n => n && n.userId === userId)
    }
    return safeNotifs
  }, [notifications])

  const value: NotificationsContextType = {
    notifications: safeNotifications,
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
 * Retourne toujours une valeur valide, même hors Provider
 */
export function useNotifications(): NotificationsContextType {
  const context = useContext(NotificationsContext)
  
  // Le contexte a toujours une valeur par défaut, donc il ne sera jamais undefined
  // Mais on ajoute une protection supplémentaire par sécurité
  if (!context) {
    console.warn('useNotifications: Context is undefined, using default values')
    return defaultContextValue
  }
  
  return context
}
