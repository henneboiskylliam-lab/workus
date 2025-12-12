import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CreditCard, Check, Star, Zap, Crown, X, AlertTriangle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

type PlanId = 'free' | 'pro' | 'team'

interface Plan {
  id: PlanId
  name: string
  price: number
  description: string
  features: string[]
  icon: React.ComponentType<{ className?: string }>
  gradient: string
  popular?: boolean
}

interface Subscription {
  id: string
  creator: string
  avatar: string | null
  specialty: string
  tier: string
  price: number
  startedAt: string
  isActive: boolean
}

const plans: Plan[] = [
  {
    id: 'free',
    name: 'Gratuit',
    price: 0,
    description: 'Pour découvrir Work Us',
    features: [
      'Accès aux ressources gratuites',
      '5 exercices par mois',
      'Suivi de progression basique',
      'Accès à la communauté',
    ],
    icon: Zap,
    gradient: 'from-gray-500 to-gray-600',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 14.99,
    description: 'Pour les apprenants sérieux',
    features: [
      'Tout le plan Gratuit',
      'Exercices illimités',
      'Ressources premium',
      'Statistiques avancées',
      'Certificats de compétences',
      'Support prioritaire',
    ],
    icon: Star,
    gradient: 'from-primary-500 to-cyan-500',
    popular: true,
  },
  {
    id: 'team',
    name: 'Équipe',
    price: 49.99,
    description: 'Pour les entreprises',
    features: [
      'Tout le plan Pro',
      'Jusqu\'à 10 membres',
      'Dashboard équipe',
      'Rapports de progression',
      'Formations personnalisées',
      'Manager dédié',
    ],
    icon: Crown,
    gradient: 'from-amber-500 to-orange-500',
  },
]

const initialSubscriptions: Subscription[] = [
]

/**
 * SubscriptionsPage - Gestion des abonnements avec interactions fonctionnelles
 */
export function SubscriptionsPage() {
  const { isAuthenticated, user } = useAuth()
  const [currentPlan, setCurrentPlan] = useState<PlanId>('free')
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(initialSubscriptions)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
  const [showManageModal, setShowManageModal] = useState<Subscription | null>(null)
  const [showToast, setShowToast] = useState<{ message: string; type: 'success' | 'warning' } | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  // Afficher une notification
  const showNotification = (message: string, type: 'success' | 'warning' = 'success') => {
    setShowToast({ message, type })
    setTimeout(() => setShowToast(null), 3000)
  }

  // Sélectionner un plan
  const handleSelectPlan = (plan: Plan) => {
    if (plan.id === currentPlan) return
    setSelectedPlan(plan)
    setShowUpgradeModal(true)
  }

  // Confirmer le changement de plan
  const handleConfirmPlan = async () => {
    if (!selectedPlan) return
    
    setIsProcessing(true)
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    setCurrentPlan(selectedPlan.id)
    setShowUpgradeModal(false)
    setSelectedPlan(null)
    setIsProcessing(false)
    
    showNotification(
      selectedPlan.price > 0 
        ? `Vous êtes maintenant abonné au plan ${selectedPlan.name} !`
        : 'Vous êtes repassé au plan Gratuit'
    )
  }

  // Gérer un abonnement créateur
  const handleManageSubscription = (sub: Subscription) => {
    setShowManageModal(sub)
  }

  // Annuler un abonnement créateur
  const handleCancelSubscription = async () => {
    if (!showManageModal) return
    
    setIsProcessing(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    setSubscriptions(prev => prev.map(s => 
      s.id === showManageModal.id ? { ...s, isActive: false } : s
    ))
    
    setShowManageModal(null)
    setIsProcessing(false)
    showNotification(`Abonnement à ${showManageModal.creator} annulé`, 'warning')
  }

  // Réactiver un abonnement
  const handleReactivateSubscription = async (subId: string) => {
    const sub = subscriptions.find(s => s.id === subId)
    if (!sub) return
    
    setIsProcessing(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    setSubscriptions(prev => prev.map(s => 
      s.id === subId ? { ...s, isActive: true } : s
    ))
    
    setIsProcessing(false)
    showNotification(`Abonnement à ${sub.creator} réactivé !`)
  }

  const currentPlanData = plans.find(p => p.id === currentPlan)!

  return (
    <div className="max-w-6xl mx-auto">
      {/* Toast notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className={`fixed top-20 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg ${
              showToast.type === 'success' ? 'bg-green-500' : 'bg-amber-500'
            } text-white`}
          >
            <Check className="w-5 h-5" />
            {showToast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
          <CreditCard className="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Abonnements</h1>
          <p className="text-dark-400">Gérez vos abonnements et découvrez nos offres</p>
        </div>
      </div>

      {/* Current plan */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12 p-6 bg-dark-800/50 border border-dark-700/50 rounded-2xl"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${currentPlanData.gradient} flex items-center justify-center`}>
              <currentPlanData.icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-dark-400 mb-1">Votre plan actuel</p>
              <h2 className="text-2xl font-bold text-white">Plan {currentPlanData.name}</h2>
            </div>
          </div>
          {currentPlan !== 'pro' && (
            <button 
              onClick={() => handleSelectPlan(plans.find(p => p.id === 'pro')!)}
              className="px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-primary-500/20 transition-all"
            >
              Passer à Pro
            </button>
          )}
        </div>
      </motion.div>

      {/* Upgrade Modal */}
      <AnimatePresence>
        {showUpgradeModal && selectedPlan && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowUpgradeModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md bg-dark-800 border border-dark-700 rounded-2xl overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-white">Changer de plan</h3>
                  <button 
                    onClick={() => setShowUpgradeModal(false)}
                    className="p-2 text-dark-400 hover:text-white rounded-lg hover:bg-dark-700 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className={`p-4 rounded-xl bg-gradient-to-br ${selectedPlan.gradient} mb-6`}>
                  <div className="flex items-center gap-3 mb-2">
                    <selectedPlan.icon className="w-8 h-8 text-white" />
                    <h4 className="text-xl font-bold text-white">{selectedPlan.name}</h4>
                  </div>
                  <p className="text-white/80 text-sm">{selectedPlan.description}</p>
                  <p className="text-2xl font-bold text-white mt-4">
                    {selectedPlan.price}€<span className="text-sm font-normal">/mois</span>
                  </p>
                </div>

                <ul className="space-y-2 mb-6">
                  {selectedPlan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-dark-300">
                      <Check className="w-4 h-4 text-accent-400" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowUpgradeModal(false)}
                    className="flex-1 py-3 bg-dark-700 text-white rounded-xl hover:bg-dark-600 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleConfirmPlan}
                    disabled={isProcessing}
                    className="flex-1 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-semibold rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {isProcessing ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                    ) : (
                      'Confirmer'
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Manage Subscription Modal */}
      <AnimatePresence>
        {showManageModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowManageModal(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md bg-dark-800 border border-dark-700 rounded-2xl overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-white">Gérer l'abonnement</h3>
                  <button 
                    onClick={() => setShowManageModal(null)}
                    className="p-2 text-dark-400 hover:text-white rounded-lg hover:bg-dark-700 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex items-center gap-4 mb-6 p-4 bg-dark-700/50 rounded-xl">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-secondary-500 to-pink-500 flex items-center justify-center text-white font-bold">
                    {showManageModal.creator[0]}
                  </div>
                  <div>
                    <p className="font-medium text-white">{showManageModal.creator}</p>
                    <p className="text-sm text-dark-400">{showManageModal.specialty}</p>
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-dark-400">Prix mensuel</span>
                    <span className="text-white">{showManageModal.price}€/mois</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-dark-400">Depuis le</span>
                    <span className="text-white">{new Date(showManageModal.startedAt).toLocaleDateString('fr-FR')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-dark-400">Statut</span>
                    <span className={showManageModal.isActive ? 'text-green-400' : 'text-red-400'}>
                      {showManageModal.isActive ? 'Actif' : 'Annulé'}
                    </span>
                  </div>
                </div>

                {showManageModal.isActive ? (
                  <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl mb-6">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-red-400 font-medium">Annuler l'abonnement</p>
                        <p className="text-sm text-dark-400 mt-1">
                          Vous perdrez l'accès au contenu premium de ce créateur.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : null}

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowManageModal(null)}
                    className="flex-1 py-3 bg-dark-700 text-white rounded-xl hover:bg-dark-600 transition-colors"
                  >
                    Fermer
                  </button>
                  {showManageModal.isActive && (
                    <button
                      onClick={handleCancelSubscription}
                      disabled={isProcessing}
                      className="flex-1 py-3 bg-red-500 text-white font-semibold rounded-xl hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isProcessing ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                      ) : (
                        'Se désabonner'
                      )}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Plans */}
      <section className="mb-12">
        <h2 className="text-xl font-bold text-white mb-6">Nos offres</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan, index) => {
            const Icon = plan.icon
            const isCurrentPlan = plan.id === currentPlan
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`relative p-6 bg-dark-800/50 border rounded-2xl ${
                  plan.popular ? 'border-primary-500' : 'border-dark-700/50'
                } ${isCurrentPlan ? 'ring-2 ring-accent-500' : ''}`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary-500 text-white text-sm font-medium rounded-full">
                    Populaire
                  </span>
                )}
                
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${plan.gradient} flex items-center justify-center mb-4`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                
                <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>
                <p className="text-dark-400 text-sm mb-4">{plan.description}</p>
                
                <div className="mb-6">
                  <span className="text-3xl font-bold text-white">{plan.price}€</span>
                  {plan.price > 0 && <span className="text-dark-400">/mois</span>}
                </div>
                
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-dark-300">
                      <Check className="w-5 h-5 text-accent-400 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <button 
                  onClick={() => handleSelectPlan(plan)}
                  disabled={isCurrentPlan}
                  className={`w-full py-3 font-semibold rounded-xl transition-all ${
                    isCurrentPlan
                      ? 'bg-accent-500/20 text-accent-400 cursor-default'
                      : plan.popular
                        ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white hover:shadow-lg hover:shadow-primary-500/20'
                        : 'bg-dark-700 text-white hover:bg-dark-600'
                  }`}
                >
                  {isCurrentPlan ? 'Plan actuel' : 'Choisir ce plan'}
                </button>
              </motion.div>
            )
          })}
        </div>
      </section>

      {/* Creator subscriptions */}
      <section>
        <h2 className="text-xl font-bold text-white mb-6">Abonnements aux créateurs</h2>
        {subscriptions.length === 0 ? (
          <div className="text-center py-12 bg-dark-800/50 border border-dark-700/50 rounded-2xl">
            <CreditCard className="w-12 h-12 text-dark-500 mx-auto mb-4" />
            <p className="text-dark-400">Vous n'êtes abonné à aucun créateur</p>
          </div>
        ) : (
          <div className="space-y-4">
            {subscriptions.map((sub, index) => (
              <motion.div
                key={sub.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className={`flex items-center justify-between p-4 bg-dark-800/50 border rounded-xl ${
                  sub.isActive ? 'border-dark-700/50' : 'border-red-500/30 bg-red-500/5'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-secondary-500 to-pink-500 flex items-center justify-center text-white font-bold">
                    {sub.creator[0]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-white">{sub.creator}</p>
                      {!sub.isActive && (
                        <span className="px-2 py-0.5 text-xs bg-red-500/20 text-red-400 rounded-full">
                          Annulé
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-dark-400">{sub.specialty}</p>
                  </div>
                </div>
                <div className="text-right mr-4">
                  <p className="font-semibold text-white">{sub.price}€/mois</p>
                  <p className="text-sm text-dark-400">
                    Depuis le {new Date(sub.startedAt).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                {sub.isActive ? (
                  <button 
                    onClick={() => handleManageSubscription(sub)}
                    className="px-4 py-2 bg-dark-700 text-dark-300 rounded-lg hover:text-white hover:bg-dark-600 transition-all"
                  >
                    Gérer
                  </button>
                ) : (
                  <button 
                    onClick={() => handleReactivateSubscription(sub.id)}
                    disabled={isProcessing}
                    className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 transition-all"
                  >
                    Réactiver
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
