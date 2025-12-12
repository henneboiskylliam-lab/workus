import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Play, Target, Clock, Users, Star, Bookmark, Share2, Plus, Search, X,
  Heart, MessageCircle, GraduationCap, Crown, Check, Image, Send,
  Filter, ChevronRight, Award, Shield, Video, FileText
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useUserData } from '../contexts/UserDataContext'
import { useContentManagement } from '../contexts/ContentManagementContext'
import specialtyContentData from '../data/specialtyContent.json'

type TabType = 'feed' | 'formations'

interface FeedPost {
  id: string
  authorId: string
  authorName: string
  authorAvatar?: string
  authorRole: 'user' | 'creator' | 'partner'
  content: string
  media?: string[]
  tags: string[]
  createdAt: string
  likes: number
  comments: number
  type: 'video' | 'article' | 'tip' | 'question'
}

interface PaidFormation {
  id: string
  title: string
  description: string
  instructor: {
    id: string
    name: string
    avatar: string
    bio: string
    verified: boolean
  }
  price: number
  currency: string
  originalPrice?: number
  discount?: number
  duration: string
  modules: number
  students: number
  rating: number
  reviewsCount: number
  level: string
  tags: string[]
  thumbnail: string
  features: string[]
  isPartner: boolean
  specialtyId: string
}

/**
 * SpecialtyPage - Page spécialité avec feed créateurs et formations payantes
 */
export function SpecialtyPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { user, isAuthenticated, hasPermission } = useAuth()
  const { isLiked, likeItem, unlikeItem, isSaved, saveItem, unsaveItem } = useUserData()
  
  const [activeTab, setActiveTab] = useState<TabType>('feed')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showToast, setShowToast] = useState<string | null>(null)
  
  // Feed posts state (vide par défaut - rempli par les créateurs)
  const [feedPosts, setFeedPosts] = useState<FeedPost[]>([])
  
  // Nouveau post state
  const [newPostContent, setNewPostContent] = useState('')
  const [newPostType, setNewPostType] = useState<'video' | 'article' | 'tip' | 'question'>('tip')
  const [newPostTags, setNewPostTags] = useState('')
  const [newPostMedia, setNewPostMedia] = useState<string[]>([])
  const [isPosting, setIsPosting] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { specialties, getCategoryById } = useContentManagement()
  const { paidFormations, partnerApplicationInfo } = specialtyContentData

  // Trouver la spécialité
  const specialty = specialties.find(s => s.slug === slug)
  const category = specialty ? getCategoryById(specialty.categoryId) : null
  
  // Formations payantes pour cette spécialité
  const formations: PaidFormation[] = specialty ? (paidFormations as Record<string, PaidFormation[]>)[specialty.slug] || [] : []

  // Tags populaires (extraits des posts existants + formations)
  const popularTags = [...new Set([
    ...formations.flatMap(f => f.tags),
    ...feedPosts.flatMap(p => p.tags)
  ])].slice(0, 10)

  // Si pas de spécialité trouvée
  if (!specialty) {
    return (
      <div className="max-w-4xl mx-auto text-center py-20">
        <Target className="w-16 h-16 text-dark-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">Spécialité non trouvée</h1>
        <p className="text-dark-400 mb-6">Cette spécialité n'existe pas ou n'est plus disponible</p>
        <button
          onClick={() => navigate('/categories')}
          className="px-6 py-3 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors"
        >
          Voir les catégories
        </button>
      </div>
    )
  }

  // Filtrer les posts par recherche et tags
  const filteredPosts = feedPosts.filter(post => {
    const matchesSearch = !searchQuery || 
      post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesTags = selectedTags.length === 0 ||
      selectedTags.some(tag => post.tags.includes(tag))
    
    return matchesSearch && matchesTags
  })

  // Notification toast
  const showNotification = (message: string) => {
    setShowToast(message)
    setTimeout(() => setShowToast(null), 3000)
  }

  // Toggle tag filter
  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  // Like un post
  const handleLikePost = (postId: string) => {
    if (!isAuthenticated) {
      showNotification('Connectez-vous pour liker')
      return
    }
    
    if (isLiked(postId)) {
      unlikeItem(postId)
    } else {
      likeItem(postId, 'post')
    }
    
    setFeedPosts(prev => prev.map(post => 
      post.id === postId 
        ? { ...post, likes: isLiked(postId) ? post.likes - 1 : post.likes + 1 }
        : post
    ))
  }

  // Publier un nouveau post
  const handleCreatePost = async () => {
    if (!newPostContent.trim()) {
      showNotification('Ajoutez du contenu à votre publication')
      return
    }
    
    if (!isAuthenticated || !hasPermission('canCreateContent')) {
      showNotification('Vous devez être créateur pour publier')
      return
    }

    setIsPosting(true)
    await new Promise(resolve => setTimeout(resolve, 500))

    const newPost: FeedPost = {
      id: `post-${Date.now()}`,
      authorId: user!.id,
      authorName: user!.username,
      authorRole: user!.role as 'user' | 'creator' | 'partner',
      content: newPostContent,
      media: newPostMedia,
      tags: newPostTags.split(',').map(t => t.trim()).filter(t => t),
      createdAt: new Date().toISOString(),
      likes: 0,
      comments: 0,
      type: newPostType,
    }

    setFeedPosts(prev => [newPost, ...prev])
    setNewPostContent('')
    setNewPostTags('')
    setNewPostMedia([])
    setShowCreateModal(false)
    setIsPosting(false)
    showNotification('Publication créée avec succès !')
  }

  // Gérer l'upload d'image
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    Array.from(files).forEach(file => {
      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result) {
          setNewPostMedia(prev => [...prev, event.target!.result as string])
        }
      }
      reader.readAsDataURL(file)
    })
  }

  // Supprimer une image
  const removeImage = (index: number) => {
    setNewPostMedia(prev => prev.filter((_, i) => i !== index))
  }

  // Format date
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

  if (!specialty) {
    return (
      <div className="text-center py-20">
        <Target className="w-16 h-16 text-dark-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">Spécialité non trouvée</h1>
        <button onClick={() => navigate('/categories')} className="text-primary-400 hover:underline">
          Voir toutes les catégories
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Toast */}
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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-cyan-500 flex items-center justify-center">
              <Target className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                {specialty.name}
              </h1>
              <p className="text-dark-400 max-w-2xl">
                {specialty.description}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => isSaved(specialty.id) ? unsaveItem(specialty.id) : saveItem(specialty.id, 'resource', specialty.name)}
              className={`p-3 border rounded-xl transition-all ${
                isSaved(specialty.id) 
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                  : 'bg-dark-800 border-dark-700 text-dark-300 hover:text-white hover:border-dark-600'
              }`}
            >
              <Bookmark className={`w-5 h-5 ${isSaved(specialty.id) ? 'fill-current' : ''}`} />
            </button>
            <button className="p-3 bg-dark-800 border border-dark-700 rounded-xl text-dark-300 hover:text-white hover:border-dark-600 transition-all">
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Meta info */}
        <div className="flex flex-wrap items-center gap-4">
          {category && (
            <span className="px-3 py-1 rounded-full text-sm font-medium bg-primary-500/20 text-primary-400">
              {category.icon} {category.name}
            </span>
          )}
          <div className="flex items-center gap-1 text-dark-400">
            <Users className="w-4 h-4" />
            <span className="text-sm">{feedPosts.length} publications</span>
          </div>
          <div className="flex items-center gap-1 text-dark-400">
            <GraduationCap className="w-4 h-4" />
            <span className="text-sm">{formations.length} formations</span>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('feed')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all ${
            activeTab === 'feed'
              ? 'bg-primary-500 text-white'
              : 'bg-dark-800 text-dark-300 hover:text-white border border-dark-700'
          }`}
        >
          <FileText className="w-4 h-4" />
          Contenu Gratuit
          <span className={`px-2 py-0.5 text-xs rounded-full ${
            activeTab === 'feed' ? 'bg-white/20' : 'bg-dark-700'
          }`}>
            {feedPosts.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('formations')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all ${
            activeTab === 'formations'
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
              : 'bg-dark-800 text-dark-300 hover:text-white border border-dark-700'
          }`}
        >
          <Crown className="w-4 h-4" />
          Formations Premium
          <span className={`px-2 py-0.5 text-xs rounded-full ${
            activeTab === 'formations' ? 'bg-white/20' : 'bg-dark-700'
          }`}>
            {formations.length}
          </span>
        </button>
      </div>

      {/* Content */}
      <div className="grid lg:grid-cols-4 gap-8">
        {/* Main content */}
        <div className="lg:col-span-3">
          {activeTab === 'feed' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {/* Search & Filter */}
              <div className="flex gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Rechercher par contenu ou tag..."
                    className="w-full pl-12 pr-4 py-3 bg-dark-800 border border-dark-700 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:border-primary-500"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-dark-400 hover:text-white"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
                {isAuthenticated && hasPermission('canCreateContent') && (
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-primary-500/20 transition-all"
                  >
                    <Plus className="w-5 h-5" />
                    Publier
                  </button>
                )}
              </div>

              {/* Tags filter */}
              {popularTags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {popularTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                        selectedTags.includes(tag)
                          ? 'bg-primary-500 text-white'
                          : 'bg-dark-800 text-dark-300 hover:text-white border border-dark-700'
                      }`}
                    >
                      #{tag}
                    </button>
                  ))}
                  {selectedTags.length > 0 && (
                    <button
                      onClick={() => setSelectedTags([])}
                      className="px-3 py-1.5 text-sm text-red-400 hover:text-red-300"
                    >
                      Effacer filtres
                    </button>
                  )}
                </div>
              )}

              {/* Feed posts */}
              {filteredPosts.length === 0 ? (
                <div className="text-center py-16 bg-dark-800/50 border border-dark-700/50 rounded-2xl">
                  <Video className="w-16 h-16 text-dark-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">Aucun contenu pour le moment</h3>
                  <p className="text-dark-400 mb-6 max-w-md mx-auto">
                    {isAuthenticated && hasPermission('canCreateContent')
                      ? 'Soyez le premier à publier du contenu dans cette spécialité !'
                      : 'Les créateurs n\'ont pas encore publié de contenu ici.'}
                  </p>
                  {isAuthenticated && hasPermission('canCreateContent') && (
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-medium rounded-xl hover:shadow-lg transition-all"
                    >
                      <Plus className="w-5 h-5 inline mr-2" />
                      Créer le premier contenu
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredPosts.map((post, index) => (
                    <motion.article
                      key={post.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-6 bg-dark-800/50 border border-dark-700/50 rounded-2xl"
                    >
                      {/* Post header */}
                      <div className="flex items-start gap-4 mb-4">
                        <div className={`w-12 h-12 rounded-full bg-gradient-to-br flex items-center justify-center text-white font-bold ${
                          post.authorRole === 'partner' ? 'from-amber-500 to-orange-500' :
                          post.authorRole === 'creator' ? 'from-primary-500 to-cyan-500' :
                          'from-accent-400 to-accent-600'
                        }`}>
                          {post.authorName[0].toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-white">{post.authorName}</p>
                            {post.authorRole === 'partner' && (
                              <span className="px-2 py-0.5 text-xs bg-amber-500/20 text-amber-400 rounded-full flex items-center gap-1">
                                <Crown className="w-3 h-3" />
                                Partenaire
                              </span>
                            )}
                            {post.authorRole === 'creator' && (
                              <span className="px-2 py-0.5 text-xs bg-primary-500/20 text-primary-400 rounded-full flex items-center gap-1">
                                <Award className="w-3 h-3" />
                                Créateur
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-dark-400">{formatDate(post.createdAt)}</p>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded-lg ${
                          post.type === 'video' ? 'bg-red-500/20 text-red-400' :
                          post.type === 'article' ? 'bg-blue-500/20 text-blue-400' :
                          post.type === 'tip' ? 'bg-green-500/20 text-green-400' :
                          'bg-purple-500/20 text-purple-400'
                        }`}>
                          {post.type === 'video' ? '📹 Vidéo' :
                           post.type === 'article' ? '📝 Article' :
                           post.type === 'tip' ? '💡 Astuce' : '❓ Question'}
                        </span>
                      </div>

                      {/* Content */}
                      <p className="text-white mb-4 whitespace-pre-wrap">{post.content}</p>

                      {/* Media */}
                      {post.media && post.media.length > 0 && (
                        <div className={`mb-4 rounded-xl overflow-hidden ${
                          post.media.length === 1 ? '' : 'grid grid-cols-2 gap-2'
                        }`}>
                          {post.media.map((url, i) => (
                            <img key={i} src={url} alt="" className="w-full h-48 object-cover" />
                          ))}
                        </div>
                      )}

                      {/* Tags */}
                      {post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {post.tags.map(tag => (
                            <button
                              key={tag}
                              onClick={() => toggleTag(tag)}
                              className="px-2 py-1 text-xs bg-dark-700/50 text-dark-300 rounded hover:bg-primary-500/20 hover:text-primary-400 transition-colors"
                            >
                              #{tag}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-6 pt-4 border-t border-dark-700/50">
                        <button 
                          onClick={() => handleLikePost(post.id)}
                          className={`flex items-center gap-2 transition-colors ${
                            isLiked(post.id) ? 'text-red-400' : 'text-dark-400 hover:text-red-400'
                          }`}
                        >
                          <Heart className={`w-5 h-5 ${isLiked(post.id) ? 'fill-current' : ''}`} />
                          <span className="text-sm">{post.likes + (isLiked(post.id) ? 1 : 0)}</span>
                        </button>
                        <button className="flex items-center gap-2 text-dark-400 hover:text-primary-400 transition-colors">
                          <MessageCircle className="w-5 h-5" />
                          <span className="text-sm">{post.comments}</span>
                        </button>
                        <button className="flex items-center gap-2 text-dark-400 hover:text-green-400 transition-colors">
                          <Share2 className="w-5 h-5" />
                        </button>
                      </div>
                    </motion.article>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'formations' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {formations.length === 0 ? (
                <div className="text-center py-16 bg-dark-800/50 border border-dark-700/50 rounded-2xl">
                  <GraduationCap className="w-16 h-16 text-dark-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">Aucune formation disponible</h3>
                  <p className="text-dark-400 mb-6 max-w-md mx-auto">
                    Les formations partenaires pour cette spécialité seront bientôt disponibles.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {formations.map((formation, index) => (
                    <motion.div
                      key={formation.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-dark-800/50 border border-dark-700/50 rounded-2xl overflow-hidden hover:border-amber-500/30 transition-all"
                    >
                      <div className="md:flex">
                        {/* Thumbnail */}
                        <div className="md:w-80 flex-shrink-0">
                          <div 
                            className="h-48 md:h-full bg-cover bg-center"
                            style={{ backgroundImage: `url(${formation.thumbnail})` }}
                          >
                            <div className="w-full h-full bg-gradient-to-t from-dark-900/80 to-transparent flex items-end p-4">
                              {formation.discount && (
                                <span className="px-3 py-1 bg-red-500 text-white text-sm font-bold rounded-full">
                                  -{formation.discount}%
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 p-6">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <span className="px-2 py-1 text-xs bg-amber-500/20 text-amber-400 rounded-full flex items-center gap-1">
                                  <Crown className="w-3 h-3" />
                                  Formation Partenaire
                                </span>
                                <span className="text-xs text-dark-400">{formation.level}</span>
                              </div>
                              <h3 className="text-xl font-bold text-white mb-2">{formation.title}</h3>
                            </div>
                          </div>

                          <p className="text-dark-400 mb-4 line-clamp-2">{formation.description}</p>

                          {/* Instructor */}
                          <div className="flex items-center gap-3 mb-4">
                            <img 
                              src={formation.instructor.avatar} 
                              alt={formation.instructor.name}
                              className="w-10 h-10 rounded-full"
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-white">{formation.instructor.name}</p>
                                {formation.instructor.verified && (
                                  <Shield className="w-4 h-4 text-primary-400" />
                                )}
                              </div>
                              <p className="text-xs text-dark-400">{formation.instructor.bio}</p>
                            </div>
                          </div>

                          {/* Stats */}
                          <div className="flex flex-wrap items-center gap-4 mb-4 text-sm">
                            <div className="flex items-center gap-1 text-amber-400">
                              <Star className="w-4 h-4 fill-current" />
                              <span>{formation.rating}</span>
                              <span className="text-dark-400">({formation.reviewsCount} avis)</span>
                            </div>
                            <div className="flex items-center gap-1 text-dark-400">
                              <Users className="w-4 h-4" />
                              <span>{formation.students.toLocaleString()} étudiants</span>
                            </div>
                            <div className="flex items-center gap-1 text-dark-400">
                              <Clock className="w-4 h-4" />
                              <span>{formation.duration}</span>
                            </div>
                            <div className="flex items-center gap-1 text-dark-400">
                              <GraduationCap className="w-4 h-4" />
                              <span>{formation.modules} modules</span>
                            </div>
                          </div>

                          {/* Features */}
                          <div className="flex flex-wrap gap-2 mb-4">
                            {formation.features.slice(0, 3).map((feature, i) => (
                              <span key={i} className="flex items-center gap-1 text-xs text-dark-300">
                                <Check className="w-3 h-3 text-accent-400" />
                                {feature}
                              </span>
                            ))}
                          </div>

                          {/* Price & CTA */}
                          <div className="flex items-center justify-between pt-4 border-t border-dark-700/50">
                            <div>
                              <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-bold text-white">{formation.price}€</span>
                                {formation.originalPrice && (
                                  <span className="text-lg text-dark-500 line-through">{formation.originalPrice}€</span>
                                )}
                              </div>
                              <p className="text-xs text-dark-400">Accès à vie</p>
                            </div>
                            <button className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-amber-500/20 transition-all flex items-center gap-2">
                              Voir la formation
                              <ChevronRight className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Become partner */}
          <div className="p-6 bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-2xl">
            <Crown className="w-10 h-10 text-amber-400 mb-4" />
            <h3 className="font-bold text-white mb-2">{partnerApplicationInfo.title}</h3>
            <p className="text-sm text-dark-400 mb-4">{partnerApplicationInfo.description}</p>
            <ul className="space-y-2 mb-4">
              {partnerApplicationInfo.benefits.slice(0, 3).map((benefit, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-dark-300">
                  <Check className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  {benefit}
                </li>
              ))}
            </ul>
            <button className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-amber-500/20 transition-all">
              Devenir Partenaire
            </button>
          </div>

          {/* Popular tags */}
          {popularTags.length > 0 && (
            <div className="p-6 bg-dark-800/50 border border-dark-700/50 rounded-2xl">
              <h3 className="font-semibold text-white mb-4">Tags populaires</h3>
              <div className="flex flex-wrap gap-2">
                {popularTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => {
                      setActiveTab('feed')
                      toggleTag(tag)
                    }}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                      selectedTags.includes(tag)
                        ? 'bg-primary-500 text-white'
                        : 'bg-dark-700 text-dark-300 hover:text-white'
                    }`}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="p-6 bg-dark-800/50 border border-dark-700/50 rounded-2xl">
            <h3 className="font-semibold text-white mb-4">Statistiques</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-dark-400">Publications</span>
                <span className="text-white font-medium">{feedPosts.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-dark-400">Formations</span>
                <span className="text-white font-medium">{formations.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-dark-400">Créateurs actifs</span>
                <span className="text-white font-medium">
                  {new Set(feedPosts.map(p => p.authorId)).size}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

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
              className="w-full max-w-xl bg-dark-800 border border-dark-700 rounded-2xl overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-dark-700">
                <h3 className="text-lg font-semibold text-white">Publier dans {specialty.name}</h3>
                <button 
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 text-dark-400 hover:text-white rounded-lg hover:bg-dark-700 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-4 space-y-4">
                {/* Type selector */}
                <div className="flex gap-2">
                  {[
                    { id: 'video', label: '📹 Vidéo', color: 'red' },
                    { id: 'article', label: '📝 Article', color: 'blue' },
                    { id: 'tip', label: '💡 Astuce', color: 'green' },
                    { id: 'question', label: '❓ Question', color: 'purple' },
                  ].map(type => (
                    <button
                      key={type.id}
                      onClick={() => setNewPostType(type.id as any)}
                      className={`px-3 py-2 rounded-lg text-sm transition-all ${
                        newPostType === type.id
                          ? `bg-${type.color}-500/20 text-${type.color}-400 border border-${type.color}-500/50`
                          : 'bg-dark-700 text-dark-300 hover:text-white'
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>

                {/* Content */}
                <textarea
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  placeholder="Partagez votre contenu, astuce ou question..."
                  rows={4}
                  className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:border-primary-500 resize-none"
                />

                {/* Tags */}
                <input
                  type="text"
                  value={newPostTags}
                  onChange={(e) => setNewPostTags(e.target.value)}
                  placeholder="Tags (séparés par des virgules)"
                  className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:border-primary-500"
                />

                {/* Images preview */}
                {newPostMedia.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {newPostMedia.map((media, i) => (
                      <div key={i} className="relative aspect-video rounded-lg overflow-hidden">
                        <img src={media} alt="" className="w-full h-full object-cover" />
                        <button
                          onClick={() => removeImage(i)}
                          className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white hover:bg-red-500 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add media */}
                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2 bg-dark-700 text-dark-300 rounded-lg hover:text-white transition-colors"
                  >
                    <Image className="w-5 h-5" />
                    Ajouter des images
                  </button>
                </div>
              </div>

              <div className="p-4 border-t border-dark-700">
                <button
                  onClick={handleCreatePost}
                  disabled={!newPostContent.trim() || isPosting}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-semibold rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
    </div>
  )
}
