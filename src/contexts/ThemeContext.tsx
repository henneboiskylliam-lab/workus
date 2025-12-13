import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

type Theme = 'dark' | 'light'

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
}

const STORAGE_KEY = 'workus_theme'
const DEFAULT_THEME: Theme = 'dark'

// Valeur par défaut non-nulle pour éviter les crashes
const defaultContextValue: ThemeContextType = {
  theme: DEFAULT_THEME,
  toggleTheme: () => {
    // Fonction vide par défaut - sera remplacée par le Provider
    console.warn('useTheme: toggleTheme called outside of ThemeProvider')
  },
  setTheme: () => {
    // Fonction vide par défaut - sera remplacée par le Provider
    console.warn('useTheme: setTheme called outside of ThemeProvider')
  }
}

// Créer le contexte avec une valeur par défaut non-undefined
const ThemeContext = createContext<ThemeContextType>(defaultContextValue)

/**
 * Récupère le thème initial de manière sécurisée
 */
function getInitialTheme(): Theme {
  // Vérifier si on est côté client
  if (typeof window === 'undefined') {
    return DEFAULT_THEME
  }

  try {
    // Récupérer le thème depuis localStorage
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark') {
      return stored
    }
    
    // Sinon, utiliser la préférence système
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light'
    }
  } catch {
    // En cas d'erreur (localStorage désactivé, etc.), retourner le thème par défaut
  }
  
  return DEFAULT_THEME
}

/**
 * ThemeProvider - Gère le thème de l'application (clair/sombre)
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  // Initialiser avec une valeur explicite
  const [theme, setThemeState] = useState<Theme>(DEFAULT_THEME)
  const [isInitialized, setIsInitialized] = useState(false)

  // Initialiser le thème côté client uniquement
  useEffect(() => {
    const initialTheme = getInitialTheme()
    setThemeState(initialTheme)
    setIsInitialized(true)
  }, [])

  // Appliquer le thème au document
  useEffect(() => {
    if (!isInitialized) return
    
    try {
      const root = document.documentElement
      
      if (theme === 'dark') {
        root.classList.add('dark')
        root.classList.remove('light')
      } else {
        root.classList.add('light')
        root.classList.remove('dark')
      }
      
      // Sauvegarder dans localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, theme)
      }
    } catch {
      // Ignorer les erreurs d'accès au DOM ou localStorage
    }
  }, [theme, isInitialized])

  const toggleTheme = () => {
    setThemeState(prev => prev === 'dark' ? 'light' : 'dark')
  }

  const setTheme = (newTheme: Theme) => {
    if (newTheme === 'dark' || newTheme === 'light') {
      setThemeState(newTheme)
    }
  }

  const contextValue: ThemeContextType = {
    theme,
    toggleTheme,
    setTheme
  }

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  )
}

/**
 * Hook pour utiliser le contexte du thème
 * Retourne toujours une valeur valide, même hors Provider
 */
export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext)
  
  // Le contexte a toujours une valeur par défaut, donc il ne sera jamais undefined
  // Mais on ajoute une protection supplémentaire par sécurité
  if (!context) {
    console.warn('useTheme: Context is undefined, using default values')
    return defaultContextValue
  }
  
  return context
}
