import Dexie, { Table } from 'dexie'

/**
 * Base de données Work Us
 * Utilise IndexedDB via Dexie.js pour une persistance locale robuste
 */

// ============ INTERFACES ============

export interface DBUser {
  id: string
  username: string
  email: string
  password?: string // Hash ou stocké de manière sécurisée
  role: 'user' | 'creator' | 'moderator' | 'admin'
  avatar?: string | null
  bio?: string
  isActive: boolean
  isVerified: boolean
  joinedAt: string
  lastLoginAt: string
  skills: string[]
  followers: number
  following: number
  savedContent: string[]
}

export interface DBCategory {
  id: string
  name: string
  slug: string
  description: string
  icon: string
  color: string
  specialtyCount: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface DBSpecialty {
  id: string
  categoryId: string
  name: string
  slug: string
  description: string
  icon: string
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  estimatedHours: number
  resourceCount: number
  exerciseCount: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface DBPost {
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
  comments: number
  isRepost: boolean
  originalPostId?: string
  createdAt: string
  updatedAt: string
}

export interface DBComment {
  id: string
  postId: string
  authorId: string
  authorName: string
  authorAvatar?: string
  content: string
  likes: number
  createdAt: string
  updatedAt: string
}

export interface DBDiscussion {
  id: string
  authorId: string
  authorName: string
  title: string
  content: string
  specialtyId?: string
  tags: string[]
  type: 'question' | 'discussion' | 'announcement' | 'feedback'
  status: 'open' | 'resolved' | 'closed'
  views: number
  replies: number
  likes: number
  isPinned: boolean
  createdAt: string
  updatedAt: string
}

export interface DBDiscussionReply {
  id: string
  discussionId: string
  authorId: string
  authorName: string
  content: string
  likes: number
  isAcceptedAnswer: boolean
  createdAt: string
  updatedAt: string
}

export interface DBNotification {
  id: string
  userId: string
  type: 'like' | 'save' | 'share' | 'repost' | 'follow' | 'message' | 'comment' | 'info' | 'success' | 'warning' | 'error' | 'system' | 'report' | 'mention'
  title: string
  message: string
  isRead: boolean
  fromUserId?: string
  fromUserName?: string
  targetId?: string
  targetType?: string
  targetUrl?: string
  createdAt: string
}

export interface DBReport {
  id: string
  reporterId: string
  reporterName?: string
  contentId: string
  contentType: 'post' | 'comment' | 'discussion' | 'user' | 'specialty'
  contentTitle?: string
  contentPreview?: string
  contentAuthorId?: string
  contentAuthorName?: string
  reason: string
  details?: string
  status: 'pending' | 'reviewing' | 'resolved' | 'dismissed'
  reviewedBy?: string
  reviewedAt?: string
  resolution?: string
  createdAt: string
  updatedAt: string
}

export interface DBContent {
  id: string
  type: 'article' | 'video' | 'tutorial' | 'course' | 'exercise' | 'resource'
  title: string
  description: string
  content?: string
  authorId: string
  authorName: string
  specialtyId?: string
  categoryId?: string
  tags: string[]
  thumbnail?: string
  duration?: number
  difficulty?: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  isPremium: boolean
  isPublished: boolean
  views: number
  likes: number
  saves: number
  createdAt: string
  updatedAt: string
}

export interface DBUserData {
  id: string // clé unique: `${userId}_data`
  userId: string
  savedItems: { id: string; type: string; savedAt: string }[]
  likedItems: { id: string; type: string; likedAt: string }[]
  following: { id: string; username: string; followedAt: string }[]
  followers: { id: string; username: string; followedAt: string }[]
  skillProgress: Record<string, {
    skillId: string
    skillName: string
    progress: number
    level: number
    hoursWorked: number
    exercisesCompleted: number
    lastWorkedAt: string
  }>
  weeklyActivity: number[]
  todayActivity: number
  lastActivityDate: string
}

export interface DBActivityEvent {
  id: string
  userId: string
  userName?: string
  type: string
  targetId?: string
  targetName?: string
  message?: string
  metadata?: Record<string, unknown>
  createdAt: string
}

export interface DBDailyActivityRecord {
  id: string // format: YYYY-MM-DD
  date: string
  totalMinutes: number
  userMinutes: Record<string, number> // userId -> minutes
  createdAt: string
  updatedAt: string
}

export interface DBAdminStats {
  id: string // 'current' pour les stats actuelles
  totalUsers: number
  activeUsers: number
  totalPosts: number
  totalDiscussions: number
  totalReports: number
  pendingReports: number
  totalContent: number
  dailyUserSnapshots: { date: string; count: number }[]
  updatedAt: string
}

export interface DBSetting {
  id: string
  userId: string
  key: string
  value: unknown
  updatedAt: string
}

export interface DBSession {
  id: string
  userId: string
  token: string
  startedAt: string
  lastActiveAt: string
  expiresAt: string
}

// ============ DATABASE CLASS ============

export class WorkUsDatabase extends Dexie {
  // Tables
  users!: Table<DBUser, string>
  categories!: Table<DBCategory, string>
  specialties!: Table<DBSpecialty, string>
  posts!: Table<DBPost, string>
  comments!: Table<DBComment, string>
  discussions!: Table<DBDiscussion, string>
  discussionReplies!: Table<DBDiscussionReply, string>
  notifications!: Table<DBNotification, string>
  reports!: Table<DBReport, string>
  contents!: Table<DBContent, string>
  userData!: Table<DBUserData, string>
  activityEvents!: Table<DBActivityEvent, string>
  dailyActivityRecords!: Table<DBDailyActivityRecord, string>
  adminStats!: Table<DBAdminStats, string>
  settings!: Table<DBSetting, string>
  sessions!: Table<DBSession, string>

  constructor() {
    super('WorkUsDB')

    // Version 1 - Schéma initial
    this.version(1).stores({
      users: 'id, email, username, role, isActive, joinedAt',
      categories: 'id, slug, name, isActive, createdAt',
      specialties: 'id, categoryId, slug, name, level, isActive, createdAt',
      posts: 'id, authorId, specialtyId, createdAt, [authorId+createdAt]',
      comments: 'id, postId, authorId, createdAt',
      discussions: 'id, authorId, specialtyId, type, status, createdAt, [type+createdAt]',
      discussionReplies: 'id, discussionId, authorId, createdAt',
      notifications: 'id, userId, type, isRead, createdAt, [userId+isRead], [userId+createdAt]',
      reports: 'id, reporterId, contentId, contentType, status, createdAt, [status+createdAt]',
      contents: 'id, authorId, specialtyId, categoryId, type, isPublished, createdAt, [type+isPublished]',
      userData: 'id, userId',
      activityEvents: 'id, userId, type, createdAt, [userId+createdAt]',
      dailyActivityRecords: 'id, date',
      adminStats: 'id',
      settings: 'id, [userId+key]',
      sessions: 'id, userId, token, expiresAt'
    })
  }
}

// Instance singleton de la base de données
export const db = new WorkUsDatabase()

// ============ FONCTIONS UTILITAIRES ============

/**
 * Génère un ID unique
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
}

/**
 * Obtient la date actuelle en format ISO
 */
export function getCurrentISODate(): string {
  return new Date().toISOString()
}

/**
 * Obtient la date du jour en format YYYY-MM-DD
 */
export function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0]
}

/**
 * Initialise la base de données avec les données par défaut
 */
export async function initializeDatabase(): Promise<void> {
  try {
    // Vérifier si la DB est déjà initialisée
    const existingCategories = await db.categories.count()
    if (existingCategories > 0) {
      console.log('Database already initialized')
      return
    }

    console.log('Initializing database with default data...')

    // Importer les données par défaut
    await seedDefaultData()

    console.log('Database initialized successfully')
  } catch (error) {
    console.error('Error initializing database:', error)
  }
}

/**
 * Seed les données par défaut
 */
async function seedDefaultData(): Promise<void> {
  const now = getCurrentISODate()

  // ========== UTILISATEURS PAR DÉFAUT ==========
  const defaultUsers: DBUser[] = [
    {
      id: 'admin-1',
      username: 'admin',
      email: 'admin@workus.com',
      password: 'admin123', // En production, utiliser un hash
      role: 'admin',
      avatar: null,
      bio: 'Administrateur Work Us',
      isActive: true,
      isVerified: true,
      joinedAt: '2024-12-12T00:00:00Z',
      lastLoginAt: now,
      skills: [],
      followers: 0,
      following: 0,
      savedContent: []
    },
    {
      id: 'creator-1',
      username: 'sophie',
      email: 'sophie@workus.com',
      password: 'creator123',
      role: 'creator',
      avatar: null,
      bio: 'Créatrice de contenu passionnée',
      isActive: true,
      isVerified: true,
      joinedAt: '2024-12-13T00:00:00Z',
      lastLoginAt: now,
      skills: [],
      followers: 0,
      following: 0,
      savedContent: []
    }
  ]

  await db.users.bulkAdd(defaultUsers)

  // ========== CATÉGORIES PAR DÉFAUT ==========
  const defaultCategories: DBCategory[] = [
    { id: 'cat-1', name: 'Technologie & Développement', slug: 'technologie-developpement', description: 'Programmation, développement web, mobile et logiciel', icon: '💻', color: 'from-blue-500 to-cyan-500', specialtyCount: 5, isActive: true, createdAt: now, updatedAt: now },
    { id: 'cat-2', name: 'Business & Entrepreneuriat', slug: 'business-entrepreneuriat', description: 'Création d\'entreprise, stratégie et gestion', icon: '💼', color: 'from-amber-500 to-orange-500', specialtyCount: 4, isActive: true, createdAt: now, updatedAt: now },
    { id: 'cat-3', name: 'Design & Créativité', slug: 'design-creativite', description: 'Design graphique, UX/UI, illustration et créativité', icon: '🎨', color: 'from-pink-500 to-rose-500', specialtyCount: 4, isActive: true, createdAt: now, updatedAt: now },
    { id: 'cat-4', name: 'Marketing & Communication', slug: 'marketing-communication', description: 'Marketing digital, réseaux sociaux et communication', icon: '📈', color: 'from-green-500 to-emerald-500', specialtyCount: 4, isActive: true, createdAt: now, updatedAt: now },
    { id: 'cat-5', name: 'Data & Intelligence Artificielle', slug: 'data-intelligence-artificielle', description: 'Data science, machine learning et IA', icon: '🤖', color: 'from-purple-500 to-violet-500', specialtyCount: 3, isActive: true, createdAt: now, updatedAt: now },
    { id: 'cat-6', name: 'Finance & Comptabilité', slug: 'finance-comptabilite', description: 'Comptabilité, finance et investissement', icon: '💰', color: 'from-yellow-500 to-amber-500', specialtyCount: 3, isActive: true, createdAt: now, updatedAt: now },
    { id: 'cat-7', name: 'Langues & Communication', slug: 'langues-communication', description: 'Apprentissage des langues et communication interculturelle', icon: '🌍', color: 'from-teal-500 to-cyan-500', specialtyCount: 4, isActive: true, createdAt: now, updatedAt: now },
    { id: 'cat-8', name: 'Management & Leadership', slug: 'management-leadership', description: 'Gestion d\'équipe, leadership et développement personnel', icon: '👥', color: 'from-indigo-500 to-blue-500', specialtyCount: 4, isActive: true, createdAt: now, updatedAt: now },
    { id: 'cat-9', name: 'Sciences & Ingénierie', slug: 'sciences-ingenierie', description: 'Sciences fondamentales et appliquées, ingénierie', icon: '🔬', color: 'from-red-500 to-rose-500', specialtyCount: 5, isActive: true, createdAt: now, updatedAt: now },
    { id: 'cat-10', name: 'Santé & Bien-être', slug: 'sante-bien-etre', description: 'Santé, nutrition, sport et développement personnel', icon: '🏥', color: 'from-lime-500 to-green-500', specialtyCount: 4, isActive: true, createdAt: now, updatedAt: now },
    { id: 'cat-11', name: 'Arts & Culture', slug: 'arts-culture', description: 'Musique, photographie, écriture et culture générale', icon: '🎭', color: 'from-fuchsia-500 to-pink-500', specialtyCount: 5, isActive: true, createdAt: now, updatedAt: now },
    { id: 'cat-12', name: 'Droit & Administration', slug: 'droit-administration', description: 'Droit, administration publique et ressources humaines', icon: '⚖️', color: 'from-slate-500 to-gray-500', specialtyCount: 4, isActive: true, createdAt: now, updatedAt: now }
  ]

  await db.categories.bulkAdd(defaultCategories)

  // ========== SPÉCIALITÉS PAR DÉFAUT ==========
  const defaultSpecialties: DBSpecialty[] = [
    // Technologie & Développement
    { id: 'spec-1', categoryId: 'cat-1', name: 'Développement Frontend', slug: 'developpement-frontend', description: 'HTML, CSS, JavaScript, React, Vue.js', icon: '🌐', level: 'intermediate', estimatedHours: 120, resourceCount: 45, exerciseCount: 30, isActive: true, createdAt: now, updatedAt: now },
    { id: 'spec-2', categoryId: 'cat-1', name: 'Développement Backend', slug: 'developpement-backend', description: 'Node.js, Python, Java, bases de données', icon: '⚙️', level: 'intermediate', estimatedHours: 150, resourceCount: 50, exerciseCount: 35, isActive: true, createdAt: now, updatedAt: now },
    { id: 'spec-3', categoryId: 'cat-1', name: 'Développement Mobile', slug: 'developpement-mobile', description: 'React Native, Flutter, Swift, Kotlin', icon: '📱', level: 'advanced', estimatedHours: 140, resourceCount: 40, exerciseCount: 25, isActive: true, createdAt: now, updatedAt: now },
    { id: 'spec-4', categoryId: 'cat-1', name: 'DevOps & Cloud', slug: 'devops-cloud', description: 'Docker, Kubernetes, AWS, CI/CD', icon: '☁️', level: 'advanced', estimatedHours: 100, resourceCount: 35, exerciseCount: 20, isActive: true, createdAt: now, updatedAt: now },
    { id: 'spec-5', categoryId: 'cat-1', name: 'Cybersécurité', slug: 'cybersecurite', description: 'Sécurité informatique, ethical hacking, cryptographie', icon: '🔒', level: 'expert', estimatedHours: 180, resourceCount: 55, exerciseCount: 40, isActive: true, createdAt: now, updatedAt: now },

    // Business & Entrepreneuriat
    { id: 'spec-6', categoryId: 'cat-2', name: 'Création de Startup', slug: 'creation-startup', description: 'Lancer et développer sa startup', icon: '🚀', level: 'intermediate', estimatedHours: 80, resourceCount: 30, exerciseCount: 15, isActive: true, createdAt: now, updatedAt: now },
    { id: 'spec-7', categoryId: 'cat-2', name: 'Stratégie d\'Entreprise', slug: 'strategie-entreprise', description: 'Planification stratégique et croissance', icon: '📊', level: 'advanced', estimatedHours: 60, resourceCount: 25, exerciseCount: 12, isActive: true, createdAt: now, updatedAt: now },
    { id: 'spec-8', categoryId: 'cat-2', name: 'Vente & Négociation', slug: 'vente-negociation', description: 'Techniques de vente et négociation commerciale', icon: '🤝', level: 'intermediate', estimatedHours: 50, resourceCount: 20, exerciseCount: 18, isActive: true, createdAt: now, updatedAt: now },
    { id: 'spec-9', categoryId: 'cat-2', name: 'E-commerce', slug: 'e-commerce', description: 'Création et gestion de boutiques en ligne', icon: '🛒', level: 'beginner', estimatedHours: 70, resourceCount: 28, exerciseCount: 20, isActive: true, createdAt: now, updatedAt: now },

    // Design & Créativité
    { id: 'spec-10', categoryId: 'cat-3', name: 'UX/UI Design', slug: 'ux-ui-design', description: 'Conception d\'interfaces utilisateur', icon: '✨', level: 'intermediate', estimatedHours: 100, resourceCount: 40, exerciseCount: 25, isActive: true, createdAt: now, updatedAt: now },
    { id: 'spec-11', categoryId: 'cat-3', name: 'Design Graphique', slug: 'design-graphique', description: 'Création visuelle et identité de marque', icon: '🖌️', level: 'intermediate', estimatedHours: 90, resourceCount: 35, exerciseCount: 30, isActive: true, createdAt: now, updatedAt: now },
    { id: 'spec-12', categoryId: 'cat-3', name: 'Montage Vidéo', slug: 'montage-video', description: 'Édition vidéo et motion design', icon: '🎬', level: 'intermediate', estimatedHours: 80, resourceCount: 30, exerciseCount: 20, isActive: true, createdAt: now, updatedAt: now },
    { id: 'spec-13', categoryId: 'cat-3', name: 'Modélisation 3D', slug: 'modelisation-3d', description: 'Blender, Maya, création 3D', icon: '🎲', level: 'advanced', estimatedHours: 120, resourceCount: 38, exerciseCount: 22, isActive: true, createdAt: now, updatedAt: now },

    // Marketing & Communication
    { id: 'spec-14', categoryId: 'cat-4', name: 'Marketing Digital', slug: 'marketing-digital', description: 'SEO, SEM, publicité en ligne', icon: '📣', level: 'intermediate', estimatedHours: 70, resourceCount: 32, exerciseCount: 18, isActive: true, createdAt: now, updatedAt: now },
    { id: 'spec-15', categoryId: 'cat-4', name: 'Réseaux Sociaux', slug: 'reseaux-sociaux', description: 'Community management et stratégie sociale', icon: '📱', level: 'beginner', estimatedHours: 50, resourceCount: 25, exerciseCount: 15, isActive: true, createdAt: now, updatedAt: now },
    { id: 'spec-16', categoryId: 'cat-4', name: 'Copywriting', slug: 'copywriting', description: 'Rédaction persuasive et storytelling', icon: '✍️', level: 'intermediate', estimatedHours: 60, resourceCount: 28, exerciseCount: 25, isActive: true, createdAt: now, updatedAt: now },
    { id: 'spec-17', categoryId: 'cat-4', name: 'Content Marketing', slug: 'content-marketing', description: 'Stratégie de contenu et blogging', icon: '📝', level: 'intermediate', estimatedHours: 55, resourceCount: 22, exerciseCount: 16, isActive: true, createdAt: now, updatedAt: now },

    // Data & IA
    { id: 'spec-18', categoryId: 'cat-5', name: 'Data Science', slug: 'data-science', description: 'Analyse de données et visualisation', icon: '📊', level: 'advanced', estimatedHours: 150, resourceCount: 48, exerciseCount: 35, isActive: true, createdAt: now, updatedAt: now },
    { id: 'spec-19', categoryId: 'cat-5', name: 'Machine Learning', slug: 'machine-learning', description: 'Apprentissage automatique et modèles prédictifs', icon: '🧠', level: 'expert', estimatedHours: 200, resourceCount: 55, exerciseCount: 40, isActive: true, createdAt: now, updatedAt: now },
    { id: 'spec-20', categoryId: 'cat-5', name: 'Outils IA', slug: 'outils-ia', description: 'ChatGPT, Midjourney, outils d\'IA générative', icon: '🤖', level: 'beginner', estimatedHours: 40, resourceCount: 20, exerciseCount: 12, isActive: true, createdAt: now, updatedAt: now },

    // Finance & Comptabilité
    { id: 'spec-21', categoryId: 'cat-6', name: 'Comptabilité', slug: 'comptabilite', description: 'Comptabilité générale et analytique', icon: '📒', level: 'intermediate', estimatedHours: 80, resourceCount: 30, exerciseCount: 25, isActive: true, createdAt: now, updatedAt: now },
    { id: 'spec-22', categoryId: 'cat-6', name: 'Investissement', slug: 'investissement', description: 'Bourse, crypto, investissement personnel', icon: '📈', level: 'intermediate', estimatedHours: 60, resourceCount: 25, exerciseCount: 15, isActive: true, createdAt: now, updatedAt: now },
    { id: 'spec-23', categoryId: 'cat-6', name: 'Analyse Financière', slug: 'analyse-financiere', description: 'Analyse des états financiers et valorisation', icon: '💹', level: 'advanced', estimatedHours: 90, resourceCount: 32, exerciseCount: 20, isActive: true, createdAt: now, updatedAt: now },

    // Langues
    { id: 'spec-24', categoryId: 'cat-7', name: 'Anglais Professionnel', slug: 'anglais-professionnel', description: 'Business English et communication', icon: '🇬🇧', level: 'intermediate', estimatedHours: 100, resourceCount: 40, exerciseCount: 50, isActive: true, createdAt: now, updatedAt: now },
    { id: 'spec-25', categoryId: 'cat-7', name: 'Espagnol', slug: 'espagnol', description: 'Espagnol des affaires et conversation', icon: '🇪🇸', level: 'beginner', estimatedHours: 80, resourceCount: 35, exerciseCount: 45, isActive: true, createdAt: now, updatedAt: now },
    { id: 'spec-26', categoryId: 'cat-7', name: 'Allemand', slug: 'allemand', description: 'Allemand professionnel', icon: '🇩🇪', level: 'beginner', estimatedHours: 90, resourceCount: 30, exerciseCount: 40, isActive: true, createdAt: now, updatedAt: now },
    { id: 'spec-27', categoryId: 'cat-7', name: 'Mandarin', slug: 'mandarin', description: 'Chinois mandarin pour les affaires', icon: '🇨🇳', level: 'beginner', estimatedHours: 150, resourceCount: 28, exerciseCount: 35, isActive: true, createdAt: now, updatedAt: now },

    // Management & Leadership
    { id: 'spec-28', categoryId: 'cat-8', name: 'Gestion d\'Équipe', slug: 'gestion-equipe', description: 'Manager et motiver une équipe', icon: '👨‍💼', level: 'intermediate', estimatedHours: 50, resourceCount: 22, exerciseCount: 15, isActive: true, createdAt: now, updatedAt: now },
    { id: 'spec-29', categoryId: 'cat-8', name: 'Gestion de Projet', slug: 'gestion-projet', description: 'Méthodologies Agile, Scrum, Kanban', icon: '📋', level: 'intermediate', estimatedHours: 70, resourceCount: 30, exerciseCount: 20, isActive: true, createdAt: now, updatedAt: now },
    { id: 'spec-30', categoryId: 'cat-8', name: 'Leadership', slug: 'leadership', description: 'Développer son leadership et influence', icon: '🏆', level: 'advanced', estimatedHours: 60, resourceCount: 25, exerciseCount: 18, isActive: true, createdAt: now, updatedAt: now },
    { id: 'spec-31', categoryId: 'cat-8', name: 'Prise de Parole', slug: 'prise-parole', description: 'Communication orale et présentation', icon: '🎤', level: 'beginner', estimatedHours: 40, resourceCount: 18, exerciseCount: 22, isActive: true, createdAt: now, updatedAt: now },

    // Sciences & Ingénierie
    { id: 'spec-32', categoryId: 'cat-9', name: 'Mathématiques', slug: 'mathematiques', description: 'Algèbre, analyse, statistiques', icon: '➕', level: 'intermediate', estimatedHours: 120, resourceCount: 45, exerciseCount: 60, isActive: true, createdAt: now, updatedAt: now },
    { id: 'spec-33', categoryId: 'cat-9', name: 'Physique', slug: 'physique', description: 'Mécanique, électromagnétisme, thermodynamique', icon: '⚛️', level: 'intermediate', estimatedHours: 100, resourceCount: 38, exerciseCount: 45, isActive: true, createdAt: now, updatedAt: now },
    { id: 'spec-34', categoryId: 'cat-9', name: 'Électronique', slug: 'electronique', description: 'Circuits, Arduino, IoT', icon: '🔌', level: 'intermediate', estimatedHours: 90, resourceCount: 32, exerciseCount: 28, isActive: true, createdAt: now, updatedAt: now },
    { id: 'spec-35', categoryId: 'cat-9', name: 'Mécanique', slug: 'mecanique', description: 'Conception mécanique et CAO', icon: '⚙️', level: 'advanced', estimatedHours: 110, resourceCount: 35, exerciseCount: 25, isActive: true, createdAt: now, updatedAt: now },
    { id: 'spec-36', categoryId: 'cat-9', name: 'Chimie', slug: 'chimie', description: 'Chimie organique et inorganique', icon: '🧪', level: 'intermediate', estimatedHours: 85, resourceCount: 30, exerciseCount: 35, isActive: true, createdAt: now, updatedAt: now },

    // Santé & Bien-être
    { id: 'spec-37', categoryId: 'cat-10', name: 'Nutrition', slug: 'nutrition', description: 'Alimentation équilibrée et diététique', icon: '🥗', level: 'beginner', estimatedHours: 50, resourceCount: 25, exerciseCount: 15, isActive: true, createdAt: now, updatedAt: now },
    { id: 'spec-38', categoryId: 'cat-10', name: 'Fitness', slug: 'fitness', description: 'Entraînement sportif et musculation', icon: '💪', level: 'beginner', estimatedHours: 60, resourceCount: 30, exerciseCount: 40, isActive: true, createdAt: now, updatedAt: now },
    { id: 'spec-39', categoryId: 'cat-10', name: 'Méditation', slug: 'meditation', description: 'Mindfulness et gestion du stress', icon: '🧘', level: 'beginner', estimatedHours: 30, resourceCount: 20, exerciseCount: 25, isActive: true, createdAt: now, updatedAt: now },
    { id: 'spec-40', categoryId: 'cat-10', name: 'Psychologie', slug: 'psychologie', description: 'Comprendre le comportement humain', icon: '🧠', level: 'intermediate', estimatedHours: 80, resourceCount: 35, exerciseCount: 20, isActive: true, createdAt: now, updatedAt: now },

    // Arts & Culture
    { id: 'spec-41', categoryId: 'cat-11', name: 'Photographie', slug: 'photographie', description: 'Techniques photo et retouche', icon: '📷', level: 'beginner', estimatedHours: 70, resourceCount: 32, exerciseCount: 28, isActive: true, createdAt: now, updatedAt: now },
    { id: 'spec-42', categoryId: 'cat-11', name: 'Musique', slug: 'musique', description: 'Théorie musicale et instruments', icon: '🎵', level: 'beginner', estimatedHours: 100, resourceCount: 40, exerciseCount: 50, isActive: true, createdAt: now, updatedAt: now },
    { id: 'spec-43', categoryId: 'cat-11', name: 'Écriture Créative', slug: 'ecriture-creative', description: 'Roman, poésie, scénario', icon: '📖', level: 'intermediate', estimatedHours: 80, resourceCount: 28, exerciseCount: 35, isActive: true, createdAt: now, updatedAt: now },
    { id: 'spec-44', categoryId: 'cat-11', name: 'Dessin', slug: 'dessin', description: 'Techniques de dessin et illustration', icon: '✏️', level: 'beginner', estimatedHours: 90, resourceCount: 35, exerciseCount: 45, isActive: true, createdAt: now, updatedAt: now },
    { id: 'spec-45', categoryId: 'cat-11', name: 'Histoire de l\'Art', slug: 'histoire-art', description: 'Mouvements artistiques et analyse', icon: '🖼️', level: 'beginner', estimatedHours: 60, resourceCount: 30, exerciseCount: 15, isActive: true, createdAt: now, updatedAt: now },

    // Droit & Administration
    { id: 'spec-46', categoryId: 'cat-12', name: 'Droit des Affaires', slug: 'droit-affaires', description: 'Droit commercial et des sociétés', icon: '⚖️', level: 'advanced', estimatedHours: 100, resourceCount: 38, exerciseCount: 25, isActive: true, createdAt: now, updatedAt: now },
    { id: 'spec-47', categoryId: 'cat-12', name: 'Droit du Travail', slug: 'droit-travail', description: 'Contrats, licenciement, négociation', icon: '📜', level: 'intermediate', estimatedHours: 70, resourceCount: 28, exerciseCount: 18, isActive: true, createdAt: now, updatedAt: now },
    { id: 'spec-48', categoryId: 'cat-12', name: 'Ressources Humaines', slug: 'ressources-humaines', description: 'Recrutement, formation, gestion RH', icon: '👥', level: 'intermediate', estimatedHours: 65, resourceCount: 25, exerciseCount: 20, isActive: true, createdAt: now, updatedAt: now },
    { id: 'spec-49', categoryId: 'cat-12', name: 'Administration Publique', slug: 'administration-publique', description: 'Fonctionnement des institutions', icon: '🏛️', level: 'intermediate', estimatedHours: 55, resourceCount: 22, exerciseCount: 12, isActive: true, createdAt: now, updatedAt: now }
  ]

  await db.specialties.bulkAdd(defaultSpecialties)

  // ========== STATS ADMIN INITIALES ==========
  const initialStats: DBAdminStats = {
    id: 'current',
    totalUsers: 2,
    activeUsers: 2,
    totalPosts: 0,
    totalDiscussions: 0,
    totalReports: 0,
    pendingReports: 0,
    totalContent: 0,
    dailyUserSnapshots: [{ date: getTodayDateString(), count: 2 }],
    updatedAt: now
  }

  await db.adminStats.add(initialStats)

  console.log(`Seeded: ${defaultUsers.length} users, ${defaultCategories.length} categories, ${defaultSpecialties.length} specialties`)
}

/**
 * Efface toutes les données de la base
 */
export async function clearDatabase(): Promise<void> {
  await db.users.clear()
  await db.categories.clear()
  await db.specialties.clear()
  await db.posts.clear()
  await db.comments.clear()
  await db.discussions.clear()
  await db.discussionReplies.clear()
  await db.notifications.clear()
  await db.reports.clear()
  await db.contents.clear()
  await db.userData.clear()
  await db.activityEvents.clear()
  await db.dailyActivityRecords.clear()
  await db.adminStats.clear()
  await db.settings.clear()
  await db.sessions.clear()
  console.log('Database cleared')
}

/**
 * Réinitialise la base avec les données par défaut
 */
export async function resetDatabase(): Promise<void> {
  await clearDatabase()
  await seedDefaultData()
  console.log('Database reset complete')
}

