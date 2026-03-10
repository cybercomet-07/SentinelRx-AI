import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { prescriptionService } from '../../services/prescriptionService'
import { cartService } from '../../services/cartService'
import { FileText, Plus, Upload, Camera, X, Stethoscope, History, ShoppingCart } from 'lucide-react'
import toast from 'react-hot-toast'
import SymptomRecommendChat from '../../components/prescription/SymptomRecommendChat'

const MAX_IMAGE_SIZE_MB = 2
const MAX_IMAGE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function PrescriptionsPage() {
  const { t } = useTranslation()
  const [form, setForm] = useState({
    patient_name: '',
    doctor_name: '',
    prescription_text: '',
  })
  const [image, setImage] = useState(null)
  const [creating, setCreating] = useState(false)
  const [myPrescriptions, setMyPrescriptions] = useState([])
  const [loadingMy, setLoadingMy] = useState(false)
  const [activeTab, setActiveTab] = useState('create') // 'create' | 'my'
  const galleryInputRef = useRef(null)
  const cameraInputRef = useRef(null)

  useEffect(() => {
    if (activeTab === 'my') {
      setLoadingMy(true)
      prescriptionService.getMy()
        .then((res) => setMyPrescriptions(res.data || []))
        .catch(() => setMyPrescriptions([]))
        .finally(() => setLoadingMy(false))
    }
  }, [activeTab])

  const handleImageSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error(t('prescriptions.selectImageFile'))
      return
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error(t('prescriptions.imageSizeLimit', { mb: MAX_IMAGE_SIZE_MB }))
      return
    }
    try {
      const base64 = await fileToBase64(file)
      const res = await prescriptionService.uploadImage(base64)
      const url = res.data?.url
      if (url) {
        setImage(url)
        toast.success(t('prescriptions.imageUploaded'))
      } else {
        setImage(base64)
        toast.success('Image added (Cloudinary not configured)')
      }
    } catch (err) {
      const msg = err.response?.data?.detail || err.message
      if (err.response?.status === 503) {
        setImage(await fileToBase64(file))
        toast.success('Image added (stored locally - add Cloudinary credentials for cloud storage)')
      } else {
        toast.error(msg || t('prescriptions.failedToUploadImage'))
      }
    }
    e.target.value = ''
  }

  const triggerGallery = () => {
    galleryInputRef.current?.click()
  }

  const triggerCamera = () => {
    cameraInputRef.current?.click()
  }

  const removeImage = () => {
    setImage(null)
  }

  const addMedicineToCart = async (medicineId, quantity) => {
    try {
      await cartService.addItem(medicineId, quantity)
      toast.success(t('prescriptions.addedToCart'))
    } catch (err) {
      toast.error(err.response?.data?.detail || t('prescriptions.failedToAddToCart'))
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!form.patient_name?.trim() || !form.prescription_text?.trim()) {
      toast.error(t('prescriptions.patientAndTextRequired'))
      return
    }
    if (form.prescription_text.trim().length < 3) {
      toast.error(t('prescriptions.prescriptionTextMinLength'))
      return
    }
    setCreating(true)
    try {
      const payload = {
        ...form,
        image_url: typeof image === 'string' && image.startsWith('http') ? image : null,
        extra_data: typeof image === 'string' && !image.startsWith('http') ? { image } : null,
      }
      const res = await prescriptionService.create(payload)
      const created = res.data
      toast.success(t('prescriptions.prescriptionCreated'))
      setForm({ patient_name: '', doctor_name: '', prescription_text: '' })
      setImage(null)
      setActiveTab('my')
    } catch (err) {
      toast.error(err.response?.data?.error?.message ?? err.response?.data?.detail ?? t('prescriptions.failedToCreatePrescription'))
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="h-full flex flex-col lg:flex-row overflow-hidden">
      {/* Left: Create & My Prescriptions */}
      <div className="flex-1 min-h-0 overflow-y-auto p-6 lg:border-r lg:border-gray-200 lg:max-w-md">
        <div className="flex gap-2 mb-4">
          <button
            type="button"
            onClick={() => setActiveTab('create')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${activeTab === 'create' ? 'bg-mint-500 text-white' : 'bg-gray-100 text-gray-600'}`}
          >
            <Plus size={16} className="inline mr-1" />
            {t('prescriptions.create')}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('my')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${activeTab === 'my' ? 'bg-mint-500 text-white' : 'bg-gray-100 text-gray-600'}`}
          >
            <History size={16} className="inline mr-1" />
            {t('prescriptions.myPrescriptions')}
          </button>
        </div>
        <div className="space-y-8 max-w-2xl mx-auto">
      {activeTab === 'create' && (
      <section className="card-lift bg-white border border-gray-100 rounded-2xl p-6 shadow-soft">
        <div className="flex items-center gap-2 mb-4">
          <FileText size={18} className="text-mint-600" />
          <h2 className="font-display font-semibold text-gray-900">{t('prescriptions.createPrescription')}</h2>
        </div>
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">{t('prescriptions.patientName')} *</label>
            <input
              type="text"
              value={form.patient_name}
              onChange={(e) => setForm((f) => ({ ...f, patient_name: e.target.value }))}
              placeholder={t('prescriptions.patientNamePlaceholder')}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              required
              minLength={2}
              maxLength={120}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">{t('prescriptions.doctorName')}</label>
            <input
              type="text"
              value={form.doctor_name}
              onChange={(e) => setForm((f) => ({ ...f, doctor_name: e.target.value }))}
              placeholder={t('prescriptions.doctorNamePlaceholder')}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              maxLength={120}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">{t('prescriptions.prescriptionImage')}</label>
            <p className="text-xs text-gray-500 mb-2">{t('prescriptions.uploadOrTakePhoto')}</p>
            <div className="flex gap-2">
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImageSelect}
                className="hidden"
              />
              <button
                type="button"
                onClick={triggerGallery}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg transition-colors"
              >
                <Upload size={16} />
                {t('prescriptions.uploadFromGallery')}
              </button>
              <button
                type="button"
                onClick={triggerCamera}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg transition-colors"
              >
                <Camera size={16} />
                {t('prescriptions.takePhotoBtn')}
              </button>
            </div>
            {image && (
              <div className="mt-3 relative inline-block">
                <img
                  src={image}
                  alt="Prescription"
                  className="max-h-48 rounded-lg border border-gray-200 object-contain"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full"
                >
                  <X size={14} />
                </button>
              </div>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">{t('prescriptions.prescriptionText')}</label>
            <textarea
              value={form.prescription_text}
              onChange={(e) => setForm((f) => ({ ...f, prescription_text: e.target.value }))}
              placeholder={t('prescriptions.prescriptionTextPlaceholder')}
              rows={4}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none"
              required
              minLength={3}
            />
          </div>
          <button
            type="submit"
            disabled={creating}
            className="flex items-center gap-2 px-4 py-2 bg-mint-500 hover:bg-mint-600 disabled:opacity-60 text-white text-sm font-medium rounded-lg"
          >
            <Plus size={14} />
            {creating ? t('prescriptions.creating') : t('prescriptions.create')}
          </button>
        </form>
      </section>
      )}
      {activeTab === 'my' && (
      <section className="card-lift bg-white border border-gray-100 rounded-2xl p-6 shadow-soft">
        <div className="flex items-center gap-2 mb-4">
          <History size={18} className="text-mint-600" />
          <h2 className="font-display font-semibold text-gray-900">{t('prescriptions.myPrescriptions')}</h2>
        </div>
        {loadingMy ? (
          <p className="text-sm text-gray-500">{t('prescriptions.loading')}</p>
        ) : myPrescriptions.length === 0 ? (
          <p className="text-sm text-gray-500">{t('prescriptions.noPrescriptionsYet')}</p>
        ) : (
          <div className="space-y-4">
            {myPrescriptions.map((p) => (
              <div key={p.id} className="p-4 border border-gray-200 rounded-xl">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs text-gray-500">#{p.id} · {new Date(p.created_at).toLocaleDateString()}</span>
                </div>
                <p className="text-sm font-medium text-gray-900">Patient: {p.patient_name}</p>
                {p.image_url && (
                  <div className="mt-2">
                    <img src={p.image_url} alt="Prescription" className="max-h-32 rounded-lg border object-contain" />
                  </div>
                )}
                <p className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">{p.prescription_text}</p>
                {p.admin_reply && (
                  <div className="mt-3 p-3 bg-mint-50 rounded-lg border border-mint-100">
                    <p className="text-xs font-medium text-mint-700 mb-1">{t('prescriptions.adminReply')}</p>
                    <p className="text-sm text-gray-800 whitespace-pre-wrap">{p.admin_reply}</p>
                  </div>
                )}
                {p.recommended_medicines?.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-medium text-gray-600 mb-2">{t('prescriptions.recommendedMedicines')}</p>
                    <div className="space-y-2">
                      {p.recommended_medicines.map((rm) => (
                        <div key={rm.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                          <div>
                            <p className="text-sm font-medium">{rm.medicine_name}</p>
                            <p className="text-xs text-gray-500">₹{rm.medicine_price} × {rm.quantity}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => addMedicineToCart(rm.medicine_id, rm.quantity)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-mint-500 text-white text-xs font-medium rounded-lg hover:bg-mint-600"
                          >
                            <ShoppingCart size={14} />
                            {t('prescriptions.addToCart')}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
      )}
        </div>
      </div>

      {/* Right: Symptom Recommendation (No Prescription) */}
      <div className="flex-1 min-h-[400px] lg:min-h-0 flex flex-col border-t lg:border-t-0 lg:border-l border-gray-200 bg-white">
        <div className="shrink-0 flex items-center gap-2 px-4 py-2 border-b border-gray-200 bg-slate-50">
          <Stethoscope size={18} className="text-teal-600" strokeWidth={2} />
          <span className="font-semibold text-slate-800">{t('prescriptions.symptomSuggestions')}</span>
        </div>
        <div className="flex-1 min-h-0 overflow-hidden">
          <SymptomRecommendChat />
        </div>
      </div>
    </div>
  )
}
