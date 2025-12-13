import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'

/**
 * Types pour la gestion de contenu
 */
export interface Category {
  id: string
  name: string
  slug: string
  description: string
  icon: string
  color: string
  gradient: string
  isActive: boolean
}

export interface Specialty {
  id: string
  categoryId: string
  name: string
  slug: string
  description: string
  icon: string
  isActive: boolean
}

export interface Content {
  id: string
  title: string
  description: string
  type: 'article' | 'video' | 'tutorial' | 'course' | 'resource' | 'exercise' | 'quiz'
  authorId: string
  authorName: string
  categoryId: string
  specialtyId: string
  tags: string[]
  thumbnail?: string
  content: string
  views: number
  likes: string[]
  status: 'draft' | 'published' | 'archived'
  createdAt: string
  updatedAt?: string
  publishedAt?: string
}

interface ContentManagementContextType {
  // Categories
  categories: Category[]
  addCategory: (category: Omit<Category, 'id'>) => void
  updateCategory: (id: string, updates: Partial<Category>) => void
  deleteCategory: (id: string) => void
  getCategoryById: (id: string) => Category | undefined
  
  // Specialties
  specialties: Specialty[]
  addSpecialty: (specialty: Omit<Specialty, 'id'>) => void
  updateSpecialty: (id: string, updates: Partial<Specialty>) => void
  deleteSpecialty: (id: string) => void
  getSpecialtyById: (id: string) => Specialty | undefined
  getSpecialtiesByCategory: (categoryId: string) => Specialty[]
  
  // Contents
  contents: Content[]
  addContent: (content: Omit<Content, 'id' | 'createdAt' | 'views' | 'likes'>) => void
  updateContent: (id: string, updates: Partial<Content>) => void
  deleteContent: (id: string) => void
  publishContent: (id: string) => void
  archiveContent: (id: string) => void
  incrementViews: (id: string) => void
  likeContent: (contentId: string, userId: string) => void
  unlikeContent: (contentId: string, userId: string) => void
  getContentById: (id: string) => Content | undefined
  getContentByAuthor: (authorId: string) => Content[]
  getContentByCategory: (categoryId: string) => Content[]
  getContentBySpecialty: (specialtyId: string) => Content[]
  getPublishedContent: () => Content[]
  getPendingContent: () => Content[]
  searchContent: (query: string) => Content[]
  getTotalContentCount: () => number
  pendingContent: Content[]
}

const CATEGORIES_STORAGE_KEY = 'workus_categories'
const SPECIALTIES_STORAGE_KEY = 'workus_specialties'
const CONTENT_STORAGE_KEY = 'workus_content'

// Catégories par défaut
const defaultCategories: Category[] = [
  {
    id: 'cat-construire',
    name: 'Construire & Réparer',
    slug: 'construire-reparer',
    description: 'Tout ce qui touche au concret, aux mains, aux infrastructures',
    icon: '🔨',
    color: 'orange',
    gradient: 'from-orange-500 to-amber-500',
    isActive: true
  },
  {
    id: 'cat-produire',
    name: 'Produire & Transformer',
    slug: 'produire-transformer',
    description: 'Fabrication, industrie, transformation de matière',
    icon: '⚙️',
    color: 'slate',
    gradient: 'from-slate-500 to-zinc-500',
    isActive: true
  },
  {
    id: 'cat-numerique',
    name: 'Numérique & Technologie',
    slug: 'numerique-technologie',
    description: 'Créer, coder, maintenir des systèmes numériques',
    icon: '💻',
    color: 'blue',
    gradient: 'from-blue-500 to-cyan-500',
    isActive: true
  },
  {
    id: 'cat-creer',
    name: 'Créer & Designer',
    slug: 'creer-designer',
    description: 'Tout ce qui est visuel, créatif, artistique',
    icon: '🎨',
    color: 'pink',
    gradient: 'from-pink-500 to-rose-500',
    isActive: true
  },
  {
    id: 'cat-communiquer',
    name: 'Communiquer & Vendre',
    slug: 'communiquer-vendre',
    description: 'Faire connaître, convaincre, développer un marché',
    icon: '📢',
    color: 'green',
    gradient: 'from-green-500 to-emerald-500',
    isActive: true
  },
  {
    id: 'cat-gerer',
    name: 'Gérer & Organiser',
    slug: 'gerer-organiser',
    description: 'Piloter, structurer, faire fonctionner',
    icon: '📊',
    color: 'purple',
    gradient: 'from-purple-500 to-violet-500',
    isActive: true
  },
  {
    id: 'cat-soigner',
    name: 'Soigner & Accompagner',
    slug: 'soigner-accompagner',
    description: 'Santé, bien-être, aide à la personne',
    icon: '❤️',
    color: 'red',
    gradient: 'from-red-500 to-rose-500',
    isActive: true
  },
  {
    id: 'cat-apprendre',
    name: 'Apprendre & Transmettre',
    slug: 'apprendre-transmettre',
    description: 'Éducation, formation, pédagogie',
    icon: '📚',
    color: 'indigo',
    gradient: 'from-indigo-500 to-blue-500',
    isActive: true
  },
  {
    id: 'cat-proteger',
    name: 'Protéger & Sécuriser',
    slug: 'proteger-securiser',
    description: 'Sécurité, défense, prévention',
    icon: '🛡️',
    color: 'gray',
    gradient: 'from-gray-600 to-slate-600',
    isActive: true
  },
  {
    id: 'cat-deplacer',
    name: 'Se Déplacer & Distribuer',
    slug: 'se-deplacer-distribuer',
    description: 'Transport, mobilité, logistique',
    icon: '🚚',
    color: 'yellow',
    gradient: 'from-yellow-500 to-amber-500',
    isActive: true
  },
  {
    id: 'cat-accueillir',
    name: 'Accueillir & Servir',
    slug: 'accueillir-servir',
    description: 'Relation humaine, services, accueil',
    icon: '🤝',
    color: 'teal',
    gradient: 'from-teal-500 to-cyan-500',
    isActive: true
  },
  {
    id: 'cat-innover',
    name: 'Innover & Entreprendre',
    slug: 'innover-entreprendre',
    description: 'Créer de nouveaux projets, inventer l\'avenir',
    icon: '🚀',
    color: 'fuchsia',
    gradient: 'from-fuchsia-500 to-purple-500',
    isActive: true
  }
]

// Spécialités par défaut
const defaultSpecialties: Specialty[] = [
  // 1. Construire & Réparer
  { id: 'spec-maconnerie', categoryId: 'cat-construire', name: 'Maçonnerie', slug: 'maconnerie', description: 'Construction et rénovation de structures en maçonnerie', icon: '🧱', isActive: true },
  { id: 'spec-electricite', categoryId: 'cat-construire', name: 'Électricité', slug: 'electricite', description: 'Installation et maintenance électrique', icon: '⚡', isActive: true },
  { id: 'spec-plomberie', categoryId: 'cat-construire', name: 'Plomberie / Chauffage', slug: 'plomberie-chauffage', description: 'Installations sanitaires et systèmes de chauffage', icon: '🔧', isActive: true },
  { id: 'spec-charpente', categoryId: 'cat-construire', name: 'Charpente / Couverture', slug: 'charpente-couverture', description: 'Construction de charpentes et toitures', icon: '🏠', isActive: true },
  { id: 'spec-peinture', categoryId: 'cat-construire', name: 'Peinture & finitions', slug: 'peinture-finitions', description: 'Travaux de peinture et finitions intérieures', icon: '🖌️', isActive: true },
  { id: 'spec-travaux-publics', categoryId: 'cat-construire', name: 'Travaux publics', slug: 'travaux-publics', description: 'Construction d\'infrastructures publiques', icon: '🏗️', isActive: true },
  { id: 'spec-maintenance-ind', categoryId: 'cat-construire', name: 'Maintenance industrielle', slug: 'maintenance-industrielle', description: 'Entretien et réparation d\'équipements industriels', icon: '🔩', isActive: true },
  { id: 'spec-maintenance-bat', categoryId: 'cat-construire', name: 'Maintenance bâtiment', slug: 'maintenance-batiment', description: 'Entretien général des bâtiments', icon: '🏢', isActive: true },
  { id: 'spec-soudure', categoryId: 'cat-construire', name: 'Soudure / métallurgie', slug: 'soudure-metallurgie', description: 'Travaux de soudure et métallurgie', icon: '🔥', isActive: true },
  { id: 'spec-menuiserie', categoryId: 'cat-construire', name: 'Menuiserie', slug: 'menuiserie', description: 'Fabrication et pose d\'ouvrages en bois', icon: '🪵', isActive: true },

  // 2. Produire & Transformer
  { id: 'spec-production-ind', categoryId: 'cat-produire', name: 'Production industrielle', slug: 'production-industrielle', description: 'Gestion de la production en industrie', icon: '🏭', isActive: true },
  { id: 'spec-usinage', categoryId: 'cat-produire', name: 'Usinage', slug: 'usinage', description: 'Fabrication de pièces par enlèvement de matière', icon: '⚙️', isActive: true },
  { id: 'spec-chaudronnerie', categoryId: 'cat-produire', name: 'Chaudronnerie', slug: 'chaudronnerie', description: 'Fabrication d\'ensembles chaudronnés', icon: '🔨', isActive: true },
  { id: 'spec-assemblage', categoryId: 'cat-produire', name: 'Assemblage', slug: 'assemblage', description: 'Montage et assemblage de composants', icon: '🔧', isActive: true },
  { id: 'spec-automatisation', categoryId: 'cat-produire', name: 'Automatisation', slug: 'automatisation', description: 'Systèmes automatisés et robotique', icon: '🤖', isActive: true },
  { id: 'spec-qualite-ind', categoryId: 'cat-produire', name: 'Qualité industrielle', slug: 'qualite-industrielle', description: 'Contrôle qualité en production', icon: '✅', isActive: true },
  { id: 'spec-methodes-ind', categoryId: 'cat-produire', name: 'Méthodes industrielles', slug: 'methodes-industrielles', description: 'Optimisation des processus de fabrication', icon: '📋', isActive: true },
  { id: 'spec-logistique-prod', categoryId: 'cat-produire', name: 'Logistique de production', slug: 'logistique-production', description: 'Gestion des flux en production', icon: '📦', isActive: true },

  // 3. Numérique & Technologie
  { id: 'spec-dev-web', categoryId: 'cat-numerique', name: 'Développement web', slug: 'developpement-web', description: 'Création de sites et applications web', icon: '🌐', isActive: true },
  { id: 'spec-dev-logiciel', categoryId: 'cat-numerique', name: 'Développement logiciel', slug: 'developpement-logiciel', description: 'Conception et développement de logiciels', icon: '💾', isActive: true },
  { id: 'spec-dev-mobile', categoryId: 'cat-numerique', name: 'Développement mobile', slug: 'developpement-mobile', description: 'Applications iOS et Android', icon: '📱', isActive: true },
  { id: 'spec-admin-sys', categoryId: 'cat-numerique', name: 'Administration systèmes & réseaux', slug: 'administration-systemes-reseaux', description: 'Gestion des infrastructures IT', icon: '🖥️', isActive: true },
  { id: 'spec-data', categoryId: 'cat-numerique', name: 'Data & analyse', slug: 'data-analyse', description: 'Analyse de données et business intelligence', icon: '📊', isActive: true },
  { id: 'spec-ia', categoryId: 'cat-numerique', name: 'Intelligence artificielle', slug: 'intelligence-artificielle', description: 'Machine learning et IA', icon: '🧠', isActive: true },
  { id: 'spec-cybersecurite', categoryId: 'cat-numerique', name: 'Cybersécurité', slug: 'cybersecurite', description: 'Protection des systèmes informatiques', icon: '🔒', isActive: true },
  { id: 'spec-cloud-devops', categoryId: 'cat-numerique', name: 'Cloud & DevOps', slug: 'cloud-devops', description: 'Infrastructure cloud et automatisation', icon: '☁️', isActive: true },
  { id: 'spec-support-info', categoryId: 'cat-numerique', name: 'Support informatique', slug: 'support-informatique', description: 'Assistance et maintenance informatique', icon: '🛠️', isActive: true },

  // 4. Créer & Designer
  { id: 'spec-design-graphique', categoryId: 'cat-creer', name: 'Design graphique', slug: 'design-graphique', description: 'Création visuelle et identité de marque', icon: '🎨', isActive: true },
  { id: 'spec-ux-ui', categoryId: 'cat-creer', name: 'UX / UI design', slug: 'ux-ui-design', description: 'Conception d\'expériences utilisateur', icon: '✨', isActive: true },
  { id: 'spec-motion', categoryId: 'cat-creer', name: 'Motion design', slug: 'motion-design', description: 'Animation et graphisme animé', icon: '🎬', isActive: true },
  { id: 'spec-illustration', categoryId: 'cat-creer', name: 'Illustration', slug: 'illustration', description: 'Dessin et illustration artistique', icon: '✏️', isActive: true },
  { id: 'spec-audiovisuel', categoryId: 'cat-creer', name: 'Audiovisuel', slug: 'audiovisuel', description: 'Production vidéo et audio', icon: '🎥', isActive: true },
  { id: 'spec-photographie', categoryId: 'cat-creer', name: 'Photographie', slug: 'photographie', description: 'Prise de vue et retouche photo', icon: '📷', isActive: true },
  { id: 'spec-direction-artistique', categoryId: 'cat-creer', name: 'Direction artistique', slug: 'direction-artistique', description: 'Supervision créative de projets', icon: '🎭', isActive: true },
  { id: 'spec-creation-contenu', categoryId: 'cat-creer', name: 'Création de contenu', slug: 'creation-contenu', description: 'Production de contenus multimédias', icon: '📝', isActive: true },

  // 5. Communiquer & Vendre
  { id: 'spec-vente', categoryId: 'cat-communiquer', name: 'Vente & commerce', slug: 'vente-commerce', description: 'Techniques de vente et négociation', icon: '💼', isActive: true },
  { id: 'spec-marketing-digital', categoryId: 'cat-communiquer', name: 'Marketing digital', slug: 'marketing-digital', description: 'Stratégies marketing en ligne', icon: '📈', isActive: true },
  { id: 'spec-communication', categoryId: 'cat-communiquer', name: 'Communication', slug: 'communication', description: 'Communication d\'entreprise et RP', icon: '📣', isActive: true },
  { id: 'spec-community', categoryId: 'cat-communiquer', name: 'Community management', slug: 'community-management', description: 'Animation de communautés en ligne', icon: '👥', isActive: true },
  { id: 'spec-growth', categoryId: 'cat-communiquer', name: 'Growth marketing', slug: 'growth-marketing', description: 'Stratégies de croissance rapide', icon: '🚀', isActive: true },
  { id: 'spec-ecommerce', categoryId: 'cat-communiquer', name: 'E-commerce', slug: 'e-commerce', description: 'Vente en ligne et marketplaces', icon: '🛒', isActive: true },
  { id: 'spec-relation-client', categoryId: 'cat-communiquer', name: 'Relation client', slug: 'relation-client', description: 'Gestion de la relation client', icon: '🤝', isActive: true },
  { id: 'spec-business-dev', categoryId: 'cat-communiquer', name: 'Business development', slug: 'business-development', description: 'Développement commercial', icon: '📊', isActive: true },

  // 6. Gérer & Organiser
  { id: 'spec-gestion-entreprise', categoryId: 'cat-gerer', name: 'Gestion d\'entreprise', slug: 'gestion-entreprise', description: 'Direction et management général', icon: '🏢', isActive: true },
  { id: 'spec-comptabilite', categoryId: 'cat-gerer', name: 'Comptabilité', slug: 'comptabilite', description: 'Tenue des comptes et fiscalité', icon: '📒', isActive: true },
  { id: 'spec-finance', categoryId: 'cat-gerer', name: 'Finance', slug: 'finance', description: 'Gestion financière et investissement', icon: '💰', isActive: true },
  { id: 'spec-rh', categoryId: 'cat-gerer', name: 'Ressources humaines', slug: 'ressources-humaines', description: 'Gestion du personnel et recrutement', icon: '👔', isActive: true },
  { id: 'spec-management', categoryId: 'cat-gerer', name: 'Management', slug: 'management', description: 'Encadrement et leadership d\'équipe', icon: '👨‍💼', isActive: true },
  { id: 'spec-strategie', categoryId: 'cat-gerer', name: 'Stratégie', slug: 'strategie', description: 'Planification stratégique', icon: '🎯', isActive: true },
  { id: 'spec-administration', categoryId: 'cat-gerer', name: 'Administration', slug: 'administration', description: 'Gestion administrative', icon: '📋', isActive: true },
  { id: 'spec-achats', categoryId: 'cat-gerer', name: 'Achats & supply chain', slug: 'achats-supply-chain', description: 'Approvisionnement et chaîne logistique', icon: '🔗', isActive: true },
  { id: 'spec-gestion-projet', categoryId: 'cat-gerer', name: 'Gestion de projet', slug: 'gestion-projet', description: 'Pilotage de projets', icon: '📅', isActive: true },

  // 7. Soigner & Accompagner
  { id: 'spec-medecine', categoryId: 'cat-soigner', name: 'Médecine', slug: 'medecine', description: 'Pratique médicale et spécialités', icon: '⚕️', isActive: true },
  { id: 'spec-soins-infirmiers', categoryId: 'cat-soigner', name: 'Soins infirmiers', slug: 'soins-infirmiers', description: 'Soins et accompagnement des patients', icon: '💉', isActive: true },
  { id: 'spec-aide-soignant', categoryId: 'cat-soigner', name: 'Aide-soignant', slug: 'aide-soignant', description: 'Assistance aux soins quotidiens', icon: '🩺', isActive: true },
  { id: 'spec-kine', categoryId: 'cat-soigner', name: 'Kinésithérapie', slug: 'kinesitherapie', description: 'Rééducation et soins physiques', icon: '💪', isActive: true },
  { id: 'spec-psychologie', categoryId: 'cat-soigner', name: 'Psychologie', slug: 'psychologie', description: 'Accompagnement psychologique', icon: '🧠', isActive: true },
  { id: 'spec-bien-etre', categoryId: 'cat-soigner', name: 'Bien-être', slug: 'bien-etre', description: 'Soins de bien-être et relaxation', icon: '🧘', isActive: true },
  { id: 'spec-nutrition', categoryId: 'cat-soigner', name: 'Nutrition', slug: 'nutrition', description: 'Diététique et nutrition', icon: '🥗', isActive: true },
  { id: 'spec-accompagnement-social', categoryId: 'cat-soigner', name: 'Accompagnement social', slug: 'accompagnement-social', description: 'Aide et accompagnement social', icon: '🤲', isActive: true },

  // 8. Apprendre & Transmettre
  { id: 'spec-enseignement', categoryId: 'cat-apprendre', name: 'Enseignement', slug: 'enseignement', description: 'Éducation scolaire et universitaire', icon: '👨‍🏫', isActive: true },
  { id: 'spec-formation-pro', categoryId: 'cat-apprendre', name: 'Formation professionnelle', slug: 'formation-professionnelle', description: 'Formation continue et professionnelle', icon: '📖', isActive: true },
  { id: 'spec-coaching', categoryId: 'cat-apprendre', name: 'Coaching', slug: 'coaching', description: 'Accompagnement personnalisé', icon: '🎯', isActive: true },
  { id: 'spec-tutorat', categoryId: 'cat-apprendre', name: 'Tutorat', slug: 'tutorat', description: 'Soutien scolaire et mentorat', icon: '📚', isActive: true },
  { id: 'spec-orientation', categoryId: 'cat-apprendre', name: 'Orientation', slug: 'orientation', description: 'Conseil en orientation professionnelle', icon: '🧭', isActive: true },
  { id: 'spec-pedagogie-num', categoryId: 'cat-apprendre', name: 'Pédagogie numérique', slug: 'pedagogie-numerique', description: 'E-learning et outils pédagogiques', icon: '💻', isActive: true },

  // 9. Protéger & Sécuriser
  { id: 'spec-securite-privee', categoryId: 'cat-proteger', name: 'Sécurité privée', slug: 'securite-privee', description: 'Surveillance et protection privée', icon: '🔐', isActive: true },
  { id: 'spec-forces-ordre', categoryId: 'cat-proteger', name: 'Forces de l\'ordre', slug: 'forces-ordre', description: 'Police, gendarmerie et défense', icon: '👮', isActive: true },
  { id: 'spec-securite-incendie', categoryId: 'cat-proteger', name: 'Sécurité incendie', slug: 'securite-incendie', description: 'Prévention et lutte contre l\'incendie', icon: '🚒', isActive: true },
  { id: 'spec-cyber-operationnelle', categoryId: 'cat-proteger', name: 'Cybersécurité opérationnelle', slug: 'cybersecurite-operationnelle', description: 'Sécurité des systèmes en temps réel', icon: '🛡️', isActive: true },
  { id: 'spec-prevention-risques', categoryId: 'cat-proteger', name: 'Prévention des risques', slug: 'prevention-risques', description: 'Analyse et prévention des risques', icon: '⚠️', isActive: true },
  { id: 'spec-protection-personnes', categoryId: 'cat-proteger', name: 'Protection des personnes', slug: 'protection-personnes', description: 'Garde du corps et protection rapprochée', icon: '🦺', isActive: true },

  // 10. Se Déplacer & Distribuer
  { id: 'spec-transport-routier', categoryId: 'cat-deplacer', name: 'Transport routier', slug: 'transport-routier', description: 'Conduite et transport de marchandises', icon: '🚛', isActive: true },
  { id: 'spec-logistique', categoryId: 'cat-deplacer', name: 'Logistique', slug: 'logistique', description: 'Gestion des stocks et entrepôts', icon: '📦', isActive: true },
  { id: 'spec-supply-chain', categoryId: 'cat-deplacer', name: 'Supply chain', slug: 'supply-chain', description: 'Chaîne d\'approvisionnement', icon: '🔗', isActive: true },
  { id: 'spec-livraison', categoryId: 'cat-deplacer', name: 'Livraison', slug: 'livraison', description: 'Services de livraison', icon: '📬', isActive: true },
  { id: 'spec-exploitation-transport', categoryId: 'cat-deplacer', name: 'Exploitation transport', slug: 'exploitation-transport', description: 'Gestion des flottes et planification', icon: '🗺️', isActive: true },
  { id: 'spec-mobilite-urbaine', categoryId: 'cat-deplacer', name: 'Mobilité urbaine', slug: 'mobilite-urbaine', description: 'Solutions de mobilité en ville', icon: '🚇', isActive: true },

  // 11. Accueillir & Servir
  { id: 'spec-hotellerie', categoryId: 'cat-accueillir', name: 'Hôtellerie', slug: 'hotellerie', description: 'Accueil et services hôteliers', icon: '🏨', isActive: true },
  { id: 'spec-restauration', categoryId: 'cat-accueillir', name: 'Restauration', slug: 'restauration', description: 'Cuisine et service en salle', icon: '🍽️', isActive: true },
  { id: 'spec-tourisme', categoryId: 'cat-accueillir', name: 'Tourisme', slug: 'tourisme', description: 'Agences de voyage et guides', icon: '✈️', isActive: true },
  { id: 'spec-service-client', categoryId: 'cat-accueillir', name: 'Service client', slug: 'service-client', description: 'Support et satisfaction client', icon: '📞', isActive: true },
  { id: 'spec-evenementiel', categoryId: 'cat-accueillir', name: 'Événementiel', slug: 'evenementiel', description: 'Organisation d\'événements', icon: '🎉', isActive: true },
  { id: 'spec-metiers-bouche', categoryId: 'cat-accueillir', name: 'Métiers de bouche', slug: 'metiers-bouche', description: 'Boulangerie, pâtisserie, traiteur', icon: '🥐', isActive: true },

  // 12. Innover & Entreprendre
  { id: 'spec-entrepreneuriat', categoryId: 'cat-innover', name: 'Entrepreneuriat', slug: 'entrepreneuriat', description: 'Création et gestion d\'entreprise', icon: '💡', isActive: true },
  { id: 'spec-startups', categoryId: 'cat-innover', name: 'Startups', slug: 'startups', description: 'Écosystème startup et levée de fonds', icon: '🦄', isActive: true },
  { id: 'spec-innovation', categoryId: 'cat-innover', name: 'Innovation', slug: 'innovation', description: 'R&D et innovation produit', icon: '🔬', isActive: true },
  { id: 'spec-produits-num', categoryId: 'cat-innover', name: 'Produits numériques', slug: 'produits-numeriques', description: 'Création de produits digitaux', icon: '📲', isActive: true },
  { id: 'spec-transition-eco', categoryId: 'cat-innover', name: 'Transition écologique', slug: 'transition-ecologique', description: 'Développement durable et RSE', icon: '🌱', isActive: true },
  { id: 'spec-metiers-futur', categoryId: 'cat-innover', name: 'Métiers du futur', slug: 'metiers-futur', description: 'Nouvelles professions émergentes', icon: '🔮', isActive: true },
]

const ContentManagementContext = createContext<ContentManagementContextType | undefined>(undefined)

/**
 * ContentManagementProvider - Gère les catégories, spécialités et contenus
 */
export function ContentManagementProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<Category[]>([])
  const [specialties, setSpecialties] = useState<Specialty[]>([])
  const [contents, setContents] = useState<Content[]>([])

  // Charger les données au démarrage
  useEffect(() => {
    const storedCategories = localStorage.getItem(CATEGORIES_STORAGE_KEY)
    if (storedCategories) {
      try {
        const parsed = JSON.parse(storedCategories)
        // Si vide ou moins de catégories que les défauts, charger les défauts
        if (parsed.length === 0 || parsed.length < defaultCategories.length) {
          setCategories(defaultCategories)
          localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(defaultCategories))
        } else {
          setCategories(parsed)
        }
      } catch {
        setCategories(defaultCategories)
        localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(defaultCategories))
      }
    } else {
      // Pas de données stockées, charger les défauts
      setCategories(defaultCategories)
      localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(defaultCategories))
    }

    const storedSpecialties = localStorage.getItem(SPECIALTIES_STORAGE_KEY)
    if (storedSpecialties) {
      try {
        const parsed = JSON.parse(storedSpecialties)
        if (parsed.length === 0 || parsed.length < defaultSpecialties.length) {
          setSpecialties(defaultSpecialties)
          localStorage.setItem(SPECIALTIES_STORAGE_KEY, JSON.stringify(defaultSpecialties))
        } else {
          setSpecialties(parsed)
        }
      } catch {
        setSpecialties(defaultSpecialties)
        localStorage.setItem(SPECIALTIES_STORAGE_KEY, JSON.stringify(defaultSpecialties))
      }
    } else {
      setSpecialties(defaultSpecialties)
      localStorage.setItem(SPECIALTIES_STORAGE_KEY, JSON.stringify(defaultSpecialties))
    }

    const storedContents = localStorage.getItem(CONTENT_STORAGE_KEY)
    if (storedContents) {
      try {
        setContents(JSON.parse(storedContents))
      } catch {
        setContents([])
      }
    }
  }, [])

  // Sauvegarder automatiquement
  useEffect(() => {
    if (categories.length > 0) {
      localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(categories))
    }
  }, [categories])

  useEffect(() => {
    if (specialties.length > 0) {
      localStorage.setItem(SPECIALTIES_STORAGE_KEY, JSON.stringify(specialties))
    }
  }, [specialties])

  useEffect(() => {
    localStorage.setItem(CONTENT_STORAGE_KEY, JSON.stringify(contents))
  }, [contents])

  // === CATEGORIES ===
  
  const addCategory = useCallback((category: Omit<Category, 'id'>) => {
    const newCategory: Category = {
      ...category,
      id: `cat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }
    setCategories(prev => [...prev, newCategory])
  }, [])

  const updateCategory = useCallback((id: string, updates: Partial<Category>) => {
    setCategories(prev => prev.map(c => 
      c.id === id ? { ...c, ...updates } : c
    ))
  }, [])

  const deleteCategory = useCallback((id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id))
    // Supprimer aussi les spécialités associées
    setSpecialties(prev => prev.filter(s => s.categoryId !== id))
  }, [])

  const getCategoryById = useCallback((id: string) => {
    return categories.find(c => c.id === id)
  }, [categories])

  // === SPECIALTIES ===
  
  const addSpecialty = useCallback((specialty: Omit<Specialty, 'id'>) => {
    const newSpecialty: Specialty = {
      ...specialty,
      id: `spec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }
    setSpecialties(prev => [...prev, newSpecialty])
  }, [])

  const updateSpecialty = useCallback((id: string, updates: Partial<Specialty>) => {
    setSpecialties(prev => prev.map(s => 
      s.id === id ? { ...s, ...updates } : s
    ))
  }, [])

  const deleteSpecialty = useCallback((id: string) => {
    setSpecialties(prev => prev.filter(s => s.id !== id))
  }, [])

  const getSpecialtyById = useCallback((id: string) => {
    return specialties.find(s => s.id === id)
  }, [specialties])

  const getSpecialtiesByCategory = useCallback((categoryId: string) => {
    return specialties.filter(s => s.categoryId === categoryId)
  }, [specialties])

  // === CONTENTS ===
  
  const addContent = useCallback((content: Omit<Content, 'id' | 'createdAt' | 'views' | 'likes'>) => {
    const newContent: Content = {
      ...content,
      id: `content-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      views: 0,
      likes: [],
      createdAt: new Date().toISOString()
    }
    setContents(prev => [newContent, ...prev])
  }, [])

  const updateContent = useCallback((id: string, updates: Partial<Content>) => {
    setContents(prev => prev.map(c => 
      c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c
    ))
  }, [])

  const deleteContent = useCallback((id: string) => {
    setContents(prev => prev.filter(c => c.id !== id))
  }, [])

  const publishContent = useCallback((id: string) => {
    setContents(prev => prev.map(c => 
      c.id === id 
        ? { ...c, status: 'published' as const, publishedAt: new Date().toISOString() } 
        : c
    ))
  }, [])

  const archiveContent = useCallback((id: string) => {
    setContents(prev => prev.map(c => 
      c.id === id ? { ...c, status: 'archived' as const } : c
    ))
  }, [])

  const incrementViews = useCallback((id: string) => {
    setContents(prev => prev.map(c => 
      c.id === id ? { ...c, views: c.views + 1 } : c
    ))
  }, [])

  const likeContent = useCallback((contentId: string, userId: string) => {
    setContents(prev => prev.map(c => 
      c.id === contentId && !c.likes.includes(userId)
        ? { ...c, likes: [...c.likes, userId] }
        : c
    ))
  }, [])

  const unlikeContent = useCallback((contentId: string, userId: string) => {
    setContents(prev => prev.map(c => 
      c.id === contentId
        ? { ...c, likes: c.likes.filter(id => id !== userId) }
        : c
    ))
  }, [])

  const getContentById = useCallback((id: string) => {
    return contents.find(c => c.id === id)
  }, [contents])

  const getContentByAuthor = useCallback((authorId: string) => {
    return contents.filter(c => c.authorId === authorId)
  }, [contents])

  const getContentByCategory = useCallback((categoryId: string) => {
    return contents.filter(c => c.categoryId === categoryId && c.status === 'published')
  }, [contents])

  const getContentBySpecialty = useCallback((specialtyId: string) => {
    return contents.filter(c => c.specialtyId === specialtyId && c.status === 'published')
  }, [contents])

  const getPublishedContent = useCallback(() => {
    return contents.filter(c => c.status === 'published')
  }, [contents])

  const getPendingContent = useCallback(() => {
    return contents.filter(c => c.status === 'draft')
  }, [contents])

  // Contenu en attente (computed)
  const pendingContent = contents.filter(c => c.status === 'draft')

  const searchContent = useCallback((query: string) => {
    const lowerQuery = query.toLowerCase()
    return contents.filter(c => 
      c.title.toLowerCase().includes(lowerQuery) ||
      c.description.toLowerCase().includes(lowerQuery) ||
      c.authorName.toLowerCase().includes(lowerQuery) ||
      c.tags.some(t => t.toLowerCase().includes(lowerQuery))
    )
  }, [contents])

  const getTotalContentCount = useCallback(() => {
    return contents.filter(c => c.status === 'published').length
  }, [contents])

  const value: ContentManagementContextType = {
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
    getCategoryById,
    specialties,
    addSpecialty,
    updateSpecialty,
    deleteSpecialty,
    getSpecialtyById,
    getSpecialtiesByCategory,
    contents,
    addContent,
    updateContent,
    deleteContent,
    publishContent,
    archiveContent,
    incrementViews,
    likeContent,
    unlikeContent,
    getContentById,
    getContentByAuthor,
    getContentByCategory,
    getContentBySpecialty,
    getPublishedContent,
    getPendingContent,
    searchContent,
    getTotalContentCount,
    pendingContent
  }

  return (
    <ContentManagementContext.Provider value={value}>
      {children}
    </ContentManagementContext.Provider>
  )
}

/**
 * Hook pour utiliser le contexte de gestion de contenu
 */
export function useContentManagement() {
  const context = useContext(ContentManagementContext)
  if (context === undefined) {
    throw new Error('useContentManagement must be used within a ContentManagementProvider')
  }
  return context
}
