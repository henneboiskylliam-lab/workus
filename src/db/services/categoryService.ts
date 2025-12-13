import { db, DBCategory, DBSpecialty, generateId, getCurrentISODate } from '../database'

/**
 * Service de gestion des catégories et spécialités
 */
export const categoryService = {
  // ========== CATÉGORIES ==========

  /**
   * Récupère toutes les catégories
   */
  async getAllCategories(): Promise<DBCategory[]> {
    return await db.categories.orderBy('name').toArray()
  },

  /**
   * Récupère une catégorie par son ID
   */
  async getCategoryById(id: string): Promise<DBCategory | undefined> {
    return await db.categories.get(id)
  },

  /**
   * Récupère une catégorie par son slug
   */
  async getCategoryBySlug(slug: string): Promise<DBCategory | undefined> {
    return await db.categories.where('slug').equals(slug).first()
  },

  /**
   * Crée une nouvelle catégorie
   */
  async createCategory(data: Omit<DBCategory, 'id' | 'createdAt' | 'updatedAt' | 'specialtyCount'>): Promise<DBCategory> {
    const now = getCurrentISODate()
    const category: DBCategory = {
      ...data,
      id: generateId(),
      specialtyCount: 0,
      createdAt: now,
      updatedAt: now
    }
    await db.categories.add(category)
    return category
  },

  /**
   * Met à jour une catégorie
   */
  async updateCategory(id: string, updates: Partial<DBCategory>): Promise<void> {
    await db.categories.update(id, { ...updates, updatedAt: getCurrentISODate() })
  },

  /**
   * Supprime une catégorie et ses spécialités
   */
  async deleteCategory(id: string): Promise<void> {
    // Supprimer les spécialités associées
    await db.specialties.where('categoryId').equals(id).delete()
    // Supprimer la catégorie
    await db.categories.delete(id)
  },

  /**
   * Compte le nombre de catégories
   */
  async countCategories(): Promise<number> {
    return await db.categories.count()
  },

  // ========== SPÉCIALITÉS ==========

  /**
   * Récupère toutes les spécialités
   */
  async getAllSpecialties(): Promise<DBSpecialty[]> {
    return await db.specialties.orderBy('name').toArray()
  },

  /**
   * Récupère une spécialité par son ID
   */
  async getSpecialtyById(id: string): Promise<DBSpecialty | undefined> {
    return await db.specialties.get(id)
  },

  /**
   * Récupère une spécialité par son slug
   */
  async getSpecialtyBySlug(slug: string): Promise<DBSpecialty | undefined> {
    return await db.specialties.where('slug').equals(slug).first()
  },

  /**
   * Récupère les spécialités d'une catégorie
   */
  async getSpecialtiesByCategory(categoryId: string): Promise<DBSpecialty[]> {
    return await db.specialties.where('categoryId').equals(categoryId).toArray()
  },

  /**
   * Crée une nouvelle spécialité
   */
  async createSpecialty(data: Omit<DBSpecialty, 'id' | 'createdAt' | 'updatedAt' | 'resourceCount' | 'exerciseCount'>): Promise<DBSpecialty> {
    const now = getCurrentISODate()
    const specialty: DBSpecialty = {
      ...data,
      id: generateId(),
      resourceCount: 0,
      exerciseCount: 0,
      createdAt: now,
      updatedAt: now
    }
    await db.specialties.add(specialty)
    
    // Mettre à jour le compteur de la catégorie
    const category = await db.categories.get(data.categoryId)
    if (category) {
      await db.categories.update(data.categoryId, { 
        specialtyCount: category.specialtyCount + 1,
        updatedAt: now
      })
    }
    
    return specialty
  },

  /**
   * Met à jour une spécialité
   */
  async updateSpecialty(id: string, updates: Partial<DBSpecialty>): Promise<void> {
    await db.specialties.update(id, { ...updates, updatedAt: getCurrentISODate() })
  },

  /**
   * Supprime une spécialité
   */
  async deleteSpecialty(id: string): Promise<void> {
    const specialty = await db.specialties.get(id)
    if (specialty) {
      // Décrémenter le compteur de la catégorie
      const category = await db.categories.get(specialty.categoryId)
      if (category && category.specialtyCount > 0) {
        await db.categories.update(specialty.categoryId, { 
          specialtyCount: category.specialtyCount - 1,
          updatedAt: getCurrentISODate()
        })
      }
    }
    await db.specialties.delete(id)
  },

  /**
   * Compte le nombre de spécialités
   */
  async countSpecialties(): Promise<number> {
    return await db.specialties.count()
  },

  /**
   * Recherche de spécialités
   */
  async searchSpecialties(query: string): Promise<DBSpecialty[]> {
    const lowerQuery = query.toLowerCase()
    return await db.specialties.filter(specialty => 
      specialty.name.toLowerCase().includes(lowerQuery) ||
      specialty.description.toLowerCase().includes(lowerQuery)
    ).toArray()
  }
}

