import { useTranslation } from 'react-i18next'
import { AlertCircle, RefreshCw } from 'lucide-react'

export default function ErrorState({ message, onRetry }) {
  const { t } = useTranslation()
  const displayMessage = message ?? t('common.unableToLoad')
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mb-3">
        <AlertCircle size={24} className="text-orange-600" />
      </div>
      <p className="text-gray-600 text-sm mb-4">{displayMessage}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 bg-mint-500 hover:bg-mint-600 text-white text-sm font-medium rounded-xl transition-colors"
        >
          <RefreshCw size={16} />
          {t('common.retry')}
        </button>
      )}
    </div>
  )
}
