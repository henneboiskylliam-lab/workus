import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'

/**
 * Types pour le Centre d'aide
 */
export interface HelpQuestion {
  id: string
  question: string
  answer?: string
  authorId: string
  authorName: string
  status: 'pending' | 'answered' | 'closed'
  createdAt: string
  answeredAt?: string
  answeredBy?: string
  category?: string
  isPublic: boolean
}

interface HelpCenterContextType {
  questions: HelpQuestion[]
  addQuestion: (question: Omit<HelpQuestion, 'id' | 'createdAt' | 'status'>) => void
  answerQuestion: (questionId: string, answer: string, answeredBy: string) => void
  deleteQuestion: (questionId: string) => void
  updateQuestion: (questionId: string, updates: Partial<HelpQuestion>) => void
  getPublicQuestions: () => HelpQuestion[]
  getPendingQuestions: () => HelpQuestion[]
  getQuestionsByUser: (userId: string) => HelpQuestion[]
  searchQuestions: (query: string) => HelpQuestion[]
}

const STORAGE_KEY = 'workus_help_center'

const HelpCenterContext = createContext<HelpCenterContextType | undefined>(undefined)

/**
 * HelpCenterProvider - Gère les questions du centre d'aide
 */
export function HelpCenterProvider({ children }: { children: ReactNode }) {
  const [questions, setQuestions] = useState<HelpQuestion[]>([])

  // Charger les questions au démarrage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        setQuestions(JSON.parse(stored))
      } catch {
        setQuestions([])
      }
    }
  }, [])

  // Sauvegarder automatiquement
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(questions))
  }, [questions])

  // Ajouter une question
  const addQuestion = useCallback((question: Omit<HelpQuestion, 'id' | 'createdAt' | 'status'>) => {
    const newQuestion: HelpQuestion = {
      ...question,
      id: `question-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      status: 'pending',
      createdAt: new Date().toISOString()
    }
    setQuestions(prev => [newQuestion, ...prev])
  }, [])

  // Répondre à une question
  const answerQuestion = useCallback((questionId: string, answer: string, answeredBy: string) => {
    setQuestions(prev => prev.map(q => 
      q.id === questionId 
        ? { 
            ...q, 
            answer, 
            status: 'answered' as const, 
            answeredAt: new Date().toISOString(),
            answeredBy 
          } 
        : q
    ))
  }, [])

  // Supprimer une question
  const deleteQuestion = useCallback((questionId: string) => {
    setQuestions(prev => prev.filter(q => q.id !== questionId))
  }, [])

  // Mettre à jour une question
  const updateQuestion = useCallback((questionId: string, updates: Partial<HelpQuestion>) => {
    setQuestions(prev => prev.map(q => 
      q.id === questionId ? { ...q, ...updates } : q
    ))
  }, [])

  // Obtenir les questions publiques
  const getPublicQuestions = useCallback(() => {
    return questions.filter(q => q.isPublic || q.status === 'answered')
  }, [questions])

  // Obtenir les questions en attente
  const getPendingQuestions = useCallback(() => {
    return questions.filter(q => q.status === 'pending')
  }, [questions])

  // Obtenir les questions d'un utilisateur
  const getQuestionsByUser = useCallback((userId: string) => {
    return questions.filter(q => q.authorId === userId)
  }, [questions])

  // Rechercher dans les questions
  const searchQuestions = useCallback((query: string) => {
    const lowerQuery = query.toLowerCase()
    return questions.filter(q => 
      q.question.toLowerCase().includes(lowerQuery) ||
      q.answer?.toLowerCase().includes(lowerQuery) ||
      q.category?.toLowerCase().includes(lowerQuery)
    )
  }, [questions])

  const value: HelpCenterContextType = {
    questions,
    addQuestion,
    answerQuestion,
    deleteQuestion,
    updateQuestion,
    getPublicQuestions,
    getPendingQuestions,
    getQuestionsByUser,
    searchQuestions
  }

  return (
    <HelpCenterContext.Provider value={value}>
      {children}
    </HelpCenterContext.Provider>
  )
}

/**
 * Hook pour utiliser le contexte du centre d'aide
 */
export function useHelpCenter() {
  const context = useContext(HelpCenterContext)
  if (context === undefined) {
    throw new Error('useHelpCenter must be used within a HelpCenterProvider')
  }
  return context
}

