import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Settings, User, Bell, Lock, Palette, Globe, Shield, 
  CreditCard, LogOut, Moon, Sun, Check, X, Eye, EyeOff, Save, Monitor
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'

type SettingsSection = 'profile' | 'notifications' | 'appearance' | 'privacy' | 'billing' | 'security'

interface NotificationSetting {
  id: string
  label: string
  desc: string
  enabled: boolean
}

interface PrivacySetting {
  id: string
  label: string
  desc: string
  enabled: boolean
}

const sections = [
  { id: 'profile', label: 'Profil', icon: User },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'appearance', label: 'Apparence', icon: Palette },
  { id: 'privacy', label: 'Confidentialité', icon: Shield },
  { id: 'security', label: 'Sécurité', icon: Lock },
  { id: 'billing', label: 'Facturation', icon: CreditCard },
]

const initialNotifications: NotificationSetting[] = [
  { id: 'achievements', label: 'Badges et accomplissements', desc: 'Notifié quand vous débloquez un badge', enabled: true },
  { id: 'comments', label: 'Commentaires', desc: 'Notifié quand quelqu\'un commente', enabled: true },
  { id: 'follows', label: 'Nouveaux followers', desc: 'Notifié quand quelqu\'un vous suit', enabled: false },
  { id: 'recommendations', label: 'Recommandations', desc: 'Suggestions de contenu personnalisées', enabled: true },
  { id: 'newsletter', label: 'Newsletter', desc: 'Actualités et nouveautés Work Us', enabled: false },
]

const initialPrivacy: PrivacySetting[] = [
  { id: 'profile-public', label: 'Profil public', desc: 'Autoriser les autres à voir votre profil', enabled: true },
  { id: 'show-progress', label: 'Afficher la progression', desc: 'Montrer vos statistiques sur votre profil', enabled: true },
  { id: 'show-activity', label: 'Activité visible', desc: 'Les autres peuvent voir votre activité', enabled: false },
  { id: 'search-engines', label: 'Indexation', desc: 'Apparaître dans les moteurs de recherche', enabled: false },
]

/**
 * SettingsPage - Paramètres avec thème fonctionnel
 */
export function SettingsPage() {
  const navigate = useNavigate()
  const { user, logout, isAuthenticated } = useAuth()
  const { theme, setTheme, effectiveTheme } = useTheme()
  
  const [activeSection, setActiveSection] = useState<SettingsSection>('profile')
  const [language, setLanguage] = useState('fr')
  
  // Profile state
  const [username, setUsername] = useState(user?.username || 'utilisateur')
  const [email, setEmail] = useState(user?.email || 'email@example.com')
  const [bio, setBio] = useState('Développeur passionné | En route vers le full-stack')
  const [isSaving, setIsSaving] = useState(false)
  
  // Notifications & Privacy state
  const [notifications, setNotifications] = useState<NotificationSetting[]>(initialNotifications)
  const [privacy, setPrivacy] = useState<PrivacySetting[]>(initialPrivacy)
  
  // Security state
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [show2FAModal, setShow2FAModal] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  
  // Toast state
  const [showToast, setShowToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // Afficher une notification
  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setShowToast({ message, type })
    setTimeout(() => setShowToast(null), 3000)
  }

  // Sauvegarder le profil
  const handleSaveProfile = async () => {
    if (!username.trim() || !email.trim()) {
      showNotification('Veuillez remplir tous les champs', 'error')
      return
    }
    
    setIsSaving(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsSaving(false)
    showNotification('Profil mis à jour avec succès')
  }

  // Toggle notification
  const handleToggleNotification = (id: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, enabled: !n.enabled } : n
    ))
    const setting = notifications.find(n => n.id === id)
    showNotification(`${setting?.label} ${!setting?.enabled ? 'activé' : 'désactivé'}`)
  }

  // Toggle privacy
  const handleTogglePrivacy = (id: string) => {
    setPrivacy(prev => prev.map(p => 
      p.id === id ? { ...p, enabled: !p.enabled } : p
    ))
    const setting = privacy.find(p => p.id === id)
    showNotification(`${setting?.label} ${!setting?.enabled ? 'activé' : 'désactivé'}`)
  }

  // Changer le mot de passe
  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      showNotification('Veuillez remplir tous les champs', 'error')
      return
    }
    if (newPassword !== confirmPassword) {
      showNotification('Les mots de passe ne correspondent pas', 'error')
      return
    }
    if (newPassword.length < 8) {
      showNotification('Le mot de passe doit contenir au moins 8 caractères', 'error')
      return
    }

    setIsSaving(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsSaving(false)
    setShowPasswordModal(false)
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    showNotification('Mot de passe modifié avec succès')
  }

  // Activer la 2FA
  const handleActivate2FA = async () => {
    setIsSaving(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsSaving(false)
    setShow2FAModal(false)
    showNotification('Authentification à deux facteurs activée')
  }

  // Déconnexion
  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // Changer le thème
  const handleThemeChange = (newTheme: 'dark' | 'light' | 'system') => {
    setTheme(newTheme)
    showNotification(`Thème ${newTheme === 'dark' ? 'sombre' : newTheme === 'light' ? 'clair' : 'système'} activé`)
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-5xl mx-auto text-center py-20">
        <Settings className="w-16 h-16 text-dark-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">Connexion requise</h1>
        <p className="text-dark-400 mb-6">Connectez-vous pour accéder aux paramètres</p>
        <button
          onClick={() => navigate('/login')}
          className="px-6 py-3 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors"
        >
          Se connecter
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Toast notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className={`fixed top-20 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg ${
              showToast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
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
          <Settings className="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Paramètres</h1>
          <p className="text-dark-400">Gérez votre compte et vos préférences</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <motion.nav
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-1"
        >
          {sections.map(section => {
            const Icon = section.icon
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id as SettingsSection)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  activeSection === section.id
                    ? 'bg-primary-500/10 text-primary-400'
                    : 'text-dark-300 hover:text-white hover:bg-dark-800'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{section.label}</span>
              </button>
            )
          })}
          <hr className="border-dark-700 my-4" />
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Déconnexion</span>
          </button>
        </motion.nav>

        {/* Content */}
        <motion.div
          key={activeSection}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-3"
        >
          {activeSection === 'profile' && (
            <div className="p-6 bg-dark-800/50 border border-dark-700/50 rounded-2xl space-y-6">
              <h2 className="text-lg font-bold text-white">Informations du profil</h2>
              
              {/* Avatar */}
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-accent-400 to-accent-600 flex items-center justify-center text-white text-3xl font-bold">
                  {username[0]?.toUpperCase()}
                </div>
                <div>
                  <button className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors">
                    Changer la photo
                  </button>
                  <p className="text-sm text-dark-400 mt-1">JPG, PNG jusqu'à 5MB</p>
                </div>
              </div>

              {/* Form */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">Nom d'utilisateur</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-xl text-white focus:outline-none focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-xl text-white focus:outline-none focus:border-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">Bio</label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-xl text-white focus:outline-none focus:border-primary-500 resize-none"
                />
              </div>

              <button 
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-primary-500/20 disabled:opacity-50 transition-all"
              >
                {isSaving ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save className="w-5 h-5" />
                )}
                Sauvegarder
              </button>
            </div>
          )}

          {activeSection === 'notifications' && (
            <div className="p-6 bg-dark-800/50 border border-dark-700/50 rounded-2xl space-y-6">
              <h2 className="text-lg font-bold text-white">Préférences de notification</h2>
              
              {notifications.map(item => (
                <div key={item.id} className="flex items-center justify-between py-3 border-b border-dark-700/50 last:border-0">
                  <div>
                    <p className="font-medium text-white">{item.label}</p>
                    <p className="text-sm text-dark-400">{item.desc}</p>
                  </div>
                  <button
                    onClick={() => handleToggleNotification(item.id)}
                    className={`w-12 h-7 rounded-full transition-colors ${
                      item.enabled ? 'bg-primary-500' : 'bg-dark-600'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
                      item.enabled ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {activeSection === 'appearance' && (
            <div className="p-6 bg-dark-800/50 border border-dark-700/50 rounded-2xl space-y-6">
              <h2 className="text-lg font-bold text-white">Apparence</h2>
              
              {/* Theme */}
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-3">Thème</label>
                <p className="text-xs text-dark-500 mb-4">
                  Thème actuel : <span className="text-primary-400">{effectiveTheme === 'dark' ? 'Sombre' : 'Clair'}</span>
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'dark', label: 'Sombre', icon: Moon },
                    { id: 'light', label: 'Clair', icon: Sun },
                    { id: 'system', label: 'Système', icon: Monitor },
                  ].map(t => {
                    const Icon = t.icon
                    return (
                      <button
                        key={t.id}
                        onClick={() => handleThemeChange(t.id as 'dark' | 'light' | 'system')}
                        className={`flex items-center justify-center gap-2 p-4 rounded-xl border transition-all ${
                          theme === t.id
                            ? 'bg-primary-500/10 border-primary-500 text-primary-400'
                            : 'bg-dark-700 border-dark-600 text-dark-300 hover:text-white hover:border-dark-500'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        {t.label}
                        {theme === t.id && <Check className="w-4 h-4" />}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Language */}
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-3">Langue</label>
                <select
                  value={language}
                  onChange={(e) => {
                    setLanguage(e.target.value)
                    showNotification(`Langue changée en ${e.target.options[e.target.selectedIndex].text}`)
                  }}
                  className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-xl text-white focus:outline-none focus:border-primary-500"
                >
                  <option value="fr">Français</option>
                  <option value="en">English</option>
                  <option value="es">Español</option>
                  <option value="de">Deutsch</option>
                </select>
              </div>
            </div>
          )}

          {activeSection === 'privacy' && (
            <div className="p-6 bg-dark-800/50 border border-dark-700/50 rounded-2xl space-y-6">
              <h2 className="text-lg font-bold text-white">Confidentialité</h2>
              
              {privacy.map(item => (
                <div key={item.id} className="flex items-center justify-between py-3 border-b border-dark-700/50 last:border-0">
                  <div>
                    <p className="font-medium text-white">{item.label}</p>
                    <p className="text-sm text-dark-400">{item.desc}</p>
                  </div>
                  <button
                    onClick={() => handleTogglePrivacy(item.id)}
                    className={`w-12 h-7 rounded-full transition-colors ${
                      item.enabled ? 'bg-primary-500' : 'bg-dark-600'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
                      item.enabled ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {activeSection === 'security' && (
            <div className="p-6 bg-dark-800/50 border border-dark-700/50 rounded-2xl space-y-6">
              <h2 className="text-lg font-bold text-white">Sécurité</h2>
              
              <div className="p-4 bg-dark-700/50 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-white">Mot de passe</p>
                    <p className="text-sm text-dark-400">Dernière modification il y a 3 mois</p>
                  </div>
                  <button 
                    onClick={() => setShowPasswordModal(true)}
                    className="px-4 py-2 bg-dark-600 text-white rounded-lg hover:bg-dark-500 transition-colors"
                  >
                    Modifier
                  </button>
                </div>
              </div>

              <div className="p-4 bg-dark-700/50 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-white">Authentification à deux facteurs</p>
                    <p className="text-sm text-dark-400">Sécurisez votre compte avec la 2FA</p>
                  </div>
                  <button 
                    onClick={() => setShow2FAModal(true)}
                    className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                  >
                    Activer
                  </button>
                </div>
              </div>

              <div className="p-4 bg-dark-700/50 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-white">Sessions actives</p>
                    <p className="text-sm text-dark-400">2 appareils connectés</p>
                  </div>
                  <button className="px-4 py-2 bg-dark-600 text-white rounded-lg hover:bg-dark-500 transition-colors">
                    Gérer
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'billing' && (
            <div className="p-6 bg-dark-800/50 border border-dark-700/50 rounded-2xl space-y-6">
              <h2 className="text-lg font-bold text-white">Compte</h2>
              
              <div className="p-4 bg-gradient-to-br from-primary-500/10 to-secondary-500/10 border border-primary-500/20 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-dark-400">Type de compte</p>
                    <p className="text-xl font-bold text-white">{user?.role === 'admin' ? 'Administrateur' : user?.role === 'creator' ? 'Créateur' : 'Membre'}</p>
                  </div>
                  <span className="px-4 py-2 bg-dark-700 text-dark-300 rounded-xl text-sm">
                    Actif
                  </span>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-white mb-3">Historique</h3>
                <p className="text-dark-400 text-sm">Aucun historique disponible</p>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Password Modal */}
      <AnimatePresence>
        {showPasswordModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowPasswordModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md bg-dark-800 border border-dark-700 rounded-2xl overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-white">Changer le mot de passe</h3>
                  <button 
                    onClick={() => setShowPasswordModal(false)}
                    className="p-2 text-dark-400 hover:text-white rounded-lg hover:bg-dark-700 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-2">Mot de passe actuel</label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full px-4 py-3 pr-12 bg-dark-700 border border-dark-600 rounded-xl text-white focus:outline-none focus:border-primary-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-white"
                      >
                        {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-2">Nouveau mot de passe</label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-4 py-3 pr-12 bg-dark-700 border border-dark-600 rounded-xl text-white focus:outline-none focus:border-primary-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-white"
                      >
                        {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-2">Confirmer le mot de passe</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-xl text-white focus:outline-none focus:border-primary-500"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowPasswordModal(false)}
                    className="flex-1 py-3 bg-dark-700 text-white rounded-xl hover:bg-dark-600 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleChangePassword}
                    disabled={isSaving}
                    className="flex-1 py-3 bg-primary-500 text-white font-semibold rounded-xl hover:bg-primary-600 disabled:opacity-50 transition-colors"
                  >
                    {isSaving ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                    ) : (
                      'Confirmer'
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2FA Modal */}
      <AnimatePresence>
        {show2FAModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShow2FAModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md bg-dark-800 border border-dark-700 rounded-2xl overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-white">Activer la 2FA</h3>
                  <button 
                    onClick={() => setShow2FAModal(false)}
                    className="p-2 text-dark-400 hover:text-white rounded-lg hover:bg-dark-700 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="text-center mb-6">
                  <div className="w-48 h-48 mx-auto bg-white rounded-xl mb-4 flex items-center justify-center">
                    <div className="text-dark-900 text-sm">QR Code simulé</div>
                  </div>
                  <p className="text-dark-400 text-sm">
                    Scannez ce QR code avec votre application d'authentification (Google Authenticator, Authy, etc.)
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShow2FAModal(false)}
                    className="flex-1 py-3 bg-dark-700 text-white rounded-xl hover:bg-dark-600 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleActivate2FA}
                    disabled={isSaving}
                    className="flex-1 py-3 bg-primary-500 text-white font-semibold rounded-xl hover:bg-primary-600 disabled:opacity-50 transition-colors"
                  >
                    {isSaving ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                    ) : (
                      'Activer'
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
