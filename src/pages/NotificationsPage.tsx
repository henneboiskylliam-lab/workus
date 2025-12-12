import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Trophy, MessageCircle, UserPlus, Sparkles, Info, Check, Trash2, CheckCheck } from 'lucide-react'
import mockUserData from '../data/mockUser.json'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  isRead: boolean
  createdAt: string
}

const typeConfig = {
  achievement: { icon: Trophy, color: 'from-amber-500 to-orange-500' },
  recommendation: { icon: Sparkles, color: 'from-primary-500 to-cyan-500' },
  follow: { icon: UserPlus, color: 'from-green-500 to-emerald-500' },
  comment: { icon: MessageCircle, color: 'from-secondary-500 to-pink-500' },
  system: { icon: Info, color: 'from-gray-500 to-slate-500' },
}

/**
 * NotificationsPage - Centre de notifications avec interactions fonctionnelles
 */
export function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>(
    mockUserData.notifications.map(n => ({ ...n }))
  )
  const [showToast, setShowToast] = useState<string | null>(null)

  // Afficher une notification toast
  const showNotification = (message: string) => {
    setShowToast(message)
    setTimeout(() => setShowToast(null), 3000)
  }

  // Marquer une notification comme lue
  const handleMarkAsRead = (notifId: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === notifId ? { ...n, isRead: true } : n
    ))
    showNotification('Notification marquée comme lue')
  }

  // Supprimer une notification
  const handleDelete = (notifId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notifId))
    showNotification('Notification supprimée')
  }

  // Marquer toutes comme lues
  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    showNotification('Toutes les notifications ont été marquées comme lues')
  }

  // Supprimer toutes les notifications lues
  const handleClearRead = () => {
    const readCount = notifications.filter(n => n.isRead).length
    if (readCount === 0) {
      showNotification('Aucune notification lue à supprimer')
      return
    }
    setNotifications(prev => prev.filter(n => !n.isRead))
    showNotification(`${readCount} notification(s) supprimée(s)`)
  }

  const unreadCount = notifications.filter(n => !n.isRead).length

  return (
    <div className="max-w-3xl mx-auto">
      {/* Toast notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-20 right-4 z-50 flex items-center gap-2 px-4 py-3 bg-green-500 text-white rounded-xl shadow-lg"
          >
            <Check className="w-5 h-5" />
            {showToast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
            <Bell className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Notifications</h1>
            <p className="text-dark-400">
              {unreadCount > 0 ? `${unreadCount} non lue${unreadCount > 1 ? 's' : ''}` : 'Toutes lues'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button 
              onClick={handleMarkAllAsRead}
              className="flex items-center gap-2 px-4 py-2 text-primary-400 hover:text-primary-300 hover:bg-primary-500/10 rounded-lg transition-all"
            >
              <CheckCheck className="w-4 h-4" />
              Tout marquer comme lu
            </button>
          )}
          {notifications.some(n => n.isRead) && (
            <button 
              onClick={handleClearRead}
              className="flex items-center gap-2 px-4 py-2 text-dark-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
            >
              <Trash2 className="w-4 h-4" />
              Effacer les lues
            </button>
          )}
        </div>
      </div>

      {/* Empty state */}
      {notifications.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-20"
        >
          <Bell className="w-16 h-16 text-dark-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Aucune notification</h2>
          <p className="text-dark-400">Vous n'avez pas de notifications pour le moment</p>
        </motion.div>
      ) : (
        <>
          {/* Notifications list */}
          <div className="space-y-3">
            <AnimatePresence>
              {notifications.map((notif, index) => {
                const config = typeConfig[notif.type as keyof typeof typeConfig] || typeConfig.system
                const Icon = config.icon
                const date = new Date(notif.createdAt)
                const timeAgo = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60))
                
                return (
                  <motion.div
                    key={notif.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20, height: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`flex items-start gap-4 p-4 rounded-2xl transition-all cursor-pointer group ${
                      notif.isRead 
                        ? 'bg-dark-800/30 border border-dark-700/30' 
                        : 'bg-primary-500/5 border border-primary-500/20'
                    }`}
                    onClick={() => !notif.isRead && handleMarkAsRead(notif.id)}
                  >
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${config.color} flex items-center justify-center flex-shrink-0`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-white">{notif.title}</h3>
                        {!notif.isRead && (
                          <span className="w-2 h-2 bg-primary-500 rounded-full animate-pulse" />
                        )}
                      </div>
                      <p className="text-dark-400 text-sm">{notif.message}</p>
                      <p className="text-dark-500 text-xs mt-1">
                        {timeAgo < 1 ? 'À l\'instant' : 
                         timeAgo < 24 ? `Il y a ${timeAgo}h` : 
                         date.toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!notif.isRead && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation()
                            handleMarkAsRead(notif.id)
                          }}
                          className="p-2 text-dark-400 hover:text-primary-400 hover:bg-primary-500/10 rounded-lg transition-all"
                          title="Marquer comme lu"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                      <button 
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(notif.id)
                        }}
                        className="p-2 text-dark-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>

          {/* Stats */}
          <div className="mt-8 pt-6 border-t border-dark-700/50">
            <div className="flex items-center justify-center gap-8 text-center">
              <div>
                <p className="text-2xl font-bold text-white">{notifications.length}</p>
                <p className="text-sm text-dark-400">Total</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary-400">{unreadCount}</p>
                <p className="text-sm text-dark-400">Non lues</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-400">{notifications.length - unreadCount}</p>
                <p className="text-sm text-dark-400">Lues</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
