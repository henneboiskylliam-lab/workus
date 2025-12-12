import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  PlusCircle, Video, FileText, Code, HelpCircle, 
  Upload, Image, Link2, Bold, Italic, List, X, Send, Check, ArrowLeft
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useContentManagement } from '../contexts/ContentManagementContext'

type ContentType = 'article' | 'video' | 'exercise' | 'quiz'

const contentTypes = [
  { id: 'article', label: 'Article', icon: FileText, description: 'Partagez vos connaissances en écrivant' },
  { id: 'video', label: 'Vidéo', icon: Video, description: 'Créez du contenu vidéo éducatif' },
  { id: 'exercise', label: 'Exercice', icon: Code, description: 'Proposez des exercices pratiques' },
  { id: 'quiz', label: 'Quiz', icon: HelpCircle, description: 'Testez les connaissances' },
]

interface Draft {
  id: string
  type: ContentType
  title: string
  lastEdited: string
}

/**
 * CreatePage - Création de contenu avec fonctionnalités complètes
 */
export function CreatePage() {
  const navigate = useNavigate()
  const { user, isAuthenticated, hasPermission } = useAuth()
  const { categories, specialties, getSpecialtiesByCategory } = useContentManagement()
  
  const [selectedType, setSelectedType] = useState<ContentType | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('')
  const [specialty, setSpecialty] = useState('')
  const [tags, setTags] = useState('')
  
  // Spécialités filtrées par catégorie
  const filteredSpecialties = category ? getSpecialtiesByCategory(category) : []
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showToast, setShowToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  
  // Brouillons sauvegardés
  const [drafts, setDrafts] = useState<Draft[]>([])

  // Vérifier les permissions
  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto text-center py-20">
        <PlusCircle className="w-16 h-16 text-dark-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">Connexion requise</h1>
        <p className="text-dark-400 mb-6">Connectez-vous pour créer du contenu</p>
        <button
          onClick={() => navigate('/login')}
          className="px-6 py-3 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors"
        >
          Se connecter
        </button>
      </div>
    )
  }

  if (!hasPermission('canCreateContent')) {
    return (
      <div className="max-w-4xl mx-auto text-center py-20">
        <PlusCircle className="w-16 h-16 text-dark-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">Accès limité</h1>
        <p className="text-dark-400 mb-6">Vous devez être créateur pour publier du contenu</p>
        <button
          onClick={() => navigate('/profile')}
          className="px-6 py-3 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors"
        >
          Voir mon profil
        </button>
      </div>
    )
  }

  // Afficher une notification
  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setShowToast({ message, type })
    setTimeout(() => setShowToast(null), 3000)
  }

  // Sauvegarder en brouillon
  const handleSaveDraft = () => {
    if (!title.trim()) {
      showNotification('Ajoutez un titre pour sauvegarder', 'error')
      return
    }

    const newDraft: Draft = {
      id: `d-${Date.now()}`,
      type: selectedType!,
      title: title,
      lastEdited: new Date().toISOString().split('T')[0],
    }

    setDrafts(prev => [newDraft, ...prev])
    showNotification('Brouillon sauvegardé')
  }

  // Publier le contenu
  const handlePublish = async () => {
    if (!title.trim() || !content.trim()) {
      showNotification('Veuillez remplir tous les champs obligatoires', 'error')
      return
    }

    if (!category) {
      showNotification('Veuillez sélectionner une catégorie', 'error')
      return
    }

    setIsSubmitting(true)
    
    // Simuler l'envoi
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    setIsSubmitting(false)
    showNotification('Contenu publié avec succès !')
    
    // Réinitialiser le formulaire
    setTimeout(() => {
      setSelectedType(null)
      setTitle('')
      setContent('')
      setCategory('')
      setTags('')
    }, 1500)
  }

  // Supprimer un brouillon
  const handleDeleteDraft = (draftId: string) => {
    setDrafts(prev => prev.filter(d => d.id !== draftId))
    showNotification('Brouillon supprimé')
  }

  // Charger un brouillon
  const handleLoadDraft = (draft: Draft) => {
    setSelectedType(draft.type)
    setTitle(draft.title)
    showNotification('Brouillon chargé')
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Toast notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className={`fixed top-20 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg ${
              showToast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
            } text-white`}
          >
            <Check className="w-5 h-5" />
            {showToast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
          <PlusCircle className="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Créer du contenu</h1>
          <p className="text-dark-400">Partagez vos connaissances avec la communauté</p>
        </div>
      </div>

      {!selectedType ? (
        // Content type selection
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-lg font-semibold text-white mb-6">Que souhaitez-vous créer ?</h2>
          <div className="grid md:grid-cols-2 gap-4 mb-8">
            {contentTypes.map((type, index) => {
              const Icon = type.icon
              return (
                <motion.button
                  key={type.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => setSelectedType(type.id as ContentType)}
                  className="group p-6 bg-dark-800/50 border border-dark-700/50 rounded-2xl text-left hover:border-primary-500/30 transition-all"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-white mb-1 group-hover:text-primary-400 transition-colors">
                    {type.label}
                  </h3>
                  <p className="text-sm text-dark-400">{type.description}</p>
                </motion.button>
              )
            })}
          </div>

          {/* Drafts */}
          {drafts.length > 0 && (
            <div className="mt-8">
              <h2 className="text-lg font-semibold text-white mb-4">Brouillons</h2>
              <div className="space-y-3">
                {drafts.map(draft => {
                  const typeInfo = contentTypes.find(t => t.id === draft.type)
                  const Icon = typeInfo?.icon || FileText
                  return (
                    <motion.div
                      key={draft.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between p-4 bg-dark-800/50 border border-dark-700/50 rounded-xl group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-dark-700 flex items-center justify-center">
                          <Icon className="w-5 h-5 text-dark-400" />
                        </div>
                        <div>
                          <p className="font-medium text-white">{draft.title}</p>
                          <p className="text-sm text-dark-400">
                            {typeInfo?.label} • Modifié le {new Date(draft.lastEdited).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleLoadDraft(draft)}
                          className="px-4 py-2 bg-primary-500/10 text-primary-400 rounded-lg hover:bg-primary-500/20 transition-colors"
                        >
                          Continuer
                        </button>
                        <button
                          onClick={() => handleDeleteDraft(draft.id)}
                          className="p-2 text-dark-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          )}
        </motion.div>
      ) : (
        // Content editor
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Back button */}
          <button
            onClick={() => setSelectedType(null)}
            className="flex items-center gap-2 mb-6 text-dark-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Retour
          </button>

          {/* Preview toggle */}
          <div className="flex items-center justify-end gap-2 mb-4">
            <span className="text-sm text-dark-400">Prévisualiser</span>
            <button
              onClick={() => setShowPreview(!showPreview)}
              className={`w-12 h-7 rounded-full transition-colors ${
                showPreview ? 'bg-primary-500' : 'bg-dark-600'
              }`}
            >
              <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
                showPreview ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>

          <div className={showPreview ? 'grid lg:grid-cols-2 gap-6' : ''}>
            {/* Editor */}
            <div className={showPreview ? '' : ''}>
              {/* Title */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-dark-300 mb-2">
                  Titre *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Donnez un titre accrocheur..."
                  className="w-full px-4 py-3 bg-dark-800 border border-dark-700 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:border-primary-500 text-lg"
                />
              </div>

              {/* Toolbar */}
              <div className="flex items-center gap-2 mb-4 p-2 bg-dark-800 border border-dark-700 rounded-xl">
                <button 
                  onClick={() => setContent(prev => prev + '**texte en gras**')}
                  className="p-2 text-dark-400 hover:text-white hover:bg-dark-700 rounded-lg transition-colors"
                  title="Gras"
                >
                  <Bold className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => setContent(prev => prev + '*texte en italique*')}
                  className="p-2 text-dark-400 hover:text-white hover:bg-dark-700 rounded-lg transition-colors"
                  title="Italique"
                >
                  <Italic className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => setContent(prev => prev + '\n- Élément de liste')}
                  className="p-2 text-dark-400 hover:text-white hover:bg-dark-700 rounded-lg transition-colors"
                  title="Liste"
                >
                  <List className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => setContent(prev => prev + '[texte du lien](url)')}
                  className="p-2 text-dark-400 hover:text-white hover:bg-dark-700 rounded-lg transition-colors"
                  title="Lien"
                >
                  <Link2 className="w-5 h-5" />
                </button>
                <button 
                  className="p-2 text-dark-400 hover:text-white hover:bg-dark-700 rounded-lg transition-colors"
                  title="Image"
                >
                  <Image className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => setContent(prev => prev + '\n```\ncode ici\n```')}
                  className="p-2 text-dark-400 hover:text-white hover:bg-dark-700 rounded-lg transition-colors"
                  title="Code"
                >
                  <Code className="w-5 h-5" />
                </button>
              </div>

              {/* Content area */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-dark-300 mb-2">
                  Contenu *
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Commencez à écrire votre contenu... (Markdown supporté)"
                  rows={12}
                  className="w-full px-4 py-3 bg-dark-800 border border-dark-700 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:border-primary-500 resize-none font-mono"
                />
              </div>

              {/* Media upload for videos */}
              {selectedType === 'video' && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-dark-300 mb-2">
                    Vidéo
                  </label>
                  <div className="border-2 border-dashed border-dark-700 rounded-xl p-8 text-center hover:border-primary-500/50 transition-colors cursor-pointer">
                    <Upload className="w-12 h-12 text-dark-500 mx-auto mb-4" />
                    <p className="text-dark-400 mb-2">Glissez votre vidéo ici ou cliquez pour parcourir</p>
                    <p className="text-sm text-dark-500">MP4, WebM jusqu'à 500MB</p>
                  </div>
                </div>
              )}

              {/* Category & Specialty */}
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">
                    Catégorie *
                  </label>
                  <select 
                    value={category}
                    onChange={(e) => {
                      setCategory(e.target.value)
                      setSpecialty('')
                    }}
                    className="w-full px-4 py-3 bg-dark-800 border border-dark-700 rounded-xl text-white focus:outline-none focus:border-primary-500"
                  >
                    <option value="">Sélectionner une catégorie</option>
                    {categories.filter(c => c.isActive).map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">
                    Spécialité
                  </label>
                  <select 
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    disabled={!category}
                    className="w-full px-4 py-3 bg-dark-800 border border-dark-700 rounded-xl text-white focus:outline-none focus:border-primary-500 disabled:opacity-50"
                  >
                    <option value="">Sélectionner une spécialité</option>
                    {filteredSpecialties.filter(s => s.isActive).map(spec => (
                      <option key={spec.id} value={spec.id}>{spec.icon} {spec.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* Tags */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-dark-300 mb-2">
                  Tags (séparés par des virgules)
                </label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="React, TypeScript, Frontend..."
                  className="w-full px-4 py-3 bg-dark-800 border border-dark-700 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:border-primary-500"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-6 border-t border-dark-700">
                <button 
                  onClick={handleSaveDraft}
                  className="px-6 py-3 bg-dark-800 text-dark-300 rounded-xl hover:text-white hover:bg-dark-700 transition-all"
                >
                  Enregistrer le brouillon
                </button>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setShowPreview(!showPreview)}
                    className="px-6 py-3 bg-dark-700 text-white rounded-xl hover:bg-dark-600 transition-all"
                  >
                    {showPreview ? 'Masquer aperçu' : 'Prévisualiser'}
                  </button>
                  <button 
                    onClick={handlePublish}
                    disabled={isSubmitting}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-primary-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {isSubmitting ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Publier
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Preview */}
            {showPreview && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-6 bg-dark-800/50 border border-dark-700/50 rounded-2xl"
              >
                <h3 className="text-sm font-medium text-dark-400 mb-4">Aperçu</h3>
                <div className="prose prose-invert max-w-none">
                  <h1 className="text-2xl font-bold text-white mb-4">
                    {title || 'Titre de votre contenu'}
                  </h1>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-400 to-accent-600 flex items-center justify-center text-white text-sm font-bold">
                      {user?.username[0].toUpperCase()}
                    </div>
                    <span className="text-dark-400">{user?.username}</span>
                  </div>
                  <div className="text-dark-300 whitespace-pre-wrap">
                    {content || 'Le contenu apparaîtra ici...'}
                  </div>
                  {tags && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {tags.split(',').map((tag, i) => (
                        <span key={i} className="px-2 py-1 bg-dark-700 text-dark-300 rounded text-sm">
                          {tag.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  )
}
