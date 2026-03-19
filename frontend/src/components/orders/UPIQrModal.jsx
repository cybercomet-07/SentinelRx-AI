import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { X, Smartphone, ArrowLeft, Upload, Image } from 'lucide-react'
import QRCode from 'qrcode'
import { buildUpiUrl } from '../../utils/upiConfig'
import { orderService } from '../../services/orderService'
import toast from 'react-hot-toast'

const UPI_APPS = [
  { id: 'phonepe', label: 'PhonePe' },
  { id: 'gpay', label: 'Google Pay' },
]

function DynamicQRDisplay({ upiUrl, label, size = 260 }) {
  const [dataUrl, setDataUrl] = useState(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!upiUrl) return
    setError(false)
    QRCode.toDataURL(upiUrl, { width: size, margin: 2, color: { dark: '#000', light: '#fff' } })
      .then(setDataUrl)
      .catch(() => setError(true))
  }, [upiUrl, size])

  if (error || !dataUrl) {
    return (
      <div className="text-center">
        <p className="text-sm font-semibold text-gray-700 mb-3">{label}</p>
        <div className="flex items-center justify-center w-full max-w-[220px] aspect-square mx-auto border-2 border-gray-200 rounded-2xl bg-gray-50">
          <span className="text-sm text-gray-500 px-4">Failed to generate QR</span>
        </div>
      </div>
    )
  }

  return (
    <div className="text-center">
      <p className="text-sm font-semibold text-gray-700 mb-3">{label}</p>
      <div className="border-2 border-gray-200 rounded-2xl bg-white flex items-center justify-center overflow-hidden mx-auto shadow-sm p-3 w-full max-w-[220px] aspect-square">
        <img src={dataUrl} alt={`${label} UPI QR`} className="w-full h-full object-contain" />
      </div>
    </div>
  )
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function UPIQrModal({ open, onClose, totalAmount, onPaid }) {
  const { t } = useTranslation()
  const [selectedApp, setSelectedApp] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [receiptPreview, setReceiptPreview] = useState(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (!open) {
      setSelectedApp(null)
      setReceiptPreview(null)
    }
  }, [open])

  if (!open) return null

  const handleClose = () => {
    setSelectedApp(null)
    onClose()
  }

  const app = selectedApp ? UPI_APPS.find((a) => a.id === selectedApp) : null

  // Phase 1: amount=0 so amount auto-fills when user scans. For Phase 2, use totalAmount.
  const upiAmount = 0
  const upiUrl = buildUpiUrl(upiAmount)

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
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
              <DynamicQRDisplay upiUrl={upiUrl} label={app.label} size={260} />
            </div>
            <p className="text-xs text-slate-500 mb-2">Amount ₹{upiAmount} will auto-fill when you scan</p>

            <p className="text-xs text-gray-400 mb-4">{t('payment.noDeduction')}</p>

            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                {t('payment.uploadReceipt') || 'Upload transaction screenshot'}
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target?.files?.[0]
                  if (!file) return
                  setUploading(true)
                  try {
                    const base64 = await fileToBase64(file)
                    const url = await orderService.uploadPaymentReceipt(base64)
                    if (url) {
                      setReceiptPreview(url)
                      toast.success(t('payment.receiptUploaded') || 'Screenshot uploaded')
                    } else {
                      toast.error(t('payment.uploadFailed') || 'Upload failed')
                    }
                  } catch (err) {
                    const msg = err.response?.data?.detail || err.response?.data?.message || err.message
                    toast.error(typeof msg === 'string' ? msg : (t('payment.uploadFailed') || 'Upload failed'))
                  } finally {
                    setUploading(false)
                    e.target.value = ''
                  }
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full py-2.5 border-2 border-dashed border-gray-300 hover:border-mint-400 rounded-xl flex items-center justify-center gap-2 text-gray-600 hover:text-mint-600 transition-colors disabled:opacity-60"
              >
                {receiptPreview ? (
                  <>
                <Image size={20} className="text-green-600" />
                <span className="text-sm font-medium">{t('payment.receiptUploaded') || 'Screenshot uploaded ✓'}</span>
                  </>
                ) : (
                  <>
                <Upload size={20} />
                <span className="text-sm font-medium">{uploading ? t('common.loading') : (t('payment.selectScreenshot') || 'Select screenshot')}</span>
                  </>
                )}
              </button>
              {receiptPreview && (
                <div className="flex justify-center">
                  <img src={receiptPreview} alt="Receipt" className="max-h-24 rounded-lg border border-gray-200 object-cover" />
                </div>
              )}
            </div>

            <button
              onClick={() => receiptPreview ? onPaid(receiptPreview) : toast.error(t('payment.uploadReceiptFirst') || 'Please upload transaction screenshot first')}
              disabled={!receiptPreview || uploading}
              className="w-full py-3 bg-mint-500 hover:bg-mint-600 text-white font-semibold rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-3"
            >
              {t('payment.ivePaid')}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
