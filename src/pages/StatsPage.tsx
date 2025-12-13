import { useState, useEffect, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { 
  BarChart2, Clock, Target, Trophy, Flame, Calendar,
  TrendingUp, BookOpen, Code, Award, User
} from 'lucide-react'
import { StatCard, LevelIndicator } from '../components/ui'
import { useAuth } from '../contexts/AuthContext'
import { useUserData } from '../contexts/UserDataContext'

type StatPeriod = 'week' | 'month' | 'year'

interface DailyTimeRecord {
  date: string // Format: YYYY-MM-DD
  minutes: number
}

interface UserStatsData {
  totalHoursLearned: number
  skillsWorkedOn: number
  exercisesCompleted: number
  achievementsUnlocked: number
  currentStreak: number
  longestStreak: number
  accountCreatedAt: string
  dailyTimeRecords: DailyTimeRecord[]
  lastActiveDate: string
  sessionStartTime: number // timestamp du début de session
}

// Clés de stockage - Ces données sont PERSISTANTES et ne seront JAMAIS effacées par les mises à jour
const STATS_STORAGE_KEY = 'workus_user_stats_v2'
const SESSION_KEY = 'workus_session_start'
const SESSION_DATE_KEY = 'workus_session_date'

// Migration depuis l'ancienne version si nécessaire
const migrateOldStats = () => {
  const oldKey = 'workus_user_stats'
  const oldData = localStorage.getItem(oldKey)
  const newData = localStorage.getItem(STATS_STORAGE_KEY)
  
  // Si on a des anciennes données mais pas de nouvelles, migrer
  if (oldData && !newData) {
    try {
      const parsed = JSON.parse(oldData)
      if (parsed && parsed.stats) {
        localStorage.setItem(STATS_STORAGE_KEY, oldData)
        console.log('Migration des statistiques réussie')
      }
    } catch {
      // Ignorer les erreurs de parsing
    }
  }
}

// Exécuter la migration au chargement
if (typeof window !== 'undefined') {
  migrateOldStats()
}

// Fonction pour obtenir la date d'aujourd'hui au format YYYY-MM-DD
const getTodayDate = (): string => {
  return new Date().toISOString().split('T')[0]
}

// Fonction pour obtenir une date passée
const getPastDate = (daysAgo: number): string => {
  const date = new Date()
  date.setDate(date.getDate() - daysAgo)
  return date.toISOString().split('T')[0]
}

// Fonction pour formater une date en français
const formatDateFr = (dateStr: string, format: 'short' | 'medium' | 'long' = 'medium'): string => {
  const date = new Date(dateStr)
  const options: Intl.DateTimeFormatOptions = format === 'short' 
    ? { day: 'numeric', month: 'short' }
    : format === 'long'
    ? { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }
    : { day: 'numeric', month: 'long' }
  return date.toLocaleDateString('fr-FR', options)
}

// Fonction pour formater les minutes en heures et minutes
const formatTime = (minutes: number): string => {
  if (minutes === 0) return '0 min'
  const hours = Math.floor(minutes / 60)
  const mins = Math.round(minutes % 60)
  if (hours === 0) return `${mins} min`
  if (mins === 0) return `${hours}h`
  return `${hours}h ${mins}m`
}

// Valeurs par défaut pour éviter les crashes
const getDefaultStats = (createdAt?: string): UserStatsData => {
  const today = getTodayDate()
  return {
    totalHoursLearned: 0,
    skillsWorkedOn: 0,
    exercisesCompleted: 0,
    achievementsUnlocked: 0,
    currentStreak: 1,
    longestStreak: 1,
    accountCreatedAt: createdAt || new Date().toISOString(),
    dailyTimeRecords: [{ date: today, minutes: 0 }],
    lastActiveDate: today,
    sessionStartTime: Date.now()
  }
}

// Charger les stats depuis localStorage (fonction statique pour l'initialisation)
const loadStatsFromStorage = (userCreatedAt?: string): UserStatsData => {
  const today = getTodayDate()
  
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(STATS_STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed && parsed.stats) {
          // S'assurer que dailyTimeRecords est un tableau valide
          const dailyTimeRecords = Array.isArray(parsed.stats.dailyTimeRecords) 
            ? parsed.stats.dailyTimeRecords 
            : [{ date: today, minutes: 0 }]
          
          // Récupérer la date de création du compte depuis les stats sauvegardées
          const accountCreatedAt = parsed.stats.accountCreatedAt || userCreatedAt || new Date().toISOString()
          
          return {
            ...getDefaultStats(accountCreatedAt),
            ...parsed.stats,
            accountCreatedAt, // Toujours préserver la date de création
            dailyTimeRecords
          }
        }
      }
    } catch {
      // Ignorer les erreurs de parsing
    }
  }
  
  return getDefaultStats(userCreatedAt)
}

/**
 * StatsPage - Statistiques détaillées de l'utilisateur
 * Avec suivi du temps réel et historique persistant
 */
export function StatsPage() {
  const { user } = useAuth()
  const { data } = useUserData()
  const [period, setPeriod] = useState<StatPeriod>('week')
  const [hoveredBar, setHoveredBar] = useState<number | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })
  const sessionStartRef = useRef<number>(Date.now())
  const lastSaveRef = useRef<number>(Date.now())
  const [isLoading, setIsLoading] = useState(true)
  const isInitializedRef = useRef(false)
  
  // Initialiser les stats depuis localStorage IMMÉDIATEMENT
  const [userStats, setUserStats] = useState<UserStatsData>(() => {
    const loaded = loadStatsFromStorage(user?.createdAt)
    return loaded
  })

  // Gérer la session au montage
  useEffect(() => {
    if (isInitializedRef.current) return
    isInitializedRef.current = true
    
    const today = getTodayDate()
    const storedSessionDate = localStorage.getItem(SESSION_DATE_KEY)
    const storedSessionStart = localStorage.getItem(SESSION_KEY)
    
    let startTime: number
    
    if (storedSessionDate === today && storedSessionStart) {
      // Même jour, continuer la session existante
      startTime = parseInt(storedSessionStart) || Date.now()
    } else {
      // Nouveau jour ou première session
      startTime = Date.now()
      localStorage.setItem(SESSION_KEY, startTime.toString())
      localStorage.setItem(SESSION_DATE_KEY, today)
    }
    
    sessionStartRef.current = startTime
    lastSaveRef.current = Date.now()
    
    // Charger les stats depuis localStorage
    const loaded = loadStatsFromStorage(user?.createdAt)
    setUserStats(loaded)
    setIsLoading(false)
  }, [user?.createdAt])

  // Sauvegarder le temps passé
  const saveTimeSpent = useCallback(() => {
    const now = Date.now()
    const timeSinceLastSave = Math.round((now - lastSaveRef.current) / 1000 / 60) // en minutes depuis dernière sauvegarde
    const today = getTodayDate()
    
    // Ne sauvegarder que si du temps s'est écoulé
    if (timeSinceLastSave <= 0) return
    
    setUserStats(prev => {
      // S'assurer que dailyTimeRecords est un tableau
      const safeRecords = Array.isArray(prev?.dailyTimeRecords) ? prev.dailyTimeRecords : []
      
      // Trouver ou créer l'enregistrement d'aujourd'hui
      const existingIndex = safeRecords.findIndex(r => r?.date === today)
      let newRecords = [...safeRecords]
      
      if (existingIndex >= 0) {
        // Ajouter le temps depuis la dernière sauvegarde
        const currentMinutes = newRecords[existingIndex]?.minutes || 0
        newRecords[existingIndex] = {
          date: today,
          minutes: currentMinutes + timeSinceLastSave
        }
      } else {
        // Nouveau jour - ajouter un nouvel enregistrement
        newRecords.push({
          date: today,
          minutes: timeSinceLastSave
        })
      }
      
      // Garder seulement les 365 derniers jours
      if (newRecords.length > 365) {
        newRecords = newRecords.slice(-365)
      }
      
      // Calculer le temps total
      const totalMinutes = newRecords.reduce((sum, r) => sum + (r?.minutes || 0), 0)
      
      // Calculer la série (streak)
      let streak = 0
      for (let i = 0; i <= 365; i++) {
        const checkDate = getPastDate(i)
        const record = newRecords.find(r => r?.date === checkDate)
        if (record && record.minutes > 0) {
          streak++
        } else if (i > 0) { // On ne casse pas la série si c'est aujourd'hui sans activité
          break
        }
      }
      
      return {
        ...getDefaultStats(prev?.accountCreatedAt),
        ...prev,
        dailyTimeRecords: newRecords,
        totalHoursLearned: Math.round(totalMinutes / 60 * 10) / 10,
        lastActiveDate: today,
        currentStreak: streak,
        longestStreak: Math.max(prev?.longestStreak || 1, streak)
      }
    })
    
    lastSaveRef.current = now
  }, [])

  // Sauvegarder automatiquement toutes les 30 secondes
  useEffect(() => {
    const interval = setInterval(() => {
      saveTimeSpent()
    }, 30000) // 30 secondes
    
    // Sauvegarder quand on quitte la page
    const handleBeforeUnload = () => {
      saveTimeSpent()
    }
    
    window.addEventListener('beforeunload', handleBeforeUnload)
    
    return () => {
      clearInterval(interval)
      window.removeEventListener('beforeunload', handleBeforeUnload)
      saveTimeSpent() // Sauvegarder en quittant le composant
    }
  }, [saveTimeSpent])

  // Sauvegarder les stats dans localStorage - seulement quand les données sont initialisées
  useEffect(() => {
    // Ne pas sauvegarder si on est en chargement ou si les données ne sont pas initialisées
    if (isLoading || !isInitializedRef.current) return
    
    // Vérifier que les données sont valides avant de sauvegarder
    if (!userStats || !userStats.accountCreatedAt) return
    
    localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify({
      userId: user?.id || 'anonymous',
      stats: userStats,
      lastSaved: Date.now()
    }))
  }, [userStats, user, isLoading])

  // Mettre à jour les compétences depuis UserData - seulement après initialisation
  useEffect(() => {
    if (!isInitializedRef.current || isLoading) return
    
    const skillProgress = data?.skillProgress || {}
    const skillsCount = Object.keys(skillProgress).length
    
    // Ne mettre à jour que si c'est différent pour éviter les boucles
    setUserStats(prev => {
      if (prev.skillsWorkedOn === skillsCount) return prev
      return {
        ...prev,
        skillsWorkedOn: skillsCount
      }
    })
  }, [data, isLoading])

  // Obtenir les skills de l'utilisateur avec leur progression (avec protection)
  const skillProgress = data?.skillProgress || {}
  const userSkillsWithDetails = Object.entries(skillProgress).map(([skillId, progress]) => ({
    skillId,
    name: skillId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    level: (progress as { level?: number })?.level || 0,
    hoursWorked: (progress as { hoursWorked?: number })?.hoursWorked || 0,
  })).sort((a, b) => b.level - a.level)

  // Formater la date de création du compte
  const formatAccountAge = () => {
    const created = new Date(userStats.accountCreatedAt)
    const now = new Date()
    const diffMs = now.getTime() - created.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return "Aujourd'hui"
    if (diffDays === 1) return "Hier"
    if (diffDays < 7) return `${diffDays} jours`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} semaines`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} mois`
    return `${Math.floor(diffDays / 365)} ans`
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    })
  }

  // Libellés des périodes
  const periodLabels = {
    week: 'Cette semaine',
    month: 'Ce mois',
    year: 'Cette année'
  }

  // Générer les données d'activité réelles pour la période sélectionnée
  const getActivityData = useCallback(() => {
    const count = period === 'week' ? 7 : period === 'month' ? 30 : 365
    const activityDataArray: { date: string; minutes: number; label: string }[] = []
    
    // S'assurer que dailyTimeRecords est un tableau
    const safeRecords = Array.isArray(userStats?.dailyTimeRecords) ? userStats.dailyTimeRecords : []
    
    for (let i = count - 1; i >= 0; i--) {
      const date = getPastDate(i)
      const record = safeRecords.find(r => r?.date === date)
      const minutes = record?.minutes || 0
      
      // Formater le label selon la période
      let label: string
      if (period === 'week') {
        const d = new Date(date)
        const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
        label = `${dayNames[d.getDay()]} ${d.getDate()}/${d.getMonth() + 1}`
      } else if (period === 'month') {
        label = formatDateFr(date, 'short')
      } else {
        label = formatDateFr(date, 'medium')
      }
      
      activityDataArray.push({ date, minutes, label })
    }
    
    return activityDataArray
  }, [period, userStats?.dailyTimeRecords])

  const activityData = getActivityData()
  
  // Calculer les stats de la période sélectionnée
  const getPeriodStats = useCallback(() => {
    const count = period === 'week' ? 7 : period === 'month' ? 30 : 365
    let totalMinutes = 0
    let daysActive = 0
    
    // S'assurer que dailyTimeRecords est un tableau
    const safeRecords = Array.isArray(userStats?.dailyTimeRecords) ? userStats.dailyTimeRecords : []
    
    for (let i = 0; i < count; i++) {
      const date = getPastDate(i)
      const record = safeRecords.find(r => r?.date === date)
      if (record && record.minutes > 0) {
        totalMinutes += record.minutes
        daysActive++
      }
    }
    
    return {
      totalMinutes,
      daysActive,
      averagePerDay: daysActive > 0 ? Math.round(totalMinutes / daysActive) : 0
    }
  }, [period, userStats?.dailyTimeRecords])
  
  const periodStats = getPeriodStats()

  // Temps passé aujourd'hui (en temps réel)
  const getTodayTime = useCallback(() => {
    const today = getTodayDate()
    // S'assurer que dailyTimeRecords est un tableau
    const safeRecords = Array.isArray(userStats?.dailyTimeRecords) ? userStats.dailyTimeRecords : []
    const record = safeRecords.find(r => r?.date === today)
    const savedMinutes = record?.minutes || 0
    // Ajouter le temps depuis la dernière sauvegarde (pas depuis le début de session)
    const minutesSinceLastSave = Math.round((Date.now() - lastSaveRef.current) / 1000 / 60)
    return savedMinutes + Math.max(0, minutesSinceLastSave)
  }, [userStats?.dailyTimeRecords])

  const [todayTime, setTodayTime] = useState(getTodayTime())
  
  // Mettre à jour le temps d'aujourd'hui en temps réel
  useEffect(() => {
    const interval = setInterval(() => {
      setTodayTime(getTodayTime())
    }, 1000) // Chaque seconde
    
    return () => clearInterval(interval)
  }, [getTodayTime])

  // Gérer le survol des barres
  const handleBarHover = (index: number, event: React.MouseEvent) => {
    setHoveredBar(index)
    const rect = event.currentTarget.getBoundingClientRect()
    setTooltipPosition({
      x: rect.left + rect.width / 2,
      y: rect.top - 10
    })
  }

  // Afficher un état de chargement si les données ne sont pas encore prêtes
  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-dark-400">Chargement des statistiques...</p>
        </div>
      </div>
    )
  }

  // Valeurs sûres pour le rendu
  const safeUserStats = userStats || getDefaultStats(user?.createdAt)
  const safeActivityData = Array.isArray(activityData) ? activityData : []
  const safeMaxMinutes = Math.max(...safeActivityData.map(d => d?.minutes || 0), 1)

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
            <BarChart2 className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Statistiques</h1>
            <p className="text-dark-400">Suivez votre progression en détail</p>
          </div>
        </div>

        {/* Sélecteur de période */}
        <div className="flex items-center gap-2 bg-dark-800 rounded-xl p-1">
          {(['week', 'month', 'year'] as StatPeriod[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                period === p
                  ? 'bg-primary-500 text-white'
                  : 'text-dark-400 hover:text-white'
              }`}
            >
              {p === 'week' ? 'Semaine' : p === 'month' ? 'Mois' : 'Année'}
            </button>
          ))}
        </div>
      </div>

      {/* Compte créé le */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 p-4 bg-dark-800/50 border border-dark-700/50 rounded-xl flex items-center gap-4"
      >
        <div className="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center">
          <User className="w-5 h-5 text-primary-400" />
        </div>
        <div className="flex-1">
          <p className="text-sm text-dark-400">Membre depuis</p>
          <p className="font-medium text-white">{formatDate(safeUserStats.accountCreatedAt)}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-dark-400">Ancienneté</p>
          <p className="font-medium text-primary-400">{formatAccountAge()}</p>
        </div>
      </motion.div>

      {/* Main stats grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <StatCard
            label="Temps total sur le site"
            value={`${safeUserStats.totalHoursLearned}h`}
            change={todayTime > 0 ? 1 : 0}
            changeLabel={`+${formatTime(todayTime)} aujourd'hui`}
            icon={<Clock className="w-6 h-6 text-white" />}
            gradient="from-primary-500 to-cyan-500"
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <StatCard
            label="Compétences travaillées"
            value={safeUserStats.skillsWorkedOn}
            change={safeUserStats.skillsWorkedOn > 0 ? 1 : 0}
            icon={<Target className="w-6 h-6 text-white" />}
            gradient="from-secondary-500 to-pink-500"
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <StatCard
            label="Exercices complétés"
            value={safeUserStats.exercisesCompleted}
            change={0}
            icon={<Code className="w-6 h-6 text-white" />}
            gradient="from-accent-500 to-emerald-500"
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <StatCard
            label="Badges débloqués"
            value={safeUserStats.achievementsUnlocked}
            change={0}
            icon={<Award className="w-6 h-6 text-white" />}
            gradient="from-amber-500 to-orange-500"
          />
        </motion.div>
      </div>

      {/* Streak section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mb-8 p-6 bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-2xl"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
              <Flame className="w-8 h-8 text-white" />
            </div>
            <div>
              <p className="text-dark-400 text-sm">Série actuelle</p>
              <p className="text-4xl font-bold text-white">{safeUserStats.currentStreak} jour{safeUserStats.currentStreak > 1 ? 's' : ''}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-dark-400 text-sm">Record</p>
            <p className="text-2xl font-bold text-amber-400">{safeUserStats.longestStreak} jours</p>
          </div>
        </div>
        
        {/* Weekly calendar - 7 derniers jours */}
        <div className="mt-6 flex items-center justify-between">
          {Array.from({ length: 7 }).map((_, i) => {
            const date = getPastDate(6 - i)
            const d = new Date(date)
            const dayNames = ['D', 'L', 'M', 'M', 'J', 'V', 'S']
            // S'assurer que dailyTimeRecords est un tableau
            const safeRecords = Array.isArray(safeUserStats?.dailyTimeRecords) ? safeUserStats.dailyTimeRecords : []
            const record = safeRecords.find(r => r?.date === date)
            const hasActivity = record && record.minutes > 0
            const isToday = date === getTodayDate()
            
            return (
              <div key={i} className="text-center">
                <p className="text-sm text-dark-400 mb-2">{dayNames[d.getDay()]}</p>
                <div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    hasActivity || (isToday && todayTime > 0)
                      ? 'bg-amber-500 text-white' 
                      : 'bg-dark-700 text-dark-400'
                  } ${isToday ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-dark-800' : ''}`}
                  title={`${formatDateFr(date, 'long')} - ${formatTime(record?.minutes || (isToday ? todayTime : 0))}`}
                >
                  {(hasActivity || (isToday && todayTime > 0)) ? '✓' : d.getDate()}
                </div>
              </div>
            )
          })}
        </div>
      </motion.div>

      {/* Skills progress */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Top skills */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="p-6 bg-dark-800/50 border border-dark-700/50 rounded-2xl"
        >
          <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            Top compétences
          </h2>
          {userSkillsWithDetails.length === 0 ? (
            <div className="text-center py-8">
              <Target className="w-12 h-12 text-dark-600 mx-auto mb-4" />
              <p className="text-dark-400">Aucune compétence travaillée</p>
              <p className="text-sm text-dark-500 mt-2">Commencez à apprendre pour voir vos statistiques</p>
            </div>
          ) : (
            <div className="space-y-4">
              {userSkillsWithDetails.slice(0, 5).map((skill, index) => (
                <div key={skill.skillId} className="flex items-center gap-4">
                  <span className="text-2xl font-bold text-dark-500 w-8">#{index + 1}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-white">{skill.name}</span>
                      <span className="text-sm text-dark-400">{skill.hoursWorked}h</span>
                    </div>
                    <LevelIndicator level={skill.level} size="sm" showLabel={false} />
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-bold text-white">{skill.level}</span>
                    <span className="text-dark-400">/10</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.section>

        {/* Period progress */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="p-6 bg-dark-800/50 border border-dark-700/50 rounded-2xl"
        >
          <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary-400" />
            Progression - {periodLabels[period]}
          </h2>
          <div className="p-4 bg-dark-700/50 rounded-xl">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-dark-400">{periodLabels[period]}</span>
              <span className="flex items-center gap-1 text-accent-400">
                <TrendingUp className="w-4 h-4" />
                {formatTime(periodStats.totalMinutes)}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-dark-800/50 rounded-xl">
                <p className="text-2xl font-bold text-white">{formatTime(periodStats.totalMinutes)}</p>
                <p className="text-xs text-dark-400 mt-1">Temps total</p>
              </div>
              <div className="p-4 bg-dark-800/50 rounded-xl">
                <p className="text-2xl font-bold text-white">{periodStats.daysActive}</p>
                <p className="text-xs text-dark-400 mt-1">Jours actifs</p>
              </div>
              <div className="p-4 bg-dark-800/50 rounded-xl">
                <p className="text-2xl font-bold text-white">{formatTime(periodStats.averagePerDay)}</p>
                <p className="text-xs text-dark-400 mt-1">Moyenne/jour</p>
              </div>
            </div>
          </div>
        </motion.section>
      </div>

      {/* Activity chart */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="mt-8 p-6 bg-dark-800/50 border border-dark-700/50 rounded-2xl relative"
      >
        <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-secondary-400" />
          Activité - {periodLabels[period]}
        </h2>
        
        {/* Tooltip */}
        {hoveredBar !== null && safeActivityData[hoveredBar] && (
          <div 
            className="fixed z-50 px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg shadow-xl pointer-events-none transform -translate-x-1/2 -translate-y-full"
            style={{ 
              left: tooltipPosition.x, 
              top: tooltipPosition.y - 8
            }}
          >
            <p className="text-xs text-dark-400">{safeActivityData[hoveredBar]?.label || ''}</p>
            <p className="text-sm font-bold text-white">{formatTime(safeActivityData[hoveredBar]?.minutes || 0)}</p>
          </div>
        )}
        
        <div className="h-40 flex items-end justify-between gap-1">
          {safeActivityData.map((barData, i) => {
            const height = safeMaxMinutes > 0 ? ((barData?.minutes || 0) / safeMaxMinutes) * 100 : 0
            const isToday = barData?.date === getTodayDate()
            
            return (
              <div
                key={i}
                className={`flex-1 rounded-t cursor-pointer transition-all duration-200 ${
                  hoveredBar === i 
                    ? 'bg-primary-400 scale-110' 
                    : isToday
                    ? 'bg-primary-400'
                    : (barData?.minutes || 0) > 0 
                    ? 'bg-primary-500 hover:bg-primary-400' 
                    : 'bg-dark-600 hover:bg-dark-500'
                }`}
                style={{ height: `${Math.max(height, 4)}%` }}
                onMouseEnter={(e) => handleBarHover(i, e)}
                onMouseLeave={() => setHoveredBar(null)}
                title={`${barData?.label || ''}: ${formatTime(barData?.minutes || 0)}`}
              />
            )
          })}
        </div>
        <div className="flex justify-between mt-4 text-xs text-dark-500">
          <span>
            {period === 'week' 
              ? formatDateFr(getPastDate(6), 'short')
              : period === 'month' 
              ? formatDateFr(getPastDate(29), 'short')
              : formatDateFr(getPastDate(364), 'short')
            }
          </span>
          <span className="text-primary-400 font-medium">
            Aujourd'hui ({formatDateFr(getTodayDate(), 'short')})
          </span>
        </div>
      </motion.section>
    </div>
  )
}
