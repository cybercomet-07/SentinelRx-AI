import { useEffect, useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageSquare, ShoppingBag, History, Bell, FileText, Mail,
  Stethoscope, ChevronDown
} from 'lucide-react'

const FEATURE_KEYS = [
  { id: 1, icon: MessageSquare, titleKey: 'quickStart.aiChat', descKey: 'quickStart.aiChatDesc', color: 'from-emerald-500 to-teal-600', lightColor: 'bg-emerald-50 border-emerald-200' },
  { id: 2, icon: Stethoscope, titleKey: 'quickStart.symptomTips', descKey: 'quickStart.symptomTipsDesc', color: 'from-teal-500 to-cyan-600', lightColor: 'bg-teal-50 border-teal-200' },
  { id: 3, icon: ShoppingBag, titleKey: 'quickStart.browseMedicines', descKey: 'quickStart.browseMedicinesDesc', color: 'from-blue-500 to-blue-600', lightColor: 'bg-blue-50 border-blue-200' },
  { id: 4, icon: History, titleKey: 'quickStart.orderHistory', descKey: 'quickStart.orderHistoryDesc', color: 'from-violet-500 to-purple-600', lightColor: 'bg-violet-50 border-violet-200' },
  { id: 5, icon: Bell, titleKey: 'quickStart.refillAlerts', descKey: 'quickStart.refillAlertsDesc', color: 'from-amber-500 to-orange-500', lightColor: 'bg-amber-50 border-amber-200' },
  { id: 6, icon: FileText, titleKey: 'quickStart.prescriptions', descKey: 'quickStart.prescriptionsDesc', color: 'from-rose-500 to-pink-600', lightColor: 'bg-rose-50 border-rose-200' },
  { id: 7, icon: Mail, titleKey: 'quickStart.contactUs', descKey: 'quickStart.contactUsDesc', color: 'from-slate-500 to-slate-600', lightColor: 'bg-slate-50 border-slate-200' },
]

const CARD_HEIGHT = 100

export default function QuickStartPage() {
  const { t } = useTranslation()
  const [activeStep, setActiveStep] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const intervalRef = useRef(null)
  const cardRefs = useRef([])

  const runAnimation = () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    let step = 0
    setActiveStep(0)
    setIsComplete(false)
    intervalRef.current = setInterval(() => {
      step += 1
      setActiveStep(step)
      if (step >= FEATURE_KEYS.length - 1) {
        if (intervalRef.current) clearInterval(intervalRef.current)
        intervalRef.current = null
        setIsComplete(true)
      }
    }, 850)
  }

  useEffect(() => {
    runAnimation()
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [])

  useEffect(() => {
    const el = cardRefs.current[activeStep]
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [activeStep])

  return (
    <div className="p-6 max-w-2xl mx-auto overflow-y-auto">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-slate-900">{t('quickStart.featuresRoadmap')}</h1>
        <p className="text-slate-600 mt-1">{t('quickStart.exploreWhat')}</p>
      </div>

      {/* Vertical flow timeline */}
      <div className="relative">
        {/* Vertical dotted line - extends through all cards including Contact Us */}
        <div
          className="absolute left-6 top-0 w-0.5 border-l-2 border-dashed border-slate-300"
          style={{ height: FEATURE_KEYS.length * CARD_HEIGHT + 60 }}
        />

        {/* Traveling dot */}
        <motion.div
          className="absolute left-4 top-0 w-4 h-4 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50 z-10"
          animate={{ top: activeStep * CARD_HEIGHT }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
        >
          <motion.div
            className="absolute inset-0 rounded-full bg-emerald-400"
            animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 1.2, repeat: Infinity }}
          />
        </motion.div>

        {/* Feature cards - vertical stack */}
        <div className="relative pl-16 space-y-4">
          {FEATURE_KEYS.map((feature, index) => {
            const isVisible = index <= activeStep
            const Icon = feature.icon

            return (
              <AnimatePresence key={feature.id}>
                {isVisible && (
                  <motion.div
                    ref={(el) => { cardRefs.current[index] = el }}
                    initial={{ opacity: 0, x: -20, scale: 0.9 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    className="relative"
                  >
                    <div
                      className={`absolute -left-10 top-5 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold z-10 ${
                        index === activeStep
                          ? 'bg-emerald-500 text-white ring-4 ring-emerald-200'
                          : index < activeStep || (index === FEATURE_KEYS.length - 1 && isComplete)
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      {(index < activeStep || (index === FEATURE_KEYS.length - 1 && isComplete)) ? '✓' : index + 1}
                    </div>

                    <div className={`border rounded-xl p-4 ${feature.lightColor}`}>
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${feature.color} flex items-center justify-center shrink-0`}>
                          <Icon size={20} className="text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-slate-900">{t(feature.titleKey)}</h3>
                          <p className="text-sm text-slate-600 mt-0.5 leading-relaxed">{t(feature.descKey)}</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            )
          })}
        </div>
      </div>

      <AnimatePresence>
        {isComplete && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 flex justify-center"
          >
            <button
              onClick={runAnimation}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium transition-colors"
            >
              <ChevronDown size={16} className="rotate-[-90deg]" />
              {t('quickStart.replayRoadmap')}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
