import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { useAuth } from './AuthContext'
import { postsDB, DBPost } from '../lib/dbService'
import { getCurrentISODate } from '../db'

/**
 * Types pour les posts
 * 
 * RÈGLE D'OR: Les posts sont chargés depuis la DB
 * Toute modification écrit en base ET met à jour le state
 */

export interface Post {
  id: string
  authorId: string
  authorName: string
  authorAvatar?: string
  content: string
  images?: string[]
  tags: string[]
  specialtyId?: string
  likes: number
  saves: number
  shares: number
  reposts: number
  commentsCount: number
  isRepost: boolean
  originalPostId?: string
  createdAt: string
  updatedAt: string
}

export interface Comment {
  id: string
  postId: string
  authorId: string
  authorName: string
  content: string
  likes: number
  createdAt: string
}

interface PostsContextType {
  posts: Post[]
  isLoading: boolean
  addPost: (post: Omit<Post, 'id' | 'createdAt' | 'updatedAt' | 'likes' | 'saves' | 'shares' | 'reposts' | 'commentsCount'>) => Promise<Post | null>
  updatePost: (id: string, updates: Partial<Post>) => Promise<void>
  deletePost: (id: string) => Promise<void>
  likePost: (postId: string) => Promise<void>
  unlikePost: (postId: string) => Promise<void>
  savePost: (postId: string) => Promise<void>
  unsavePost: (postId: string) => Promise<void>
  sharePost: (postId: string) => Promise<void>
  getPostsByUser: (userId: string) => Post[]
  getPostsBySpecialty: (specialtyId: string) => Post[]
  searchPosts: (query: string) => Post[]
  refreshPosts: () => Promise<void>
}

const defaultContextValue: PostsContextType = {
  posts: [],
  isLoading: false,
  addPost: async () => null,
  updatePost: async () => {},
  deletePost: async () => {},
  likePost: async () => {},
  unlikePost: async () => {},
  savePost: async () => {},
  unsavePost: async () => {},
  sharePost: async () => {},
  getPostsByUser: () => [],
  getPostsBySpecialty: () => [],
  searchPosts: () => [],
  refreshPosts: async () => {}
}

const PostsContext = createContext<PostsContextType>(defaultContextValue)

/**
 * Convertit un post DB vers le format de l'application
 */
function dbToPost(dbPost: DBPost): Post {
  return {
    id: dbPost.id,
    authorId: dbPost.author_id,
    authorName: dbPost.author_name || 'Utilisateur',
    authorAvatar: dbPost.author_avatar,
    content: dbPost.content,
    images: dbPost.images,
    tags: dbPost.tags || [],
    specialtyId: dbPost.specialty_id || undefined,
    likes: dbPost.likes,
    saves: dbPost.saves,
    shares: dbPost.shares,
    reposts: dbPost.reposts,
    commentsCount: dbPost.comments,
    isRepost: dbPost.is_repost,
    originalPostId: dbPost.original_post_id || undefined,
    createdAt: dbPost.created_at,
    updatedAt: dbPost.updated_at
  }
}

/**
 * PostsProvider - Gère les posts depuis la DB
 */
export function PostsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [posts, setPosts] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Charger les posts au mount
  useEffect(() => {
    const loadPosts = async () => {
      setIsLoading(true)
      try {
        const dbPosts = await postsDB.getAll(100)
        setPosts(dbPosts.map(dbToPost))
      } catch (error) {
        console.error('Erreur chargement posts:', error)
        setPosts([])
      } finally {
        setIsLoading(false)
      }
    }

    loadPosts()
  }, [])

  // Ajouter un post
  const addPost = useCallback(async (
    post: Omit<Post, 'id' | 'createdAt' | 'updatedAt' | 'likes' | 'saves' | 'shares' | 'reposts' | 'commentsCount'>
  ): Promise<Post | null> => {
    try {
      const dbPost = await postsDB.create({
        author_id: post.authorId,
        author_name: post.authorName,
        author_avatar: post.authorAvatar,
        content: post.content,
        images: post.images || [],
        tags: post.tags,
        specialty_id: post.specialtyId || null,
        is_repost: post.isRepost || false,
        original_post_id: post.originalPostId || null
      })

      if (dbPost) {
        const newPost = dbToPost(dbPost)
        setPosts(prev => [newPost, ...prev])
        return newPost
      }
    } catch (error) {
      console.error('Erreur création post:', error)
    }
    return null
  }, [])

  // Mettre à jour un post
  const updatePost = useCallback(async (id: string, updates: Partial<Post>): Promise<void> => {
    // Pour l'instant, mettre à jour localement
    // TODO: Implémenter la mise à jour en DB
    setPosts(prev => prev.map(p => 
      p.id === id ? { ...p, ...updates, updatedAt: getCurrentISODate() } : p
    ))
  }, [])

  // Supprimer un post
  const deletePost = useCallback(async (id: string): Promise<void> => {
    try {
      const success = await postsDB.delete(id)
      if (success) {
        setPosts(prev => prev.filter(p => p.id !== id))
      }
    } catch (error) {
      console.error('Erreur suppression post:', error)
    }
  }, [])

  // Liker un post
  const likePost = useCallback(async (postId: string): Promise<void> => {
    try {
      const success = await postsDB.toggleLike(postId, true)
      if (success) {
        setPosts(prev => prev.map(p => 
          p.id === postId ? { ...p, likes: p.likes + 1 } : p
        ))
      }
    } catch (error) {
      console.error('Erreur like post:', error)
    }
  }, [])

  // Unliker un post
  const unlikePost = useCallback(async (postId: string): Promise<void> => {
    try {
      const success = await postsDB.toggleLike(postId, false)
      if (success) {
        setPosts(prev => prev.map(p => 
          p.id === postId ? { ...p, likes: Math.max(0, p.likes - 1) } : p
        ))
      }
    } catch (error) {
      console.error('Erreur unlike post:', error)
    }
  }, [])

  // Sauvegarder un post (le compteur save)
  const savePost = useCallback(async (postId: string): Promise<void> => {
    setPosts(prev => prev.map(p => 
      p.id === postId ? { ...p, saves: p.saves + 1 } : p
    ))
  }, [])

  // Retirer de la sauvegarde
  const unsavePost = useCallback(async (postId: string): Promise<void> => {
    setPosts(prev => prev.map(p => 
      p.id === postId ? { ...p, saves: Math.max(0, p.saves - 1) } : p
    ))
  }, [])

  // Partager un post
  const sharePost = useCallback(async (postId: string): Promise<void> => {
    setPosts(prev => prev.map(p => 
      p.id === postId ? { ...p, shares: p.shares + 1 } : p
    ))
  }, [])

  // Obtenir les posts d'un utilisateur
  const getPostsByUser = useCallback((userId: string): Post[] => {
    return posts.filter(p => p.authorId === userId)
  }, [posts])

  // Obtenir les posts d'une spécialité
  const getPostsBySpecialty = useCallback((specialtyId: string): Post[] => {
    return posts.filter(p => p.specialtyId === specialtyId)
  }, [posts])

  // Rechercher des posts
  const searchPosts = useCallback((query: string): Post[] => {
    const lowerQuery = query.toLowerCase()
    return posts.filter(p => 
      p.content.toLowerCase().includes(lowerQuery) ||
      p.tags.some(t => t.toLowerCase().includes(lowerQuery)) ||
      p.authorName.toLowerCase().includes(lowerQuery)
    )
  }, [posts])

  // Rafraîchir les posts
  const refreshPosts = useCallback(async (): Promise<void> => {
    setIsLoading(true)
    try {
      const dbPosts = await postsDB.getAll(100)
      setPosts(dbPosts.map(dbToPost))
    } catch (error) {
      console.error('Erreur refresh posts:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const value: PostsContextType = {
    posts,
    isLoading,
    addPost,
    updatePost,
    deletePost,
    likePost,
    unlikePost,
    savePost,
    unsavePost,
    sharePost,
    getPostsByUser,
    getPostsBySpecialty,
    searchPosts,
    refreshPosts
  }

  return (
    <PostsContext.Provider value={value}>
      {children}
    </PostsContext.Provider>
  )
}

/**
 * Hook pour utiliser les posts
 */
export function usePosts() {
  const context = useContext(PostsContext)
  if (!context) {
    return defaultContextValue
  }
  return context
}
