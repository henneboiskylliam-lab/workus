import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Target, Plus, Clock, Award, ChevronRight, FolderOpen } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useContentManagement } from '../contexts/ContentManagementContext'

/**
 * MySpecialtiesPage - Hub des spécialités de l'utilisateur
 */
export function MySpecialtiesPage() {
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  const { specialties, categories, getCategoryById } = useContentManagement()
  
  // Pour l'instant, toutes les spécialités actives sont affichées
  const activeSpecialties = specialties.filter(s => s.isActive)
  const activeCategories = categories.filter(c => c.isActive)

  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto text-center py-20">
        <Target className="w-16 h-16 text-dark-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">Connectez-vous</h1>
        <p className="text-dark-400 mb-6">Connectez-vous pour voir vos spécialités</p>
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
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-cyan-500 flex items-center justify-center">
            <Target className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Mes Spécialités</h1>
            <p className="text-dark-400">Gérez et suivez vos domaines d'expertise</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/categories/explore')}
          className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Explorer
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="p-4 bg-dark-800/50 border border-dark-700/50 rounded-xl text-center">
          <p className="text-2xl font-bold text-white">0</p>
          <p className="text-sm text-dark-400">Spécialités suivies</p>
        </div>
        <div className="p-4 bg-dark-800/50 border border-dark-700/50 rounded-xl text-center">
          <p className="text-2xl font-bold text-white">0h</p>
          <p className="text-sm text-dark-400">Temps d'apprentissage</p>
        </div>
        <div className="p-4 bg-dark-800/50 border border-dark-700/50 rounded-xl text-center">
          <p className="text-2xl font-bold text-white">0</p>
          <p className="text-sm text-dark-400">Contenus consultés</p>
        </div>
        <div className="p-4 bg-dark-800/50 border border-dark-700/50 rounded-xl text-center">
          <p className="text-2xl font-bold text-accent-400">0j</p>
          <p className="text-sm text-dark-400">Série actuelle</p>
        </div>
      </div>

      {/* Empty state ou liste */}
      {activeSpecialties.length === 0 ? (
        <div className="text-center py-16 bg-dark-800/50 border border-dark-700/50 rounded-2xl">
          <FolderOpen className="w-16 h-16 text-dark-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Aucune spécialité disponible</h3>
          <p className="text-dark-400 mb-6">
            Explorez les catégories pour découvrir des spécialités
          </p>
          <button
            onClick={() => navigate('/categories')}
            className="px-6 py-3 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors"
          >
            Explorer les catégories
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Spécialités par catégorie */}
          {activeCategories.map(category => {
            const categorySpecialties = activeSpecialties.filter(s => s.categoryId === category.id)
            if (categorySpecialties.length === 0) return null
            
            return (
              <div key={category.id} className="space-y-4">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <span className="text-xl">{category.icon}</span>
                  {category.name}
                </h2>
                
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categorySpecialties.map((specialty, index) => (
                    <motion.div
                      key={specialty.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => navigate(`/specialty/${specialty.slug}`)}
                      className="group p-4 bg-dark-800/50 border border-dark-700/50 rounded-xl cursor-pointer hover:border-primary-500/30 transition-all"
                    >
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${category.gradient} flex items-center justify-center text-2xl`}>
                          {specialty.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-white group-hover:text-primary-400 transition-colors truncate">
                            {specialty.name}
                          </h3>
                          <p className="text-sm text-dark-400 line-clamp-2 mt-1">
                            {specialty.description}
                          </p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-dark-500 group-hover:text-primary-400 group-hover:translate-x-1 transition-all" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}


