import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Flag, Search, CheckCircle, XCircle, Clock, 
  Eye, Trash2, Filter, AlertTriangle
} from 'lucide-react'
import { useReports } from '../contexts/ReportsContext'
import { useAuth } from '../contexts/AuthContext'

type StatusFilter = 'all' | 'pending' | 'reviewed' | 'resolved' | 'dismissed'

/**
 * ReportsPage - Page de gestion des signalements pour les administrateurs
 */
export function ReportsPage() {
  const { user } = useAuth()
  const { reports, updateReportStatus, deleteReport } = useReports()
  
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending')
  const [selectedReport, setSelectedReport] = useState<string | null>(null)

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

  // Filtrer les signalements
  const filteredReports = reports.filter(report => {
    const matchesSearch = report.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         report.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || report.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-2 py-0.5 text-xs bg-amber-500/20 text-amber-400 rounded-full flex items-center gap-1"><Clock className="w-3 h-3" /> En attente</span>
      case 'reviewed':
        return <span className="px-2 py-0.5 text-xs bg-blue-500/20 text-blue-400 rounded-full flex items-center gap-1"><Eye className="w-3 h-3" /> En cours</span>
      case 'resolved':
        return <span className="px-2 py-0.5 text-xs bg-green-500/20 text-green-400 rounded-full flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Résolu</span>
      case 'dismissed':
        return <span className="px-2 py-0.5 text-xs bg-dark-600 text-dark-400 rounded-full flex items-center gap-1"><XCircle className="w-3 h-3" /> Rejeté</span>
      default:
        return null
    }
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const pendingCount = reports.filter(r => r.status === 'pending').length

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
            <Flag className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Signalements</h1>
            <p className="text-dark-400">
              {pendingCount > 0 ? (
                <span className="text-amber-400">{pendingCount} en attente de traitement</span>
              ) : (
                'Aucun signalement en attente'
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
          <input
            type="text"
            placeholder="Rechercher un signalement..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-dark-800 border border-dark-700 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:border-red-500"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-dark-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="px-4 py-3 bg-dark-800 border border-dark-700 rounded-xl text-white focus:outline-none focus:border-red-500"
          >
            <option value="all">Tous les statuts</option>
            <option value="pending">En attente</option>
            <option value="reviewed">En cours</option>
            <option value="resolved">Résolus</option>
            <option value="dismissed">Rejetés</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'En attente', count: reports.filter(r => r.status === 'pending').length, color: 'amber' },
          { label: 'En cours', count: reports.filter(r => r.status === 'reviewed').length, color: 'blue' },
          { label: 'Résolus', count: reports.filter(r => r.status === 'resolved').length, color: 'green' },
          { label: 'Rejetés', count: reports.filter(r => r.status === 'dismissed').length, color: 'gray' },
        ].map(stat => (
          <div 
            key={stat.label}
            className={`p-4 bg-dark-800/50 border border-dark-700/50 rounded-xl text-center`}
          >
            <p className={`text-2xl font-bold text-${stat.color}-400`}>{stat.count}</p>
            <p className="text-sm text-dark-400">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {filteredReports.length === 0 ? (
          <div className="text-center py-12 bg-dark-800/50 border border-dark-700/50 rounded-2xl">
            <Flag className="w-12 h-12 text-dark-600 mx-auto mb-4" />
            <p className="text-dark-400">Aucun signalement trouvé</p>
          </div>
        ) : (
          filteredReports.map((report, index) => (
            <motion.div
              key={report.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`p-6 bg-dark-800/50 border rounded-2xl transition-all ${
                report.status === 'pending' 
                  ? 'border-amber-500/30' 
                  : 'border-dark-700/50'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {getStatusBadge(report.status)}
                    <span className="px-2 py-0.5 text-xs bg-red-500/20 text-red-400 rounded-full">
                      {report.type}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-medium text-white mb-1 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-400" />
                    {report.reason}
                  </h3>
                  <p className="text-sm text-dark-400 mb-2">{report.description}</p>
                  
                  <div className="text-sm text-dark-500">
                    Signalé par <span className="text-dark-300">{report.reportedBy}</span>
                    <span className="mx-2">•</span>
                    {formatDate(report.createdAt)}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex items-center gap-2">
                  {report.status === 'pending' && (
                    <>
                      <button
                        onClick={() => updateReportStatus(report.id, 'reviewed')}
                        className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors"
                        title="Marquer en cours"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => updateReportStatus(report.id, 'resolved')}
                        className="p-2 text-green-400 hover:bg-green-500/20 rounded-lg transition-colors"
                        title="Marquer résolu"
                      >
                        <CheckCircle className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => updateReportStatus(report.id, 'dismissed')}
                        className="p-2 text-dark-400 hover:bg-dark-700 rounded-lg transition-colors"
                        title="Rejeter"
                      >
                        <XCircle className="w-5 h-5" />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => deleteReport(report.id)}
                    className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Expanded Details */}
              <AnimatePresence>
                {selectedReport === report.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 pt-4 border-t border-dark-700"
                  >
                    <p className="text-dark-300">Détails supplémentaires...</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))
        )}
      </div>
    </div>
  )
}

