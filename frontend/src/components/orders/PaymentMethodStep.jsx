import { useTranslation } from 'react-i18next'
import { Banknote, Smartphone } from 'lucide-react'

const PAYMENT_METHODS = [
  { value: 'cod', labelKey: 'payment.cashOnDelivery', descKey: 'payment.codDesc', icon: Banknote },
  { value: 'upi', labelKey: 'payment.upi', descKey: 'payment.upiDesc', icon: Smartphone },
]

export default function PaymentMethodStep({ value, onChange }) {
  const { t } = useTranslation()
  const selected = value || 'cod'

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('payment.selectMethod')}</p>
      <div className="grid grid-cols-2 gap-3">
        {PAYMENT_METHODS.map(({ value: v, labelKey, descKey, icon: Icon }) => {
          const isActive = selected === v
          return (
            <button
              key={v}
              type="button"
              onClick={() => onChange(v)}
              className={`flex flex-col items-start gap-1 p-4 rounded-xl border-2 transition-all text-left ${
                isActive
                  ? 'border-mint-400 bg-mint-50 text-mint-800'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Icon size={20} className={isActive ? 'text-mint-600' : 'text-gray-400'} />
              <span className="font-semibold text-sm">{t(labelKey)}</span>
              <span className="text-xs opacity-75">{t(descKey)}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
