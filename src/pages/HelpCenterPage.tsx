import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  HelpCircle, Search, Plus, MessageSquare, Clock, CheckCircle,
  X, Send, Trash2, ChevronDown, User, Shield
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useHelpCenter } from '../contexts/HelpCenterContext'

type TabType = 'all' | 'pending' | 'answered' | 'my-questions'

const categories = [
  'Compte & Profil',
  'Contenu & Publications',
  'Catégories & Spécialités',
  'Technique & Bugs',
  'Formations & Partenariats',
  'Autre'
]

/**
 * HelpCenterPage - Centre d'aide avec questions publiques
 */
export function HelpCenterPage() {
  const { user, isAuthenticated } = useAuth()
  const { 
    questions, 
    addQuestion, 
    answerQuestion, 
    deleteQuestion,
    getPublicQuestions,
    getPendingQuestions 
  } = useHelpCenter()

  const [activeTab, setActiveTab] = useState<TabType>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showAskModal, setShowAskModal] = useState(false)
  const [showAnswerModal, setShowAnswerModal] = useState<string | null>(null)
  const [newQuestion, setNewQuestion] = useState('')
  const [newCategory, setNewCategory] = useState(categories[0])
  const [newAnswer, setNewAnswer] = useState('')
  const [showToast, setShowToast] = useState<string | null>(null)
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null)

  const isAdmin = user?.role === 'admin' || user?.role === 'moderator'

  // Filtrer les questions selon l'onglet
  const getFilteredQuestions = () => {
    let filtered = questions

    switch (activeTab) {
      case 'pending':
        filtered = getPendingQuestions()
        break
      case 'answered':
        filtered = questions.filter(q => q.status === 'answered')
        break
      case 'my-questions':
        filtered = questions.filter(q => q.authorId === user?.id)
        break
      default:
        filtered = getPublicQuestions()
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(q => 
        q.question.toLowerCase().includes(query) ||
        q.answer?.toLowerCase().includes(query) ||
        q.category?.toLowerCase().includes(query)
      )
    }

    return filtered
  }

  const filteredQuestions = getFilteredQuestions()

  // Toast notification
  const showNotification = (message: string) => {
    setShowToast(message)
    setTimeout(() => setShowToast(null), 3000)
  }

  // Soumettre une question
  const handleSubmitQuestion = () => {
    if (!newQuestion.trim() || !user) return

    addQuestion({
      question: newQuestion,
      authorId: user.id,
      authorName: user.username,
      category: newCategory,
      isPublic: true
    })

    setNewQuestion('')
    setNewCategory(categories[0])
    setShowAskModal(false)
    showNotification('Question envoyée ! Un administrateur vous répondra bientôt.')
  }

  // Répondre à une question
  const handleAnswer = (questionId: string) => {
    if (!newAnswer.trim() || !user) return

    answerQuestion(questionId, newAnswer, user.username)
    setNewAnswer('')
    setShowAnswerModal(null)
    showNotification('Réponse publiée !')
  }

  // Supprimer une question
  const handleDelete = (questionId: string) => {
    if (window.confirm('Supprimer cette question ?')) {
      deleteQuestion(questionId)
      showNotification('Question supprimée')
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
            <HelpCircle className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Centre d'aide</h1>
            <p className="text-dark-400">Questions fréquentes et assistance</p>
          </div>
        </div>

        {isAuthenticated && (
          <button
            onClick={() => setShowAskModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl hover:shadow-lg hover:shadow-cyan-500/20 transition-all"
          >
            <Plus className="w-5 h-5" />
            Poser une question
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
        <input
          type="text"
          placeholder="Rechercher une question..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-dark-800 border border-dark-700 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:border-cyan-500"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {[
          { id: 'all', label: 'Toutes', count: getPublicQuestions().length },
          { id: 'answered', label: 'Répondues', count: questions.filter(q => q.status === 'answered').length },
          ...(isAdmin ? [{ id: 'pending', label: 'En attente', count: getPendingQuestions().length }] : []),
          ...(isAuthenticated ? [{ id: 'my-questions', label: 'Mes questions', count: questions.filter(q => q.authorId === user?.id).length }] : [])
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-cyan-500 text-white'
                : 'bg-dark-800 text-dark-300 hover:text-white border border-dark-700'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={`px-2 py-0.5 text-xs rounded-full ${
                activeTab === tab.id ? 'bg-white/20' : 'bg-dark-700'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        {filteredQuestions.length === 0 ? (
          <div className="text-center py-12 bg-dark-800/50 border border-dark-700/50 rounded-2xl">
            <HelpCircle className="w-12 h-12 text-dark-600 mx-auto mb-4" />
            <p className="text-dark-400">Aucune question trouvée</p>
            {isAuthenticated && (
              <button
                onClick={() => setShowAskModal(true)}
                className="mt-4 text-cyan-400 hover:text-cyan-300"
              >
                Poser la première question
              </button>
            )}
          </div>
        ) : (
          filteredQuestions.map((q, index) => (
            <motion.div
              key={q.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`p-6 bg-dark-800/50 border rounded-2xl ${
                q.status === 'answered' 
                  ? 'border-green-500/30' 
                  : 'border-dark-700/50'
              }`}
            >
              {/* Question Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {q.category && (
                      <span className="px-2 py-0.5 text-xs bg-cyan-500/20 text-cyan-400 rounded-full">
                        {q.category}
                      </span>
                    )}
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      q.status === 'answered' 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      {q.status === 'answered' ? 'Répondue' : 'En attente'}
                    </span>
                  </div>
                  <h3 
                    className="text-lg font-medium text-white cursor-pointer hover:text-cyan-400 transition-colors"
                    onClick={() => setExpandedQuestion(expandedQuestion === q.id ? null : q.id)}
                  >
                    {q.question}
                  </h3>
                  <div className="flex items-center gap-4 mt-2 text-sm text-dark-400">
                    <span className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {q.authorName}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {formatDate(q.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setExpandedQuestion(expandedQuestion === q.id ? null : q.id)}
                    className="p-2 text-dark-400 hover:text-white transition-colors"
                  >
                    <ChevronDown className={`w-5 h-5 transition-transform ${
                      expandedQuestion === q.id ? 'rotate-180' : ''
                    }`} />
                  </button>
                  {(isAdmin || q.authorId === user?.id) && (
                    <button
                      onClick={() => handleDelete(q.id)}
                      className="p-2 text-dark-400 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Answer Section */}
              <AnimatePresence>
                {expandedQuestion === q.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    {q.answer ? (
                      <div className="mt-4 pt-4 border-t border-dark-700">
                        <div className="flex items-center gap-2 mb-2">
                          <Shield className="w-4 h-4 text-green-400" />
                          <span className="text-sm text-green-400">
                            Réponse de {q.answeredBy}
                          </span>
                          {q.answeredAt && (
                            <span className="text-xs text-dark-500">
                              • {formatDate(q.answeredAt)}
                            </span>
                          )}
                        </div>
                        <p className="text-dark-300 whitespace-pre-wrap">{q.answer}</p>
                      </div>
                    ) : isAdmin ? (
                      <div className="mt-4 pt-4 border-t border-dark-700">
                        <button
                          onClick={() => setShowAnswerModal(q.id)}
                          className="flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-400 rounded-xl hover:bg-green-500/30 transition-colors"
                        >
                          <MessageSquare className="w-4 h-4" />
                          Répondre
                        </button>
                      </div>
                    ) : (
                      <div className="mt-4 pt-4 border-t border-dark-700">
                        <p className="text-dark-500 italic">En attente de réponse...</p>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))
        )}
      </div>

      {/* Modal Poser une question */}
      <AnimatePresence>
        {showAskModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={() => setShowAskModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-dark-800 border border-dark-700 rounded-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-dark-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white">Poser une question</h3>
                  <button
                    onClick={() => setShowAskModal(false)}
                    className="p-2 text-dark-400 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">
                    Catégorie
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">
                    Votre question
                  </label>
                  <textarea
                    value={newQuestion}
                    onChange={(e) => setNewQuestion(e.target.value)}
                    placeholder="Décrivez votre question en détail..."
                    rows={4}
                    className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:border-cyan-500 resize-none"
                  />
                </div>
              </div>

              <div className="p-6 border-t border-dark-700 flex justify-end gap-3">
                <button
                  onClick={() => setShowAskModal(false)}
                  className="px-4 py-2 bg-dark-700 text-dark-300 rounded-xl hover:text-white transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSubmitQuestion}
                  disabled={!newQuestion.trim()}
                  className="flex items-center gap-2 px-4 py-2 bg-cyan-500 text-white rounded-xl hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-4 h-4" />
                  Envoyer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Répondre */}
      <AnimatePresence>
        {showAnswerModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={() => setShowAnswerModal(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-dark-800 border border-dark-700 rounded-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-dark-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white">Répondre à la question</h3>
                  <button
                    onClick={() => setShowAnswerModal(null)}
                    className="p-2 text-dark-400 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="mb-4 p-4 bg-dark-700/50 rounded-xl">
                  <p className="text-dark-300">
                    {questions.find(q => q.id === showAnswerModal)?.question}
                  </p>
                </div>

                <label className="block text-sm font-medium text-dark-300 mb-2">
                  Votre réponse
                </label>
                <textarea
                  value={newAnswer}
                  onChange={(e) => setNewAnswer(e.target.value)}
                  placeholder="Rédigez votre réponse..."
                  rows={4}
                  className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:border-green-500 resize-none"
                />
              </div>

              <div className="p-6 border-t border-dark-700 flex justify-end gap-3">
                <button
                  onClick={() => setShowAnswerModal(null)}
                  className="px-4 py-2 bg-dark-700 text-dark-300 rounded-xl hover:text-white transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={() => handleAnswer(showAnswerModal)}
                  disabled={!newAnswer.trim()}
                  className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  Publier la réponse
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 right-6 z-50 px-4 py-3 bg-green-500/20 border border-green-500/30 text-green-400 rounded-xl flex items-center gap-2"
          >
            <CheckCircle className="w-5 h-5" />
            {showToast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

