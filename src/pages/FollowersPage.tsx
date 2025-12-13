import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { UserPlus, Users, UserCheck, Search, MoreHorizontal, X, Check, Crown, Shield, Star } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useUserData } from '../contexts/UserDataContext'
import { useNotifications } from '../contexts/NotificationsContext'
import { useActivity } from '../contexts/ActivityContext'

type TabType = 'followers' | 'following'

interface UserItem {
  id: string
  username: string
  bio: string
  followers: number
  avatar?: string
  role?: 'user' | 'creator' | 'moderator' | 'admin'
}

const mockFollowers: UserItem[] = []

const mockFollowingList: UserItem[] = []

/**
 * FollowersPage - Gestion des followers avec persistance automatique
 */
export function FollowersPage() {
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  const { isFollowing, followUser, unfollowUser, data, getUserById } = useUserData()
  const { addNotification } = useNotifications()
  const { addActivity } = useActivity()
  
  const [activeTab, setActiveTab] = useState<TabType>('followers')
  const [searchQuery, setSearchQuery] = useState('')
  const [removedFollowers, setRemovedFollowers] = useState<string[]>([])
  const [showToast, setShowToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null)
  const [actionMenu, setActionMenu] = useState<string | null>(null)

  // Filtrer les followers (exclure les retirés)
  const followers = mockFollowers.filter(f => !removedFollowers.includes(f.id))
  
  // Following = users que l'utilisateur suit (depuis la persistance + mock)
  // Récupérer les infos complètes depuis la liste des utilisateurs publics
  const following = [
    ...mockFollowingList,
    ...data.following.filter(f => !mockFollowingList.some(m => m.id === f.id)).map(f => {
      const publicUser = getUserById(f.id)
      return {
        id: f.id,
        username: publicUser?.username || f.username,
        bio: publicUser?.bio || `Membre de Work Us`,
        followers: publicUser?.followers?.length || 0,
        avatar: publicUser?.avatar,
        role: publicUser?.role
      }
    })
  ]

  const currentData = activeTab === 'followers' ? followers : following

  // Filtrer par recherche
  const filteredData = currentData.filter(user =>
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.bio.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Calculer les stats
  const followersCount = followers.length
  const followingCount = data.following.length + mockFollowingList.length

  // Afficher un toast
  const showNotification = (message: string, type: 'success' | 'info' = 'success') => {
    setShowToast({ message, type })
    setTimeout(() => setShowToast(null), 3000)
  }

  // Suivre/Ne plus suivre un utilisateur
  const handleToggleFollow = (userId: string, username: string) => {
    if (!isAuthenticated || !user) {
      showNotification('Connectez-vous pour suivre des utilisateurs', 'info')
      return
    }

    if (isFollowing(userId)) {
      unfollowUser(userId)
      showNotification(`Vous ne suivez plus ${username}`)
    } else {
      followUser(userId, username)
      showNotification(`Vous suivez ${username}`)
      
      // Envoyer une notification à l'utilisateur suivi
      addNotification({
        type: 'follow',
        title: 'Nouveau follower',
        message: `${user.username} a commencé à vous suivre`,
        fromUserId: user.id,
        fromUserName: user.username,
        targetId: userId,
        targetType: 'profile',
        targetUrl: '/followers',
      })
      
      // Ajouter à l'historique des activités
      addActivity({
        type: 'user_followed',
        message: `${user.username} suit maintenant ${username}`,
        userId: user.id,
        userName: user.username,
        targetId: userId,
        targetName: username
      })
    }
  }

  // Retirer un follower
  const handleRemoveFollower = (userId: string) => {
    const followerToRemove = followers.find(u => u.id === userId)
    if (followerToRemove) {
      setRemovedFollowers(prev => [...prev, userId])
      showNotification(`${followerToRemove.username} a été retiré de vos followers`)
    }
    setActionMenu(null)
  }

  // Suggestions (utilisateurs non suivis parmi les followers)
  const suggestions = followers.filter(u => !isFollowing(u.id)).slice(0, 4)

  return (
    <div className="max-w-3xl mx-auto">
      {/* Toast notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className={`fixed top-20 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg ${
              showToast.type === 'success' ? 'bg-green-500' : 'bg-primary-500'
            } text-white`}
          >
            <Check className="w-5 h-5" />
            {showToast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
          <UserPlus className="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Réseau</h1>
          <p className="text-dark-400">Gérez vos followers et abonnements</p>
        </div>
      </div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 gap-4 mb-8"
      >
        <div 
          className={`p-6 bg-dark-800/50 border rounded-2xl text-center cursor-pointer transition-all ${
            activeTab === 'followers' ? 'border-primary-500' : 'border-dark-700/50 hover:border-dark-600'
          }`}
          onClick={() => setActiveTab('followers')}
        >
          <p className="text-3xl font-bold text-white mb-1">{followersCount}</p>
          <p className="text-dark-400">Followers</p>
        </div>
        <div 
          className={`p-6 bg-dark-800/50 border rounded-2xl text-center cursor-pointer transition-all ${
            activeTab === 'following' ? 'border-primary-500' : 'border-dark-700/50 hover:border-dark-600'
          }`}
          onClick={() => setActiveTab('following')}
        >
          <p className="text-3xl font-bold text-white mb-1">{followingCount}</p>
          <p className="text-dark-400">Abonnements</p>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('followers')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all ${
            activeTab === 'followers'
              ? 'bg-primary-500 text-white'
              : 'bg-dark-800 text-dark-300 hover:text-white border border-dark-700'
          }`}
        >
          <Users className="w-4 h-4" />
          Followers
        </button>
        <button
          onClick={() => setActiveTab('following')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all ${
            activeTab === 'following'
              ? 'bg-primary-500 text-white'
              : 'bg-dark-800 text-dark-300 hover:text-white border border-dark-700'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          Abonnements
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Rechercher..."
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

      {/* List */}
      <div className="space-y-3">
        {filteredData.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-dark-400">
              {searchQuery ? 'Aucun résultat trouvé' : 'Aucun utilisateur dans cette liste'}
            </p>
          </div>
        ) : (
          filteredData.map((userItem, index) => {
            const userIsFollowed = isFollowing(userItem.id) || (activeTab === 'following' && mockFollowingList.some(m => m.id === userItem.id))
            
            // Fonction pour afficher le badge de rôle
            const renderRoleBadge = () => {
              if (userItem.role === 'admin') {
                return (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-gradient-to-r from-red-500 to-orange-500 text-white text-[10px] font-bold rounded-full">
                    <Crown className="w-2.5 h-2.5" />
                    Admin
                  </span>
                )
              }
              if (userItem.role === 'moderator') {
                return (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-[10px] font-bold rounded-full">
                    <Shield className="w-2.5 h-2.5" />
                    Mod
                  </span>
                )
              }
              if (userItem.role === 'creator') {
                return (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[10px] font-bold rounded-full">
                    <Star className="w-2.5 h-2.5" />
                    Créateur
                  </span>
                )
              }
              return null
            }
            
            return (
              <motion.div
                key={userItem.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between p-4 bg-dark-800/50 border border-dark-700/50 rounded-xl hover:border-dark-600 transition-all"
              >
                <div 
                  className="flex items-center gap-4 cursor-pointer flex-1"
                  onClick={() => navigate(`/profile/${userItem.id}`)}
                >
                  {/* Avatar */}
                  {userItem.avatar ? (
                    <img 
                      src={userItem.avatar} 
                      alt={userItem.username}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white font-bold">
                      {userItem.username[0]?.toUpperCase() || 'U'}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-white hover:text-primary-400 transition-colors">
                        {userItem.username}
                      </p>
                      {renderRoleBadge()}
                    </div>
                    <p className="text-sm text-dark-400 line-clamp-1">{userItem.bio}</p>
                    <p className="text-xs text-dark-500">{userItem.followers.toLocaleString()} followers</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleFollow(userItem.id, userItem.username)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      userIsFollowed
                        ? 'bg-dark-700 text-white hover:bg-red-500/20 hover:text-red-400'
                        : 'bg-primary-500 text-white hover:bg-primary-600'
                    }`}
                  >
                    {userIsFollowed ? 'Abonné' : 'Suivre'}
                  </button>
                  
                  {/* Action menu */}
                  <div className="relative">
                    <button 
                      onClick={() => setActionMenu(actionMenu === userItem.id ? null : userItem.id)}
                      className="p-2 text-dark-400 hover:text-white transition-colors"
                    >
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                    
                    <AnimatePresence>
                      {actionMenu === userItem.id && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="absolute right-0 mt-2 w-48 bg-dark-800 border border-dark-700 rounded-xl shadow-xl overflow-hidden z-10"
                        >
                          <button
                            onClick={() => {
                              navigate(`/profile/${userItem.id}`)
                              setActionMenu(null)
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-dark-300 hover:bg-dark-700 hover:text-white transition-colors"
                          >
                            Voir le profil
                          </button>
                          {activeTab === 'followers' && (
                            <button
                              onClick={() => handleRemoveFollower(userItem.id)}
                              className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                            >
                              Retirer ce follower
                            </button>
                          )}
                          <button
                            onClick={() => setActionMenu(null)}
                            className="w-full px-4 py-2 text-left text-sm text-dark-300 hover:bg-dark-700 hover:text-white transition-colors"
                          >
                            Signaler
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            )
          })
        )}
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && activeTab === 'followers' && (
        <section className="mt-12">
          <h2 className="text-xl font-bold text-white mb-6">Suggestions</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {suggestions.map((user, index) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="p-4 bg-dark-800/50 border border-dark-700/50 rounded-xl"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-400 to-accent-600 flex items-center justify-center text-white font-bold">
                    {user.username[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white truncate">{user.username}</p>
                    <p className="text-xs text-dark-400">{user.followers.toLocaleString()} followers</p>
                  </div>
                </div>
                <p className="text-sm text-dark-400 mb-3 line-clamp-2">{user.bio}</p>
                <button 
                  onClick={() => handleToggleFollow(user.id, user.username)}
                  className="w-full py-2 bg-primary-500/10 border border-primary-500/30 text-primary-400 rounded-lg hover:bg-primary-500/20 transition-all"
                >
                  Suivre
                </button>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Click outside to close menu */}
      {actionMenu && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => setActionMenu(null)}
        />
      )}
    </div>
  )
}
