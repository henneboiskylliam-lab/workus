import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FileText, Download, Plus, Trash2, GripVertical, Eye, EyeOff,
  User, Briefcase, GraduationCap, Code, Award, Languages, Heart,
  Mail, Phone, MapPin, Globe, Linkedin, Github, Save, Check, Upload, Cloud
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { storageDB } from '../../lib/dbService'
import { supabase, isSupabaseConfigured } from '../../lib/supabase'

const CV_STORAGE_KEY = 'workus_cv_data'

interface CVSection {
  id: string
  type: 'experience' | 'education' | 'skills' | 'projects' | 'certifications' | 'languages' | 'interests'
  title: string
  icon: string
  items: CVItem[]
}

interface CVItem {
  id: string
  title: string
  subtitle?: string
  date?: string
  description?: string
  level?: string
  tags?: string[]
}

interface PersonalInfo {
  firstName: string
  lastName: string
  title: string
  email: string
  phone: string
  location: string
  website: string
  linkedin: string
  github: string
  summary: string
}

interface CVBuilderProps {
  className?: string
}

const sectionIcons: Record<string, React.ReactNode> = {
  experience: <Briefcase className="w-4 h-4" />,
  education: <GraduationCap className="w-4 h-4" />,
  skills: <Code className="w-4 h-4" />,
  projects: <FileText className="w-4 h-4" />,
  certifications: <Award className="w-4 h-4" />,
  languages: <Languages className="w-4 h-4" />,
  interests: <Heart className="w-4 h-4" />
}

const defaultSections: CVSection[] = [
  { id: 'exp-1', type: 'experience', title: 'Expérience professionnelle', icon: 'experience', items: [] },
  { id: 'edu-1', type: 'education', title: 'Formation', icon: 'education', items: [] },
  { id: 'skills-1', type: 'skills', title: 'Compétences', icon: 'skills', items: [] },
  { id: 'projects-1', type: 'projects', title: 'Projets', icon: 'projects', items: [] },
  { id: 'certs-1', type: 'certifications', title: 'Certifications', icon: 'certifications', items: [] },
  { id: 'lang-1', type: 'languages', title: 'Langues', icon: 'languages', items: [] },
  { id: 'int-1', type: 'interests', title: 'Centres d\'intérêt', icon: 'interests', items: [] }
]

const defaultPersonalInfo: PersonalInfo = {
  firstName: '',
  lastName: '',
  title: '',
  email: '',
  phone: '',
  location: '',
  website: '',
  linkedin: '',
  github: '',
  summary: ''
}

/**
 * CVBuilder - Constructeur de CV complet avec sauvegarde en DB
 * 
 * RÈGLE D'OR: Le CV est sauvegardé en base de données (Supabase ou local)
 * Les fichiers PDF sont uploadés sur Supabase Storage
 */
export function CVBuilder({ className = '' }: CVBuilderProps) {
  const { user } = useAuth()
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>(defaultPersonalInfo)
  const [sections, setSections] = useState<CVSection[]>(defaultSections)
  const [showPreview, setShowPreview] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [showSaveToast, setShowSaveToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [activeTab, setActiveTab] = useState<'info' | 'sections'>('info')
  const [cvUrl, setCvUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Charger les données depuis la DB ou localStorage
  useEffect(() => {
    const loadCV = async () => {
      // D'abord charger depuis localStorage (rapide)
      const stored = localStorage.getItem(CV_STORAGE_KEY)
      if (stored) {
        try {
          const data = JSON.parse(stored)
          if (data.personalInfo) setPersonalInfo(data.personalInfo)
          if (data.sections) setSections(data.sections)
        } catch {
          // Ignorer les erreurs de parsing
        }
      }

      // Si Supabase est configuré et l'utilisateur est connecté, charger depuis la DB
      if (isSupabaseConfigured && supabase && user?.id) {
        try {
          const { data } = await supabase
            .from('user_data')
            .select('cv_data, cv_url')
            .eq('user_id', user.id)
            .single()
          
          if (data?.cv_data) {
            const cvData = data.cv_data as { personalInfo?: PersonalInfo; sections?: CVSection[] }
            if (cvData.personalInfo) setPersonalInfo(cvData.personalInfo)
            if (cvData.sections) setSections(cvData.sections)
          }
          if (data?.cv_url) {
            setCvUrl(data.cv_url)
          }
        } catch (error) {
          console.error('Erreur chargement CV depuis DB:', error)
        }
      }
    }

    loadCV()
  }, [user?.id])

  // Sauvegarder le CV (en DB si possible, sinon localStorage)
  const saveCV = async () => {
    setIsSaving(true)
    const data = { personalInfo, sections }
    
    // Toujours sauvegarder en local pour accès rapide
    localStorage.setItem(CV_STORAGE_KEY, JSON.stringify(data))

    // Si Supabase est configuré, sauvegarder aussi en DB
    if (isSupabaseConfigured && supabase && user?.id) {
      try {
        await supabase
          .from('user_data')
          .update({ cv_data: data })
          .eq('user_id', user.id)
      } catch (error) {
        console.error('Erreur sauvegarde CV en DB:', error)
      }
    }

    setIsSaving(false)
    setToastMessage('CV sauvegardé !')
    setShowSaveToast(true)
    setTimeout(() => setShowSaveToast(false), 2000)
  }

  // Upload du CV en PDF
  const handleUploadCV = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !user?.id) return

    if (file.type !== 'application/pdf') {
      setToastMessage('Seuls les fichiers PDF sont acceptés')
      setShowSaveToast(true)
      setTimeout(() => setShowSaveToast(false), 2000)
      return
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB max
      setToastMessage('Le fichier ne doit pas dépasser 10MB')
      setShowSaveToast(true)
      setTimeout(() => setShowSaveToast(false), 2000)
      return
    }

    setIsUploading(true)
    try {
      const url = await storageDB.uploadCV(user.id, file)
      if (url) {
        setCvUrl(url)
        setToastMessage('CV uploadé avec succès !')
      } else {
        setToastMessage('Erreur lors de l\'upload')
      }
    } catch (error) {
      console.error('Erreur upload CV:', error)
      setToastMessage('Erreur lors de l\'upload')
    } finally {
      setIsUploading(false)
      setShowSaveToast(true)
      setTimeout(() => setShowSaveToast(false), 2000)
    }

    // Reset input
    event.target.value = ''
  }

  const updatePersonalInfo = (field: keyof PersonalInfo, value: string) => {
    setPersonalInfo(prev => ({ ...prev, [field]: value }))
  }

  const addItem = (sectionId: string) => {
    setSections(prev => prev.map(section => {
      if (section.id === sectionId) {
        return {
          ...section,
          items: [
            ...section.items,
            {
              id: `item-${Date.now()}`,
              title: '',
              subtitle: '',
              date: '',
              description: '',
              level: ''
            }
          ]
        }
      }
      return section
    }))
  }

  const updateItem = (sectionId: string, itemId: string, updates: Partial<CVItem>) => {
    setSections(prev => prev.map(section => {
      if (section.id === sectionId) {
        return {
          ...section,
          items: section.items.map(item => 
            item.id === itemId ? { ...item, ...updates } : item
          )
        }
      }
      return section
    }))
  }

  const removeItem = (sectionId: string, itemId: string) => {
    setSections(prev => prev.map(section => {
      if (section.id === sectionId) {
        return {
          ...section,
          items: section.items.filter(item => item.id !== itemId)
        }
      }
      return section
    }))
  }

  const exportCV = () => {
    // Créer un document HTML stylisé pour l'export
    const htmlContent = generateCVHTML()
    const blob = new Blob([htmlContent], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `CV_${personalInfo.firstName}_${personalInfo.lastName || 'MonCV'}.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  const generateCVHTML = () => {
    const sectionsHTML = sections
      .filter(s => s.items.length > 0)
      .map(section => {
        const itemsHTML = section.items
          .filter(item => item.title)
          .map(item => `
            <div style="margin-bottom: 15px;">
              <div style="display: flex; justify-content: space-between; align-items: baseline;">
                <strong style="font-size: 14px; color: #333;">${item.title}</strong>
                ${item.date ? `<span style="font-size: 12px; color: #666;">${item.date}</span>` : ''}
              </div>
              ${item.subtitle ? `<div style="font-size: 13px; color: #555; margin-top: 2px;">${item.subtitle}</div>` : ''}
              ${item.level ? `<div style="font-size: 12px; color: #0066cc; margin-top: 2px;">${item.level}</div>` : ''}
              ${item.description ? `<p style="font-size: 12px; color: #666; margin-top: 5px; line-height: 1.5;">${item.description}</p>` : ''}
            </div>
          `).join('')

        return `
          <div style="margin-bottom: 20px;">
            <h2 style="font-size: 16px; color: #0066cc; border-bottom: 2px solid #0066cc; padding-bottom: 5px; margin-bottom: 15px; text-transform: uppercase;">
              ${section.title}
            </h2>
            ${itemsHTML}
          </div>
        `
      }).join('')

    return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CV - ${personalInfo.firstName} ${personalInfo.lastName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #fff; color: #333; }
    .container { max-width: 800px; margin: 0 auto; padding: 40px; }
    @media print { .container { padding: 20px; } }
  </style>
</head>
<body>
  <div class="container">
    <header style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #eee;">
      <h1 style="font-size: 28px; color: #333; margin-bottom: 5px;">${personalInfo.firstName} ${personalInfo.lastName}</h1>
      ${personalInfo.title ? `<p style="font-size: 18px; color: #0066cc; margin-bottom: 15px;">${personalInfo.title}</p>` : ''}
      <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 15px; font-size: 12px; color: #666;">
        ${personalInfo.email ? `<span>📧 ${personalInfo.email}</span>` : ''}
        ${personalInfo.phone ? `<span>📱 ${personalInfo.phone}</span>` : ''}
        ${personalInfo.location ? `<span>📍 ${personalInfo.location}</span>` : ''}
        ${personalInfo.website ? `<span>🌐 ${personalInfo.website}</span>` : ''}
        ${personalInfo.linkedin ? `<span>💼 ${personalInfo.linkedin}</span>` : ''}
        ${personalInfo.github ? `<span>💻 ${personalInfo.github}</span>` : ''}
      </div>
    </header>
    
    ${personalInfo.summary ? `
      <section style="margin-bottom: 25px;">
        <h2 style="font-size: 16px; color: #0066cc; border-bottom: 2px solid #0066cc; padding-bottom: 5px; margin-bottom: 10px; text-transform: uppercase;">
          Profil
        </h2>
        <p style="font-size: 13px; color: #555; line-height: 1.6;">${personalInfo.summary}</p>
      </section>
    ` : ''}
    
    ${sectionsHTML}
    
    <footer style="margin-top: 30px; text-align: center; font-size: 10px; color: #999; border-top: 1px solid #eee; padding-top: 15px;">
      CV généré avec Work Us
    </footer>
  </div>
</body>
</html>
    `
  }

  const hasContent = personalInfo.firstName || personalInfo.lastName || sections.some(s => s.items.length > 0)

  return (
    <div className={`bg-dark-800/50 border border-dark-700/50 rounded-2xl overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-dark-700/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-cyan-400 flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Mon CV</h3>
              <p className="text-sm text-dark-400">Créez votre CV professionnel directement ici</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center gap-2 px-4 py-2 bg-dark-700 text-white rounded-xl hover:bg-dark-600 transition-colors"
            >
              {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showPreview ? 'Éditer' : 'Aperçu'}
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={saveCV}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors disabled:opacity-50"
            >
              {isSaving ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Sauvegarder
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={exportCV}
              disabled={!hasContent}
              className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              Télécharger
            </motion.button>
          </div>
        </div>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {showSaveToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-4 right-4 flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg shadow-lg z-10"
          >
            <Check className="w-4 h-4" />
            CV sauvegardé !
          </motion.div>
        )}
      </AnimatePresence>

      {showPreview ? (
        /* Mode Aperçu */
        <div className="p-6 bg-white min-h-[600px]">
          <div className="max-w-2xl mx-auto">
            {/* Header du CV */}
            <header className="text-center mb-8 pb-6 border-b-2 border-gray-200">
              <h1 className="text-3xl font-bold text-gray-800 mb-1">
                {personalInfo.firstName || 'Prénom'} {personalInfo.lastName || 'Nom'}
              </h1>
              {personalInfo.title && (
                <p className="text-lg text-blue-600 mb-4">{personalInfo.title}</p>
              )}
              <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-600">
                {personalInfo.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="w-3 h-3" /> {personalInfo.email}
                  </span>
                )}
                {personalInfo.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3" /> {personalInfo.phone}
                  </span>
                )}
                {personalInfo.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {personalInfo.location}
                  </span>
                )}
              </div>
            </header>

            {/* Profil */}
            {personalInfo.summary && (
              <section className="mb-6">
                <h2 className="text-lg font-semibold text-blue-600 border-b-2 border-blue-600 pb-1 mb-3 uppercase">
                  Profil
                </h2>
                <p className="text-sm text-gray-600 leading-relaxed">{personalInfo.summary}</p>
              </section>
            )}

            {/* Sections */}
            {sections.filter(s => s.items.length > 0).map(section => (
              <section key={section.id} className="mb-6">
                <h2 className="text-lg font-semibold text-blue-600 border-b-2 border-blue-600 pb-1 mb-3 uppercase">
                  {section.title}
                </h2>
                <div className="space-y-4">
                  {section.items.filter(item => item.title).map(item => (
                    <div key={item.id}>
                      <div className="flex justify-between items-baseline">
                        <strong className="text-gray-800">{item.title}</strong>
                        {item.date && <span className="text-sm text-gray-500">{item.date}</span>}
                      </div>
                      {item.subtitle && (
                        <div className="text-sm text-gray-600">{item.subtitle}</div>
                      )}
                      {item.level && (
                        <div className="text-sm text-blue-600">{item.level}</div>
                      )}
                      {item.description && (
                        <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            ))}

            {!hasContent && (
              <div className="text-center py-12 text-gray-400">
                <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Commencez à remplir votre CV pour voir l'aperçu</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Mode Édition */
        <div className="p-6">
          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab('info')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${
                activeTab === 'info' 
                  ? 'bg-primary-500 text-white' 
                  : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
              }`}
            >
              <User className="w-4 h-4" />
              Informations personnelles
            </button>
            <button
              onClick={() => setActiveTab('sections')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${
                activeTab === 'sections' 
                  ? 'bg-primary-500 text-white' 
                  : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
              }`}
            >
              <FileText className="w-4 h-4" />
              Sections du CV
            </button>
          </div>

          {activeTab === 'info' ? (
            /* Informations personnelles */
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-dark-400 mb-2">Prénom *</label>
                  <input
                    type="text"
                    value={personalInfo.firstName}
                    onChange={(e) => updatePersonalInfo('firstName', e.target.value)}
                    placeholder="Jean"
                    className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-xl text-white placeholder-dark-500 focus:outline-none focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-dark-400 mb-2">Nom *</label>
                  <input
                    type="text"
                    value={personalInfo.lastName}
                    onChange={(e) => updatePersonalInfo('lastName', e.target.value)}
                    placeholder="Dupont"
                    className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-xl text-white placeholder-dark-500 focus:outline-none focus:border-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-dark-400 mb-2">Titre professionnel</label>
                <input
                  type="text"
                  value={personalInfo.title}
                  onChange={(e) => updatePersonalInfo('title', e.target.value)}
                  placeholder="Développeur Full Stack | Designer UI/UX"
                  className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-xl text-white placeholder-dark-500 focus:outline-none focus:border-primary-500"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-dark-400 mb-2">
                    <Mail className="w-4 h-4 inline mr-1" />
                    Email
                  </label>
                  <input
                    type="email"
                    value={personalInfo.email}
                    onChange={(e) => updatePersonalInfo('email', e.target.value)}
                    placeholder="jean.dupont@email.com"
                    className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-xl text-white placeholder-dark-500 focus:outline-none focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-dark-400 mb-2">
                    <Phone className="w-4 h-4 inline mr-1" />
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    value={personalInfo.phone}
                    onChange={(e) => updatePersonalInfo('phone', e.target.value)}
                    placeholder="+33 6 12 34 56 78"
                    className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-xl text-white placeholder-dark-500 focus:outline-none focus:border-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-dark-400 mb-2">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Localisation
                </label>
                <input
                  type="text"
                  value={personalInfo.location}
                  onChange={(e) => updatePersonalInfo('location', e.target.value)}
                  placeholder="Paris, France"
                  className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-xl text-white placeholder-dark-500 focus:outline-none focus:border-primary-500"
                />
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-dark-400 mb-2">
                    <Globe className="w-4 h-4 inline mr-1" />
                    Site web
                  </label>
                  <input
                    type="text"
                    value={personalInfo.website}
                    onChange={(e) => updatePersonalInfo('website', e.target.value)}
                    placeholder="www.monsite.com"
                    className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-xl text-white placeholder-dark-500 focus:outline-none focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-dark-400 mb-2">
                    <Linkedin className="w-4 h-4 inline mr-1" />
                    LinkedIn
                  </label>
                  <input
                    type="text"
                    value={personalInfo.linkedin}
                    onChange={(e) => updatePersonalInfo('linkedin', e.target.value)}
                    placeholder="linkedin.com/in/jeandupont"
                    className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-xl text-white placeholder-dark-500 focus:outline-none focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-dark-400 mb-2">
                    <Github className="w-4 h-4 inline mr-1" />
                    GitHub
                  </label>
                  <input
                    type="text"
                    value={personalInfo.github}
                    onChange={(e) => updatePersonalInfo('github', e.target.value)}
                    placeholder="github.com/jeandupont"
                    className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-xl text-white placeholder-dark-500 focus:outline-none focus:border-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-dark-400 mb-2">Résumé professionnel</label>
                <textarea
                  value={personalInfo.summary}
                  onChange={(e) => updatePersonalInfo('summary', e.target.value)}
                  placeholder="Décrivez brièvement votre profil, vos compétences clés et ce que vous recherchez..."
                  rows={4}
                  className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-xl text-white placeholder-dark-500 focus:outline-none focus:border-primary-500 resize-none"
                />
              </div>
            </div>
          ) : (
            /* Sections du CV */
            <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2">
              {sections.map(section => (
                <div key={section.id} className="border border-dark-700/50 rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between p-4 bg-dark-700/30">
                    <div className="flex items-center gap-2">
                      {sectionIcons[section.type]}
                      <h4 className="font-medium text-white">{section.title}</h4>
                      <span className="text-xs text-dark-500">({section.items.length})</span>
                    </div>
                    <button
                      onClick={() => addItem(section.id)}
                      className="flex items-center gap-1 text-sm text-primary-400 hover:text-primary-300 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Ajouter
                    </button>
                  </div>

                  <div className="p-4">
                    {section.items.length === 0 ? (
                      <p className="text-dark-500 text-sm text-center py-4">
                        Cliquez sur "Ajouter" pour ajouter un élément
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {section.items.map(item => (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-start gap-3 p-4 bg-dark-700/30 rounded-lg group"
                          >
                            <GripVertical className="w-5 h-5 text-dark-500 mt-2 cursor-grab flex-shrink-0" />
                            
                            <div className="flex-1 space-y-3">
                              <div className="grid md:grid-cols-2 gap-3">
                                <input
                                  type="text"
                                  value={item.title}
                                  onChange={(e) => updateItem(section.id, item.id, { title: e.target.value })}
                                  placeholder={section.type === 'skills' ? 'Compétence' : section.type === 'languages' ? 'Langue' : 'Titre du poste / Diplôme'}
                                  className="w-full px-3 py-2 bg-dark-600 border border-dark-500 rounded-lg text-white placeholder-dark-400 text-sm focus:outline-none focus:border-primary-500"
                                />
                                <input
                                  type="text"
                                  value={item.date || ''}
                                  onChange={(e) => updateItem(section.id, item.id, { date: e.target.value })}
                                  placeholder="Période (ex: 2020 - 2023)"
                                  className="w-full px-3 py-2 bg-dark-600 border border-dark-500 rounded-lg text-white placeholder-dark-400 text-sm focus:outline-none focus:border-primary-500"
                                />
                              </div>
                              
                              <div className="grid md:grid-cols-2 gap-3">
                                <input
                                  type="text"
                                  value={item.subtitle || ''}
                                  onChange={(e) => updateItem(section.id, item.id, { subtitle: e.target.value })}
                                  placeholder={section.type === 'experience' ? 'Entreprise' : section.type === 'education' ? 'École / Université' : 'Détail'}
                                  className="w-full px-3 py-2 bg-dark-600 border border-dark-500 rounded-lg text-dark-300 placeholder-dark-400 text-sm focus:outline-none focus:border-primary-500"
                                />
                                {(section.type === 'skills' || section.type === 'languages') && (
                                  <select
                                    value={item.level || ''}
                                    onChange={(e) => updateItem(section.id, item.id, { level: e.target.value })}
                                    className="w-full px-3 py-2 bg-dark-600 border border-dark-500 rounded-lg text-dark-300 text-sm focus:outline-none focus:border-primary-500"
                                  >
                                    <option value="">Niveau</option>
                                    {section.type === 'languages' ? (
                                      <>
                                        <option value="Langue maternelle">Langue maternelle</option>
                                        <option value="Courant (C1/C2)">Courant (C1/C2)</option>
                                        <option value="Avancé (B2)">Avancé (B2)</option>
                                        <option value="Intermédiaire (B1)">Intermédiaire (B1)</option>
                                        <option value="Élémentaire (A2)">Élémentaire (A2)</option>
                                        <option value="Débutant (A1)">Débutant (A1)</option>
                                      </>
                                    ) : (
                                      <>
                                        <option value="Expert">Expert</option>
                                        <option value="Avancé">Avancé</option>
                                        <option value="Intermédiaire">Intermédiaire</option>
                                        <option value="Débutant">Débutant</option>
                                      </>
                                    )}
                                  </select>
                                )}
                              </div>

                              {section.type !== 'skills' && section.type !== 'languages' && section.type !== 'interests' && (
                                <textarea
                                  value={item.description || ''}
                                  onChange={(e) => updateItem(section.id, item.id, { description: e.target.value })}
                                  placeholder="Description des responsabilités, réalisations..."
                                  rows={2}
                                  className="w-full px-3 py-2 bg-dark-600 border border-dark-500 rounded-lg text-dark-300 placeholder-dark-400 text-sm focus:outline-none focus:border-primary-500 resize-none"
                                />
                              )}
                            </div>

                            <button
                              onClick={() => removeItem(section.id, item.id)}
                              className="p-2 text-dark-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
