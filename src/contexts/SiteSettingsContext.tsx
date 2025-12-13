import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'

export interface SiteSettings {
  siteName: string
  siteDescription: string
  maintenanceMode: boolean
  registrationEnabled: boolean
  contentModerationEnabled: boolean
  emailNotificationsEnabled: boolean
  defaultUserRole: 'user' | 'creator'
  maxUploadSize: number
  allowedFileTypes: string[]
}

interface SiteSettingsContextType {
  settings: SiteSettings
  updateSetting: <K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) => void
  updateSettings: (newSettings: Partial<SiteSettings>) => void
  isMaintenanceMode: boolean
  toggleMaintenanceMode: () => void
}

const STORAGE_KEY = 'workus_site_settings'

const defaultSettings: SiteSettings = {
  siteName: 'Work Us',
  siteDescription: 'Plateforme d\'apprentissage et de mise en relation professionnelle',
  maintenanceMode: false,
  registrationEnabled: true,
  contentModerationEnabled: true,
  emailNotificationsEnabled: true,
  defaultUserRole: 'user',
  maxUploadSize: 104857600,
  allowedFileTypes: ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/webm', 'application/pdf']
}

const SiteSettingsContext = createContext<SiteSettingsContextType | undefined>(undefined)

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings)

  // Charger les paramètres au démarrage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        setSettings({ ...defaultSettings, ...JSON.parse(stored) })
      } catch {
        setSettings(defaultSettings)
      }
    }
  }, [])

  // Sauvegarder automatiquement
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  }, [settings])

  // Écouter les changements depuis d'autres onglets/fenêtres
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          setSettings({ ...defaultSettings, ...JSON.parse(e.newValue) })
        } catch {
          // Ignorer
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const updateSetting = useCallback(<K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }, [])

  const updateSettings = useCallback((newSettings: Partial<SiteSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }))
  }, [])

  const toggleMaintenanceMode = useCallback(() => {
    setSettings(prev => {
      const newMode = !prev.maintenanceMode
      console.log('Mode maintenance:', newMode ? 'ACTIVÉ' : 'DÉSACTIVÉ')
      return { ...prev, maintenanceMode: newMode }
    })
  }, [])

  const value: SiteSettingsContextType = {
    settings,
    updateSetting,
    updateSettings,
    isMaintenanceMode: settings.maintenanceMode,
    toggleMaintenanceMode
  }

  return (
    <SiteSettingsContext.Provider value={value}>
      {children}
    </SiteSettingsContext.Provider>
  )
}

export function useSiteSettings() {
  const context = useContext(SiteSettingsContext)
  if (context === undefined) {
    throw new Error('useSiteSettings must be used within a SiteSettingsProvider')
  }
  return context
}

