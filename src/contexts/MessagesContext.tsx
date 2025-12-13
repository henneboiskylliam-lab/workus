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
  participantId: string
  participantName: string
  participantAvatar?: string
  lastMessage?: string
  lastMessageAt?: string
  lastMessageStatus?: MessageStatus
  lastMessageSenderId?: string
  unreadCount: number
  isOnline?: boolean
  lastSeen?: string
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
  markAsDelivered: (conversationId: string) => void
  getConversationMessages: (conversationId: string) => PrivateMessage[]
  setActiveConversationNull: () => void
}

const MESSAGES_STORAGE_KEY = 'workus_private_messages'
const CONVERSATIONS_STORAGE_KEY = 'workus_conversations'

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
  markAsDelivered: () => {},
  getConversationMessages: () => [],
  setActiveConversationNull: () => {}
}

const MessagesContext = createContext<MessagesContextType>(defaultContextValue)

interface MessagesProviderProps {
  children: ReactNode
}

/**
 * MessagesProvider - Gère les messages privés avec persistance localStorage
 * Inclut un système d'accusé de réception complet
 */
export function MessagesProvider({ children }: MessagesProviderProps) {
  const { user } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<Record<string, PrivateMessage[]>>({})
  const [activeConversation, setActiveConversation] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  // Charger les données depuis localStorage
  useEffect(() => {
    if (!user?.id) return

    const loadData = () => {
      try {
        const storedConversations = localStorage.getItem(`${CONVERSATIONS_STORAGE_KEY}_${user.id}`)
        const storedMessages = localStorage.getItem(`${MESSAGES_STORAGE_KEY}_${user.id}`)
        
        if (storedConversations) {
          setConversations(JSON.parse(storedConversations))
        }
        if (storedMessages) {
          setMessages(JSON.parse(storedMessages))
        }
      } catch (error) {
        console.error('Erreur chargement messages:', error)
      }
    }

    loadData()
  }, [user?.id])

  // Sauvegarder les données
  useEffect(() => {
    if (!user?.id) return
    localStorage.setItem(`${CONVERSATIONS_STORAGE_KEY}_${user.id}`, JSON.stringify(conversations))
  }, [conversations, user?.id])

  useEffect(() => {
    if (!user?.id) return
    localStorage.setItem(`${MESSAGES_STORAGE_KEY}_${user.id}`, JSON.stringify(messages))
  }, [messages, user?.id])

  // Simuler la livraison des messages après 1 seconde
  useEffect(() => {
    const pendingMessages = Object.values(messages).flat().filter(msg => 
      msg.senderId === user?.id && msg.status === 'sent'
    )

    if (pendingMessages.length > 0) {
      const timeout = setTimeout(() => {
        setMessages(prev => {
          const updated = { ...prev }
          Object.keys(updated).forEach(convId => {
            updated[convId] = updated[convId].map(msg => 
              msg.senderId === user?.id && msg.status === 'sent'
                ? { ...msg, status: 'delivered' as MessageStatus, deliveredAt: new Date().toISOString() }
                : msg
            )
          })
          return updated
        })

        // Mettre à jour le statut dans les conversations
        setConversations(prev => prev.map(conv => {
          if (conv.lastMessageSenderId === user?.id && conv.lastMessageStatus === 'sent') {
            return { ...conv, lastMessageStatus: 'delivered' as MessageStatus }
          }
          return conv
        }))
      }, 1000)

      return () => clearTimeout(timeout)
    }
  }, [messages, user?.id])

  // Calculer le total de non lus
  const totalUnread = conversations.reduce((sum, conv) => sum + conv.unreadCount, 0)

  // Générer un ID de conversation unique
  const getConversationId = useCallback((userId1: string, userId2: string) => {
    return [userId1, userId2].sort().join('_')
  }, [])

  // Ouvrir une conversation (ou la créer si elle n'existe pas)
  const openConversation = useCallback((userId: string, userName: string, userAvatar?: string) => {
    if (!user?.id) return

    const conversationId = getConversationId(user.id, userId)
    
    // Vérifier si la conversation existe déjà
    const existingConv = conversations.find(c => c.id === conversationId)
    
    if (!existingConv) {
      // Créer une nouvelle conversation
      const newConversation: Conversation = {
        id: conversationId,
        participantId: userId,
        participantName: userName,
        participantAvatar: userAvatar,
        unreadCount: 0
      }
      setConversations(prev => [newConversation, ...prev])
    }

    setActiveConversation(conversationId)
    setIsOpen(true)
  }, [user?.id, conversations, getConversationId])

  // Sélectionner une conversation existante
  const selectConversation = useCallback((conversationId: string) => {
    setActiveConversation(conversationId)
  }, [])

  // Remettre activeConversation à null (pour revenir à la liste)
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

    const now = new Date().toISOString()
    const newMessage: PrivateMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      conversationId: activeConversation,
      senderId: user.id,
      senderName: user.username || 'Moi',
      receiverId: conversation.participantId,
      receiverName: conversation.participantName,
      content: content.trim(),
      status: 'sending',
      createdAt: now
    }

    // Ajouter le message
    setMessages(prev => ({
      ...prev,
      [activeConversation]: [...(prev[activeConversation] || []), newMessage]
    }))

    // Mettre à jour la conversation
    setConversations(prev => prev.map(conv => 
      conv.id === activeConversation
        ? { 
            ...conv, 
            lastMessage: content, 
            lastMessageAt: now,
            lastMessageStatus: 'sending' as MessageStatus,
            lastMessageSenderId: user.id
          }
        : conv
    ))

    // Simuler l'envoi (passe à 'sent' après 300ms)
    setTimeout(() => {
      setMessages(prev => ({
        ...prev,
        [activeConversation]: (prev[activeConversation] || []).map(msg =>
          msg.id === newMessage.id ? { ...msg, status: 'sent' as MessageStatus } : msg
        )
      }))
      
      setConversations(prev => prev.map(conv => 
        conv.id === activeConversation && conv.lastMessageSenderId === user.id
          ? { ...conv, lastMessageStatus: 'sent' as MessageStatus }
          : conv
      ))
    }, 300)
  }, [user, activeConversation, conversations])

  // Marquer les messages comme lus
  const markAsRead = useCallback((conversationId: string) => {
    if (!user?.id) return

    const now = new Date().toISOString()

    // Marquer tous les messages reçus comme lus
    setMessages(prev => ({
      ...prev,
      [conversationId]: (prev[conversationId] || []).map(msg => 
        msg.receiverId === user.id && msg.status !== 'read'
          ? { ...msg, status: 'read' as MessageStatus, readAt: now }
          : msg
      )
    }))

    // Réinitialiser le compteur de non lus
    setConversations(prev => prev.map(conv =>
      conv.id === conversationId 
        ? { ...conv, unreadCount: 0 }
        : conv
    ))

    // Mettre à jour le statut des messages envoyés par l'autre utilisateur
    // (simuler que l'autre utilisateur voit que nous avons lu)
    setMessages(prev => ({
      ...prev,
      [conversationId]: (prev[conversationId] || []).map(msg => 
        msg.senderId !== user.id && (msg.status === 'sent' || msg.status === 'delivered')
          ? { ...msg, status: 'read' as MessageStatus, readAt: now }
          : msg
      )
    }))
  }, [user?.id])

  // Marquer les messages comme livrés
  const markAsDelivered = useCallback((conversationId: string) => {
    if (!user?.id) return

    const now = new Date().toISOString()

    setMessages(prev => ({
      ...prev,
      [conversationId]: (prev[conversationId] || []).map(msg => 
        msg.receiverId === user.id && msg.status === 'sent'
          ? { ...msg, status: 'delivered' as MessageStatus, deliveredAt: now }
          : msg
      )
    }))
  }, [user?.id])

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
    markAsDelivered,
    getConversationMessages,
    setActiveConversationNull
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
