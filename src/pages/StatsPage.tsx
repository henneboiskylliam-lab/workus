import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  BarChart2, Clock, Target, Trophy, Flame, Calendar,
  TrendingUp, BookOpen, Code, Award, User
} from 'lucide-react'
import { StatCard, LevelIndicator } from '../components/ui'
import { useAuth } from '../contexts/AuthContext'
import { useUserData } from '../contexts/UserDataContext'

type StatPeriod = 'week' | 'month' | 'year'

interface UserStatsData {
  totalHoursLearned: number
  skillsWorkedOn: number
  exercisesCompleted: number
  achievementsUnlocked: number
  currentStreak: number
  longestStreak: number
  accountCreatedAt: string
  periodProgress: {
    hoursLearned: number
    exercisesCompleted: number
    newSkillsStarted: number
  }
}

const STATS_STORAGE_KEY = 'workus_user_stats'

/**
 * StatsPage - Statistiques détaillées de l'utilisateur
 * Avec filtre par période et date de création du compte
 */
export function StatsPage() {
  const { user } = useAuth()
  const { data, getWeeklyActivity, getTodayActivity } = useUserData()
  const [period, setPeriod] = useState<StatPeriod>('week')
  
  // Charger ou initialiser les stats
  const [userStats, setUserStats] = useState<UserStatsData>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STATS_STORAGE_KEY)
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          // Vérifier si les stats appartiennent à l'utilisateur connecté
          if (parsed.userId === user?.id) {
            return parsed.stats
          }
        } catch {
          // Ignorer
        }
      }
    }
    
    // Initialiser les stats pour un nouvel utilisateur
    return {
      totalHoursLearned: 0,
      skillsWorkedOn: 0,
      exercisesCompleted: 0,
      achievementsUnlocked: 0,
      currentStreak: 0,
      longestStreak: 0,
      accountCreatedAt: user?.createdAt || new Date().toISOString(),
      periodProgress: {
        hoursLearned: 0,
        exercisesCompleted: 0,
        newSkillsStarted: 0
      }
    }
  })

  // Sauvegarder automatiquement les stats
  useEffect(() => {
    if (user) {
      localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify({
        userId: user.id,
        stats: userStats
      }))
    }
  }, [userStats, user])

  // Calculer les stats basées sur les données utilisateur
  useEffect(() => {
    const skillsCount = Object.keys(data.skillProgress || {}).length
    
    // Calculer le temps total passé sur le site (en heures)
    const weeklyActivity = getWeeklyActivity()
    const totalMinutes = weeklyActivity.reduce((sum, day) => sum + day.timeSpentMinutes, 0)
    const totalHours = Math.round(totalMinutes / 60 * 10) / 10 // Arrondi à 1 décimale
    
    setUserStats(prev => ({
      ...prev,
      skillsWorkedOn: skillsCount,
      totalHoursLearned: totalHours,
      periodProgress: {
        ...prev.periodProgress,
        hoursLearned: Math.round(getTodayActivity() / 60 * 10) / 10
      }
    }))
  }, [data, getWeeklyActivity, getTodayActivity])

  // Obtenir les skills de l'utilisateur avec leur progression
  const userSkillsWithDetails = Object.entries(data.skillProgress || {}).map(([skillId, progress]) => ({
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

  // Générer des données d'activité (simulées pour l'instant)
  const getActivityData = () => {
    const count = period === 'week' ? 7 : period === 'month' ? 30 : 52
    return Array.from({ length: count }).map(() => Math.random() * 100)
  }

  const activityData = getActivityData()

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
          <p className="font-medium text-white">{formatDate(userStats.accountCreatedAt)}</p>
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
            label="Heures d'apprentissage"
            value={`${userStats.totalHoursLearned}h`}
            change={0}
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
            value={userStats.skillsWorkedOn}
            change={0}
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
            value={userStats.exercisesCompleted}
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
            value={userStats.achievementsUnlocked}
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
              <p className="text-4xl font-bold text-white">{userStats.currentStreak} jours</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-dark-400 text-sm">Record</p>
            <p className="text-2xl font-bold text-amber-400">{userStats.longestStreak} jours</p>
          </div>
        </div>
        
        {/* Weekly calendar */}
        <div className="mt-6 flex items-center justify-between">
          {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((day, i) => (
            <div key={i} className="text-center">
              <p className="text-sm text-dark-400 mb-2">{day}</p>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                i < userStats.currentStreak % 7 ? 'bg-amber-500 text-white' : 'bg-dark-700 text-dark-400'
              }`}>
                {i < userStats.currentStreak % 7 ? '✓' : ''}
              </div>
            </div>
          ))}
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
                {userStats.periodProgress.hoursLearned}h
              </span>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-dark-800/50 rounded-xl">
                <p className="text-2xl font-bold text-white">{userStats.periodProgress.hoursLearned}</p>
                <p className="text-xs text-dark-400 mt-1">Heures</p>
              </div>
              <div className="p-4 bg-dark-800/50 rounded-xl">
                <p className="text-2xl font-bold text-white">{userStats.periodProgress.exercisesCompleted}</p>
                <p className="text-xs text-dark-400 mt-1">Exercices</p>
              </div>
              <div className="p-4 bg-dark-800/50 rounded-xl">
                <p className="text-2xl font-bold text-white">{userStats.periodProgress.newSkillsStarted}</p>
                <p className="text-xs text-dark-400 mt-1">Nouvelles compétences</p>
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
        className="mt-8 p-6 bg-dark-800/50 border border-dark-700/50 rounded-2xl"
      >
        <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-secondary-400" />
          Activité - {periodLabels[period]}
        </h2>
        <div className="h-32 flex items-end justify-between gap-1">
          {activityData.map((height, i) => (
            <div
              key={i}
              className={`flex-1 rounded-t transition-all hover:bg-primary-400 ${
                height > 60 ? 'bg-primary-500' : height > 30 ? 'bg-primary-600' : 'bg-dark-600'
              }`}
              style={{ height: `${Math.max(height, 10)}%` }}
            />
          ))}
        </div>
        <div className="flex justify-between mt-2 text-xs text-dark-500">
          <span>{period === 'week' ? '7 jours' : period === 'month' ? '30 jours' : '52 semaines'}</span>
          <span>Aujourd'hui</span>
        </div>
      </motion.section>
    </div>
  )
}
