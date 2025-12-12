import { motion } from 'framer-motion'
import { Play, Book, GraduationCap, ExternalLink, Star, Clock, Users } from 'lucide-react'

interface ResourceCardProps {
  type: 'video' | 'book' | 'course' | 'article' | 'podcast' | 'tool'
  title: string
  description: string
  author: string
  thumbnail?: string
  duration?: string
  pages?: number
  isPaid: boolean
  price?: number
  rating: number
  reviewsCount: number
  enrolledCount?: number
  onClick?: () => void
}

const typeConfig = {
  video: { icon: Play, label: 'Vidéo', color: 'from-red-500 to-pink-500' },
  book: { icon: Book, label: 'Livre', color: 'from-amber-500 to-orange-500' },
  course: { icon: GraduationCap, label: 'Formation', color: 'from-purple-500 to-indigo-500' },
  article: { icon: Book, label: 'Article', color: 'from-blue-500 to-cyan-500' },
  podcast: { icon: Play, label: 'Podcast', color: 'from-green-500 to-emerald-500' },
  tool: { icon: ExternalLink, label: 'Outil', color: 'from-gray-500 to-slate-500' },
}

/**
 * ResourceCard - Carte de ressource (vidéo, livre, formation, etc.)
 */
export function ResourceCard({
  type,
  title,
  description,
  author,
  thumbnail,
  duration,
  pages,
  isPaid,
  price,
  rating,
  reviewsCount,
  enrolledCount,
  onClick,
}: ResourceCardProps) {
  const config = typeConfig[type]
  const Icon = config.icon

  return (
    <motion.div
      whileHover={{ y: -4 }}
      onClick={onClick}
      className="group bg-dark-800/50 border border-dark-700/50 rounded-2xl overflow-hidden cursor-pointer hover:border-primary-500/30 hover:shadow-lg hover:shadow-primary-500/5 transition-all"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-dark-700">
        {thumbnail ? (
          <img src={thumbnail} alt={title} className="w-full h-full object-cover" />
        ) : (
          <div className={`absolute inset-0 bg-gradient-to-br ${config.color} opacity-20`} />
        )}
        
        {/* Type badge */}
        <div className="absolute top-3 left-3">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${config.color} text-white`}>
            <Icon className="w-3.5 h-3.5" />
            {config.label}
          </span>
        </div>

        {/* Price badge */}
        <div className="absolute top-3 right-3">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
            isPaid 
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
              : 'bg-green-500/20 text-green-400 border border-green-500/30'
          }`}>
            {isPaid ? `${price}€` : 'Gratuit'}
          </span>
        </div>

        {/* Duration/Pages overlay */}
        {(duration || pages) && (
          <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/70 rounded text-xs text-white">
            {duration || `${pages} pages`}
          </div>
        )}

        {/* Play button for videos */}
        {type === 'video' && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Play className="w-8 h-8 text-white fill-white" />
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="font-semibold text-white mb-1 line-clamp-2 group-hover:text-primary-400 transition-colors">
          {title}
        </h3>
        <p className="text-sm text-dark-400 mb-3">{author}</p>
        <p className="text-sm text-dark-400 line-clamp-2 mb-4">
          {description}
        </p>

        {/* Stats */}
        <div className="flex items-center justify-between pt-4 border-t border-dark-700/50">
          <div className="flex items-center gap-1.5">
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span className="text-sm font-medium text-white">{rating}</span>
            <span className="text-sm text-dark-500">({reviewsCount})</span>
          </div>
          {enrolledCount && (
            <div className="flex items-center gap-1.5 text-dark-400">
              <Users className="w-4 h-4" />
              <span className="text-sm">{enrolledCount.toLocaleString()}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

/**
 * ResourceCardCompact - Version compacte pour les listes
 */
export function ResourceCardCompact({
  type,
  title,
  author,
  duration,
  isPaid,
  price,
  rating,
  onClick,
}: Partial<ResourceCardProps> & { type: ResourceCardProps['type'] }) {
  const config = typeConfig[type]
  const Icon = config.icon

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      onClick={onClick}
      className="flex items-center gap-4 p-4 bg-dark-800/50 border border-dark-700/50 rounded-xl cursor-pointer hover:border-primary-500/30 transition-all"
    >
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${config.color} flex items-center justify-center flex-shrink-0`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-white truncate">{title}</h4>
        <p className="text-sm text-dark-400">{author}</p>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        {duration && (
          <div className="flex items-center gap-1 text-dark-400">
            <Clock className="w-4 h-4" />
            <span className="text-xs">{duration}</span>
          </div>
        )}
        <div className="flex items-center gap-1">
          <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
          <span className="text-sm text-white">{rating}</span>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          isPaid ? 'bg-amber-500/20 text-amber-400' : 'bg-green-500/20 text-green-400'
        }`}>
          {isPaid ? `${price}€` : 'Gratuit'}
        </span>
      </div>
    </motion.div>
  )
}

