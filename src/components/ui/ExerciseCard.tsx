import { motion } from 'framer-motion'
import { Code, Palette, HelpCircle, Rocket, FileQuestion, Clock, Trophy, Users, ChevronRight } from 'lucide-react'

interface ExerciseCardProps {
  title: string
  description: string
  difficulty: 'easy' | 'medium' | 'hard' | 'challenge'
  type: 'practice' | 'project' | 'quiz' | 'coding' | 'design'
  estimatedMinutes: number
  points: number
  completedBy?: number
  successRate?: number
  onClick?: () => void
}

const difficultyConfig = {
  easy: { label: 'Facile', color: 'text-green-400 bg-green-500/20', stars: 1 },
  medium: { label: 'Moyen', color: 'text-yellow-400 bg-yellow-500/20', stars: 2 },
  hard: { label: 'Difficile', color: 'text-orange-400 bg-orange-500/20', stars: 3 },
  challenge: { label: 'Challenge', color: 'text-red-400 bg-red-500/20', stars: 4 },
}

const typeConfig = {
  practice: { icon: Code, label: 'Pratique', color: 'from-blue-500 to-cyan-500' },
  project: { icon: Rocket, label: 'Projet', color: 'from-purple-500 to-pink-500' },
  quiz: { icon: HelpCircle, label: 'Quiz', color: 'from-amber-500 to-orange-500' },
  coding: { icon: Code, label: 'Code', color: 'from-green-500 to-emerald-500' },
  design: { icon: Palette, label: 'Design', color: 'from-pink-500 to-rose-500' },
}

/**
 * ExerciseCard - Carte d'exercice pratique
 */
export function ExerciseCard({
  title,
  description,
  difficulty,
  type,
  estimatedMinutes,
  points,
  completedBy,
  successRate,
  onClick,
}: ExerciseCardProps) {
  const diffConfig = difficultyConfig[difficulty]
  const typeConf = typeConfig[type]
  const Icon = typeConf.icon

  return (
    <motion.div
      whileHover={{ y: -4 }}
      onClick={onClick}
      className="group p-6 bg-dark-800/50 border border-dark-700/50 rounded-2xl cursor-pointer hover:border-primary-500/30 hover:shadow-lg hover:shadow-primary-500/5 transition-all"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${typeConf.color} flex items-center justify-center`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${diffConfig.color}`}>
              {diffConfig.label}
            </span>
            <span className="ml-2 text-xs text-dark-500">{typeConf.label}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 text-amber-400">
          <Trophy className="w-4 h-4" />
          <span className="font-semibold">{points}</span>
        </div>
      </div>

      {/* Content */}
      <h3 className="font-semibold text-lg text-white mb-2 group-hover:text-primary-400 transition-colors">
        {title}
      </h3>
      <p className="text-sm text-dark-400 line-clamp-2 mb-4">
        {description}
      </p>

      {/* Stats */}
      <div className="flex items-center justify-between pt-4 border-t border-dark-700/50">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-dark-400">
            <Clock className="w-4 h-4" />
            <span className="text-sm">{estimatedMinutes} min</span>
          </div>
          {completedBy !== undefined && (
            <div className="flex items-center gap-1.5 text-dark-400">
              <Users className="w-4 h-4" />
              <span className="text-sm">{completedBy.toLocaleString()}</span>
            </div>
          )}
          {successRate !== undefined && (
            <div className="text-sm text-dark-400">
              <span className={successRate >= 70 ? 'text-green-400' : successRate >= 50 ? 'text-yellow-400' : 'text-red-400'}>
                {successRate}%
              </span>
              <span className="ml-1">réussite</span>
            </div>
          )}
        </div>
        <ChevronRight className="w-5 h-5 text-dark-400 group-hover:text-primary-400 group-hover:translate-x-1 transition-all" />
      </div>
    </motion.div>
  )
}

/**
 * ExerciseCardCompact - Version compacte pour les listes
 */
export function ExerciseCardCompact({
  title,
  difficulty,
  type,
  estimatedMinutes,
  points,
  onClick,
}: ExerciseCardProps) {
  const diffConfig = difficultyConfig[difficulty]
  const typeConf = typeConfig[type]
  const Icon = typeConf.icon

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      onClick={onClick}
      className="flex items-center gap-4 p-4 bg-dark-800/50 border border-dark-700/50 rounded-xl cursor-pointer hover:border-primary-500/30 transition-all"
    >
      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${typeConf.color} flex items-center justify-center flex-shrink-0`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-white truncate">{title}</h4>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded-full text-xs ${diffConfig.color}`}>
            {diffConfig.label}
          </span>
          <span className="text-xs text-dark-400">{estimatedMinutes} min</span>
        </div>
      </div>
      <div className="flex items-center gap-1 text-amber-400">
        <Trophy className="w-4 h-4" />
        <span className="font-semibold">{points}</span>
      </div>
    </motion.div>
  )
}

