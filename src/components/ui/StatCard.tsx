import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string | number
  change?: number // pourcentage de changement ou valeur numérique
  changeLabel?: string // label personnalisé pour le changement
  icon?: React.ReactNode
  gradient?: string
  variant?: 'default' | 'large' | 'compact'
}

/**
 * StatCard - Carte de statistique avec variation optionnelle
 */
export function StatCard({
  label,
  value,
  change,
  changeLabel,
  icon,
  gradient = 'from-primary-500 to-cyan-400',
  variant = 'default',
}: StatCardProps) {
  const getTrendIcon = () => {
    if (change === undefined) return null
    if (change > 0) return <TrendingUp className="w-4 h-4 text-green-400" />
    if (change < 0) return <TrendingDown className="w-4 h-4 text-red-400" />
    return <Minus className="w-4 h-4 text-dark-400" />
  }

  const getTrendColor = () => {
    if (change === undefined) return ''
    if (change > 0) return 'text-green-400'
    if (change < 0) return 'text-red-400'
    return 'text-dark-400'
  }

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-3 p-3 bg-dark-800/50 border border-dark-700/50 rounded-xl">
        {icon && (
          <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center`}>
            {icon}
          </div>
        )}
        <div>
          <p className="text-2xl font-bold text-white">{value}</p>
          <p className="text-xs text-dark-400">{label}</p>
        </div>
      </div>
    )
  }

  if (variant === 'large') {
    return (
      <motion.div
        whileHover={{ y: -4 }}
        className="relative overflow-hidden p-8 bg-dark-800/50 border border-dark-700/50 rounded-2xl"
      >
        {/* Background gradient */}
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-5`} />
        
        <div className="relative">
          {icon && (
            <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-6`}>
              {icon}
            </div>
          )}
          
          <p className="text-5xl font-bold text-white mb-2">{value}</p>
          <p className="text-dark-400">{label}</p>
          
          {(change !== undefined || changeLabel) && (
            <div className={`flex items-center gap-1 mt-4 ${getTrendColor()}`}>
              {getTrendIcon()}
              <span className="text-sm font-medium">
                {changeLabel || `${change && change > 0 ? '+' : ''}${change}% cette semaine`}
              </span>
            </div>
          )}
        </div>
      </motion.div>
    )
  }

  // Default variant
  return (
    <div className="p-6 bg-dark-800/50 border border-dark-700/50 rounded-2xl">
      <div className="flex items-start justify-between mb-4">
        {icon && (
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center`}>
            {icon}
          </div>
        )}
        {(change !== undefined || changeLabel) && (
          <div className={`flex items-center gap-1 ${getTrendColor()}`}>
            {getTrendIcon()}
            <span className="text-sm font-medium">
              {changeLabel || `${change && change > 0 ? '+' : ''}${change}%`}
            </span>
          </div>
        )}
      </div>
      
      <p className="text-3xl font-bold text-white mb-1">{value}</p>
      <p className="text-dark-400">{label}</p>
    </div>
  )
}

/**
 * MiniStatCard - Version très compacte pour les dashboards
 */
export function MiniStatCard({ label, value, icon }: Omit<StatCardProps, 'change' | 'gradient' | 'variant'>) {
  return (
    <div className="flex items-center gap-3 p-3 bg-dark-800/30 rounded-lg">
      {icon && <span className="text-dark-400">{icon}</span>}
      <div>
        <p className="text-lg font-bold text-white">{value}</p>
        <p className="text-xs text-dark-500">{label}</p>
      </div>
    </div>
  )
}

