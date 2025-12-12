import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Sparkles, TrendingUp, Target, FolderOpen, Plus, X, Save } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useUserData } from '../contexts/UserDataContext'
import { useContentManagement } from '../contexts/ContentManagementContext'

const gradientOptions = [
  { value: 'from-blue-500 to-cyan-500', label: 'Bleu Cyan' },
  { value: 'from-purple-500 to-pink-500', label: 'Violet Rose' },
  { value: 'from-green-500 to-emerald-500', label: 'Vert Émeraude' },
  { value: 'from-orange-500 to-red-500', label: 'Orange Rouge' },
  { value: 'from-amber-500 to-yellow-500', label: 'Ambre Jaune' },
  { value: 'from-indigo-500 to-purple-500', label: 'Indigo Violet' },
  { value: 'from-pink-500 to-rose-500', label: 'Rose' },
  { value: 'from-teal-500 to-cyan-500', label: 'Teal Cyan' },
]

const iconOptions = [
  '💻', '📊', '🎨', '💰', '🌍', '📈', '🎯', '🚀', '💡', '🔧',
  '📱', '🎬', '📚', '🎵', '🏋️', '🍳', '✈️', '🏠', '🔬', '⚖️'
]

/**
 * SuggestionsPage - Suggestions personnalisées de compétences
 * Basées sur les compétences déjà travaillées par l'utilisateur
 */
export function SuggestionsPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data } = useUserData()
  const { categories, specialties, getCategoryById, addCategory } = useContentManagement()

  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    slug: '',
    description: '',
    icon: '💻',
    color: 'blue',
    gradient: 'from-blue-500 to-cyan-500',
    isActive: true,
  })

  const isAdmin = user?.role === 'admin'

  // Générer un slug à partir du nom
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  // Convertir skillProgress (objet) en tableau pour les calculs
  const skillProgressArray = Object.values(data.skillProgress || {})

  // Statistiques utilisateur
  const userStats = {
    totalHoursLearned: skillProgressArray.reduce((sum, s) => sum + (s.hoursWorked || 0), 0),
    skillsWorkedOn: skillProgressArray.length,
    exercisesCompleted: skillProgressArray.reduce((sum, s) => sum + (s.exercisesCompleted || 0), 0),
    currentStreak: 0,
  }

  // Spécialités actives
  const activeSpecialties = specialties.filter(s => s.isActive)
  const activeCategories = categories.filter(c => c.isActive)

  // Spécialités suggérées (celles non commencées)
  const workedSpecialtyIds = skillProgressArray.map(s => s.skillId)
  const suggestedSpecialties = activeSpecialties.filter(s => !workedSpecialtyIds.includes(s.id)).slice(0, 4)

  // Créer une catégorie
  const handleCreateCategory = () => {
    if (!categoryForm.name.trim()) return

    const slug = categoryForm.slug || generateSlug(categoryForm.name)
    addCategory({ ...categoryForm, slug })
    setShowCategoryModal(false)
    setCategoryForm({
      name: '',
      slug: '',
      description: '',
      icon: '💻',
      color: 'blue',
      gradient: 'from-blue-500 to-cyan-500',
      isActive: true,
    })
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-cyan-500 flex items-center justify-center">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Suggestions pour vous</h1>
            <p className="text-dark-400">Basées sur vos compétences et votre progression</p>
          </div>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowCategoryModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Ajouter une catégorie
          </button>
        )}
      </div>

      {/* Stats banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10 p-6 bg-dark-800/50 border border-dark-700/50 rounded-2xl"
      >
        <div className="text-center">
          <p className="text-3xl font-bold text-white">{userStats.totalHoursLearned}h</p>
          <p className="text-sm text-dark-400">Heures d'apprentissage</p>
        </div>
        <div className="text-center">
          <p className="text-3xl font-bold text-white">{userStats.skillsWorkedOn}</p>
          <p className="text-sm text-dark-400">Compétences travaillées</p>
        </div>
        <div className="text-center">
          <p className="text-3xl font-bold text-white">{userStats.exercisesCompleted}</p>
          <p className="text-sm text-dark-400">Exercices complétés</p>
        </div>
        <div className="text-center">
          <p className="text-3xl font-bold text-accent-400 flex items-center justify-center gap-1">
            <TrendingUp className="w-5 h-5" />
            {userStats.currentStreak}j
          </p>
          <p className="text-sm text-dark-400">Série actuelle</p>
        </div>
      </motion.div>

      {/* Empty state ou contenu */}
      {activeCategories.length === 0 ? (
        <div className="text-center py-16 bg-dark-800/50 border border-dark-700/50 rounded-2xl">
          <FolderOpen className="w-16 h-16 text-dark-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Aucune catégorie disponible</h3>
          <p className="text-dark-400 mb-6">
            {isAdmin 
              ? 'Créez votre première catégorie pour commencer'
              : 'Les catégories seront disponibles bientôt'}
          </p>
          {isAdmin && (
            <button
              onClick={() => setShowCategoryModal(true)}
              className="px-6 py-3 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors"
            >
              Créer une catégorie
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Suggested specialties section */}
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Spécialités recommandées</h2>
              <button 
                onClick={() => navigate('/categories/explore')}
                className="text-sm text-primary-400 hover:text-primary-300"
              >
                Voir tout
              </button>
            </div>
            
            {suggestedSpecialties.length === 0 ? (
              <div className="text-center py-8 bg-dark-800/30 rounded-xl">
                <Target className="w-12 h-12 text-dark-600 mx-auto mb-3" />
                <p className="text-dark-400">
                  {activeSpecialties.length === 0 
                    ? 'Aucune spécialité disponible pour le moment'
                    : 'Vous avez commencé toutes les spécialités disponibles !'}
                </p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {suggestedSpecialties.map((specialty, index) => {
                  const category = getCategoryById(specialty.categoryId)
                  return (
                    <motion.div
                      key={specialty.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-4 bg-dark-800/50 border border-dark-700/50 rounded-xl hover:border-primary-500/30 transition-all cursor-pointer"
                      onClick={() => navigate(`/specialty/${specialty.slug}`)}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${category?.gradient || 'from-primary-500 to-cyan-500'} flex items-center justify-center text-2xl`}>
                          {specialty.icon}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-white mb-1">{specialty.name}</h3>
                          <p className="text-sm text-dark-400 line-clamp-2">{specialty.description}</p>
                          {category && (
                            <p className="text-xs text-dark-500 mt-2">{category.name}</p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </section>

          {/* Categories section */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Explorer par catégorie</h2>
              {isAdmin && (
                <button
                  onClick={() => setShowCategoryModal(true)}
                  className="flex items-center gap-1 text-sm text-primary-400 hover:text-primary-300"
                >
                  <Plus className="w-4 h-4" />
                  Ajouter
                </button>
              )}
            </div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeCategories.map((category, index) => {
                const categorySpecialties = specialties.filter(s => s.categoryId === category.id && s.isActive)
                return (
                  <motion.div
                    key={category.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + index * 0.05 }}
                    className={`p-4 bg-gradient-to-br ${category.gradient} rounded-xl cursor-pointer hover:scale-[1.02] transition-transform`}
                    onClick={() => navigate(`/categories/explore?category=${category.id}`)}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-3xl">{category.icon}</span>
                      <div>
                        <h3 className="font-semibold text-white">{category.name}</h3>
                        <p className="text-sm text-white/70">{categorySpecialties.length} spécialités</p>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </section>
        </>
      )}

      {/* Modal création catégorie */}
      <AnimatePresence>
        {showCategoryModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowCategoryModal(false)}
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
                  <h3 className="text-xl font-bold text-white">Nouvelle catégorie</h3>
                  <button onClick={() => setShowCategoryModal(false)} className="p-2 hover:bg-dark-700 rounded-lg">
                    <X className="w-5 h-5 text-dark-400" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-2">Nom *</label>
                    <input
                      type="text"
                      value={categoryForm.name}
                      onChange={(e) => setCategoryForm(prev => ({ 
                        ...prev, 
                        name: e.target.value,
                        slug: generateSlug(e.target.value)
                      }))}
                      placeholder="Ex: Technologie & Développement"
                      className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:border-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-2">Description</label>
                    <textarea
                      value={categoryForm.description}
                      onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                      rows={2}
                      placeholder="Description courte..."
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

                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-2">Couleur</label>
                    <div className="flex flex-wrap gap-2">
                      {gradientOptions.map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => setCategoryForm(prev => ({ ...prev, gradient: opt.value }))}
                          className={`w-10 h-10 rounded-lg bg-gradient-to-br ${opt.value} transition-transform ${
                            categoryForm.gradient === opt.value ? 'ring-2 ring-white scale-110' : ''
                          }`}
                          title={opt.label}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowCategoryModal(false)}
                    className="flex-1 py-3 bg-dark-700 text-white rounded-xl hover:bg-dark-600 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleCreateCategory}
                    disabled={!categoryForm.name.trim()}
                    className="flex-1 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-semibold rounded-xl hover:shadow-lg disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                  >
                    <Save className="w-5 h-5" />
                    Créer
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
