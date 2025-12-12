import { motion } from 'framer-motion'
import { BookOpen, Clock, CheckCircle, ChevronRight } from 'lucide-react'
import { LevelIndicator } from './LevelIndicator'

interface SkillCardProps {
  name: string
  description?: string
  level: number // 0-10
  hoursWorked?: number
  exercisesCompleted?: number
  lastPracticed?: string
  icon?: React.ReactNode
  gradient?: string
  onClick?: () => void
  variant?: 'default' | 'compact' | 'detailed'
}

/**
 * SkillCard - Carte de compétence réutilisable
 * Affiche le niveau (0-10), les heures travaillées et les exercices complétés
 */
export function SkillCard({
  name,
  description,
  level,
  hoursWorked,
  exercisesCompleted,
  lastPracticed,
  icon,
  gradient = 'from-primary-500 to-cyan-400',
  onClick,
  variant = 'default',
}: SkillCardProps) {
  if (variant === 'compact') {
    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className="flex items-center gap-4 p-4 bg-dark-800/50 border border-dark-700/50 rounded-xl cursor-pointer hover:border-primary-500/30 transition-all"
      >
        {icon && (
          <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center`}>
            {icon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-white truncate">{name}</h4>
          <div className="flex items-center gap-2 mt-1">
            <LevelIndicator level={level} size="sm" />
            <span className="text-xs text-dark-400">Niveau {level}/10</span>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-dark-400" />
      </motion.div>
    )
  }

  return (
    <motion.div
      whileHover={{ y: -4 }}
      onClick={onClick}
      className="group p-6 bg-dark-800/50 border border-dark-700/50 rounded-2xl cursor-pointer hover:border-primary-500/30 hover:shadow-lg hover:shadow-primary-500/5 transition-all"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {icon && (
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}>
              {icon}
            </div>
          )}
          <div>
            <h3 className="font-semibold text-lg text-white group-hover:text-primary-400 transition-colors">
              {name}
            </h3>
            {description && (
              <p className="text-sm text-dark-400 line-clamp-2 mt-1">{description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Level */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-dark-400">Niveau</span>
          <span className="text-sm font-semibold text-white">{level}/10</span>
        </div>
        <LevelIndicator level={level} showLabel={false} />
      </div>

      {/* Stats */}
      {variant === 'detailed' && (
        <div className="grid grid-cols-3 gap-3 pt-4 border-t border-dark-700/50">
          {hoursWorked !== undefined && (
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-dark-400 mb-1">
                <Clock className="w-4 h-4" />
              </div>
              <p className="text-lg font-semibold text-white">{hoursWorked}h</p>
              <p className="text-xs text-dark-500">Travaillées</p>
            </div>
          )}
          {exercisesCompleted !== undefined && (
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-dark-400 mb-1">
                <CheckCircle className="w-4 h-4" />
              </div>
              <p className="text-lg font-semibold text-white">{exercisesCompleted}</p>
              <p className="text-xs text-dark-500">Exercices</p>
            </div>
          )}
          {lastPracticed && (
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-dark-400 mb-1">
                <BookOpen className="w-4 h-4" />
              </div>
              <p className="text-lg font-semibold text-white">{lastPracticed}</p>
              <p className="text-xs text-dark-500">Dernière</p>
            </div>
          )}
        </div>
      )}
    </motion.div>
  )
}

