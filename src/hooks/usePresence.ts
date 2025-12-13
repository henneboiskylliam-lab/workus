import { useState, useEffect, useCallback } from 'react'

/**
 * Clé de stockage pour le statut de présence
 * Format: { [userId]: { lastSeen: timestamp, isOnline: boolean } }
 */
const PRESENCE_STORAGE_KEY = 'workus_user_presence'
const HEARTBEAT_INTERVAL = 5000 // 5 secondes
const OFFLINE_THRESHOLD = 15000 // 15 secondes sans activité = hors ligne

interface PresenceData {
  lastSeen: number
  isOnline: boolean
}

type PresenceMap = Record<string, PresenceData>

/**
 * Charge les données de présence depuis localStorage
 */
function loadPresenceData(): PresenceMap {
  try {
    const stored = localStorage.getItem(PRESENCE_STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch {
    // Ignorer les erreurs
  }
  return {}
}

/**
 * Sauvegarde les données de présence dans localStorage
 */
function savePresenceData(data: PresenceMap): void {
  localStorage.setItem(PRESENCE_STORAGE_KEY, JSON.stringify(data))
}

/**
 * Met à jour le statut de présence d'un utilisateur
 */
export function updateUserPresence(userId: string, isOnline: boolean): void {
  const data = loadPresenceData()
  data[userId] = {
    lastSeen: Date.now(),
    isOnline
  }
  savePresenceData(data)
}

/**
 * Marque un utilisateur comme hors ligne
 */
export function setUserOffline(userId: string): void {
  const data = loadPresenceData()
  if (data[userId]) {
    data[userId].isOnline = false
  }
  savePresenceData(data)
}

/**
 * Vérifie si un utilisateur est en ligne
 */
export function isUserOnline(userId: string): boolean {
  const data = loadPresenceData()
  const userPresence = data[userId]
  
  if (!userPresence) return false
  
  // Vérifier si le dernier heartbeat est récent
  const timeSinceLastSeen = Date.now() - userPresence.lastSeen
  return userPresence.isOnline && timeSinceLastSeen < OFFLINE_THRESHOLD
}

/**
 * Récupère les informations de présence d'un utilisateur
 */
export function getUserPresence(userId: string): { isOnline: boolean; lastSeen: number | null } {
  const data = loadPresenceData()
  const userPresence = data[userId]
  
  if (!userPresence) {
    return { isOnline: false, lastSeen: null }
  }
  
  const timeSinceLastSeen = Date.now() - userPresence.lastSeen
  const isOnline = userPresence.isOnline && timeSinceLastSeen < OFFLINE_THRESHOLD
  
  return {
    isOnline,
    lastSeen: userPresence.lastSeen
  }
}

/**
 * Hook pour gérer la présence de l'utilisateur actuel
 * Met à jour automatiquement le statut en ligne
 */
export function useCurrentUserPresence(userId: string | undefined) {
  useEffect(() => {
    if (!userId) return

    // Marquer comme en ligne immédiatement
    updateUserPresence(userId, true)

    // Heartbeat régulier pour rester en ligne
    const heartbeatInterval = setInterval(() => {
      updateUserPresence(userId, true)
    }, HEARTBEAT_INTERVAL)

    // Gérer les événements de visibilité de la page
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page cachée - rester en ligne mais arrêter les heartbeats intensifs
      } else {
        // Page visible - heartbeat immédiat
        updateUserPresence(userId, true)
      }
    }

    // Gérer la fermeture/navigation
    const handleBeforeUnload = () => {
      setUserOffline(userId)
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      clearInterval(heartbeatInterval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('beforeunload', handleBeforeUnload)
      // Marquer comme hors ligne quand le composant se démonte
      setUserOffline(userId)
    }
  }, [userId])
}

/**
 * Hook pour observer le statut de présence d'un utilisateur
 */
export function useUserPresence(userId: string | undefined) {
  const [isOnline, setIsOnline] = useState(false)
  const [lastSeen, setLastSeen] = useState<number | null>(null)

  const checkPresence = useCallback(() => {
    if (!userId) {
      setIsOnline(false)
      setLastSeen(null)
      return
    }

    const presence = getUserPresence(userId)
    setIsOnline(presence.isOnline)
    setLastSeen(presence.lastSeen)
  }, [userId])

  useEffect(() => {
    // Vérifier immédiatement
    checkPresence()

    // Polling pour détecter les changements
    const pollInterval = setInterval(checkPresence, 3000)

    // Écouter les changements de localStorage
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === PRESENCE_STORAGE_KEY) {
        checkPresence()
      }
    }
    window.addEventListener('storage', handleStorageChange)

    return () => {
      clearInterval(pollInterval)
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [checkPresence])

  // Formater le temps depuis la dernière connexion
  const formatLastSeen = useCallback(() => {
    if (!lastSeen) return null
    
    const diff = Date.now() - lastSeen
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    
    if (minutes < 1) return "À l'instant"
    if (minutes < 60) return `Il y a ${minutes} min`
    if (hours < 24) return `Il y a ${hours}h`
    if (days === 1) return "Hier"
    return `Il y a ${days} jours`
  }, [lastSeen])

  return { isOnline, lastSeen, formatLastSeen }
}

