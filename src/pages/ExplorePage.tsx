import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Search, Filter, X, FolderOpen, Plus, Save, Edit2 } from 'lucide-react'
import { CategoryCard, SpecialtyCard } from '../components/ui'
import { useContentManagement, Specialty, Category } from '../contexts/ContentManagementContext'
import { useAuth } from '../contexts/AuthContext'

const iconOptions = [
  '💻', '📊', '🎨', '💰', '🌍', '📈', '🎯', '🚀', '💡', '🔧',
  '📱', '🎬', '📚', '🎵', '🏋️', '🍳', '✈️', '🏠', '🔬', '⚖️'
]

/**
 * ExplorePage - Exploration par catégorie
 * Permet de parcourir les catégories et spécialités
 */
export function ExplorePage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { categories, specialties, getSpecialtiesByCategory, getCategoryById, addSpecialty, updateSpecialty, deleteSpecialty, updateCategory, deleteCategory } = useContentManagement()
  
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    searchParams.get('category')
  )
  const [searchQuery, setSearchQuery] = useState('')
  const [showSpecialtyModal, setShowSpecialtyModal] = useState(false)
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [editingSpecialty, setEditingSpecialty] = useState<Specialty | null>(null)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [specialtyForm, setSpecialtyForm] = useState({
    name: '',
    slug: '',
    description: '',
    icon: '🎯',
    isActive: true,
  })
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    icon: '💻',
  })

  const isAdmin = user?.role === 'admin'

  // Ouvrir modal pour éditer une spécialité
  const handleEditSpecialty = (specialty: Specialty) => {
    setEditingSpecialty(specialty)
    setSpecialtyForm({
      name: specialty.name,
      slug: specialty.slug,
      description: specialty.description,
      icon: specialty.icon,
      isActive: specialty.isActive,
    })
    setShowSpecialtyModal(true)
  }

  // Supprimer une spécialité
  const handleDeleteSpecialty = (specialtyId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette spécialité ?')) {
      deleteSpecialty(specialtyId)
    }
  }

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

  // Générer un slug à partir du nom
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  // Filtrer uniquement les éléments actifs
  const activeCategories = categories.filter(c => c.isActive)
  const activeSpecialties = specialties.filter(s => s.isActive)

  const currentCategory = selectedCategory ? getCategoryById(selectedCategory) : null
  
  const filteredSpecialties = activeSpecialties.filter(s => {
    const matchesCategory = selectedCategory ? s.categoryId === selectedCategory : true
    const matchesSearch = searchQuery
      ? s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.description.toLowerCase().includes(searchQuery.toLowerCase())
      : true
    return matchesCategory && matchesSearch
  })

  // Créer ou modifier une spécialité
  const handleSaveSpecialty = () => {
    if (!specialtyForm.name.trim()) return

    const slug = specialtyForm.slug || generateSlug(specialtyForm.name)
    
    if (editingSpecialty) {
      // Mode édition
      updateSpecialty(editingSpecialty.id, { ...specialtyForm, slug })
    } else {
      // Mode création
      if (!selectedCategory) return
      addSpecialty({ 
        ...specialtyForm, 
        slug,
        categoryId: selectedCategory 
      })
    }
    
    setShowSpecialtyModal(false)
    setEditingSpecialty(null)
    setSpecialtyForm({
      name: '',
      slug: '',
      description: '',
      icon: '🎯',
      isActive: true,
    })
  }
  
  // Fermer le modal
  const handleCloseModal = () => {
    setShowSpecialtyModal(false)
    setEditingSpecialty(null)
    setSpecialtyForm({
      name: '',
      slug: '',
      description: '',
      icon: '🎯',
      isActive: true,
    })
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Explorer les spécialités</h1>
        <p className="text-dark-400">
          Parcourez notre catalogue et découvrez de nouvelles compétences
        </p>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher une spécialité..."
            className="w-full pl-12 pr-4 py-3 bg-dark-800 border border-dark-700 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:border-primary-500"
          />
        </div>
        <button className="flex items-center gap-2 px-5 py-3 bg-dark-800 border border-dark-700 rounded-xl text-dark-300 hover:text-white hover:border-dark-600 transition-all">
          <Filter className="w-5 h-5" />
          Filtres
        </button>
      </div>

      {/* Category filter chips */}
      {activeCategories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              !selectedCategory
                ? 'bg-primary-500 text-white'
                : 'bg-dark-800 text-dark-300 hover:text-white border border-dark-700'
            }`}
          >
            Toutes
          </button>
          {activeCategories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedCategory === cat.id
                  ? `bg-gradient-to-r ${cat.gradient} text-white`
                  : 'bg-dark-800 text-dark-300 hover:text-white border border-dark-700'
              }`}
            >
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Selected category header */}
      <AnimatePresence mode="wait">
        {currentCategory && (
          <motion.div
            key={currentCategory.id}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`mb-8 p-6 bg-gradient-to-br ${currentCategory.gradient} rounded-2xl relative overflow-hidden`}
          >
            <div className="absolute inset-0 bg-black/30" />
            <div className="relative flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">{currentCategory.icon} {currentCategory.name}</h2>
                <p className="text-white/80 max-w-2xl">{currentCategory.description}</p>
              </div>
              <div className="flex items-center gap-2">
                {isAdmin && (
                  <button
                    onClick={() => setShowSpecialtyModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-white/20 rounded-xl text-white hover:bg-white/30 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                    Ajouter une spécialité
                  </button>
                )}
                <button
                  onClick={() => setSelectedCategory(null)}
                  className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state */}
      {activeCategories.length === 0 && activeSpecialties.length === 0 && (
        <div className="text-center py-16 bg-dark-800/50 border border-dark-700/50 rounded-2xl">
          <FolderOpen className="w-16 h-16 text-dark-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Aucun contenu disponible</h3>
          <p className="text-dark-400">
            Les catégories et spécialités seront bientôt disponibles
          </p>
        </div>
      )}

      {/* Results */}
      {!selectedCategory && activeCategories.length > 0 ? (
        // Show categories when none selected
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeCategories.map((category, index) => {
            const categorySpecialties = getSpecialtiesByCategory(category.id).filter(s => s.isActive)
            return (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <CategoryCard
                  name={category.name}
                  description={category.description}
                  icon={category.icon}
                  color={category.color}
                  gradient={category.gradient}
                  specialtiesCount={categorySpecialties.length}
                  variant="large"
                  onClick={() => setSelectedCategory(category.id)}
                  isAdmin={isAdmin}
                  onEdit={() => handleEditCategory(category)}
                  onDelete={() => handleDeleteCategory(category.id)}
                />
              </motion.div>
            )
          })}
        </div>
      ) : selectedCategory ? (
        // Show specialties when category selected
        <div>
          <div className="flex items-center justify-between mb-6">
            <p className="text-dark-400">
              {filteredSpecialties.length} spécialité{filteredSpecialties.length > 1 ? 's' : ''} trouvée{filteredSpecialties.length > 1 ? 's' : ''}
            </p>
            {isAdmin && (
              <button
                onClick={() => setShowSpecialtyModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Ajouter une spécialité
              </button>
            )}
          </div>
          {filteredSpecialties.length === 0 ? (
            <div className="text-center py-12 bg-dark-800/50 border border-dark-700/50 rounded-2xl">
              <FolderOpen className="w-12 h-12 text-dark-600 mx-auto mb-4" />
              <p className="text-dark-400 mb-4">Aucune spécialité dans cette catégorie</p>
              {isAdmin && (
                <button
                  onClick={() => setShowSpecialtyModal(true)}
                  className="px-4 py-2 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors"
                >
                  Créer la première spécialité
                </button>
              )}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSpecialties.map((specialty, index) => (
                <motion.div
                  key={specialty.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <SpecialtyCard
                    name={specialty.name}
                    shortDescription={specialty.description}
                    icon={specialty.icon}
                    gradient={currentCategory?.gradient || 'from-primary-500 to-cyan-400'}
                    onClick={() => navigate(`/specialty/${specialty.slug}`)}
                    isAdmin={isAdmin}
                    onEdit={() => handleEditSpecialty(specialty)}
                    onDelete={() => handleDeleteSpecialty(specialty.id)}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      ) : null}

      {/* Modal création/édition spécialité */}
      <AnimatePresence>
        {showSpecialtyModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={handleCloseModal}
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
                    {editingSpecialty ? (
                      <>
                        <Edit2 className="w-5 h-5" />
                        Modifier la spécialité
                      </>
                    ) : (
                      <>Nouvelle spécialité {currentCategory && `dans ${currentCategory.name}`}</>
                    )}
                  </h3>
                  <button onClick={handleCloseModal} className="p-2 hover:bg-dark-700 rounded-lg">
                    <X className="w-5 h-5 text-dark-400" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-2">Nom *</label>
                    <input
                      type="text"
                      value={specialtyForm.name}
                      onChange={(e) => setSpecialtyForm(prev => ({ 
                        ...prev, 
                        name: e.target.value,
                        slug: editingSpecialty ? prev.slug : generateSlug(e.target.value)
                      }))}
                      placeholder="Ex: Développement Web"
                      className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:border-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-2">Description</label>
                    <textarea
                      value={specialtyForm.description}
                      onChange={(e) => setSpecialtyForm(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                      placeholder="Description de la spécialité..."
                      className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:border-primary-500 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-2">Icône</label>
                    <div className="flex flex-wrap gap-2">
                      {iconOptions.map(icon => (
                        <button
                          key={icon}
                          onClick={() => setSpecialtyForm(prev => ({ ...prev, icon }))}
                          className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-colors ${
                            specialtyForm.icon === icon 
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
                    onClick={handleCloseModal}
                    className="flex-1 py-3 bg-dark-700 text-white rounded-xl hover:bg-dark-600 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleSaveSpecialty}
                    disabled={!specialtyForm.name.trim()}
                    className="flex-1 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-semibold rounded-xl hover:shadow-lg disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                  >
                    <Save className="w-5 h-5" />
                    {editingSpecialty ? 'Enregistrer' : 'Créer'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
