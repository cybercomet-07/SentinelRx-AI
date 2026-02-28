import { useState, useRef } from 'react'
import { prescriptionService } from '../../services/prescriptionService'
import { FileText, Plus, Search, Upload, Camera, X } from 'lucide-react'
import toast from 'react-hot-toast'
import Loader from '../../components/ui/Loader'

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
  const [form, setForm] = useState({
    patient_name: '',
    doctor_name: '',
    prescription_text: '',
  })
  const [image, setImage] = useState(null)
  const [creating, setCreating] = useState(false)
  const [viewId, setViewId] = useState('')
  const [prescription, setPrescription] = useState(null)
  const [loadingView, setLoadingView] = useState(false)

  const galleryInputRef = useRef(null)
  const cameraInputRef = useRef(null)

  const handleImageSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error(`Image must be under ${MAX_IMAGE_SIZE_MB}MB`)
      return
    }
    try {
      const base64 = await fileToBase64(file)
      setImage(base64)
      toast.success('Image added')
    } catch {
      toast.error('Failed to process image')
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

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!form.patient_name?.trim() || !form.prescription_text?.trim()) {
      toast.error('Patient name and prescription text are required')
      return
    }
    if (form.prescription_text.trim().length < 3) {
      toast.error('Prescription text must be at least 3 characters')
      return
    }
    setCreating(true)
    try {
      const payload = {
        ...form,
        extra_data: image ? { image } : null,
      }
      const res = await prescriptionService.create(payload)
      const created = res.data
      toast.success('Prescription created')
      setForm({ patient_name: '', doctor_name: '', prescription_text: '' })
      setImage(null)
      setViewId(String(created.id))
      setPrescription(created)
    } catch (err) {
      toast.error(err.response?.data?.error?.message ?? err.response?.data?.detail ?? 'Failed to create prescription')
    } finally {
      setCreating(false)
    }
  }

  const handleView = async (e) => {
    e.preventDefault()
    const id = viewId.trim()
    if (!id) {
      toast.error('Enter prescription ID')
      return
    }
    setLoadingView(true)
    setPrescription(null)
    try {
      const res = await prescriptionService.getOne(id)
      setPrescription(res.data)
    } catch (err) {
      if (err.response?.status === 404) {
        toast.error('Prescription not found')
      } else {
        toast.error(err.response?.data?.error?.message ?? 'Failed to load prescription')
      }
      setPrescription(null)
    } finally {
      setLoadingView(false)
    }
  }

  return (
    <div className="p-6 space-y-8 max-w-2xl">
      <section>
        <div className="flex items-center gap-2 mb-4">
          <FileText size={18} className="text-mint-600" />
          <h2 className="font-display font-semibold text-gray-900">Create Prescription</h2>
        </div>
        <form onSubmit={handleCreate} className="space-y-4 p-4 bg-mint-50 border border-mint-100 rounded-xl">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Patient name *</label>
            <input
              type="text"
              value={form.patient_name}
              onChange={(e) => setForm((f) => ({ ...f, patient_name: e.target.value }))}
              placeholder="Patient full name"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              required
              minLength={2}
              maxLength={120}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Doctor name (optional)</label>
            <input
              type="text"
              value={form.doctor_name}
              onChange={(e) => setForm((f) => ({ ...f, doctor_name: e.target.value }))}
              placeholder="Dr. Name"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              maxLength={120}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Prescription image (optional)</label>
            <p className="text-xs text-gray-500 mb-2">Upload from gallery or take a photo with camera</p>
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
                Upload from gallery
              </button>
              <button
                type="button"
                onClick={triggerCamera}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg transition-colors"
              >
                <Camera size={16} />
                Take photo
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
            <label className="block text-xs font-medium text-gray-600 mb-1">Prescription text *</label>
            <textarea
              value={form.prescription_text}
              onChange={(e) => setForm((f) => ({ ...f, prescription_text: e.target.value }))}
              placeholder="Medicines, dosage, instructions..."
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
            {creating ? 'Creating…' : 'Create'}
          </button>
        </form>
      </section>

      <section>
        <div className="flex items-center gap-2 mb-4">
          <Search size={18} className="text-mint-600" />
          <h2 className="font-display font-semibold text-gray-900">View Prescription</h2>
        </div>
        <form onSubmit={handleView} className="flex gap-2">
          <input
            type="text"
            value={viewId}
            onChange={(e) => setViewId(e.target.value)}
            placeholder="Enter prescription ID"
            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
          />
          <button
            type="submit"
            disabled={loadingView}
            className="px-4 py-2 bg-mint-500 hover:bg-mint-600 disabled:opacity-60 text-white text-sm font-medium rounded-lg"
          >
            {loadingView ? 'Loading…' : 'View'}
          </button>
        </form>

        {loadingView && (
          <div className="py-8">
            <Loader center />
          </div>
        )}
        {prescription && !loadingView && (
          <div className="mt-4 p-4 bg-white border border-gray-100 rounded-xl shadow-soft">
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="text-xs font-medium text-gray-500">ID: {prescription.id}</span>
              <span className="text-xs text-gray-400">
                {new Date(prescription.created_at).toLocaleString()}
              </span>
            </div>
            <p className="text-sm font-medium text-gray-900">Patient: {prescription.patient_name}</p>
            {prescription.doctor_name && (
              <p className="text-sm text-gray-600 mt-1">Doctor: {prescription.doctor_name}</p>
            )}
            {prescription.extra_data?.image && (
              <div className="mt-3">
                <p className="text-xs font-medium text-gray-600 mb-1">Prescription image</p>
                <img
                  src={prescription.extra_data.image}
                  alt="Prescription"
                  className="max-h-64 rounded-lg border border-gray-200 object-contain"
                />
              </div>
            )}
            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-800 whitespace-pre-wrap">{prescription.prescription_text}</p>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
