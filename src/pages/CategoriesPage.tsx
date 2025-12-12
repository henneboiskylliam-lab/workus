import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Sparkles, Compass, FolderPlus, X, Save, Edit2 } from 'lucide-react'
import { CategoryCard } from '../components/ui'
import { useContentManagement, Category } from '../contexts/ContentManagementContext'
import { useAuth } from '../contexts/AuthContext'

const iconOptions = [
  '💻', '📊', '🎨', '💰', '🌍', '📈', '🎯', '🚀', '💡', '🔧',
  '📱', '🎬', '📚', '🎵', '🏋️', '🍳', '✈️', '🏠', '🔬', '⚖️'
]

/**
 * CategoriesPage - Page principale des catégories
 * Point d'entrée pour explorer ou obtenir des suggestions
 */
export function CategoriesPage() {
  const navigate = useNavigate()
  const { categories, getSpecialtiesByCategory, updateCategory, deleteCategory } = useContentManagement()
  const { user } = useAuth()

  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    icon: '💻',
  })

  const isAdmin = user?.role === 'admin'

  // Filtrer uniquement les catégories actives
  const activeCategories = categories.filter(c => c.isActive)

  // Ouvrir modal pour éditer une catégorie
  const handleEditCategory = (category: Category) => {
    setEditingCategory(category)
    setCategoryForm({
      name: category.name,
      description: category.description,
      icon: category.icon,
    })
    setShowCategoryModal(true)
  }

  // Supprimer une catégorie
  const handleDeleteCategory = (categoryId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette catégorie et toutes ses spécialités ?')) {
      deleteCategory(categoryId)
    }
  }

  // Sauvegarder les modifications de la catégorie
  const handleSaveCategory = () => {
    if (!categoryForm.name.trim() || !editingCategory) return
    updateCategory(editingCategory.id, categoryForm)
    setShowCategoryModal(false)
    setEditingCategory(null)
    setCategoryForm({ name: '', description: '', icon: '💻' })
  }

  // Fermer le modal catégorie
  const handleCloseCategoryModal = () => {
    setShowCategoryModal(false)
    setEditingCategory(null)
    setCategoryForm({ name: '', description: '', icon: '💻' })
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-12 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Catégories & Spécialités</h1>
          <p className="text-dark-400 text-lg">
            Explorez notre catalogue de compétences ou découvrez des suggestions personnalisées
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => navigate('/admin/content')}
            className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors"
          >
            <FolderPlus className="w-5 h-5" />
            Gérer
          </button>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid md:grid-cols-2 gap-6 mb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ y: -4 }}
          onClick={() => navigate('/categories/suggestions')}
          className="group relative overflow-hidden p-8 bg-gradient-to-br from-primary-500/10 to-cyan-500/10 border border-primary-500/20 rounded-3xl cursor-pointer hover:border-primary-500/40 transition-all"
        >
          <div className="absolute top-0 right-0 w-40 h-40 bg-primary-500/10 rounded-full blur-3xl" />
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-cyan-500 flex items-center justify-center mb-6 shadow-lg shadow-primary-500/20">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2 group-hover:text-primary-400 transition-colors">
              Suggestions pour vous
            </h2>
            <p className="text-dark-400 mb-6">
              Découvrez des compétences à travailler basées sur votre profil et votre progression
            </p>
            <span className="inline-flex items-center gap-2 text-primary-400 font-medium group-hover:gap-3 transition-all">
              Voir les suggestions <ArrowRight className="w-5 h-5" />
            </span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          whileHover={{ y: -4 }}
          onClick={() => navigate('/categories/explore')}
          className="group relative overflow-hidden p-8 bg-gradient-to-br from-secondary-500/10 to-pink-500/10 border border-secondary-500/20 rounded-3xl cursor-pointer hover:border-secondary-500/40 transition-all"
        >
          <div className="absolute top-0 right-0 w-40 h-40 bg-secondary-500/10 rounded-full blur-3xl" />
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-secondary-500 to-pink-500 flex items-center justify-center mb-6 shadow-lg shadow-secondary-500/20">
              <Compass className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2 group-hover:text-secondary-400 transition-colors">
              Explorer par catégorie
            </h2>
            <p className="text-dark-400 mb-6">
              Parcourez toutes nos catégories et découvrez de nouvelles spécialités
            </p>
            <span className="inline-flex items-center gap-2 text-secondary-400 font-medium group-hover:gap-3 transition-all">
              Explorer <ArrowRight className="w-5 h-5" />
            </span>
          </div>
        </motion.div>
      </div>

      {/* All categories grid */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-white mb-6">Toutes les catégories</h2>
        {activeCategories.length === 0 ? (
          <div className="text-center py-16 bg-dark-800/50 border border-dark-700/50 rounded-2xl">
            <FolderPlus className="w-16 h-16 text-dark-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Aucune catégorie</h3>
            <p className="text-dark-400 mb-6">
              {isAdmin 
                ? 'Créez votre première catégorie pour commencer'
                : 'Aucune catégorie n\'est disponible pour le moment'}
            </p>
            {isAdmin && (
              <button
                onClick={() => navigate('/admin/content')}
                className="px-6 py-3 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors"
              >
                Créer une catégorie
              </button>
            )}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {activeCategories.map((category, index) => {
              const categorySpecialties = getSpecialtiesByCategory(category.id).filter(s => s.isActive)
              return (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                >
                  <CategoryCard
                    name={category.name}
                    description={category.description}
                    icon={category.icon}
                    color={category.color}
                    gradient={category.gradient}
                    specialtiesCount={categorySpecialties.length}
                    onClick={() => navigate(`/categories/explore?category=${category.id}`)}
                    isAdmin={isAdmin}
                    onEdit={() => handleEditCategory(category)}
                    onDelete={() => handleDeleteCategory(category.id)}
                  />
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal édition catégorie */}
      <AnimatePresence>
        {showCategoryModal && editingCategory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={handleCloseCategoryModal}
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
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Edit2 className="w-5 h-5" />
                    Modifier la catégorie
                  </h3>
                  <button onClick={handleCloseCategoryModal} className="p-2 hover:bg-dark-700 rounded-lg">
                    <X className="w-5 h-5 text-dark-400" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-2">Nom *</label>
                    <input
                      type="text"
                      value={categoryForm.name}
                      onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Ex: Technologie"
                      className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:border-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-2">Description</label>
                    <textarea
                      value={categoryForm.description}
                      onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                      placeholder="Description de la catégorie..."
                      className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:border-primary-500 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-2">Icône</label>
                    <div className="flex flex-wrap gap-2">
                      {iconOptions.map(icon => (
                        <button
                          key={icon}
                          onClick={() => setCategoryForm(prev => ({ ...prev, icon }))}
                          className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-colors ${
                            categoryForm.icon === icon 
                              ? 'bg-primary-500 ring-2 ring-primary-400' 
                              : 'bg-dark-700 hover:bg-dark-600'
                          }`}
                        >
                          {icon}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={handleCloseCategoryModal}
                    className="flex-1 py-3 bg-dark-700 text-white rounded-xl hover:bg-dark-600 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleSaveCategory}
                    disabled={!categoryForm.name.trim()}
                    className="flex-1 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-semibold rounded-xl hover:shadow-lg disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                  >
                    <Save className="w-5 h-5" />
                    Enregistrer
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
