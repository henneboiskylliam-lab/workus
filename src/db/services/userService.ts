import { db, DBUser, generateId, getCurrentISODate } from '../database'

/**
 * Service de gestion des utilisateurs
 */
export const userService = {
  /**
   * Récupère tous les utilisateurs
   */
  async getAll(): Promise<DBUser[]> {
    return await db.users.toArray()
  },

  /**
   * Récupère un utilisateur par son ID
   */
  async getById(id: string): Promise<DBUser | undefined> {
    return await db.users.get(id)
  },

  /**
   * Récupère un utilisateur par son email
   */
  async getByEmail(email: string): Promise<DBUser | undefined> {
    return await db.users.where('email').equals(email).first()
  },

  /**
   * Récupère un utilisateur par son nom d'utilisateur
   */
  async getByUsername(username: string): Promise<DBUser | undefined> {
    return await db.users.where('username').equals(username).first()
  },

  /**
   * Crée un nouvel utilisateur
   */
  async create(userData: Omit<DBUser, 'id' | 'joinedAt' | 'lastLoginAt' | 'followers' | 'following' | 'savedContent'>): Promise<DBUser> {
    const now = getCurrentISODate()
    const user: DBUser = {
      ...userData,
      id: generateId(),
      joinedAt: now,
      lastLoginAt: now,
      followers: 0,
      following: 0,
      savedContent: []
    }
    await db.users.add(user)
    return user
  },

  /**
   * Met à jour un utilisateur
   */
  async update(id: string, updates: Partial<DBUser>): Promise<void> {
    await db.users.update(id, updates)
  },

  /**
   * Supprime un utilisateur
   */
  async delete(id: string): Promise<void> {
    await db.users.delete(id)
  },

  /**
   * Authentifie un utilisateur
   */
  async authenticate(email: string, password: string): Promise<DBUser | null> {
    const user = await db.users.where('email').equals(email).first()
    if (user && user.password === password) {
      // Mettre à jour la date de dernière connexion
      await db.users.update(user.id, { lastLoginAt: getCurrentISODate() })
      return user
    }
    return null
  },

  /**
   * Compte le nombre total d'utilisateurs
   */
  async count(): Promise<number> {
    return await db.users.count()
  },

  /**
   * Récupère les utilisateurs actifs
   */
  async getActiveUsers(): Promise<DBUser[]> {
    return await db.users.where('isActive').equals(1).toArray()
  },

  /**
   * Récupère les utilisateurs par rôle
   */
  async getByRole(role: DBUser['role']): Promise<DBUser[]> {
    return await db.users.where('role').equals(role).toArray()
  },

  /**
   * Recherche d'utilisateurs
   */
  async search(query: string): Promise<DBUser[]> {
    const lowerQuery = query.toLowerCase()
    return await db.users.filter(user => 
      user.username.toLowerCase().includes(lowerQuery) ||
      user.email.toLowerCase().includes(lowerQuery) ||
      (user.bio?.toLowerCase().includes(lowerQuery) ?? false)
    ).toArray()
  }
}

