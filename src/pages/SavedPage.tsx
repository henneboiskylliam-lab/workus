import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bookmark, Play, Book, Code, Folder, Search, MoreHorizontal, Trash2, X, Plus, Check, FolderPlus } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

type FilterType = 'all' | 'videos' | 'books' | 'exercises' | 'collections'

interface SavedItem {
  id: string
  type: 'video' | 'book' | 'exercise'
  title: string
  author: string
  savedAt: string
  thumbnail: string | null
}

interface Collection {
  id: string
  name: string
  itemsCount: number
  color: string
}

const initialSavedItems: SavedItem[] = []

const initialCollections: Collection[] = []

const typeConfig = {
  video: { icon: Play, color: 'from-red-500 to-pink-500' },
  book: { icon: Book, color: 'from-amber-500 to-orange-500' },
  exercise: { icon: Code, color: 'from-green-500 to-emerald-500' },
}

/**
 * SavedPage - Contenus enregistrés avec interactions fonctionnelles
 */
export function SavedPage() {
  const { isAuthenticated } = useAuth()
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [savedItems, setSavedItems] = useState<SavedItem[]>(initialSavedItems)
  const [collections, setCollections] = useState<Collection[]>(initialCollections)
  const [showToast, setShowToast] = useState<string | null>(null)
  const [showCreateCollection, setShowCreateCollection] = useState(false)
  const [newCollectionName, setNewCollectionName] = useState('')
  const [itemMenuOpen, setItemMenuOpen] = useState<string | null>(null)

  const filters = [
    { id: 'all', label: 'Tout', count: savedItems.length },
    { id: 'videos', label: 'Vidéos', count: savedItems.filter(i => i.type === 'video').length },
    { id: 'books', label: 'Livres', count: savedItems.filter(i => i.type === 'book').length },
    { id: 'exercises', label: 'Exercices', count: savedItems.filter(i => i.type === 'exercise').length },
    { id: 'collections', label: 'Collections', count: collections.length },
  ]

  // Filtrer les items
  const filteredItems = savedItems
    .filter(item => {
      if (activeFilter === 'all') return true
      if (activeFilter === 'videos') return item.type === 'video'
      if (activeFilter === 'books') return item.type === 'book'
      if (activeFilter === 'exercises') return item.type === 'exercise'
      return false
    })
    .filter(item =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.author.toLowerCase().includes(searchQuery.toLowerCase())
    )

  // Afficher une notification
  const showNotification = (message: string) => {
    setShowToast(message)
    setTimeout(() => setShowToast(null), 3000)
  }

  // Supprimer un item sauvegardé
  const handleRemoveItem = (itemId: string) => {
    const item = savedItems.find(i => i.id === itemId)
    if (item) {
      setSavedItems(prev => prev.filter(i => i.id !== itemId))
      showNotification(`"${item.title}" retiré des enregistrements`)
    }
    setItemMenuOpen(null)
  }

  // Créer une collection
  const handleCreateCollection = () => {
    if (!newCollectionName.trim()) return

    const colors = [
      'from-purple-500 to-pink-500',
      'from-green-500 to-teal-500',
      'from-blue-500 to-indigo-500',
      'from-red-500 to-orange-500',
    ]
    const randomColor = colors[Math.floor(Math.random() * colors.length)]

    const newCollection: Collection = {
      id: `c-${Date.now()}`,
      name: newCollectionName,
      itemsCount: 0,
      color: randomColor,
    }

    setCollections(prev => [...prev, newCollection])
    setNewCollectionName('')
    setShowCreateCollection(false)
    showNotification(`Collection "${newCollectionName}" créée`)
  }

  // Supprimer une collection
  const handleDeleteCollection = (collectionId: string) => {
    const collection = collections.find(c => c.id === collectionId)
    if (collection) {
      setCollections(prev => prev.filter(c => c.id !== collectionId))
      showNotification(`Collection "${collection.name}" supprimée`)
    }
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
            className="fixed top-20 right-4 z-50 flex items-center gap-2 px-4 py-3 bg-green-500 text-white rounded-xl shadow-lg"
          >
            <Check className="w-5 h-5" />
            {showToast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
          <Bookmark className="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Enregistrements</h1>
          <p className="text-dark-400">Retrouvez vos contenus sauvegardés</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Rechercher dans vos enregistrements..."
          className="w-full pl-12 pr-4 py-3 bg-dark-800 border border-dark-700 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:border-primary-500"
        />
        {searchQuery && (
          <button 
            onClick={() => setSearchQuery('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-dark-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex overflow-x-auto gap-2 mb-8 pb-2">
        {filters.map(filter => (
          <button
            key={filter.id}
            onClick={() => setActiveFilter(filter.id as FilterType)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all ${
              activeFilter === filter.id
                ? 'bg-primary-500 text-white'
                : 'bg-dark-800 text-dark-300 hover:text-white border border-dark-700'
            }`}
          >
            {filter.label}
            <span className={`px-2 py-0.5 text-xs rounded-full ${
              activeFilter === filter.id ? 'bg-white/20' : 'bg-dark-700'
            }`}>
              {filter.count}
            </span>
          </button>
        ))}
      </div>

      {/* Collections */}
      {(activeFilter === 'all' || activeFilter === 'collections') && (
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">Collections</h2>
            <button 
              onClick={() => setShowCreateCollection(true)}
              className="flex items-center gap-2 text-sm text-primary-400 hover:text-primary-300 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Créer une collection
            </button>
          </div>

          {/* Create collection modal */}
          <AnimatePresence>
            {showCreateCollection && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 p-4 bg-dark-800/50 border border-dark-700/50 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <FolderPlus className="w-5 h-5 text-primary-400" />
                  <input
                    type="text"
                    value={newCollectionName}
                    onChange={(e) => setNewCollectionName(e.target.value)}
                    placeholder="Nom de la collection..."
                    autoFocus
                    className="flex-1 bg-transparent text-white placeholder-dark-400 focus:outline-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCreateCollection()
                      if (e.key === 'Escape') setShowCreateCollection(false)
                    }}
                  />
                  <button
                    onClick={handleCreateCollection}
                    disabled={!newCollectionName.trim()}
                    className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Créer
                  </button>
                  <button
                    onClick={() => {
                      setShowCreateCollection(false)
                      setNewCollectionName('')
                    }}
                    className="p-2 text-dark-400 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid md:grid-cols-3 gap-4">
            {collections.map((collection, index) => (
              <motion.div
                key={collection.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group p-4 bg-dark-800/50 border border-dark-700/50 rounded-xl cursor-pointer hover:border-primary-500/30 transition-all relative"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${collection.color} flex items-center justify-center mb-3`}>
                  <Folder className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-medium text-white group-hover:text-primary-400 transition-colors">
                  {collection.name}
                </h3>
                <p className="text-sm text-dark-400">{collection.itemsCount} éléments</p>
                
                {/* Delete button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteCollection(collection.id)
                  }}
                  className="absolute top-3 right-3 p-2 text-dark-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Saved items */}
      {activeFilter !== 'collections' && (
        <section>
          <h2 className="text-lg font-bold text-white mb-4">
            {activeFilter === 'all' ? 'Tous les enregistrements' : 
             activeFilter === 'videos' ? 'Vidéos' :
             activeFilter === 'books' ? 'Livres' : 'Exercices'}
          </h2>
          
          {filteredItems.length === 0 ? (
            <div className="text-center py-12">
              <Bookmark className="w-16 h-16 text-dark-600 mx-auto mb-4" />
              <p className="text-dark-400">
                {searchQuery ? 'Aucun résultat trouvé' : 'Aucun contenu enregistré'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredItems.map((item, index) => {
                const config = typeConfig[item.type]
                const Icon = config.icon
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-4 p-4 bg-dark-800/50 border border-dark-700/50 rounded-xl hover:border-dark-600 transition-all group"
                  >
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${config.color} flex items-center justify-center flex-shrink-0`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-white truncate group-hover:text-primary-400 transition-colors cursor-pointer">
                        {item.title}
                      </h3>
                      <p className="text-sm text-dark-400">{item.author}</p>
                      <p className="text-xs text-dark-500">
                        Enregistré le {new Date(item.savedAt).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="p-2 text-dark-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                        title="Retirer des enregistrements"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                      <div className="relative">
                        <button 
                          onClick={() => setItemMenuOpen(itemMenuOpen === item.id ? null : item.id)}
                          className="p-2 text-dark-400 hover:text-white opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <MoreHorizontal className="w-5 h-5" />
                        </button>
                        
                        <AnimatePresence>
                          {itemMenuOpen === item.id && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              className="absolute right-0 mt-2 w-48 bg-dark-800 border border-dark-700 rounded-xl shadow-xl overflow-hidden z-10"
                            >
                              <button className="w-full px-4 py-2 text-left text-sm text-dark-300 hover:bg-dark-700 hover:text-white transition-colors">
                                Ajouter à une collection
                              </button>
                              <button className="w-full px-4 py-2 text-left text-sm text-dark-300 hover:bg-dark-700 hover:text-white transition-colors">
                                Partager
                              </button>
                              <button
                                onClick={() => handleRemoveItem(item.id)}
                                className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                              >
                                Retirer
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </section>
      )}

      {/* Click outside to close menu */}
      {itemMenuOpen && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => setItemMenuOpen(null)}
        />
      )}
    </div>
  )
}
