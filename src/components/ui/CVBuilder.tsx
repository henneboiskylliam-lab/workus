import { useState } from 'react'
import { motion } from 'framer-motion'
import { FileText, Download, Plus, Trash2, GripVertical } from 'lucide-react'

interface CVSection {
  id: string
  type: 'experience' | 'education' | 'skills' | 'projects' | 'certifications'
  title: string
  items: CVItem[]
}

interface CVItem {
  id: string
  title: string
  subtitle?: string
  date?: string
  description?: string
  tags?: string[]
}

interface CVBuilderProps {
  className?: string
}

/**
 * CVBuilder - Constructeur de CV simple
 */
export function CVBuilder({ className = '' }: CVBuilderProps) {
  const [sections, setSections] = useState<CVSection[]>([
    {
      id: 'exp-1',
      type: 'experience',
      title: 'Expérience professionnelle',
      items: []
    },
    {
      id: 'edu-1',
      type: 'education',
      title: 'Formation',
      items: []
    },
    {
      id: 'skills-1',
      type: 'skills',
      title: 'Compétences',
      items: []
    }
  ])

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
              description: ''
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
    // Simple export en texte
    let cvText = 'CURRICULUM VITAE\n\n'
    
    sections.forEach(section => {
      if (section.items.length > 0) {
        cvText += `${section.title.toUpperCase()}\n${'='.repeat(section.title.length)}\n\n`
        section.items.forEach(item => {
          if (item.title) {
            cvText += `${item.title}\n`
            if (item.subtitle) cvText += `${item.subtitle}\n`
            if (item.date) cvText += `${item.date}\n`
            if (item.description) cvText += `${item.description}\n`
            cvText += '\n'
          }
        })
      }
    })

    const blob = new Blob([cvText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'mon-cv.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className={`bg-dark-800/50 border border-dark-700/50 rounded-2xl p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-cyan-400 flex items-center justify-center">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Mon CV</h3>
            <p className="text-sm text-dark-400">Construisez votre CV professionnel</p>
          </div>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={exportCV}
          className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors"
        >
          <Download className="w-4 h-4" />
          Exporter
        </motion.button>
      </div>

      <div className="space-y-6">
        {sections.map(section => (
          <div key={section.id} className="border border-dark-700/50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-white">{section.title}</h4>
              <button
                onClick={() => addItem(section.id)}
                className="flex items-center gap-1 text-sm text-primary-400 hover:text-primary-300 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Ajouter
              </button>
            </div>

            {section.items.length === 0 ? (
              <p className="text-dark-500 text-sm text-center py-4">
                Aucun élément ajouté
              </p>
            ) : (
              <div className="space-y-3">
                {section.items.map(item => (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 p-3 bg-dark-700/30 rounded-lg group"
                  >
                    <GripVertical className="w-5 h-5 text-dark-500 mt-2 cursor-grab" />
                    
                    <div className="flex-1 space-y-2">
                      <input
                        type="text"
                        value={item.title}
                        onChange={(e) => updateItem(section.id, item.id, { title: e.target.value })}
                        placeholder="Titre"
                        className="w-full bg-transparent border-b border-dark-600 focus:border-primary-500 text-white placeholder-dark-500 outline-none pb-1"
                      />
                      <input
                        type="text"
                        value={item.subtitle || ''}
                        onChange={(e) => updateItem(section.id, item.id, { subtitle: e.target.value })}
                        placeholder="Sous-titre (entreprise, école...)"
                        className="w-full bg-transparent border-b border-dark-600 focus:border-primary-500 text-dark-300 text-sm placeholder-dark-500 outline-none pb-1"
                      />
                      <input
                        type="text"
                        value={item.date || ''}
                        onChange={(e) => updateItem(section.id, item.id, { date: e.target.value })}
                        placeholder="Période (ex: 2020 - 2023)"
                        className="w-full bg-transparent border-b border-dark-600 focus:border-primary-500 text-dark-400 text-sm placeholder-dark-500 outline-none pb-1"
                      />
                      <textarea
                        value={item.description || ''}
                        onChange={(e) => updateItem(section.id, item.id, { description: e.target.value })}
                        placeholder="Description..."
                        rows={2}
                        className="w-full bg-transparent border border-dark-600 focus:border-primary-500 rounded-lg text-dark-300 text-sm placeholder-dark-500 outline-none p-2 resize-none"
                      />
                    </div>

                    <button
                      onClick={() => removeItem(section.id, item.id)}
                      className="p-2 text-dark-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}


