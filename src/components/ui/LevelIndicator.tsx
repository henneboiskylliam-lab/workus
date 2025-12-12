interface LevelIndicatorProps {
  level: number // 0-10
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  animated?: boolean
}

/**
 * LevelIndicator - Indicateur de niveau de 0 à 10
 * Utilisé pour afficher la progression des compétences
 */
export function LevelIndicator({
  level,
  size = 'md',
  showLabel = true,
  animated = true,
}: LevelIndicatorProps) {
  // Clamp level between 0 and 10
  const clampedLevel = Math.max(0, Math.min(10, level))
  const percentage = (clampedLevel / 10) * 100

  // Determine color based on level
  const getColor = () => {
    if (clampedLevel <= 2) return 'bg-red-500'
    if (clampedLevel <= 4) return 'bg-orange-500'
    if (clampedLevel <= 6) return 'bg-yellow-500'
    if (clampedLevel <= 8) return 'bg-green-500'
    return 'bg-emerald-400'
  }

  const getGlow = () => {
    if (clampedLevel <= 2) return 'shadow-red-500/30'
    if (clampedLevel <= 4) return 'shadow-orange-500/30'
    if (clampedLevel <= 6) return 'shadow-yellow-500/30'
    if (clampedLevel <= 8) return 'shadow-green-500/30'
    return 'shadow-emerald-400/30'
  }

  const heights = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3',
  }

  return (
    <div className="w-full">
      {/* Progress bar */}
      <div className={`relative ${heights[size]} bg-dark-700 rounded-full overflow-hidden`}>
        <div
          className={`
            absolute left-0 top-0 h-full rounded-full
            ${getColor()}
            ${animated ? 'transition-all duration-700 ease-out' : ''}
            ${clampedLevel >= 8 ? `shadow-lg ${getGlow()}` : ''}
          `}
          style={{ width: `${percentage}%` }}
        />
        
        {/* Level markers */}
        {size === 'lg' && (
          <div className="absolute inset-0 flex">
            {[...Array(9)].map((_, i) => (
              <div
                key={i}
                className="flex-1 border-r border-dark-600/50 last:border-0"
              />
            ))}
          </div>
        )}
      </div>

      {/* Label */}
      {showLabel && (
        <div className="flex justify-between mt-1.5">
          <span className="text-xs text-dark-500">0</span>
          <span className={`text-xs font-medium ${
            clampedLevel >= 7 ? 'text-accent-400' : 'text-dark-400'
          }`}>
            {clampedLevel}/10
          </span>
          <span className="text-xs text-dark-500">10</span>
        </div>
      )}
    </div>
  )
}

/**
 * LevelBadge - Badge circulaire affichant le niveau
 */
export function LevelBadge({ level, size = 'md' }: { level: number; size?: 'sm' | 'md' | 'lg' }) {
  const clampedLevel = Math.max(0, Math.min(10, level))
  
  const getColors = () => {
    if (clampedLevel <= 2) return 'from-red-500 to-red-600 text-red-100'
    if (clampedLevel <= 4) return 'from-orange-500 to-orange-600 text-orange-100'
    if (clampedLevel <= 6) return 'from-yellow-500 to-yellow-600 text-yellow-100'
    if (clampedLevel <= 8) return 'from-green-500 to-green-600 text-green-100'
    return 'from-emerald-400 to-emerald-500 text-emerald-100'
  }

  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-lg',
  }

  return (
    <div
      className={`
        ${sizes[size]}
        rounded-full bg-gradient-to-br ${getColors()}
        flex items-center justify-center font-bold
        shadow-lg
      `}
    >
      {clampedLevel}
    </div>
  )
}

