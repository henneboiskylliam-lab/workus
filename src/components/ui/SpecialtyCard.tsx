import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, MoreVertical, Edit2, Trash2 } from 'lucide-react'

interface SpecialtyCardProps {
  name: string
  shortDescription: string
  icon: string
  gradient?: string
  onClick?: () => void
  // Props pour l'admin
  isAdmin?: boolean
  onEdit?: () => void
  onDelete?: () => void
}

/**
 * SpecialtyCard - Carte de spécialité simplifiée avec menu contextuel
 */
export function SpecialtyCard({
  name,
  shortDescription,
  icon,
  gradient = 'from-primary-500 to-cyan-400',
  onClick,
  isAdmin = false,
  onEdit,
  onDelete,
}: SpecialtyCardProps) {
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

  return (
    <motion.div
      whileHover={{ y: -4 }}
      onClick={onClick}
      className="group relative p-6 bg-dark-800/50 border border-dark-700/50 rounded-2xl cursor-pointer hover:border-primary-500/30 hover:shadow-lg hover:shadow-primary-500/5 transition-all"
    >
      {/* Menu 3 points pour admin */}
      {isAdmin && (
        <div ref={menuRef} className="absolute top-4 right-4 z-10">
          <button
            onClick={handleMenuClick}
            className="p-2 hover:bg-dark-700 rounded-lg text-dark-400 hover:text-white transition-colors"
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
                  <span>Modifier le nom</span>
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
      )}

      {/* Header */}
      <div className="flex items-start gap-4 mb-4">
        <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg flex-shrink-0 text-2xl`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0 pr-8">
          <h3 className="font-semibold text-lg text-white group-hover:text-primary-400 transition-colors">
            {name}
          </h3>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-dark-400 line-clamp-2 mb-4">
        {shortDescription}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-end pt-4 border-t border-dark-700/50">
        <ChevronRight className="w-5 h-5 text-dark-400 group-hover:text-primary-400 group-hover:translate-x-1 transition-all" />
      </div>
    </motion.div>
  )
}

/**
 * SpecialtyCardHorizontal - Version horizontale pour les listes avec menu contextuel
 */
export function SpecialtyCardHorizontal({
  name,
  shortDescription,
  icon,
  gradient = 'from-primary-500 to-cyan-400',
  onClick,
  isAdmin = false,
  onEdit,
  onDelete,
}: SpecialtyCardProps) {
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

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      onClick={onClick}
      className="relative flex items-center gap-4 p-4 bg-dark-800/50 border border-dark-700/50 rounded-xl cursor-pointer hover:border-primary-500/30 transition-all"
    >
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0 text-xl`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-white truncate">{name}</h4>
        <p className="text-sm text-dark-400 truncate">{shortDescription}</p>
      </div>
      
      {isAdmin ? (
        <div ref={menuRef} className="relative flex-shrink-0">
          <button
            onClick={handleMenuClick}
            className="p-2 hover:bg-dark-700 rounded-lg text-dark-400 hover:text-white transition-colors"
          >
            <MoreVertical className="w-5 h-5" />
          </button>

          <AnimatePresence>
            {showMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                className="absolute right-0 mt-2 w-48 bg-dark-800 border border-dark-700 rounded-xl shadow-xl overflow-hidden z-20"
              >
                <button
                  onClick={handleEdit}
                  className="flex items-center gap-3 w-full px-4 py-3 text-left text-dark-300 hover:bg-dark-700 hover:text-white transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                  <span>Modifier le nom</span>
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
      ) : (
        <ChevronRight className="w-5 h-5 text-dark-400 flex-shrink-0" />
      )}
    </motion.div>
  )
}
