import { db, DBNotification, generateId, getCurrentISODate } from '../database'

/**
 * Service de gestion des notifications
 */
export const notificationService = {
  /**
   * Récupère toutes les notifications d'un utilisateur
   */
  async getByUser(userId: string): Promise<DBNotification[]> {
    return await db.notifications
      .where('userId')
      .equals(userId)
      .reverse()
      .sortBy('createdAt')
  },

  /**
   * Récupère les notifications non lues d'un utilisateur
   */
  async getUnreadByUser(userId: string): Promise<DBNotification[]> {
    return await db.notifications
      .where('[userId+isRead]')
      .equals([userId, 0])
      .reverse()
      .sortBy('createdAt')
  },

  /**
   * Compte les notifications non lues
   */
  async countUnread(userId: string): Promise<number> {
    return await db.notifications
      .where('[userId+isRead]')
      .equals([userId, 0])
      .count()
  },

  /**
   * Crée une notification
   */
  async create(data: Omit<DBNotification, 'id' | 'createdAt' | 'isRead'>): Promise<DBNotification> {
    const notification: DBNotification = {
      ...data,
      id: generateId(),
      isRead: false,
      createdAt: getCurrentISODate()
    }
    await db.notifications.add(notification)
    return notification
  },

  /**
   * Marque une notification comme lue
   */
  async markAsRead(id: string): Promise<void> {
    await db.notifications.update(id, { isRead: true })
  },

  /**
   * Marque toutes les notifications d'un utilisateur comme lues
   */
  async markAllAsRead(userId: string): Promise<void> {
    await db.notifications
      .where('userId')
      .equals(userId)
      .modify({ isRead: true })
  },

  /**
   * Supprime une notification
   */
  async delete(id: string): Promise<void> {
    await db.notifications.delete(id)
  },

  /**
   * Supprime toutes les notifications d'un utilisateur
   */
  async deleteAllByUser(userId: string): Promise<void> {
    await db.notifications.where('userId').equals(userId).delete()
  },

  /**
   * Supprime les anciennes notifications (plus de 30 jours)
   */
  async cleanupOld(): Promise<number> {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const cutoffDate = thirtyDaysAgo.toISOString()
    
    const oldNotifications = await db.notifications
      .filter(n => n.createdAt < cutoffDate)
      .toArray()
    
    for (const notif of oldNotifications) {
      await db.notifications.delete(notif.id)
    }
    
    return oldNotifications.length
  }
}

