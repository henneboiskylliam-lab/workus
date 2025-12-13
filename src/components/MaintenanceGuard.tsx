import { ReactNode } from 'react'
import { useSiteSettings } from '../contexts/SiteSettingsContext'
import { useAuth } from '../contexts/AuthContext'
import { Settings, Clock, Shield } from 'lucide-react'

interface MaintenanceGuardProps {
  children: ReactNode
}

/**
 * MaintenanceGuard - Bloque l'accès au site si le mode maintenance est activé
 * Seuls les administrateurs peuvent accéder au site en mode maintenance
 */
export function MaintenanceGuard({ children }: MaintenanceGuardProps) {
  const { isMaintenanceMode } = useSiteSettings()
  const { user, isAuthenticated } = useAuth()

  // Si pas en mode maintenance, afficher le contenu normal
  if (!isMaintenanceMode) {
    return <>{children}</>
  }

  // Si l'utilisateur est admin, permettre l'accès avec un bandeau d'avertissement
  if (isAuthenticated && user?.role === 'admin') {
    return (
      <>
        {/* Bandeau d'avertissement mode maintenance */}
        <div className="fixed top-0 left-0 right-0 z-[9999] bg-gradient-to-r from-orange-500 to-red-500 text-white py-2 px-4 text-center shadow-lg">
          <div className="flex items-center justify-center gap-2 text-sm font-medium">
            <Settings className="w-4 h-4 animate-spin" />
            <span>Mode maintenance activé - Seuls les administrateurs peuvent voir le site</span>
            <Shield className="w-4 h-4" />
          </div>
        </div>
        {/* Ajouter un padding-top pour compenser le bandeau */}
        <div className="pt-10">
          {children}
        </div>
      </>
    )
  }

  // Sinon, afficher la page de maintenance
  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 flex items-center justify-center p-4">
      <div className="max-w-lg w-full text-center">
        {/* Animation de fond */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        {/* Contenu */}
        <div className="relative z-10">
          {/* Icône */}
          <div className="mb-8 inline-flex">
            <div className="relative">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-2xl shadow-orange-500/30">
                <Settings className="w-12 h-12 text-white animate-spin" style={{ animationDuration: '3s' }} />
              </div>
              <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-xl bg-dark-800 border-2 border-orange-500 flex items-center justify-center">
                <Clock className="w-5 h-5 text-orange-400" />
              </div>
            </div>
          </div>

          {/* Titre */}
          <h1 className="text-4xl font-bold text-white mb-4">
            Maintenance en cours
          </h1>

          {/* Description */}
          <p className="text-lg text-dark-300 mb-8 leading-relaxed">
            Nous effectuons actuellement des travaux de maintenance pour améliorer votre expérience.
            <br />
            <span className="text-dark-400">Veuillez réessayer dans quelques instants.</span>
          </p>

          {/* Indicateur de statut */}
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-dark-800/80 backdrop-blur-sm rounded-2xl border border-dark-700">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
              <span className="text-dark-400 text-sm">Statut:</span>
            </div>
            <span className="text-orange-400 font-medium">En maintenance</span>
          </div>

          {/* Lien de connexion admin */}
          <div className="mt-12">
            <p className="text-dark-500 text-sm mb-4">
              Vous êtes administrateur ?
            </p>
            <a
              href="/login"
              className="inline-flex items-center gap-2 px-6 py-3 bg-dark-700 hover:bg-dark-600 text-white rounded-xl transition-colors border border-dark-600"
            >
              <Shield className="w-4 h-4" />
              Se connecter
            </a>
          </div>

          {/* Logo */}
          <div className="mt-16 opacity-50">
            <span className="text-2xl font-bold bg-gradient-to-r from-primary-400 to-secondary-400 bg-clip-text text-transparent">
              Work Us
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

