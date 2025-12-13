import { createContext, useContext, ReactNode } from 'react'
import { useDatabaseInit } from './hooks'
import { Loader2 } from 'lucide-react'

interface DatabaseContextType {
  isInitialized: boolean
  isLoading: boolean
  error: Error | null
}

const DatabaseContext = createContext<DatabaseContextType>({
  isInitialized: false,
  isLoading: true,
  error: null
})

export function useDatabase() {
  return useContext(DatabaseContext)
}

interface DatabaseProviderProps {
  children: ReactNode
  showLoading?: boolean
}

/**
 * Provider qui initialise la base de données IndexedDB au démarrage
 * Affiche un écran de chargement pendant l'initialisation
 */
export function DatabaseProvider({ children, showLoading = true }: DatabaseProviderProps) {
  const { isInitialized, isLoading, error } = useDatabaseInit()

  // Afficher un écran de chargement pendant l'initialisation
  if (showLoading && isLoading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="text-center">
          <div className="relative mb-6">
            <div className="w-16 h-16 border-4 border-primary-500/20 rounded-full" />
            <div className="absolute top-0 left-0 w-16 h-16 border-4 border-primary-500 rounded-full border-t-transparent animate-spin" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Work Us</h2>
          <p className="text-dark-400">Chargement de la base de données...</p>
        </div>
      </div>
    )
  }

  // Afficher une erreur si l'initialisation échoue
  if (error) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center p-4">
        <div className="bg-dark-900 border border-red-500/20 rounded-2xl p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Erreur de base de données</h2>
          <p className="text-dark-400 mb-4">{error.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    )
  }

  return (
    <DatabaseContext.Provider value={{ isInitialized, isLoading, error }}>
      {children}
    </DatabaseContext.Provider>
  )
}

