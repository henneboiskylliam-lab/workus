import { useState, useEffect, useRef } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Bell,
  User,
  Settings,
  Menu,
  X,
  LogOut,
  Moon,
  Sun,
  HelpCircle,
  Shield,
  LogIn,
  Check,
  Loader2,
  Grid3X3,
  Target,
  BookOpen,
  Heart,
  Bookmark,
  Share2,
  UserPlus,
  MessageCircle,
  Repeat,
  Trash2,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import { useNotifications } from '../../contexts/NotificationsContext'
import { useContentManagement } from '../../contexts/ContentManagementContext'
import { usePosts } from '../../contexts/PostsContext'
import { useHelpCenter } from '../../contexts/HelpCenterContext'
import { InlineErrorBoundary } from '../ui/ErrorBoundary'

// Import des données pour les utilisateurs
import usersData from '../../data/users.json'

// Type pour les notifications (pour éviter les problèmes d'import)
type NotificationType = 'like' | 'save' | 'share' | 'repost' | 'follow' | 'message' | 'comment' | 'info' | 'success' | 'warning' | 'error' | 'system' | 'report' | 'mention'

interface TopBarProps {
  onMenuClick: () => void
  sidebarCollapsed: boolean
}

interface SearchResult {
  id: string
  type: 'category' | 'specialty' | 'user' | 'post' | 'page' | 'help'
  title: string
  subtitle: string
  path: string
  icon: 'category' | 'specialty' | 'user' | 'post' | 'page' | 'help'
  tags?: string[]
}

const notificationFilters: { id: NotificationType | 'all', label: string, icon: any }[] = [
  { id: 'all', label: 'Toutes', icon: Bell },
  { id: 'like', label: 'Likes', icon: Heart },
  { id: 'save', label: 'Enregistrements', icon: Bookmark },
  { id: 'share', label: 'Partages', icon: Share2 },
  { id: 'repost', label: 'Republications', icon: Repeat },
  { id: 'follow', label: 'Followers', icon: UserPlus },
  { id: 'message', label: 'Messages', icon: MessageCircle },
  { id: 'comment', label: 'Commentaires', icon: MessageCircle },
]

/**
 * TopBar - Barre de navigation avec notifications filtrables
 */
export function TopBar({ onMenuClick, sidebarCollapsed }: TopBarProps) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [notificationFilter, setNotificationFilter] = useState<NotificationType | 'all'>('all')
  const [readFilter, setReadFilter] = useState<'all' | 'unread' | 'read'>('all')
  
  const searchRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  
  // Accès sécurisé aux contexts avec valeurs par défaut
  const authContext = useAuth()
  const themeContext = useTheme()
  const notificationsContext = useNotifications()
  const contentContext = useContentManagement()
  const postsContext = usePosts()
  const helpContext = useHelpCenter()
  
  // Extraire les valeurs avec fallbacks sécurisés
  const user = authContext?.user || null
  const isAuthenticated = authContext?.isAuthenticated || false
  const logout = authContext?.logout || (() => {})
  
  const theme = themeContext?.theme || 'dark'
  const setTheme = themeContext?.setTheme || (() => {})
  const effectiveTheme = (themeContext as any)?.effectiveTheme || theme
  
  // Notifications avec fallbacks sécurisés
  const notifications = Array.isArray(notificationsContext?.notifications) ? notificationsContext.notifications : []
  const unreadCount = typeof notificationsContext?.unreadCount === 'number' ? notificationsContext.unreadCount : 0
  const markAsRead = notificationsContext?.markAsRead || (() => {})
  const markAllAsRead = notificationsContext?.markAllAsRead || (() => {})
  const deleteNotification = notificationsContext?.deleteNotification || (() => {})
  const getNotificationsByType = notificationsContext?.getNotificationsByType || (() => [])
  
  // Content management avec fallbacks
  const categories = Array.isArray(contentContext?.categories) ? contentContext.categories : []
  const specialties = Array.isArray(contentContext?.specialties) ? contentContext.specialties : []
  
  // Posts avec fallbacks
  const posts = Array.isArray(postsContext?.posts) ? postsContext.posts : []
  
  // Help center avec fallbacks
  const questions = Array.isArray(helpContext?.questions) ? helpContext.questions : []
  
  // Récupérer les utilisateurs enregistrés
  const getRegisteredUsers = () => {
    const stored = localStorage.getItem('workus_registered_users')
    if (stored) {
      try {
        return JSON.parse(stored)
      } catch {
        return []
      }
    }
    return []
  }

  // Filtrer les notifications par type (avec protection)
  const safeNotifications = Array.isArray(notifications) ? notifications : []
  const typeFilteredNotifications = notificationFilter === 'all' 
    ? safeNotifications 
    : (Array.isArray(getNotificationsByType(notificationFilter)) ? getNotificationsByType(notificationFilter) : [])

  // Filtrer par statut lu/non lu (avec protection)
  const safeTypeFiltered = Array.isArray(typeFilteredNotifications) ? typeFilteredNotifications : []
  const filteredNotifications = safeTypeFiltered.filter(n => {
    if (!n) return false
    if (readFilter === 'unread') return !n.isRead && !n.read
    if (readFilter === 'read') return n.isRead || n.read
    return true
  })

  // Compteurs pour les filtres (avec protection)
  const unreadInType = safeTypeFiltered.filter(n => n && !n.isRead && !n.read).length
  const readInType = safeTypeFiltered.filter(n => n && (n.isRead || n.read)).length

  // Pages statiques pour la recherche
  const staticPages: SearchResult[] = [
    { id: 'page-home', type: 'page', title: 'Accueil', subtitle: 'Page principale', path: '/', icon: 'page' },
    { id: 'page-feed', type: 'page', title: 'Feed', subtitle: 'Fil d\'actualités', path: '/feed', icon: 'page' },
    { id: 'page-categories', type: 'page', title: 'Catégories', subtitle: 'Explorer les catégories', path: '/categories', icon: 'category' },
    { id: 'page-discussions', type: 'page', title: 'Discussions', subtitle: 'Forum communautaire', path: '/discussions', icon: 'page' },
    { id: 'page-saved', type: 'page', title: 'Enregistrements', subtitle: 'Contenus sauvegardés', path: '/saved', icon: 'page' },
    { id: 'page-stats', type: 'page', title: 'Statistiques', subtitle: 'Vos performances', path: '/stats', icon: 'page' },
    { id: 'page-settings', type: 'page', title: 'Paramètres', subtitle: 'Configuration du compte', path: '/settings', icon: 'page' },
    { id: 'page-help', type: 'page', title: "Centre d'aide", subtitle: 'Questions et assistance', path: '/help', icon: 'help' },
  ]

  // Fermer les menus quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchOpen(false)
        setSearchResults([])
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Raccourci clavier pour la recherche
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault()
        setSearchOpen(true)
      }
      if (event.key === 'Escape') {
        setSearchOpen(false)
        setSearchResults([])
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Recherche avec debounce
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    const timer = setTimeout(() => {
      const query = searchQuery.toLowerCase()
      const results: SearchResult[] = []
      
      // Recherche dans les catégories (depuis le contexte) - avec protection
      const safeCategories = Array.isArray(categories) ? categories : []
      const safeSpecialties = Array.isArray(specialties) ? specialties : []
      
      safeCategories.forEach(cat => {
        if (!cat) return
        if (cat.name?.toLowerCase().includes(query) || cat.description?.toLowerCase().includes(query)) {
          const catSpecialties = safeSpecialties.filter(s => s && s.categoryId === cat.id)
          results.push({
            id: cat.id,
            type: 'category',
            title: cat.name || 'Catégorie',
            subtitle: `Catégorie • ${catSpecialties.length} spécialités`,
            path: `/categories/explore?category=${cat.id}`,
            icon: 'category'
          })
        }
      })
      
      // Recherche dans les spécialités (depuis le contexte) - avec protection
      safeSpecialties.forEach(spec => {
        if (!spec) return
        if (spec.name?.toLowerCase().includes(query) || spec.description?.toLowerCase().includes(query)) {
          const cat = safeCategories.find(c => c && c.id === spec.categoryId)
          results.push({
            id: spec.id,
            type: 'specialty',
            title: spec.name || 'Spécialité',
            subtitle: `Spécialité • ${cat?.name || 'Sans catégorie'}`,
            path: `/specialty/${spec.slug || spec.id}`,
            icon: 'specialty'
          })
        }
      })
      
      // Recherche dans les utilisateurs - avec protection
      const usersFromData = Array.isArray(usersData?.users) ? usersData.users : []
      const registeredUsers = getRegisteredUsers()
      const allUsers = [...usersFromData, ...(Array.isArray(registeredUsers) ? registeredUsers : [])]
      
      allUsers.forEach(u => {
        if (!u) return
        if (u.username?.toLowerCase().includes(query) || u.email?.toLowerCase().includes(query)) {
          results.push({
            id: u.id,
            type: 'user',
            title: u.username || 'Utilisateur',
            subtitle: `Profil • ${u.role === 'admin' ? 'Administrateur' : u.role === 'creator' ? 'Créateur' : 'Utilisateur'}`,
            path: `/profile/${u.id}`,
            icon: 'user'
          })
        }
      })
      
      // Recherche dans les posts (contenu + tags) - avec protection
      const safePosts = Array.isArray(posts) ? posts : []
      safePosts.forEach(post => {
        if (!post) return
        const matchesContent = post.content?.toLowerCase().includes(query)
        const postTags = Array.isArray(post.tags) ? post.tags : []
        const matchesTags = postTags.some(tag => tag?.toLowerCase().includes(query))
        const matchesAuthor = post.authorName?.toLowerCase().includes(query)
        
        if (matchesContent || matchesTags || matchesAuthor) {
          results.push({
            id: post.id,
            type: 'post',
            title: post.content?.substring(0, 50) + (post.content && post.content.length > 50 ? '...' : '') || 'Post',
            subtitle: `Post par ${post.authorName || 'Anonyme'}${postTags.length ? ` • ${postTags.join(', ')}` : ''}`,
            path: `/feed#${post.id}`,
            icon: 'post',
            tags: postTags
          })
        }
      })
      
      // Recherche dans les questions du centre d'aide - avec protection
      const safeQuestions = Array.isArray(questions) ? questions : []
      safeQuestions.forEach(q => {
        if (!q) return
        if (q.question?.toLowerCase().includes(query) || q.answer?.toLowerCase().includes(query) || q.category?.toLowerCase().includes(query)) {
          results.push({
            id: q.id,
            type: 'help',
            title: (q.question || '').substring(0, 50) + ((q.question?.length || 0) > 50 ? '...' : ''),
            subtitle: `Centre d'aide • ${q.category || 'Question'}`,
            path: '/help',
            icon: 'help'
          })
        }
      })
      
      // Pages statiques
      staticPages.forEach(page => {
        if (page.title.toLowerCase().includes(query) || page.subtitle.toLowerCase().includes(query)) {
          results.push(page)
        }
      })
      
      setSearchResults(results.slice(0, 10))
      setIsSearching(false)
    }, 200)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Fonctions avec try/catch pour éviter les crashes
  const handleLogout = () => {
    try {
      logout()
      setProfileMenuOpen(false)
      navigate('/')
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error)
      // Forcer la navigation même en cas d'erreur
      window.location.href = '/'
    }
  }

  const handleSearchResultClick = (result: SearchResult) => {
    try {
      setSearchOpen(false)
      setSearchQuery('')
      setSearchResults([])
      if (result?.path) {
        navigate(result.path)
      }
    } catch (error) {
      console.error('Erreur lors du clic sur le résultat:', error)
    }
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    try {
      e.preventDefault()
      if (searchQuery.trim()) {
        navigate(`/categories/explore?q=${encodeURIComponent(searchQuery)}`)
        setSearchOpen(false)
        setSearchQuery('')
        setSearchResults([])
      }
    } catch (error) {
      console.error('Erreur lors de la recherche:', error)
    }
  }

  const handleNotificationClick = (notifId: string, targetUrl?: string) => {
    try {
      if (notifId) {
        markAsRead(notifId)
      }
      if (targetUrl) {
        navigate(targetUrl)
        setNotificationsOpen(false)
      }
    } catch (error) {
      console.error('Erreur lors du clic sur la notification:', error)
    }
  }

  const toggleTheme = () => {
    try {
      const newTheme = effectiveTheme === 'dark' ? 'light' : 'dark'
      setTheme(newTheme)
    } catch (error) {
      console.error('Erreur lors du changement de thème:', error)
    }
  }
  
  // Fonction sécurisée pour marquer toutes les notifications comme lues
  const safeMarkAllAsRead = () => {
    try {
      markAllAsRead()
    } catch (error) {
      console.error('Erreur lors du marquage des notifications:', error)
    }
  }
  
  // Fonction sécurisée pour supprimer une notification
  const safeDeleteNotification = (id: string) => {
    try {
      if (id) {
        deleteNotification(id)
      }
    } catch (error) {
      console.error('Erreur lors de la suppression de notification:', error)
    }
  }

  const getRoleBadgeColor = () => {
    if (!user) return 'from-accent-400 to-accent-600'
    switch (user.role) {
      case 'admin': return 'from-red-500 to-orange-500'
      case 'moderator': return 'from-purple-500 to-pink-500'
      case 'creator': return 'from-blue-500 to-cyan-500'
      default: return 'from-accent-400 to-accent-600'
    }
  }

  const getResultIcon = (icon: string) => {
    switch (icon) {
      case 'category': return <Grid3X3 className="w-4 h-4" />
      case 'specialty': return <Target className="w-4 h-4" />
      case 'user': return <User className="w-4 h-4" />
      case 'post': return <MessageCircle className="w-4 h-4" />
      case 'help': return <HelpCircle className="w-4 h-4" />
      default: return <Search className="w-4 h-4" />
    }
  }

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'like': return <Heart className="w-4 h-4 text-red-400" />
      case 'save': return <Bookmark className="w-4 h-4 text-amber-400" />
      case 'share': return <Share2 className="w-4 h-4 text-green-400" />
      case 'repost': return <Repeat className="w-4 h-4 text-blue-400" />
      case 'follow': return <UserPlus className="w-4 h-4 text-primary-400" />
      case 'message': return <MessageCircle className="w-4 h-4 text-secondary-400" />
      case 'comment': return <MessageCircle className="w-4 h-4 text-cyan-400" />
      default: return <Bell className="w-4 h-4 text-dark-400" />
    }
  }

  const formatNotificationTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'À l\'instant'
    if (diffMins < 60) return `${diffMins}min`
    if (diffHours < 24) return `${diffHours}h`
    if (diffDays < 7) return `${diffDays}j`
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  }

  return (
    <header className={`fixed top-0 right-0 h-16 z-40 bg-dark-900/80 backdrop-blur-xl border-b border-dark-700/50 transition-all duration-300 ${sidebarCollapsed ? 'left-0 lg:left-20' : 'left-0 lg:left-[280px]'}`}>
      <div className="h-full flex items-center justify-between px-4 md:px-6">
        {/* Left side - Mobile menu & Search */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg hover:bg-dark-800 text-dark-300 hover:text-white transition-colors"
          >
            <Menu size={24} />
          </button>

          {/* Search */}
          <div className="relative" ref={searchRef}>
            <AnimatePresence>
              {searchOpen ? (
                <motion.div
                  initial={{ width: 40, opacity: 0 }}
                  animate={{ width: 350, opacity: 1 }}
                  exit={{ width: 40, opacity: 0 }}
                  className="flex items-center"
                >
                  <form onSubmit={handleSearchSubmit} className="relative w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Rechercher..."
                      className="w-full pl-10 pr-10 py-2 bg-dark-800 border border-dark-600 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:border-primary-500"
                      autoFocus
                    />
                    {isSearching ? (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400 animate-spin" />
                    ) : searchQuery && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery('')
                          setSearchResults([])
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-white"
                      >
                        <X size={18} />
                      </button>
                    )}
                  </form>

                  <AnimatePresence>
                    {(searchResults.length > 0 || (searchQuery && !isSearching)) && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute top-full left-0 right-0 mt-2 bg-dark-800 border border-dark-700 rounded-xl shadow-xl overflow-hidden max-h-96 overflow-y-auto"
                      >
                        {searchResults.length > 0 ? (
                          <div className="py-2">
                            {searchResults.map(result => (
                              <button
                                key={result.id}
                                onClick={() => handleSearchResultClick(result)}
                                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-dark-700 transition-colors"
                              >
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                  result.type === 'category' ? 'bg-primary-500/20 text-primary-400' :
                                  result.type === 'specialty' ? 'bg-secondary-500/20 text-secondary-400' :
                                  result.type === 'user' ? 'bg-green-500/20 text-green-400' :
                                  result.type === 'post' ? 'bg-blue-500/20 text-blue-400' :
                                  result.type === 'help' ? 'bg-cyan-500/20 text-cyan-400' :
                                  'bg-dark-600 text-dark-300'
                                }`}>
                                  {getResultIcon(result.icon)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-white truncate">{result.title}</p>
                                  <p className="text-xs text-dark-400 truncate">{result.subtitle}</p>
                                </div>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="p-4 text-center text-dark-400 text-sm">
                            Aucun résultat pour "{searchQuery}"
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ) : (
                <button
                  onClick={() => setSearchOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-dark-800 border border-dark-700 text-dark-400 hover:text-white hover:border-dark-600 transition-all"
                >
                  <Search size={18} />
                  <span className="hidden md:inline text-sm">Rechercher...</span>
                  <kbd className="hidden md:inline px-2 py-0.5 text-xs bg-dark-700 rounded">⌘K</kbd>
                </button>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-2">
          {/* Bouton thème avec protection */}
          <InlineErrorBoundary
            fallback={
              <button disabled className="p-2 rounded-xl bg-dark-800 text-dark-500 cursor-not-allowed" title="Thème indisponible">
                <Moon size={20} />
              </button>
            }
          >
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl hover:bg-dark-800 text-dark-300 hover:text-white transition-colors"
            >
              {effectiveTheme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </InlineErrorBoundary>

          {isAuthenticated ? (
            <>
              {/* Notifications avec protection */}
              <InlineErrorBoundary
                fallback={
                  <button disabled className="p-2 rounded-xl bg-dark-800 text-dark-500 cursor-not-allowed" title="Notifications indisponibles">
                    <Bell size={22} />
                  </button>
                }
              >
                <div className="relative">
                  <button
                    onClick={() => {
                      try {
                        setNotificationsOpen(!notificationsOpen)
                        setProfileMenuOpen(false)
                      } catch (error) {
                        console.error('Erreur lors de l\'ouverture des notifications:', error)
                      }
                    }}
                    className="relative p-2 rounded-xl hover:bg-dark-800 text-dark-300 hover:text-white transition-colors"
                  >
                    <Bell size={22} />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center text-xs font-bold bg-primary-500 text-white rounded-full">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </button>

                <AnimatePresence>
                  {notificationsOpen && (
                    <>
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setNotificationsOpen(false)} 
                      />
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-2 w-96 bg-dark-800 border border-dark-700 rounded-2xl shadow-xl overflow-hidden z-50"
                      >
                        {/* Header */}
                        <div className="p-4 border-b border-dark-700">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold text-white">Notifications</h3>
                            {unreadCount > 0 && (
                              <button 
                                onClick={safeMarkAllAsRead}
                                className="text-xs text-primary-400 hover:text-primary-300 transition-colors"
                              >
                                Tout marquer comme lu
                              </button>
                            )}
                          </div>
                          
                          {/* Filtres Lu / Non lu */}
                          <div className="flex gap-1 mb-2">
                            <button
                              onClick={() => setReadFilter('all')}
                              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                readFilter === 'all'
                                  ? 'bg-primary-500 text-white'
                                  : 'bg-dark-700 text-dark-300 hover:text-white'
                              }`}
                            >
                              Toutes
                              <span className={`px-1.5 rounded ${readFilter === 'all' ? 'bg-white/20' : 'bg-dark-600'}`}>
                                {typeFilteredNotifications.length}
                              </span>
                            </button>
                            <button
                              onClick={() => setReadFilter('unread')}
                              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                readFilter === 'unread'
                                  ? 'bg-amber-500 text-white'
                                  : 'bg-dark-700 text-dark-300 hover:text-white'
                              }`}
                            >
                              Non lues
                              {unreadInType > 0 && (
                                <span className={`px-1.5 rounded ${readFilter === 'unread' ? 'bg-white/20' : 'bg-amber-500/30 text-amber-400'}`}>
                                  {unreadInType}
                                </span>
                              )}
                            </button>
                            <button
                              onClick={() => setReadFilter('read')}
                              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                readFilter === 'read'
                                  ? 'bg-green-500 text-white'
                                  : 'bg-dark-700 text-dark-300 hover:text-white'
                              }`}
                            >
                              Lues
                              {readInType > 0 && (
                                <span className={`px-1.5 rounded ${readFilter === 'read' ? 'bg-white/20' : 'bg-dark-600'}`}>
                                  {readInType}
                                </span>
                              )}
                            </button>
                          </div>

                          {/* Filtres par type */}
                          <div className="flex gap-1 overflow-x-auto pb-1">
                            {notificationFilters.map(filter => {
                              const Icon = filter.icon
                              const filterResult = filter.id === 'all' 
                                ? safeNotifications
                                : (getNotificationsByType ? getNotificationsByType(filter.id as NotificationType) : [])
                              const count = Array.isArray(filterResult) ? filterResult.length : 0
                              return (
                                <button
                                  key={filter.id}
                                  onClick={() => setNotificationFilter(filter.id as NotificationType | 'all')}
                                  className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs whitespace-nowrap transition-colors ${
                                    notificationFilter === filter.id
                                      ? 'bg-secondary-500 text-white'
                                      : 'bg-dark-700 text-dark-300 hover:text-white'
                                  }`}
                                >
                                  <Icon className="w-3 h-3" />
                                  {filter.label}
                                  {count > 0 && (
                                    <span className={`px-1 rounded ${
                                      notificationFilter === filter.id ? 'bg-white/20' : 'bg-dark-600'
                                    }`}>
                                      {count}
                                    </span>
                                  )}
                                </button>
                              )
                            })}
                          </div>
                        </div>

                        {/* Liste des notifications */}
                        <div className="max-h-80 overflow-y-auto">
                          {filteredNotifications.length === 0 ? (
                            <div className="p-8 text-center text-dark-400">
                              <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                              <p className="text-sm">Aucune notification</p>
                            </div>
                          ) : (
                            filteredNotifications.map(notif => (
                              <div
                                key={notif.id}
                                onClick={() => handleNotificationClick(notif.id, notif.targetUrl)}
                                className={`p-4 border-b border-dark-700/50 hover:bg-dark-700/50 cursor-pointer transition-colors ${
                                  notif.isRead ? '' : 'bg-primary-500/5'
                                }`}
                              >
                                <div className="flex items-start gap-3">
                                  {/* Icône du type */}
                                  <div className="w-10 h-10 rounded-full bg-dark-700 flex items-center justify-center flex-shrink-0">
                                    {notif.fromUserName ? (
                                      <span className="text-sm font-bold text-white">
                                        {notif.fromUserName[0].toUpperCase()}
                                      </span>
                                    ) : (
                                      getNotificationIcon(notif.type)
                                    )}
                                  </div>
                                  
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      {getNotificationIcon(notif.type)}
                                      <p className="text-sm font-medium text-white">{notif.title}</p>
                                      {!notif.isRead && (
                                        <span className="w-2 h-2 bg-primary-500 rounded-full" />
                                      )}
                                    </div>
                                    <p className="text-sm text-dark-400 line-clamp-2">{notif.message}</p>
                                    <p className="text-xs text-dark-500 mt-1">{formatNotificationTime(notif.createdAt)}</p>
                                  </div>

                                  {/* Actions */}
                                  <div className="flex items-center gap-1">
                                    {!notif.isRead && (
                                      <button 
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          markAsRead(notif.id)
                                        }}
                                        className="p-1 text-dark-400 hover:text-primary-400 transition-colors"
                                        title="Marquer comme lu"
                                      >
                                        <Check size={14} />
                                      </button>
                                    )}
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        safeDeleteNotification(notif.id)
                                      }}
                                      className="p-1 text-dark-400 hover:text-red-400 transition-colors"
                                      title="Supprimer"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                        
                        <NavLink
                          to="/notifications"
                          onClick={() => setNotificationsOpen(false)}
                          className="block p-3 text-center text-sm text-primary-400 hover:bg-dark-700/50 transition-colors border-t border-dark-700"
                        >
                          Voir toutes les notifications
                        </NavLink>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
                </div>
              </InlineErrorBoundary>

              {/* Profile menu avec protection */}
              <InlineErrorBoundary
                fallback={
                  <button disabled className="p-2 rounded-xl bg-dark-800 text-dark-500 cursor-not-allowed" title="Menu profil indisponible">
                    <User size={20} />
                  </button>
                }
              >
              <div className="relative">
                <button
                  onClick={() => {
                    setProfileMenuOpen(!profileMenuOpen)
                    setNotificationsOpen(false)
                  }}
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-dark-800 transition-colors"
                >
                  <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${getRoleBadgeColor()} flex items-center justify-center text-white font-bold text-sm`}>
                    {user?.username?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <span className="hidden md:block text-sm font-medium text-white">{user?.username || 'Utilisateur'}</span>
                </button>

                <AnimatePresence>
                  {profileMenuOpen && (
                    <>
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setProfileMenuOpen(false)} 
                      />
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-2 w-56 bg-dark-800 border border-dark-700 rounded-2xl shadow-xl overflow-hidden z-50"
                      >
                        <div className="p-4 border-b border-dark-700">
                          <p className="font-semibold text-white">{user?.username || 'Utilisateur'}</p>
                          <p className="text-sm text-dark-400">{user?.email || ''}</p>
                          {user && user.role && user.role !== 'user' && (
                            <span className={`inline-block mt-2 px-2 py-0.5 text-xs rounded-full bg-gradient-to-r ${getRoleBadgeColor()} text-white`}>
                              {user.role === 'admin' ? 'Administrateur' : user.role === 'moderator' ? 'Modérateur' : 'Créateur'}
                            </span>
                          )}
                        </div>
                        <nav className="p-2">
                          <NavLink
                            to="/profile"
                            onClick={() => setProfileMenuOpen(false)}
                            className="flex items-center gap-3 px-3 py-2 rounded-lg text-dark-300 hover:text-white hover:bg-dark-700 transition-colors"
                          >
                            <User size={18} />
                            <span>Mon Profil</span>
                          </NavLink>
                          <NavLink
                            to="/settings"
                            onClick={() => setProfileMenuOpen(false)}
                            className="flex items-center gap-3 px-3 py-2 rounded-lg text-dark-300 hover:text-white hover:bg-dark-700 transition-colors"
                          >
                            <Settings size={18} />
                            <span>Paramètres</span>
                          </NavLink>
                          {user && (user.role === 'admin' || user.role === 'moderator') && (
                            <NavLink
                              to="/admin"
                              onClick={() => setProfileMenuOpen(false)}
                              className="flex items-center gap-3 px-3 py-2 rounded-lg text-dark-300 hover:text-white hover:bg-dark-700 transition-colors"
                            >
                              <Shield size={18} />
                              <span>Administration</span>
                            </NavLink>
                          )}
                          <NavLink
                            to="/discussions/help"
                            onClick={() => setProfileMenuOpen(false)}
                            className="flex items-center gap-3 px-3 py-2 rounded-lg text-dark-300 hover:text-white hover:bg-dark-700 transition-colors"
                          >
                            <HelpCircle size={18} />
                            <span>Aide</span>
                          </NavLink>
                        </nav>
                        <div className="p-2 border-t border-dark-700">
                          <button 
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                          >
                            <LogOut size={18} />
                            <span>Déconnexion</span>
                          </button>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
              </InlineErrorBoundary>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <NavLink
                to="/login"
                className="flex items-center gap-2 px-4 py-2 text-dark-300 hover:text-white transition-colors"
              >
                <LogIn size={18} />
                <span className="hidden sm:inline">Connexion</span>
              </NavLink>
              <NavLink
                to="/register"
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-primary-500/20 transition-all"
              >
                <span>S'inscrire</span>
              </NavLink>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
