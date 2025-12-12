import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, MoreVertical, Edit2, Trash2 } from 'lucide-react'

interface CategoryCardProps {
  name: string
  description: string
  icon: string
  color: string
  gradient: string
  specialtiesCount?: number
  onClick?: () => void
  variant?: 'default' | 'large' | 'compact'
  // Props pour l'admin
  isAdmin?: boolean
  onEdit?: () => void
  onDelete?: () => void
}

/**
 * CategoryCard - Carte de catégorie avec menu contextuel
 */
export function CategoryCard({
  name,
  description,
  icon,
  gradient,
  specialtiesCount,
  onClick,
  variant = 'default',
  isAdmin = false,
  onEdit,
  onDelete,
}: CategoryCardProps) {
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Fermer le menu quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowMenu(!showMenu)
  }

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowMenu(false)
    onEdit?.()
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowMenu(false)
    onDelete?.()
  }

  // Menu contextuel
  const ContextMenu = () => (
    <div ref={menuRef} className="absolute top-4 right-4 z-10">
      <button
        onClick={handleMenuClick}
        className="p-2 hover:bg-dark-700/80 rounded-lg text-dark-400 hover:text-white transition-colors bg-dark-800/50"
      >
        <MoreVertical className="w-5 h-5" />
      </button>

      <AnimatePresence>
        {showMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className="absolute right-0 mt-2 w-48 bg-dark-800 border border-dark-700 rounded-xl shadow-xl overflow-hidden"
          >
            <button
              onClick={handleEdit}
              className="flex items-center gap-3 w-full px-4 py-3 text-left text-dark-300 hover:bg-dark-700 hover:text-white transition-colors"
            >
              <Edit2 className="w-4 h-4" />
              <span>Modifier</span>
            </button>
            <button
              onClick={handleDelete}
              className="flex items-center gap-3 w-full px-4 py-3 text-left text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Supprimer</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )

  if (variant === 'compact') {
    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className="relative flex items-center gap-4 p-4 bg-dark-800/50 border border-dark-700/50 rounded-xl cursor-pointer hover:border-primary-500/30 transition-all"
      >
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-2xl`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-white truncate">{name}</h4>
          {specialtiesCount !== undefined && (
            <p className="text-sm text-dark-400">{specialtiesCount} spécialités</p>
          )}
        </div>
        {isAdmin ? (
          <ContextMenu />
        ) : (
          <ChevronRight className="w-5 h-5 text-dark-400" />
        )}
      </motion.div>
    )
  }

  if (variant === 'large') {
    return (
      <motion.div
        whileHover={{ y: -8 }}
        onClick={onClick}
        className="group relative overflow-hidden p-8 bg-dark-800/50 border border-dark-700/50 rounded-3xl cursor-pointer hover:border-primary-500/30 transition-all"
      >
        {/* Menu admin */}
        {isAdmin && <ContextMenu />}

        {/* Background gradient */}
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-5 group-hover:opacity-10 transition-opacity`} />
        
        {/* Icon */}
        <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-6 shadow-xl group-hover:shadow-2xl transition-shadow text-4xl`}>
          {icon}
        </div>

        {/* Content */}
        <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-primary-400 transition-colors">
          {name}
        </h3>
        <p className="text-dark-400 mb-4 line-clamp-3">
          {description}
        </p>

        {/* Footer */}
        {specialtiesCount !== undefined && (
          <div className="flex items-center justify-between pt-4 border-t border-dark-700/50">
            <span className="text-sm text-dark-400">{specialtiesCount} spécialités</span>
            <span className="flex items-center gap-2 text-primary-400 group-hover:gap-3 transition-all">
              Explorer <ChevronRight className="w-4 h-4" />
            </span>
          </div>
        )}
      </motion.div>
    )
  }

  // Default variant
  return (
    <motion.div
      whileHover={{ y: -4 }}
      onClick={onClick}
      className="group relative p-6 bg-dark-800/50 border border-dark-700/50 rounded-2xl cursor-pointer hover:border-primary-500/30 hover:shadow-lg hover:shadow-primary-500/5 transition-all"
    >
      {/* Menu admin */}
      {isAdmin && <ContextMenu />}

      {/* Icon */}
      <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-4 shadow-lg text-2xl`}>
        {icon}
      </div>

      {/* Content */}
      <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-primary-400 transition-colors pr-8">
        {name}
      </h3>
      <p className="text-sm text-dark-400 line-clamp-2 mb-4">
        {description}
      </p>

      {/* Footer */}
      {specialtiesCount !== undefined && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-dark-500">{specialtiesCount} spécialités</span>
          <ChevronRight className="w-4 h-4 text-dark-400 group-hover:text-primary-400 group-hover:translate-x-1 transition-all" />
        </div>
      )}
    </motion.div>
  )
}
