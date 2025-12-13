/**
 * Point d'entrée principal pour la base de données
 * 
 * Utilisation:
 * import { db, userService, categoryService, ... } from '@/db'
 */

// Export de la base de données et des utilitaires
export { 
  db, 
  generateId, 
  getCurrentISODate, 
  getTodayDateString,
  initializeDatabase,
  clearDatabase,
  resetDatabase,
  WorkUsDatabase
} from './database'

// Export des types
export type {
  DBUser,
  DBCategory,
  DBSpecialty,
  DBPost,
  DBComment,
  DBDiscussion,
  DBDiscussionReply,
  DBNotification,
  DBReport,
  DBContent,
  DBUserData,
  DBActivityEvent,
  DBDailyActivityRecord,
  DBAdminStats,
  DBSetting,
  DBSession
} from './database'

// Export des services
export { 
  userService, 
  categoryService, 
  postService, 
  notificationService, 
  statsService 
} from './services'

// Export des hooks
export {
  useDatabaseInit,
  useUsers,
  useUser,
  useCategories,
  useSpecialties,
  useSpecialty,
  usePosts,
  useNotificationsDB,
  useAdminStats,
  useDailyActivity
} from './hooks'

// Export du Provider
export { DatabaseProvider, useDatabase } from './DatabaseProvider'

