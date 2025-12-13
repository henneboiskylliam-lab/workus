import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Edit2, MapPin, Calendar, Link2, Github, Linkedin, Twitter,
  Trophy, Flame, BookOpen, Code, X, Check, Share2, Settings, Camera
} from 'lucide-react'
import { LevelIndicator, StatCard, CVBuilder } from '../components/ui'
import { useAuth } from '../contexts/AuthContext'
import { useUserData } from '../contexts/UserDataContext'

const PROFILE_STORAGE_KEY = 'workus_profile_data'

// Données par défaut pour un nouveau profil
const defaultUserStats = {
  totalHoursLearned: 0,
  skillsWorkedOn: 0,
  exercisesCompleted: 0,
  currentStreak: 0,
  longestStreak: 0,
  achievementsUnlocked: 0,
  weeklyProgress: [] as number[],
  topSkills: [] as string[]
}

/**
 * ProfilePage - Profil utilisateur avec upload de photo fonctionnel
 */
export function ProfilePage() {
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  const { data } = useUserData()
  
  // Stats utilisateur depuis le contexte ou valeurs par défaut
  const userStats = defaultUserStats
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Charger les données du profil depuis localStorage
  const loadProfileData = () => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(PROFILE_STORAGE_KEY)
      if (stored) {
        try {
          return JSON.parse(stored)
        } catch {
          // Ignorer
        }
      }
    }
    return {
      bio: user?.bio || 'Bienvenue sur Work Us !',
      location: '',
      website: '',
      github: '',
      linkedin: '',
      twitter: '',
    }
  }

  const savedProfile = loadProfileData()

  // États pour l'édition
  const [showEditModal, setShowEditModal] = useState(false)
  const [editBio, setEditBio] = useState(savedProfile.bio)
  const [editLocation, setEditLocation] = useState(savedProfile.location)
  const [editWebsite, setEditWebsite] = useState(savedProfile.website)
  const [editGithub, setEditGithub] = useState(savedProfile.github)
  const [editLinkedin, setEditLinkedin] = useState(savedProfile.linkedin)
  const [editTwitter, setEditTwitter] = useState(savedProfile.twitter)
  const [isSaving, setIsSaving] = useState(false)
  const [showToast, setShowToast] = useState<string | null>(null)
  const [showShareToast, setShowShareToast] = useState(false)
  
  // Photo de profil (stockée localement)
  const [profilePhoto, setProfilePhoto] = useState<string | null>(() => {
    return localStorage.getItem('workus_profile_photo')
  })

  // Skills depuis le contexte utilisateur
  const userSkillsWithDetails = Object.values(data.skillProgress || {}).map(skill => ({
    skillId: skill.skillId,
    skillName: skill.skillName,
    progress: skill.progress,
    level: skill.level,
    hoursWorked: skill.hoursWorked
  }))

  // Afficher une notification
  const showNotification = (message: string) => {
    setShowToast(message)
    setTimeout(() => setShowToast(null), 3000)
  }

  // Gérer l'upload de photo
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Vérifier le type
    if (!file.type.startsWith('image/')) {
      showNotification('Seules les images sont acceptées')
      return
    }

    // Vérifier la taille (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showNotification('L\'image ne doit pas dépasser 5MB')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      if (event.target?.result) {
        const imageData = event.target.result as string
        setProfilePhoto(imageData)
        localStorage.setItem('workus_profile_photo', imageData)
        showNotification('Photo de profil mise à jour !')
      }
    }
    reader.readAsDataURL(file)
    
    // Reset input
    e.target.value = ''
  }

  // Supprimer la photo
  const handleRemovePhoto = () => {
    setProfilePhoto(null)
    localStorage.removeItem('workus_profile_photo')
    showNotification('Photo de profil supprimée')
  }

  // Sauvegarder les modifications automatiquement
  const handleSaveProfile = async () => {
    setIsSaving(true)
    
    // Sauvegarder dans localStorage
    const profileData = {
      bio: editBio,
      location: editLocation,
      website: editWebsite,
      github: editGithub,
      linkedin: editLinkedin,
      twitter: editTwitter,
    }
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profileData))
    
    await new Promise(resolve => setTimeout(resolve, 500))
    setIsSaving(false)
    setShowEditModal(false)
    showNotification('Profil mis à jour avec succès')
  }

  // Partager le profil
  const handleShareProfile = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/profile/${user?.username || 'user'}`)
      setShowShareToast(true)
      setTimeout(() => setShowShareToast(false), 2000)
    } catch {
      setShowShareToast(true)
      setTimeout(() => setShowShareToast(false), 2000)
    }
  }

  // Utiliser les données de l'utilisateur connecté
  const displayUser = {
    username: user?.username || 'Utilisateur',
    email: user?.email || '',
    bio: savedProfile.bio || 'Bienvenue sur Work Us !',
    joinedAt: user?.createdAt || new Date().toISOString(),
    followers: data.followers?.length || 0,
    following: data.following?.length || 0,
    skills: userSkillsWithDetails,
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Input file caché */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={handlePhotoUpload}
        className="hidden"
      />

      {/* Toast notifications */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-20 right-4 z-50 flex items-center gap-2 px-4 py-3 bg-green-500 text-white rounded-xl shadow-lg"
          >
            <Check className="w-5 h-5" />
            {showToast}
          </motion.div>
        )}
        {showShareToast && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-20 right-4 z-50 flex items-center gap-2 px-4 py-3 bg-primary-500 text-white rounded-xl shadow-lg"
          >
            <Share2 className="w-5 h-5" />
            Lien du profil copié !
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative mb-8"
      >
        {/* Cover */}
        <div className="h-48 bg-gradient-to-br from-primary-500/20 via-secondary-500/20 to-accent-500/20 rounded-3xl" />
        
        {/* Avatar & info */}
        <div className="absolute -bottom-16 left-8 flex items-end gap-6">
          <div className="relative group">
            {profilePhoto ? (
              <img 
                src={profilePhoto} 
                alt={displayUser.username}
                className="w-32 h-32 rounded-3xl object-cover border-4 border-dark-900 shadow-xl"
              />
            ) : (
              <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-accent-400 to-accent-600 flex items-center justify-center text-white text-5xl font-bold border-4 border-dark-900 shadow-xl">
                {displayUser.username[0].toUpperCase()}
              </div>
            )}
            
            {/* Overlay pour changer la photo */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 rounded-3xl flex items-center justify-center transition-opacity border-4 border-transparent"
            >
              <div className="text-center">
                <Camera className="w-8 h-8 text-white mx-auto mb-1" />
                <span className="text-xs text-white">Changer</span>
              </div>
            </button>

            {/* Bouton supprimer si photo existe */}
            {profilePhoto && (
              <button
                onClick={handleRemovePhoto}
                className="absolute -top-2 -right-2 p-2 bg-red-500 rounded-full text-white hover:bg-red-600 transition-colors shadow-lg"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-white">{displayUser.username}</h1>
            <p className="text-dark-400">{displayUser.email}</p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <button 
            onClick={handleShareProfile}
            className="p-3 bg-dark-800/80 backdrop-blur-sm text-white rounded-xl hover:bg-dark-700 transition-all"
            title="Partager le profil"
          >
            <Share2 className="w-4 h-4" />
          </button>
          <button 
            onClick={() => navigate('/settings')}
            className="p-3 bg-dark-800/80 backdrop-blur-sm text-white rounded-xl hover:bg-dark-700 transition-all"
            title="Paramètres"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setShowEditModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-dark-800/80 backdrop-blur-sm text-white rounded-xl hover:bg-dark-700 transition-all"
          >
            <Edit2 className="w-4 h-4" />
            Modifier
          </button>
        </div>
      </motion.div>

      {/* Edit Modal */}
      <AnimatePresence>
        {showEditModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowEditModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-lg bg-dark-800 border border-dark-700 rounded-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-white">Modifier le profil</h3>
                  <button 
                    onClick={() => setShowEditModal(false)}
                    className="p-2 text-dark-400 hover:text-white rounded-lg hover:bg-dark-700 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Photo de profil dans le modal */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="relative group">
                    {profilePhoto ? (
                      <img 
                        src={profilePhoto} 
                        alt="Avatar"
                        className="w-20 h-20 rounded-2xl object-cover"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-accent-400 to-accent-600 flex items-center justify-center text-white text-2xl font-bold">
                        {displayUser.username[0].toUpperCase()}
                      </div>
                    )}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 rounded-2xl flex items-center justify-center transition-opacity"
                    >
                      <Camera className="w-6 h-6 text-white" />
                    </button>
                  </div>
                  <div>
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                    >
                      Changer la photo
                    </button>
                    <p className="text-sm text-dark-400 mt-1">JPG, PNG, GIF jusqu'à 5MB</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-2">Bio</label>
                    <textarea
                      value={editBio}
                      onChange={(e) => setEditBio(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-xl text-white focus:outline-none focus:border-primary-500 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-2">Localisation</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                      <input
                        type="text"
                        value={editLocation}
                        onChange={(e) => setEditLocation(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-dark-700 border border-dark-600 rounded-xl text-white focus:outline-none focus:border-primary-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-2">Site web</label>
                    <div className="relative">
                      <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                      <input
                        type="text"
                        value={editWebsite}
                        onChange={(e) => setEditWebsite(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-dark-700 border border-dark-600 rounded-xl text-white focus:outline-none focus:border-primary-500"
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-dark-700">
                    <h4 className="text-sm font-medium text-dark-300 mb-3">Réseaux sociaux</h4>
                    <div className="space-y-3">
                      <div className="relative">
                        <Github className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                        <input
                          type="text"
                          value={editGithub}
                          onChange={(e) => setEditGithub(e.target.value)}
                          placeholder="github.com/username"
                          className="w-full pl-10 pr-4 py-3 bg-dark-700 border border-dark-600 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:border-primary-500"
                        />
                      </div>
                      <div className="relative">
                        <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                        <input
                          type="text"
                          value={editLinkedin}
                          onChange={(e) => setEditLinkedin(e.target.value)}
                          placeholder="linkedin.com/in/username"
                          className="w-full pl-10 pr-4 py-3 bg-dark-700 border border-dark-600 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:border-primary-500"
                        />
                      </div>
                      <div className="relative">
                        <Twitter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                        <input
                          type="text"
                          value={editTwitter}
                          onChange={(e) => setEditTwitter(e.target.value)}
                          placeholder="twitter.com/username"
                          className="w-full pl-10 pr-4 py-3 bg-dark-700 border border-dark-600 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:border-primary-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 py-3 bg-dark-700 text-white rounded-xl hover:bg-dark-600 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                    className="flex-1 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-semibold rounded-xl hover:shadow-lg disabled:opacity-50 transition-all"
                  >
                    {isSaving ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                    ) : (
                      'Sauvegarder'
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats row */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mt-20 mb-8 flex items-center justify-center gap-12"
      >
        <div 
          className="text-center cursor-pointer hover:bg-dark-800/50 p-4 rounded-xl transition-colors"
          onClick={() => navigate('/followers')}
        >
          <p className="text-2xl font-bold text-white">{displayUser.followers}</p>
          <p className="text-dark-400">Followers</p>
        </div>
        <div 
          className="text-center cursor-pointer hover:bg-dark-800/50 p-4 rounded-xl transition-colors"
          onClick={() => navigate('/followers')}
        >
          <p className="text-2xl font-bold text-white">{displayUser.following}</p>
          <p className="text-dark-400">Suivis</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-white">{userStats.skillsWorkedOn}</p>
          <p className="text-dark-400">Compétences</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-accent-400 flex items-center justify-center gap-1">
            <Flame className="w-5 h-5" />
            {userStats.currentStreak}
          </p>
          <p className="text-dark-400">Série</p>
        </div>
      </motion.div>

      {/* Bio */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-8 p-6 bg-dark-800/50 border border-dark-700/50 rounded-2xl"
      >
        <h2 className="font-semibold text-white mb-3">À propos</h2>
        <p className="text-dark-300 mb-4">{editBio}</p>
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <span className="flex items-center gap-2 text-dark-400">
            <MapPin className="w-4 h-4" />
            {editLocation}
          </span>
          <span className="flex items-center gap-2 text-dark-400">
            <Calendar className="w-4 h-4" />
            Membre depuis {new Date(displayUser.joinedAt).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
          </span>
          {editWebsite && (
            <a 
              href={`https://${editWebsite}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-primary-400 hover:text-primary-300 transition-colors"
            >
              <Link2 className="w-4 h-4" />
              {editWebsite}
            </a>
          )}
        </div>
        <div className="flex items-center gap-3 mt-4">
          {editGithub && (
            <a 
              href={`https://${editGithub}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-dark-700 rounded-lg text-dark-400 hover:text-white transition-colors"
            >
              <Github className="w-5 h-5" />
            </a>
          )}
          {editLinkedin && (
            <a 
              href={`https://${editLinkedin}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-dark-700 rounded-lg text-dark-400 hover:text-white transition-colors"
            >
              <Linkedin className="w-5 h-5" />
            </a>
          )}
          {editTwitter && (
            <a 
              href={`https://${editTwitter}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-dark-700 rounded-lg text-dark-400 hover:text-white transition-colors"
            >
              <Twitter className="w-5 h-5" />
            </a>
          )}
        </div>
      </motion.section>

      {/* Stats cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid md:grid-cols-4 gap-4 mb-8"
      >
        <StatCard
          label="Heures"
          value={`${userStats.totalHoursLearned}h`}
          icon={<BookOpen className="w-5 h-5 text-white" />}
          gradient="from-primary-500 to-cyan-500"
          variant="compact"
        />
        <StatCard
          label="Exercices"
          value={userStats.exercisesCompleted}
          icon={<Code className="w-5 h-5 text-white" />}
          gradient="from-secondary-500 to-pink-500"
          variant="compact"
        />
        <StatCard
          label="Badges"
          value={userStats.achievementsUnlocked}
          icon={<Trophy className="w-5 h-5 text-white" />}
          gradient="from-amber-500 to-orange-500"
          variant="compact"
        />
        <StatCard
          label="Record"
          value={`${userStats.longestStreak}j`}
          icon={<Flame className="w-5 h-5 text-white" />}
          gradient="from-red-500 to-orange-500"
          variant="compact"
        />
      </motion.div>

      {/* Skills */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="p-6 bg-dark-800/50 border border-dark-700/50 rounded-2xl"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-semibold text-white">Compétences</h2>
          <button 
            onClick={() => navigate('/categories')}
            className="text-sm text-primary-400 hover:text-primary-300 transition-colors"
          >
            Explorer plus
          </button>
        </div>
        <div className="space-y-4">
          {userSkillsWithDetails.map(skill => (
            <div 
              key={skill.skillId} 
              className="cursor-pointer hover:bg-dark-700/30 p-2 -mx-2 rounded-lg transition-colors"
              onClick={() => navigate(`/specialty/${skill.specialtyId || 'react-dev'}`)}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-white">{skill.name}</span>
                <span className="text-sm text-dark-400">{skill.level}/10 • {skill.hoursWorked}h</span>
              </div>
              <LevelIndicator level={skill.level} size="sm" showLabel={false} />
            </div>
          ))}
        </div>
      </motion.section>

      {/* Badges placeholder */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-8 p-6 bg-dark-800/50 border border-dark-700/50 rounded-2xl"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-semibold text-white">Badges récents</h2>
          <button 
            onClick={() => navigate('/stats')}
            className="text-sm text-primary-400 hover:text-primary-300 transition-colors"
          >
            Voir tous
          </button>
        </div>
        <div className="flex flex-wrap gap-4">
          {['React Explorer', 'First Steps', '7 Days Streak', 'Problem Solver', 'Team Player'].map((badge, i) => (
            <motion.div 
              key={i} 
              className="flex items-center gap-3 p-3 bg-dark-700/50 rounded-xl cursor-pointer hover:bg-dark-600/50 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-medium text-white">{badge}</span>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* CV Builder */}
      {isAuthenticated && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-8"
        >
          <CVBuilder />
        </motion.section>
      )}
    </div>
  )
}
