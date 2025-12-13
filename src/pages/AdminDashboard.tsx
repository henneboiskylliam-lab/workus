import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { 
  LayoutDashboard, Users, FileText, FolderTree, Flag, Settings,
  TrendingUp, UserPlus, FileCheck, AlertTriangle, Eye, Check, X,
  MoreHorizontal, Search, Shield, Ban, Edit2, Calendar, Crown, Star, CheckCircle,
  Trash2, UserCog, RefreshCw
} from 'lucide-react'
import { AnimatePresence } from 'framer-motion'
import { StatCard } from '../components/ui'
import { useAuth } from '../contexts/AuthContext'
import { useContentManagement } from '../contexts/ContentManagementContext'
import { usePosts } from '../contexts/PostsContext'
import { useReports } from '../contexts/ReportsContext'
import { useAdminStats } from '../contexts/AdminStatsContext'
import { useActivity } from '../contexts/ActivityContext'
import { useUsers, userService } from '../db'
import { supabase, checkSupabase } from '../lib/supabase'

// Interface pour les utilisateurs
interface DisplayUser {
  id: string
  username: string
  email: string
  role: 'admin' | 'moderator' | 'creator' | 'user'
  isActive: boolean
  isVerified: boolean
  joinedAt: string
  avatar?: string | null
}

type AdminTab = 'overview' | 'users' | 'content' | 'categories' | 'reports' | 'settings'
type StatPeriod = 'week' | 'month' | 'year'

const tabs = [
  { id: 'overview', label: 'Vue d\'ensemble', icon: LayoutDashboard },
  { id: 'users', label: 'Utilisateurs', icon: Users },
  { id: 'content', label: 'Contenu', icon: FileText },
  { id: 'categories', label: 'Catégories', icon: FolderTree },
  { id: 'reports', label: 'Signalements', icon: Flag },
  { id: 'settings', label: 'Paramètres', icon: Settings },
]

const roleColors = {
  admin: 'bg-red-500/20 text-red-400',
  moderator: 'bg-purple-500/20 text-purple-400',
  creator: 'bg-blue-500/20 text-blue-400',
  user: 'bg-green-500/20 text-green-400',
}

const periodLabels = {
  week: 'Cette semaine',
  month: 'Ce mois',
  year: 'Cette année'
}

/**
 * AdminDashboard - Panneau d'administration
 * Accessible uniquement aux administrateurs
 */
export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview')
  const [statPeriod, setStatPeriod] = useState<StatPeriod>('week')
  const [allUsers, setAllUsers] = useState<DisplayUser[]>([])
  const [userSearchQuery, setUserSearchQuery] = useState('')
  const [userRoleFilter, setUserRoleFilter] = useState<string | null>(null)
  
  // États pour la gestion des utilisateurs
  const [editingUser, setEditingUser] = useState<DisplayUser | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [userToDelete, setUserToDelete] = useState<DisplayUser | null>(null)
  const [openMenuUserId, setOpenMenuUserId] = useState<string | null>(null)
  const [showToast, setShowToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  
  // Formulaire d'édition
  const [editForm, setEditForm] = useState({
    username: '',
    email: '',
    role: 'user' as DisplayUser['role'],
    isActive: true,
    isVerified: false
  })
  
  const { user } = useAuth()
  const { categories, specialties, pendingContent } = useContentManagement()
  const { posts } = usePosts()
  const { reports: contextReports, getPendingCount } = useReports()
  const { stats: adminStats, getStatsForPeriod, getUserEvolution, recordDailySnapshot } = useAdminStats()
  const { activities, getRecentActivities, getActivityTimeStats, recordGlobalActivity, userActivities, addActivity } = useActivity()
  
  // Utilisateurs depuis IndexedDB
  const { users: dbUsers } = useUsers()
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)

  // Fonction pour charger les utilisateurs depuis Supabase
  const loadUsersFromSupabase = useCallback(async (): Promise<DisplayUser[]> => {
    if (!checkSupabase() || !supabase) {
      return []
    }

    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Erreur chargement profils Supabase:', error)
        return []
      }

      if (!profiles) return []

      return profiles.map((p: any) => ({
        id: p.id,
        username: p.username || 'Utilisateur',
        email: p.email || '',
        role: (p.role || 'user') as DisplayUser['role'],
        isActive: p.is_active !== false,
        isVerified: p.is_verified === true,
        joinedAt: p.created_at || new Date().toISOString(),
        avatar: p.avatar_url
      }))
    } catch (err) {
      console.error('Erreur Supabase:', err)
      return []
    }
  }, [])

  // Charger tous les utilisateurs (Supabase + IndexedDB + localStorage)
  // Avec priorité aux rôles modifiés localement (stockés dans workus_admin_role_overrides)
  const loadAllUsers = useCallback(async () => {
    setIsLoadingUsers(true)
    
    try {
      // 1. Charger depuis Supabase (source principale si configuré)
      const supabaseUsers = await loadUsersFromSupabase()
      
      // 2. Récupérer les OVERRIDES de rôles (modifications admin locales - PRIORITÉ MAXIMALE)
      // Les overrides sont stockés par ID ET par email pour gérer les différences d'ID
      let roleOverrides: Record<string, string> = {}
      try {
        const overrides = localStorage.getItem('workus_admin_role_overrides')
        if (overrides) {
          roleOverrides = JSON.parse(overrides)
          console.log('Overrides de rôles chargés:', JSON.stringify(roleOverrides))
        }
      } catch {
        // Ignorer
      }

      // Fonction helper pour obtenir le rôle override (cherche par ID puis par email)
      const getOverriddenRole = (id: string, email: string): string | undefined => {
        return roleOverrides[id] || roleOverrides[email] || roleOverrides[email.toLowerCase()]
      }
      
      // 3. Récupérer les rôles depuis localStorage (pour les utilisateurs locaux)
      let localStorageRoles: Record<string, string> = {}
      try {
        const registeredUsers = localStorage.getItem('workus_registered_users')
        if (registeredUsers) {
          const users = JSON.parse(registeredUsers)
          users.forEach((u: any) => {
            if (u.id && u.role) {
              localStorageRoles[u.id] = u.role
            }
            if (u.email && u.role) {
              localStorageRoles[u.email] = u.role
            }
          })
        }
        
        const publicUsers = localStorage.getItem('workus_public_users')
        if (publicUsers) {
          const users = JSON.parse(publicUsers)
          users.forEach((u: any) => {
            if (u.id && u.role && !localStorageRoles[u.id]) {
              localStorageRoles[u.id] = u.role
            }
          })
        }
      } catch {
        // Ignorer
      }

      // 4. Convertir les utilisateurs IndexedDB
      const localUsers: DisplayUser[] = Array.isArray(dbUsers) ? dbUsers.map(u => {
        // Priorité: 1. Override admin (par ID ou email), 2. localStorage, 3. IndexedDB
        const overrideRole = getOverriddenRole(u.id, u.email)
        const finalRole = (overrideRole || localStorageRoles[u.id] || localStorageRoles[u.email] || u.role) as DisplayUser['role']
        
        return {
          id: u.id,
          username: u.username,
          email: u.email,
          role: finalRole,
          isActive: u.isActive,
          isVerified: u.isVerified,
          joinedAt: u.joinedAt,
          avatar: u.avatar
        }
      }) : []

      // 5. Fusionner les utilisateurs (Supabase + overrides, éviter les doublons)
      const allUserIds = new Set<string>()
      const allEmails = new Set<string>()
      const mergedUsers: DisplayUser[] = []

      // D'abord les utilisateurs Supabase, mais avec override de rôle si présent
      for (const user of supabaseUsers) {
        if (!allUserIds.has(user.id) && !allEmails.has(user.email)) {
          allUserIds.add(user.id)
          allEmails.add(user.email)
          // Appliquer l'override de rôle si existant (cherche par ID puis par email)
          const overriddenRole = getOverriddenRole(user.id, user.email)
          if (overriddenRole) {
            console.log(`Override appliqué pour ${user.username} (${user.email}): ${user.role} -> ${overriddenRole}`)
          }
          mergedUsers.push({
            ...user,
            role: (overriddenRole || user.role) as DisplayUser['role']
          })
        }
      }

      // Puis les utilisateurs locaux (seulement s'ils n'existent pas dans Supabase)
      for (const user of localUsers) {
        if (!allUserIds.has(user.id) && !allEmails.has(user.email)) {
          allUserIds.add(user.id)
          allEmails.add(user.email)
          mergedUsers.push(user)
        }
      }

      // Trier par date d'inscription (plus récent en premier)
      mergedUsers.sort((a, b) => new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime())
      
      setAllUsers(mergedUsers)
    } catch (err) {
      console.error('Erreur chargement utilisateurs:', err)
    } finally {
      setIsLoadingUsers(false)
    }
  }, [dbUsers, loadUsersFromSupabase])

  // Charger les utilisateurs au démarrage et quand dbUsers change
  useEffect(() => {
    loadAllUsers()
  }, [loadAllUsers])

  // Enregistrer le snapshot quotidien des utilisateurs
  useEffect(() => {
    if (allUsers.length > 0) {
      recordDailySnapshot(allUsers.length)
    }
  }, [allUsers.length, recordDailySnapshot])

  // Enregistrer l'activité globale quotidienne
  useEffect(() => {
    // Calculer le temps total et le nombre d'utilisateurs actifs
    const activeUsersList = Object.values(userActivities)
    const activeUsersCount = activeUsersList.filter(u => {
      const lastActive = new Date(u.lastActive)
      const now = new Date()
      // Considéré actif si dernière activité dans les dernières 24h
      return (now.getTime() - lastActive.getTime()) < 24 * 60 * 60 * 1000
    }).length
    
    const totalMinutes = activeUsersList.reduce((sum, u) => sum + (u.totalTime || 0), 0)
    
    if (activeUsersCount > 0 || totalMinutes > 0) {
      recordGlobalActivity(totalMinutes, Math.max(activeUsersCount, allUsers.length))
    }
  }, [userActivities, allUsers.length, recordGlobalActivity])

  // Filtrer les utilisateurs
  const filteredUsers = allUsers.filter(u => {
    const matchesSearch = userSearchQuery === '' || 
      u.username.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearchQuery.toLowerCase())
    const matchesRole = userRoleFilter === null || u.role === userRoleFilter
    return matchesSearch && matchesRole
  })

  // Fonction pour afficher un toast
  const displayToast = (message: string, type: 'success' | 'error') => {
    setShowToast({ message, type })
    setTimeout(() => setShowToast(null), 3000)
  }

  // Ouvrir le modal d'édition
  const handleEditUser = (userToEdit: DisplayUser) => {
    setEditingUser(userToEdit)
    setEditForm({
      username: userToEdit.username,
      email: userToEdit.email,
      role: userToEdit.role,
      isActive: userToEdit.isActive,
      isVerified: userToEdit.isVerified
    })
    setShowEditModal(true)
    setOpenMenuUserId(null)
  }

  // Sauvegarder les modifications d'un utilisateur
  const handleSaveUser = () => {
    if (!editingUser) return

    // Mettre à jour dans localStorage
    const stored = localStorage.getItem('workus_registered_users')
    if (stored) {
      try {
        const users = JSON.parse(stored)
        const updatedUsers = users.map((u: any) => {
          if (u.id === editingUser.id || u.email === editingUser.email) {
            return {
              ...u,
              username: editForm.username,
              email: editForm.email,
              role: editForm.role,
              isActive: editForm.isActive,
              isVerified: editForm.isVerified
            }
          }
          return u
        })
        localStorage.setItem('workus_registered_users', JSON.stringify(updatedUsers))
      } catch {
        // Ignorer
      }
    }

    // Mettre à jour l'état local
    setAllUsers(prev => prev.map(u => {
      if (u.id === editingUser.id) {
        return {
          ...u,
          username: editForm.username,
          email: editForm.email,
          role: editForm.role,
          isActive: editForm.isActive,
          isVerified: editForm.isVerified
        }
      }
      return u
    }))

    setShowEditModal(false)
    setEditingUser(null)
    displayToast('Utilisateur modifié avec succès', 'success')
  }

  // Changer le rôle d'un utilisateur
  const handleChangeRole = async (targetUser: DisplayUser, newRole: DisplayUser['role']) => {
    // Empêcher de modifier son propre rôle admin
    if (targetUser.id === user?.id && user?.role === 'admin') {
      displayToast('Vous ne pouvez pas modifier votre propre rôle', 'error')
      return
    }

    console.log('=== Changement de rôle v5 ===')
    console.log('Utilisateur:', targetUser.username, 'ID:', targetUser.id, 'Email:', targetUser.email)
    console.log('Ancien rôle:', targetUser.role, '-> Nouveau rôle:', newRole)

    // ÉTAPE 1: Sauvegarder l'OVERRIDE local - SOURCE DE VÉRITÉ ABSOLUE
    // On sauvegarde PAR ID ET PAR EMAIL pour garantir la correspondance
    // même si l'ID change entre Supabase et local
    try {
      const overrides = localStorage.getItem('workus_admin_role_overrides')
      const currentOverrides = overrides ? JSON.parse(overrides) : {}
      // Sauvegarder par ID
      currentOverrides[targetUser.id] = newRole
      // Sauvegarder aussi par EMAIL (clé plus stable)
      if (targetUser.email) {
        currentOverrides[targetUser.email] = newRole
        currentOverrides[targetUser.email.toLowerCase()] = newRole
      }
      localStorage.setItem('workus_admin_role_overrides', JSON.stringify(currentOverrides))
      console.log('✅ Override local sauvegardé:', targetUser.id, targetUser.email, '->', newRole)
    } catch (err) {
      console.error('Erreur sauvegarde override:', err)
    }

    // ÉTAPE 2: Mettre à jour dans tous les autres stockages (en parallèle, non-bloquant)
    
    // 2a. Supabase (si configuré)
    if (checkSupabase() && supabase) {
      supabase
        .from('profiles')
        .update({ role: newRole, updated_at: new Date().toISOString() })
        .eq('id', targetUser.id)
        .then(({ error }) => {
          if (error) {
            console.warn('Supabase update échoué:', error.message)
          } else {
            console.log('✅ Supabase mis à jour')
          }
        })
        .catch(err => console.warn('Erreur Supabase:', err))
    }

    // 2b. localStorage (workus_registered_users)
    try {
      const stored = localStorage.getItem('workus_registered_users')
      if (stored) {
        const users = JSON.parse(stored)
        const updatedUsers = users.map((u: any) => 
          (u.id === targetUser.id || u.email === targetUser.email) 
            ? { ...u, role: newRole } 
            : u
        )
        localStorage.setItem('workus_registered_users', JSON.stringify(updatedUsers))
      }
    } catch { /* ignorer */ }

    // 2c. localStorage (workus_public_users)
    try {
      const publicUsers = localStorage.getItem('workus_public_users')
      if (publicUsers) {
        const users = JSON.parse(publicUsers)
        const updatedUsers = users.map((u: any) => 
          u.id === targetUser.id ? { ...u, role: newRole } : u
        )
        localStorage.setItem('workus_public_users', JSON.stringify(updatedUsers))
      }
    } catch { /* ignorer */ }

    // 2d. IndexedDB
    userService.update(targetUser.id, { role: newRole }).catch(err => {
      console.warn('Erreur IndexedDB:', err)
    })

    // 2e. Session utilisateur actuel (si c'est lui qui est modifié)
    try {
      const currentUserData = localStorage.getItem('workus_user')
      if (currentUserData) {
        const currentUser = JSON.parse(currentUserData)
        if (currentUser.id === targetUser.id) {
          currentUser.role = newRole
          localStorage.setItem('workus_user', JSON.stringify(currentUser))
        }
      }
    } catch { /* ignorer */ }

    // ÉTAPE 3: Mettre à jour l'état local IMMÉDIATEMENT
    setAllUsers(prev => prev.map(u => 
      u.id === targetUser.id ? { ...u, role: newRole } : u
    ))

    setOpenMenuUserId(null)
    
    // Ajouter à l'historique des activités
    const roleLabel = newRole === 'admin' ? 'Administrateur' : newRole === 'creator' ? 'Créateur' : newRole === 'moderator' ? 'Modérateur' : 'Utilisateur'
    
    // Enregistrer l'activité (non-bloquant)
    try {
      addActivity({
        type: 'role_promoted',
        message: `${targetUser.username} a été promu ${roleLabel}`,
        userId: targetUser.id,
        userName: targetUser.username,
        metadata: { oldRole: targetUser.role, newRole }
      })
    } catch (activityError) {
      console.warn('Erreur enregistrement activité:', activityError)
    }
    
    console.log('=== Changement de rôle terminé ===')
    displayToast(`Rôle de ${targetUser.username} changé en ${roleLabel}`, 'success')
  }

  // Ouvrir le modal de suppression
  const handleDeleteClick = (targetUser: DisplayUser) => {
    // Empêcher de se supprimer soi-même
    if (targetUser.id === user?.id) {
      displayToast('Vous ne pouvez pas supprimer votre propre compte', 'error')
      return
    }
    
    setUserToDelete(targetUser)
    setShowDeleteModal(true)
    setOpenMenuUserId(null)
  }

  // Supprimer un utilisateur
  const handleDeleteUser = () => {
    if (!userToDelete) return

    // Supprimer de localStorage
    const stored = localStorage.getItem('workus_registered_users')
    if (stored) {
      try {
        const users = JSON.parse(stored)
        const updatedUsers = users.filter((u: any) => u.id !== userToDelete.id && u.email !== userToDelete.email)
        localStorage.setItem('workus_registered_users', JSON.stringify(updatedUsers))
      } catch {
        // Ignorer
      }
    }

    // Mettre à jour l'état local
    setAllUsers(prev => prev.filter(u => u.id !== userToDelete.id))

    setShowDeleteModal(false)
    setUserToDelete(null)
    displayToast('Utilisateur supprimé avec succès', 'success')
  }

  // Basculer le statut actif
  const handleToggleActive = (targetUser: DisplayUser) => {
    const newStatus = !targetUser.isActive

    // Mettre à jour dans localStorage
    const stored = localStorage.getItem('workus_registered_users')
    if (stored) {
      try {
        const users = JSON.parse(stored)
        const updatedUsers = users.map((u: any) => {
          if (u.id === targetUser.id || u.email === targetUser.email) {
            return { ...u, isActive: newStatus }
          }
          return u
        })
        localStorage.setItem('workus_registered_users', JSON.stringify(updatedUsers))
      } catch {
        // Ignorer
      }
    }

    // Mettre à jour l'état local
    setAllUsers(prev => prev.map(u => {
      if (u.id === targetUser.id) {
        return { ...u, isActive: newStatus }
      }
      return u
    }))

    setOpenMenuUserId(null)
    displayToast(newStatus ? 'Compte activé' : 'Compte désactivé', 'success')
  }
  
  // Données admin (seront chargées depuis IndexedDB dans une future version)
  const siteSettings = {
    siteName: 'Work Us',
    siteDescription: 'Plateforme d\'apprentissage et de mise en relation professionnelle',
    maintenanceMode: false,
    registrationEnabled: true,
    contentModerationEnabled: true,
    maxUploadSize: 104857600,
    allowedFileTypes: ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/webm', 'application/pdf'],
    defaultUserRole: 'user',
    emailNotificationsEnabled: true
  }

  // Statistiques dynamiques basées sur les données réelles
  const totalUsers = allUsers.length
  const totalCreators = allUsers.filter(u => u.role === 'creator' || u.role === 'admin').length
  const totalContent = posts.length // Nombre réel de contenus publiés
  const pendingReportsCount = getPendingCount() // Pour le badge de l'onglet signalements
  
  // Statistiques pour la période sélectionnée
  const periodStats = getStatsForPeriod(statPeriod)
  
  // Calcul des pourcentages d'évolution
  const calculateEvolution = (current: number, previous: number): string => {
    if (previous === 0) return current > 0 ? '+100%' : '0%'
    const evolution = ((current - previous) / previous) * 100
    return evolution >= 0 ? `+${evolution.toFixed(0)}%` : `${evolution.toFixed(0)}%`
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Accès refusé</h1>
          <p className="text-dark-400">Vous n'avez pas les permissions nécessaires pour accéder à cette page.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Administration</h1>
            <p className="text-dark-400">Gérez Work Us depuis ce panneau</p>
          </div>
        </div>

        {/* Sélecteur de période pour les stats */}
        {activeTab === 'overview' && (
          <div className="flex items-center gap-2 bg-dark-800 rounded-xl p-1">
            {(['week', 'month', 'year'] as StatPeriod[]).map((period) => (
              <button
                key={period}
                onClick={() => setStatPeriod(period)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  statPeriod === period
                    ? 'bg-red-500 text-white'
                    : 'text-dark-400 hover:text-white'
                }`}
              >
                <Calendar className="w-4 h-4" />
                {period === 'week' ? 'Semaine' : period === 'month' ? 'Mois' : 'Année'}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto gap-2 mb-8 pb-2">
        {tabs.map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as AdminTab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-red-500 text-white'
                  : 'bg-dark-800 text-dark-300 hover:text-white border border-dark-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {tab.id === 'reports' && pendingReportsCount > 0 && (
                <span className="px-2 py-0.5 text-xs bg-white/20 rounded-full">
                  {pendingReportsCount}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Période affichée */}
            <div className="text-sm text-dark-400">
              Statistiques : <span className="text-white font-medium">{periodLabels[statPeriod]}</span>
            </div>

            {/* Stats grid - Évolution dynamique */}
            {(() => {
              const evolution = getUserEvolution()
              // Sélectionner l'évolution en fonction de la période choisie
              const selectedEvolution = statPeriod === 'week' ? evolution.week :
                                        statPeriod === 'month' ? evolution.month : evolution.year
              const periodLabel = statPeriod === 'week' ? 'cette semaine' :
                                  statPeriod === 'month' ? 'ce mois' : 'cette année'
              
              return (
                <div className="grid md:grid-cols-3 gap-4">
                  <StatCard
                    label="Utilisateurs totaux"
                    value={totalUsers.toLocaleString()}
                    change={selectedEvolution.trend === 'up' ? 1 : selectedEvolution.trend === 'down' ? -1 : 0}
                    changeLabel={`${selectedEvolution.percentage} (${selectedEvolution.current} nouveaux ${periodLabel})`}
                    icon={<Users className="w-6 h-6 text-white" />}
                    gradient="from-blue-500 to-cyan-500"
                  />
                  <StatCard
                    label="Créateurs"
                    value={totalCreators}
                    change={totalCreators > 0 ? 1 : 0}
                    changeLabel={`${totalCreators} créateur${totalCreators > 1 ? 's' : ''} actif${totalCreators > 1 ? 's' : ''}`}
                    icon={<UserPlus className="w-6 h-6 text-white" />}
                    gradient="from-purple-500 to-pink-500"
                  />
                  <StatCard
                    label="Contenus publiés"
                    value={totalContent}
                    change={periodStats.content > 0 ? 1 : 0}
                    changeLabel={periodStats.content > 0 ? `+${periodStats.content} ${periodLabel}` : `0 ${periodLabel}`}
                    icon={<FileText className="w-6 h-6 text-white" />}
                    gradient="from-green-500 to-emerald-500"
                  />
                </div>
              )
            })()}

            {/* Temps d'activité moyen par utilisateur */}
            <div className="p-6 bg-dark-800/50 border border-dark-700/50 rounded-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary-400" />
                  Temps d'activité moyen par utilisateur
                </h3>
                <span className="text-xs text-dark-400">Mise à jour en temps réel</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {(() => {
                  const activityStats = getActivityTimeStats()
                  
                  // Fonction pour formater le temps en heures et minutes
                  const formatTime = (minutes: number): string => {
                    if (minutes === 0) return '0 min'
                    const hours = Math.floor(minutes / 60)
                    const mins = minutes % 60
                    if (hours === 0) return `${mins} min`
                    if (mins === 0) return `${hours}h`
                    return `${hours}h ${mins}m`
                  }
                  
                  const periods = [
                    { key: 'day', label: 'Aujourd\'hui', data: activityStats.day, vsLabel: 'hier', gradient: 'from-blue-500 to-cyan-500' },
                    { key: 'week', label: 'Cette semaine', data: activityStats.week, vsLabel: 'sem. préc.', gradient: 'from-purple-500 to-pink-500' },
                    { key: 'month', label: 'Ce mois', data: activityStats.month, vsLabel: 'mois préc.', gradient: 'from-green-500 to-emerald-500' },
                    { key: 'year', label: 'Cette année', data: activityStats.year, vsLabel: 'année préc.', gradient: 'from-orange-500 to-amber-500' }
                  ]
                  
                  return periods.map(period => (
                    <div key={period.key} className="p-4 bg-dark-700/50 rounded-xl border border-dark-600/50 hover:border-dark-500/50 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs text-dark-400">{period.label}</p>
                        <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${period.gradient}`} />
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-white">{formatTime(period.data.average)}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`text-sm font-medium ${
                          period.data.trend === 'up' ? 'text-green-400' :
                          period.data.trend === 'down' ? 'text-red-400' : 'text-dark-400'
                        }`}>
                          {period.data.trend === 'up' ? '↑' : period.data.trend === 'down' ? '↓' : '–'} {period.data.percentage}
                        </span>
                      </div>
                      <p className="text-xs text-dark-500 mt-1">
                        vs {formatTime(period.data.previous)} {period.vsLabel}
                      </p>
                    </div>
                  ))
                })()}
              </div>
            </div>

            {/* Statistiques supplémentaires */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-6 bg-dark-800/50 border border-dark-700/50 rounded-2xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-white">Catégories</h3>
                  <FolderTree className="w-5 h-5 text-primary-400" />
                </div>
                <p className="text-3xl font-bold text-white">{categories.length}</p>
                <p className="text-sm text-dark-400 mt-1">catégories actives</p>
              </div>
              <div className="p-6 bg-dark-800/50 border border-dark-700/50 rounded-2xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-white">Spécialités</h3>
                  <FileText className="w-5 h-5 text-secondary-400" />
                </div>
                <p className="text-3xl font-bold text-white">{specialties.length}</p>
                <p className="text-sm text-dark-400 mt-1">spécialités disponibles</p>
              </div>
            </div>

            {/* Recent activity & Pending content */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Recent activity */}
              <div className="p-6 bg-dark-800/50 border border-dark-700/50 rounded-2xl">
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary-400" />
                  Activité récente
                  {activities.length > 0 && (
                    <span className="text-xs px-2 py-0.5 bg-primary-500/20 text-primary-400 rounded-full">
                      {activities.length}
                    </span>
                  )}
                </h2>
                {activities.length === 0 ? (
                  <div className="text-center py-8">
                    <TrendingUp className="w-12 h-12 text-dark-600 mx-auto mb-4" />
                    <p className="text-dark-400">Aucune activité récente</p>
                    <p className="text-xs text-dark-500 mt-1">Les activités des utilisateurs apparaîtront ici</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                    {getRecentActivities(15).map((activity, index) => (
                      <motion.div
                        key={activity.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="flex items-start gap-3 p-3 bg-dark-700/50 rounded-xl hover:bg-dark-700/70 transition-colors"
                      >
                        <div className={`w-2.5 h-2.5 mt-1.5 rounded-full flex-shrink-0 ${
                          activity.type === 'user_registered' ? 'bg-green-400' :
                          activity.type === 'content_published' ? 'bg-blue-400' :
                          activity.type === 'discussion_created' ? 'bg-cyan-400' :
                          activity.type === 'report_submitted' ? 'bg-red-400' :
                          activity.type === 'role_promoted' ? 'bg-purple-400' :
                          activity.type === 'level_up' ? 'bg-yellow-400' :
                          activity.type === 'formation_purchased' ? 'bg-amber-400' :
                          activity.type === 'post_liked' ? 'bg-pink-400' :
                          activity.type === 'post_saved' ? 'bg-indigo-400' :
                          activity.type === 'user_followed' ? 'bg-teal-400' :
                          activity.type === 'category_created' ? 'bg-orange-400' :
                          activity.type === 'specialty_created' ? 'bg-lime-400' :
                          'bg-dark-400'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white">{activity.message}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-xs text-dark-500">
                                              {new Date(activity.createdAt).toLocaleString('fr-FR', {
                                                day: '2-digit',
                                                month: 'short',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                              })}
                            </p>
                            <span className={`text-xs px-1.5 py-0.5 rounded ${
                              activity.type === 'user_registered' ? 'bg-green-500/20 text-green-400' :
                              activity.type === 'content_published' ? 'bg-blue-500/20 text-blue-400' :
                              activity.type === 'discussion_created' ? 'bg-cyan-500/20 text-cyan-400' :
                              activity.type === 'report_submitted' ? 'bg-red-500/20 text-red-400' :
                              activity.type === 'role_promoted' ? 'bg-purple-500/20 text-purple-400' :
                              'bg-dark-600 text-dark-300'
                            }`}>
                              {activity.type === 'user_registered' ? 'Inscription' :
                               activity.type === 'content_published' ? 'Publication' :
                               activity.type === 'discussion_created' ? 'Discussion' :
                               activity.type === 'report_submitted' ? 'Signalement' :
                               activity.type === 'role_promoted' ? 'Promotion' :
                               activity.type === 'level_up' ? 'Niveau' :
                               activity.type === 'formation_purchased' ? 'Formation' :
                               activity.type === 'post_liked' ? 'Like' :
                               activity.type === 'user_followed' ? 'Abonnement' :
                               'Activité'}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Pending content */}
              <div className="p-6 bg-dark-800/50 border border-dark-700/50 rounded-2xl">
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-amber-400" />
                  Contenu en attente de validation
                </h2>
                {pendingContent.length === 0 ? (
                  <div className="text-center py-8">
                    <FileCheck className="w-12 h-12 text-dark-600 mx-auto mb-4" />
                    <p className="text-dark-400">Aucun contenu en attente</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingContent.map((content, index) => (
                      <motion.div
                        key={content.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center justify-between p-4 bg-dark-700/50 rounded-xl"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-white truncate">{content.title}</p>
                          <p className="text-sm text-dark-400">
                            Par {content.authorName} • {content.type}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button className="p-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors">
                            <Check className="w-4 h-4" />
                          </button>
                          <button className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors">
                            <X className="w-4 h-4" />
                          </button>
                          <button className="p-2 text-dark-400 hover:text-white transition-colors">
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Users */}
        {activeTab === 'users' && (
          <div className="p-6 bg-dark-800/50 border border-dark-700/50 rounded-2xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div>
                  <h2 className="text-lg font-bold text-white">Gestion des utilisateurs</h2>
                  <p className="text-sm text-dark-400">{allUsers.length} utilisateur{allUsers.length > 1 ? 's' : ''} au total</p>
                </div>
                <button
                  onClick={() => loadAllUsers()}
                  disabled={isLoadingUsers}
                  className={`p-2 rounded-lg transition-colors ${
                    isLoadingUsers 
                      ? 'bg-dark-700 text-dark-400 cursor-not-allowed' 
                      : 'bg-dark-700 text-dark-300 hover:bg-dark-600 hover:text-white'
                  }`}
                  title="Rafraîchir la liste"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingUsers ? 'animate-spin' : ''}`} />
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                  <input
                    type="text"
                    placeholder="Rechercher..."
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:border-primary-500"
                  />
                </div>
                <div className="flex items-center gap-1 bg-dark-700 rounded-lg p-1">
                  <button 
                    onClick={() => setUserRoleFilter(null)}
                    className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                      userRoleFilter === null ? 'bg-primary-500 text-white' : 'text-dark-400 hover:text-white'
                    }`}
                  >
                    Tous
                  </button>
                  <button 
                    onClick={() => setUserRoleFilter('admin')}
                    className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                      userRoleFilter === 'admin' ? 'bg-red-500 text-white' : 'text-dark-400 hover:text-white'
                    }`}
                  >
                    Admin
                  </button>
                  <button 
                    onClick={() => setUserRoleFilter('creator')}
                    className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                      userRoleFilter === 'creator' ? 'bg-blue-500 text-white' : 'text-dark-400 hover:text-white'
                    }`}
                  >
                    Créateur
                  </button>
                  <button 
                    onClick={() => setUserRoleFilter('user')}
                    className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                      userRoleFilter === 'user' ? 'bg-green-500 text-white' : 'text-dark-400 hover:text-white'
                    }`}
                  >
                    User
                  </button>
                </div>
              </div>
            </div>

            {/* Stats rapides des rôles */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="flex items-center gap-3 p-3 bg-dark-700/50 rounded-xl">
                <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                  <Crown className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <p className="text-xl font-bold text-white">{allUsers.filter(u => u.role === 'admin').length}</p>
                  <p className="text-xs text-dark-400">Administrateurs</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-dark-700/50 rounded-xl">
                <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-xl font-bold text-white">{allUsers.filter(u => u.role === 'moderator').length}</p>
                  <p className="text-xs text-dark-400">Modérateurs</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-dark-700/50 rounded-xl">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <Star className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-xl font-bold text-white">{allUsers.filter(u => u.role === 'creator').length}</p>
                  <p className="text-xs text-dark-400">Créateurs</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-dark-700/50 rounded-xl">
                <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <Users className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-xl font-bold text-white">{allUsers.filter(u => u.role === 'user').length}</p>
                  <p className="text-xs text-dark-400">Utilisateurs</p>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-dark-700">
                    <th className="text-left py-3 px-4 text-dark-400 font-medium">Utilisateur</th>
                    <th className="text-left py-3 px-4 text-dark-400 font-medium">Rôle</th>
                    <th className="text-left py-3 px-4 text-dark-400 font-medium">Statut</th>
                    <th className="text-left py-3 px-4 text-dark-400 font-medium">Inscription</th>
                    <th className="text-left py-3 px-4 text-dark-400 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center">
                        <Users className="w-12 h-12 text-dark-600 mx-auto mb-4" />
                        <p className="text-dark-400">Aucun utilisateur trouvé</p>
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u, index) => (
                      <motion.tr 
                        key={u.id} 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="border-b border-dark-700/50 hover:bg-dark-700/30"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                              u.role === 'admin' ? 'bg-gradient-to-br from-red-500 to-orange-500' :
                              u.role === 'creator' ? 'bg-gradient-to-br from-blue-500 to-cyan-500' :
                              u.role === 'moderator' ? 'bg-gradient-to-br from-purple-500 to-pink-500' :
                              'bg-gradient-to-br from-green-500 to-emerald-500'
                            }`}>
                              {u.username[0].toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-white">{u.username}</p>
                                {u.role === 'admin' && <Crown className="w-4 h-4 text-red-400" />}
                                {u.role === 'creator' && <Star className="w-4 h-4 text-blue-400" />}
                                {u.isVerified && <CheckCircle className="w-4 h-4 text-green-400" />}
                              </div>
                              <p className="text-sm text-dark-400">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${roleColors[u.role]}`}>
                            {u.role === 'admin' ? 'Administrateur' : 
                             u.role === 'creator' ? 'Créateur' : 
                             u.role === 'moderator' ? 'Modérateur' : 
                             'Utilisateur'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            u.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                          }`}>
                            {u.isActive ? 'Actif' : 'Inactif'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-dark-400">
                          {new Date(u.joinedAt).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2 relative">
                            {/* Bouton Modifier */}
                            <button 
                              onClick={() => handleEditUser(u)}
                              className="p-2 text-dark-400 hover:text-white transition-colors" 
                              title="Modifier"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            
                            {/* Bouton Bannir/Activer */}
                            <button 
                              onClick={() => handleToggleActive(u)}
                              className={`p-2 transition-colors ${
                                u.isActive 
                                  ? 'text-dark-400 hover:text-red-400' 
                                  : 'text-red-400 hover:text-green-400'
                              }`}
                              title={u.isActive ? 'Désactiver' : 'Activer'}
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                            
                            {/* Menu Plus d'options */}
                            <div className="relative">
                              <button 
                                onClick={() => setOpenMenuUserId(openMenuUserId === u.id ? null : u.id)}
                                className="p-2 text-dark-400 hover:text-white transition-colors" 
                                title="Plus d'options"
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </button>
                              
                              {/* Menu déroulant */}
                              {openMenuUserId === u.id && (
                                <>
                                  <div 
                                    className="fixed inset-0 z-40" 
                                    onClick={() => setOpenMenuUserId(null)} 
                                  />
                                  <div className="absolute right-0 top-full mt-1 w-56 bg-dark-800 border border-dark-700 rounded-xl shadow-xl z-50 overflow-hidden">
                                    {/* Changer le rôle */}
                                    <div className="px-3 py-2 border-b border-dark-700">
                                      <p className="text-xs text-dark-500 uppercase font-medium mb-2">Changer le rôle</p>
                                      <div className="space-y-1">
                                        {(['admin', 'moderator', 'creator', 'user'] as const).map(role => (
                                          <button
                                            key={role}
                                            onClick={() => handleChangeRole(u, role)}
                                            disabled={u.id === user?.id && user?.role === 'admin'}
                                            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm transition-colors ${
                                              u.role === role 
                                                ? 'bg-primary-500/20 text-primary-400' 
                                                : 'text-dark-300 hover:bg-dark-700 hover:text-white'
                                            } ${u.id === user?.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                                          >
                                            {role === 'admin' && <Crown className="w-4 h-4 text-red-400" />}
                                            {role === 'moderator' && <Shield className="w-4 h-4 text-purple-400" />}
                                            {role === 'creator' && <Star className="w-4 h-4 text-blue-400" />}
                                            {role === 'user' && <Users className="w-4 h-4 text-green-400" />}
                                            <span>
                                              {role === 'admin' ? 'Administrateur' : 
                                               role === 'moderator' ? 'Modérateur' : 
                                               role === 'creator' ? 'Créateur' : 'Utilisateur'}
                                            </span>
                                            {u.role === role && <Check className="w-4 h-4 ml-auto" />}
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                    
                                    {/* Actions */}
                                    <div className="p-2">
                                      <button
                                        onClick={() => handleEditUser(u)}
                                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm text-dark-300 hover:bg-dark-700 hover:text-white transition-colors"
                                      >
                                        <UserCog className="w-4 h-4" />
                                        Modifier le profil
                                      </button>
                                      <button
                                        onClick={() => handleToggleActive(u)}
                                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm transition-colors ${
                                          u.isActive 
                                            ? 'text-yellow-400 hover:bg-yellow-500/20' 
                                            : 'text-green-400 hover:bg-green-500/20'
                                        }`}
                                      >
                                        <Ban className="w-4 h-4" />
                                        {u.isActive ? 'Désactiver le compte' : 'Activer le compte'}
                                      </button>
                                      <button
                                        onClick={() => handleDeleteClick(u)}
                                        disabled={u.id === user?.id}
                                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm text-red-400 hover:bg-red-500/20 transition-colors ${
                                          u.id === user?.id ? 'opacity-50 cursor-not-allowed' : ''
                                        }`}
                                      >
                                        <Trash2 className="w-4 h-4" />
                                        Supprimer le compte
                                      </button>
                                    </div>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Modal d'édition */}
            <AnimatePresence>
              {showEditModal && editingUser && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
                  onClick={() => setShowEditModal(false)}
                >
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full max-w-md bg-dark-800 border border-dark-700 rounded-2xl overflow-hidden"
                  >
                    <div className="p-6 border-b border-dark-700">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-white">Modifier l'utilisateur</h3>
                        <button
                          onClick={() => setShowEditModal(false)}
                          className="p-2 text-dark-400 hover:text-white transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="p-6 space-y-4">
                      {/* Nom d'utilisateur */}
                      <div>
                        <label className="block text-sm font-medium text-dark-300 mb-2">
                          Nom d'utilisateur
                        </label>
                        <input
                          type="text"
                          value={editForm.username}
                          onChange={(e) => setEditForm(prev => ({ ...prev, username: e.target.value }))}
                          className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
                        />
                      </div>
                      
                      {/* Email */}
                      <div>
                        <label className="block text-sm font-medium text-dark-300 mb-2">
                          Email
                        </label>
                        <input
                          type="email"
                          value={editForm.email}
                          onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                          className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
                        />
                      </div>
                      
                      {/* Rôle */}
                      <div>
                        <label className="block text-sm font-medium text-dark-300 mb-2">
                          Rôle
                        </label>
                        <select
                          value={editForm.role}
                          onChange={(e) => setEditForm(prev => ({ ...prev, role: e.target.value as DisplayUser['role'] }))}
                          className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
                        >
                          <option value="user">Utilisateur</option>
                          <option value="creator">Créateur</option>
                          <option value="moderator">Modérateur</option>
                          <option value="admin">Administrateur</option>
                        </select>
                      </div>
                      
                      {/* Statuts */}
                      <div className="flex items-center gap-6">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editForm.isActive}
                            onChange={(e) => setEditForm(prev => ({ ...prev, isActive: e.target.checked }))}
                            className="w-4 h-4 rounded border-dark-600 bg-dark-700 text-primary-500"
                          />
                          <span className="text-sm text-dark-300">Compte actif</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editForm.isVerified}
                            onChange={(e) => setEditForm(prev => ({ ...prev, isVerified: e.target.checked }))}
                            className="w-4 h-4 rounded border-dark-600 bg-dark-700 text-primary-500"
                          />
                          <span className="text-sm text-dark-300">Vérifié</span>
                        </label>
                      </div>
                    </div>
                    
                    <div className="p-6 border-t border-dark-700 flex justify-end gap-3">
                      <button
                        onClick={() => setShowEditModal(false)}
                        className="px-4 py-2 bg-dark-700 text-dark-300 rounded-lg hover:text-white transition-colors"
                      >
                        Annuler
                      </button>
                      <button
                        onClick={handleSaveUser}
                        className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                      >
                        Enregistrer
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Modal de suppression */}
            <AnimatePresence>
              {showDeleteModal && userToDelete && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
                  onClick={() => setShowDeleteModal(false)}
                >
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full max-w-md bg-dark-800 border border-dark-700 rounded-2xl overflow-hidden"
                  >
                    <div className="p-6 text-center">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                        <Trash2 className="w-8 h-8 text-red-400" />
                      </div>
                      <h3 className="text-lg font-bold text-white mb-2">Supprimer l'utilisateur ?</h3>
                      <p className="text-dark-400 mb-6">
                        Êtes-vous sûr de vouloir supprimer le compte de <span className="text-white font-medium">{userToDelete.username}</span> ? Cette action est irréversible.
                      </p>
                      <div className="flex justify-center gap-3">
                        <button
                          onClick={() => setShowDeleteModal(false)}
                          className="px-6 py-2 bg-dark-700 text-dark-300 rounded-lg hover:text-white transition-colors"
                        >
                          Annuler
                        </button>
                        <button
                          onClick={handleDeleteUser}
                          className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                        >
                          Supprimer
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Toast notification */}
            <AnimatePresence>
              {showToast && (
                <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 50 }}
                  className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl flex items-center gap-3 shadow-lg ${
                    showToast.type === 'success' 
                      ? 'bg-green-500/20 border border-green-500/30 text-green-400' 
                      : 'bg-red-500/20 border border-red-500/30 text-red-400'
                  }`}
                >
                  {showToast.type === 'success' ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <X className="w-5 h-5" />
                  )}
                  <span className="font-medium">{showToast.message}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Reports */}
        {activeTab === 'reports' && (
          <div className="p-6 bg-dark-800/50 border border-dark-700/50 rounded-2xl">
            <h2 className="text-lg font-bold text-white mb-6">Signalements</h2>
            {reports.length === 0 && contextReports.length === 0 ? (
              <div className="text-center py-12">
                <Flag className="w-12 h-12 text-dark-600 mx-auto mb-4" />
                <p className="text-dark-400">Aucun signalement</p>
              </div>
            ) : (
              <div className="space-y-4">
                {[...contextReports, ...reports].map((report, index) => (
                  <motion.div
                    key={report.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`p-4 rounded-xl border ${
                      report.status === 'pending'
                        ? 'bg-red-500/5 border-red-500/20'
                        : 'bg-dark-700/50 border-dark-700'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            report.reason === 'spam' ? 'bg-yellow-500/20 text-yellow-400' :
                            report.reason === 'inappropriate' ? 'bg-orange-500/20 text-orange-400' :
                            report.reason === 'harassment' ? 'bg-red-500/20 text-red-400' :
                            'bg-gray-500/20 text-gray-400'
                          }`}>
                            {report.reason}
                          </span>
                          <span className="text-sm text-dark-400">• {'contentType' in report ? report.contentType : report.type}</span>
                        </div>
                        <p className="font-medium text-white">{'contentTitle' in report ? report.contentTitle : report.targetTitle}</p>
                        <p className="text-sm text-dark-400 mt-1">{'contentPreview' in report ? report.contentPreview : report.description}</p>
                        <p className="text-xs text-dark-500 mt-2">
                          Signalé par {'reporterName' in report ? report.reporterName : report.reporterName} • {new Date(report.createdAt).toLocaleString('fr-FR')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="px-3 py-1.5 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors text-sm">
                          Résoudre
                        </button>
                        <button className="px-3 py-1.5 bg-dark-600 text-dark-300 rounded-lg hover:bg-dark-500 transition-colors text-sm">
                          Rejeter
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Settings */}
        {activeTab === 'settings' && (
          <div className="p-6 bg-dark-800/50 border border-dark-700/50 rounded-2xl space-y-6">
            <h2 className="text-lg font-bold text-white">Paramètres du site</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">Nom du site</label>
                <input
                  type="text"
                  defaultValue={siteSettings.siteName}
                  className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-xl text-white focus:outline-none focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">Rôle par défaut</label>
                <select
                  defaultValue={siteSettings.defaultUserRole}
                  className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-xl text-white focus:outline-none focus:border-primary-500"
                >
                  <option value="user">Utilisateur</option>
                  <option value="creator">Créateur</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">Description</label>
              <textarea
                rows={3}
                defaultValue={siteSettings.siteDescription}
                className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-xl text-white focus:outline-none focus:border-primary-500 resize-none"
              />
            </div>

            <div className="space-y-4">
              {[
                { id: 'maintenance', label: 'Mode maintenance', desc: 'Désactive temporairement le site', value: siteSettings.maintenanceMode },
                { id: 'registration', label: 'Inscriptions ouvertes', desc: 'Autoriser les nouvelles inscriptions', value: siteSettings.registrationEnabled },
                { id: 'moderation', label: 'Modération du contenu', desc: 'Valider le contenu avant publication', value: siteSettings.contentModerationEnabled },
                { id: 'emails', label: 'Notifications email', desc: 'Envoyer des emails aux utilisateurs', value: siteSettings.emailNotificationsEnabled },
              ].map(setting => (
                <div key={setting.id} className="flex items-center justify-between py-3 border-b border-dark-700/50 last:border-0">
                  <div>
                    <p className="font-medium text-white">{setting.label}</p>
                    <p className="text-sm text-dark-400">{setting.desc}</p>
                  </div>
                  <button
                    className={`w-12 h-7 rounded-full transition-colors ${
                      setting.value ? 'bg-primary-500' : 'bg-dark-600'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
                      setting.value ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>
              ))}
            </div>

            <button className="px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-primary-500/20 transition-all">
              Sauvegarder les paramètres
            </button>
          </div>
        )}

        {/* Categories & Content tabs - simplified */}
        {(activeTab === 'categories' || activeTab === 'content') && (
          <div className="p-6 bg-dark-800/50 border border-dark-700/50 rounded-2xl text-center py-12">
            <FolderTree className="w-16 h-16 text-dark-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">
              {activeTab === 'categories' ? 'Gestion des catégories' : 'Gestion du contenu'}
            </h2>
            <p className="text-dark-400 mb-4">
              {activeTab === 'categories' 
                ? `${categories.length} catégories et ${specialties.length} spécialités configurées`
                : `${totalContent} contenus publiés`
              }
            </p>
            <a
              href="/admin/content"
              className="inline-block px-6 py-3 bg-primary-500 text-white font-semibold rounded-xl hover:bg-primary-600 transition-colors"
            >
              Gérer le contenu
            </a>
          </div>
        )}
      </motion.div>
    </div>
  )
}
