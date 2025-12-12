import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'

/**
 * Types pour les données utilisateur
 */
export interface UserProfile {
  id: string
  username: string
  email: string
  avatar?: string
  bio?: string
  role: 'user' | 'creator' | 'moderator' | 'admin'
  specialties: string[]
  followers: string[]
  following: string[]
  createdAt: string
  lastLogin?: string
}

export interface SavedItem {
  id: string
  userId: string
  itemType: 'post' | 'content' | 'discussion' | 'resource' | 'specialty' | 'formation'
  itemId: string
  title?: string
  savedAt: string
}

export interface LikedItem {
  id: string
  userId: string
  itemType: 'post' | 'content' | 'discussion' | 'resource' | 'comment'
  itemId: string
  likedAt: string
}

export interface FollowingUser {
  id: string
  username: string
  followedAt: string
}

export interface SkillProgress {
  skillId: string
  level: number
  hoursWorked: number
  exercisesCompleted: number
  lastPracticed: string
}

export interface DailyActivity {
  date: string
  timeSpentMinutes: number
  exercisesCompleted: number
}

export interface UserData {
  following: FollowingUser[]
  skillProgress: Record<string, SkillProgress>
  dailyActivity: DailyActivity[]
  savedItems: SavedItem[]
  likedItems: LikedItem[]
}

interface UserDataContextType {
  // Users management
  users: UserProfile[]
  savedItems: SavedItem[]
  addUser: (user: Omit<UserProfile, 'createdAt' | 'followers' | 'following'>) => void
  updateUser: (id: string, updates: Partial<UserProfile>) => void
  deleteUser: (id: string) => void
  getUserById: (id: string) => UserProfile | undefined
  getUserByEmail: (email: string) => UserProfile | undefined
  searchUsers: (query: string) => UserProfile[]
  getAllUsers: () => UserProfile[]
  updateUserRole: (userId: string, role: UserProfile['role']) => void
  
  // Following system
  followUser: (userId: string, username: string) => void
  unfollowUser: (userId: string) => void
  isFollowing: (userId: string) => boolean
  
  // Saved items
  saveItem: (itemId: string, itemType: SavedItem['itemType'], title?: string) => void
  unsaveItem: (itemId: string) => void
  isSaved: (itemId: string) => boolean
  getSavedItems: (userId: string) => SavedItem[]
  
  // Liked items
  likeItem: (itemId: string, itemType: LikedItem['itemType']) => void
  unlikeItem: (itemId: string) => void
  isLiked: (itemId: string) => boolean
  
  // Activity tracking
  getWeeklyActivity: () => DailyActivity[]
  getTodayActivity: () => number
  addActivityTime: (minutes: number) => void
  
  // Skill progress
  updateSkillProgress: (skillId: string, updates: Partial<SkillProgress>) => void
  
  // User data object for components
  data: UserData
}

const USERS_STORAGE_KEY = 'workus_users'
const USER_DATA_STORAGE_KEY = 'workus_user_data'

const UserDataContext = createContext<UserDataContextType | undefined>(undefined)

const getDefaultUserData = (): UserData => ({
  following: [],
  skillProgress: {},
  dailyActivity: [],
  savedItems: [],
  likedItems: []
})

/**
 * UserDataProvider - Gère les données utilisateur
 */
export function UserDataProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [data, setData] = useState<UserData>(getDefaultUserData())

  // Charger les données au démarrage
  useEffect(() => {
    const storedUsers = localStorage.getItem(USERS_STORAGE_KEY)
    if (storedUsers) {
      try {
        setUsers(JSON.parse(storedUsers))
      } catch {
        setUsers([])
      }
    }

    const storedData = localStorage.getItem(USER_DATA_STORAGE_KEY)
    if (storedData) {
      try {
        setData(JSON.parse(storedData))
      } catch {
        setData(getDefaultUserData())
      }
    }
  }, [])

  // Sauvegarder automatiquement
  useEffect(() => {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users))
  }, [users])

  useEffect(() => {
    localStorage.setItem(USER_DATA_STORAGE_KEY, JSON.stringify(data))
  }, [data])

  // === USERS MANAGEMENT ===
  
  const addUser = useCallback((user: Omit<UserProfile, 'createdAt' | 'followers' | 'following'>) => {
    const newUser: UserProfile = {
      ...user,
      followers: [],
      following: [],
      createdAt: new Date().toISOString()
    }
    setUsers(prev => [...prev, newUser])
  }, [])

  const updateUser = useCallback((id: string, updates: Partial<UserProfile>) => {
    setUsers(prev => prev.map(u => 
      u.id === id ? { ...u, ...updates } : u
    ))
  }, [])

  const deleteUser = useCallback((id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id))
  }, [])

  const getUserById = useCallback((id: string) => {
    return users.find(u => u.id === id)
  }, [users])

  const getUserByEmail = useCallback((email: string) => {
    return users.find(u => u.email === email)
  }, [users])

  const searchUsers = useCallback((query: string) => {
    const lowerQuery = query.toLowerCase()
    return users.filter(u => 
      u.username.toLowerCase().includes(lowerQuery) ||
      u.email.toLowerCase().includes(lowerQuery) ||
      u.bio?.toLowerCase().includes(lowerQuery)
    )
  }, [users])

  const getAllUsers = useCallback(() => {
    return users
  }, [users])

  const updateUserRole = useCallback((userId: string, role: UserProfile['role']) => {
    setUsers(prev => prev.map(u => 
      u.id === userId ? { ...u, role } : u
    ))
  }, [])

  // === FOLLOWING SYSTEM ===
  
  const followUser = useCallback((userId: string, username: string) => {
    setData(prev => ({
      ...prev,
      following: [
        ...prev.following,
        { id: userId, username, followedAt: new Date().toISOString() }
      ]
    }))
  }, [])

  const unfollowUser = useCallback((userId: string) => {
    setData(prev => ({
      ...prev,
      following: prev.following.filter(f => f.id !== userId)
    }))
  }, [])

  const isFollowing = useCallback((userId: string) => {
    return data.following.some(f => f.id === userId)
  }, [data.following])

  // === SAVED ITEMS ===
  
  const saveItem = useCallback((itemId: string, itemType: SavedItem['itemType'], title?: string) => {
    const storedUser = localStorage.getItem('workus_user')
    if (!storedUser) return
    
    const user = JSON.parse(storedUser)
    const newItem: SavedItem = {
      id: `saved-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: user.id,
      itemType,
      itemId,
      title,
      savedAt: new Date().toISOString()
    }
    setData(prev => ({
      ...prev,
      savedItems: [...prev.savedItems, newItem]
    }))
  }, [])

  const unsaveItem = useCallback((itemId: string) => {
    setData(prev => ({
      ...prev,
      savedItems: prev.savedItems.filter(s => s.itemId !== itemId)
    }))
  }, [])

  const isSaved = useCallback((itemId: string) => {
    return data.savedItems.some(s => s.itemId === itemId)
  }, [data.savedItems])

  const getSavedItems = useCallback((userId: string) => {
    return data.savedItems.filter(s => s.userId === userId)
  }, [data.savedItems])

  // === LIKED ITEMS ===
  
  const likeItem = useCallback((itemId: string, itemType: LikedItem['itemType']) => {
    const storedUser = localStorage.getItem('workus_user')
    if (!storedUser) return
    
    const user = JSON.parse(storedUser)
    const newItem: LikedItem = {
      id: `liked-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: user.id,
      itemType,
      itemId,
      likedAt: new Date().toISOString()
    }
    setData(prev => ({
      ...prev,
      likedItems: [...prev.likedItems, newItem]
    }))
  }, [])

  const unlikeItem = useCallback((itemId: string) => {
    setData(prev => ({
      ...prev,
      likedItems: prev.likedItems.filter(l => l.itemId !== itemId)
    }))
  }, [])

  const isLiked = useCallback((itemId: string) => {
    return data.likedItems.some(l => l.itemId === itemId)
  }, [data.likedItems])

  // === ACTIVITY TRACKING ===
  
  const getWeeklyActivity = useCallback(() => {
    const today = new Date()
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    
    // Générer les 7 derniers jours
    const days: DailyActivity[] = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000)
      const dateStr = date.toISOString().split('T')[0]
      const existing = data.dailyActivity.find(a => a.date === dateStr)
      days.push(existing || { date: dateStr, timeSpentMinutes: 0, exercisesCompleted: 0 })
    }
    return days
  }, [data.dailyActivity])

  const getTodayActivity = useCallback(() => {
    const today = new Date().toISOString().split('T')[0]
    const todayActivity = data.dailyActivity.find(a => a.date === today)
    return todayActivity?.timeSpentMinutes || 0
  }, [data.dailyActivity])

  const addActivityTime = useCallback((minutes: number) => {
    const today = new Date().toISOString().split('T')[0]
    setData(prev => {
      const existingIndex = prev.dailyActivity.findIndex(a => a.date === today)
      if (existingIndex >= 0) {
        const updated = [...prev.dailyActivity]
        updated[existingIndex] = {
          ...updated[existingIndex],
          timeSpentMinutes: updated[existingIndex].timeSpentMinutes + minutes
        }
        return { ...prev, dailyActivity: updated }
      } else {
        return {
          ...prev,
          dailyActivity: [...prev.dailyActivity, { date: today, timeSpentMinutes: minutes, exercisesCompleted: 0 }]
        }
      }
    })
  }, [])

  // === SKILL PROGRESS ===
  
  const updateSkillProgress = useCallback((skillId: string, updates: Partial<SkillProgress>) => {
    setData(prev => ({
      ...prev,
      skillProgress: {
        ...prev.skillProgress,
        [skillId]: {
          skillId,
          level: 0,
          hoursWorked: 0,
          exercisesCompleted: 0,
          lastPracticed: new Date().toISOString(),
          ...prev.skillProgress[skillId],
          ...updates
        }
      }
    }))
  }, [])

  const value: UserDataContextType = {
    users,
    savedItems: data.savedItems,
    addUser,
    updateUser,
    deleteUser,
    getUserById,
    getUserByEmail,
    searchUsers,
    getAllUsers,
    updateUserRole,
    followUser,
    unfollowUser,
    isFollowing,
    saveItem,
    unsaveItem,
    isSaved,
    getSavedItems,
    likeItem,
    unlikeItem,
    isLiked,
    getWeeklyActivity,
    getTodayActivity,
    addActivityTime,
    updateSkillProgress,
    data
  }

  return (
    <UserDataContext.Provider value={value}>
      {children}
    </UserDataContext.Provider>
  )
}

/**
 * Hook pour utiliser le contexte des données utilisateur
 */
export function useUserData() {
  const context = useContext(UserDataContext)
  if (context === undefined) {
    throw new Error('useUserData must be used within a UserDataProvider')
  }
  return context
}
