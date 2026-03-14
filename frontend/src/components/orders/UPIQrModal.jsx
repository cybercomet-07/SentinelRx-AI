import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { X, Smartphone, ArrowLeft } from 'lucide-react'

const UPI_QR_GPAY = '/upi-qr-gpay.png'
const UPI_QR_PHONEPE = '/upi-qr-phonepe.png'

const UPI_APPS = [
  { id: 'phonepe', label: 'PhonePe', src: UPI_QR_PHONEPE },
  { id: 'gpay', label: 'Google Pay', src: UPI_QR_GPAY },
]

function QRDisplay({ src, label, placeholder, size = 280 }) {
  const [errored, setErrored] = useState(false)
  return (
    <div className="text-center">
      <p className="text-sm font-semibold text-gray-700 mb-3">{label}</p>
      <div
        className="border-2 border-gray-200 rounded-2xl bg-white flex items-center justify-center overflow-hidden mx-auto shadow-sm"
        style={{ width: size, height: size }}
      >
        {!errored ? (
          <img
            src={src}
            alt={`${label} UPI QR`}
            className="w-full h-full object-contain p-2"
            onError={() => setErrored(true)}
          />
        ) : (
          <span className="text-sm text-gray-500 px-4 text-center">{placeholder}</span>
        )}
      </div>
    </div>
  )
}

export default function UPIQrModal({ open, onClose, totalAmount, onPaid }) {
  const { t } = useTranslation()
  const [selectedApp, setSelectedApp] = useState(null)

  useEffect(() => {
    if (!open) setSelectedApp(null)
  }, [open])

  if (!open) return null

  const handleClose = () => {
    setSelectedApp(null)
    onClose()
  }

  const app = selectedApp ? UPI_APPS.find((a) => a.id === selectedApp) : null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        {!selectedApp ? (
          <>
            <div className="flex items-center gap-2 mb-2">
              <Smartphone size={22} className="text-mint-600" />
              <h3 className="font-display font-semibold text-gray-900">{t('payment.selectUPIApp')}</h3>
            </div>
            <p className="text-sm text-gray-500 mb-5">{t('payment.chooseAppToScan')}</p>
            <div className="grid grid-cols-2 gap-4 mb-2">
              {UPI_APPS.map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => setSelectedApp(id)}
                  className="flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 border-gray-200 hover:border-mint-400 hover:bg-mint-50/50 transition-all text-gray-700 hover:text-mint-700"
                >
                  <Smartphone size={40} className="text-gray-400" />
                  <span className="font-semibold text-base">{label}</span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <button
              onClick={() => setSelectedApp(null)}
              className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4 text-sm"
            >
              <ArrowLeft size={16} />
              {t('payment.backToSelect')}
            </button>
            <div className="flex items-center gap-2 mb-2">
              <Smartphone size={22} className="text-mint-600" />
              <h3 className="font-display font-semibold text-gray-900">{t('payment.payViaUPI')}</h3>
            </div>
            <p className="text-sm text-gray-600 mb-2">{t('payment.scanAndPay')}</p>
            <p className="text-xl font-bold text-mint-700 mb-5">₹{totalAmount}</p>

            <div className="flex justify-center mb-5">
              <QRDisplay
                src={app.src}
                label={app.label}
                placeholder={t('payment.addQRImage')}
                size={260}
              />
            </div>

            <p className="text-xs text-gray-400 mb-4">{t('payment.noDeduction')}</p>
            <button
              onClick={onPaid}
              className="w-full py-3 bg-mint-500 hover:bg-mint-600 text-white font-semibold rounded-xl transition-colors"
            >
              {t('payment.ivePaid')}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
