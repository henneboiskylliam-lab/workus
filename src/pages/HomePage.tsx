import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Zap, ArrowRight, Play } from 'lucide-react'
import homepageData from '../data/homepage.json'

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
}

/**
 * HomePage - Page d'accueil de Work Us
 * Avec boutons fonctionnels
 */
export function HomePage() {
  const navigate = useNavigate()
  const { hero } = homepageData

  // Navigation vers les catégories
  const handleStartFree = () => {
    navigate('/categories')
  }

  // Navigation vers une démo (feed ou specialty)
  const handleViewDemo = () => {
    navigate('/feed')
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      {/* Hero Section - 4 Phrases Inspirantes */}
      <section className="relative min-h-screen flex flex-col items-center justify-center py-20 overflow-hidden w-full">
        {/* Background effects */}
        <div className="absolute inset-0 bg-mesh opacity-50" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary-500/20 rounded-full blur-3xl" />
        
        <motion.div 
          className="relative z-10 text-center max-w-5xl mx-auto px-4"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          {/* Logo animé */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", duration: 1, delay: 0.2 }}
            className="w-24 h-24 mx-auto mb-12 rounded-3xl bg-gradient-to-br from-primary-500 via-secondary-500 to-accent-500 flex items-center justify-center shadow-2xl shadow-primary-500/30"
          >
            <Zap className="w-12 h-12 text-white" />
          </motion.div>

          {/* 4 Phrases principales */}
          <div className="space-y-4 mb-16">
            {hero.phrases.map((phrase, index) => (
              <motion.div
                key={phrase.id}
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.15, duration: 0.6 }}
                className="group"
              >
                <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white">
                  {phrase.text.split(phrase.highlight)[0]}
                  <span className="relative">
                    <span className="text-gradient bg-gradient-to-r from-primary-400 via-secondary-400 to-accent-400">
                      {phrase.highlight}
                    </span>
                    <motion.span
                      className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ delay: 0.8 + index * 0.15, duration: 0.5 }}
                    />
                  </span>
                </h1>
              </motion.div>
            ))}
          </div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.4 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <button 
              onClick={handleStartFree}
              className="group flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-semibold rounded-2xl shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40 hover:-translate-y-1 transition-all"
            >
              Commencer gratuitement
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button 
              onClick={handleViewDemo}
              className="flex items-center gap-2 px-8 py-4 bg-dark-800/50 text-white font-semibold rounded-2xl border border-dark-700 hover:border-dark-600 hover:bg-dark-800 transition-all"
            >
              <Play className="w-5 h-5" />
              Voir la démo
            </button>
          </motion.div>
        </motion.div>
      </section>
    </div>
  )
}
