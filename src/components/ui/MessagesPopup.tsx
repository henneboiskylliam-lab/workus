import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MessageCircle, X, Send, ArrowLeft, Search, 
  Check, CheckCheck, Clock, Loader2
} from 'lucide-react'
import { useMessages, MessageStatus } from '../../contexts/MessagesContext'
import { useAuth } from '../../contexts/AuthContext'

/**
 * Composant pour afficher le statut du message
 */
function MessageStatusIcon({ status, isOwn }: { status: MessageStatus; isOwn: boolean }) {
  if (!isOwn) return null

  switch (status) {
    case 'sending':
      return <Clock className="w-3 h-3 text-dark-400" />
    case 'sent':
      return <Check className="w-3 h-3 text-dark-400" />
    case 'delivered':
      return <CheckCheck className="w-3 h-3 text-dark-400" />
    case 'read':
      return <CheckCheck className="w-3 h-3 text-primary-300" />
    default:
      return null
  }
}

/**
 * MessagesPopup - Bulle de messagerie privée
 * Affiche les conversations et permet d'envoyer des messages
 * Inclut un système d'accusé de réception (envoyé, reçu, lu)
 */
export function MessagesPopup() {
  const { user } = useAuth()
  const {
    conversations,
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
    setActiveConversationNull
  } = useMessages()

  const [messageInput, setMessageInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [view, setView] = useState<'list' | 'chat'>('list')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Scroll automatique vers le bas lors de nouveaux messages
  const chatMessages = activeConversation ? getConversationMessages(activeConversation) : []
  
  useEffect(() => {
    if (view === 'chat' && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [chatMessages.length, view])

  // Focus sur l'input quand le chat s'ouvre
  useEffect(() => {
    if (view === 'chat' && isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [view, isOpen])

  // Passer en mode chat quand une conversation est active
  useEffect(() => {
    if (activeConversation && isOpen) {
      setView('chat')
      markAsRead(activeConversation)
    }
  }, [activeConversation, isOpen, markAsRead])

  // Réinitialiser la vue quand on ferme
  useEffect(() => {
    if (!isOpen) {
      // Ne pas réinitialiser immédiatement pour l'animation
      setTimeout(() => {
        if (!isOpen) {
          setView('list')
          setActiveConversationNull()
        }
      }, 300)
    }
  }, [isOpen, setActiveConversationNull])

  const handleSend = () => {
    if (!messageInput.trim()) return
    sendMessage(messageInput)
    setMessageInput('')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleBack = () => {
    setView('list')
    setActiveConversationNull()
  }

  const handleSelectConversation = (conversationId: string) => {
    const conv = conversations.find(c => c.id === conversationId)
    if (conv) {
      selectConversation(conversationId)
      openConversation(conv.participantId, conv.participantName, conv.participantAvatar)
    }
  }

  const activeConv = conversations.find(c => c.id === activeConversation)

  // Filtrer les conversations
  const filteredConversations = conversations.filter(conv =>
    conv.participantName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Formater le temps
  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    if (diff < 60000) return 'À l\'instant'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}min`
    if (diff < 86400000) return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    if (diff < 604800000) {
      const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
      return days[date.getDay()]
    }
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
  }

  // Obtenir le texte de statut pour la liste
  const getStatusText = (conv: typeof conversations[0]) => {
    if (!conv.lastMessageStatus || conv.lastMessageSenderId !== user?.id) return null
    
    switch (conv.lastMessageStatus) {
      case 'sending': return 'Envoi...'
      case 'sent': return 'Envoyé'
      case 'delivered': return 'Reçu'
      case 'read': return 'Lu'
      default: return null
    }
  }

  return (
    <>
      {/* Bouton flottant */}
      <button
        onClick={toggleMessages}
        className="relative p-2 text-dark-400 hover:text-white hover:bg-dark-700 rounded-xl transition-all"
        title="Messages"
      >
        <MessageCircle className="w-5 h-5" />
        {totalUnread > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-5 h-5 bg-primary-500 text-white text-xs font-bold rounded-full flex items-center justify-center"
          >
            {totalUnread > 9 ? '9+' : totalUnread}
          </motion.span>
        )}
      </button>

      {/* Popup de messages */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 top-full mt-2 w-96 bg-dark-800 border border-dark-700 rounded-2xl shadow-2xl overflow-hidden z-50"
          >
            {/* Header */}
            <div className="p-4 border-b border-dark-700 bg-dark-800/80 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                {view === 'chat' && activeConv ? (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleBack}
                      className="p-1.5 hover:bg-dark-700 rounded-lg transition-colors"
                      title="Retour à la liste"
                    >
                      <ArrowLeft className="w-5 h-5 text-dark-400 hover:text-white" />
                    </button>
                    <button
                      onClick={() => window.location.href = `/profile/${activeConv.participantId}`}
                      className="flex items-center gap-2 hover:bg-dark-700/50 rounded-lg px-2 py-1 transition-colors"
                      title="Voir le profil"
                    >
                      {activeConv.participantAvatar ? (
                        <img 
                          src={activeConv.participantAvatar} 
                          alt={activeConv.participantName}
                          className="w-8 h-8 rounded-full object-cover ring-2 ring-transparent hover:ring-primary-500 transition-all"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white text-sm font-bold">
                          {activeConv.participantName[0].toUpperCase()}
                        </div>
                      )}
                      <div className="text-left">
                        <span className="font-medium text-white text-sm">{activeConv.participantName}</span>
                        <p className="text-xs text-dark-500">Cliquez pour voir le profil</p>
                      </div>
                    </button>
                  </div>
                ) : (
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-primary-400" />
                    Messages
                    {totalUnread > 0 && (
                      <span className="text-sm font-normal text-primary-400">({totalUnread})</span>
                    )}
                  </h3>
                )}
                <button
                  onClick={closeMessages}
                  className="p-1.5 hover:bg-dark-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-dark-400 hover:text-white" />
                </button>
              </div>

              {/* Barre de recherche (liste uniquement) */}
              {view === 'list' && (
                <div className="mt-3 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
                  <input
                    type="text"
                    placeholder="Rechercher une conversation..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-dark-700 border border-dark-600 rounded-xl text-white placeholder-dark-500 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                  />
                </div>
              )}
            </div>

            {/* Contenu */}
            <div className="h-96 overflow-hidden">
              {view === 'list' ? (
                // Liste des conversations
                <div className="h-full overflow-y-auto">
                  {filteredConversations.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                      <div className="w-16 h-16 bg-dark-700 rounded-full flex items-center justify-center mb-4">
                        <MessageCircle className="w-8 h-8 text-dark-500" />
                      </div>
                      <p className="text-dark-400 text-sm">
                        {searchQuery ? 'Aucune conversation trouvée' : 'Aucune conversation'}
                      </p>
                      <p className="text-dark-500 text-xs mt-1">
                        Visitez un profil et cliquez sur "Message" pour démarrer
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-dark-700/50">
                      {filteredConversations.map(conv => (
                        <button
                          key={conv.id}
                          onClick={() => handleSelectConversation(conv.id)}
                          className={`w-full p-4 flex items-center gap-3 hover:bg-dark-700/50 transition-colors text-left ${
                            conv.unreadCount > 0 ? 'bg-primary-500/5' : ''
                          }`}
                        >
                          {/* Avatar */}
                          <div className="relative">
                            {conv.participantAvatar ? (
                              <img 
                                src={conv.participantAvatar} 
                                alt={conv.participantName}
                                className="w-12 h-12 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white font-bold">
                                {conv.participantName[0].toUpperCase()}
                              </div>
                            )}
                            {/* Indicateur en ligne (simulé) */}
                            {conv.isOnline && (
                              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-dark-800 rounded-full" />
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className={`font-medium truncate ${
                                conv.unreadCount > 0 ? 'text-white' : 'text-dark-200'
                              }`}>
                                {conv.participantName}
                              </span>
                              {conv.lastMessageAt && (
                                <span className={`text-xs ${
                                  conv.unreadCount > 0 ? 'text-primary-400' : 'text-dark-500'
                                }`}>
                                  {formatTime(conv.lastMessageAt)}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              {/* Statut du dernier message (si envoyé par nous) */}
                              {conv.lastMessageSenderId === user?.id && conv.lastMessageStatus && (
                                <MessageStatusIcon status={conv.lastMessageStatus} isOwn={true} />
                              )}
                              {conv.lastMessage && (
                                <p className={`text-sm truncate ${
                                  conv.unreadCount > 0 ? 'text-dark-300 font-medium' : 'text-dark-400'
                                }`}>
                                  {conv.lastMessageSenderId === user?.id && 'Vous: '}
                                  {conv.lastMessage}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Badge non lu */}
                          {conv.unreadCount > 0 && (
                            <motion.span
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="min-w-[20px] h-5 px-1.5 bg-primary-500 text-white text-xs font-bold rounded-full flex items-center justify-center"
                            >
                              {conv.unreadCount}
                            </motion.span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                // Vue chat
                <div className="h-full flex flex-col">
                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {chatMessages.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 bg-dark-700 rounded-full flex items-center justify-center mb-4">
                          <MessageCircle className="w-8 h-8 text-dark-500" />
                        </div>
                        <p className="text-dark-400 text-sm">Aucun message</p>
                        <p className="text-dark-500 text-xs mt-1">Commencez la conversation !</p>
                      </div>
                    ) : (
                      <>
                        {chatMessages.map((msg, index) => {
                          const isOwn = msg.senderId === user?.id
                          const showAvatar = !isOwn && (
                            index === 0 || 
                            chatMessages[index - 1].senderId !== msg.senderId
                          )
                          
                          return (
                            <motion.div
                              key={msg.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                            >
                              {/* Avatar (pour les messages reçus) */}
                              {!isOwn && (
                                <div className="w-8 mr-2">
                                  {showAvatar && activeConv && (
                                    activeConv.participantAvatar ? (
                                      <img 
                                        src={activeConv.participantAvatar}
                                        alt={activeConv.participantName}
                                        className="w-8 h-8 rounded-full object-cover"
                                      />
                                    ) : (
                                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white text-xs font-bold">
                                        {activeConv.participantName[0].toUpperCase()}
                                      </div>
                                    )
                                  )}
                                </div>
                              )}

                              <div
                                className={`max-w-[75%] px-4 py-2.5 rounded-2xl ${
                                  isOwn
                                    ? 'bg-primary-500 text-white rounded-br-md'
                                    : 'bg-dark-700 text-white rounded-bl-md'
                                } ${msg.status === 'sending' ? 'opacity-70' : ''}`}
                              >
                                <p className="text-sm leading-relaxed">{msg.content}</p>
                                <div className={`flex items-center justify-end gap-1 mt-1 ${
                                  isOwn ? 'text-primary-200' : 'text-dark-500'
                                }`}>
                                  <span className="text-[10px]">{formatTime(msg.createdAt)}</span>
                                  <MessageStatusIcon status={msg.status} isOwn={isOwn} />
                                </div>
                              </div>
                            </motion.div>
                          )
                        })}
                        <div ref={messagesEndRef} />
                      </>
                    )}
                  </div>

                  {/* Input */}
                  <div className="p-3 border-t border-dark-700 bg-dark-800/50">
                    <div className="flex items-center gap-2">
                      <input
                        ref={inputRef}
                        type="text"
                        placeholder="Écrivez votre message..."
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="flex-1 px-4 py-2.5 bg-dark-700 border border-dark-600 rounded-xl text-white placeholder-dark-500 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-transparent"
                      />
                      <motion.button
                        onClick={handleSend}
                        disabled={!messageInput.trim()}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="p-2.5 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-colors"
                      >
                        <Send className="w-5 h-5" />
                      </motion.button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
