import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MessageSquare, Users, Lightbulb, Mail, HelpCircle, Briefcase,
  Plus, Search, Filter, ThumbsUp, MessageCircle, Eye, Pin, CheckCircle,
  X, Send, Check, ChevronDown, Image, Link2, Trash2, Flag, MoreHorizontal
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useReports } from '../contexts/ReportsContext'
import { useContentManagement } from '../contexts/ContentManagementContext'
import { useAdminStats } from '../contexts/AdminStatsContext'
import { useActivity } from '../contexts/ActivityContext'

type DiscussionType = 'public' | 'ideas' | 'messages' | 'help' | 'jobs'

interface Discussion {
  id: string
  title: string
  content: string
  author: string
  authorId: string
  authorAvatar?: string
  type: DiscussionType
  tags: string[]
  categoryId?: string
  specialtyId?: string
  createdAt: string
  likes: number
  comments: number
  views: number
  isPinned?: boolean
  isSolved?: boolean
  isLiked?: boolean
  media?: string[]
  links?: string[]
}

const DISCUSSIONS_STORAGE_KEY = 'workus_discussions'

const getInitialDiscussions = (): Discussion[] => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(DISCUSSIONS_STORAGE_KEY)
    if (stored) {
      try {
        return JSON.parse(stored)
      } catch {
        // Retourner tableau vide
      }
    }
  }
  // Site vierge - pas de discussions par défaut
  return []
}

const tabs = [
  { id: 'public', label: 'Discussions', icon: Users },
  { id: 'ideas', label: 'Idées', icon: Lightbulb },
  { id: 'messages', label: 'Messages', icon: Mail },
  { id: 'help', label: 'Aide', icon: HelpCircle },
  { id: 'jobs', label: 'Emplois', icon: Briefcase },
]

/**
 * DiscussionsPage - Hub des discussions avec photos, liens et signalement
 */
export function DiscussionsPage() {
  const { type } = useParams()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  const { addReport } = useReports()
  const { incrementReports, incrementContent } = useAdminStats()
  const { addActivity } = useActivity()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [activeTab, setActiveTab] = useState<DiscussionType>((type as DiscussionType) || 'public')
  const [searchQuery, setSearchQuery] = useState('')
  const [discussions, setDiscussions] = useState<Discussion[]>(getInitialDiscussions)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showToast, setShowToast] = useState<string | null>(null)
  
  // États pour le filtrage
  const [showFilterMenu, setShowFilterMenu] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(null)

  // États pour le signalement
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportingDiscussionId, setReportingDiscussionId] = useState<string | null>(null)
  const [reportReason, setReportReason] = useState('')
  const [reportSubmitted, setReportSubmitted] = useState(false)
  const [showLoginAlert, setShowLoginAlert] = useState(false)

  // Menu contextuel
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  // Données des catégories et spécialités depuis le contexte
  const { categories, specialties } = useContentManagement()

  // Spécialités filtrées par catégorie sélectionnée
  const filteredSpecialties = selectedCategory 
    ? specialties.filter(s => s.categoryId === selectedCategory)
    : specialties

  // Sauvegarder les discussions dans localStorage
  useEffect(() => {
    localStorage.setItem(DISCUSSIONS_STORAGE_KEY, JSON.stringify(discussions))
  }, [discussions])

  // Synchroniser l'onglet actif avec l'URL
  useEffect(() => {
    if (type && tabs.some(t => t.id === type)) {
      setActiveTab(type as DiscussionType)
    } else if (!type) {
      setActiveTab('public')
    }
  }, [type])

  // Changer d'onglet avec navigation
  const handleTabChange = (tabId: DiscussionType) => {
    setActiveTab(tabId)
    navigate(`/discussions/${tabId}`)
  }
  
  // Form state
  const [newTitle, setNewTitle] = useState('')
  const [newContent, setNewContent] = useState('')
  const [newTags, setNewTags] = useState('')
  const [newType, setNewType] = useState<DiscussionType>('public')
  const [newCategory, setNewCategory] = useState<string>('')
  const [newSpecialty, setNewSpecialty] = useState<string>('')
  const [newMedia, setNewMedia] = useState<string[]>([])
  const [newLink, setNewLink] = useState('')
  const [newLinks, setNewLinks] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Filtrer les discussions
  const filteredDiscussions = discussions
    .filter(d => activeTab === 'public' ? true : d.type === activeTab)
    .filter(d => {
      if (selectedCategory && d.categoryId !== selectedCategory) return false
      if (selectedSpecialty && d.specialtyId !== selectedSpecialty) return false
      return true
    })
    .filter(d => 
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
    )

  // Compter les filtres actifs
  const activeFiltersCount = (selectedCategory ? 1 : 0) + (selectedSpecialty ? 1 : 0)

  // Réinitialiser les filtres
  const clearFilters = () => {
    setSelectedCategory(null)
    setSelectedSpecialty(null)
  }

  // Afficher une notification
  const showNotification = (message: string) => {
    setShowToast(message)
    setTimeout(() => setShowToast(null), 3000)
  }

  // Gérer l'upload de photos
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const remainingSlots = 4 - newMedia.length
    if (remainingSlots <= 0) {
      showNotification('Maximum 4 images')
      return
    }

    Array.from(files).slice(0, remainingSlots).forEach(file => {
      if (!file.type.startsWith('image/')) {
        showNotification('Seules les images sont acceptées')
        return
      }

      if (file.size > 5 * 1024 * 1024) {
        showNotification('Image trop volumineuse (max 5MB)')
        return
      }

      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result) {
          setNewMedia(prev => [...prev, event.target!.result as string])
        }
      }
      reader.readAsDataURL(file)
    })

    e.target.value = ''
  }

  // Supprimer une photo
  const removePhoto = (index: number) => {
    setNewMedia(prev => prev.filter((_, i) => i !== index))
  }

  // Ajouter un lien
  const handleAddLink = () => {
    if (!newLink.trim()) return
    
    // Valider l'URL
    try {
      new URL(newLink.startsWith('http') ? newLink : `https://${newLink}`)
      setNewLinks(prev => [...prev, newLink.startsWith('http') ? newLink : `https://${newLink}`])
      setNewLink('')
    } catch {
      showNotification('URL invalide')
    }
  }

  // Supprimer un lien
  const removeLink = (index: number) => {
    setNewLinks(prev => prev.filter((_, i) => i !== index))
  }

  // Like une discussion
  const handleLike = (discussionId: string) => {
    if (!isAuthenticated) {
      showNotification('Connectez-vous pour voter')
      return
    }

    setDiscussions(prev => prev.map(d => {
      if (d.id === discussionId) {
        const newLiked = !d.isLiked
        return {
          ...d,
          isLiked: newLiked,
          likes: newLiked ? d.likes + 1 : d.likes - 1
        }
      }
      return d
    }))
  }

  // Supprimer une discussion (auteur ou admin)
  const handleDelete = (discussionId: string) => {
    setDiscussions(prev => prev.filter(d => d.id !== discussionId))
    setOpenMenuId(null)
    showNotification('Discussion supprimée')
  }

  // Ouvrir le modal de signalement (vérifie connexion)
  const handleOpenReport = (discussionId: string) => {
    if (!user) {
      setShowLoginAlert(true)
      setTimeout(() => setShowLoginAlert(false), 3000)
      setOpenMenuId(null)
      return
    }
    setReportingDiscussionId(discussionId)
    setShowReportModal(true)
    setOpenMenuId(null)
  }

  // Envoyer un signalement
  const handleReport = () => {
    if (!reportReason.trim() || !reportingDiscussionId) return
    
    if (!user) {
      setShowLoginAlert(true)
      setTimeout(() => setShowLoginAlert(false), 3000)
      return
    }
    
    const discussion = discussions.find(d => d.id === reportingDiscussionId)
    if (!discussion) return
    
    // Envoyer le signalement au contexte
    addReport({
      contentId: reportingDiscussionId,
      contentType: 'discussion',
      contentTitle: discussion.title,
      contentPreview: discussion.content.substring(0, 200),
      contentAuthorId: discussion.authorId,
      contentAuthorName: discussion.author,
      reporterId: user.id,
      reporterName: user.username,
      reason: reportReason,
    })
    
    // +1 dans les stats admin
    incrementReports()
    
    // Ajouter à l'historique des activités
    addActivity({
      type: 'report_submitted',
      message: `${user.username} a signalé une discussion`,
      userId: user.id,
      userName: user.username,
      targetId: reportingDiscussionId,
      targetName: discussion.title
    })
    
    setReportSubmitted(true)
    setTimeout(() => {
      setShowReportModal(false)
      setReportReason('')
      setReportSubmitted(false)
      setReportingDiscussionId(null)
    }, 2000)
  }

  // Créer une nouvelle discussion
  const handleCreateDiscussion = async () => {
    if (!newTitle.trim() || !newContent.trim()) {
      showNotification('Veuillez remplir tous les champs')
      return
    }

    setIsSubmitting(true)
    await new Promise(resolve => setTimeout(resolve, 500))

    const newDiscussion: Discussion = {
      id: `disc-${Date.now()}`,
      title: newTitle,
      content: newContent,
      author: user?.username || 'Anonyme',
      authorId: user?.id || 'anonymous',
      type: newType,
      tags: newTags.split(',').map(t => t.trim()).filter(t => t),
      categoryId: newCategory || undefined,
      specialtyId: newSpecialty || undefined,
      media: newMedia.length > 0 ? newMedia : undefined,
      links: newLinks.length > 0 ? newLinks : undefined,
      createdAt: 'À l\'instant',
      likes: 0,
      comments: 0,
      views: 1,
      isLiked: false
    }

    setDiscussions(prev => [newDiscussion, ...prev])
    
    // +1 dans les stats admin
    incrementContent()
    
    // Ajouter à l'historique des activités
    if (user) {
      addActivity({
        type: 'discussion_created',
        message: `${user.username} a créé une discussion : "${newTitle}"`,
        userId: user.id,
        userName: user.username,
        targetId: newDiscussion.id,
        targetName: newTitle
      })
    }
    
    setNewTitle('')
    setNewContent('')
    setNewTags('')
    setNewCategory('')
    setNewSpecialty('')
    setNewMedia([])
    setNewLinks([])
    setShowCreateModal(false)
    setIsSubmitting(false)
    showNotification('Discussion créée avec succès !')
  }

  // Obtenir le nom de la catégorie
  const getCategoryName = (categoryId?: string) => {
    if (!categoryId) return null
    const category = categories.find(c => c.id === categoryId)
    return category?.name
  }

  // Obtenir le nom de la spécialité
  const getSpecialtyName = (specialtyId?: string) => {
    if (!specialtyId) return null
    const specialty = specialties.find(s => s.id === specialtyId)
    return specialty?.name
  }

  // Vérifier si l'utilisateur peut supprimer
  const canDelete = (discussion: Discussion) => {
    return user && (user.id === discussion.authorId || user.role === 'admin')
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
    <div className="max-w-4xl mx-auto">
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
        {showLoginAlert && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-20 right-4 z-50 flex items-center gap-2 px-4 py-3 bg-amber-500 text-white rounded-xl shadow-lg"
          >
            <Flag className="w-5 h-5" />
            Connectez-vous pour signaler
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
            <MessageSquare className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Discussions</h1>
            <p className="text-dark-400">Échangez avec la communauté</p>
          </div>
        </div>
        {isAuthenticated && (
          <button 
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-primary-500/20 transition-all"
          >
            <Plus className="w-5 h-5" />
            Nouvelle discussion
          </button>
        )}
      </div>

      {/* Create Modal */}
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
              className="w-full max-w-xl bg-dark-800 border border-dark-700 rounded-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-dark-700">
                <h3 className="text-lg font-semibold text-white">Nouvelle discussion</h3>
                <button 
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 text-dark-400 hover:text-white rounded-lg hover:bg-dark-700 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-4 space-y-4">
                {/* Type selector */}
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">Type</label>
                  <div className="flex flex-wrap gap-2">
                    {tabs.filter(t => t.id !== 'messages').map(tab => {
                      const Icon = tab.icon
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setNewType(tab.id as DiscussionType)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                            newType === tab.id
                              ? 'bg-primary-500 text-white'
                              : 'bg-dark-700 text-dark-300 hover:text-white'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          {tab.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Category & Specialty */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-2">Catégorie</label>
                    <select
                      value={newCategory}
                      onChange={(e) => {
                        setNewCategory(e.target.value)
                        setNewSpecialty('')
                      }}
                      className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-xl text-white focus:outline-none focus:border-primary-500 appearance-none cursor-pointer"
                    >
                      <option value="">Toutes</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-2">Spécialité</label>
                    <select
                      value={newSpecialty}
                      onChange={(e) => setNewSpecialty(e.target.value)}
                      disabled={!newCategory}
                      className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-xl text-white focus:outline-none focus:border-primary-500 appearance-none cursor-pointer disabled:opacity-50"
                    >
                      <option value="">Toutes</option>
                      {specialties.filter(s => s.categoryId === newCategory).map(spec => (
                        <option key={spec.id} value={spec.id}>{spec.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">Titre</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Un titre accrocheur..."
                    className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:border-primary-500"
                  />
                </div>

                {/* Content */}
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">Contenu</label>
                  <textarea
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    placeholder="Décrivez votre question ou idée..."
                    rows={4}
                    className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:border-primary-500 resize-none"
                  />
                </div>

                {/* Media preview */}
                {newMedia.length > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    {newMedia.map((media, index) => (
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

                {/* Links preview */}
                {newLinks.length > 0 && (
                  <div className="space-y-2">
                    {newLinks.map((link, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-dark-700 rounded-lg">
                        <Link2 className="w-4 h-4 text-primary-400 flex-shrink-0" />
                        <a href={link} target="_blank" rel="noopener noreferrer" className="text-primary-400 text-sm truncate hover:underline flex-1">
                          {link}
                        </a>
                        <button
                          onClick={() => removeLink(index)}
                          className="p-1 text-dark-400 hover:text-red-400 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Media & Link buttons */}
                <div className="flex items-center gap-2 pt-2 border-t border-dark-700">
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={newMedia.length >= 4}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                      newMedia.length >= 4 
                        ? 'text-dark-600 cursor-not-allowed'
                        : 'text-dark-400 hover:text-white hover:bg-dark-700'
                    }`}
                  >
                    <Image className="w-5 h-5" />
                    <span className="text-sm">Photo ({newMedia.length}/4)</span>
                  </button>
                  
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      type="text"
                      value={newLink}
                      onChange={(e) => setNewLink(e.target.value)}
                      placeholder="Ajouter un lien..."
                      onKeyDown={(e) => e.key === 'Enter' && handleAddLink()}
                      className="flex-1 px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white text-sm placeholder-dark-400 focus:outline-none focus:border-primary-500"
                    />
                    <button
                      onClick={handleAddLink}
                      disabled={!newLink.trim()}
                      className="p-2 bg-dark-700 text-dark-400 rounded-lg hover:text-white hover:bg-dark-600 disabled:opacity-50 transition-colors"
                    >
                      <Link2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">Tags (séparés par des virgules)</label>
                  <input
                    type="text"
                    value={newTags}
                    onChange={(e) => setNewTags(e.target.value)}
                    placeholder="React, TypeScript, Question..."
                    className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:border-primary-500"
                  />
                </div>
              </div>

              <div className="p-4 border-t border-dark-700">
                <button
                  onClick={handleCreateDiscussion}
                  disabled={!newTitle.trim() || !newContent.trim() || isSubmitting}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-primary-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isSubmitting ? (
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

      {/* Report Modal */}
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
                  Signaler cette discussion
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
                  <p className="text-dark-400 text-sm mt-2">Merci pour votre contribution</p>
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

      {/* Tabs */}
      <div className="flex overflow-x-auto gap-2 mb-6 pb-2">
        {tabs.map(tab => {
          const Icon = tab.icon
          const count = discussions.filter(d => tab.id === 'public' ? true : d.type === tab.id).length
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id as DiscussionType)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-primary-500 text-white'
                  : 'bg-dark-800 text-dark-300 hover:text-white border border-dark-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              <span className={`px-2 py-0.5 text-xs rounded-full ${
                activeTab === tab.id ? 'bg-white/20' : 'bg-dark-700'
              }`}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Search & Filter */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher une discussion..."
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
        
        {/* Filter Button */}
        <div className="relative">
          <button 
            onClick={() => setShowFilterMenu(!showFilterMenu)}
            className={`flex items-center gap-2 px-4 py-3 bg-dark-800 border rounded-xl transition-all ${
              activeFiltersCount > 0 
                ? 'border-primary-500 text-primary-400' 
                : 'border-dark-700 text-dark-300 hover:text-white hover:border-dark-600'
            }`}
          >
            <Filter className="w-5 h-5" />
            Filtres
            {activeFiltersCount > 0 && (
              <span className="px-2 py-0.5 text-xs bg-primary-500 text-white rounded-full">
                {activeFiltersCount}
              </span>
            )}
            <ChevronDown className={`w-4 h-4 transition-transform ${showFilterMenu ? 'rotate-180' : ''}`} />
          </button>

          {/* Filter Menu */}
          <AnimatePresence>
            {showFilterMenu && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowFilterMenu(false)} 
                />
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 mt-2 w-80 bg-dark-800 border border-dark-700 rounded-xl shadow-xl overflow-hidden z-50"
                >
                  <div className="p-4 border-b border-dark-700">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-white">Filtrer par</h4>
                      {activeFiltersCount > 0 && (
                        <button 
                          onClick={clearFilters}
                          className="text-sm text-primary-400 hover:text-primary-300"
                        >
                          Réinitialiser
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="p-4 space-y-4">
                    {/* Catégorie */}
                    <div>
                      <label className="block text-sm font-medium text-dark-300 mb-2">Catégorie</label>
                      <div className="space-y-1 max-h-40 overflow-y-auto">
                        <button
                          onClick={() => {
                            setSelectedCategory(null)
                            setSelectedSpecialty(null)
                          }}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                            !selectedCategory 
                              ? 'bg-primary-500/20 text-primary-400' 
                              : 'text-dark-300 hover:bg-dark-700 hover:text-white'
                          }`}
                        >
                          Toutes les catégories
                        </button>
                        {categories.map(cat => (
                          <button
                            key={cat.id}
                            onClick={() => {
                              setSelectedCategory(cat.id)
                              setSelectedSpecialty(null)
                            }}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                              selectedCategory === cat.id 
                                ? 'bg-primary-500/20 text-primary-400' 
                                : 'text-dark-300 hover:bg-dark-700 hover:text-white'
                            }`}
                          >
                            {cat.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Spécialité */}
                    {selectedCategory && (
                      <div>
                        <label className="block text-sm font-medium text-dark-300 mb-2">Spécialité</label>
                        <div className="space-y-1 max-h-40 overflow-y-auto">
                          <button
                            onClick={() => setSelectedSpecialty(null)}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                              !selectedSpecialty 
                                ? 'bg-secondary-500/20 text-secondary-400' 
                                : 'text-dark-300 hover:bg-dark-700 hover:text-white'
                            }`}
                          >
                            Toutes les spécialités
                          </button>
                          {filteredSpecialties.map(spec => (
                            <button
                              key={spec.id}
                              onClick={() => setSelectedSpecialty(spec.id)}
                              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                                selectedSpecialty === spec.id 
                                  ? 'bg-secondary-500/20 text-secondary-400' 
                                  : 'text-dark-300 hover:bg-dark-700 hover:text-white'
                              }`}
                            >
                              {spec.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-4 border-t border-dark-700">
                    <button
                      onClick={() => setShowFilterMenu(false)}
                      className="w-full py-2 bg-primary-500 text-white font-medium rounded-lg hover:bg-primary-600 transition-colors"
                    >
                      Appliquer
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Active filters display */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {selectedCategory && (
            <span className="flex items-center gap-2 px-3 py-1 bg-primary-500/20 text-primary-400 rounded-full text-sm">
              {getCategoryName(selectedCategory)}
              <button onClick={() => {
                setSelectedCategory(null)
                setSelectedSpecialty(null)
              }}>
                <X className="w-4 h-4" />
              </button>
            </span>
          )}
          {selectedSpecialty && (
            <span className="flex items-center gap-2 px-3 py-1 bg-secondary-500/20 text-secondary-400 rounded-full text-sm">
              {getSpecialtyName(selectedSpecialty)}
              <button onClick={() => setSelectedSpecialty(null)}>
                <X className="w-4 h-4" />
              </button>
            </span>
          )}
        </div>
      )}

      {/* Discussions list */}
      <div className="space-y-4">
        {filteredDiscussions.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="w-16 h-16 text-dark-600 mx-auto mb-4" />
            <p className="text-dark-400">Aucune discussion trouvée</p>
            {activeFiltersCount > 0 && (
              <button
                onClick={clearFilters}
                className="mt-4 px-4 py-2 text-primary-400 hover:text-primary-300 transition-colors"
              >
                Réinitialiser les filtres
              </button>
            )}
            {isAuthenticated && activeFiltersCount === 0 && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 px-4 py-2 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors"
              >
                Créer la première discussion
              </button>
            )}
          </div>
        ) : (
          filteredDiscussions.map((discussion, index) => (
            <motion.article
              key={discussion.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`p-5 bg-dark-800/50 border rounded-2xl hover:border-primary-500/30 transition-all ${
                discussion.isPinned ? 'border-amber-500/30 bg-amber-500/5' : 'border-dark-700/50'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white font-bold">
                    {discussion.author[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-white hover:text-primary-400 transition-colors cursor-pointer">
                      {discussion.author}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-dark-400">
                      <span>{discussion.createdAt}</span>
                      {discussion.categoryId && (
                        <>
                          <span>•</span>
                          <span className="text-primary-400">{getCategoryName(discussion.categoryId)}</span>
                        </>
                      )}
                      {discussion.specialtyId && (
                        <>
                          <span>•</span>
                          <span className="text-secondary-400">{getSpecialtyName(discussion.specialtyId)}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {discussion.isPinned && (
                    <span className="flex items-center gap-1 text-amber-400 text-sm">
                      <Pin className="w-4 h-4" />
                      Épinglé
                    </span>
                  )}
                  {discussion.isSolved && (
                    <span className="flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-400 text-sm rounded-full">
                      <CheckCircle className="w-4 h-4" />
                      Résolu
                    </span>
                  )}
                  
                  {/* Menu contextuel */}
                  <div className="relative">
                    <button
                      onClick={() => setOpenMenuId(openMenuId === discussion.id ? null : discussion.id)}
                      className="p-2 text-dark-400 hover:text-white rounded-lg hover:bg-dark-700 transition-colors"
                    >
                      <MoreHorizontal className="w-5 h-5" />
                    </button>

                    <AnimatePresence>
                      {openMenuId === discussion.id && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setOpenMenuId(null)} />
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="absolute right-0 mt-2 w-48 bg-dark-800 border border-dark-700 rounded-xl shadow-xl overflow-hidden z-50"
                          >
                            <button
                              onClick={() => handleOpenReport(discussion.id)}
                              className="w-full flex items-center gap-3 px-4 py-3 text-left text-dark-300 hover:bg-dark-700 hover:text-white transition-colors"
                            >
                              <Flag className="w-4 h-4" />
                              Signaler
                            </button>
                            {canDelete(discussion) && (
                              <button
                                onClick={() => handleDelete(discussion.id)}
                                className="w-full flex items-center gap-3 px-4 py-3 text-left text-red-400 hover:bg-red-500/20 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                                {user?.role === 'admin' && user.id !== discussion.authorId ? 'Supprimer (Admin)' : 'Supprimer'}
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
              <h3 className="text-lg font-semibold text-white mb-2 hover:text-primary-400 transition-colors cursor-pointer">
                {discussion.title}
              </h3>
              <p className="text-dark-400 mb-4">
                {discussion.content}
              </p>

              {/* Media */}
              {discussion.media && discussion.media.length > 0 && (
                <div className={`mb-4 rounded-xl overflow-hidden ${
                  discussion.media.length === 1 ? '' : 'grid grid-cols-2 gap-2'
                }`}>
                  {discussion.media.map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt=""
                      className="w-full h-48 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => window.open(url, '_blank')}
                    />
                  ))}
                </div>
              )}

              {/* Links */}
              {discussion.links && discussion.links.length > 0 && (
                <div className="mb-4 space-y-2">
                  {discussion.links.map((link, i) => (
                    <a
                      key={i}
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-2 bg-dark-700/50 rounded-lg text-primary-400 hover:bg-dark-700 transition-colors"
                    >
                      <Link2 className="w-4 h-4 flex-shrink-0" />
                      <span className="text-sm truncate">{link}</span>
                    </a>
                  ))}
                </div>
              )}

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                {discussion.tags.map(tag => (
                  <span 
                    key={tag} 
                    className="px-2 py-1 text-xs bg-dark-700/50 text-dark-300 rounded-lg hover:bg-primary-500/20 hover:text-primary-400 cursor-pointer transition-colors"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Stats */}
              <div className="flex items-center gap-6 pt-4 border-t border-dark-700/50">
                <button 
                  onClick={(e) => {
                    e.stopPropagation()
                    handleLike(discussion.id)
                  }}
                  className={`flex items-center gap-2 transition-colors ${
                    discussion.isLiked 
                      ? 'text-primary-400' 
                      : 'text-dark-400 hover:text-primary-400'
                  }`}
                >
                  <ThumbsUp className={`w-4 h-4 ${discussion.isLiked ? 'fill-current' : ''}`} />
                  <span className="text-sm">{discussion.likes}</span>
                </button>
                <button className="flex items-center gap-2 text-dark-400 hover:text-primary-400 transition-colors">
                  <MessageCircle className="w-4 h-4" />
                  <span className="text-sm">{discussion.comments}</span>
                </button>
                <div className="flex items-center gap-2 text-dark-500">
                  <Eye className="w-4 h-4" />
                  <span className="text-sm">{discussion.views}</span>
                </div>
              </div>
            </motion.article>
          ))
        )}
      </div>

      {/* Load more */}
      {filteredDiscussions.length > 0 && (
        <div className="mt-8 text-center">
          <button className="px-6 py-3 bg-dark-800 border border-dark-700 rounded-xl text-dark-300 hover:text-white hover:border-dark-600 transition-all">
            Voir plus de discussions
          </button>
        </div>
      )}
    </div>
  )
}
