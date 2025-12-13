import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { useAuth } from './AuthContext'
import { settingsDB } from '../lib/dbService'

/**
 * ThemeContext - Gère le thème avec persistance en base de données
 * 
 * RÈGLE D'OR: Chaque changement de thème est persisté immédiatement
 */

export type Theme = 'light' | 'dark' | 'system'

interface ThemeContextType {
  theme: Theme
  effectiveTheme: 'light' | 'dark'
  setTheme: (theme: Theme) => Promise<void>
  toggleTheme: () => Promise<void>
  isLoading: boolean
}

// Valeur par défaut
const DEFAULT_THEME: Theme = 'dark'

const defaultContextValue: ThemeContextType = {
  theme: DEFAULT_THEME,
  effectiveTheme: 'dark',
  setTheme: async () => {},
  toggleTheme: async () => {},
  isLoading: false
}

const ThemeContext = createContext<ThemeContextType>(defaultContextValue)

interface ThemeProviderProps {
  children: ReactNode
}

/**
 * Détermine le thème effectif basé sur les préférences système
 */
function getEffectiveTheme(theme: Theme): 'light' | 'dark' {
  if (theme === 'system') {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return 'dark'
  }
  return theme
}

/**
 * Applique le thème au document
 */
function applyTheme(effectiveTheme: 'light' | 'dark') {
  if (typeof document !== 'undefined') {
    document.documentElement.classList.remove('light', 'dark')
    document.documentElement.classList.add(effectiveTheme)
  }
}

/**
 * ThemeProvider - Charge et persiste le thème depuis la DB
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
  const { user, isAuthenticated } = useAuth()
  const [theme, setThemeState] = useState<Theme>(DEFAULT_THEME)
  const [isLoading, setIsLoading] = useState(true)
  const [isInitialized, setIsInitialized] = useState(false)

  // Thème effectif (résolu pour 'system')
  const effectiveTheme = getEffectiveTheme(theme)

  // Charger le thème depuis la DB au mount et quand l'utilisateur change
  useEffect(() => {
    const loadTheme = async () => {
      setIsLoading(true)
      
      try {
        // D'abord, vérifier le localStorage pour un chargement rapide
        const cachedTheme = localStorage.getItem('workus_theme') as Theme | null
        if (cachedTheme && ['light', 'dark', 'system'].includes(cachedTheme)) {
          setThemeState(cachedTheme)
          applyTheme(getEffectiveTheme(cachedTheme))
        }

        // Puis charger depuis la DB si l'utilisateur est connecté
        if (isAuthenticated && user?.id) {
          const settings = await settingsDB.get(user.id)
          if (settings?.theme) {
            setThemeState(settings.theme)
            localStorage.setItem('workus_theme', settings.theme)
            applyTheme(getEffectiveTheme(settings.theme))
          }
        }
      } catch (error) {
        console.error('Erreur chargement thème:', error)
      } finally {
        setIsLoading(false)
        setIsInitialized(true)
      }
    }

    loadTheme()
  }, [user?.id, isAuthenticated])

  // Appliquer le thème quand il change
  useEffect(() => {
    if (isInitialized) {
      applyTheme(effectiveTheme)
    }
  }, [effectiveTheme, isInitialized])

  // Écouter les changements de préférences système
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    const handleChange = () => {
      if (theme === 'system') {
        applyTheme(getEffectiveTheme('system'))
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme])

  // Changer le thème (persiste immédiatement)
  const setTheme = useCallback(async (newTheme: Theme): Promise<void> => {
    // Mettre à jour le state immédiatement
    setThemeState(newTheme)
    
    // Sauvegarder en cache local pour chargement rapide
    localStorage.setItem('workus_theme', newTheme)
    
    // Appliquer le thème
    applyTheme(getEffectiveTheme(newTheme))

    // Persister en base de données
    if (user?.id) {
      try {
        await settingsDB.update(user.id, { theme: newTheme })
      } catch (error) {
        console.error('Erreur sauvegarde thème:', error)
      }
    }
  }, [user?.id])

  // Toggle entre dark et light
  const toggleTheme = useCallback(async (): Promise<void> => {
    const newTheme: Theme = effectiveTheme === 'dark' ? 'light' : 'dark'
    await setTheme(newTheme)
  }, [effectiveTheme, setTheme])

  const value: ThemeContextType = {
    theme,
    effectiveTheme,
    setTheme,
    toggleTheme,
    isLoading
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

/**
 * Hook pour utiliser le thème
 */
export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    return defaultContextValue
  }
  return context
}
