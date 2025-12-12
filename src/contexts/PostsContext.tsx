import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'

/**
 * Types pour les posts
 */
export interface Post {
  id: string
  authorId: string
  authorName: string
  authorAvatar?: string
  content: string
  images?: string[]
  category?: string
  specialty?: string
  tags?: string[]
  likes: string[] // IDs des utilisateurs
  comments: Comment[]
  shares: number
  createdAt: string
  updatedAt?: string
}

export interface Comment {
  id: string
  authorId: string
  authorName: string
  content: string
  likes: string[]
  createdAt: string
}

interface PostsContextType {
  posts: Post[]
  addPost: (post: Omit<Post, 'id' | 'createdAt' | 'likes' | 'comments' | 'shares'>) => void
  updatePost: (id: string, updates: Partial<Post>) => void
  deletePost: (id: string) => void
  likePost: (postId: string, userId: string) => void
  unlikePost: (postId: string, userId: string) => void
  addComment: (postId: string, comment: Omit<Comment, 'id' | 'createdAt' | 'likes'>) => void
  deleteComment: (postId: string, commentId: string) => void
  getPostsByUser: (userId: string) => Post[]
  getPostsByCategory: (category: string) => Post[]
  getPostsBySpecialty: (specialty: string) => Post[]
  searchPosts: (query: string) => Post[]
}

const STORAGE_KEY = 'workus_posts'

const PostsContext = createContext<PostsContextType | undefined>(undefined)

/**
 * PostsProvider - Gère les posts du feed
 */
export function PostsProvider({ children }: { children: ReactNode }) {
  const [posts, setPosts] = useState<Post[]>([])

  // Charger les posts au démarrage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        setPosts(JSON.parse(stored))
      } catch {
        setPosts([])
      }
    }
  }, [])

  // Sauvegarder automatiquement
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(posts))
  }, [posts])

  // Ajouter un post
  const addPost = useCallback((post: Omit<Post, 'id' | 'createdAt' | 'likes' | 'comments' | 'shares'>) => {
    const newPost: Post = {
      ...post,
      id: `post-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      likes: [],
      comments: [],
      shares: 0,
      createdAt: new Date().toISOString()
    }
    setPosts(prev => [newPost, ...prev])
  }, [])

  // Mettre à jour un post
  const updatePost = useCallback((id: string, updates: Partial<Post>) => {
    setPosts(prev => prev.map(p => 
      p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
    ))
  }, [])

  // Supprimer un post
  const deletePost = useCallback((id: string) => {
    setPosts(prev => prev.filter(p => p.id !== id))
  }, [])

  // Liker un post
  const likePost = useCallback((postId: string, userId: string) => {
    setPosts(prev => prev.map(p => 
      p.id === postId && !p.likes.includes(userId)
        ? { ...p, likes: [...p.likes, userId] }
        : p
    ))
  }, [])

  // Unliker un post
  const unlikePost = useCallback((postId: string, userId: string) => {
    setPosts(prev => prev.map(p => 
      p.id === postId
        ? { ...p, likes: p.likes.filter(id => id !== userId) }
        : p
    ))
  }, [])

  // Ajouter un commentaire
  const addComment = useCallback((postId: string, comment: Omit<Comment, 'id' | 'createdAt' | 'likes'>) => {
    const newComment: Comment = {
      ...comment,
      id: `comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      likes: [],
      createdAt: new Date().toISOString()
    }
    setPosts(prev => prev.map(p => 
      p.id === postId
        ? { ...p, comments: [...p.comments, newComment] }
        : p
    ))
  }, [])

  // Supprimer un commentaire
  const deleteComment = useCallback((postId: string, commentId: string) => {
    setPosts(prev => prev.map(p => 
      p.id === postId
        ? { ...p, comments: p.comments.filter(c => c.id !== commentId) }
        : p
    ))
  }, [])

  // Obtenir les posts d'un utilisateur
  const getPostsByUser = useCallback((userId: string) => {
    return posts.filter(p => p.authorId === userId)
  }, [posts])

  // Obtenir les posts par catégorie
  const getPostsByCategory = useCallback((category: string) => {
    return posts.filter(p => p.category === category)
  }, [posts])

  // Obtenir les posts par spécialité
  const getPostsBySpecialty = useCallback((specialty: string) => {
    return posts.filter(p => p.specialty === specialty)
  }, [posts])

  // Rechercher dans les posts
  const searchPosts = useCallback((query: string) => {
    const lowerQuery = query.toLowerCase()
    return posts.filter(p => 
      p.content.toLowerCase().includes(lowerQuery) ||
      p.authorName.toLowerCase().includes(lowerQuery) ||
      p.tags?.some(t => t.toLowerCase().includes(lowerQuery)) ||
      p.category?.toLowerCase().includes(lowerQuery) ||
      p.specialty?.toLowerCase().includes(lowerQuery)
    )
  }, [posts])

  const value: PostsContextType = {
    posts,
    addPost,
    updatePost,
    deletePost,
    likePost,
    unlikePost,
    addComment,
    deleteComment,
    getPostsByUser,
    getPostsByCategory,
    getPostsBySpecialty,
    searchPosts
  }

  return (
    <PostsContext.Provider value={value}>
      {children}
    </PostsContext.Provider>
  )
}

/**
 * Hook pour utiliser le contexte des posts
 */
export function usePosts() {
  const context = useContext(PostsContext)
  if (context === undefined) {
    throw new Error('usePosts must be used within a PostsProvider')
  }
  return context
}

