import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Upload, X, Image as ImageIcon, Plus } from 'lucide-react'

interface ImageUploadProps {
  value?: string
  onChange: (url: string) => void
  placeholder?: string
  className?: string
  aspectRatio?: 'square' | 'video' | 'banner'
}

/**
 * ImageUpload - Composant d'upload d'image simple
 * Convertit l'image en base64 pour stockage local
 */
export function ImageUpload({
  value,
  onChange,
  placeholder = 'Cliquez ou glissez une image',
  className = '',
  aspectRatio = 'square'
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const aspectClasses = {
    square: 'aspect-square',
    video: 'aspect-video',
    banner: 'aspect-[3/1]'
  }

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) return
    
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      onChange(result)
    }
    reader.readAsDataURL(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleClick = () => {
    inputRef.current?.click()
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange('')
  }

  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="hidden"
      />
      
      <motion.div
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        whileHover={{ scale: 1.01 }}
        className={`
          relative ${aspectClasses[aspectRatio]} rounded-xl overflow-hidden cursor-pointer
          border-2 border-dashed transition-colors
          ${isDragging 
            ? 'border-primary-500 bg-primary-500/10' 
            : value 
              ? 'border-transparent' 
              : 'border-dark-600 hover:border-dark-500 bg-dark-800/50'
          }
        `}
      >
        {value ? (
          <>
            <img
              src={value}
              alt="Upload"
              className="w-full h-full object-cover"
            />
            <button
              onClick={handleRemove}
              className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-dark-400">
            <Upload className="w-8 h-8 mb-2" />
            <p className="text-sm text-center px-4">{placeholder}</p>
          </div>
        )}
      </motion.div>
    </div>
  )
}

interface MultiImageUploadProps {
  values: string[]
  onChange: (urls: string[]) => void
  maxImages?: number
  className?: string
}

/**
 * MultiImageUpload - Upload multiple d'images
 */
export function MultiImageUpload({
  values,
  onChange,
  maxImages = 4,
  className = ''
}: MultiImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFiles = (files: FileList) => {
    const newImages: string[] = []
    const remaining = maxImages - values.length
    const filesToProcess = Array.from(files).slice(0, remaining)

    filesToProcess.forEach(file => {
      if (!file.type.startsWith('image/')) return
      
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        newImages.push(result)
        if (newImages.length === filesToProcess.length) {
          onChange([...values, ...newImages])
        }
      }
      reader.readAsDataURL(file)
    })
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) handleFiles(files)
  }

  const handleRemove = (index: number) => {
    onChange(values.filter((_, i) => i !== index))
  }

  const canAddMore = values.length < maxImages

  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleChange}
        className="hidden"
      />
      
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {values.map((url, index) => (
          <div key={index} className="relative aspect-square rounded-xl overflow-hidden group">
            <img
              src={url}
              alt={`Image ${index + 1}`}
              className="w-full h-full object-cover"
            />
            <button
              onClick={() => handleRemove(index)}
              className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
        
        {canAddMore && (
          <motion.button
            onClick={() => inputRef.current?.click()}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="aspect-square rounded-xl border-2 border-dashed border-dark-600 hover:border-dark-500 bg-dark-800/50 flex flex-col items-center justify-center text-dark-400 hover:text-dark-300 transition-colors"
          >
            <Plus className="w-6 h-6 mb-1" />
            <span className="text-xs">Ajouter</span>
          </motion.button>
        )}
      </div>
      
      <p className="text-xs text-dark-500 mt-2">
        {values.length}/{maxImages} images
      </p>
    </div>
  )
}

