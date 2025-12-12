import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, MessageCircle, Share2, Bookmark, Trophy, Star, Megaphone, Check, Flag, Trash2, MoreHorizontal, X } from 'lucide-react'
import { useUserData } from '../../contexts/UserDataContext'
import { useAuth } from '../../contexts/AuthContext'
import { useReports } from '../../contexts/ReportsContext'
import { useNotifications } from '../../contexts/NotificationsContext'
import { useAdminStats } from '../../contexts/AdminStatsContext'
import { useActivity } from '../../contexts/ActivityContext'

interface FeedCardProps {
  id: string
  type: 'post' | 'achievement' | 'milestone' | 'recommendation' | 'announcement'
  authorId?: string
  authorName?: string
  authorAvatar?: string
  content: string
  media?: string[]
  createdAt: string
  likes: number
  commentsCount: number
  isSponsored?: boolean
  isLiked?: boolean
  onLike?: () => void
  onDelete?: () => void
  onComment?: (id: string) => void
}

const typeConfig = {
  post: { icon: null, accent: 'border-dark-700/50' },
  achievement: { icon: Trophy, accent: 'border-amber-500/30 bg-amber-500/5' },
  milestone: { icon: Star, accent: 'border-purple-500/30 bg-purple-500/5' },
  recommendation: { icon: null, accent: 'border-primary-500/30 bg-primary-500/5' },
  announcement: { icon: Megaphone, accent: 'border-green-500/30 bg-green-500/5' },
}

/**
 * FeedCard - Carte de publication pour le feed
 * Avec signalement, suppression admin et likes globaux
 */
export function FeedCard({
  id,
  type,
  authorId,
  authorName,
  authorAvatar,
  content,
  media,
  createdAt,
  likes,
  commentsCount,
  isSponsored,
  isLiked: isLikedProp,
  onLike: onLikeProp,
  onDelete,
  onComment,
}: FeedCardProps) {
  const { user } = useAuth()
  const { isSaved, saveItem, unsaveItem } = useUserData()
  const { addReport } = useReports()
  const { addNotification } = useNotifications()
  const { incrementReports } = useAdminStats()
  const { addActivity } = useActivity()
  
  const liked = isLikedProp ?? false
  const saved = isSaved(id)
  const [showShareToast, setShowShareToast] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [reportSubmitted, setReportSubmitted] = useState(false)
  const [showLoginAlert, setShowLoginAlert] = useState(false)

  // Vérifier si l'utilisateur peut supprimer (auteur ou admin)
  const canDelete = user && (user.id === authorId || user.role === 'admin')
  const isAdmin = user?.role === 'admin'

  const config = typeConfig[type]
  const Icon = config.icon

  const handleLike = () => {
    if (onLikeProp) {
      onLikeProp()
    }
  }

  const handleSave = () => {
    if (saved) {
      unsaveItem(id)
    } else {
      saveItem(id, 'post', content.substring(0, 50))
      
      // Envoyer une notification à l'auteur (si ce n'est pas soi-même)
      if (user && authorId && authorId !== user.id) {
        addNotification({
          type: 'save',
          title: 'Enregistrement',
          message: `${user.username} a enregistré votre publication`,
          fromUserId: user.id,
          fromUserName: user.username,
          targetId: id,
          targetType: 'post',
          targetUrl: `/feed#${id}`,
        })
      }
    }
  }

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/post/${id}`)
      setShowShareToast(true)
      setTimeout(() => setShowShareToast(false), 2000)
      
      // Envoyer une notification à l'auteur (si ce n'est pas soi-même)
      if (user && authorId && authorId !== user.id) {
        addNotification({
          type: 'share',
          title: 'Partage',
          message: `${user.username} a partagé votre publication`,
          fromUserId: user.id,
          fromUserName: user.username,
          targetId: id,
          targetType: 'post',
          targetUrl: `/feed#${id}`,
        })
      }
    } catch {
      setShowShareToast(true)
      setTimeout(() => setShowShareToast(false), 2000)
    }
  }

  const handleComment = () => {
    onComment?.(id)
  }

  const handleDelete = () => {
    if (onDelete) {
      onDelete()
    }
    setShowMenu(false)
  }

  // Ouvrir le modal de signalement (vérifie connexion)
  const openReportModal = () => {
    if (!user) {
      setShowLoginAlert(true)
      setTimeout(() => setShowLoginAlert(false), 3000)
      setShowMenu(false)
      return
    }
    setShowReportModal(true)
    setShowMenu(false)
  }

  const handleReport = () => {
    if (!reportReason.trim()) return
    
    if (!user) {
      setShowLoginAlert(true)
      setTimeout(() => setShowLoginAlert(false), 3000)
      return
    }
    
    // Envoyer le signalement au contexte
    addReport({
      contentId: id,
      contentType: 'post',
      contentPreview: content.substring(0, 200),
      contentAuthorId: authorId || 'unknown',
      contentAuthorName: authorName || 'Utilisateur',
      reporterId: user.id,
      reporterName: user.username,
      reason: reportReason,
    })
    
    // +1 dans les stats admin
    incrementReports()
    
    // Ajouter à l'historique des activités
    addActivity({
      type: 'report_submitted',
      message: `${user.username} a signalé un post`,
      userId: user.id,
      userName: user.username,
      targetId: id
    })
    
    setReportSubmitted(true)
    setTimeout(() => {
      setShowReportModal(false)
      setReportReason('')
      setReportSubmitted(false)
    }, 2000)
  }

  const reportReasons = [
    'Contenu inapproprié',
    'Spam ou publicité',
    'Harcèlement',
    'Fausses informations',
    'Contenu haineux',
    'Autre'
  ]

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-6 bg-dark-800/50 border rounded-2xl ${config.accent} transition-all hover:shadow-lg relative`}
    >
      {/* Share toast */}
      {showShareToast && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="absolute top-4 right-4 flex items-center gap-2 px-3 py-2 bg-green-500 text-white text-sm rounded-lg shadow-lg z-10"
        >
          <Check className="w-4 h-4" />
          Lien copié !
        </motion.div>
      )}

      {/* Login alert */}
      {showLoginAlert && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="absolute top-4 right-4 flex items-center gap-2 px-3 py-2 bg-amber-500 text-white text-sm rounded-lg shadow-lg z-10"
        >
          <Flag className="w-4 h-4" />
          Connectez-vous pour signaler
        </motion.div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {authorAvatar ? (
            <img
              src={authorAvatar}
              alt={authorName}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white font-bold">
              {authorName?.[0] || 'W'}
            </div>
          )}
          <div>
            {authorName && (
              <p className="font-semibold text-white hover:text-primary-400 cursor-pointer transition-colors">
                {authorName}
              </p>
            )}
            <p className="text-sm text-dark-400">{createdAt}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-5 h-5 text-amber-400" />}
          {isSponsored && (
            <span className="px-2 py-1 text-xs bg-dark-700 text-dark-400 rounded-full">
              Sponsorisé
            </span>
          )}
          
          {/* Menu contextuel */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 text-dark-400 hover:text-white rounded-lg hover:bg-dark-700 transition-colors"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>

            <AnimatePresence>
              {showMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-48 bg-dark-800 border border-dark-700 rounded-xl shadow-xl overflow-hidden z-50"
                  >
                    {/* Signaler */}
                    <button
                      onClick={openReportModal}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left text-dark-300 hover:bg-dark-700 hover:text-white transition-colors"
                    >
                      <Flag className="w-4 h-4" />
                      Signaler
                    </button>

                    {/* Supprimer (auteur ou admin) */}
                    {canDelete && (
                      <button
                        onClick={handleDelete}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left text-red-400 hover:bg-red-500/20 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        {isAdmin && user?.id !== authorId ? 'Supprimer (Admin)' : 'Supprimer'}
                      </button>
                    )}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mb-4">
        <p className="text-white whitespace-pre-wrap">{content}</p>
      </div>

      {/* Media */}
      {media && media.length > 0 && (
        <div className={`mb-4 rounded-xl overflow-hidden ${
          media.length === 1 ? '' : 'grid grid-cols-2 gap-2'
        }`}>
          {media.map((url, index) => (
            <img
              key={index}
              src={url}
              alt=""
              className="w-full h-48 object-cover cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => window.open(url, '_blank')}
            />
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-dark-700/50">
        <div className="flex items-center gap-6">
          <button 
            onClick={handleLike}
            className={`flex items-center gap-2 transition-colors group ${
              liked ? 'text-red-400' : 'text-dark-400 hover:text-red-400'
            }`}
          >
            <Heart className={`w-5 h-5 group-hover:scale-110 transition-transform ${liked ? 'fill-current' : ''}`} />
            <span className="text-sm">{likes}</span>
          </button>
          <button 
            onClick={handleComment}
            className="flex items-center gap-2 text-dark-400 hover:text-primary-400 transition-colors group"
          >
            <MessageCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="text-sm">{commentsCount}</span>
          </button>
          <button 
            onClick={handleShare}
            className="flex items-center gap-2 text-dark-400 hover:text-green-400 transition-colors group"
          >
            <Share2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </button>
        </div>
        <button 
          onClick={handleSave}
          className={`transition-colors ${
            saved ? 'text-amber-400' : 'text-dark-400 hover:text-amber-400'
          }`}
        >
          <Bookmark className={`w-5 h-5 ${saved ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* Modal de signalement */}
      <AnimatePresence>
        {showReportModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowReportModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md bg-dark-800 border border-dark-700 rounded-2xl overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-dark-700">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Flag className="w-5 h-5 text-red-400" />
                  Signaler ce contenu
                </h3>
                <button 
                  onClick={() => setShowReportModal(false)}
                  className="p-2 text-dark-400 hover:text-white rounded-lg hover:bg-dark-700 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {reportSubmitted ? (
                <div className="p-8 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Check className="w-8 h-8 text-green-400" />
                  </div>
                  <p className="text-white font-medium">Signalement envoyé</p>
                  <p className="text-dark-400 text-sm mt-2">Merci pour votre contribution à la communauté</p>
                </div>
              ) : (
                <>
                  <div className="p-4 space-y-3">
                    <p className="text-dark-400 text-sm mb-4">Pourquoi signalez-vous ce contenu ?</p>
                    {reportReasons.map(reason => (
                      <button
                        key={reason}
                        onClick={() => setReportReason(reason)}
                        className={`w-full text-left px-4 py-3 rounded-xl transition-colors ${
                          reportReason === reason
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : 'bg-dark-700 text-dark-300 hover:text-white border border-transparent'
                        }`}
                      >
                        {reason}
                      </button>
                    ))}
                  </div>

                  <div className="p-4 border-t border-dark-700">
                    <button
                      onClick={handleReport}
                      disabled={!reportReason}
                      className="w-full py-3 bg-red-500 text-white font-semibold rounded-xl hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Envoyer le signalement
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  )
}
