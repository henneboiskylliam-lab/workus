import { useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Home,
  Newspaper,
  Grid3X3,
  Sparkles,
  Compass,
  Target,
  MessageSquare,
  Users,
  Lightbulb,
  Mail,
  HelpCircle,
  Briefcase,
  UserPlus,
  PlusCircle,
  BarChart2,
  Bookmark,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Zap,
  Shield,
  LogIn,
  LogOut,
  Crown,
  Flag,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useReports } from '../../contexts/ReportsContext'

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
  mobileOpen: boolean
  onMobileClose: () => void
}

interface MenuItem {
  id: string
  label: string
  icon: React.ReactNode
  path: string
  badge?: number
  children?: MenuItem[]
  requiredRole?: 'user' | 'creator' | 'moderator' | 'admin'
  requiresAuth?: boolean
}

/**
 * Sidebar - Navigation principale fixe à gauche
 * Supporte l'état collapsed, les sous-menus et les rôles utilisateurs
 */
export function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: SidebarProps) {
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['categories', 'discussions'])
  const location = useLocation()
  const navigate = useNavigate()
  const { user, isAuthenticated, logout } = useAuth()
  const { getPendingCount } = useReports()
  
  // Compteur de signalements en attente pour les admins
  const pendingReportsCount = getPendingCount()

  // Fonction pour obtenir le badge (retourne undefined si la page est active)
  const getBadge = (path: string, count?: number) => {
    if (!count || count === 0) return undefined
    // Cacher le badge si on est sur cette page
    if (isActive(path)) return undefined
    return count
  }

  // Menu items avec contrôle d'accès - badges uniquement dynamiques et masqués si page active
  const menuItems: MenuItem[] = [
    { id: 'home', label: 'Accueil', icon: <Home size={20} />, path: '/' },
    { id: 'feed', label: 'Feed', icon: <Newspaper size={20} />, path: '/feed' },
    {
      id: 'categories',
      label: 'Catégories & Spécialités',
      icon: <Grid3X3 size={20} />,
      path: '/categories',
      children: [
        { id: 'suggestions', label: 'Suggestions', icon: <Sparkles size={18} />, path: '/categories/suggestions' },
        { id: 'explore', label: 'Explorer', icon: <Compass size={18} />, path: '/categories/explore' },
      ],
    },
    { id: 'specialty', label: 'Mes Spécialités', icon: <Target size={20} />, path: '/specialty', requiresAuth: true },
    {
      id: 'discussions',
      label: 'Discussions',
      icon: <MessageSquare size={20} />,
      path: '/discussions',
      children: [
        { id: 'public', label: 'Discussions Publiques', icon: <Users size={18} />, path: '/discussions/public' },
        { id: 'ideas', label: "Partage d'Idées", icon: <Lightbulb size={18} />, path: '/discussions/ideas' },
        { id: 'messages', label: 'Messages Privés', icon: <Mail size={18} />, path: '/discussions/messages', requiresAuth: true },
        { id: 'help', label: "Recherche d'Aide", icon: <HelpCircle size={18} />, path: '/discussions/help' },
        { id: 'jobs', label: "Annonces d'Emploi", icon: <Briefcase size={18} />, path: '/discussions/jobs' },
      ],
    },
    { id: 'followers', label: 'Followers', icon: <UserPlus size={20} />, path: '/followers', requiresAuth: true },
    { id: 'create', label: 'Créer du Contenu', icon: <PlusCircle size={20} />, path: '/create', requiredRole: 'creator' },
    { id: 'stats', label: 'Statistiques', icon: <BarChart2 size={20} />, path: '/stats', requiresAuth: true },
    { id: 'saved', label: 'Enregistrements', icon: <Bookmark size={20} />, path: '/saved', requiresAuth: true },
    { id: 'help-center', label: "Centre d'aide", icon: <HelpCircle size={20} />, path: '/help' },
    { id: 'reports', label: 'Signalements', icon: <Flag size={20} />, path: '/admin/reports', badge: getBadge('/admin/reports', pendingReportsCount), requiredRole: 'admin' },
    { id: 'admin', label: 'Dashboard Admin', icon: <Shield size={20} />, path: '/admin', requiredRole: 'admin' },
  ]

  // Vérifier si l'utilisateur peut voir un item de menu
  const canViewMenuItem = (item: MenuItem): boolean => {
    // Item public
    if (!item.requiresAuth && !item.requiredRole) return true
    
    // Authentification requise mais pas connecté
    if (item.requiresAuth && !isAuthenticated) return false
    
    // Rôle spécifique requis
    if (item.requiredRole) {
      if (!user) return false
      const roleHierarchy = ['user', 'creator', 'moderator', 'admin']
      const userRoleIndex = roleHierarchy.indexOf(user.role)
      const requiredRoleIndex = roleHierarchy.indexOf(item.requiredRole)
      return userRoleIndex >= requiredRoleIndex
    }
    
    return true
  }

  // Filtrer les items de menu selon les permissions
  const visibleMenuItems = menuItems.filter(item => {
    if (!canViewMenuItem(item)) return false
    if (item.children) {
      item.children = item.children.filter(child => canViewMenuItem(child))
    }
    return true
  })

  const toggleMenu = (menuId: string) => {
    setExpandedMenus(prev =>
      prev.includes(menuId) ? prev.filter(id => id !== menuId) : [...prev, menuId]
    )
  }

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  const handleLogout = () => {
    logout()
    navigate('/')
    onMobileClose()
  }

  // Couleur du badge selon le rôle
  const getRoleBadgeColor = () => {
    if (!user) return ''
    switch (user.role) {
      case 'admin': return 'from-red-500 to-orange-500'
      case 'moderator': return 'from-purple-500 to-pink-500'
      case 'creator': return 'from-blue-500 to-cyan-500'
      default: return 'from-accent-400 to-accent-600'
    }
  }

  const getRoleLabel = () => {
    if (!user) return ''
    switch (user.role) {
      case 'admin': return 'Admin'
      case 'moderator': return 'Mod'
      case 'creator': return 'Créateur'
      default: return 'Membre'
    }
  }

  return (
    <>
      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full z-50 flex flex-col
          bg-dark-900/95 backdrop-blur-xl border-r border-dark-700/50
          transition-all duration-300 ease-in-out
          ${collapsed ? 'w-20' : 'w-[280px]'}
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-dark-700/50">
          <NavLink to="/" className="flex items-center gap-3" onClick={onMobileClose}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center shadow-lg shadow-primary-500/20">
              <Zap className="w-6 h-6 text-white" />
            </div>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-xl font-bold text-white"
              >
                Work Us
              </motion.span>
            )}
          </NavLink>
          
          {/* Toggle button - Desktop only */}
          <button
            onClick={onToggle}
            className="hidden lg:flex w-8 h-8 items-center justify-center rounded-lg hover:bg-dark-700 text-dark-400 hover:text-white transition-colors"
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Navigation avec barre de défilement */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 scrollbar-thin scrollbar-track-dark-800 scrollbar-thumb-dark-600 hover:scrollbar-thumb-dark-500">
          <ul className="space-y-1">
            {visibleMenuItems.map(item => (
              <li key={item.id}>
                {item.children ? (
                  // Menu with submenu
                  <div>
                    <button
                      onClick={() => !collapsed && toggleMenu(item.id)}
                      className={`
                        w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                        transition-all duration-200
                        ${isActive(item.path)
                          ? 'bg-primary-500/10 text-primary-400'
                          : 'text-dark-300 hover:text-white hover:bg-dark-800'
                        }
                      `}
                    >
                      <span className="flex-shrink-0">{item.icon}</span>
                      {!collapsed && (
                        <>
                          <span className="flex-1 text-left text-sm font-medium truncate">
                            {item.label}
                          </span>
                          {item.badge && (
                            <span className="px-2 py-0.5 text-xs font-semibold bg-primary-500 text-white rounded-full">
                              {item.badge}
                            </span>
                          )}
                          <ChevronDown
                            size={16}
                            className={`transition-transform duration-200 ${
                              expandedMenus.includes(item.id) ? 'rotate-180' : ''
                            }`}
                          />
                        </>
                      )}
                    </button>
                    
                    {/* Submenu */}
                    <AnimatePresence>
                      {!collapsed && expandedMenus.includes(item.id) && (
                        <motion.ul
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-1 ml-4 pl-4 border-l border-dark-700 space-y-1"
                        >
                          {item.children.map(child => (
                            <li key={child.id}>
                              <NavLink
                                to={child.path}
                                onClick={onMobileClose}
                                className={({ isActive }) => `
                                  flex items-center gap-3 px-3 py-2 rounded-lg text-sm
                                  transition-all duration-200
                                  ${isActive
                                    ? 'bg-primary-500/10 text-primary-400'
                                    : 'text-dark-400 hover:text-white hover:bg-dark-800'
                                  }
                                `}
                              >
                                {child.icon}
                                <span>{child.label}</span>
                              </NavLink>
                            </li>
                          ))}
                        </motion.ul>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  // Simple menu item
                  <NavLink
                    to={item.path}
                    onClick={onMobileClose}
                    className={({ isActive }) => `
                      flex items-center gap-3 px-3 py-2.5 rounded-xl
                      transition-all duration-200
                      ${isActive
                        ? 'bg-primary-500/10 text-primary-400 shadow-lg shadow-primary-500/5'
                        : 'text-dark-300 hover:text-white hover:bg-dark-800'
                      }
                    `}
                  >
                    <span className="flex-shrink-0">{item.icon}</span>
                    {!collapsed && (
                      <>
                        <span className="flex-1 text-sm font-medium truncate">{item.label}</span>
                        {item.badge && (
                          <span className="px-2 py-0.5 text-xs font-semibold bg-primary-500 text-white rounded-full">
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                )}
              </li>
            ))}

            {/* Admin section - only for admin/moderator */}
            {user && (user.role === 'admin' || user.role === 'moderator') && (
              <>
                {!collapsed && (
                  <li className="pt-4 mt-4 border-t border-dark-700/50">
                    <span className="px-3 text-xs font-semibold text-dark-500 uppercase tracking-wider">
                      Administration
                    </span>
                  </li>
                )}
                <li className="mt-2">
                  <NavLink
                    to="/admin"
                    onClick={onMobileClose}
                    className={({ isActive }) => `
                      flex items-center gap-3 px-3 py-2.5 rounded-xl
                      transition-all duration-200
                      ${isActive
                        ? 'bg-red-500/10 text-red-400'
                        : 'text-dark-300 hover:text-white hover:bg-dark-800'
                      }
                    `}
                  >
                    <Shield size={20} />
                    {!collapsed && <span className="text-sm font-medium">Dashboard Admin</span>}
                  </NavLink>
                </li>
              </>
            )}
          </ul>
        </nav>

        {/* User section at bottom */}
        <div className="p-4 border-t border-dark-700/50">
          {isAuthenticated && user ? (
            // Utilisateur connecté
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-dark-800/50">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getRoleBadgeColor()} flex items-center justify-center text-white font-bold`}>
                  {user.username[0].toUpperCase()}
                </div>
                {!collapsed && (
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-white truncate">{user.username}</p>
                      {user.role !== 'user' && (
                        <span className={`px-1.5 py-0.5 text-xs rounded bg-gradient-to-r ${getRoleBadgeColor()} text-white`}>
                          {getRoleLabel()}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-dark-400">{user.email}</p>
                  </div>
                )}
              </div>
              {!collapsed && (
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-dark-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
                >
                  <LogOut size={18} />
                  <span className="text-sm">Déconnexion</span>
                </button>
              )}
            </div>
          ) : (
            // Non connecté
            <div className="space-y-2">
              {!collapsed ? (
                <>
                  <NavLink
                    to="/login"
                    onClick={onMobileClose}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-primary-500/20 transition-all"
                  >
                    <LogIn size={18} />
                    Connexion
                  </NavLink>
                  <NavLink
                    to="/register"
                    onClick={onMobileClose}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-dark-800 text-white font-medium rounded-xl border border-dark-700 hover:border-dark-600 transition-all"
                  >
                    <Crown size={18} />
                    Inscription
                  </NavLink>
                </>
              ) : (
                <NavLink
                  to="/login"
                  onClick={onMobileClose}
                  className="w-full flex items-center justify-center p-2.5 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-xl"
                >
                  <LogIn size={20} />
                </NavLink>
              )}
            </div>
          )}
        </div>
      </aside>
    </>
  )
}
