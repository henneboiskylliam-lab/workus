import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { AuthUser, UserRole, ROLE_PERMISSIONS, RolePermissions } from '../types'
import { 
  getCurrentUser, 
  loadUserData, 
  signIn, 
  signUp, 
  signOut, 
  onAuthStateChange 
} from '../lib/supabaseAuth'

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
  refreshUserData: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

/**
 * AuthProvider - Contexte d'authentification pour Work Us
 * Utilise Supabase Auth avec fallback sur IndexedDB local
 * Restaure automatiquement les données utilisateur au chargement
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Charger l'utilisateur au démarrage
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Récupérer l'utilisateur connecté
        const currentUser = await getCurrentUser()
        
        if (currentUser) {
          setUser(currentUser)
          
          // Charger toutes les données utilisateur
          await loadUserData(currentUser.id)
          
          console.log('Utilisateur restauré:', currentUser.username)
        }
      } catch (err) {
        console.error('Erreur lors de l\'initialisation de l\'auth:', err)
      } finally {
        setIsLoading(false)
      }
    }

    initAuth()

    // Écouter les changements d'état d'authentification (Supabase)
    const unsubscribe = onAuthStateChange((authUser) => {
      setUser(authUser)
      if (authUser) {
        console.log('Changement d\'état auth:', authUser.username)
      }
    })

    return () => {
      unsubscribe()
    }
  }, [])

  // Permissions basées sur le rôle
  const permissions = user ? ROLE_PERMISSIONS[user.role] : null

  // Fonction de connexion
  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await signIn(email, password)

      if (result.success && result.user) {
        setUser(result.user)
        setIsLoading(false)
        return true
      }

      setError(result.error || 'Connexion échouée')
      setIsLoading(false)
      return false
    } catch (err) {
      console.error('Erreur de connexion:', err)
      setError('Erreur de connexion')
      setIsLoading(false)
      return false
    }
  }

  // Fonction de déconnexion
  const logout = async () => {
    try {
      await signOut()
      setUser(null)
    } catch (err) {
      console.error('Erreur lors de la déconnexion:', err)
    }
  }

  // Fonction d'inscription
  const register = async (username: string, email: string, password: string): Promise<boolean> => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await signUp(username, email, password)

      if (result.success && result.user) {
        setUser(result.user)
        setIsLoading(false)
        return true
      }

      setError(result.error || 'Inscription échouée')
      setIsLoading(false)
      return false
    } catch (err) {
      console.error('Erreur d\'inscription:', err)
      setError('Erreur lors de l\'inscription')
      setIsLoading(false)
      return false
    }
  }

  // Rafraîchir les données utilisateur
  const refreshUserData = async () => {
    if (user) {
      await loadUserData(user.id)
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
    refreshUserData,
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
