/**
 * Types principaux pour Work Us
 * Ces types définissent la structure des données de l'application
 */

// ============================================
// AUTHENTIFICATION & RÔLES
// ============================================

export type UserRole = 'user' | 'creator' | 'moderator' | 'admin';

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  role: UserRole;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  role?: UserRole;
}

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Permissions par rôle
export interface RolePermissions {
  canViewContent: boolean;
  canCreateContent: boolean;
  canEditOwnContent: boolean;
  canDeleteOwnContent: boolean;
  canModerateContent: boolean;
  canManageUsers: boolean;
  canManageCategories: boolean;
  canManageSettings: boolean;
  canViewAnalytics: boolean;
  canAccessAdminPanel: boolean;
}

export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  user: {
    canViewContent: true,
    canCreateContent: false,
    canEditOwnContent: false,
    canDeleteOwnContent: false,
    canModerateContent: false,
    canManageUsers: false,
    canManageCategories: false,
    canManageSettings: false,
    canViewAnalytics: false,
    canAccessAdminPanel: false,
  },
  creator: {
    canViewContent: true,
    canCreateContent: true,
    canEditOwnContent: true,
    canDeleteOwnContent: true,
    canModerateContent: false,
    canManageUsers: false,
    canManageCategories: false,
    canManageSettings: false,
    canViewAnalytics: true,
    canAccessAdminPanel: false,
  },
  moderator: {
    canViewContent: true,
    canCreateContent: true,
    canEditOwnContent: true,
    canDeleteOwnContent: true,
    canModerateContent: true,
    canManageUsers: false,
    canManageCategories: false,
    canManageSettings: false,
    canViewAnalytics: true,
    canAccessAdminPanel: true,
  },
  admin: {
    canViewContent: true,
    canCreateContent: true,
    canEditOwnContent: true,
    canDeleteOwnContent: true,
    canModerateContent: true,
    canManageUsers: true,
    canManageCategories: true,
    canManageSettings: true,
    canViewAnalytics: true,
    canAccessAdminPanel: true,
  },
};

// ============================================
// UTILISATEUR
// ============================================

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  avatar?: string;
  bio?: string;
  isActive: boolean;
  isVerified: boolean;
  joinedAt: string;
  lastLoginAt?: string;
  skills: UserSkill[];
  followers: number;
  following: number;
  savedContent: string[];
}

export interface UserSkill {
  skillId: string;
  level: number; // 0-10
  hoursWorked: number;
  lastPracticed: string;
  exercisesCompleted: number;
}

// ============================================
// CATÉGORIES & SPÉCIALITÉS
// ============================================

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
  gradient: string;
  specialties: string[]; // IDs des spécialités
  image?: string;
}

export interface Specialty {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  icon: string;
  skills?: Skill[];
  prerequisites?: string[];
  tags?: string[];
  image?: string;
}

export interface Skill {
  id: string;
  specialtyId: string;
  name: string;
  description: string;
  level: 'fundamental' | 'intermediate' | 'advanced';
  resources: Resource[];
  exercises: Exercise[];
}

// ============================================
// RESSOURCES
// ============================================

export interface Resource {
  id: string;
  type: 'video' | 'book' | 'article' | 'course' | 'podcast' | 'tool';
  title: string;
  description: string;
  author: string;
  url?: string;
  thumbnail?: string;
  duration?: string; // Pour vidéos/podcasts
  pages?: number; // Pour livres
  isPaid: boolean;
  price?: number;
  rating: number;
  reviewsCount: number;
  language: string;
  tags: string[];
}

export interface Video extends Resource {
  type: 'video';
  duration: string;
  platform: 'youtube' | 'vimeo' | 'workus' | 'udemy' | 'coursera';
  embedUrl?: string;
}

export interface Book extends Resource {
  type: 'book';
  pages: number;
  isbn?: string;
  publisher?: string;
  publishedYear?: number;
}

export interface Course extends Resource {
  type: 'course';
  platform: string;
  modules: number;
  certificateIncluded: boolean;
  enrolledCount: number;
}

// ============================================
// EXERCICES
// ============================================

export interface Exercise {
  id: string;
  skillId: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'challenge';
  type: 'practice' | 'project' | 'quiz' | 'coding' | 'design';
  estimatedMinutes: number;
  points: number;
  instructions: string[];
  hints?: string[];
  resources?: string[];
  completedBy: number;
  successRate: number;
}

// ============================================
// DISCUSSIONS & SOCIAL
// ============================================

export interface Discussion {
  id: string;
  authorId: string;
  title: string;
  content: string;
  type: 'question' | 'idea' | 'announcement' | 'job' | 'help';
  categoryId?: string;
  specialtyId?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  likes: number;
  commentsCount: number;
  views: number;
  isPinned: boolean;
  isSolved?: boolean;
}

export interface Comment {
  id: string;
  discussionId: string;
  authorId: string;
  content: string;
  createdAt: string;
  likes: number;
  replies?: Comment[];
  isAcceptedAnswer?: boolean;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
  isRead: boolean;
}

// ============================================
// FEED & CONTENU
// ============================================

export interface FeedItem {
  id: string;
  type: 'post' | 'achievement' | 'milestone' | 'recommendation' | 'announcement';
  authorId?: string;
  content: string;
  media?: string[];
  relatedSkillId?: string;
  relatedSpecialtyId?: string;
  createdAt: string;
  likes: number;
  commentsCount: number;
  isSponsored?: boolean;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: 'skill' | 'streak' | 'social' | 'special';
  requirement: string;
  unlockedAt?: string;
}

// ============================================
// ABONNEMENTS & CRÉATEURS
// ============================================

export interface Creator {
  id: string;
  userId: string;
  displayName: string;
  bio: string;
  avatar: string;
  coverImage?: string;
  specialties: string[];
  contentCount: number;
  subscribersCount: number;
  rating: number;
  isVerified: boolean;
  joinedAt: string;
}

export interface Subscription {
  id: string;
  userId: string;
  creatorId: string;
  tier: 'free' | 'basic' | 'premium';
  startedAt: string;
  expiresAt?: string;
  isActive: boolean;
}

// ============================================
// STATISTIQUES
// ============================================

export interface UserStats {
  totalHoursLearned: number;
  skillsWorkedOn: number;
  exercisesCompleted: number;
  currentStreak: number;
  longestStreak: number;
  achievementsUnlocked: number;
  weeklyProgress: WeeklyProgress[];
  topSkills: { skillId: string; hours: number }[];
}

export interface WeeklyProgress {
  weekStart: string;
  hoursLearned: number;
  exercisesCompleted: number;
  newSkillsStarted: number;
}

// ============================================
// NOTIFICATIONS
// ============================================

export interface Notification {
  id: string;
  userId: string;
  type: 'like' | 'comment' | 'follow' | 'mention' | 'achievement' | 'recommendation' | 'message' | 'system';
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

// ============================================
// NAVIGATION & UI
// ============================================

export interface MenuItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  badge?: number;
  children?: MenuItem[];
}

export interface SearchResult {
  id: string;
  type: 'category' | 'specialty' | 'skill' | 'user' | 'discussion' | 'resource';
  title: string;
  description: string;
  url: string;
  thumbnail?: string;
}

// ============================================
// ADMINISTRATION
// ============================================

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalCreators: number;
  totalContent: number;
  totalCategories: number;
  totalSpecialties: number;
  pendingReports: number;
  newUsersThisWeek: number;
  contentThisWeek: number;
}

export interface UserContent {
  id: string;
  type: 'article' | 'video' | 'exercise' | 'quiz';
  title: string;
  description: string;
  authorId: string;
  categoryId?: string;
  specialtyId?: string;
  status: 'draft' | 'pending' | 'published' | 'rejected' | 'archived';
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  views: number;
  likes: number;
  commentsCount: number;
  tags: string[];
  media?: string[];
}

export interface Report {
  id: string;
  type: 'content' | 'user' | 'comment';
  targetId: string;
  reporterId: string;
  reason: 'spam' | 'inappropriate' | 'harassment' | 'copyright' | 'other';
  description?: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  action?: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  targetType: 'user' | 'content' | 'category' | 'settings';
  targetId: string;
  details?: string;
  ipAddress?: string;
  createdAt: string;
}

export interface SiteSettings {
  siteName: string;
  siteDescription: string;
  maintenanceMode: boolean;
  registrationEnabled: boolean;
  contentModerationEnabled: boolean;
  maxUploadSize: number;
  allowedFileTypes: string[];
  defaultUserRole: UserRole;
  emailNotificationsEnabled: boolean;
}

