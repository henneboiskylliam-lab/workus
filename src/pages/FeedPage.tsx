import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Filter, TrendingUp, X, Image, Send, Check } from 'lucide-react'
import { FeedCard } from '../components/ui'
import { useAuth } from '../contexts/AuthContext'
import { usePosts } from '../contexts/PostsContext'
import { useNotifications } from '../contexts/NotificationsContext'
import { useAdminStats } from '../contexts/AdminStatsContext'
import { useActivity } from '../contexts/ActivityContext'

/**
 * FeedPage - Page du fil d'actualités avec publications persistantes et partagées
 * Les publications sont visibles par tous les utilisateurs et persistent entre les sessions
 */
export function FeedPage() {
  const { user, isAuthenticated } = useAuth()
  const { posts, addPost, deletePost, likePost, unlikePost, isLikedByUser } = usePosts()
  const { addNotification } = useNotifications()
  const { incrementContent } = useAdminStats()
  const { addActivity } = useActivity()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // État pour la création de post
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newPostContent, setNewPostContent] = useState('')
  const [newPostMedia, setNewPostMedia] = useState<string[]>([])
  const [isPosting, setIsPosting] = useState(false)
  const [showToast, setShowToast] = useState<string | null>(null)
  
  // État pour les filtres
  const [activeFilter, setActiveFilter] = useState<string | null>(null)
  const [showFilterMenu, setShowFilterMenu] = useState(false)

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    
    if (diffHours < 1) return 'À l\'instant'
    if (diffHours < 24) return `Il y a ${diffHours}h`
    const diffDays = Math.floor(diffHours / 24)
    if (diffDays === 1) return 'Hier'
    return `Il y a ${diffDays}j`
  }

  // Notification toast
  const showNotification = (message: string) => {
    setShowToast(message)
    setTimeout(() => setShowToast(null), 3000)
  }

  // Gérer l'upload de photos
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    // Maximum 4 images
    const remainingSlots = 4 - newPostMedia.length
    if (remainingSlots <= 0) {
      showNotification('Maximum 4 images par publication')
      return
    }

    Array.from(files).slice(0, remainingSlots).forEach(file => {
      // Vérifier le type
      if (!file.type.startsWith('image/')) {
        showNotification('Seules les images sont acceptées')
        return
      }

      // Vérifier la taille (max 5MB par image)
      if (file.size > 5 * 1024 * 1024) {
        showNotification('Les images ne doivent pas dépasser 5MB')
        return
      }

      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result) {
          setNewPostMedia(prev => [...prev, event.target!.result as string])
        }
      }
      reader.readAsDataURL(file)
    })

    // Reset input
    e.target.value = ''
  }

  // Supprimer une photo
  const removePhoto = (index: number) => {
    setNewPostMedia(prev => prev.filter((_, i) => i !== index))
  }

  // Créer un nouveau post
  const handleCreatePost = async () => {
    if (!newPostContent.trim() && newPostMedia.length === 0) {
      showNotification('Ajoutez du texte ou une image')
      return
    }
    
    if (!isAuthenticated || !user) {
      showNotification('Connectez-vous pour publier')
      return
    }

    setIsPosting(true)
    
    // Simuler un délai réseau
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Utiliser le contexte pour ajouter le post (persistant et partagé)
    addPost({
      type: 'post',
      authorId: user.id,
      authorName: user.username,
      content: newPostContent,
      media: newPostMedia.length > 0 ? newPostMedia : undefined,
    })
    
    // +1 dans les stats admin
    incrementContent()
    
    // Ajouter à l'historique des activités
    addActivity({
      type: 'content_published',
      message: `${user.username} a publié un nouveau post`,
      userId: user.id,
      userName: user.username,
      metadata: { contentPreview: newPostContent.substring(0, 50) }
    })
    
    setNewPostContent('')
    setNewPostMedia([])
    setShowCreateModal(false)
    setIsPosting(false)
    showNotification('Publication créée avec succès !')
  }

  // Gérer le like
  const handleLike = (postId: string) => {
    if (!isAuthenticated || !user) {
      showNotification('Connectez-vous pour aimer')
      return
    }

    const post = posts.find(p => p.id === postId)
    
    if (isLikedByUser(postId, user.id)) {
      unlikePost(postId, user.id)
    } else {
      likePost(postId, user.id)
      
      // Envoyer une notification à l'auteur (si ce n'est pas soi-même)
      if (post && post.authorId !== user.id) {
        addNotification({
          type: 'like',
          title: 'Nouveau like',
          message: `${user.username} a aimé votre publication`,
          fromUserId: user.id,
          fromUserName: user.username,
          targetId: postId,
          targetType: 'post',
          targetUrl: `/feed#${postId}`,
        })
      }
    }
  }

  // Supprimer un post (auteur ou admin)
  const handleDeletePost = (postId: string) => {
    deletePost(postId)
    showNotification('Publication supprimée')
  }

  // Filtrer les posts
  const filteredPosts = activeFilter
    ? posts.filter(post => post.type === activeFilter)
    : posts

  const filters = [
    { id: null, label: 'Tout' },
    { id: 'post', label: 'Publications' },
    { id: 'achievement', label: 'Achievements' },
    { id: 'announcement', label: 'Annonces' },
  ]

  return (
    <div className="max-w-3xl mx-auto">
      {/* Input file caché */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        multiple
        onChange={handlePhotoUpload}
        className="hidden"
      />

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
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Feed</h1>
          <p className="text-dark-400">
            Découvrez les dernières actualités
            <span className="text-primary-400"> • {posts.length} publications</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Filter dropdown */}
          <div className="relative">
            <button 
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              className={`flex items-center gap-2 px-4 py-2 bg-dark-800 border rounded-xl transition-all ${
                activeFilter ? 'border-primary-500 text-primary-400' : 'border-dark-700 text-dark-300 hover:text-white hover:border-dark-600'
              }`}
            >
              <Filter className="w-4 h-4" />
              Filtrer
            </button>
            
            <AnimatePresence>
              {showFilterMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowFilterMenu(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-48 bg-dark-800 border border-dark-700 rounded-xl shadow-xl overflow-hidden z-50"
                  >
                    {filters.map(filter => (
                      <button
                        key={filter.id || 'all'}
                        onClick={() => {
                          setActiveFilter(filter.id)
                          setShowFilterMenu(false)
                        }}
                        className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                          activeFilter === filter.id
                            ? 'bg-primary-500/20 text-primary-400'
                            : 'text-dark-300 hover:bg-dark-700 hover:text-white'
                        }`}
                      >
                        {filter.label}
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
          
          {isAuthenticated && (
            <button 
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-primary-500/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              Publier
            </button>
          )}
        </div>
      </div>

      {/* Create post card */}
      {isAuthenticated && user && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-dark-800/50 border border-dark-700/50 rounded-2xl"
        >
          <div 
            className="flex items-center gap-4 cursor-pointer"
            onClick={() => setShowCreateModal(true)}
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-400 to-accent-600 flex items-center justify-center text-white font-bold">
              {user.username[0].toUpperCase()}
            </div>
            <div className="flex-1 bg-dark-700/50 border border-dark-600 rounded-xl px-4 py-3 text-dark-400">
              Partagez une idée, une question, une découverte...
            </div>
          </div>
        </motion.div>
      )}

      {/* Create post modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-lg bg-dark-800 border border-dark-700 rounded-2xl overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              {/* Modal header */}
              <div className="flex items-center justify-between p-4 border-b border-dark-700">
                <h3 className="text-lg font-semibold text-white">Créer une publication</h3>
                <button 
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 text-dark-400 hover:text-white rounded-lg hover:bg-dark-700 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Modal content */}
              <div className="p-4">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-400 to-accent-600 flex items-center justify-center text-white font-bold">
                    {user?.username[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-white">{user?.username}</p>
                    <p className="text-sm text-dark-400">Publication publique • Visible par tous</p>
                  </div>
                </div>
                
                <textarea
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  placeholder="Qu'avez-vous en tête ?"
                  rows={4}
                  autoFocus
                  className="w-full bg-transparent text-white placeholder-dark-400 resize-none focus:outline-none text-lg"
                />

                {/* Images preview */}
                {newPostMedia.length > 0 && (
                  <div className={`grid gap-2 mb-4 ${
                    newPostMedia.length === 1 ? 'grid-cols-1' : 
                    newPostMedia.length === 2 ? 'grid-cols-2' : 
                    'grid-cols-2'
                  }`}>
                    {newPostMedia.map((media, index) => (
                      <div key={index} className="relative aspect-video rounded-xl overflow-hidden">
                        <img src={media} alt="" className="w-full h-full object-cover" />
                        <button
                          onClick={() => removePhoto(index)}
                          className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-full text-white hover:bg-red-500 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Media buttons */}
                <div className="flex items-center gap-2 pt-4 border-t border-dark-700">
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={newPostMedia.length >= 4}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                      newPostMedia.length >= 4 
                        ? 'text-dark-600 cursor-not-allowed'
                        : 'text-dark-400 hover:text-white hover:bg-dark-700'
                    }`}
                  >
                    <Image className="w-5 h-5" />
                    <span className="text-sm">Photo ({newPostMedia.length}/4)</span>
                  </button>
                </div>
              </div>
              
              {/* Modal footer */}
              <div className="p-4 border-t border-dark-700">
                <button
                  onClick={handleCreatePost}
                  disabled={(!newPostContent.trim() && newPostMedia.length === 0) || isPosting}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-primary-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isPosting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Publier
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Trending section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6 p-4 bg-dark-800/50 border border-dark-700/50 rounded-2xl"
      >
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-5 h-5 text-primary-400" />
          <h3 className="font-semibold text-white">Tendances</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {['#ReactTips', '#TypeScript', '#WebDev', '#CareerGrowth', '#AILearning'].map(tag => (
            <span 
              key={tag} 
              className="px-3 py-1 bg-dark-700/50 text-dark-300 rounded-full text-sm hover:bg-primary-500/20 hover:text-primary-400 cursor-pointer transition-all"
            >
              {tag}
            </span>
          ))}
        </div>
      </motion.div>

      {/* Feed items */}
      <div className="space-y-4">
        {filteredPosts.map((post, index) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + index * 0.05 }}
          >
            <FeedCard
              id={post.id}
              type={post.type}
              authorId={post.authorId}
              authorName={post.authorName}
              authorAvatar={post.authorAvatar}
              content={post.content}
              media={post.media}
              createdAt={formatDate(post.createdAt)}
              likes={post.likes}
              commentsCount={post.commentsCount}
              isSponsored={post.isSponsored}
              isLiked={user ? isLikedByUser(post.id, user.id) : false}
              onLike={() => handleLike(post.id)}
              onDelete={() => handleDeletePost(post.id)}
            />
          </motion.div>
        ))}
      </div>

      {/* Empty state */}
      {filteredPosts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-dark-400">Aucune publication trouvée</p>
          {isAuthenticated && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 px-6 py-3 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors"
            >
              Créer la première publication
            </button>
          )}
        </div>
      )}

      {/* Load more */}
      {filteredPosts.length > 0 && (
        <div className="mt-8 text-center">
          <button className="px-6 py-3 bg-dark-800 border border-dark-700 rounded-xl text-dark-300 hover:text-white hover:border-dark-600 transition-all">
            Charger plus
          </button>
        </div>
      )}
    </div>
  )
}
