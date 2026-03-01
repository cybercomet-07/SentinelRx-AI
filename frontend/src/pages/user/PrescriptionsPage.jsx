import { useState, useRef } from 'react'
import { prescriptionService } from '../../services/prescriptionService'
import { FileText, Plus, Upload, Camera, X, Stethoscope } from 'lucide-react'
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
  const [form, setForm] = useState({
    patient_name: '',
    doctor_name: '',
    prescription_text: '',
  })
  const [image, setImage] = useState(null)
  const [creating, setCreating] = useState(false)
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
    } catch (err) {
      toast.error(err.response?.data?.error?.message ?? err.response?.data?.detail ?? 'Failed to create prescription')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="h-full flex flex-col lg:flex-row overflow-hidden">
      {/* Left: Create Prescription */}
      <div className="flex-1 min-h-0 overflow-y-auto p-6 lg:border-r lg:border-gray-200 lg:max-w-md">
        <div className="space-y-8 max-w-2xl mx-auto">
      <section className="card-lift bg-white border border-gray-100 rounded-2xl p-6 shadow-soft">
        <div className="flex items-center gap-2 mb-4">
          <FileText size={18} className="text-mint-600" />
          <h2 className="font-display font-semibold text-gray-900">Create Prescription</h2>
        </div>
        <form onSubmit={handleCreate} className="space-y-4">
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
        </div>
      </div>

      {/* Right: Symptom Recommendation (No Prescription) */}
      <div className="flex-1 min-h-[400px] lg:min-h-0 flex flex-col border-t lg:border-t-0 lg:border-l border-gray-200 bg-white">
        <div className="shrink-0 flex items-center gap-2 px-4 py-2 border-b border-gray-200 bg-slate-50">
          <Stethoscope size={18} className="text-teal-600" strokeWidth={2} />
          <span className="font-semibold text-slate-800">Symptom Suggestions (No Prescription)</span>
        </div>
        <div className="flex-1 min-h-0 overflow-hidden">
          <SymptomRecommendChat />
        </div>
      </div>
    </div>
  )
}
