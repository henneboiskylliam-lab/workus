import { db, DBPost, DBComment, generateId, getCurrentISODate } from '../database'

/**
 * Service de gestion des posts et commentaires
 */
export const postService = {
  // ========== POSTS ==========

  /**
   * Récupère tous les posts (triés par date décroissante)
   */
  async getAllPosts(): Promise<DBPost[]> {
    return await db.posts.orderBy('createdAt').reverse().toArray()
  },

  /**
   * Récupère un post par son ID
   */
  async getPostById(id: string): Promise<DBPost | undefined> {
    return await db.posts.get(id)
  },

  /**
   * Récupère les posts d'un utilisateur
   */
  async getPostsByUser(authorId: string): Promise<DBPost[]> {
    return await db.posts.where('authorId').equals(authorId).reverse().sortBy('createdAt')
  },

  /**
   * Récupère les posts d'une spécialité
   */
  async getPostsBySpecialty(specialtyId: string): Promise<DBPost[]> {
    return await db.posts.where('specialtyId').equals(specialtyId).reverse().sortBy('createdAt')
  },

  /**
   * Crée un nouveau post
   */
  async createPost(data: Omit<DBPost, 'id' | 'createdAt' | 'updatedAt' | 'likes' | 'saves' | 'shares' | 'reposts' | 'comments'>): Promise<DBPost> {
    const now = getCurrentISODate()
    const post: DBPost = {
      ...data,
      id: generateId(),
      likes: 0,
      saves: 0,
      shares: 0,
      reposts: 0,
      comments: 0,
      createdAt: now,
      updatedAt: now
    }
    await db.posts.add(post)
    return post
  },

  /**
   * Met à jour un post
   */
  async updatePost(id: string, updates: Partial<DBPost>): Promise<void> {
    await db.posts.update(id, { ...updates, updatedAt: getCurrentISODate() })
  },

  /**
   * Supprime un post et ses commentaires
   */
  async deletePost(id: string): Promise<void> {
    await db.comments.where('postId').equals(id).delete()
    await db.posts.delete(id)
  },

  /**
   * Like/Unlike un post
   */
  async toggleLike(id: string, increment: boolean): Promise<void> {
    const post = await db.posts.get(id)
    if (post) {
      await db.posts.update(id, { 
        likes: increment ? post.likes + 1 : Math.max(0, post.likes - 1),
        updatedAt: getCurrentISODate()
      })
    }
  },

  /**
   * Save/Unsave un post
   */
  async toggleSave(id: string, increment: boolean): Promise<void> {
    const post = await db.posts.get(id)
    if (post) {
      await db.posts.update(id, { 
        saves: increment ? post.saves + 1 : Math.max(0, post.saves - 1),
        updatedAt: getCurrentISODate()
      })
    }
  },

  /**
   * Compte le nombre de posts
   */
  async countPosts(): Promise<number> {
    return await db.posts.count()
  },

  /**
   * Recherche de posts
   */
  async searchPosts(query: string): Promise<DBPost[]> {
    const lowerQuery = query.toLowerCase()
    return await db.posts.filter(post => 
      post.content.toLowerCase().includes(lowerQuery) ||
      post.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
      post.authorName.toLowerCase().includes(lowerQuery)
    ).toArray()
  },

  // ========== COMMENTAIRES ==========

  /**
   * Récupère les commentaires d'un post
   */
  async getCommentsByPost(postId: string): Promise<DBComment[]> {
    return await db.comments.where('postId').equals(postId).sortBy('createdAt')
  },

  /**
   * Crée un commentaire
   */
  async createComment(data: Omit<DBComment, 'id' | 'createdAt' | 'updatedAt' | 'likes'>): Promise<DBComment> {
    const now = getCurrentISODate()
    const comment: DBComment = {
      ...data,
      id: generateId(),
      likes: 0,
      createdAt: now,
      updatedAt: now
    }
    await db.comments.add(comment)
    
    // Incrémenter le compteur de commentaires du post
    const post = await db.posts.get(data.postId)
    if (post) {
      await db.posts.update(data.postId, { 
        comments: post.comments + 1,
        updatedAt: now
      })
    }
    
    return comment
  },

  /**
   * Supprime un commentaire
   */
  async deleteComment(id: string): Promise<void> {
    const comment = await db.comments.get(id)
    if (comment) {
      // Décrémenter le compteur de commentaires du post
      const post = await db.posts.get(comment.postId)
      if (post && post.comments > 0) {
        await db.posts.update(comment.postId, { 
          comments: post.comments - 1,
          updatedAt: getCurrentISODate()
        })
      }
    }
    await db.comments.delete(id)
  }
}

