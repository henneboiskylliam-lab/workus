import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'

export interface Report {
  id: string
  contentId: string
  contentType: 'content' | 'user' | 'comment' | 'post' | 'discussion'
  contentTitle?: string
  contentPreview?: string
  contentAuthorId?: string
  contentAuthorName?: string
  reporterId: string
  reporterName: string
  reason: string
  description?: string
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed' | 'rejected'
  createdAt: string
  resolvedAt?: string
  resolvedBy?: string
  resolutionNotes?: string
}

interface ReportsContextType {
  reports: Report[]
  pendingReports: Report[]
  addReport: (report: Omit<Report, 'id' | 'status' | 'createdAt'>) => void
  updateReportStatus: (id: string, status: Report['status'], resolvedBy?: string, notes?: string) => void
  deleteReport: (id: string) => void
  getPendingCount: () => number
  getReportsByStatus: (status: Report['status']) => Report[]
}

const ReportsContext = createContext<ReportsContextType | undefined>(undefined)

export function ReportsProvider({ children }: { children: ReactNode }) {
  const [reports, setReports] = useState<Report[]>(() => {
    const saved = localStorage.getItem('workus_reports')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {
        return []
      }
    }
    return []
  })

  // Sauvegarder dans localStorage
  useEffect(() => {
    localStorage.setItem('workus_reports', JSON.stringify(reports))
  }, [reports])

  // Rapports en attente
  const pendingReports = reports.filter(r => r.status === 'pending')

  const addReport = useCallback((report: Omit<Report, 'id' | 'status' | 'createdAt'>) => {
    const newReport: Report = {
      ...report,
      id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'pending',
      createdAt: new Date().toISOString()
    }
    setReports(prev => [newReport, ...prev])
  }, [])

  const updateReportStatus = useCallback((id: string, status: Report['status'], resolvedBy?: string, notes?: string) => {
    setReports(prev => prev.map(r => 
      r.id === id ? { 
        ...r, 
        status,
        resolvedAt: status !== 'pending' ? new Date().toISOString() : undefined,
        resolvedBy,
        resolutionNotes: notes
      } : r
    ))
  }, [])

  const deleteReport = useCallback((id: string) => {
    setReports(prev => prev.filter(r => r.id !== id))
  }, [])

  const getPendingCount = useCallback(() => {
    return reports.filter(r => r.status === 'pending').length
  }, [reports])

  const getReportsByStatus = useCallback((status: Report['status']) => {
    return reports.filter(r => r.status === status)
  }, [reports])

  return (
    <ReportsContext.Provider value={{
      reports,
      pendingReports,
      addReport,
      updateReportStatus,
      deleteReport,
      getPendingCount,
      getReportsByStatus
    }}>
      {children}
    </ReportsContext.Provider>
  )
}

export function useReports() {
  const context = useContext(ReportsContext)
  if (context === undefined) {
    throw new Error('useReports must be used within a ReportsProvider')
  }
  return context
}
