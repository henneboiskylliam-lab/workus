import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  FileText, Search, Trash2, Eye, Edit2, 
  Filter, MoreVertical, CheckCircle, XCircle
} from 'lucide-react'
import { useContentManagement } from '../contexts/ContentManagementContext'
import { useAuth } from '../contexts/AuthContext'

/**
 * AdminContentPage - Gestion du contenu pour les administrateurs
 */
export function AdminContentPage() {
  const { user } = useAuth()
  const { contents, deleteContent, publishContent, archiveContent } = useContentManagement()
  
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'draft' | 'archived'>('all')
  const [selectedContent, setSelectedContent] = useState<string | null>(null)

  // Vérifier si admin
  if (!user || user.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Accès refusé</h2>
          <p className="text-dark-400">Vous devez être administrateur pour accéder à cette page.</p>
        </div>
      </div>
    )
  }

  // Filtrer les contenus
  const filteredContents = contents.filter(content => {
    const matchesSearch = content.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         content.authorName.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = filterStatus === 'all' || content.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const handleDelete = (id: string) => {
    if (window.confirm('Supprimer ce contenu ?')) {
      deleteContent(id)
    }
  }

  const handlePublish = (id: string) => {
    publishContent(id)
  }

  const handleArchive = (id: string) => {
    archiveContent(id)
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <FileText className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Gestion du contenu</h1>
            <p className="text-dark-400">{contents.length} contenus au total</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
          <input
            type="text"
            placeholder="Rechercher un contenu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-dark-800 border border-dark-700 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:border-purple-500"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-dark-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-4 py-3 bg-dark-800 border border-dark-700 rounded-xl text-white focus:outline-none focus:border-purple-500"
          >
            <option value="all">Tous les statuts</option>
            <option value="published">Publiés</option>
            <option value="draft">Brouillons</option>
            <option value="archived">Archivés</option>
          </select>
        </div>
      </div>

      {/* Content List */}
      <div className="space-y-4">
        {filteredContents.length === 0 ? (
          <div className="text-center py-12 bg-dark-800/50 border border-dark-700/50 rounded-2xl">
            <FileText className="w-12 h-12 text-dark-600 mx-auto mb-4" />
            <p className="text-dark-400">Aucun contenu trouvé</p>
          </div>
        ) : (
          filteredContents.map((content, index) => (
            <motion.div
              key={content.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="p-6 bg-dark-800/50 border border-dark-700/50 rounded-2xl hover:border-purple-500/30 transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      content.status === 'published' 
                        ? 'bg-green-500/20 text-green-400'
                        : content.status === 'draft'
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-dark-600 text-dark-400'
                    }`}>
                      {content.status === 'published' ? 'Publié' : 
                       content.status === 'draft' ? 'Brouillon' : 'Archivé'}
                    </span>
                    <span className="px-2 py-0.5 text-xs bg-purple-500/20 text-purple-400 rounded-full">
                      {content.type}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-medium text-white mb-1">{content.title}</h3>
                  <p className="text-sm text-dark-400 line-clamp-2 mb-2">{content.description}</p>
                  
                  <div className="flex items-center gap-4 text-sm text-dark-500">
                    <span>Par {content.authorName}</span>
                    <span>•</span>
                    <span>{content.views} vues</span>
                    <span>•</span>
                    <span>{content.likes.length} likes</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedContent(selectedContent === content.id ? null : content.id)}
                    className="p-2 text-dark-400 hover:text-white rounded-lg hover:bg-dark-700 transition-colors"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Actions Menu */}
              {selectedContent === content.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-4 pt-4 border-t border-dark-700 flex flex-wrap gap-2"
                >
                  <button className="flex items-center gap-2 px-4 py-2 bg-dark-700 text-dark-300 rounded-xl hover:text-white transition-colors">
                    <Eye className="w-4 h-4" />
                    Voir
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 bg-dark-700 text-dark-300 rounded-xl hover:text-white transition-colors">
                    <Edit2 className="w-4 h-4" />
                    Modifier
                  </button>
                  {content.status === 'draft' && (
                    <button 
                      onClick={() => handlePublish(content.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-400 rounded-xl hover:bg-green-500/30 transition-colors"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Publier
                    </button>
                  )}
                  {content.status === 'published' && (
                    <button 
                      onClick={() => handleArchive(content.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 text-amber-400 rounded-xl hover:bg-amber-500/30 transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                      Archiver
                    </button>
                  )}
                  <button 
                    onClick={() => handleDelete(content.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500/30 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Supprimer
                  </button>
                </motion.div>
              )}
            </motion.div>
          ))
        )}
      </div>
    </div>
  )
}


