import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { AuthUser, UserRole, ROLE_PERMISSIONS, RolePermissions } from '../types'
import usersData from '../data/users.json'

interface AuthContextType {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  permissions: RolePermissions | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  register: (username: string, email: string, password: string) => Promise<boolean>
  clearError: () => void
  hasPermission: (permission: keyof RolePermissions) => boolean
  isAdmin: () => boolean
  isCreator: () => boolean
  isModerator: () => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

// Interface pour les utilisateurs enregistrés
interface RegisteredUser {
  id: string
  email: string
  username: string
  password: string
  role: UserRole
  isActive: boolean
  isVerified: boolean
  joinedAt: string
  avatar?: string
  bio?: string
}

// Fonction pour récupérer les utilisateurs enregistrés
const getRegisteredUsers = (): RegisteredUser[] => {
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

// Fonction pour sauvegarder les utilisateurs enregistrés
const saveRegisteredUsers = (users: RegisteredUser[]) => {
  localStorage.setItem('workus_registered_users', JSON.stringify(users))
}

/**
 * AuthProvider - Contexte d'authentification pour Work Us
 * Gère l'état de connexion, les rôles et les permissions
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Charger l'utilisateur depuis localStorage au démarrage
  useEffect(() => {
    const storedUser = localStorage.getItem('workus_user')
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser)
        setUser(parsedUser)
      } catch {
        localStorage.removeItem('workus_user')
      }
    }
    setIsLoading(false)
  }, [])

  // Permissions basées sur le rôle
  const permissions = user ? ROLE_PERMISSIONS[user.role] : null

  // Fonction de connexion
  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true)
    setError(null)

    try {
      // Simuler un délai réseau
      await new Promise(resolve => setTimeout(resolve, 500))

      // D'abord chercher dans les utilisateurs par défaut (admin)
      const defaultUser = usersData.users.find(u => u.email === email)
      
      if (defaultUser) {
        // Vérifier le mot de passe pour l'utilisateur par défaut
        const storedPassword = usersData.passwords[defaultUser.id as keyof typeof usersData.passwords]
        if (storedPassword !== password) {
          setError('Mot de passe incorrect')
          setIsLoading(false)
          return false
        }

        // Vérifier si le compte est actif
        if (!defaultUser.isActive) {
          setError('Ce compte a été désactivé')
          setIsLoading(false)
          return false
        }

        // Créer l'objet AuthUser
        const authUser: AuthUser = {
          id: defaultUser.id,
          email: defaultUser.email,
          username: defaultUser.username,
          role: defaultUser.role as UserRole,
          isActive: defaultUser.isActive,
          isVerified: defaultUser.isVerified,
          createdAt: defaultUser.joinedAt,
          lastLoginAt: new Date().toISOString(),
        }

        // Sauvegarder dans localStorage
        localStorage.setItem('workus_user', JSON.stringify(authUser))
        setUser(authUser)
        setIsLoading(false)
        return true
      }

      // Sinon, chercher dans les utilisateurs enregistrés (localStorage)
      const registeredUsers = getRegisteredUsers()
      const registeredUser = registeredUsers.find(u => u.email === email)

      if (!registeredUser) {
        setError('Utilisateur non trouvé')
        setIsLoading(false)
        return false
      }

      // Vérifier le mot de passe
      if (registeredUser.password !== password) {
        setError('Mot de passe incorrect')
        setIsLoading(false)
        return false
      }

      // Vérifier si le compte est actif
      if (!registeredUser.isActive) {
        setError('Ce compte a été désactivé')
        setIsLoading(false)
        return false
      }

      // Créer l'objet AuthUser
      const authUser: AuthUser = {
        id: registeredUser.id,
        email: registeredUser.email,
        username: registeredUser.username,
        role: registeredUser.role,
        isActive: registeredUser.isActive,
        isVerified: registeredUser.isVerified,
        createdAt: registeredUser.joinedAt,
        lastLoginAt: new Date().toISOString(),
      }

      // Sauvegarder dans localStorage
      localStorage.setItem('workus_user', JSON.stringify(authUser))
      setUser(authUser)
      setIsLoading(false)
      return true
    } catch {
      setError('Erreur de connexion')
      setIsLoading(false)
      return false
    }
  }

  // Fonction de déconnexion
  const logout = () => {
    localStorage.removeItem('workus_user')
    setUser(null)
  }

  // Fonction d'inscription
  const register = async (username: string, email: string, password: string): Promise<boolean> => {
    setIsLoading(true)
    setError(null)

    try {
      // Simuler un délai réseau
      await new Promise(resolve => setTimeout(resolve, 500))

      // Vérifier si l'email existe déjà dans les utilisateurs par défaut
      const existingDefaultUser = usersData.users.find(u => u.email === email)
      if (existingDefaultUser) {
        setError('Cet email est déjà utilisé')
        setIsLoading(false)
        return false
      }

      // Vérifier si le username existe déjà dans les utilisateurs par défaut
      const existingDefaultUsername = usersData.users.find(u => u.username === username)
      if (existingDefaultUsername) {
        setError('Ce nom d\'utilisateur est déjà pris')
        setIsLoading(false)
        return false
      }

      // Récupérer les utilisateurs enregistrés
      const registeredUsers = getRegisteredUsers()

      // Vérifier si l'email existe déjà dans les utilisateurs enregistrés
      const existingRegisteredEmail = registeredUsers.find(u => u.email === email)
      if (existingRegisteredEmail) {
        setError('Cet email est déjà utilisé')
        setIsLoading(false)
        return false
      }

      // Vérifier si le username existe déjà dans les utilisateurs enregistrés
      const existingRegisteredUsername = registeredUsers.find(u => u.username === username)
      if (existingRegisteredUsername) {
        setError('Ce nom d\'utilisateur est déjà pris')
        setIsLoading(false)
        return false
      }

      // Créer le nouvel utilisateur enregistré
      const newRegisteredUser: RegisteredUser = {
        id: `user-${Date.now()}`,
        email,
        username,
        password, // Sauvegarder le mot de passe
        role: 'user',
        isActive: true,
        isVerified: false,
        joinedAt: new Date().toISOString(),
      }

      // Sauvegarder dans la liste des utilisateurs enregistrés
      registeredUsers.push(newRegisteredUser)
      saveRegisteredUsers(registeredUsers)

      // Créer l'objet AuthUser pour la session
      const authUser: AuthUser = {
        id: newRegisteredUser.id,
        email: newRegisteredUser.email,
        username: newRegisteredUser.username,
        role: newRegisteredUser.role,
        isActive: newRegisteredUser.isActive,
        isVerified: newRegisteredUser.isVerified,
        createdAt: newRegisteredUser.joinedAt,
        lastLoginAt: new Date().toISOString(),
      }

      // Sauvegarder la session utilisateur
      localStorage.setItem('workus_user', JSON.stringify(authUser))
      setUser(authUser)
      setIsLoading(false)
      return true
    } catch {
      setError('Erreur lors de l\'inscription')
      setIsLoading(false)
      return false
    }
  }

  // Effacer les erreurs
  const clearError = () => setError(null)

  // Vérifier une permission spécifique
  const hasPermission = (permission: keyof RolePermissions): boolean => {
    if (!permissions) return false
    return permissions[permission]
  }

  // Helpers pour vérifier les rôles
  const isAdmin = () => user?.role === 'admin'
  const isCreator = () => user?.role === 'creator' || user?.role === 'admin'
  const isModerator = () => user?.role === 'moderator' || user?.role === 'admin'

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
    permissions,
    login,
    logout,
    register,
    clearError,
    hasPermission,
    isAdmin,
    isCreator,
    isModerator,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

/**
 * Hook personnalisé pour utiliser le contexte d'authentification
 */
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

/**
 * Composant pour protéger les routes selon les permissions
 */
interface ProtectedRouteProps {
  children: ReactNode
  requiredPermission?: keyof RolePermissions
  requiredRole?: UserRole | UserRole[]
  fallback?: ReactNode
}

export function ProtectedRoute({ 
  children, 
  requiredPermission, 
  requiredRole,
  fallback 
}: ProtectedRouteProps) {
  const { isAuthenticated, hasPermission, user } = useAuth()

  // Non connecté
  if (!isAuthenticated) {
    return fallback || null
  }

  // Vérifier la permission
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return fallback || null
  }

  // Vérifier le rôle
  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
    if (!user || !roles.includes(user.role)) {
      return fallback || null
    }
  }

  return <>{children}</>
}

