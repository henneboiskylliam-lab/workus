import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { useAuth } from './AuthContext'

/**
 * Types pour les messages privés
 * 
 * Statuts des messages:
 * - 'sending': Message en cours d'envoi
 * - 'sent': Message envoyé (1 check gris)
 * - 'delivered': Message reçu par le destinataire (2 checks gris)
 * - 'read': Message lu par le destinataire (2 checks bleus)
 */
export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read'

export interface PrivateMessage {
  id: string
  conversationId: string
  senderId: string
  senderName: string
  senderAvatar?: string
  receiverId: string
  receiverName: string
  content: string
  status: MessageStatus
  createdAt: string
  deliveredAt?: string
  readAt?: string
}

export interface Conversation {
  id: string
  participants: string[] // Les deux IDs des participants
  participantNames: Record<string, string> // userId -> username
  participantAvatars: Record<string, string | undefined> // userId -> avatar
  lastMessage?: string
  lastMessageAt?: string
  lastMessageSenderId?: string
  unreadCounts: Record<string, number> // userId -> unreadCount
}

interface MessagesContextType {
  conversations: Conversation[]
  messages: Record<string, PrivateMessage[]>
  activeConversation: string | null
  isOpen: boolean
  totalUnread: number
  
  // Actions
  openConversation: (userId: string, userName: string, userAvatar?: string) => void
  selectConversation: (conversationId: string) => void
  closeMessages: () => void
  toggleMessages: () => void
  sendMessage: (content: string) => void
  markAsRead: (conversationId: string) => void
  getConversationMessages: (conversationId: string) => PrivateMessage[]
  setActiveConversationNull: () => void
  getParticipantInfo: (conv: Conversation) => { id: string; name: string; avatar?: string }
}

// Clé globale pour les messages (partagée entre tous les utilisateurs)
const GLOBAL_MESSAGES_KEY = 'workus_global_messages'
const GLOBAL_CONVERSATIONS_KEY = 'workus_global_conversations'

const defaultContextValue: MessagesContextType = {
  conversations: [],
  messages: {},
  activeConversation: null,
  isOpen: false,
  totalUnread: 0,
  openConversation: () => {},
  selectConversation: () => {},
  closeMessages: () => {},
  toggleMessages: () => {},
  sendMessage: () => {},
  markAsRead: () => {},
  getConversationMessages: () => [],
  setActiveConversationNull: () => {},
  getParticipantInfo: () => ({ id: '', name: '' })
}

const MessagesContext = createContext<MessagesContextType>(defaultContextValue)

interface MessagesProviderProps {
  children: ReactNode
}

/**
 * MessagesProvider - Gère les messages privés avec stockage GLOBAL
 * Les messages sont partagés entre tous les utilisateurs via localStorage
 */
export function MessagesProvider({ children }: MessagesProviderProps) {
  const { user } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<Record<string, PrivateMessage[]>>({})
  const [activeConversation, setActiveConversation] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  // Charger les données globales depuis localStorage
  const loadGlobalData = useCallback(() => {
    try {
      const storedConversations = localStorage.getItem(GLOBAL_CONVERSATIONS_KEY)
      const storedMessages = localStorage.getItem(GLOBAL_MESSAGES_KEY)
      
      if (storedConversations) {
        setConversations(JSON.parse(storedConversations))
      }
      if (storedMessages) {
        setMessages(JSON.parse(storedMessages))
      }
    } catch (error) {
      console.error('Erreur chargement messages:', error)
    }
  }, [])

  // Charger au démarrage
  useEffect(() => {
    loadGlobalData()
  }, [loadGlobalData])

  // Écouter les changements de localStorage (pour la synchronisation entre onglets/utilisateurs)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === GLOBAL_CONVERSATIONS_KEY || e.key === GLOBAL_MESSAGES_KEY) {
        loadGlobalData()
      }
    }

    window.addEventListener('storage', handleStorageChange)
    
    // Polling pour détecter les changements locaux (même onglet)
    const pollInterval = setInterval(() => {
      loadGlobalData()
    }, 2000)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(pollInterval)
    }
  }, [loadGlobalData])

  // Sauvegarder les données globales
  const saveGlobalData = useCallback((newConversations: Conversation[], newMessages: Record<string, PrivateMessage[]>) => {
    localStorage.setItem(GLOBAL_CONVERSATIONS_KEY, JSON.stringify(newConversations))
    localStorage.setItem(GLOBAL_MESSAGES_KEY, JSON.stringify(newMessages))
  }, [])

  // Calculer le total de non lus pour l'utilisateur actuel
  const totalUnread = user?.id 
    ? conversations.reduce((sum, conv) => sum + (conv.unreadCounts[user.id] || 0), 0)
    : 0

  // Générer un ID de conversation unique
  const getConversationId = useCallback((userId1: string, userId2: string) => {
    return [userId1, userId2].sort().join('_')
  }, [])

  // Obtenir les infos du participant (l'autre utilisateur)
  const getParticipantInfo = useCallback((conv: Conversation): { id: string; name: string; avatar?: string } => {
    if (!user?.id) return { id: '', name: 'Utilisateur' }
    
    const otherId = conv.participants.find(p => p !== user.id) || conv.participants[0]
    return {
      id: otherId,
      name: conv.participantNames[otherId] || 'Utilisateur',
      avatar: conv.participantAvatars[otherId]
    }
  }, [user?.id])

  // Ouvrir une conversation (ou la créer si elle n'existe pas)
  const openConversation = useCallback((userId: string, userName: string, userAvatar?: string) => {
    if (!user?.id) return

    const conversationId = getConversationId(user.id, userId)
    
    // Vérifier si la conversation existe déjà
    let existingConv = conversations.find(c => c.id === conversationId)
    
    if (!existingConv) {
      // Créer une nouvelle conversation
      const newConversation: Conversation = {
        id: conversationId,
        participants: [user.id, userId],
        participantNames: {
          [user.id]: user.username || 'Moi',
          [userId]: userName
        },
        participantAvatars: {
          [userId]: userAvatar
        },
        unreadCounts: {
          [user.id]: 0,
          [userId]: 0
        }
      }
      
      const newConversations = [newConversation, ...conversations]
      setConversations(newConversations)
      saveGlobalData(newConversations, messages)
    } else {
      // Mettre à jour les noms si nécessaire
      const updatedConv = {
        ...existingConv,
        participantNames: {
          ...existingConv.participantNames,
          [user.id]: user.username || 'Moi',
          [userId]: userName
        },
        participantAvatars: {
          ...existingConv.participantAvatars,
          [userId]: userAvatar
        }
      }
      
      const newConversations = conversations.map(c => c.id === conversationId ? updatedConv : c)
      setConversations(newConversations)
      saveGlobalData(newConversations, messages)
    }

    setActiveConversation(conversationId)
    setIsOpen(true)
  }, [user, conversations, messages, getConversationId, saveGlobalData])

  // Sélectionner une conversation existante
  const selectConversation = useCallback((conversationId: string) => {
    setActiveConversation(conversationId)
  }, [])

  // Remettre activeConversation à null
  const setActiveConversationNull = useCallback(() => {
    setActiveConversation(null)
  }, [])

  // Fermer les messages
  const closeMessages = useCallback(() => {
    setIsOpen(false)
  }, [])

  // Toggle messages
  const toggleMessages = useCallback(() => {
    setIsOpen(prev => !prev)
  }, [])

  // Envoyer un message
  const sendMessage = useCallback((content: string) => {
    if (!user?.id || !activeConversation || !content.trim()) return

    const conversation = conversations.find(c => c.id === activeConversation)
    if (!conversation) return

    const receiverId = conversation.participants.find(p => p !== user.id)
    if (!receiverId) return

    const now = new Date().toISOString()
    const newMessage: PrivateMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      conversationId: activeConversation,
      senderId: user.id,
      senderName: user.username || 'Moi',
      receiverId: receiverId,
      receiverName: conversation.participantNames[receiverId] || 'Utilisateur',
      content: content.trim(),
      status: 'sent', // Directement envoyé
      createdAt: now
    }

    // Ajouter le message
    const newMessages = {
      ...messages,
      [activeConversation]: [...(messages[activeConversation] || []), newMessage]
    }

    // Mettre à jour la conversation avec le nouveau message et incrémenter le compteur pour le destinataire
    const newConversations = conversations.map(conv => 
      conv.id === activeConversation
        ? { 
            ...conv, 
            lastMessage: content, 
            lastMessageAt: now,
            lastMessageSenderId: user.id,
            unreadCounts: {
              ...conv.unreadCounts,
              [receiverId]: (conv.unreadCounts[receiverId] || 0) + 1
            }
          }
        : conv
    )

    setMessages(newMessages)
    setConversations(newConversations)
    saveGlobalData(newConversations, newMessages)

    // Simuler la livraison après 1 seconde
    setTimeout(() => {
      setMessages(prev => {
        const updated = {
          ...prev,
          [activeConversation]: (prev[activeConversation] || []).map(msg =>
            msg.id === newMessage.id ? { ...msg, status: 'delivered' as MessageStatus, deliveredAt: new Date().toISOString() } : msg
          )
        }
        // Sauvegarder
        const currentConvs = JSON.parse(localStorage.getItem(GLOBAL_CONVERSATIONS_KEY) || '[]')
        localStorage.setItem(GLOBAL_MESSAGES_KEY, JSON.stringify(updated))
        return updated
      })
    }, 1000)
  }, [user, activeConversation, conversations, messages, saveGlobalData])

  // Marquer les messages comme lus
  const markAsRead = useCallback((conversationId: string) => {
    if (!user?.id) return

    const now = new Date().toISOString()

    // Mettre à jour les messages reçus comme lus
    const newMessages = {
      ...messages,
      [conversationId]: (messages[conversationId] || []).map(msg => 
        msg.receiverId === user.id && msg.status !== 'read'
          ? { ...msg, status: 'read' as MessageStatus, readAt: now }
          : msg
      )
    }

    // Réinitialiser le compteur de non lus pour cet utilisateur
    const newConversations = conversations.map(conv =>
      conv.id === conversationId 
        ? { 
            ...conv, 
            unreadCounts: {
              ...conv.unreadCounts,
              [user.id]: 0
            }
          }
        : conv
    )

    setMessages(newMessages)
    setConversations(newConversations)
    saveGlobalData(newConversations, newMessages)
  }, [user?.id, messages, conversations, saveGlobalData])

  // Obtenir les messages d'une conversation
  const getConversationMessages = useCallback((conversationId: string): PrivateMessage[] => {
    return messages[conversationId] || []
  }, [messages])

  const value: MessagesContextType = {
    conversations,
    messages,
    activeConversation,
    isOpen,
    totalUnread,
    openConversation,
    selectConversation,
    closeMessages,
    toggleMessages,
    sendMessage,
    markAsRead,
    getConversationMessages,
    setActiveConversationNull,
    getParticipantInfo
  }

  return (
    <MessagesContext.Provider value={value}>
      {children}
    </MessagesContext.Provider>
  )
}

/**
 * Hook pour utiliser les messages
 */
export function useMessages() {
  const context = useContext(MessagesContext)
  if (!context) {
    return defaultContextValue
  }
  return context
}
